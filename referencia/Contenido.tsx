import { ThemeProvider } from "@/components/theme-provider"
import { Menu } from "./components/menu"
import { Input } from "./components/ui/input"
import { useState } from "react"
import { Button } from "./components/ui/button"
import { DialogM } from "./components/dialog"
import { useEffect } from "react"
import { ExportPDF } from "./components/ExportPDF"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Truck, RotateCw, Newspaper, Save } from "lucide-react"
import { Separator } from "./components/ui/separator"
export function Contenido() {
  const [plataChilena, setPlataChilena] = useState(0)
  const [plataArgentina, setPlataArgentina] = useState(0)
  const [gastos, setGastos] = useState<any[]>([])
  const [guardado, setGuardado] = useState(false)
  const [name, setName] = useState(localStorage.getItem("nombre") || "")
  const [destino, setDestino] = useState(localStorage.getItem("destino") || "")


  useEffect(() => {
    const ch = localStorage.getItem("plataChilena")
    const ar = localStorage.getItem("plataArgentina")
    if (ch && ar) {
      setPlataChilena(parseFloat(ch))
      setPlataArgentina(parseFloat(ar))
      setGuardado(true)
    }

    const gs = JSON.parse(localStorage.getItem("gastos") || "[]")
    setGastos(gs)
  }, [])


  const guardar = () => {
    localStorage.setItem("plataChilena", plataChilena.toString())
    localStorage.setItem("plataArgentina", plataArgentina.toString())
    localStorage.setItem("nombre", name)
    localStorage.setItem("destino", destino)
    setGuardado(true)
    if (!localStorage.getItem("plataArgentinaInicial"))
      localStorage.setItem("plataArgentinaInicial", plataArgentina.toString())

    if (!localStorage.getItem("plataChilenaInicial"))
      localStorage.setItem("plataChilenaInicial", plataChilena.toString())
  }

  const reset = () => {
    const confirmado = window.confirm("¿Estás seguro que querés reiniciar todo? Esto borrará la plata y los gastos.")
    if (!confirmado) return

    localStorage.clear()
    setPlataChilena(0)
    setPlataArgentina(0)
    setName("")
    setDestino("")
    setGastos([])
    setGuardado(false)
  }

  const eliminarGasto = (index: number) => {
    const gastosActuales = JSON.parse(localStorage.getItem("gastos") || "[]")
    const gasto = gastosActuales[index]

    // restaurar dinero según corresponde
    if (gasto.tipoPlata === "Plata Argentina") {
      const actual = parseFloat(localStorage.getItem("plataArgentina") || "0")
      const nuevoTotal = actual + gasto.monto
      localStorage.setItem("plataArgentina", nuevoTotal.toString())
      setPlataArgentina(nuevoTotal)  // <-- refresca pantalla
    }

    if (gasto.tipoPlata === "Plata Chilena") {
      const actual = parseFloat(localStorage.getItem("plataChilena") || "0")
      const nuevoTotal = actual + gasto.monto
      localStorage.setItem("plataChilena", nuevoTotal.toString())
      setPlataChilena(nuevoTotal)  // <-- refresca pantalla
    }

    // quitar el gasto del array
    const nuevosGastos = gastosActuales.filter((_: any, i: number) => i !== index)

    // guardar y refrescar
    localStorage.setItem("gastos", JSON.stringify(nuevosGastos))
    setGastos(nuevosGastos)  // <-- refresca la tabla inmediatamente
  }


  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Menu />
      <div className="flex justify-center items-center flex-col p-4 gap-2  text-center">


        <h1 className="text-5xl font-bold ">Plata para el viaje </h1>
        <Truck style={{ width: "8vh", height: "8vh" }} />
        <div className="w-full max-w-md bg-neutral-200 dark:bg-neutral-800 p-6 rounded-xl shadow-md flex flex-col gap-6">
          {/* ARS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/ars_1.png"          // tu icono
                className="w-10 h-10 rounded-md"
              />
              <span className="text-xl text-black dark:text-white font-semibold">ARS:</span>
            </div>
            <span className={`text-2xl font-bold ${plataArgentina < 0 ? "text-red-500" : "text-green-500"}`}>
              ${plataArgentina}
            </span>
          </div>

          <Separator />
          {/* CLP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/clp_1.png"          // tu icono
                className="w-10 h-10 rounded-md"
              />
              <span className="text-xl text-black dark:text-white font-semibold">CLP:</span>
            </div>
            <span className={`text-2xl font-bold ${plataChilena < 0 ? "text-red-500" : "text-green-500"}`}>
              ${plataChilena}
            </span>
          </div>


        </div>

        {!guardado && (
          <>
            <div className="w-full text-left">
              <p className="text-md text-gray-300 text-center leading-snug ">
                Ingresa la plata con la que arrancás el viaje en pesos chilenos y argentinos
              </p>

              {/* Argentina */}
              <div className="w-full flex flex-col mt-4">
                <span className="text-lg text-gray-300 font-semibold mb-1">Argentina</span>
                <Input
                  type="number"
                  className="w-full h-12 text-2xl bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3"
                  value={plataArgentina}
                  onChange={(e) => setPlataArgentina(Number(e.target.value))}
                />
              </div>

              {/* Chilena */}
              <div className="w-full flex flex-col mt-2">
                <span className="text-lg text-gray-300 font-semibold mb-1">Chilena</span>
                <Input
                  type="number"
                  className="w-full h-12 text-2xl bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3"
                  value={plataChilena}
                  onChange={(e) => setPlataChilena(Number(e.target.value))}
                />
              </div>


            </div>
            <p className="text-md text-gray-300 text-center leading-snug mt-4">
              Ahora ingresa Nombre del chofer y destino del viaje para poder agregarlo al resumen final del viaje
            </p>

            {/* Nombre */}
            <Input
              type="text"
              className="w-full h-12 text-2xl bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3 mt-4"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Destino */}
            <Input
              type="text"
              className="w-full h-12 text-2xl bg-neutral-700 text-white border border-neutral-600 rounded-lg px-3"
              placeholder="Destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            />

            <Button
              onClick={guardar}
              className="w-full mt-6 py-6 text-2xl bg-indigo-600 hover:bg-indigo-700 text-white rounded-l flex items-center justify-center gap-2"
            >
              <Save style={{ width: "5vh", height: "5vh" }} className="" />
              Guardar
            </Button>

          </>
        )}


        {guardado && (
          <>
            <DialogM onGastoGuardado={() => window.location.reload()} />
            <Button variant={"outline"} onClick={reset} className="pt-7 pb-7 mt-3 rounded-xl text-4xl w-full">
              <RotateCw style={{ width: "4vh", height: "4vh" }} className="mr-2 " />
              Reiniciar </Button>

            <Separator className="my-4" />
            <div className=" text-left  w-full max-w-4xl ">
              <div className="flex items-center justify-between mb-6 w-full">
                <h2 className=" font-semibold text-dark dark:text-white flex items-center mb-4 ">
                  <Newspaper className="inline mb-1 mr-2 " />
                  Gastos registrados</h2>
                <ExportPDF />
              </div>


              {gastos.length === 0 ? (
                <p className="text-center text-2xl text-red-500">No hay gastos todavía.</p>
              ) : (

                <Table className="w-full rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-900 
                  border border-gray-700 dark:border-gray-700">
                  <TableHeader>
                    <TableRow className="bg-gray-300 dark:bg-gray-900 rounded-lg ">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo de Gasto</TableHead>
                      <TableHead >Monto</TableHead>
                      <TableHead>Tipo plata</TableHead>
                      <TableHead>Acciones</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-gray-300 dark:bg-gray-900 rounded-lg ">
                    {gastos.map((g, i) => (
                      <TableRow key={i}>
                        <TableCell>{g.fecha}</TableCell>
                        <TableCell className="font-bold">
                          {g.tipoGasto}
                          {g.dias && (
                            <div className="text-sm text-gray-400">
                              {g.dias} día{g.dias > 1 ? "s" : ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>$ {g.monto}</TableCell>
                        <TableCell>{g.tipoPlata}</TableCell>
                        <TableCell>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const confirmado = window.confirm("¿Estás seguro que querés eliminar este gasto?")
                              if (!confirmado) return

                              eliminarGasto(i)

                            }}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                </Table>

              )}
            </div>

            



          </>
        )}

      </div>

    </ThemeProvider>

  )
}


