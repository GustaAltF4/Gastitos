import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TipoPlata } from '../services/tripStorage'
import { CircleDollarSign, Plus, ArrowDownLeft } from 'lucide-react'

interface CargarPlataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moneda: TipoPlata
  onCargarPlata: (data: { monto: number; tipoPlata: TipoPlata; descripcion: string }) => void
}

function FlagArgentina() {
  return (
    <svg viewBox="0 0 36 24" className="w-8 h-5 rounded shrink-0 border border-black/15 shadow-xs" aria-label="Argentina">
      <rect width="36" height="24" fill="#74ACDF" />
      <rect y="8" width="36" height="8" fill="#FFFFFF" />
      <circle cx="18" cy="12" r="2.6" fill="#F6B40E" stroke="#85340A" strokeWidth="0.4" />
    </svg>
  )
}

function FlagChile() {
  return (
    <svg viewBox="0 0 36 24" className="w-8 h-5 rounded shrink-0 border border-black/15 shadow-xs" aria-label="Chile">
      <rect width="36" height="12" fill="#FFFFFF" />
      <rect y="12" width="36" height="12" fill="#D52B1E" />
      <rect width="12" height="12" fill="#0039A6" />
      <polygon points="6,2.5 7,5.2 9.8,5.2 7.5,6.8 8.4,9.5 6,7.9 3.6,9.5 4.5,6.8 2.2,5.2 5,5.2" fill="#FFFFFF" />
    </svg>
  )
}

export function CargarPlataModal({
  open,
  onOpenChange,
  moneda,
  onCargarPlata,
}: CargarPlataModalProps) {
  const [montoStr, setMontoStr] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const monto = parseFloat(montoStr)
    if (!monto || monto <= 0) {
      alert('Por favor ingresá un monto mayor a 0.')
      return
    }

    onCargarPlata({
      monto,
      tipoPlata: moneda,
      descripcion: descripcion.trim(),
    })

    setMontoStr('')
    setDescripcion('')
    onOpenChange(false)
  }

  const isArs = moneda === 'Plata Argentina'

  return (
    <Dialog open={open} onOpenChange={onOpenChange} slideFromBottom={true}>
      <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

      <DialogHeader>
        <DialogTitle className="text-2xl sm:text-3xl font-black flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
          <CircleDollarSign className="h-8 w-8 shrink-0" strokeWidth={2.4} />
          Ingreso para el viaje
        </DialogTitle>
        <DialogDescription className="text-sm sm:text-base font-medium">
          Sumá dinero a tu saldo disponible. Quedará registrado como ingreso para el viaje y figurará en el PDF.
        </DialogDescription>
      </DialogHeader>

      {/* Moneda Activa */}
      <div className="flex items-center gap-2.5 p-3 rounded-[var(--radius)] bg-muted/60 border border-border">
        {isArs ? <FlagArgentina /> : <FlagChile />}
        <span className="font-black text-base sm:text-lg text-foreground">
          {isArs ? 'Pesos Argentinos (ARS)' : 'Pesos Chilenos (CLP)'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        {/* Monto */}
        <div>
          <label className="text-base sm:text-lg font-black text-foreground block mb-2">
            Monto Recibido ($)
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
              value={montoStr}
              onChange={(e) => setMontoStr(e.target.value)}
              className="pl-12 h-18 text-3xl font-black rounded-[var(--radius)] text-foreground tracking-tight"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Motivo o Detalle (Opcional) */}
        <div>
          <label className="text-sm sm:text-base font-bold text-foreground block mb-2">
            Motivo / Detalle (Opcional)
          </label>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Viáticos, Combustible extra, etc."
            className="h-14 text-base sm:text-lg font-semibold rounded-[var(--radius)] px-4"
          />
        </div>

        {/* Botón de Confirmación Gigante */}
        <Button
          type="submit"
          className="w-full py-8 text-xl sm:text-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-[var(--radius)] flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 touch-manipulation active:scale-98"
        >
          <ArrowDownLeft className="w-7 h-7 stroke-[3]" />
          <span>Registrar Ingreso</span>
        </Button>
      </form>
    </Dialog>
  )
}
