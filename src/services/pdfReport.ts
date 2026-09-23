import { jsPDF } from 'jspdf'
import { Transaction } from '../types/finance'
import { UserConfig } from './storage'
import { formatCurrency } from '../lib/utils'

export function generatePdfReport(
  transactions: Transaction[],
  config: UserConfig,
  filterTitle: string = 'Reporte General'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  let currentY = 18

  // Helper para verificar salto de página
  const checkNewPage = (neededSpace: number) => {
    if (currentY + neededSpace > pageHeight - 16) {
      doc.addPage()
      currentY = 20
      drawHeader()
    }
  }

  const drawHeader = () => {
    // Encabezado sutil
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(`${config.userName || 'Control de Gastos'} - ${filterTitle}`, margin, 10)
    doc.setDrawColor(230, 230, 230)
    doc.line(margin, 12, pageWidth - margin, 12)
  }

  // --- 1. BANNER PRINCIPAL ---
  doc.setFillColor(24, 24, 27) // Zinc 900 oscuro neutral
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('INFORME FINANCIERO', margin + 6, currentY + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(200, 200, 200)
  doc.text(config.userName || 'Control de Gastos Personales y Negocio', margin + 6, currentY + 19)

  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  const todayStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.text(`Emisión: ${todayStr}`, pageWidth - margin - 6, currentY + 19, { align: 'right' })

  currentY += 34

  // --- 2. CÁLCULO DE TOTALES ---
  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount
    else totalExpense += t.amount
  })
  const netBalance = totalIncome - totalExpense

  // --- 3. TARJETAS DE RESUMEN (KPIs) ---
  const cardWidth = (contentWidth - 8) / 3
  const cardHeight = 20

  // Tarjeta Ingresos
  doc.setFillColor(240, 253, 244) // verde suave
  doc.setDrawColor(187, 247, 208)
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(22, 101, 52)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL INGRESOS', margin + 4, currentY + 6)
  doc.setFontSize(11)
  doc.text(`+${formatCurrency(totalIncome, config.currency)}`, margin + 4, currentY + 14)

  // Tarjeta Gastos (Rojo carmesí oscuro)
  const expX = margin + cardWidth + 4
  doc.setFillColor(254, 242, 242) // rojo suave
  doc.setDrawColor(254, 202, 202)
  doc.roundedRect(expX, currentY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(153, 27, 27) // #991b1b
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL GASTOS', expX + 4, currentY + 6)
  doc.setFontSize(11)
  doc.text(`-${formatCurrency(totalExpense, config.currency)}`, expX + 4, currentY + 14)

  // Tarjeta Balance Neto
  const balX = expX + cardWidth + 4
  doc.setFillColor(244, 244, 245) // zinc suave
  doc.setDrawColor(228, 228, 231)
  doc.roundedRect(balX, currentY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(39, 39, 42)
  doc.setFont('helvetica', 'bold')
  doc.text('BALANCE NETO', balX + 4, currentY + 6)
  doc.setFontSize(11)
  if (netBalance >= 0) {
    doc.setTextColor(22, 101, 52)
    doc.text(`+${formatCurrency(netBalance, config.currency)}`, balX + 4, currentY + 14)
  } else {
    doc.setTextColor(153, 27, 27)
    doc.text(formatCurrency(netBalance, config.currency), balX + 4, currentY + 14)
  }

  currentY += 28

  // --- 4. RESUMEN POR CATEGORÍAS ---
  const expensesByCategory: Record<string, number> = {}
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount
    })

  const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])

  if (sortedCategories.length > 0) {
    checkNewPage(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(24, 24, 27)
    doc.text('Distribución de Gastos por Categoría', margin, currentY)
    currentY += 5

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(244, 244, 245)
    doc.rect(margin, currentY, contentWidth, 6, 'F')
    doc.setTextColor(82, 82, 91)
    doc.text('Categoría', margin + 3, currentY + 4)
    doc.text('% del Total', margin + contentWidth - 45, currentY + 4)
    doc.text('Monto', margin + contentWidth - 3, currentY + 4, { align: 'right' })
    currentY += 7

    doc.setFont('helvetica', 'normal')
    sortedCategories.forEach(([cat, amount]) => {
      checkNewPage(6)
      const percent = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0'
      doc.setTextColor(39, 39, 42)
      doc.text(cat, margin + 3, currentY + 4)
      doc.text(`${percent}%`, margin + contentWidth - 45, currentY + 4)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(153, 27, 27)
      doc.text(formatCurrency(amount, config.currency), margin + contentWidth - 3, currentY + 4, {
        align: 'right',
      })
      doc.setFont('helvetica', 'normal')

      doc.setDrawColor(240, 240, 240)
      doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5)
      currentY += 6
    })

    currentY += 6
  }

  // --- 5. DETALLE DE MOVIMIENTOS ---
  checkNewPage(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(24, 24, 27)
  doc.text(`Listado de Movimientos (${transactions.length})`, margin, currentY)
  currentY += 5

  if (transactions.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(113, 113, 122)
    doc.text('No hay movimientos registrados en este informe.', margin, currentY + 5)
  } else {
    // Encabezado de la tabla de movimientos
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(244, 244, 245)
    doc.rect(margin, currentY, contentWidth, 7, 'F')
    doc.setTextColor(82, 82, 91)
    doc.text('Fecha', margin + 3, currentY + 4.5)
    doc.text('Tipo', margin + 26, currentY + 4.5)
    doc.text('Categoría', margin + 46, currentY + 4.5)
    doc.text('Descripción', margin + 82, currentY + 4.5)
    doc.text('Monto', margin + contentWidth - 3, currentY + 4.5, { align: 'right' })
    currentY += 8

    // Filas
    transactions.forEach((tx) => {
      checkNewPage(7)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(82, 82, 91)
      doc.text(tx.date, margin + 3, currentY + 4)

      // Tipo
      if (tx.type === 'income') {
        doc.setTextColor(22, 101, 52)
        doc.text('Ingreso', margin + 26, currentY + 4)
      } else {
        doc.setTextColor(153, 27, 27)
        doc.text('Egreso', margin + 26, currentY + 4)
      }

      // Categoría
      doc.setTextColor(39, 39, 42)
      doc.text(tx.category.slice(0, 18), margin + 46, currentY + 4)

      // Descripción
      const desc = tx.description || '-'
      doc.text(desc.slice(0, 32), margin + 82, currentY + 4)

      // Monto
      doc.setFont('helvetica', 'bold')
      if (tx.type === 'income') {
        doc.setTextColor(22, 101, 52)
        doc.text(`+${formatCurrency(tx.amount, config.currency)}`, margin + contentWidth - 3, currentY + 4, {
          align: 'right',
        })
      } else {
        doc.setTextColor(153, 27, 27)
        doc.text(`-${formatCurrency(tx.amount, config.currency)}`, margin + contentWidth - 3, currentY + 4, {
          align: 'right',
        })
      }

      doc.setDrawColor(244, 244, 245)
      doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5)
      currentY += 6.5
    })
  }

  // --- PIE DE PÁGINA ---
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Generado por Control de Gastos - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  // Guardar archivo
  const dateStr = new Date().toISOString().split('T')[0]
  doc.save(`informe_gastos_${dateStr}.pdf`)
}
