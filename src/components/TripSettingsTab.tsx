import { useState } from 'react'
import { ThemeColor, BorderRadius } from '../services/storage'
import { TripState, DEFAULT_TRUCK_CATEGORIES } from '../services/tripStorage'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Palette,
  Maximize2,
  Tag,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  User,
  ShieldAlert,
  Moon,
  Sun,
} from 'lucide-react'

interface TripSettingsTabProps {
  tripState: TripState
  onUpdateState: (partial: Partial<TripState>) => void
  onResetTrip: () => void
}

const COLOR_OPTIONS: { id: ThemeColor; name: string; bgClass: string }[] = [
  { id: 'emerald', name: 'Esmeralda', bgClass: 'bg-emerald-500' },
  { id: 'indigo', name: 'Índigo', bgClass: 'bg-indigo-600' },
  { id: 'violet', name: 'Violeta', bgClass: 'bg-violet-600' },
  { id: 'amber', name: 'Ámbar', bgClass: 'bg-amber-500' },
  { id: 'cyan', name: 'Cian', bgClass: 'bg-cyan-500' },
  { id: 'rose', name: 'Rosa', bgClass: 'bg-[#dd0081]' },
  { id: 'neutral', name: 'Neutral / Gris', bgClass: 'bg-zinc-500 dark:bg-zinc-300' },
]

const RADIUS_OPTIONS: { id: BorderRadius; name: string; previewPx: string }[] = [
  { id: 'none', name: 'Recto', previewPx: 'rounded-none' },
  { id: 'sm', name: 'Sutil', previewPx: 'rounded-[6px]' },
  { id: 'md', name: 'Estándar', previewPx: 'rounded-[12px]' },
  { id: 'lg', name: 'Redondo', previewPx: 'rounded-[18px]' },
  { id: 'full', name: 'Curvo', previewPx: 'rounded-[26px]' },
]

export function TripSettingsTab({
  tripState,
  onUpdateState,
  onResetTrip,
}: TripSettingsTabProps) {
  const [newCatInput, setNewCatInput] = useState('')
  const categories =
    tripState.categories && tripState.categories.length > 0
      ? tripState.categories
      : DEFAULT_TRUCK_CATEGORIES

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim()
    if (!trimmed) return
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoría ya existe.')
      return
    }
    onUpdateState({ categories: [...categories, trimmed] })
    setNewCatInput('')
  }

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      alert('Debes mantener al menos una categoría.')
      return
    }
    onUpdateState({ categories: categories.filter((c) => c !== catToRemove) })
  }

  const handleResetCategories = () => {
    onUpdateState({ categories: [...DEFAULT_TRUCK_CATEGORIES] })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Perfil del Chofer */}
      <Card className="rounded-[var(--radius)]">
        <CardHeader className="pb-3.5">
          <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
            <User className="h-6 w-6 text-primary" />
            Datos del Chofer
          </CardTitle>
          <CardDescription className="text-sm sm:text-base font-medium">
            El nombre del chofer queda guardado aquí para incluirse automáticamente en todos los resúmenes PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Nombre del Chofer
            </label>
            <Input
              value={tripState.nombre}
              onChange={(e) => onUpdateState({ nombre: e.target.value })}
              placeholder="Ej: Papá / Nombre y Apellido"
              className="h-14 text-xl font-bold rounded-[var(--radius)] px-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Personalización Visual (Colores, Bordes & Tema) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Paleta de Colores y Formas
          </CardTitle>
          <CardDescription>
            Elige el color principal de la aplicación, la forma de los botones y el modo oscuro o claro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selector de Color de Acento */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              Color de Acento Principal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {COLOR_OPTIONS.map((col) => {
                const isSelected = tripState.themeColor === col.id
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => onUpdateState({ themeColor: col.id })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-[var(--radius)] border transition-all active:scale-95 touch-manipulation select-none ${
                      isSelected
                        ? 'border-primary bg-primary/15 shadow-sm ring-2 ring-primary/30 scale-102'
                        : 'border-border active:bg-primary/10 active:border-primary/40'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full ${col.bgClass} flex items-center justify-center text-white shadow-sm`}
                    >
                      {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium text-foreground text-center leading-tight">
                      {col.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Control de Redondeo de Bordes */}
          <div className="pt-4 border-t border-border">
            <div className="mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-primary" />
                Forma y Redondeo de Bordes
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cambia las esquinas de todos los botones, tarjetas y cuadros de texto.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = (tripState.borderRadius || 'lg') === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateState({ borderRadius: opt.id })}
                    className={`flex flex-col items-center justify-center p-3 border transition-all active:scale-95 touch-manipulation select-none ${opt.previewPx} ${
                      isSelected
                        ? 'border-primary bg-primary/15 ring-2 ring-primary/30 font-bold'
                        : 'border-border active:bg-primary/10 active:border-primary/40'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 border-2 border-primary mb-1.5 ${opt.previewPx} flex items-center justify-center`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />}
                    </div>
                    <span className="text-xs text-foreground font-semibold">{opt.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Modo Oscuro / Claro */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                {tripState.darkMode ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
                {tripState.darkMode ? 'Modo Nocturno Activado' : 'Modo Claro Activado'}
              </span>
              <p className="text-xs text-muted-foreground">
                Ideal para no encandilar la vista manejando de noche o con sol de frente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateState({ darkMode: !tripState.darkMode })}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out active:scale-90 touch-manipulation focus:outline-none ${
                tripState.darkMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out text-xs leading-none ${
                  tripState.darkMode ? 'translate-x-5 text-zinc-900' : 'translate-x-0 text-amber-500'
                }`}
              >
                {tripState.darkMode ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Gestión de Categorías del Camión */}
      <Card className="rounded-[var(--radius)]">
        <CardHeader className="pb-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <Tag className="h-6 w-6 text-primary" />
              Categorías de Gastos del Viaje
            </CardTitle>
            <button
              type="button"
              onClick={handleResetCategories}
              className="text-xs sm:text-sm text-primary bg-primary/10 border border-primary/25 font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full select-none"
              title="Restablecer a las 10 categorías originales del camión"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer originales
            </button>
          </div>
          <CardDescription className="text-sm sm:text-base font-medium">
            Personaliza los tipos de gasto disponibles al cargar un gasto del viaje.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2.5">
            <Input
              placeholder="Nueva categoría (ej: Gomero, Lavado, Báscula...)"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
              className="h-14 text-lg font-bold rounded-[var(--radius)]"
            />
            <Button
              type="button"
              onClick={handleAddCategory}
              className="shrink-0 h-14 px-6 text-base font-black gap-2 rounded-[var(--radius)]"
            >
              <Plus className="h-5 w-5" />
              Agregar
            </Button>
          </div>

          <div>
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-2.5">
              Categorías activas ({categories.length})
            </label>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius)] border border-border bg-card shadow-xs text-base font-bold text-foreground"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-rose-500 bg-rose-500/10 border border-rose-500/20 transition-all p-1.5 rounded-lg active:bg-rose-600 active:text-white"
                    title={`Eliminar categoría ${cat}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Reinicio de Viaje */}
      <Card className="rounded-[var(--radius)]">
        <CardHeader className="pb-3.5">
          <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
            Empezar Viaje Nuevo
          </CardTitle>
          <CardDescription className="text-sm sm:text-base font-medium">
            Reinicia la plata y los gastos del viaje actual para comenzar uno nuevo desde cero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Borra el dinero y los gastos de la pantalla actual conservando tu nombre de chofer, colores y categorías.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={onResetTrip}
              className="shrink-0 h-12 px-5 text-base font-black rounded-[var(--radius)] flex items-center justify-center gap-2 shadow-xs"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reiniciar Viaje</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
