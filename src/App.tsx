import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  FileDown,
  Trash2,
  Plus,
  Receipt,
  Settings,
  CirclePlus,
  Search,
  Flag,
  ArrowRight,
  Clock,
  History,
  ChevronDown,
  CircleDollarSign,
} from 'lucide-react'
import { TripMenu } from './components/TripMenu'
import { AddGastoModal } from './components/AddGastoModal'
import { InitTripModal } from './components/InitTripModal'
import { CargarPlataModal } from './components/CargarPlataModal'
import { TripSettingsTab } from './components/TripSettingsTab'
import { TripCharts } from './components/TripCharts'
import { TripHistoryTab } from './components/TripHistoryTab'
import { GlowCard } from './components/react-bits/GlowCard'
import { CurrencyText } from './components/ui/currency-text'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { RADIUS_VALUES } from './services/storage'
import {
  tripStorage,
  TripState,
  FinishedTrip,
  GastoViaje,
  TipoPlata,
  DEFAULT_TRUCK_CATEGORIES,
} from './services/tripStorage'
import { exportTripPDF } from './services/tripPdf'

function FlagArgentina() {
  return (
    <svg
      viewBox="0 0 36 24"
      className="w-12 h-8 rounded-lg shadow-xs shrink-0 border border-black/15"
      aria-label="Argentina"
    >
      <rect width="36" height="24" fill="#74ACDF" />
      <rect y="8" width="36" height="8" fill="#FFFFFF" />
      <circle cx="18" cy="12" r="2.6" fill="#F6B40E" stroke="#85340A" strokeWidth="0.4" />
    </svg>
  )
}

function FlagChile() {
  return (
    <svg
      viewBox="0 0 36 24"
      className="w-12 h-8 rounded-lg shadow-xs shrink-0 border border-black/15"
      aria-label="Chile"
    >
      <rect width="36" height="12" fill="#FFFFFF" />
      <rect y="12" width="36" height="12" fill="#D52B1E" />
      <rect width="12" height="12" fill="#0039A6" />
      <polygon
        points="6,2.5 7,5.2 9.8,5.2 7.5,6.8 8.4,9.5 6,7.9 3.6,9.5 4.5,6.8 2.2,5.2 5,5.2"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function App() {
  const [tripState, setTripState] = useState<TripState>({
    plataArgentina: 0,
    plataChilena: 0,
    plataArgentinaInicial: 0,
    plataChilenaInicial: 0,
    nombre: '',
    destino: '',
    guardado: false,
    gastos: [],
    darkMode: true,
    themeColor: 'indigo',
    borderRadius: 'lg',
    categories: DEFAULT_TRUCK_CATEGORIES,
  })

  const [history, setHistory] = useState<FinishedTrip[]>([])
  const [loaded, setLoaded] = useState(false)

  const [activeTab, setActiveTab] = useState<'trip' | 'gastos' | 'history' | 'settings'>('trip')
  const [monedaFilter, setMonedaFilter] = useState<'all' | TipoPlata>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Modales
  const [isInitTripModalOpen, setIsInitTripModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCargarPlataModalOpen, setIsCargarPlataModalOpen] = useState(false)
  const [cargarPlataMoneda, setCargarPlataMoneda] = useState<TipoPlata>('Plata Argentina')

  // Acordeones de saldos ARS y CLP
  const [expandedArs, setExpandedArs] = useState(false)
  const [expandedClp, setExpandedClp] = useState(false)

  // Aplicar clases de tema, modo oscuro y redondeo de bordes (--radius)
  const applyThemeClasses = (dark: boolean, theme: string, radius: string = 'lg') => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    const allThemes = [
      'theme-emerald',
      'theme-indigo',
      'theme-violet',
      'theme-amber',
      'theme-cyan',
      'theme-rose',
      'theme-neutral',
    ]
    allThemes.forEach((t) => root.classList.remove(t))
    root.classList.add(`theme-${theme || 'indigo'}`)

    const radiusPx = RADIUS_VALUES[radius as keyof typeof RADIUS_VALUES] || '18px'
    root.style.setProperty('--radius', radiusPx)
  }

  useEffect(() => {
    async function init() {
      const [savedTrip, savedHistory] = await Promise.all([
        tripStorage.loadState(),
        tripStorage.getTripHistory(),
      ])
      setTripState(savedTrip)
      setHistory(savedHistory)
      applyThemeClasses(savedTrip.darkMode, savedTrip.themeColor, savedTrip.borderRadius)
      setLoaded(true)
    }
    init()
  }, [])

  const updateAndPersist = async (next: TripState) => {
    setTripState(next)
    applyThemeClasses(next.darkMode, next.themeColor, next.borderRadius)
    await tripStorage.saveState(next)
  }

  const handleUpdatePartial = async (partial: Partial<TripState>) => {
    const next = { ...tripState, ...partial }
    await updateAndPersist(next)
  }

  const handleToggleDarkMode = () => {
    handleUpdatePartial({ darkMode: !tripState.darkMode })
  }

  const handleInitTrip = async (ars: number, clp: number, destino: string) => {
    const next: TripState = {
      ...tripState,
      plataArgentina: ars,
      plataChilena: clp,
      plataArgentinaInicial: ars,
      plataChilenaInicial: clp,
      destino,
      guardado: true,
      gastos: [],
    }
    await updateAndPersist(next)
    setActiveTab('trip')
  }

  const handleAddCategory = (newCat: string) => {
    const current = tripState.categories || DEFAULT_TRUCK_CATEGORIES
    if (!current.includes(newCat)) {
      handleUpdatePartial({ categories: [...current, newCat] })
    }
  }

  const handleAddGasto = async ({
    monto,
    tipoGasto,
    descripcion,
    tipoPlata,
    dias,
  }: {
    monto: number
    tipoGasto: string
    descripcion?: string
    tipoPlata: TipoPlata
    dias?: number
  }) => {
    if (!tripState.guardado) return

    let nuevaArs = tripState.plataArgentina
    let nuevaClp = tripState.plataChilena
    let totalRestante = 0

    if (tipoPlata === 'Plata Argentina') {
      nuevaArs = tripState.plataArgentina - monto
      totalRestante = nuevaArs
    } else {
      nuevaClp = tripState.plataChilena - monto
      totalRestante = nuevaClp
    }

    const nuevoGasto: GastoViaje = {
      id: `gasto-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-AR'),
      tipoGasto,
      descripcion,
      monto,
      tipoPlata,
      dias,
      totalRestante,
    }

    const next: TripState = {
      ...tripState,
      plataArgentina: nuevaArs,
      plataChilena: nuevaClp,
      gastos: [nuevoGasto, ...tripState.gastos], // Lo más reciente primero
    }

    await updateAndPersist(next)
  }

  const handleCargarPlata = async ({
    monto,
    tipoPlata,
    descripcion,
  }: {
    monto: number
    tipoPlata: TipoPlata
    descripcion: string
  }) => {
    if (!tripState.guardado) return

    let nuevaArs = tripState.plataArgentina
    let nuevaClp = tripState.plataChilena
    let totalRestante = 0

    if (tipoPlata === 'Plata Argentina') {
      nuevaArs = tripState.plataArgentina + monto
      totalRestante = nuevaArs
    } else {
      nuevaClp = tripState.plataChilena + monto
      totalRestante = nuevaClp
    }

    const nuevoIngreso: GastoViaje = {
      id: `ingreso-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-AR'),
      tipoGasto: 'Ingreso para el viaje',
      descripcion: descripcion || '',
      monto,
      tipoPlata,
      totalRestante,
      esIngreso: true,
    }

    const next: TripState = {
      ...tripState,
      plataArgentina: nuevaArs,
      plataChilena: nuevaClp,
      gastos: [nuevoIngreso, ...tripState.gastos],
    }

    await updateAndPersist(next)
  }

  const eliminarGasto = async (idOrIndex: string | number) => {
    const index =
      typeof idOrIndex === 'number'
        ? idOrIndex
        : tripState.gastos.findIndex((g) => g.id === idOrIndex)
    const gasto = tripState.gastos[index]
    if (!gasto) return

    const esIngreso = Boolean(gasto.esIngreso)
    const mensaje = esIngreso
      ? '¿Estás seguro que querés eliminar este ingreso para el viaje? Se descontará del saldo disponible.'
      : '¿Estás seguro que querés eliminar este gasto? Se devolverá al saldo disponible.'

    const confirmado = window.confirm(mensaje)
    if (!confirmado) return

    let nuevaArs = tripState.plataArgentina
    let nuevaClp = tripState.plataChilena

    if (gasto.tipoPlata === 'Plata Argentina') {
      if (esIngreso) nuevaArs -= gasto.monto
      else nuevaArs += gasto.monto
    } else if (gasto.tipoPlata === 'Plata Chilena') {
      if (esIngreso) nuevaClp -= gasto.monto
      else nuevaClp += gasto.monto
    }

    const nuevosGastos = tripState.gastos.filter((_, i) => i !== index)

    let runningArs = tripState.plataArgentinaInicial
    let runningClp = tripState.plataChilenaInicial

    // Recalculamos saldos cronológicamente
    const cronologicos = [...nuevosGastos].reverse().map((g) => {
      const monto = Number(g.monto) || 0
      if (g.tipoPlata === 'Plata Argentina') {
        if (g.esIngreso) runningArs += monto
        else runningArs -= monto
        return { ...g, totalRestante: runningArs }
      } else {
        if (g.esIngreso) runningClp += monto
        else runningClp -= monto
        return { ...g, totalRestante: runningClp }
      }
    })

    const gastosRecalculados = cronologicos.reverse()

    const next: TripState = {
      ...tripState,
      plataArgentina: nuevaArs,
      plataChilena: nuevaClp,
      gastos: gastosRecalculados,
    }

    await updateAndPersist(next)
  }

  // Cálculos de total gastado y plata recibida
  const { totalGastadoArs, totalGastadoClp, totalIngresosArs, totalIngresosClp } = useMemo(() => {
    let gastadoArs = 0
    let gastadoClp = 0
    let ingresosArs = 0
    let ingresosClp = 0

    tripState.gastos.forEach((g) => {
      const monto = Number(g.monto) || 0
      if (g.esIngreso) {
        if (g.tipoPlata === 'Plata Argentina') ingresosArs += monto
        else ingresosClp += monto
      } else {
        if (g.tipoPlata === 'Plata Argentina') gastadoArs += monto
        else gastadoClp += monto
      }
    })

    return {
      totalGastadoArs: gastadoArs,
      totalGastadoClp: gastadoClp,
      totalIngresosArs: ingresosArs,
      totalIngresosClp: ingresosClp,
    }
  }, [tripState.gastos])

  // Terminar Viaje y pasarlo al historial
  const terminarViaje = async () => {
    const quiereTerminar = window.confirm(
      `¿Deseas TERMINAR el viaje a "${tripState.destino || 'este destino'}"?\n\nEste viaje se guardará en tu Historial con todos sus gastos y podrás descargar el PDF cuando quieras.`
    )
    if (!quiereTerminar) return

    if (tripState.gastos.length > 0) {
      const exportar = window.confirm('¿Querés descargar o compartir el PDF del viaje ahora?')
      if (exportar) {
        await exportTripPDF(tripState)
      }
    }

    // Armar viaje terminado para guardar en el historial
    const fechaFin = new Date().toLocaleDateString('es-AR')
    const fechaInicio =
      tripState.gastos.length > 0
        ? tripState.gastos[tripState.gastos.length - 1].fecha
        : fechaFin

    const finishedTrip: FinishedTrip = {
      id: `viaje-${Date.now()}`,
      nombre: tripState.nombre,
      destino: tripState.destino || 'Sin especificar',
      fechaInicio,
      fechaFin,
      plataArgentinaInicial: tripState.plataArgentinaInicial,
      plataChilenaInicial: tripState.plataChilenaInicial,
      plataArgentinaFinal: tripState.plataArgentina,
      plataChilenaFinal: tripState.plataChilena,
      totalGastadoArs,
      totalGastadoClp,
      totalIngresosArs,
      totalIngresosClp,
      gastos: tripState.gastos,
    }

    await tripStorage.addTripToHistory(finishedTrip)
    setHistory((prev) => [finishedTrip, ...prev])

    // Reiniciar viaje actual
    const fresh = await tripStorage.resetTrip(tripState)
    setTripState(fresh)
    setActiveTab('trip')
  }

  const handleDeleteTripFromHistory = async (id: string) => {
    const updated = await tripStorage.deleteTripFromHistory(id)
    setHistory(updated)
  }

  // Filtrado de gastos para la lista completa
  const filteredGastos = useMemo(() => {
    return tripState.gastos.filter((g) => {
      const matchesMoneda = monedaFilter === 'all' || g.tipoPlata === monedaFilter
      const matchesSearch =
        !searchTerm.trim() ||
        g.tipoGasto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.descripcion && g.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        g.fecha.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesMoneda && matchesSearch
    })
  }, [tripState.gastos, monedaFilter, searchTerm])

  // Últimos gastos (máximo 4 para el resumen en la pantalla Viaje)
  const ultimosGastos = useMemo(() => {
    return tripState.gastos.slice(0, 4)
  }, [tripState.gastos])

  if (!loaded) {
    return <div className="min-h-screen bg-background text-foreground" />
  }

  const {
    plataArgentina,
    plataChilena,
    plataArgentinaInicial,
    plataChilenaInicial,
    nombre,
    destino,
    guardado,
    gastos,
    darkMode,
  } = tripState

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col sm:pb-32"
      style={{
        paddingBottom:
          'calc(7.5rem + max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      {/* Cabecera Superior Limpia */}
      <TripMenu
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        nombre={nombre}
        destino={guardado ? destino : ''}
      />

      {/* Contenido Principal con Transiciones Fluidas */}
      <main className="container max-w-4xl mx-auto px-4 py-5 flex-1 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="hardware-accelerated space-y-6"
          >
            {/* PESTAÑA 1: VIAJE PRINCIPAL (Con saldos, últimos gastos y gráficos de este viaje) */}
            {activeTab === 'trip' && (
              <div className="space-y-5 max-w-xl mx-auto">
                {/* 1. Tarjeta Principal de Saldos ARS y CLP con GlowCard */}
                <GlowCard
                  glowColor={
                    guardado && plataArgentina >= 0 && plataChilena >= 0
                      ? 'hsl(var(--primary) / 0.28)'
                      : 'rgba(239, 68, 68, 0.25)'
                  }
                  className="bg-gradient-to-br from-card via-card to-muted/30 border border-border/80"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-[var(--radius)] bg-primary/15 text-primary shrink-0">
                        <Truck className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.4} />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground leading-tight">
                          {guardado && destino ? `Viaje a ${destino}` : 'Plata Disponible'}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-bold">
                          {guardado
                            ? `${gastos.length} gasto${gastos.length === 1 ? '' : 's'} registrado${
                                gastos.length === 1 ? '' : 's'
                              }`
                            : 'Tocá el botón [+] para iniciar viaje'}
                        </p>
                      </div>
                    </div>

                    {guardado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={terminarViaje}
                        className="rounded-[var(--radius)] border-2 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black gap-2 h-11 px-3 sm:px-4 text-xs sm:text-sm shrink-0 touch-manipulation shadow-xs active:scale-95"
                        title="Finalizar este viaje y pasarlo al historial"
                      >
                        <Flag className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                        <span>Terminar <span className="hidden xs:inline">Viaje</span></span>
                      </Button>
                    )}
                  </div>

                  {/* Saldo Argentina (ARS) como Acordeón */}
                  <div className="rounded-[var(--radius)] bg-background/90 dark:bg-muted/40 border border-border/80 overflow-hidden transition-all shadow-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedArs(!expandedArs)}
                      className="w-full p-4 sm:p-5 text-left touch-manipulation select-none active:bg-muted/60 transition-colors"
                      aria-expanded={expandedArs}
                    >
                      {/* Fila 1: Bandera + ARS a la izquierda | Píldora "Detalles v" a la derecha */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <FlagArgentina />
                          <span className="text-2xl sm:text-3xl font-black text-foreground leading-tight tracking-tight">
                            ARS
                          </span>
                        </div>
                        {guardado && (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-colors ${
                              expandedArs
                                ? 'bg-primary/20 text-primary border-primary/40'
                                : 'bg-muted/80 text-muted-foreground border-border'
                            }`}
                          >
                            <span>Detalles</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                expandedArs ? 'rotate-180 text-primary' : ''
                              }`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Fila 2: Saldo disponible con ancho completo (cero superposición) */}
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-baseline justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                          Disponible
                        </span>
                        <div className="text-right overflow-hidden flex justify-end">
                          <CurrencyText
                            amount={plataArgentina}
                            currency="ARS"
                            autoFit={true}
                            className={`text-3xl sm:text-4xl font-black tracking-tight justify-end text-right ${
                              !guardado
                                ? 'text-muted-foreground'
                                : plataArgentina < 0
                                ? 'text-red-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedArs && guardado && (
                        <motion.div
                          key="ars-accordion"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-2 border-t border-border/60 bg-muted/30">
                            <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-sm sm:text-base text-muted-foreground pt-1.5">
                              <div>
                                <span className="font-bold text-foreground">Inicial: </span>
                                <span className="font-semibold">${formatMoney(plataArgentinaInicial)}</span>
                              </div>
                              {totalIngresosArs > 0 && (
                                <>
                                  <span className="text-muted-foreground/40 hidden xs:inline">•</span>
                                  <div>
                                    <span className="font-bold text-foreground">Recibido: </span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                                      +${formatMoney(totalIngresosArs)}
                                    </span>
                                  </div>
                                </>
                              )}
                              <span className="text-muted-foreground/40 hidden xs:inline">•</span>
                              <div>
                                <span className="font-bold text-foreground">Gastado: </span>
                                <span className="font-black text-rose-600 dark:text-rose-400">
                                  -${formatMoney(totalGastadoArs)}
                                </span>
                              </div>
                            </div>

                            {/* Botón para cargar plata extra recibida en ARS */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCargarPlataMoneda('Plata Argentina')
                                setIsCargarPlataModalOpen(true)
                              }}
                              className="w-full mt-3 py-3 px-4 rounded-[calc(var(--radius)-4px)] bg-emerald-500/15 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-black text-sm sm:text-base flex items-center justify-center gap-2 select-none touch-manipulation active:scale-[0.98] transition-all"
                            >
                              <CircleDollarSign className="h-5 w-5 stroke-[2.5]" />
                              <span>+ Ingreso para el viaje (ARS)</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Saldo Chile (CLP) como Acordeón */}
                  <div className="mt-3.5 rounded-[var(--radius)] bg-background/90 dark:bg-muted/40 border border-border/80 overflow-hidden transition-all shadow-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedClp(!expandedClp)}
                      className="w-full p-4 sm:p-5 text-left touch-manipulation select-none active:bg-muted/60 transition-colors"
                      aria-expanded={expandedClp}
                    >
                      {/* Fila 1: Bandera + CLP a la izquierda | Píldora "Detalles v" a la derecha */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <FlagChile />
                          <span className="text-2xl sm:text-3xl font-black text-foreground leading-tight tracking-tight">
                            CLP
                          </span>
                        </div>
                        {guardado && (
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-colors ${
                              expandedClp
                                ? 'bg-primary/20 text-primary border-primary/40'
                                : 'bg-muted/80 text-muted-foreground border-border'
                            }`}
                          >
                            <span>Detalles</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                expandedClp ? 'rotate-180 text-primary' : ''
                              }`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Fila 2: Saldo disponible con ancho completo (cero superposición) */}
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-baseline justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
                          Disponible
                        </span>
                        <div className="text-right overflow-hidden flex justify-end">
                          <CurrencyText
                            amount={plataChilena}
                            currency="CLP"
                            autoFit={true}
                            className={`text-3xl sm:text-4xl font-black tracking-tight justify-end text-right ${
                              !guardado
                                ? 'text-muted-foreground'
                                : plataChilena < 0
                                ? 'text-red-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedClp && guardado && (
                        <motion.div
                          key="clp-accordion"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-2 border-t border-border/60 bg-muted/30">
                            <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-sm sm:text-base text-muted-foreground pt-1.5">
                              <div>
                                <span className="font-bold text-foreground">Inicial: </span>
                                <span className="font-semibold">${formatMoney(plataChilenaInicial)}</span>
                              </div>
                              {totalIngresosClp > 0 && (
                                <>
                                  <span className="text-muted-foreground/40 hidden xs:inline">•</span>
                                  <div>
                                    <span className="font-bold text-foreground">Recibido: </span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                                      +${formatMoney(totalIngresosClp)}
                                    </span>
                                  </div>
                                </>
                              )}
                              <span className="text-muted-foreground/40 hidden xs:inline">•</span>
                              <div>
                                <span className="font-bold text-foreground">Gastado: </span>
                                <span className="font-black text-rose-600 dark:text-rose-400">
                                  -${formatMoney(totalGastadoClp)}
                                </span>
                              </div>
                            </div>

                            {/* Botón para cargar plata extra recibida en CLP */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCargarPlataMoneda('Plata Chilena')
                                setIsCargarPlataModalOpen(true)
                              }}
                              className="w-full mt-3 py-3 px-4 rounded-[calc(var(--radius)-4px)] bg-emerald-500/15 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 font-black text-sm sm:text-base flex items-center justify-center gap-2 select-none touch-manipulation active:scale-[0.98] transition-all"
                            >
                              <CircleDollarSign className="h-5 w-5 stroke-[2.5]" />
                              <span>+ Ingreso para el viaje (CLP)</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </GlowCard>

                {/* Si NO hay viaje activo: Tarjeta para iniciar viaje */}
                {!guardado && (
                  <Card className="border-dashed border-2 border-primary/30 bg-primary/5 p-7 sm:p-8 text-center space-y-5 rounded-[var(--radius)]">
                    <div className="p-4 bg-primary/10 text-primary w-20 h-20 rounded-full mx-auto flex items-center justify-center">
                      <Truck className="h-10 w-10" strokeWidth={2.4} />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                        No hay ningún viaje en curso
                      </h3>
                      <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
                        Iniciá un viaje ingresando la plata con la que arrancás en pesos argentinos y chilenos y el destino.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => setIsInitTripModalOpen(true)}
                      className="w-full py-8 text-2xl sm:text-3xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-[var(--radius)] flex items-center justify-center gap-3.5 shadow-xl shadow-primary/30"
                    >
                      <Plus className="w-8 h-8 stroke-[3]" />
                      Iniciar Nuevo Viaje
                    </Button>
                  </Card>
                )}

                {/* Si HAY viaje activo: Botones de Acción + Resumen de Últimos Gastos + Gráficos del Viaje + Botón Terminar */}
                {guardado && (
                  <div className="space-y-5">
                    {/* Botón Principal para Agregar Gasto */}
                    <Button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full py-9 text-2xl sm:text-3xl md:text-4xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-[var(--radius)] flex items-center justify-center gap-3.5 shadow-xl shadow-primary/35"
                    >
                      <CirclePlus className="w-10 h-10 sm:w-11 sm:h-11 shrink-0" strokeWidth={2.5} />
                      Agregar Gasto
                    </Button>

                    {/* 2. Resumen de los Últimos Gastos */}
                    <Card className="rounded-[var(--radius)]">
                      <CardHeader className="pb-3.5 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
                          <Clock className="w-6 h-6 text-primary" strokeWidth={2.4} />
                          Últimos gastos registrados
                        </CardTitle>
                        {gastos.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('gastos')}
                            className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            Ver todos ({gastos.length})
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </CardHeader>

                      <CardContent>
                        {ultimosGastos.length === 0 ? (
                          <p className="text-center text-base font-semibold text-muted-foreground py-6">
                            Todavía no registraste gastos en este viaje. Tocá <strong>Agregar Gasto</strong> para empezar.
                          </p>
                        ) : (
                          <div className="divide-y divide-border/60">
                            {ultimosGastos.map((g) => (
                              <div
                                key={g.id}
                                className="py-3.5 flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-black text-base sm:text-lg break-words ${
                                      g.esIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                                    }`}>
                                      {g.esIngreso ? `[+] ${g.tipoGasto}` : g.tipoGasto}
                                    </span>
                                    <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground shrink-0">
                                      {g.tipoPlata === 'Plata Argentina' ? '🇦🇷 ARS' : '🇨🇱 CLP'}
                                    </span>
                                    {g.esIngreso && (
                                      <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                                        Ingreso
                                      </span>
                                    )}
                                    {g.dias && (
                                      <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold shrink-0">
                                        {g.dias} día{g.dias > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  {g.descripcion && (
                                    <p className="text-sm text-muted-foreground mt-0.5 break-words">
                                      {g.descripcion}
                                    </p>
                                  )}
                                  <span className="text-xs sm:text-sm text-muted-foreground block mt-0.5 font-bold">
                                    {g.fecha}
                                  </span>
                                </div>

                                <div className="shrink-0 text-right">
                                  <CurrencyText
                                    amount={g.monto}
                                    currency={g.tipoPlata === 'Plata Argentina' ? 'ARS' : 'CLP'}
                                    sign={g.esIngreso ? 'plus' : 'minus'}
                                    className={`font-black text-lg sm:text-2xl ${
                                      g.esIngreso
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 3. Gráficos Propios del Viaje Actual (Categorías y Gastado vs Disponible) */}
                    <TripCharts
                      gastos={gastos}
                      plataArgentinaInicial={plataArgentinaInicial}
                      plataChilenaInicial={plataChilenaInicial}
                      plataArgentina={plataArgentina}
                      plataChilena={plataChilena}
                      themeColor={tripState.themeColor}
                    />

                    {/* 4. Acciones: Exportar PDF y Terminar Viaje */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => exportTripPDF(tripState)}
                        className="w-full py-6 text-lg sm:text-xl font-black rounded-[var(--radius)] border-2 border-primary/40 bg-primary/10 text-primary flex items-center justify-center gap-2.5"
                      >
                        <FileDown className="w-6 h-6" />
                        Exportar PDF
                      </Button>

                      {/* Botón Terminar Viaje (Pasa al Historial) */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={terminarViaje}
                        className="w-full py-6 text-lg sm:text-xl font-black rounded-[var(--radius)] border-2 border-rose-500/40 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2.5"
                      >
                        <Flag className="w-6 h-6" />
                        Terminar Viaje
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: GASTOS (Lista Completa, Filtros, Buscador y Eliminar) */}
            {activeTab === 'gastos' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="bg-card p-3.5 rounded-[var(--radius)] border border-border shadow-xs space-y-3">
                  {/* Selector de Moneda */}
                  <div className="grid grid-cols-3 bg-muted/90 p-1.5 rounded-[calc(var(--radius)-2px)] text-sm sm:text-base gap-1.5 border border-border/60">
                    <button
                      type="button"
                      onClick={() => setMonedaFilter('all')}
                      className={`py-3 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center font-black select-none touch-manipulation ${
                        monedaFilter === 'all'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Ambas ({gastos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonedaFilter('Plata Argentina')}
                      className={`py-3 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center font-black select-none touch-manipulation ${
                        monedaFilter === 'Plata Argentina'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      🇦🇷 Argentina
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonedaFilter('Plata Chilena')}
                      className={`py-3 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center font-black select-none touch-manipulation ${
                        monedaFilter === 'Plata Chilena'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      🇨🇱 Chilena
                    </button>
                  </div>

                  {/* Buscador + Botón PDF */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar gasto por categoría, nota o fecha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-14 text-base sm:text-lg font-bold rounded-[var(--radius)]"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!guardado || gastos.length === 0}
                      onClick={() => exportTripPDF(tripState)}
                      className="h-14 px-5 text-base font-black rounded-[var(--radius)] gap-2 shrink-0 disabled:opacity-40"
                    >
                      <FileDown className="h-5 w-5" />
                      PDF
                    </Button>
                  </div>
                </div>

                <Card className="rounded-[var(--radius)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg sm:text-xl font-black">
                      Detalle de Gastos ({filteredGastos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    {!guardado ? (
                      <div className="py-12 text-center text-muted-foreground space-y-3.5">
                        <Truck className="h-10 w-10 mx-auto text-primary/60" />
                        <p className="font-bold text-lg">No hay ningún viaje activo en este momento.</p>
                        <Button
                          type="button"
                          onClick={() => setIsInitTripModalOpen(true)}
                          className="h-14 px-6 text-xl font-black rounded-[var(--radius)]"
                        >
                          Iniciar Viaje
                        </Button>
                      </div>
                    ) : filteredGastos.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground font-bold text-base">
                        No hay gastos registrados con este filtro.
                      </div>
                    ) : (
                      filteredGastos.map((g) => (
                        <div
                          key={g.id}
                          className="py-4 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-black text-lg sm:text-xl break-words ${
                                g.esIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                              }`}>
                                {g.esIngreso ? `[+] ${g.tipoGasto}` : g.tipoGasto}
                              </span>
                              <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground shrink-0">
                                {g.tipoPlata === 'Plata Argentina' ? '🇦🇷 ARS' : '🇨🇱 CLP'}
                              </span>
                              {g.esIngreso && (
                                <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                                  Ingreso
                                </span>
                              )}
                              {g.dias && (
                                <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold shrink-0">
                                  {g.dias} día{g.dias > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {g.descripcion && (
                              <p className="text-sm text-muted-foreground mt-0.5 break-words">
                                {g.descripcion}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-bold">
                              {g.fecha}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <CurrencyText
                                amount={g.monto}
                                currency={g.tipoPlata === 'Plata Argentina' ? 'ARS' : 'CLP'}
                                sign={g.esIngreso ? 'plus' : 'minus'}
                                className={`font-black text-lg sm:text-2xl ${
                                  g.esIngreso
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => eliminarGasto(g.id)}
                              className="h-11 w-11 p-0 rounded-[calc(var(--radius)-4px)]"
                              title={g.esIngreso ? 'Eliminar ingreso' : 'Eliminar gasto'}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PESTAÑA 3: HISTORIAL DE VIAJES ANTERIORES (Reemplaza la pestaña de Gráficos) */}
            {activeTab === 'history' && (
              <TripHistoryTab
                history={history}
                onDeleteTrip={handleDeleteTripFromHistory}
              />
            )}

            {/* PESTAÑA 4: AJUSTES (Chofer, Colores, Bordes, Categorías Personalizables) */}
            {activeTab === 'settings' && (
              <TripSettingsTab
                tripState={tripState}
                onUpdateState={handleUpdatePartial}
                onResetTrip={terminarViaje}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra de Navegación Inferior Unificada: Viaje, Gastos, [+], Historial, Ajustes */}
      <nav className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-xl border-t sm:border border-border z-40 sm:bottom-4 sm:max-w-lg sm:mx-auto sm:rounded-3xl sm:shadow-2xl pb-safe">
        <div className="flex items-center justify-around h-20 sm:h-22 px-1 relative">
          {/* Tab 1: Viaje */}
          <button
            type="button"
            onClick={() => setActiveTab('trip')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 mx-0.5 rounded-2xl transition-all select-none touch-manipulation ${
              activeTab === 'trip'
                ? 'text-primary font-black bg-primary/15'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Truck className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.4]" />
            <span className="text-xs sm:text-sm font-black">Viaje</span>
          </button>

          {/* Tab 2: Gastos */}
          <button
            type="button"
            onClick={() => setActiveTab('gastos')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 mx-0.5 rounded-2xl transition-all select-none touch-manipulation ${
              activeTab === 'gastos'
                ? 'text-primary font-black bg-primary/15'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Receipt className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.4]" />
            <span className="text-xs sm:text-sm font-black">Gastos</span>
          </button>

          {/* Botón Central [+] Elevado */}
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (!guardado) {
                  setIsInitTripModalOpen(true)
                } else {
                  setIsAddModalOpen(true)
                }
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 -mt-7 sm:-mt-10 shrink-0 rounded-full bg-gradient-to-tr from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center ring-4 ring-background transition-all active:scale-95 duration-150 ease-out select-none touch-manipulation cursor-pointer"
              title={guardado ? 'Agregar Gasto del Viaje' : 'Iniciar Nuevo Viaje'}
            >
              <Plus className="h-8 w-8 sm:h-10 sm:w-10 stroke-[3]" />
            </button>
          </div>

          {/* Tab 3: Historial (Reemplaza a Gráficos) */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 mx-0.5 rounded-2xl transition-all select-none touch-manipulation ${
              activeTab === 'history'
                ? 'text-primary font-black bg-primary/15'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <History className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.4]" />
            <span className="text-xs sm:text-sm font-black">Historial</span>
          </button>

          {/* Tab 4: Ajustes */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 mx-0.5 rounded-2xl transition-all select-none touch-manipulation ${
              activeTab === 'settings'
                ? 'text-primary font-black bg-primary/15'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.4]" />
            <span className="text-xs sm:text-sm font-black">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Modal 1: Iniciar Nuevo Viaje (se abre la primera vez que toca [+]) */}
      <InitTripModal
        open={isInitTripModalOpen}
        onOpenChange={setIsInitTripModalOpen}
        onInitTrip={handleInitTrip}
        initialDestino={destino}
      />

      {/* Modal 2: Agregar Gasto (se abre cuando ya hay un viaje activo) */}
      <AddGastoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        categories={tripState.categories || DEFAULT_TRUCK_CATEGORIES}
        onAddCategory={handleAddCategory}
        defaultMoneda={monedaFilter === 'Plata Chilena' ? 'Plata Chilena' : 'Plata Argentina'}
        onAddGasto={handleAddGasto}
      />

      {/* Modal 3: Cargar Plata Recibida (se abre desde el botón en el acordeón de ARS o CLP) */}
      <CargarPlataModal
        open={isCargarPlataModalOpen}
        onOpenChange={setIsCargarPlataModalOpen}
        moneda={cargarPlataMoneda}
        onCargarPlata={handleCargarPlata}
      />
    </div>
  )
}

export default App
