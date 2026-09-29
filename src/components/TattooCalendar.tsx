import { useState, useRef, useEffect, useMemo } from 'react'
import { TattooAppointment, TattooReminderOption } from '../types/finance'
import { formatCurrency, getLocalDateString } from '../lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import {
  Sparkles,
  Calendar,
  Clock,
  Trash2,
  Plus,
  RotateCcw,
  Bell,
  Cat,
} from 'lucide-react'

interface TattooCalendarProps {
  appointments: TattooAppointment[]
  onAddAppointment: (date?: string) => void
  onDeleteAppointment: (id: string) => void
  onResetWeek: () => void
  currency: string
}

function getReminderLabel(option: TattooReminderOption): string {
  switch (option) {
    case 'same_day_morning':
      return '🌅 Mismo día 9hs'
    case '1_day_before':
      return '⏳ 1 día antes'
    case '2_days_before':
      return '📅 2 días antes'
    case '2_hours_before':
      return '⏰ 2hs antes'
    case 'exact_time':
      return '🔔 Hora exacta'
    default:
      return '🔕 Sin alerta'
  }
}

// Generar ventana dinámica de 8 días: 1 día antes (-1), Hoy (0) y los 6 días próximos (+1 a +6)
function generateRollingCalendarDays() {
  const shortNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const fullNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]

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
      monthName: monthNames[d.getMonth()],
      shortLabel: label,
      fullName: fullNames[d.getDay()],
      isToday: offset === 0,
      isYesterday: offset === -1,
    })
  }

  return days
}

export function TattooCalendar({
  appointments,
  onAddAppointment,
  onDeleteAppointment,
  onResetWeek,
  currency,
}: TattooCalendarProps) {
  const rollingDays = useMemo(() => generateRollingCalendarDays(), [])
  const todayStr = getLocalDateString()

  const [activeDate, setActiveDate] = useState<string>(todayStr)
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Rango de fechas visibles
  const firstDay = rollingDays[0]
  const lastDay = rollingDays[rollingDays.length - 1]
  const rangeText = `${firstDay.dayNum} ${firstDay.monthName} - ${lastDay.dayNum} ${lastDay.monthName}`

  // Métricas del período
  const totalAppointments = appointments.length
  const totalDeposits = appointments.reduce((sum, a) => sum + (a.deposit || 0), 0)

  // Auto-scrollear a la columna de HOY al cargar
  useEffect(() => {
    const el = columnRefs.current[todayStr]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [todayStr])

  const scrollToDate = (dateStr: string) => {
    setActiveDate(dateStr)
    const el = columnRefs.current[dateStr]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }

  const handleResetConfirm = () => {
    if (window.confirm('¿Reiniciar turnos? Se limpiarán los turnos agendados para empezar de cero.')) {
      onResetWeek()
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Header con Resumen y Acciones */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                    <span>Agenda Tattoo</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-bold">
                      Ayer, Hoy + 6 Días 🐾
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span>{rangeText}</span>
                    <span className="text-[10px] text-primary/80 font-semibold">• Limpieza automática</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetConfirm}
                className="text-xs h-9 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Limpiar y reiniciar los turnos"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reiniciar
              </Button>

              <Button
                size="sm"
                onClick={() => onAddAppointment(activeDate)}
                className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-md shadow-primary/25"
              >
                <Plus className="h-4 w-4" />
                Agendar Turno
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/80">
            <div className="text-center sm:text-left pl-2">
              <span className="text-[10px] font-semibold text-muted-foreground block">Turnos Agendados</span>
              <span className="text-base sm:text-lg font-black text-foreground">{totalAppointments}</span>
            </div>
            <div className="text-center sm:text-left border-l border-border/60 pl-3">
              <span className="text-[10px] font-semibold text-muted-foreground block">Total en Señas</span>
              <span className="text-base sm:text-lg font-black text-primary">
                {formatCurrency(totalDeposits, currency)}
              </span>
            </div>
          </div>

          {/* 2. TIRA DE CALENDARIO (8 DÍAS: AYER, HOY + 6 PRÓXIMOS) */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Vista Rápida (Tocá para ir al día):</span>
              <span className="text-[10px] text-primary lowercase font-medium">deslizá a los lados ↔</span>
            </div>

            <div className="flex sm:grid sm:grid-cols-8 gap-1.5 p-1.5 rounded-2xl bg-muted/60 border border-border/70 overflow-x-auto scrollbar-none">
              {rollingDays.map((d) => {
                const count = appointments.filter((a) => a.date === d.date).length
                const isActive = activeDate === d.date

                return (
                  <button
                    key={d.date}
                    onClick={() => scrollToDate(d.date)}
                    className={`flex-1 min-w-[44px] flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs transition-all active:scale-95 relative shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-black shadow-md shadow-primary/25 ring-2 ring-primary/30'
                        : d.isToday
                        ? 'bg-primary/15 text-primary font-bold border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider opacity-85 leading-tight">{d.shortLabel}</span>
                    <span className="text-sm font-black mt-0.5 leading-none">{d.dayNum}</span>

                    {/* Indicador de turnos */}
                    <div className="flex items-center gap-0.5 mt-1 h-2">
                      {count > 0 ? (
                        <span
                          className={`text-[9px] px-1 py-0 rounded-full font-bold leading-tight ${
                            isActive
                              ? 'bg-primary-foreground text-primary'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          {count}
                        </span>
                      ) : (
                        d.isToday && <span className="h-1 w-1 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. COLUMNAS DE CALENDARIO DESLIZABLES */}
      <div className="relative">
        <div
          ref={containerRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-3 pt-1 scrollbar-thin px-0.5"
        >
          {rollingDays.map((day) => {
            const isActive = activeDate === day.date
            const dayAppointments = appointments
              .filter((a) => a.date === day.date)
              .sort((a, b) => a.time.localeCompare(b.time))

            return (
              <div
                key={day.date}
                ref={(el) => {
                  columnRefs.current[day.date] = el
                }}
                className={`w-[85vw] sm:w-[280px] h-[350px] shrink-0 snap-center rounded-2xl border flex flex-col transition-all bg-card/95 shadow-sm ${
                  isActive
                    ? 'ring-2 ring-primary/40 border-primary/50'
                    : day.isToday
                    ? 'border-primary/40'
                    : 'border-border/80'
                }`}
              >
                {/* Cabecera de la Columna */}
                <div
                  className={`p-3 rounded-t-2xl border-b flex items-center justify-between transition-colors ${
                    day.isToday
                      ? 'bg-primary/10 border-primary/25'
                      : day.isYesterday
                      ? 'bg-muted/50 border-border/80'
                      : isActive
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-muted/30 border-border/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        day.isToday
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {day.dayNum}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-foreground uppercase tracking-wider">
                          {day.fullName}
                        </span>
                        {day.isToday && (
                          <span className="text-[9px] px-1 py-0.2 rounded-md bg-primary text-primary-foreground font-black leading-none">
                            HOY
                          </span>
                        )}
                        {day.isYesterday && (
                          <span className="text-[9px] px-1 py-0.2 rounded-md bg-muted text-muted-foreground font-bold leading-none">
                            AYER
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {dayAppointments.length === 0
                          ? 'Libre'
                          : `${dayAppointments.length} turno${dayAppointments.length > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddAppointment(day.date)}
                    className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-transform active:scale-90"
                    title={`Agregar turno para ${day.fullName} ${day.dayNum}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Contenido / Turnos de la Columna con scroll interno */}
                <div className="p-2.5 flex-1 overflow-y-auto scrollbar-thin space-y-2.5 flex flex-col justify-start">
                  {dayAppointments.length === 0 ? (
                    <div
                      onClick={() => onAddAppointment(day.date)}
                      className="flex-1 rounded-xl border border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group select-none"
                    >
                      <Cat className="h-6 w-6 text-muted-foreground/60 group-hover:text-primary mb-1.5 transition-colors" />
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        Libre para mimir 🐾
                      </span>
                      <span className="text-[10px] text-muted-foreground/75 mt-0.5 flex items-center gap-0.5">
                        <Plus className="h-3 w-3" /> Tocar para agendar
                      </span>
                    </div>
                  ) : (
                    dayAppointments.map((appt) => {
                      const options = appt.reminderOptions || (appt.reminderOption ? [appt.reminderOption] : [])
                      const activeReminders = options.filter((o) => o !== 'none')

                      return (
                        <div
                          key={appt.id}
                          className="p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-primary/40 transition-all space-y-2 relative group"
                        >
                          {/* Fila superior: Hora y Botón Borrar */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-primary/15 text-primary border border-primary/20">
                              <Clock className="h-3 w-3" />
                              {appt.time} hs
                            </span>

                            <button
                              onClick={() => onDeleteAppointment(appt.id)}
                              className="h-7 w-7 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:scale-90 flex items-center justify-center transition-all"
                              title="Eliminar este turno"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Nombre del Cliente */}
                          <div>
                            <p className="font-bold text-sm text-foreground leading-snug">
                              {appt.clientName}
                            </p>
                          </div>

                          {/* Seña abonada si existe */}
                          {appt.deposit ? (
                            <div className="pt-1 border-t border-border/60 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-muted-foreground font-medium">Seña:</span>
                              <span className="font-black text-primary">
                                {formatCurrency(appt.deposit, currency)}
                              </span>
                            </div>
                          ) : null}

                          {/* Múltiples Alertas Programadas */}
                          {activeReminders.length > 0 && (
                            <div className="pt-1 border-t border-border/50 flex flex-wrap gap-1">
                              {activeReminders.map((rem) => (
                                <span
                                  key={rem}
                                  className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold"
                                >
                                  <Bell className="h-2.5 w-2.5 shrink-0" />
                                  <span>{getReminderLabel(rem)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
