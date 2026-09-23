import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Briefcase, User, Sparkles } from "lucide-react"
import { AnimatedCounter } from "./react-bits/AnimatedCounter"
import { GlowCard } from "./react-bits/GlowCard"
import { TransactionScope } from "../types/finance"
import { formatCurrency } from "../lib/utils"

interface BalanceCardProps {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  totalIncome: number
  totalExpense: number
  balance: number
  scopeFilter: TransactionScope | 'all'
  onScopeChange: (scope: TransactionScope | 'all') => void
  currency: string
}

export function BalanceCard({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  totalIncome,
  totalExpense,
  balance,
  scopeFilter,
  onScopeChange,
  currency,
}: BalanceCardProps) {
  const monthName = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(currentMonth)

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Margen de ganancia o ahorro
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Selector de Mes y Filtro de Ámbito */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-2 sm:p-3 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            title="Mes anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm sm:text-base px-2 text-foreground capitalize">
            {capitalizedMonth}
          </span>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            title="Mes siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Filtro Ámbito: Todos | Negocio | Personal */}
        <div className="flex items-center bg-muted/70 p-1 rounded-xl w-full sm:w-auto justify-center text-xs">
          <button
            onClick={() => onScopeChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              scopeFilter === 'all'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
          <button
            onClick={() => onScopeChange('business')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              scopeFilter === 'business'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Negocio / Freelance
          </button>
          <button
            onClick={() => onScopeChange('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              scopeFilter === 'personal'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Personal
          </button>
        </div>
      </div>

      {/* Tarjeta Principal de Balance con Glow */}
      <GlowCard
        glowColor={balance >= 0 ? "hsl(var(--primary) / 0.25)" : "rgba(239, 68, 68, 0.2)"}
        className="bg-gradient-to-br from-card via-card to-muted/30 border border-border/80"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {scopeFilter === 'business' ? 'Ganancia Neta (Negocio)' : scopeFilter === 'personal' ? 'Saldo Libre (Personal)' : 'Balance Neto Total'}
          </span>
          {totalIncome > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                savingsRate >= 0
                  ? 'bg-primary/15 text-primary'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              {savingsRate}% margen
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <AnimatedCounter
            value={balance}
            currency={currency}
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              balance >= 0 ? 'text-slate-900 dark:text-slate-50' : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </div>

        {/* Resumen Ingresos vs Egresos */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/60">
          <div className="bg-primary/10 p-3 sm:p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-full bg-primary text-primary-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-primary">
                Ingresos
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-primary">
              +{formatCurrency(totalIncome, currency)}
            </p>
          </div>

          <div className="bg-red-950/10 dark:bg-red-950/30 p-3 sm:p-4 rounded-xl border border-red-900/20 dark:border-red-900/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-full bg-[#991b1b] text-white">
                <ArrowDownRight className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#991b1b] dark:text-red-400">
                Egresos
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[#991b1b] dark:text-red-400">
              -{formatCurrency(totalExpense, currency)}
            </p>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
