import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Reminder, TransactionScope } from '../types/finance'
import { Bell, Calendar, PawPrint } from 'lucide-react'

interface ReminderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (reminder: Omit<Reminder, 'id' | 'notificationId' | 'status' | 'createdAt'>) => void
  account1Name?: string
  account2Name?: string
  account1Emoji?: string
  account2Emoji?: string
}

export function ReminderModal({
  open,
  onOpenChange,
  onSave,
  account1Name = 'Vivi',
  account2Name = 'Papá',
  account1Emoji = '👩',
  account2Emoji = '👨',
}: ReminderModalProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [scope, setScope] = useState<TransactionScope>('personal')
  const [notes, setNotes] = useState('')

  // Fecha y hora por defecto: dentro de 3 días a las 10:00 AM
  const getInitialDateTime = () => {
    const d = new Date(Date.now() + 3 * 86400000)
    d.setHours(10, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  const [dueDateTime, setDueDateTime] = useState(getInitialDateTime())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Por favor escribe qué deseas recordar.')
      return
    }

    const numericAmount = amount ? parseFloat(amount) : undefined

    onSave({
      title: title.trim(),
      amount: numericAmount && !isNaN(numericAmount) ? numericAmount : undefined,
      dueDateTime,
      scope,
      notes: notes.trim() || undefined,
    })

    setTitle('')
    setAmount('')
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} slideFromBottom={true}>
      {/* Indicador táctil nativo tipo Bottom Sheet para móvil */}
      <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          Nuevo Recordatorio con Alerta
        </DialogTitle>
        <DialogDescription>
          Configura una notificación que sonará en tu teléfono o navegador cuando venza.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título o motivo libre */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            ¿Qué tienes que recordar o pagar?
          </label>
          <Input
            required
            placeholder="Ej: Pagar Luz, Internet, Tarjeta, Farmacia..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base"
            autoFocus
          />
        </div>

        {/* Selector Exacto de Fecha y Hora */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Fecha y Hora Exacta de la Alerta
          </label>
          <Input
            type="datetime-local"
            required
            value={dueDateTime}
            onChange={(e) => setDueDateTime(e.target.value)}
            className="h-11 font-medium"
          />
          <span className="text-[11px] text-muted-foreground mt-1 block">
            A esta hora exacta el dispositivo emitirá la notificación sonora y vibración.
          </span>
        </div>

        {/* Monto estimado opcional */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Monto Estimado a Pagar (Opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Cuenta asociada: Cuenta 1 (Vivi) vs Cuenta 2 (Papá) */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            ¿Con qué cuenta se paga?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-transform duration-100 active:scale-95 select-none text-center leading-tight ${
                scope === 'personal'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <span className="text-sm leading-none shrink-0">{account1Emoji}</span>
              <span className="truncate">{account1Name}</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('business')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-transform duration-100 active:scale-95 select-none text-center leading-tight ${
                scope === 'business'
                  ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/25 shadow-sm'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <span className="text-sm leading-none shrink-0">{account2Emoji}</span>
              <span className="truncate">{account2Name}</span>
            </button>
          </div>
        </div>

        {/* Nota adicional */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Nota o detalle adicional (Opcional)
          </label>
          <Input
            placeholder="Ej: Número de cliente 12345 o pagar antes del segundo vencimiento"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-amber-600 active:bg-amber-700 text-white gap-1.5"
          >
            <PawPrint className="h-4 w-4" />
            Programar Alerta
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
