import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"

export function ExportPDF() {
    const generarPDF = () => {
        const doc = new jsPDF()

        const plataInicialChilena = parseFloat(localStorage.getItem("plataChilenaInicial") || "0")
        const plataInicialArgentina = parseFloat(localStorage.getItem("plataArgentinaInicial") || "0")
        const gastos = JSON.parse(localStorage.getItem("gastos") || "[]")
        const name = localStorage.getItem("nombre") || ""
        const destino = localStorage.getItem("destino") || ""

        let totalChilena = parseFloat(localStorage.getItem("plataChilena") || "0")
        let totalArgentina = parseFloat(localStorage.getItem("plataArgentina") || "0")
        gastos.forEach((g: any) => {
            if (g.tipoPlata === "chilena") totalChilena = g.totalRestante
            if (g.tipoPlata === "argentina") totalArgentina = g.totalRestante
        })

        let y = 10
        const lineHeight = 7
        const pageHeight = doc.internal.pageSize.height

        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text(`Resumen de gastos del viaje - ${destino}`, 10, y)
        y += 10

        doc.setFontSize(12)
        doc.text(`Chofer: ${name}`, 10, y)
        y += lineHeight
        doc.text(`Plata inicial Argentina: $${plataInicialArgentina}`, 10, y)
        y += lineHeight
        doc.text(`Plata inicial Chilena: $${plataInicialChilena}`, 10, y)
        y += lineHeight * 2

        doc.setFont("helvetica", "normal")

        if (gastos.length === 0) {
            doc.text("No se registraron gastos.", 10, y)
            y += lineHeight
        } else {
            doc.text("Gastos:", 10, y)
            y += lineHeight

            gastos.forEach((g: any, index: number) => {
                if (y + lineHeight * 3 > pageHeight - 20) {
                    doc.addPage()
                    y = 10
                }
                
                const dias = g.dias || 1
                const montoTotal = parseFloat(g.monto)
                const montoPorDia = dias > 1 ? montoTotal / dias : montoTotal

                // Línea principal
                doc.setFont("helvetica", "normal")
                doc.text(
                    `${index + 1}. ${g.fecha} - ${g.tipoGasto} - $${montoPorDia.toFixed(2)} por día (${g.tipoPlata})`,
                    10,
                    y
                )
                y += 7

                // Mostrar detalle de días y total
                if (dias > 1) {
                    doc.setFont("helvetica", "normal")
                    doc.text(
                        `--> Días: ${dias} → total ${g.tipoGasto}: $${montoTotal.toFixed(2)}`,
                        15,
                        y
                    )
                    y += 7
                }

                doc.text(`Total restante: $${g.totalRestante}`, 15, y)
                y += 7
            })
        }

        y += lineHeight
        doc.setFont("helvetica", "bold")
        doc.text(`Monto restante Argentina: $${totalArgentina}`, 10, y)
        y += lineHeight
        doc.text(`Monto restante Chilena: $${totalChilena}`, 10, y)

        const nombrePDF = prompt(
            "Ingrese el nombre del archivo PDF (conviene poner destino del viaje):",
            `gastos_viaje_${destino}`
        )
        const nombreFinal = nombrePDF?.trim()
            ? `${nombrePDF}.pdf`
            : `gastos_viaje_${destino}.pdf`

        doc.save(nombreFinal)
    }

    return (
        <Button onClick={generarPDF} variant="outline" className="text-xl mb-4 rounded-none ml-6 px-5 py-3 bg-white/5 border border-white/10 text-gray-200  shadow-sm hover:bg-white/10 transition flex items-center gap-2 text-blue-400">
            Exportar PDF
        </Button>
    )
}
