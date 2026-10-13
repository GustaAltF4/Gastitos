import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  RotateCw,
  Newspaper,
  Save,
  FileDown,
  Trash2,
  Plus,
  Receipt,
  Settings,
  BarChart3,
  CirclePlus,
  Search,
  Lock,
} from 'lucide-react'
import { TripMenu } from './components/TripMenu'
import { AddGastoModal } from './components/AddGastoModal'
import { TripSettingsTab } from './components/TripSettingsTab'
import { FinanceDashboard } from './components/FinanceDashboard'
import { GlowCard } from './components/react-bits/GlowCard'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { RADIUS_VALUES } from './services/storage'
import {
  tripStorage,
  TripState,
  GastoViaje,
  TipoPlata,
  DEFAULT_TRUCK_CATEGORIES,
} from './services/tripStorage'
import { exportTripPDF } from './services/tripPdf'
import { Transaction } from './types/finance'
import { getLocalDateString } from './lib/utils'

function FlagArgentina() {
  return (
    <svg
      viewBox="0 0 36 24"
      className="w-10 h-7 rounded-md shadow-xs shrink-0 border border-black/15"
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
      className="w-10 h-7 rounded-md shadow-xs shrink-0 border border-black/15"
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

  const [inputArs, setInputArs] = useState('')
  const [inputClp, setInputClp] = useState('')
  const [loaded, setLoaded] = useState(false)

  const [activeTab, setActiveTab] = useState<'trip' | 'gastos' | 'charts' | 'settings'>('trip')
  const [monedaFilter, setMonedaFilter] = useState<'all' | TipoPlata>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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
      const saved = await tripStorage.loadState()
      setTripState(saved)
      setInputArs(saved.guardado ? String(saved.plataArgentina) : '')
      setInputClp(saved.guardado ? String(saved.plataChilena) : '')
      applyThemeClasses(saved.darkMode, saved.themeColor, saved.borderRadius)
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

  const isInitialFormValid =
    inputArs.trim() !== '' &&
    inputClp.trim() !== '' &&
    tripState.destino.trim() !== ''

  const guardarInicioViaje = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isInitialFormValid) {
      alert('Por favor completa la Plata Inicial Argentina, Plata Inicial Chilena y el Destino del viaje.')
      return
    }

    const arsNum = parseFloat(inputArs) || 0
    const clpNum = parseFloat(inputClp) || 0

    const next: TripState = {
      ...tripState,
      plataArgentina: arsNum,
      plataChilena: clpNum,
      plataArgentinaInicial: arsNum,
      plataChilenaInicial: clpNum,
      destino: tripState.destino.trim(),
      guardado: true,
    }
    await updateAndPersist(next)
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
      gastos: [...tripState.gastos, nuevoGasto],
    }

    await updateAndPersist(next)
  }

  const eliminarGasto = async (idOrIndex: string | number) => {
    const confirmado = window.confirm('¿Estás seguro que querés eliminar este gasto?')
    if (!confirmado) return

    const index =
      typeof idOrIndex === 'number'
        ? idOrIndex
        : tripState.gastos.findIndex((g) => g.id === idOrIndex)
    const gasto = tripState.gastos[index]
    if (!gasto) return

    let nuevaArs = tripState.plataArgentina
    let nuevaClp = tripState.plataChilena

    if (gasto.tipoPlata === 'Plata Argentina') {
      nuevaArs += gasto.monto
    } else if (gasto.tipoPlata === 'Plata Chilena') {
      nuevaClp += gasto.monto
    }

    const nuevosGastos = tripState.gastos.filter((_, i) => i !== index)

    let runningArs = tripState.plataArgentinaInicial
    let runningClp = tripState.plataChilenaInicial
    const gastosRecalculados = nuevosGastos.map((g) => {
      if (g.tipoPlata === 'Plata Argentina') {
        runningArs -= g.monto
        return { ...g, totalRestante: runningArs }
      } else {
        runningClp -= g.monto
        return { ...g, totalRestante: runningClp }
      }
    })

    const next: TripState = {
      ...tripState,
      plataArgentina: nuevaArs,
      plataChilena: nuevaClp,
      gastos: gastosRecalculados,
    }

    await updateAndPersist(next)
  }

  const resetViaje = async () => {
    const confirmado = window.confirm(
      '¿Estás seguro que querés reiniciar todo? Esto borrará la plata y los gastos para empezar un viaje nuevo.'
    )
    if (!confirmado) return

    const fresh = await tripStorage.resetTrip(tripState)
    setTripState(fresh)
    setInputArs('')
    setInputClp('')
    setActiveTab('trip')
  }

  // Gastos filtrados para la vista de lista/tabla
  const filteredGastos = useMemo(() => {
    return tripState.gastos
      .map((g, originalIndex) => ({ ...g, originalIndex }))
      .filter((g) => {
        const matchesMoneda = monedaFilter === 'all' || g.tipoPlata === monedaFilter
        const matchesSearch =
          !searchTerm.trim() ||
          g.tipoGasto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.descripcion && g.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
          g.fecha.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesMoneda && matchesSearch
      })
  }, [tripState.gastos, monedaFilter, searchTerm])

  // Adaptador para los gráficos (enfocado en Gastos del viaje y saldos restantes)
  const { dashboardTransactions, arsSummary, clpSummary } = useMemo(() => {
    const todayIso = getLocalDateString()
    const txs: Transaction[] = []

    let arsGastado = 0
    let clpGastado = 0

    tripState.gastos.forEach((g, idx) => {
      const isClp = g.tipoPlata === 'Plata Chilena'
      if (isClp) clpGastado += g.monto
      else arsGastado += g.monto

      txs.push({
        id: g.id || `g-${idx}`,
        type: 'expense',
        amount: g.monto,
        category: g.tipoGasto,
        scope: isClp ? 'business' : 'personal',
        date: todayIso,
        description: g.descripcion || g.tipoGasto,
        createdAt: todayIso,
      })
    })

    return {
      dashboardTransactions: txs,
      arsSummary: {
        income: tripState.plataArgentinaInicial,
        expense: arsGastado,
        balance: tripState.plataArgentina,
        carryOver: 0,
      },
      clpSummary: {
        income: tripState.plataChilenaInicial,
        expense: clpGastado,
        balance: tripState.plataChilena,
        carryOver: 0,
      },
    }
  }, [tripState])

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
          'calc(6.5rem + max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      {/* Cabecera Superior Limpia */}
      <TripMenu
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        nombre={nombre}
        destino={destino}
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
            {/* PESTAÑA 1: VIAJE PRINCIPAL */}
            {activeTab === 'trip' && (
              <div className="space-y-5 max-w-xl mx-auto">
                {/* Tarjeta Principal de Saldos ARS y CLP con GlowCard */}
                <GlowCard
                  glowColor={
                    plataArgentina >= 0 && plataChilena >= 0
                      ? 'hsl(var(--primary) / 0.28)'
                      : 'rgba(239, 68, 68, 0.25)'
                  }
                  className="bg-gradient-to-br from-card via-card to-muted/30 border border-border/80"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-[var(--radius)] bg-primary/15 text-primary">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-tight">
                          {guardado && destino ? `Viaje a ${destino}` : 'Plata Disponible'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {guardado
                            ? `${gastos.length} gasto${gastos.length === 1 ? '' : 's'} registrado${
                                gastos.length === 1 ? '' : 's'
                              }`
                            : 'Completa el formulario de abajo para empezar'}
                        </p>
                      </div>
                    </div>

                    {guardado && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => exportTripPDF(tripState)}
                        className="rounded-[var(--radius)] border-primary/40 text-primary font-bold gap-1.5"
                      >
                        <FileDown className="h-4 w-4" />
                        PDF
                      </Button>
                    )}
                  </div>

                  {/* Saldo Argentina (ARS) */}
                  <div className="p-4 rounded-[var(--radius)] bg-background/80 dark:bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FlagArgentina />
                      <div>
                        <span className="text-lg sm:text-xl font-extrabold text-foreground block leading-tight">
                          ARS (Argentina)
                        </span>
                        {guardado && (
                          <span className="text-xs text-muted-foreground">
                            Inicial: ${formatMoney(plataArgentinaInicial)} • Gastado: $
                            {formatMoney(arsSummary.expense)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-2xl sm:text-3xl font-black tracking-tight ${
                        plataArgentina < 0
                          ? 'text-red-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      ${formatMoney(plataArgentina)}
                    </span>
                  </div>

                  {/* Saldo Chile (CLP) */}
                  <div className="mt-3 p-4 rounded-[var(--radius)] bg-background/80 dark:bg-muted/30 border border-border/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FlagChile />
                      <div>
                        <span className="text-lg sm:text-xl font-extrabold text-foreground block leading-tight">
                          CLP (Chilena)
                        </span>
                        {guardado && (
                          <span className="text-xs text-muted-foreground">
                            Inicial: ${formatMoney(plataChilenaInicial)} • Gastado: $
                            {formatMoney(clpSummary.expense)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-2xl sm:text-3xl font-black tracking-tight ${
                        plataChilena < 0
                          ? 'text-red-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      ${formatMoney(plataChilena)}
                    </span>
                  </div>
                </GlowCard>

                {/* ESTADO 1: FORMULARIO INICIAL OBLIGATORIO (!guardado) */}
                {!guardado && (
                  <Card className="border-border/80 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold text-center">
                        Iniciar Nuevo Viaje
                      </CardTitle>
                      <p className="text-sm text-muted-foreground text-center">
                        Ingresa la plata inicial en pesos argentinos y chilenos y el destino del viaje para habilitar la carga de gastos.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={guardarInicioViaje} className="space-y-4">
                        <div>
                          <label className="text-base font-bold text-foreground block mb-1.5">
                            🇦🇷 Plata Inicial Argentina (ARS)
                          </label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            required
                            placeholder="Ej: 150000"
                            className="w-full h-14 !text-2xl font-extrabold rounded-[var(--radius)] px-4"
                            value={inputArs}
                            onChange={(e) => {
                              const val = e.target.value
                              setInputArs(val)
                              setTripState((prev) => ({
                                ...prev,
                                plataArgentina: parseFloat(val) || 0,
                              }))
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-base font-bold text-foreground block mb-1.5">
                            🇨🇱 Plata Inicial Chilena (CLP)
                          </label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            required
                            placeholder="Ej: 200000"
                            className="w-full h-14 !text-2xl font-extrabold rounded-[var(--radius)] px-4"
                            value={inputClp}
                            onChange={(e) => {
                              const val = e.target.value
                              setInputClp(val)
                              setTripState((prev) => ({
                                ...prev,
                                plataChilena: parseFloat(val) || 0,
                              }))
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-base font-bold text-foreground block mb-1.5">
                            📍 Destino del viaje
                          </label>
                          <Input
                            type="text"
                            required
                            placeholder="Ej: Santiago de Chile"
                            className="w-full h-14 !text-2xl font-bold rounded-[var(--radius)] px-4"
                            value={destino}
                            onChange={(e) =>
                              setTripState((prev) => ({ ...prev, destino: e.target.value }))
                            }
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={!isInitialFormValid}
                          className="w-full py-7 text-2xl font-extrabold bg-primary hover:bg-primary/90 text-primary-foreground rounded-[var(--radius)] flex items-center justify-center gap-3 shadow-lg shadow-primary/25 mt-2 disabled:opacity-40"
                        >
                          <Save className="w-7 h-7" />
                          Guardar
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* ESTADO 2: VIAJE EN CURSO (guardado === true) */}
                {guardado && (
                  <div className="space-y-4">
                    {/* Botón Gigante Agregar Gasto */}
                    <Button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full py-8 text-2xl sm:text-3xl font-extrabold bg-primary hover:bg-primary/90 text-primary-foreground rounded-[var(--radius)] flex items-center justify-center gap-3 shadow-lg shadow-primary/30 active:scale-[0.98]"
                    >
                      <CirclePlus className="w-9 h-9 shrink-0" />
                      Agregar Gasto
                    </Button>

                    {/* Botón Reiniciar Viaje */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetViaje}
                      className="w-full py-6 text-xl sm:text-2xl font-bold rounded-[var(--radius)] border-2 flex items-center justify-center gap-2.5"
                    >
                      <RotateCw className="w-6 h-6" />
                      Reiniciar Viaje
                    </Button>

                    {/* Lista rápida de Gastos Registrados + Exportar PDF */}
                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                            <Newspaper className="w-5 h-5 text-primary" />
                            Gastos registrados ({gastos.length})
                          </CardTitle>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => exportTripPDF(tripState)}
                            className="rounded-[var(--radius)] border-primary/40 bg-primary/10 text-primary font-bold gap-2"
                          >
                            <FileDown className="w-4 h-4" />
                            Exportar PDF
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        {gastos.length === 0 ? (
                          <p className="text-center text-lg font-semibold text-muted-foreground py-6">
                            No hay gastos todavía. Tocá "Agregar Gasto" o el botón + de abajo.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-[var(--radius)] border border-border">
                            <table className="w-full text-left border-collapse text-sm sm:text-base">
                              <thead>
                                <tr className="bg-muted/70 border-b border-border text-muted-foreground">
                                  <th className="p-3 font-bold">Fecha</th>
                                  <th className="p-3 font-bold">Tipo de Gasto</th>
                                  <th className="p-3 font-bold">Monto</th>
                                  <th className="p-3 font-bold">Tipo plata</th>
                                  <th className="p-3 font-bold text-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {gastos.map((g, i) => (
                                  <tr key={g.id || i} className="hover:bg-muted/30">
                                    <td className="p-3 whitespace-nowrap">{g.fecha}</td>
                                    <td className="p-3 font-bold">
                                      <div>{g.tipoGasto}</div>
                                      {g.descripcion && (
                                        <div className="text-xs text-muted-foreground font-normal">
                                          {g.descripcion}
                                        </div>
                                      )}
                                      {g.dias && (
                                        <div className="text-xs text-primary font-semibold">
                                          {g.dias} día{g.dias > 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 font-extrabold whitespace-nowrap text-rose-600 dark:text-rose-400">
                                      ${formatMoney(g.monto)}
                                    </td>
                                    <td className="p-3 whitespace-nowrap font-medium">
                                      {g.tipoPlata === 'Plata Argentina'
                                        ? '🇦🇷 Argentina'
                                        : '🇨🇱 Chilena'}
                                    </td>
                                    <td className="p-3 text-right">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => eliminarGasto(i)}
                                        className="rounded-[calc(var(--radius)-4px)] font-bold"
                                      >
                                        <Trash2 className="w-4 h-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Eliminar</span>
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: GASTOS (Con filtro por moneda, buscador y exportar PDF) */}
            {activeTab === 'gastos' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="bg-card p-3.5 rounded-[var(--radius)] border border-border shadow-xs space-y-3">
                  {/* Selector de Moneda */}
                  <div className="grid grid-cols-3 bg-muted/90 p-1 rounded-[calc(var(--radius)-2px)] text-xs sm:text-sm gap-1 border border-border/60">
                    <button
                      type="button"
                      onClick={() => setMonedaFilter('all')}
                      className={`py-2.5 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center font-bold active:scale-95 touch-manipulation select-none ${
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
                      className={`py-2.5 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center font-bold active:scale-95 touch-manipulation select-none ${
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
                      className={`py-2.5 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center font-bold active:scale-95 touch-manipulation select-none ${
                        monedaFilter === 'Plata Chilena'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      🇨🇱 Chilena
                    </button>
                  </div>

                  {/* Buscador + Botón PDF */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar gasto por categoría, nota o fecha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-11 rounded-[var(--radius)]"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!guardado}
                      onClick={() => exportTripPDF(tripState)}
                      className="h-11 px-4 rounded-[var(--radius)] font-bold gap-1.5 shrink-0 disabled:opacity-40"
                    >
                      <FileDown className="h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">
                      Detalle de Gastos ({filteredGastos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    {!guardado ? (
                      <div className="py-10 text-center text-muted-foreground space-y-2">
                        <Lock className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="font-semibold">
                          Primero completa la plata inicial y el destino en la pestaña "Viaje".
                        </p>
                      </div>
                    ) : filteredGastos.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground">
                        No hay gastos registrados con este filtro.
                      </div>
                    ) : (
                      filteredGastos.map((g) => (
                        <div
                          key={g.id || g.originalIndex}
                          className="py-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base text-foreground">
                                {g.tipoGasto}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-semibold">
                                {g.tipoPlata === 'Plata Argentina' ? '🇦🇷 ARS' : '🇨🇱 CLP'}
                              </span>
                              {g.dias && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                                  {g.dias} día{g.dias > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {g.descripcion && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {g.descripcion}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {g.fecha} • Quedaban: ${formatMoney(g.totalRestante)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-extrabold text-base sm:text-lg text-rose-600 dark:text-rose-400">
                              -${formatMoney(g.monto)}
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => eliminarGasto(g.originalIndex)}
                              className="h-9 w-9 p-0 rounded-[calc(var(--radius)-4px)]"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PESTAÑA 3: GRÁFICOS Y ESTADÍSTICAS DE GASTOS DEL VIAJE */}
            {activeTab === 'charts' && (
              <FinanceDashboard
                transactions={dashboardTransactions}
                allPeriodTransactions={dashboardTransactions}
                allTransactions={dashboardTransactions}
                currency="ARS"
                themeColor={tripState.themeColor}
                account1Name="Plata Argentina (ARS)"
                account2Name="Plata Chilena (CLP)"
                account1Emoji="🇦🇷"
                account2Emoji="🇨🇱"
                account1Summary={arsSummary}
                account2Summary={clpSummary}
              />
            )}

            {/* PESTAÑA 4: AJUSTES (Nombre del Chofer, Colores, Bordes, Categorías Personalizables) */}
            {activeTab === 'settings' && (
              <TripSettingsTab
                tripState={tripState}
                onUpdateState={handleUpdatePartial}
                onExportPdf={() => exportTripPDF(tripState)}
                onResetTrip={resetViaje}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra de Navegación Inferior Unificada con Botón Central [+] (Bloqueado hasta guardar viaje inicial) */}
      <nav className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-xl border-t sm:border border-border z-40 sm:bottom-4 sm:max-w-lg sm:mx-auto sm:rounded-3xl sm:shadow-2xl pb-safe">
        <div className="flex items-center justify-around h-16 px-1 relative">
          {/* Tab 1: Viaje */}
          <button
            type="button"
            onClick={() => setActiveTab('trip')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'trip'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Truck className="h-5 w-5" />
            <span className="text-[10px]">Viaje</span>
          </button>

          {/* Tab 2: Gastos */}
          <button
            type="button"
            onClick={() => setActiveTab('gastos')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'gastos'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-[10px]">Gastos</span>
          </button>

          {/* Botón Central [+] Elevado (Deshabilitado si !guardado) */}
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              disabled={!guardado}
              onClick={() => {
                if (guardado) setIsAddModalOpen(true)
              }}
              className={`relative h-16 w-16 -mt-7 shrink-0 rounded-[var(--radius)] flex items-center justify-center ring-4 ring-background transition-all duration-150 ease-out select-none touch-manipulation ${
                guardado
                  ? 'bg-gradient-to-tr from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-xl shadow-primary/40 active:scale-90 active:rotate-90 active:ring-primary/40 cursor-pointer'
                  : 'bg-muted text-muted-foreground/50 border border-border opacity-50 cursor-not-allowed'
              }`}
              title={
                guardado
                  ? 'Agregar Gasto del Viaje'
                  : 'Primero completa y guarda la plata inicial y el destino'
              }
            >
              <Plus className="h-8 w-8 stroke-[2.8]" />
              {!guardado && (
                <Lock className="h-3.5 w-3.5 absolute bottom-1.5 right-1.5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Tab 3: Gráficos */}
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'charts'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px]">Gráficos</span>
          </button>

          {/* Tab 4: Ajustes */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'settings'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Modal para Agregar Gasto */}
      <AddGastoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        categories={tripState.categories || DEFAULT_TRUCK_CATEGORIES}
        onAddCategory={handleAddCategory}
        defaultMoneda={monedaFilter === 'Plata Chilena' ? 'Plata Chilena' : 'Plata Argentina'}
        onAddGasto={handleAddGasto}
      />
    </div>
  )
}

export default App
