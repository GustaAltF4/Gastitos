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
  FileText,
  ShieldAlert,
  Moon,
  Sun,
} from 'lucide-react'

interface TripSettingsTabProps {
  tripState: TripState
  onUpdateState: (partial: Partial<TripState>) => void
  onExportPdf: () => void
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
  onExportPdf,
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Datos del Chofer
          </CardTitle>
          <CardDescription>
            El nombre del chofer queda guardado aquí para incluirse automáticamente en todos los resúmenes PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Nombre del Chofer
            </label>
            <Input
              value={tripState.nombre}
              onChange={(e) => onUpdateState({ nombre: e.target.value })}
              placeholder="Ej: Papá / Nombre y Apellido"
              className="h-12 text-lg font-semibold"
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Categorías de Gastos del Viaje
            </CardTitle>
            <button
              type="button"
              onClick={handleResetCategories}
              className="text-xs text-primary bg-primary/10 border border-primary/25 font-semibold flex items-center gap-1 transition-all px-2.5 py-1 rounded-full active:scale-95 active:bg-primary active:text-primary-foreground touch-manipulation select-none"
              title="Restablecer a las 10 categorías originales del camión"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer originales
            </button>
          </div>
          <CardDescription>
            Personaliza los tipos de gasto disponibles al cargar un gasto del viaje.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
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
              className="h-11"
            />
            <Button
              type="button"
              onClick={handleAddCategory}
              className="shrink-0 h-11 px-4 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
              Categorías activas ({categories.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] border border-border bg-card shadow-xs text-sm font-semibold text-foreground"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-rose-500 bg-rose-500/10 border border-rose-500/20 transition-all p-1 rounded-lg active:scale-90 active:bg-rose-600 active:text-white touch-manipulation"
                    title={`Eliminar categoría ${cat}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Exportar PDF y Reiniciar Viaje */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resumen PDF y Reinicio de Viaje
          </CardTitle>
          <CardDescription>
            Descarga o comparte por WhatsApp el resumen PDF del viaje, o reinicia todo para un nuevo viaje.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            disabled={!tripState.guardado}
            onClick={onExportPdf}
            className="w-full flex items-center justify-center gap-2 h-12 text-base border-primary/40 active:border-primary active:bg-primary/15 text-foreground font-bold shadow-sm rounded-[var(--radius)] disabled:opacity-40"
          >
            <FileText className="h-5 w-5 text-primary" />
            Exportar Resumen PDF del Viaje
          </Button>

          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Empezar Viaje Nuevo
              </span>
              <p className="text-xs text-muted-foreground">
                Borra la plata y los gastos del viaje actual conservando tu nombre, colores y categorías.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={onResetTrip}
              className="shrink-0 font-bold rounded-[var(--radius)]"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reiniciar Viaje
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
