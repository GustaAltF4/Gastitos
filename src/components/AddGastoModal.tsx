import React, { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Save, Plus, X, Truck, Minus } from 'lucide-react'
import { DEFAULT_TRUCK_CATEGORIES, TipoPlata } from '../services/tripStorage'

interface AddGastoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: string[]
  onAddCategory: (cat: string) => void
  defaultMoneda?: TipoPlata
  onAddGasto: (data: {
    monto: number
    tipoGasto: string
    descripcion?: string
    tipoPlata: TipoPlata
    dias?: number
  }) => void
}

export function AddGastoModal({
  open,
  onOpenChange,
  categories,
  onAddCategory,
  defaultMoneda = 'Plata Argentina',
  onAddGasto,
}: AddGastoModalProps) {
  const availableCategories =
    categories && categories.length > 0 ? categories : DEFAULT_TRUCK_CATEGORIES

  const [montoStr, setMontoStr] = useState('')
  const [tipoGasto, setTipoGasto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipoPlata, setTipoPlata] = useState<TipoPlata>(defaultMoneda)
  const [dias, setDias] = useState(1)

  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    if (open) {
      setTipoPlata(defaultMoneda)
      if (!tipoGasto && availableCategories.length > 0) {
        setTipoGasto(availableCategories[0])
      }
    }
  }, [open, defaultMoneda])

  const handleCreateNewCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    onAddCategory(trimmed)
    setTipoGasto(trimmed)
    setNewCategoryName('')
    setIsCreatingCategory(false)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const montoNum = parseFloat(montoStr)
    const diasNum = Math.max(1, dias || 1)
    const selectedCategory = tipoGasto || availableCategories[0] || 'Peaje'

    if (!montoNum || montoNum <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    const isEstadia = selectedCategory.toLowerCase() === 'estadía' || selectedCategory.toLowerCase() === 'estadia'
    const montoFinal = isEstadia ? montoNum * diasNum : montoNum

    onAddGasto({
      monto: montoFinal,
      tipoGasto: selectedCategory,
      descripcion: descripcion.trim() || undefined,
      tipoPlata,
      dias: isEstadia ? diasNum : undefined,
    })

    setMontoStr('')
    setDescripcion('')
    setDias(1)
    setIsCreatingCategory(false)
    setNewCategoryName('')
    onOpenChange(false)
  }

  const selectedCat = tipoGasto || availableCategories[0] || 'Peaje'
  const isEstadia =
    selectedCat.toLowerCase() === 'estadía' || selectedCat.toLowerCase() === 'estadia'
  const previewTotal =
    isEstadia && parseFloat(montoStr) > 0 ? (parseFloat(montoStr) || 0) * Math.max(1, dias) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange} slideFromBottom={true}>
      {/* Indicador táctil tipo Bottom Sheet para móvil */}
      <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

      <DialogHeader>
        <DialogTitle className="text-2xl flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          Agregar Gasto del Viaje
        </DialogTitle>
        <DialogDescription>
          Anota cuánto gastaste, en qué rubro y con qué moneda pagaste.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Monto */}
        <div>
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            ¿Cuánto gastaste?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-muted-foreground text-2xl">
              $
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              required
              placeholder="0"
              value={montoStr}
              onChange={(e) => setMontoStr(e.target.value)}
              className="pl-10 !text-2xl font-extrabold h-14 rounded-[var(--radius)]"
              autoFocus
            />
          </div>
        </div>

        {/* 2. ¿Con qué dinero? (Botones grandes de 1 toque para Argentina o Chile) */}
        <div>
          <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            ¿Con qué dinero pagaste?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setTipoPlata('Plata Argentina')}
              className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-[var(--radius)] border-2 text-base sm:text-lg font-bold transition-all active:scale-95 touch-manipulation select-none ${
                tipoPlata === 'Plata Argentina'
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'border-border bg-card text-muted-foreground active:bg-primary/15'
              }`}
            >
              <span className="text-xl">🇦🇷</span>
              <span>Argentina (ARS)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPlata('Plata Chilena')}
              className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-[var(--radius)] border-2 text-base sm:text-lg font-bold transition-all active:scale-95 touch-manipulation select-none ${
                tipoPlata === 'Plata Chilena'
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'border-border bg-card text-muted-foreground active:bg-primary/15'
              }`}
            >
              <span className="text-xl">🇨🇱</span>
              <span>Chilena (CLP)</span>
            </button>
          </div>
        </div>

        {/* 3. ¿En qué lo gastaste? (Categoría personalizable) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              ¿En qué lo gastaste?
            </label>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 active:scale-95 active:bg-primary active:text-primary-foreground transition-all flex items-center gap-1 font-bold touch-manipulation select-none"
            >
              {isCreatingCategory ? (
                <>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Nueva categoría
                </>
              )}
            </button>
          </div>

          {isCreatingCategory ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ej: Gomero, Lavado, Propina..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateNewCategory()
                  }
                }}
                autoFocus
                className="h-12 text-lg rounded-[var(--radius)]"
              />
              <Button
                type="button"
                onClick={handleCreateNewCategory}
                className="h-12 px-5 shrink-0 font-bold rounded-[var(--radius)]"
              >
                Agregar
              </Button>
            </div>
          ) : (
            <select
              value={selectedCat}
              onChange={(e) => {
                const val = e.target.value
                setTipoGasto(val)
                if (val.toLowerCase() !== 'estadía' && val.toLowerCase() !== 'estadia') {
                  setDias(1)
                }
              }}
              className="w-full h-14 px-4 rounded-[var(--radius)] border border-input bg-card text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="text-lg">
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 4. Si es Estadía: ¿Cuántos días? con botones - y + grandes */}
        {isEstadia && (
          <div className="p-3.5 rounded-[var(--radius)] bg-primary/10 border border-primary/30 space-y-2">
            <label className="text-sm font-bold text-primary uppercase tracking-wider block">
              ¿Cuántos días de estadía?
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDias((d) => Math.max(1, d - 1))}
                className="h-12 w-12 p-0 rounded-[var(--radius)] text-xl font-bold shrink-0"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={dias}
                onChange={(e) => setDias(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-12 !text-2xl font-extrabold text-center rounded-[var(--radius)]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setDias((d) => d + 1)}
                className="h-12 w-12 p-0 rounded-[var(--radius)] text-xl font-bold shrink-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            {previewTotal > 0 && (
              <p className="text-sm font-bold text-primary text-center pt-1">
                Total por {dias} día{dias > 1 ? 's' : ''}: ${previewTotal.toLocaleString('es-AR')}
              </p>
            )}
          </div>
        )}

        {/* 5. Nota opcional */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Nota / Detalle (Opcional)
          </label>
          <Input
            placeholder="Ej: YPF Mendoza, Aduana Cristo Redentor..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="h-12 text-base rounded-[var(--radius)]"
          />
        </div>

        {/* Botones Grandes */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            type="submit"
            className="w-full h-14 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-[var(--radius)] flex items-center justify-center gap-2 shadow-md shadow-primary/25"
          >
            <Save className="h-6 w-6" />
            Guardar Gasto
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-12 text-lg font-semibold rounded-[var(--radius)]"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
