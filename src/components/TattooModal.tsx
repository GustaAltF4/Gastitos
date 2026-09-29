import React, { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TattooAppointment, TattooReminderOption } from '../types/finance'
import { getLocalDateString } from '../lib/utils'
import { Sparkles, Calendar, Clock, DollarSign, Bell, PawPrint, CheckCircle2, Check } from 'lucide-react'

interface TattooModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    appointment: Omit<TattooAppointment, 'id' | 'createdAt'>,
    addToIncome: boolean
  ) => void
  initialDate?: string
}

// Generar los 8 días: 1 día antes (-1), Hoy (0), y los 6 días próximos (+1 a +6)
function generateRollingDays() {
  const shortNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const days = []

  for (let offset = -1; offset <= 6; offset++) {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const dateStr = getLocalDateString(d)
    let label = shortNames[d.getDay()]
    if (offset === -1) label = 'Ayer'
    else if (offset === 0) label = 'Hoy'
    else if (offset === 1) label = 'Mañ'

    days.push({
      offset,
      date: dateStr,
      dayNum: d.getDate(),
      label,
      isToday: offset === 0,
      isYesterday: offset === -1,
    })
  }

  return days
}

const REMINDER_OPTIONS: { id: TattooReminderOption; label: string }[] = [
  { id: '2_days_before', label: '📅 2 días antes (12:00 PM)' },
  { id: '1_day_before', label: '⏳ 1 día antes (18:00 PM)' },
  { id: 'same_day_morning', label: '🌅 El mismo día (09:00 AM)' },
  { id: '2_hours_before', label: '⏰ 2 horas antes de la sesión' },
  { id: 'exact_time', label: '🔔 A la hora exacta' },
  { id: 'none', label: '🔕 Sin notificación' },
]

export function TattooModal({
  open,
  onOpenChange,
  onSave,
  initialDate,
}: TattooModalProps) {
  const rollingDays = generateRollingDays()
  const todayStr = getLocalDateString()

  const [clientName, setClientName] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr)
  const [time, setTime] = useState('15:00')
  const [deposit, setDeposit] = useState('')
  const [addToIncome, setAddToIncome] = useState(true)
  const [selectedReminders, setSelectedReminders] = useState<TattooReminderOption[]>(['1_day_before'])

  useEffect(() => {
    if (open) {
      if (initialDate) {
        setSelectedDate(initialDate)
      } else {
        setSelectedDate(getLocalDateString())
      }
    }
  }, [open, initialDate])

  const toggleReminder = (optionId: TattooReminderOption) => {
    if (optionId === 'none') {
      // Si selecciona "sin notificación", desactiva todas las demás
      setSelectedReminders(['none'])
      return
    }

    // Si ya tenía "none", lo quitamos primero
    const withoutNone = selectedReminders.filter((r) => r !== 'none')

    if (withoutNone.includes(optionId)) {
      const remaining = withoutNone.filter((r) => r !== optionId)
      setSelectedReminders(remaining.length > 0 ? remaining : ['none'])
    } else {
      setSelectedReminders([...withoutNone, optionId])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      alert('Por favor escribe el nombre del cliente.')
      return
    }

    const numericDeposit = deposit ? parseFloat(deposit) : undefined

    onSave(
      {
        clientName: clientName.trim(),
        date: selectedDate,
        time,
        deposit: numericDeposit && !isNaN(numericDeposit) ? numericDeposit : undefined,
        reminderOptions: selectedReminders,
      },
      addToIncome && !!numericDeposit && numericDeposit > 0
    )

    // Resetear formulario
    setClientName('')
    setTime('15:00')
    setDeposit('')
    setAddToIncome(true)
    setSelectedReminders(['1_day_before'])
    onOpenChange(false)
  }

  const hasDepositAmount = !!deposit && parseFloat(deposit) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange} slideFromBottom={true}>
      <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-foreground font-black">
          <Sparkles className="h-5 w-5 text-primary" />
          Agendar Turno de Tattoo 🖋️
        </DialogTitle>
        <DialogDescription>
          Ingresa el cliente, fecha y hora del turno.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 w-full min-w-0">
        {/* 1. Nombre del Cliente */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Nombre del Cliente / Clienta *
          </label>
          <Input
            required
            placeholder="Ej: 😡😡😡"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="text-base font-semibold w-full"
            autoFocus
          />
        </div>

        {/* 2. Selector de Días: 1 día antes, Hoy y los 6 próximos */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Fecha del Turno *</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">Ayer, Hoy + 6 días</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full">
            {rollingDays.map((d) => {
              const isSelected = selectedDate === d.date
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  className={`min-w-0 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold border transition-all active:scale-95 relative ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-primary/20'
                      : d.isToday
                      ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                      : d.isYesterday
                      ? 'border-border/70 bg-muted/40 text-muted-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-85 leading-tight truncate">{d.label}</span>
                  <span className="text-sm font-black mt-0.5 leading-none">{d.dayNum}</span>
                  {d.isToday && !isSelected && (
                    <span className="h-1 w-1 rounded-full bg-primary mt-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Hora del Turno */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            Hora del Turno *
          </label>
          <Input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11 font-black text-center text-base w-full"
          />
        </div>

        {/* 4. Seña Abonada + Checkbox Opcional de Ingreso */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
            Seña Abonada (Opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="any"
              placeholder="0.00"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="pl-8 font-bold text-foreground w-full"
            />
          </div>

          {/* Opción para sumar directo a ingresos */}
          {hasDepositAmount && (
            <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-card border border-border/80 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={addToIncome}
                onChange={(e) => setAddToIncome(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded accent-primary cursor-pointer shrink-0"
              />
              <span className="text-xs font-semibold text-foreground flex-1 min-w-0 leading-snug">
                Sumar ${deposit} directo a los Ingresos de Gastitos 🐾
              </span>
            </label>
          )}
        </div>

        {/* 5. Alertas con Selección Múltiple */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Alertas en tu teléfono</span>
            </label>
            <span className="text-[10px] text-primary font-bold">
              {selectedReminders.includes('none')
                ? 'Sin avisos'
                : `${selectedReminders.length} seleccionada${selectedReminders.length > 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {REMINDER_OPTIONS.map((opt) => {
              const isChecked = selectedReminders.includes(opt.id)
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleReminder(opt.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all active:scale-98 min-w-0 ${
                    isChecked
                      ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/25'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="text-xs leading-tight min-w-0 break-words flex-1 pr-2">{opt.label}</span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-md shadow-primary/20"
          >
            <PawPrint className="h-4 w-4" />
            Agendar Turno 🐾
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
