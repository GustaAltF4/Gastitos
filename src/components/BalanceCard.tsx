import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
} from "lucide-react"
import { AnimatedCounter } from "./react-bits/AnimatedCounter"
import { GlowCard } from "./react-bits/GlowCard"
import { CurrencyText } from "./ui/currency-text"
import { TransactionScope } from "../types/finance"

export interface AccountSummary {
  income: number
  expense: number
  balance: number
  carryOver: number
}

interface BalanceCardProps {
  viewMode: 'continuous' | 'monthly'
  onViewModeChange: (mode: 'continuous' | 'monthly') => void
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  totalIncome: number
  totalExpense: number
  balance: number
  carryOverBalance: number
  account1Name: string
  account2Name: string
  account1Emoji?: string
  account2Emoji?: string
  account1Summary: AccountSummary
  account2Summary: AccountSummary
  scopeFilter: TransactionScope | 'all'
  onScopeChange: (scope: TransactionScope | 'all') => void
  currency: string
}

export function BalanceCard({
  viewMode,
  onViewModeChange,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  totalIncome,
  totalExpense,
  balance,
  carryOverBalance,
  account1Name,
  account2Name,
  account1Emoji = '👩',
  account2Emoji = '👨',
  account1Summary,
  account2Summary,
  scopeFilter,
  onScopeChange,
  currency,
}: BalanceCardProps) {
  const monthName = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(currentMonth)

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return (
    <div className="space-y-4">
      {/* Contenedor Principal Único */}
      <GlowCard
        glowColor={balance >= 0 ? "hsl(var(--primary) / 0.25)" : "rgba(239, 68, 68, 0.2)"}
        className="bg-gradient-to-br from-card via-card to-muted/30 border border-border/80"
      >
        {/* 1. Pestañas superiores integradas para ver Ambas Cuentas o filtrar una sola */}
        <div className="flex flex-col gap-2.5 mb-5">
          <div className="grid grid-cols-3 bg-muted/90 p-1 rounded-[calc(var(--radius)-2px)] text-xs gap-1 border border-border/60">
            <button
              type="button"
              onClick={() => onScopeChange('all')}
              className={`py-2 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center leading-tight truncate active:scale-95 touch-manipulation select-none ${
                scopeFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30'
                  : 'text-muted-foreground active:bg-primary/15 active:text-primary font-semibold'
              }`}
            >
              Ambas
            </button>
            <button
              type="button"
              onClick={() => onScopeChange('personal')}
              className={`py-2 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center leading-tight flex items-center justify-center gap-1 min-w-0 active:scale-95 touch-manipulation select-none ${
                scopeFilter === 'personal'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30'
                  : 'text-muted-foreground active:bg-primary/15 active:text-primary font-semibold'
              }`}
            >
              <span className="shrink-0">{account1Emoji}</span>
              <span className="truncate">{account1Name}</span>
            </button>
            <button
              type="button"
              onClick={() => onScopeChange('business')}
              className={`py-2 px-2 rounded-[calc(var(--radius)-6px)] transition-all text-center leading-tight flex items-center justify-center gap-1 min-w-0 active:scale-95 touch-manipulation select-none ${
                scopeFilter === 'business'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/30'
                  : 'text-muted-foreground active:bg-primary/15 active:text-primary font-semibold'
              }`}
            >
              <span className="shrink-0">{account2Emoji}</span>
              <span className="truncate">{account2Name}</span>
            </button>
          </div>

          {/* Filtro opcional por mes (botón táctil tipo cápsula visible en celular) */}
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="text-muted-foreground font-medium">
              {viewMode === 'continuous' ? 'Saldo acumulado continuo' : 'Vista por mes'}
            </span>
            <button
              type="button"
              onClick={() => onViewModeChange(viewMode === 'continuous' ? 'monthly' : 'continuous')}
              className="px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold flex items-center gap-1 shadow-2xs active:scale-95 active:bg-primary active:text-primary-foreground transition-all touch-manipulation select-none"
            >
              <Calendar className="h-3.5 w-3.5" />
              {viewMode === 'continuous' ? 'Filtrar por mes' : 'Ver continuo'}
            </button>
          </div>

          {viewMode === 'monthly' && (
            <div className="flex items-center justify-between bg-muted/60 px-2.5 py-1.5 rounded-xl border border-primary/25 shadow-2xs">
              <button
                type="button"
                onClick={onPrevMonth}
                className="p-1.5 bg-background/80 border border-border/60 rounded-lg text-foreground active:scale-90 active:bg-primary active:text-primary-foreground transition-all touch-manipulation"
                title="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-xs sm:text-sm text-foreground capitalize">
                {capitalizedMonth}
              </span>
              <button
                type="button"
                onClick={onNextMonth}
                className="p-1.5 bg-background/80 border border-border/60 rounded-lg text-foreground active:scale-90 active:bg-primary active:text-primary-foreground transition-all touch-manipulation"
                title="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Saldo Actual Principal */}
        <div className="mb-5">
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground block mb-1">
            {scopeFilter === 'personal'
              ? `Saldo Actual — ${account1Emoji} ${account1Name}`
              : scopeFilter === 'business'
              ? `Saldo Actual — ${account2Emoji} ${account2Name}`
              : 'Saldo Actual Total'}
          </span>

          <div className="flex items-baseline gap-2 min-w-0">
            <AnimatedCounter
              value={balance}
              currency={currency}
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                balance >= 0 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
              }`}
            />
          </div>

          {viewMode === 'monthly' && carryOverBalance !== 0 && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-primary shrink-0" />
                Saldo anterior guardado:
              </span>
              <CurrencyText
                amount={carryOverBalance}
                currency={currency}
                sign="auto"
                className={`font-bold text-xs ${
                  carryOverBalance >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'
                }`}
              />
            </div>
          )}

          {/* Ingresos y Gastos del Saldo Principal */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            <div className="bg-primary/10 p-3 rounded-[var(--radius)] border border-primary/20 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded-full bg-primary text-primary-foreground shrink-0">
                  <ArrowUpRight className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold text-primary">
                  Ingresos
                </span>
              </div>
              <CurrencyText
                amount={totalIncome}
                currency={currency}
                sign="plus"
                autoFit={true}
                className="text-base sm:text-lg font-bold text-primary"
              />
            </div>

            <div className="bg-red-950/10 dark:bg-red-950/30 p-3 rounded-[var(--radius)] border border-red-900/20 dark:border-red-900/40 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded-full bg-[#991b1b] text-white shrink-0">
                  <ArrowDownRight className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold text-[#991b1b] dark:text-red-400">
                  Egresos
                </span>
              </div>
              <CurrencyText
                amount={totalExpense}
                currency={currency}
                sign="minus"
                autoFit={true}
                className="text-base sm:text-lg font-bold text-[#991b1b] dark:text-red-400"
              />
            </div>
          </div>
        </div>

        {/* 3. Los 2 Sueldos detallados DENTRO del mismo contenedor principal */}
        <div className="pt-4 border-t border-border/70 space-y-2.5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Detalle de cada cuenta
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cuenta 1 (Ej: Vivi) */}
            <div
              onClick={() => onScopeChange(scopeFilter === 'personal' ? 'all' : 'personal')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onScopeChange(scopeFilter === 'personal' ? 'all' : 'personal')
                }
              }}
              className={`p-3.5 rounded-[var(--radius)] border transition-all cursor-pointer select-none touch-manipulation active:scale-[0.97] active:bg-primary/15 active:border-primary ${
                scopeFilter === 'personal'
                  ? 'bg-primary/12 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/10'
                  : 'bg-background/85 dark:bg-muted/30 border-primary/25 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-[calc(var(--radius)-4px)] bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-base shadow-sm shadow-primary/30">
                    {account1Emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base text-foreground block leading-tight truncate">
                      {account1Name}
                    </span>
                    <span className="text-[11px] text-muted-foreground block leading-tight mt-0.5">
                      Disponible
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <CurrencyText
                    amount={account1Summary.balance}
                    currency={currency}
                    autoFit={false}
                    className={`text-lg sm:text-xl font-extrabold justify-end ${
                      account1Summary.balance >= 0
                        ? 'text-primary'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Ingresos</span>
                  <CurrencyText
                    amount={account1Summary.income}
                    currency={currency}
                    sign="plus"
                    autoFit={false}
                    className="font-bold text-primary text-xs sm:text-sm"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Gastos</span>
                  <CurrencyText
                    amount={account1Summary.expense}
                    currency={currency}
                    sign="minus"
                    autoFit={false}
                    className="font-bold text-[#991b1b] dark:text-red-400 text-xs sm:text-sm justify-end"
                  />
                </div>
              </div>
            </div>

            {/* Cuenta 2 (Ej: Papá) */}
            <div
              onClick={() => onScopeChange(scopeFilter === 'business' ? 'all' : 'business')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onScopeChange(scopeFilter === 'business' ? 'all' : 'business')
                }
              }}
              className={`p-3.5 rounded-[var(--radius)] border transition-all cursor-pointer select-none touch-manipulation active:scale-[0.97] active:bg-primary/15 active:border-primary ${
                scopeFilter === 'business'
                  ? 'bg-primary/12 border-primary ring-2 ring-primary/30 shadow-md shadow-primary/10'
                  : 'bg-background/85 dark:bg-muted/30 border-primary/25 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-[calc(var(--radius)-4px)] bg-primary/15 text-primary border-2 border-primary flex items-center justify-center shrink-0 text-base">
                    {account2Emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base text-foreground block leading-tight truncate">
                      {account2Name}
                    </span>
                    <span className="text-[11px] text-muted-foreground block leading-tight mt-0.5">
                      Disponible
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <CurrencyText
                    amount={account2Summary.balance}
                    currency={currency}
                    autoFit={false}
                    className={`text-lg sm:text-xl font-extrabold justify-end ${
                      account2Summary.balance >= 0
                        ? 'text-primary'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Ingresos</span>
                  <CurrencyText
                    amount={account2Summary.income}
                    currency={currency}
                    sign="plus"
                    autoFit={false}
                    className="font-bold text-primary text-xs sm:text-sm"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Gastos</span>
                  <CurrencyText
                    amount={account2Summary.expense}
                    currency={currency}
                    sign="minus"
                    autoFit={false}
                    className="font-bold text-[#991b1b] dark:text-red-400 text-xs sm:text-sm justify-end"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}



