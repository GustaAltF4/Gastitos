import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FinishedTrip } from '../services/tripStorage'
import { exportTripPDF } from '../services/tripPdf'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { CurrencyText } from './ui/currency-text'
import {
  FileDown,
  Trash2,
  Calendar,
  History,
  TrendingUp,
  MapPin,
  Truck,
  ChevronDown,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

interface TripHistoryTabProps {
  history: FinishedTrip[]
  onDeleteTrip: (id: string) => void
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function TripHistoryTab({ history, onDeleteTrip }: TripHistoryTabProps) {
  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({})

  const toggleTrip = (id: string) => {
    setExpandedTrips((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Datos para el gráfico comparativo de viajes anteriores (máximo los últimos 6 viajes)
  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .slice(-6)
      .map((t) => {
        const label = t.destino.length > 10 ? t.destino.slice(0, 9) + '…' : t.destino
        return {
          name: label,
          destinoCompleto: t.destino,
          'Gasto ARS': t.totalGastadoArs,
          'Gasto CLP': t.totalGastadoClp,
          fecha: t.fechaFin || t.fechaInicio,
        }
      })
  }, [history])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-[var(--radius)] bg-primary/15 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Historial de Viajes
            </h2>
            <p className="text-xs text-muted-foreground">
              {history.length === 0
                ? 'No hay viajes terminados todavía'
                : `${history.length} viaje${history.length === 1 ? '' : 's'} finalizado${
                    history.length === 1 ? '' : 's'
                  }`}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo de los Últimos Viajes (si hay al menos 1 con gastos) */}
      {history.length > 0 && (
        <Card className="rounded-[var(--radius)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Gasto Comparativo por Viaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `$${Number(value || 0).toLocaleString('es-AR')}`,
                      name,
                    ]}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload
                      return item ? `${item.destinoCompleto} (${item.fecha})` : label
                    }}
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                  <Bar dataKey="Gasto ARS" fill="#74ACDF" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gasto CLP" fill="#D52B1E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Viajes Terminados */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <Card className="p-8 text-center border-dashed rounded-[var(--radius)]">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                <Truck className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-base text-foreground">
                No hay viajes en el historial
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Cada vez que termines un viaje desde el botón <strong>"Terminar Viaje"</strong> en la pestaña Viaje, se guardará aquí con todo su detalle para poder revisar sus gastos o descargar el PDF en cualquier momento.
              </p>
            </div>
          </Card>
        ) : (
          history.map((t) => (
            <Card
              key={t.id}
              className="rounded-[var(--radius)] border border-border shadow-xs hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-4 sm:p-5 space-y-3.5">
                {/* Cabecera de la tarjeta del viaje */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-black text-xl sm:text-2xl text-foreground break-words leading-tight">
                        {t.destino}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-1.5 flex-wrap font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {t.fechaInicio}
                        {t.fechaFin && t.fechaFin !== t.fechaInicio ? ` al ${t.fechaFin}` : ''}
                      </span>
                      {t.nombre && (
                        <span>
                          Chofer: <strong>{t.nombre}</strong>
                        </span>
                      )}
                      <span>
                        {t.gastos.length} gasto{t.gastos.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones del viaje guardado */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => exportTripPDF(t)}
                      className="rounded-[var(--radius)] font-black text-sm h-11 px-4 gap-1.5 border-primary/40 bg-primary/10 text-primary"
                      title="Descargar o compartir PDF de este viaje"
                    >
                      <FileDown className="h-5 w-5" />
                      <span>PDF</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const confirma = window.confirm(
                          `¿Eliminar el viaje a "${t.destino}" del historial?`
                        )
                        if (confirma) onDeleteTrip(t.id)
                      }}
                      className="rounded-[var(--radius)] h-11 w-11 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      title="Eliminar del historial"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Resumen de montos ARS y CLP en filas completas y botón de detalles */}
                {(() => {
                  const isExpanded = !!expandedTrips[t.id]
                  return (
                    <div className="pt-2 border-t border-border/70 space-y-2.5">
                      {/* Fila Argentina (ARS) */}
                      <div className="flex items-center justify-between py-3 px-3.5 rounded-[calc(var(--radius)-4px)] bg-muted/40 border border-border/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl sm:text-2xl">🇦🇷</span>
                          <span className="font-black text-sm sm:text-base text-foreground">
                            Gastado ARS
                          </span>
                        </div>
                        <div className="text-right overflow-hidden flex justify-end">
                          <CurrencyText
                            amount={t.totalGastadoArs}
                            currency="ARS"
                            sign="minus"
                            autoFit={true}
                            className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400"
                          />
                        </div>
                      </div>

                      {/* Fila Chile (CLP) */}
                      <div className="flex items-center justify-between py-3 px-3.5 rounded-[calc(var(--radius)-4px)] bg-muted/40 border border-border/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl sm:text-2xl">🇨🇱</span>
                          <span className="font-black text-sm sm:text-base text-foreground">
                            Gastado CLP
                          </span>
                        </div>
                        <div className="text-right overflow-hidden flex justify-end">
                          <CurrencyText
                            amount={t.totalGastadoClp}
                            currency="CLP"
                            sign="minus"
                            autoFit={true}
                            className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400"
                          />
                        </div>
                      </div>

                      {/* Botón para Mostrar / Ocultar Detalles */}
                      <button
                        type="button"
                        onClick={() => toggleTrip(t.id)}
                        className="w-full mt-2 py-3 px-4 rounded-[calc(var(--radius)-4px)] bg-primary/10 hover:bg-primary/15 active:bg-primary/20 text-primary font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all touch-manipulation select-none active:scale-[0.98]"
                      >
                        <span>{isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}</span>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Acordeón Desplegable con Todos los Detalles y Gastos */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key={`details-${t.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 space-y-3 border-t border-border/70 mt-2">
                              {/* Tarjeta Detalle ARS */}
                              <div className="p-3.5 rounded-[calc(var(--radius)-4px)] bg-background/90 dark:bg-muted/20 border border-border/80 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                                  <span>🇦🇷</span>
                                  <span>Balance Argentina (ARS)</span>
                                </div>
                                <div className="space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Plata Inicial:</span>
                                    <span className="font-semibold text-foreground">
                                      ${formatMoney(t.plataArgentinaInicial)}
                                    </span>
                                  </div>
                                  {Boolean(t.totalIngresosArs) && (
                                    <div className="flex justify-between items-center text-muted-foreground">
                                      <span>Plata Recibida:</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        +${formatMoney(t.totalIngresosArs!)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Total Gastado:</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                      -${formatMoney(t.totalGastadoArs)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
                                    <span className="font-bold text-foreground">
                                      {t.plataArgentinaFinal >= 0 ? 'Sobraron:' : 'Faltaron:'}
                                    </span>
                                    <span
                                      className={`font-black text-sm sm:text-base ${
                                        t.plataArgentinaFinal >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      ${formatMoney(Math.abs(t.plataArgentinaFinal))}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Tarjeta Detalle CLP */}
                              <div className="p-3.5 rounded-[calc(var(--radius)-4px)] bg-background/90 dark:bg-muted/20 border border-border/80 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                                  <span>🇨🇱</span>
                                  <span>Balance Chile (CLP)</span>
                                </div>
                                <div className="space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Plata Inicial:</span>
                                    <span className="font-semibold text-foreground">
                                      ${formatMoney(t.plataChilenaInicial)}
                                    </span>
                                  </div>
                                  {Boolean(t.totalIngresosClp) && (
                                    <div className="flex justify-between items-center text-muted-foreground">
                                      <span>Plata Recibida:</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        +${formatMoney(t.totalIngresosClp!)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Total Gastado:</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                      -${formatMoney(t.totalGastadoClp)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
                                    <span className="font-bold text-foreground">
                                      {t.plataChilenaFinal >= 0 ? 'Sobraron:' : 'Faltaron:'}
                                    </span>
                                    <span
                                      className={`font-black text-sm sm:text-base ${
                                        t.plataChilenaFinal >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      ${formatMoney(Math.abs(t.plataChilenaFinal))}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Lista de gastos individuales de este viaje */}
                              {t.gastos && t.gastos.length > 0 && (
                                <div className="p-3.5 rounded-[calc(var(--radius)-4px)] bg-background/90 dark:bg-muted/20 border border-border/80 space-y-2">
                                  <span className="font-bold text-xs text-foreground uppercase tracking-wider block">
                                    Movimientos y gastos registrados ({t.gastos.length})
                                  </span>
                                  <div className="divide-y divide-border/60">
                                    {t.gastos.map((g) => (
                                      <div
                                        key={g.id}
                                        className="py-2.5 flex items-center justify-between gap-2 text-xs"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`font-bold break-words text-xs sm:text-sm ${
                                              g.esIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                                            }`}>
                                              {g.esIngreso ? `[+] ${g.tipoGasto}` : g.tipoGasto}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground shrink-0">
                                              {g.tipoPlata === 'Plata Argentina' ? '🇦🇷 ARS' : '🇨🇱 CLP'}
                                            </span>
                                            {g.esIngreso && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                                                Ingreso
                                              </span>
                                            )}
                                            {g.dias && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold shrink-0">
                                                {g.dias} día{g.dias > 1 ? 's' : ''}
                                              </span>
                                            )}
                                          </div>
                                          {g.descripcion && (
                                            <p className="text-[11px] text-muted-foreground break-words mt-0.5">
                                              {g.descripcion}
                                            </p>
                                          )}
                                          <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
                                            {g.fecha}
                                          </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <CurrencyText
                                            amount={g.monto}
                                            currency={g.tipoPlata === 'Plata Argentina' ? 'ARS' : 'CLP'}
                                            sign={g.esIngreso ? 'plus' : 'minus'}
                                            className={`font-bold text-xs sm:text-sm ${
                                              g.esIngreso
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
