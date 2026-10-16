import { jsPDF } from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { GastoViaje } from './tripStorage'

function formatNum(n: number): string {
  return Number.isFinite(n)
    ? n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '0'
}

export interface TripPdfData {
  nombre?: string
  destino: string
  plataArgentinaInicial: number
  plataChilenaInicial: number
  plataArgentina?: number
  plataChilena?: number
  plataArgentinaFinal?: number
  plataChilenaFinal?: number
  totalGastadoArs?: number
  totalGastadoClp?: number
  totalIngresosArs?: number
  totalIngresosClp?: number
  gastos: GastoViaje[]
  fechaInicio?: string
  fechaFin?: string
}

export async function exportTripPDF(data: TripPdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const {
    plataChilenaInicial = 0,
    plataArgentinaInicial = 0,
    gastos = [],
    nombre,
    destino,
  } = data

  const finalArs =
    data.plataArgentina !== undefined
      ? data.plataArgentina
      : data.plataArgentinaFinal !== undefined
      ? data.plataArgentinaFinal
      : plataArgentinaInicial
  const finalClp =
    data.plataChilena !== undefined
      ? data.plataChilena
      : data.plataChilenaFinal !== undefined
      ? data.plataChilenaFinal
      : plataChilenaInicial

  const destinoLimpio = destino?.trim() || 'Viaje'
  const choferLimpio = nombre?.trim() || 'Sin especificar'

  // Calcular totales de gastos y de ingresos recibidos durante el viaje
  let totalGastadoArs = 0
  let totalGastadoClp = 0
  let totalIngresosArs = 0
  let totalIngresosClp = 0

  gastos.forEach((g) => {
    const monto = Number(g.monto) || 0
    if (g.esIngreso) {
      if (g.tipoPlata === 'Plata Argentina') totalIngresosArs += monto
      else totalIngresosClp += monto
    } else {
      if (g.tipoPlata === 'Plata Argentina') totalGastadoArs += monto
      else totalGastadoClp += monto
    }
  })

  // Si data ya traía valores calculados y no hay gastos en array, preservamos
  if (data.totalGastadoArs && totalGastadoArs === 0) totalGastadoArs = data.totalGastadoArs
  if (data.totalGastadoClp && totalGastadoClp === 0) totalGastadoClp = data.totalGastadoClp
  if (data.totalIngresosArs && totalIngresosArs === 0) totalIngresosArs = data.totalIngresosArs
  if (data.totalIngresosClp && totalIngresosClp === 0) totalIngresosClp = data.totalIngresosClp

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  let currentY = 16

  // Cabecera sutil de página para hojas subsiguientes
  const drawPageHeader = () => {
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Control de Gastos • Chofer: ${choferLimpio} • Destino: ${destinoLimpio}`,
      margin,
      10
    )
    doc.setDrawColor(228, 228, 231)
    doc.line(margin, 12, pageWidth - margin, 12)
  }

  // Encabezado de columnas de la tabla de gastos
  const drawTableHeader = () => {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setFillColor(244, 244, 245) // Zinc 100
    doc.rect(margin, currentY, contentWidth, 7, 'F')
    doc.setDrawColor(228, 228, 231)
    doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7)

    doc.setTextColor(82, 82, 91)
    doc.text('Fecha', margin + 3, currentY + 4.8)
    doc.text('Concepto / Rubro / Detalle', margin + 26, currentY + 4.8)
    doc.text('Moneda', margin + 98, currentY + 4.8)
    doc.text('Monto Movimiento', margin + 145, currentY + 4.8, { align: 'right' })
    doc.text('Saldo Restante', margin + contentWidth - 3, currentY + 4.8, { align: 'right' })
    currentY += 8
  }

  // Comprobar espacio antes de dibujar cada fila para nunca cortar información
  const checkNewPage = (neededSpace: number, isTable: boolean = false) => {
    if (currentY + neededSpace > pageHeight - 16) {
      doc.addPage()
      currentY = 16
      drawPageHeader()
      if (isTable) {
        drawTableHeader()
      }
    }
  }

  // ==========================================
  // 1. BANNER PRINCIPAL SUPERIOR (Zinc 900 oscuro)
  // ==========================================
  doc.setFillColor(24, 24, 27)
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('RESUMEN DE GASTOS DEL VIAJE', margin + 6, currentY + 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(212, 212, 216)
  doc.text(`Destino: ${destinoLimpio}   |   Chofer: ${choferLimpio}`, margin + 6, currentY + 18)

  const todayStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  doc.setFontSize(8)
  doc.setTextColor(161, 161, 170)
  doc.text(`Emisión: ${todayStr}`, pageWidth - margin - 6, currentY + 10, { align: 'right' })

  const fechasArray = [
    data.fechaInicio ? `Inicio: ${data.fechaInicio}` : '',
    data.fechaFin ? `Fin: ${data.fechaFin}` : '',
  ].filter(Boolean)
  if (fechasArray.length > 0) {
    doc.text(fechasArray.join('  •  '), pageWidth - margin - 6, currentY + 18, { align: 'right' })
  }

  currentY += 32

  // ==========================================
  // 2. TARJETAS DE SALDOS RESUMEN: ARS Y CLP
  // ==========================================
  const cardWidth = (contentWidth - 6) / 2
  const hasIngresos = totalIngresosArs > 0 || totalIngresosClp > 0
  const cardHeight = hasIngresos ? 33 : 28

  // Tarjeta 1: Pesos Argentinos (ARS)
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2.5, 2.5, 'FD')

  // Pastilla título ARS (Azul/Celeste)
  doc.setFillColor(224, 242, 254)
  doc.setDrawColor(186, 230, 253)
  doc.roundedRect(margin + 4, currentY + 3.5, 48, 5.5, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(3, 105, 161)
  doc.text('ARGENTINA (ARS)', margin + 6, currentY + 7.4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Plata Inicial: $${formatNum(plataArgentinaInicial)}`, margin + 4, currentY + 13.5)

  if (totalIngresosArs > 0) {
    doc.text('Plata Recibida: ', margin + 4, currentY + 18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(21, 128, 61)
    doc.text(`+$${formatNum(totalIngresosArs)}`, margin + 25, currentY + 18)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('Total Gastado: ', margin + 4, currentY + 22.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(225, 29, 72)
    doc.text(`-$${formatNum(totalGastadoArs)}`, margin + 25, currentY + 22.5)
  } else {
    doc.text('Total Gastado: ', margin + 4, currentY + 18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(225, 29, 72)
    doc.text(`-$${formatNum(totalGastadoArs)}`, margin + 24, currentY + 18)
  }

  // Saldo Restante ARS
  const isArsPositive = finalArs >= 0
  const pillArsY = currentY + (hasIngresos ? 25.5 : 20.5)
  doc.setFillColor(isArsPositive ? 236 : 254, isArsPositive ? 253 : 242, isArsPositive ? 245 : 242)
  doc.setDrawColor(isArsPositive ? 167 : 254, isArsPositive ? 243 : 202, isArsPositive ? 208 : 202)
  doc.roundedRect(margin + 4, pillArsY, cardWidth - 8, 5.5, 1.5, 1.5, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(isArsPositive ? 21 : 153, isArsPositive ? 128 : 27, isArsPositive ? 61 : 27)
  doc.setFont('helvetica', 'bold')
  doc.text(`Saldo Restante: $${formatNum(finalArs)}`, margin + 6, pillArsY + 3.8)

  // Tarjeta 2: Pesos Chilenos (CLP)
  const clpX = margin + cardWidth + 6
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(clpX, currentY, cardWidth, cardHeight, 2.5, 2.5, 'FD')

  // Pastilla título CLP (Rojo suave)
  doc.setFillColor(254, 226, 226)
  doc.setDrawColor(254, 202, 202)
  doc.roundedRect(clpX + 4, currentY + 3.5, 42, 5.5, 1.5, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(185, 28, 28)
  doc.text('CHILE (CLP)', clpX + 6, currentY + 7.4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Plata Inicial: $${formatNum(plataChilenaInicial)}`, clpX + 4, currentY + 13.5)

  if (totalIngresosClp > 0) {
    doc.text('Plata Recibida: ', clpX + 4, currentY + 18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(21, 128, 61)
    doc.text(`+$${formatNum(totalIngresosClp)}`, clpX + 25, currentY + 18)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('Total Gastado: ', clpX + 4, currentY + 22.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(225, 29, 72)
    doc.text(`-$${formatNum(totalGastadoClp)}`, clpX + 25, currentY + 22.5)
  } else {
    doc.text('Total Gastado: ', clpX + 4, currentY + 18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(225, 29, 72)
    doc.text(`-$${formatNum(totalGastadoClp)}`, clpX + 24, currentY + 18)
  }

  // Saldo Restante CLP
  const isClpPositive = finalClp >= 0
  const pillClpY = currentY + (hasIngresos ? 25.5 : 20.5)
  doc.setFillColor(isClpPositive ? 236 : 254, isClpPositive ? 253 : 242, isClpPositive ? 245 : 242)
  doc.setDrawColor(isClpPositive ? 167 : 254, isClpPositive ? 243 : 202, isClpPositive ? 208 : 202)
  doc.roundedRect(clpX + 4, pillClpY, cardWidth - 8, 5.5, 1.5, 1.5, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(isClpPositive ? 21 : 153, isClpPositive ? 128 : 27, isClpPositive ? 61 : 27)
  doc.setFont('helvetica', 'bold')
  doc.text(`Saldo Restante: $${formatNum(finalClp)}`, clpX + 6, pillClpY + 3.8)

  currentY += cardHeight + 8

  // ==========================================
  // 3. TABLA CRONOLÓGICA DE MOVIMIENTOS
  // ==========================================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(24, 24, 27)
  doc.text(`Detalle de Movimientos y Gastos (${gastos.length})`, margin, currentY)
  currentY += 5

  if (gastos.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(113, 113, 122)
    doc.text('No se registraron movimientos en este viaje.', margin, currentY + 5)
    currentY += 12
  } else {
    drawTableHeader()

    // Orden cronológico (primer gasto/ingreso al último)
    const listaCronologica = [...gastos].reverse()

    listaCronologica.forEach((g, index) => {
      const dias = g.dias || 1
      const montoTotal = Number(g.monto) || 0
      const isMultiDia = !g.esIngreso && (g.tipoGasto === 'Estadía' || dias > 1)
      const rowHeight = isMultiDia ? 11 : 7

      checkNewPage(rowHeight, true)

      // Fondo alternado o fondo suave verde si es un ingreso recibido
      if (g.esIngreso) {
        doc.setFillColor(240, 253, 244) // Green 50 suave para destacar el ingreso recibido
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F')
      } else if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F')
      }

      // Fecha e índice
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(82, 82, 91)
      doc.text(`${index + 1}. ${g.fecha}`, margin + 3, currentY + 4.8)

      // Rubro / Concepto
      doc.setFont('helvetica', 'bold')
      if (g.esIngreso) {
        doc.setTextColor(21, 128, 61) // Emerald 700
      } else {
        doc.setTextColor(24, 24, 27)
      }

      const rubroText = g.esIngreso ? `[+] ${g.tipoGasto || 'Carga de plata'}` : g.tipoGasto.slice(0, 22)
      doc.text(rubroText, margin + 26, currentY + 4.8)

      // Descripción / Nota
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(113, 113, 122)
      if (g.descripcion) {
        const descText =
          g.descripcion.length > 28 ? `${g.descripcion.slice(0, 26)}...` : g.descripcion
        const offsetRubro = doc.getTextWidth(rubroText) + 2
        doc.text(`(${descText})`, margin + 26 + offsetRubro, currentY + 4.8)
      }

      // Desglose de estadía o días
      if (isMultiDia) {
        const montoPorDia = dias > 1 ? montoTotal / dias : montoTotal
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text(
          `-> Estadía por ${dias} día${dias > 1 ? 's' : ''} a $${formatNum(montoPorDia)} por día`,
          margin + 28,
          currentY + 9
        )
      }

      // Moneda (ARS / CLP)
      const isArs = g.tipoPlata === 'Plata Argentina'
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(isArs ? 3 : 185, isArs ? 105 : 28, isArs ? 161 : 28)
      doc.text(isArs ? 'ARS' : 'CLP', margin + 98, currentY + 4.8)

      // Monto (Verde si es ingreso recibido, Rojo si es gasto)
      doc.setFont('helvetica', 'bold')
      if (g.esIngreso) {
        doc.setTextColor(21, 128, 61)
        doc.text(`+$${formatNum(montoTotal)}`, margin + 145, currentY + 4.8, { align: 'right' })
      } else {
        doc.setTextColor(225, 29, 72)
        doc.text(`-$${formatNum(montoTotal)}`, margin + 145, currentY + 4.8, { align: 'right' })
      }

      // Saldo Restante en ese momento
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text(`$${formatNum(g.totalRestante)}`, margin + contentWidth - 3, currentY + 4.8, {
        align: 'right',
      })

      // Línea divisoria
      doc.setDrawColor(242, 242, 245)
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight)

      currentY += rowHeight
    })
  }

  // ==========================================
  // 4. BLOQUE DE RESUMEN FINAL
  // ==========================================
  checkNewPage(24)
  currentY += 4
  doc.setFillColor(244, 244, 245)
  doc.setDrawColor(212, 212, 216)
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(24, 24, 27)
  doc.text('BALANCE GENERAL DEL VIAJE:', margin + 4, currentY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)

  const detalleArs = `ARS: Inicial $${formatNum(plataArgentinaInicial)}${
    totalIngresosArs > 0 ? ` + Recibido $${formatNum(totalIngresosArs)}` : ''
  } - Gastos $${formatNum(totalGastadoArs)} = Restante $${formatNum(finalArs)}`

  const detalleClp = `CLP: Inicial $${formatNum(plataChilenaInicial)}${
    totalIngresosClp > 0 ? ` + Recibido $${formatNum(totalIngresosClp)}` : ''
  } - Gastos $${formatNum(totalGastadoClp)} = Restante $${formatNum(finalClp)}`

  doc.text(detalleArs, margin + 4, currentY + 11)
  doc.text(detalleClp, margin + 4, currentY + 15)

  // ==========================================
  // 5. PIE DE PÁGINA NUMERADO EN TODAS LAS HOJAS
  // ==========================================
  const totalPages = (
    doc as unknown as { internal: { getNumberOfPages: () => number } }
  ).internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Control de Gastos de Camión • Chofer: ${choferLimpio} • Destino: ${destinoLimpio} • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  // ==========================================
  // 6. GUARDAR O COMPARTIR (Capacitor APK y Navegador)
  // ==========================================
  const dateStr = new Date().toISOString().split('T')[0]
  const cleanDestinoFile = destinoLimpio.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  const fileName = `gastos_viaje_${cleanDestinoFile}_${dateStr}.pdf`

  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output('datauristring')
      const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri

      // 1. Guardar en Cache interna de la app (100% compatible con Android 10, 11, 12, 13, 14, 15+)
      const savedCacheFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      })

      // 2. Intentar guardar en Documents por conveniencia si el dispositivo lo permite
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        })
      } catch {
        // Ignorar silenciosamente si Android restringe Documents
      }

      // 3. Abrir menú nativo para compartir por WhatsApp, Drive, abrir con visor PDF, etc.
      await Share.share({
        title: `Resumen de gastos - ${destinoLimpio}`,
        url: savedCacheFile.uri,
        dialogTitle: 'Guardar o enviar PDF del viaje',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.toLowerCase().includes('cancel')) {
        console.error('Error al exportar PDF en APK:', err)
        doc.save(fileName)
      }
    }
  } else {
    // En Navegador Web
    doc.save(fileName)
  }
}
