import { useState } from 'react'
import { Transaction } from '../types/finance'
import { formatCurrency, formatDate } from '../lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Trash2, Search, Briefcase, User, Cat } from 'lucide-react'

function HappyCatIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Ingreso - Gatito feliz"
    >
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" />
      <path d="M7.5 13c.6-.9 1.4-.9 2 0" />
      <path d="M14.5 13c.6-.9 1.4-.9 2 0" />
      <path d="M11.25 15.5h1.5L12 16.25l-.75-.75Z" fill="currentColor" stroke="none" />
      <path d="M9.8 17.2c.7.8 1.4.8 2.2 0 .7.8 1.5.8 2.2 0" />
    </svg>
  )
}

function CatScratchIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="Egreso - Marca de garra / Rasguño"
    >
      {/* Garra 1 (Izquierda) */}
      <path d="M5.5 3.5c-.5 2.5-.2 6.8 1.2 11.2.9 2.8 2 5.2 2.8 7 .3.7.8.6.9-.2.2-2.3.1-6-.7-10.2-.8-3.7-1.8-6.6-2.8-8-.3-.4-.9-.4-1.4.2z" />
      {/* Garra 2 (Centro - más larga) */}
      <path d="M10.8 2c-.5 3-.2 7.8 1.3 12.8 1 3.2 2.3 6 3.2 8 .3.7.8.6.9-.2.2-2.6.1-6.8-.8-11.6-.9-4.2-2.1-7.5-3.2-9.2-.4-.5-1-.4-1.4.2z" />
      {/* Garra 3 (Derecha) */}
      <path d="M16.2 4.2c-.4 2.4-.1 6.5 1.1 10.6.8 2.6 1.9 4.8 2.6 6.5.3.7.8.6.9-.2.2-2.1.1-5.6-.6-9.5-.7-3.4-1.6-6.2-2.6-7.6-.3-.4-.9-.4-1.4.2z" />
    </svg>
  )
}

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
  currency: string
}

export function TransactionList({ transactions, onDelete, currency }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-bold">
            Movimientos ({transactions.length})
          </CardTitle>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex bg-muted/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-md transition-all ${
                  typeFilter === 'all' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-2 py-1 rounded-md transition-all ${
                  typeFilter === 'income' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                Ingresos
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-2 py-1 rounded-md transition-all ${
                  typeFilter === 'expense' ? 'bg-[#991b1b] text-white font-semibold' : 'text-muted-foreground'
                }`}
              >
                Egresos
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2.5">
            <Cat className="h-9 w-9 text-muted-foreground/35 stroke-[1.5]" />
            <p>No se encontraron movimientos registrados con estos filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-muted/30 px-2 rounded-xl transition-all duration-100 active:scale-[0.99] hardware-accelerated"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center transition-transform active:scale-95 select-none shadow-xs ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-red-950/20 text-[#991b1b] dark:text-red-400 border border-[#991b1b]/25'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <HappyCatIcon className="h-7 w-7" />
                    ) : (
                      <CatScratchIcon className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {tx.category}
                      </span>
                      <Badge
                        variant={tx.scope === 'business' ? 'business' : 'personal'}
                        className="text-[10px] py-0 px-1.5 font-normal"
                      >
                        {tx.scope === 'business' ? (
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
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      tx.type === 'income'
                        ? 'text-primary'
                        : 'text-[#991b1b] dark:text-red-400 font-extrabold'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>

                  <button
                    onClick={() => onDelete(tx.id)}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/25 active:scale-90 transition-all select-none shrink-0"
                    title="Eliminar este movimiento"
                    aria-label="Eliminar movimiento"
                  >
                    <Trash2 className="h-4 w-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
