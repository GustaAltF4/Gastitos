import { jsPDF } from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Transaction } from '../types/finance'
import { UserConfig } from './storage'
import { formatCurrency } from '../lib/utils'

export async function generatePdfReport(
  transactions: Transaction[],
  config: UserConfig,
  filterTitle: string = 'Reporte General'
): Promise<void> {
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
  const acc1Name = config.account1Name || 'Vivi'
  const acc2Name = config.account2Name || 'Papá'

  let totalIncome = 0
  let totalExpense = 0
  let acc1Income = 0
  let acc1Expense = 0
  let acc2Income = 0
  let acc2Expense = 0

  transactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount
      if (t.scope === 'business') acc2Income += t.amount
      else acc1Income += t.amount
    } else {
      totalExpense += t.amount
      if (t.scope === 'business') acc2Expense += t.amount
      else acc1Expense += t.amount
    }
  })
  const netBalance = totalIncome - totalExpense
  const acc1Balance = acc1Income - acc1Expense
  const acc2Balance = acc2Income - acc2Expense

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
  doc.text('SALDO ACUMULADO', balX + 4, currentY + 6)
  doc.setFontSize(11)
  if (netBalance >= 0) {
    doc.setTextColor(22, 101, 52)
    doc.text(`+${formatCurrency(netBalance, config.currency)}`, balX + 4, currentY + 14)
  } else {
    doc.setTextColor(153, 27, 27)
    doc.text(formatCurrency(netBalance, config.currency), balX + 4, currentY + 14)
  }

  currentY += 24

  // --- 3.B RESUMEN POR CADA UNA DE LAS 2 CUENTAS ---
  const halfWidth = (contentWidth - 4) / 2
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, currentY, halfWidth, 16, 2, 2, 'FD')
  doc.roundedRect(margin + halfWidth + 4, currentY, halfWidth, 16, 2, 2, 'FD')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`Cuenta 1: ${acc1Name}`, margin + 4, currentY + 5.5)
  doc.text(`Cuenta 2: ${acc2Name}`, margin + halfWidth + 8, currentY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  doc.text(
    `Saldo: ${formatCurrency(acc1Balance, config.currency)} (Ing: +${formatCurrency(acc1Income, config.currency)} | Gas: -${formatCurrency(acc1Expense, config.currency)})`,
    margin + 4,
    currentY + 12
  )
  doc.text(
    `Saldo: ${formatCurrency(acc2Balance, config.currency)} (Ing: +${formatCurrency(acc2Income, config.currency)} | Gas: -${formatCurrency(acc2Expense, config.currency)})`,
    margin + halfWidth + 8,
    currentY + 12
  )

  currentY += 23

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
    doc.text('Cuenta', margin + 24, currentY + 4.5)
    doc.text('Categoría', margin + 56, currentY + 4.5)
    doc.text('Descripción', margin + 90, currentY + 4.5)
    doc.text('Monto', margin + contentWidth - 3, currentY + 4.5, { align: 'right' })
    currentY += 8

    // Filas
    transactions.forEach((tx) => {
      checkNewPage(7)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(82, 82, 91)
      doc.text(tx.date, margin + 3, currentY + 4)

      // Cuenta
      const accLabel = tx.scope === 'business' ? acc2Name : acc1Name
      doc.setTextColor(39, 39, 42)
      doc.text(accLabel.slice(0, 15), margin + 24, currentY + 4)

      // Categoría
      doc.setTextColor(39, 39, 42)
      doc.text(tx.category.slice(0, 16), margin + 56, currentY + 4)

      // Descripción
      const desc = tx.description || '-'
      doc.text(desc.slice(0, 28), margin + 90, currentY + 4)

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

  // Guardar / Compartir archivo (compatible con APK Android nativo y navegador web)
  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `informe_gastos_${dateStr}.pdf`

  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring')
      const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri

      // 1. Escribir en el directorio Cache de la app (no requiere permisos extra en ninguna versión de Android)
      const savedCacheFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      })

      // 2. Intentar guardar también una copia directa en la carpeta Documentos del teléfono
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        })
      } catch {
        // Ignorar silenciosamente si la versión de Android restringe Documents sin permiso adicional
      }

      // 3. Abrir el menú nativo de Android para abrir el PDF, guardarlo en Descargas/Drive o enviarlo por WhatsApp
      await Share.share({
        title: `Informe Financiero (${dateStr})`,
        url: savedCacheFile.uri,
        dialogTitle: 'Guardar o compartir Informe PDF',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Si el usuario simplemente cerró el menú de compartir ("Share canceled"), no mostrar error
      if (!msg.toLowerCase().includes('cancel')) {
        console.error('Error al exportar PDF en APK:', err)
        alert(`No se pudo abrir el menú para compartir el PDF: ${msg}`)
      }
    }
  } else {
    doc.save(fileName)
  }
}
