import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Transaction, TransactionType, TransactionScope, DEFAULT_CATEGORIES } from '../types/finance'
import { ArrowDownRight, ArrowUpRight, Briefcase, User, Plus, X, PawPrint } from 'lucide-react'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void
  categories?: string[]
  onAddCategory?: (category: string) => void
}

export function TransactionModal({
  open,
  onOpenChange,
  onSave,
  categories = DEFAULT_CATEGORIES,
  onAddCategory,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [scope, setScope] = useState<TransactionScope>('business')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const availableCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES

  const handleCreateNewCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    if (!availableCategories.includes(trimmed)) {
      onAddCategory?.(trimmed)
    }
    setCategory(trimmed)
    setNewCategoryName('')
    setIsCreatingCategory(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    const selectedCategory = category || availableCategories[0] || 'General'

    onSave({
      type,
      amount: numericAmount,
      description: description.trim() || selectedCategory,
      category: selectedCategory,
      scope,
      date,
    })

    // Limpiar campos
    setAmount('')
    setDescription('')
    setIsCreatingCategory(false)
    setNewCategoryName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} slideFromBottom={true}>
      {/* Indicador táctil nativo tipo Bottom Sheet para móvil */}
      <div className="w-12 h-1.5 bg-muted-foreground/25 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

      <DialogHeader>
        <DialogTitle>Registrar Movimiento</DialogTitle>
        <DialogDescription>
          Anota un nuevo ingreso o gasto para mantener tus cuentas al día.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Tipo: Ingreso / Egreso */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense')
              setCategory('')
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-transform duration-100 active:scale-95 select-none ${
              type === 'expense'
                ? 'bg-[#991b1b] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownRight className="h-4 w-4" />
            Egreso / Gasto
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income')
              setCategory('')
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-transform duration-100 active:scale-95 select-none ${
              type === 'income'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            Ingreso / Cobro
          </button>
        </div>

        {/* Monto */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Monto
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-lg">
              $
            </span>
            <Input
              type="number"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8 text-xl font-bold h-12"
              autoFocus
            />
          </div>
        </div>

        {/* Ámbito: Negocio vs Personal */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Destino o Ámbito
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope('business')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-transform duration-100 active:scale-95 select-none ${
                scope === 'business'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Negocio / Trabajo
            </button>
            <button
              type="button"
              onClick={() => setScope('personal')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-transform duration-100 active:scale-95 select-none ${
                scope === 'personal'
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <User className="h-4 w-4" />
              Personal
            </button>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categoría
            </label>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              {isCreatingCategory ? (
                <>
                  <X className="h-3 w-3" /> Cancelar
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" /> Nueva categoría
                </>
              )}
            </button>
          </div>

          {isCreatingCategory ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nombre de nueva categoría..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateNewCategory()
                  }
                }}
                autoFocus
                className="h-11"
              />
              <Button
                type="button"
                onClick={handleCreateNewCategory}
                size="sm"
                className="h-11 px-4 shrink-0"
              >
                Agregar
              </Button>
            </div>
          ) : (
            <select
              value={category || availableCategories[0]}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Detalle / Descripción */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Detalle / Descripción
          </label>
          <Input
            placeholder="Ej: Pago de internet, Venta a cliente, Almuerzo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Fecha
          </label>
          <Input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className={type === 'income' ? 'bg-primary hover:opacity-90 text-primary-foreground gap-1.5' : 'bg-[#991b1b] hover:bg-[#7f1d1d] text-white gap-1.5'}
          >
            <PawPrint className="h-4 w-4" />
            Guardar {type === 'income' ? 'Ingreso' : 'Egreso'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
