import { useState } from 'react'
import { UserConfig, ThemeColor, BorderRadius } from '../services/storage'
import { DEFAULT_CATEGORIES } from '../types/finance'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Palette,
  Moon,
  Sun,
  Coins,
  User,
  Bell,
  FileText,
  RotateCcw,
  Check,
  ShieldAlert,
  Maximize2,
  Tag,
  Plus,
  Trash2,
  Cat,
  PawPrint,
} from 'lucide-react'

interface SettingsTabProps {
  config: UserConfig
  onUpdateConfig: (newConfig: Partial<UserConfig>) => void
  onDownloadPdf: () => void
  onClearAll: () => void
  onTestNotification: () => void
}

const COLOR_OPTIONS: { id: ThemeColor; name: string; bgClass: string; borderClass: string }[] = [
  { id: 'emerald', name: 'Esmeralda', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-600' },
  { id: 'indigo', name: 'Índigo', bgClass: 'bg-indigo-600', borderClass: 'border-indigo-700' },
  { id: 'violet', name: 'Violeta', bgClass: 'bg-violet-600', borderClass: 'border-violet-700' },
  { id: 'amber', name: 'Ámbar', bgClass: 'bg-amber-500', borderClass: 'border-amber-600' },
  { id: 'cyan', name: 'Cian', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-600' },
  { id: 'rose', name: 'Rosa', bgClass: 'bg-[#dd0081]', borderClass: 'border-[#dd0081]' },
  { id: 'neutral', name: 'Neutral / Gris', bgClass: 'bg-zinc-500 dark:bg-zinc-300', borderClass: 'border-zinc-600 dark:border-zinc-400' },
]

const RADIUS_OPTIONS: { id: BorderRadius; name: string; previewPx: string }[] = [
  { id: 'none', name: 'Recto', previewPx: 'rounded-none' },
  { id: 'sm', name: 'Sutil', previewPx: 'rounded-[6px]' },
  { id: 'md', name: 'Estándar', previewPx: 'rounded-[12px]' },
  { id: 'lg', name: 'Redondo', previewPx: 'rounded-[18px]' },
  { id: 'full', name: 'Curvo', previewPx: 'rounded-[26px]' },
]

const CURRENCIES = [
  { code: 'ARS', label: 'ARS ($) - Peso Argentino' },
  { code: 'USD', label: 'USD ($) - Dólar Estadounidense' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'MXN', label: 'MXN ($) - Peso Mexicano' },
  { code: 'COP', label: 'COP ($) - Peso Colombiano' },
  { code: 'CLP', label: 'CLP ($) - Peso Chileno' },
  { code: 'UYU', label: 'UYU ($) - Peso Uruguayo' },
]

export function SettingsTab({
  config,
  onUpdateConfig,
  onDownloadPdf,
  onClearAll,
  onTestNotification,
}: SettingsTabProps) {
  const [newCatInput, setNewCatInput] = useState('')
  const categories = config.categories && config.categories.length > 0 ? config.categories : DEFAULT_CATEGORIES

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim()
    if (!trimmed) return
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoría ya existe.')
      return
    }
    onUpdateConfig({ categories: [...categories, trimmed] })
    setNewCatInput('')
  }

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      alert('Debes mantener al menos una categoría.')
      return
    }
    onUpdateConfig({ categories: categories.filter((c) => c !== catToRemove) })
  }

  const handleResetCategories = () => {
    onUpdateConfig({ categories: [...DEFAULT_CATEGORIES] })
  }
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Personalización Visual (Colores, Bordes & Tema) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Paleta de Colores y Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza los tonos principales, el redondeo de los bordes y el estilo visual.
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
                const isSelected = config.themeColor === col.id
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => onUpdateConfig({ themeColor: col.id })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20 scale-102'
                        : 'border-border hover:bg-muted/40'
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
                Redondeo de Bordes
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personaliza el estilo de las esquinas en botones, tarjetas y elementos.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = (config.borderRadius || 'md') === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateConfig({ borderRadius: opt.id })}
                    className={`flex flex-col items-center justify-center p-3 border transition-all ${opt.previewPx} ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30 font-bold'
                        : 'border-border hover:bg-muted/40'
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
                <Cat className="h-4 w-4 text-primary" />
                {config.darkMode ? 'Modo Nocturno (Gatito oscuro)' : 'Modo Diurno (Gatito claro)'}
              </span>
              <p className="text-xs text-muted-foreground">
                Colores negros y grises puros sin tonalidades azules, ideal para pantallas OLED.
              </p>
            </div>
            <button
              onClick={() => onUpdateConfig({ darkMode: !config.darkMode })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.darkMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out text-[11px] leading-none ${
                  config.darkMode ? 'translate-x-5 text-zinc-900' : 'translate-x-0 text-amber-500'
                }`}
              >
                {config.darkMode ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Gestión de Categorías */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Categorías de Movimientos
            </CardTitle>
            <button
              type="button"
              onClick={handleResetCategories}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-muted"
              title="Restablecer a las 4 categorías básicas"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer iniciales
            </button>
          </div>
          <CardDescription>
            Crea y administra las categorías que usas para registrar tus ingresos y egresos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulario para nueva categoría */}
          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría (ej: Gimnasio, Freelance, Alquiler...)"
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

          {/* Lista de Categorías activas */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
              Categorías disponibles ({categories.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card shadow-sm text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-500/10"
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

      {/* 3. Preferencias Financieras & Perfil */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Moneda e Identidad
          </CardTitle>
          <CardDescription>
            Configura cómo se expresan tus valores y el nombre de tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre / Alias */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Nombre o Negocio
              </label>
              <Input
                value={config.userName}
                onChange={(e) => onUpdateConfig({ userName: e.target.value })}
                placeholder="Ej: Mi Negocio / Gastos Personales"
              />
            </div>

            {/* Moneda */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" /> Moneda Principal
              </label>
              <select
                value={config.currency}
                onChange={(e) => onUpdateConfig({ currency: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Notificaciones & Pruebas en el Celular */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Alertas & Notificaciones
          </CardTitle>
          <CardDescription>
            Comprueba el sistema de notificaciones que despierta tu celular en los recordatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Comprobador de Alarma Sonora
            </p>
            <p className="text-xs text-muted-foreground">
              Dispara una notificación inmediata de prueba para verificar que tu teléfono suena y vibra.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onTestNotification}
            className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 shrink-0"
          >
            <PawPrint className="h-4 w-4 mr-2 text-amber-500" />
            Probar Notificación 🐾
          </Button>
        </CardContent>
      </Card>

      {/* 5. Informes y Gestión de Datos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Informes Financieros
          </CardTitle>
          <CardDescription>
            Descarga un informe detallado en formato PDF con todos tus movimientos y métricas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              variant="outline"
              onClick={onDownloadPdf}
              className="w-full flex items-center justify-center gap-2 h-11 border-primary/40 hover:border-primary text-foreground font-semibold shadow-sm"
            >
              <FileText className="h-4 w-4 text-primary" />
              Descargar Informe PDF
            </Button>
          </div>

          {/* Zona de Peligro: Reiniciar a cero */}
          <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Zona de Reinicio
              </span>
              <p className="text-xs text-muted-foreground">
                Borra todos los movimientos y recordatorios cargados para empezar limpio.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearAll}
              className="shrink-0"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Restablecer todo a cero
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
