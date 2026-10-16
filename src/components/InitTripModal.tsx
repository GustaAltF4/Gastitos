import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Truck, Save } from 'lucide-react'

interface InitTripModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInitTrip: (ars: number, clp: number, destino: string) => void
  initialDestino?: string
}

export function InitTripModal({
  open,
  onOpenChange,
  onInitTrip,
  initialDestino = '',
}: InitTripModalProps) {
  const [arsStr, setArsStr] = useState('')
  const [clpStr, setClpStr] = useState('')
  const [destino, setDestino] = useState(initialDestino)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const destinoLimpio = destino.trim()
    if (!destinoLimpio) {
      alert('Por favor ingresa el destino del viaje.')
      return
    }

    const arsNum = parseFloat(arsStr) || 0
    const clpNum = parseFloat(clpStr) || 0

    if (arsNum === 0 && clpNum === 0) {
      const confirmaCero = window.confirm(
        'Ingresaste $0 tanto en pesos argentinos como chilenos. ¿Deseas iniciar el viaje con saldo en cero?'
      )
      if (!confirmaCero) return
    }

    onInitTrip(arsNum, clpNum, destinoLimpio)
    setArsStr('')
    setClpStr('')
    setDestino('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} slideFromBottom={true}>
      <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

      <DialogHeader>
        <DialogTitle className="text-2xl sm:text-3xl font-black flex items-center gap-2.5">
          <Truck className="h-7 w-7 text-primary" />
          Iniciar Nuevo Viaje
        </DialogTitle>
        <DialogDescription className="text-sm sm:text-base font-medium">
          Ingresá la plata con la que arrancás en pesos argentinos y chilenos, y el destino del viaje.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plata Argentina */}
        <div>
          <label className="text-base sm:text-lg font-black text-foreground block mb-2">
            🇦🇷 Plata Inicial Argentina (ARS)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-3xl">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="0"
              value={arsStr}
              onChange={(e) => setArsStr(e.target.value)}
              className="pl-12 !text-3xl sm:!text-4xl font-black h-16 rounded-[var(--radius)]"
              autoFocus
            />
          </div>
        </div>

        {/* Plata Chilena */}
        <div>
          <label className="text-base sm:text-lg font-black text-foreground block mb-2">
            🇨🇱 Plata Inicial Chilena (CLP)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-3xl">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="0"
              value={clpStr}
              onChange={(e) => setClpStr(e.target.value)}
              className="pl-12 !text-3xl sm:!text-4xl font-black h-16 rounded-[var(--radius)]"
            />
          </div>
        </div>

        {/* Destino */}
        <div>
          <label className="text-base sm:text-lg font-black text-foreground block mb-2">
            📍 Destino del Viaje
          </label>
          <Input
            type="text"
            required
            placeholder="Ej: Santiago de Chile / Mendoza / Valparaíso"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="w-full h-16 !text-xl sm:!text-2xl font-black rounded-[var(--radius)] px-4"
          />
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 pt-3">
          <Button
            type="submit"
            className="w-full h-16 text-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-[var(--radius)] flex items-center justify-center gap-3 shadow-lg shadow-primary/25"
          >
            <Save className="h-7 w-7" />
            Guardar e Iniciar Viaje
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-14 text-xl font-bold rounded-[var(--radius)]"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
