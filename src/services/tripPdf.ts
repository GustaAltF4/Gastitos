import { jsPDF } from 'jspdf'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { TripState } from './tripStorage'

function formatNum(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0'
}

export async function exportTripPDF(state: TripState): Promise<void> {
  const doc = new jsPDF()

  const {
    plataChilenaInicial,
    plataArgentinaInicial,
    plataChilena,
    plataArgentina,
    gastos,
    nombre,
    destino,
  } = state

  const destinoLimpio = destino.trim() || 'Viaje'
  const choferLimpio = nombre.trim() || 'Sin especificar'

  let y = 14
  const lineHeight = 7
  const pageHeight = doc.internal.pageSize.height

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`Resumen de gastos del viaje - ${destinoLimpio}`, 10, y)
  y += 10

  doc.setFontSize(12)
  doc.text(`Chofer: ${choferLimpio}`, 10, y)
  y += lineHeight
  doc.text(`Plata inicial Argentina (ARS): $${formatNum(plataArgentinaInicial)}`, 10, y)
  y += lineHeight
  doc.text(`Plata inicial Chilena (CLP): $${formatNum(plataChilenaInicial)}`, 10, y)
  y += lineHeight * 2

  doc.setFont('helvetica', 'normal')

  if (gastos.length === 0) {
    doc.text('No se registraron gastos.', 10, y)
    y += lineHeight
  } else {
    doc.setFont('helvetica', 'bold')
    doc.text('Gastos registrados:', 10, y)
    doc.setFont('helvetica', 'normal')
    y += lineHeight

    gastos.forEach((g, index) => {
      if (y + lineHeight * 4 > pageHeight - 20) {
        doc.addPage()
        y = 14
      }

      const dias = g.dias || 1
      const montoTotal = Number(g.monto) || 0
      const montoPorDia = dias > 1 ? montoTotal / dias : montoTotal

      // Línea principal del gasto
      doc.setFont('helvetica', 'normal')
      if (g.tipoGasto === 'Estadía' || dias > 1) {
        doc.text(
          `${index + 1}. ${g.fecha} - ${g.tipoGasto} - $${formatNum(montoPorDia)} por día (${g.tipoPlata})`,
          10,
          y
        )
      } else {
        doc.text(
          `${index + 1}. ${g.fecha} - ${g.tipoGasto} - $${formatNum(montoTotal)} (${g.tipoPlata})`,
          10,
          y
        )
      }
      y += 7

      // Detalle de días si es mayor a 1
      if (dias > 1) {
        doc.text(
          `--> Días: ${dias} -> total ${g.tipoGasto}: $${formatNum(montoTotal)}`,
          15,
          y
        )
        y += 7
      }

      doc.text(`Total restante (${g.tipoPlata}): $${formatNum(g.totalRestante)}`, 15, y)
      y += 8
    })
  }

  if (y + lineHeight * 3 > pageHeight - 15) {
    doc.addPage()
    y = 14
  }

  y += lineHeight / 2
  doc.setFont('helvetica', 'bold')
  doc.text(`Monto restante Argentina (ARS): $${formatNum(plataArgentina)}`, 10, y)
  y += lineHeight
  doc.text(`Monto restante Chilena (CLP): $${formatNum(plataChilena)}`, 10, y)

  const sugerido = `gastos_viaje_${destinoLimpio.replace(/[^a-zA-Z0-9_-]/g, '_')}`

  if (Capacitor.isNativePlatform()) {
    const fileName = `${sugerido}.pdf`
    try {
      const dataUri = doc.output('datauristring')
      const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri

      const savedCacheFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      })

      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        })
      } catch {
        // Ignorar si Android restringe Documents
      }

      await Share.share({
        title: `Resumen de gastos - ${destinoLimpio}`,
        url: savedCacheFile.uri,
        dialogTitle: 'Guardar o enviar PDF del viaje',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.toLowerCase().includes('cancel')) {
        alert(`No se pudo compartir el PDF: ${msg}`)
      }
    }
  } else {
    const nombrePDF = window.prompt(
      'Ingrese el nombre del archivo PDF (conviene poner destino del viaje):',
      sugerido
    )
    if (nombrePDF === null) return
    const limpio = nombrePDF.trim().replace(/\.pdf$/i, '')
    const nombreFinal = limpio ? `${limpio}.pdf` : `${sugerido}.pdf`
    doc.save(nombreFinal)
  }
}
