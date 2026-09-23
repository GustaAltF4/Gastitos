import { Reminder } from '../types/finance'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  AlertTriangle,
  Briefcase,
  User,
  Volume2,
  Plus,
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface ReminderListProps {
  reminders: Reminder[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onTestNotification: () => void
  onCreateNew: () => void
  currency: string
}

export function ReminderList({
  reminders,
  onComplete,
  onDelete,
  onTestNotification,
  onCreateNew,
  currency,
}: ReminderListProps) {
  const now = new Date().getTime()

  // Ordenar: primero los pendientes ordenados por fecha más próxima, luego los completados
  const sorted = [...reminders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime()
  })

  const handleMarkComplete = (id: string) => {
    // Lanzar efecto de confeti alegre de celebración
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      })
    } catch {}
    onComplete(id)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Recordatorios y Alertas de Pago ({reminders.filter((r) => r.status === 'pending').length} pendientes)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tus avisos programados con notificaciones directas en tu teléfono.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onTestNotification}
              className="text-xs flex items-center gap-1.5 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Probar Sonido
            </Button>
            <Button
              size="sm"
              onClick={onCreateNew}
              className="text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo Recordatorio
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sorted.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No tienes recordatorios activos</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
              Programa alertas para el pago de internet, alquiler, tarjetas o cobro a clientes. Sonarán automáticamente en tu dispositivo.
            </p>
            <Button onClick={onCreateNew} className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Crear mi primer recordatorio
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sorted.map((rem) => {
              const dueTime = new Date(rem.dueDateTime).getTime()
              const isOverdue = rem.status === 'pending' && dueTime < now
              const isDueSoon =
                rem.status === 'pending' && !isOverdue && dueTime - now < 48 * 3600 * 1000

              return (
                <div
                  key={rem.id}
                  className={`py-3.5 flex items-start sm:items-center justify-between gap-3 group px-2 rounded-xl transition-colors ${
                    rem.status === 'completed'
                      ? 'opacity-60 bg-muted/20'
                      : isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20'
                      : isDueSoon
                      ? 'bg-amber-50/50 dark:bg-amber-950/20'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleMarkComplete(rem.id)}
                      className={`mt-0.5 sm:mt-0 p-1 rounded-full transition-colors ${
                        rem.status === 'completed'
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                      title={rem.status === 'completed' ? 'Completado' : 'Marcar como pagado'}
                    >
                      <CheckCircle2
                        className={`h-5 w-5 ${
                          rem.status === 'completed' ? 'fill-primary text-primary-foreground' : ''
                        }`}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`font-semibold text-sm ${
                            rem.status === 'completed'
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {rem.title}
                        </p>

                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" /> Vencido
                          </Badge>
                        )}

                        {isDueSoon && (
                          <Badge variant="warning" className="text-[10px] py-0 px-1.5 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> Próximo
                          </Badge>
                        )}

                        <Badge
                          variant={rem.scope === 'business' ? 'business' : 'personal'}
                          className="text-[10px] py-0 px-1.5 font-normal"
                        >
                          {rem.scope === 'business' ? (
                            <span className="flex items-center gap-0.5">
                              <Briefcase className="h-2.5 w-2.5" /> Negocio
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <User className="h-2.5 w-2.5" /> Personal
                            </span>
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDateTime(rem.dueDateTime)} hs
                        </span>
                        {rem.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] sm:max-w-xs">{rem.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {rem.amount ? (
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        {formatCurrency(rem.amount, currency)}
                      </span>
                    ) : null}

                    <button
                      onClick={() => onDelete(rem.id)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/25 active:scale-90 transition-all select-none shrink-0"
                      title="Eliminar este recordatorio"
                      aria-label="Eliminar recordatorio"
                    >
                      <Trash2 className="h-4 w-4 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
