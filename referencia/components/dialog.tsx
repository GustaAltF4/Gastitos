import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog"

import { CirclePlus,Save } from "lucide-react"

export function DialogM({ onGastoGuardado }: { onGastoGuardado: () => void }) {
  const [monto, setMonto] = useState(0)
  const [tipoGasto, setTipoGasto] = useState("")
  const [tipoPlata, setTipoPlata] = useState("")
  const [dias, setDias] = useState(1) // 👈 cantidad de días (por defecto 1)
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!monto || !tipoGasto || !tipoPlata) {
      alert("Completa todos los campos")
      return
    }

    // Calcular monto total (multiplica por días solo si es estadía)
    const montoFinal = tipoGasto === "Estadía" ? monto * dias : monto

    // Obtener gastos existentes
    const gastos = JSON.parse(localStorage.getItem("gastos") || "[]")

    // Calcular nuevo total
    let totalRestante = 0
    if (tipoPlata === "Plata Argentina") {
      const actual = parseFloat(localStorage.getItem("plataArgentina") || "0")
      totalRestante = actual - montoFinal
      localStorage.setItem("plataArgentina", totalRestante.toString())
    } else if (tipoPlata === "Plata Chilena") {
      const actual = parseFloat(localStorage.getItem("plataChilena") || "0")
      totalRestante = actual - montoFinal
      localStorage.setItem("plataChilena", totalRestante.toString())
    }

    // Guardar el gasto
    const nuevoGasto = {
      fecha: new Date().toLocaleDateString(),
      tipoGasto,
      monto: montoFinal,
      tipoPlata,
      dias: tipoGasto === "Estadía" ? dias : undefined, // 👈 solo guarda si aplica
      totalRestante,
    }

    gastos.push(nuevoGasto)
    localStorage.setItem("gastos", JSON.stringify(gastos))

    onGastoGuardado()
    setMonto(0)
    setTipoGasto("")
    setTipoPlata("")
    setDias(1)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      
      <DialogTrigger asChild>
        <Button  className="p-8 mt-6 text-4xl bg-indigo-600 text-white rounded-xl flex items-center w-full">
           <CirclePlus style={{ width: "5vh", height: "5vh" }} className="mr-2 " />
           Agregar Gasto
        </Button>
      </DialogTrigger>
      <DialogTitle className="hidden">Agregar Gasto</DialogTitle>
      <DialogDescription className="hidden"></DialogDescription>
      <DialogContent className="sm:max-w-[425px] bg-zinc-800">
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Monto */}
          <div className="grid gap-3">
            <Label className="text-2xl text-zinc-400">¿Cuánto gastaste?</Label>
            <Input
              className="!text-2xl rounded-none"
              type="number"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
            />
          </div>

          {/* Tipo de gasto */}
          <div className="grid gap-3">
            <Label className="text-2xl text-zinc-400">¿En qué lo gastaste?</Label>
            <Select
              onValueChange={(value) => {
                setTipoGasto(value)
                if (value !== "Estadía") setDias(1) // resetea si no es estadía
              }}
            >
              <SelectTrigger className="w-full text-2xl rounded-none ">
                <SelectValue placeholder="Tipo de gasto" />
              </SelectTrigger>
              <SelectContent className="rounded-none bg-zinc-800">
                <SelectGroup>
                  <SelectItem value="Peaje" className="text-2xl rounded-none">
                    Peaje
                  </SelectItem>
                  <SelectItem value="Fitosanitario" className="text-2xl rounded-none">
                    Fitosanitario
                  </SelectItem>
                  <SelectItem value="Playa" className="text-2xl rounded-none">
                    Playa
                  </SelectItem>
                  <SelectItem value="Pago de aduana" className="text-2xl rounded-none">
                    Pago de aduana
                  </SelectItem>
                  <SelectItem value="Combustible" className="text-2xl rounded-none">
                    Combustible
                  </SelectItem>
                  <SelectItem value="Gastos de repuestos" className="text-2xl rounded-none">
                    Gastos de repuestos
                  </SelectItem>
                  <SelectItem value="Gastos del camión" className="text-2xl rounded-none">
                    Gastos del camión
                  </SelectItem>
                  <SelectItem value="Estadía" className="text-2xl rounded-none">
                    Estadía
                  </SelectItem>
                  <SelectItem value="Comida" className="text-2xl rounded-none">
                    Comida
                  </SelectItem>
                  <SelectItem value="Otro" className="text-2xl rounded-none">
                    Otro
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Solo aparece si es estadía */}
          {tipoGasto === "Estadía" && (
            <div className="grid gap-3">
              <Label className="text-2xl text-zinc-400">¿Cuántos días?</Label>
              <Input
                className="!text-2xl rounded-none"
                type="number"
                min={1}
                value={dias}
                onChange={(e) => setDias(Number(e.target.value))}
              />
            </div>
          )}

          {/* Tipo de plata */}
          <div className="grid gap-3">
            <Label className="text-2xl text-zinc-400">¿Con qué dinero?</Label>
            <Select onValueChange={setTipoPlata}>
              <SelectTrigger className="w-full text-2xl rounded-none">
                <SelectValue placeholder="Selecciona la moneda" />
              </SelectTrigger>
              <SelectContent className="rounded-none bg-zinc-800">
                <SelectGroup>
                  <SelectItem value="Plata Argentina" className="text-2xl rounded-none">
                    Plata Argentina
                  </SelectItem>
                  <SelectItem value="Plata Chilena" className="text-2xl rounded-none">
                    Plata Chilena
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-2 mt-4  ">
            <Button className="text-2xl h-12 bg-indigo-600 text-white rounded-none" type="submit">
              <Save style={{ width: "5vh", height: "5vh" }} className=""/>
              Guardar
            </Button>
            <Button
              className="text-2xl h-12 rounded-none"
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
