import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Transaction } from '../types/finance'
import { ThemeColor } from '../services/storage'
import { formatCurrency } from '../lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { CurrencyText } from './ui/currency-text'
import {
  TrendingUp,
  PieChart as PieChartIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
} from 'lucide-react'

interface AccountSummaryData {
  income: number
  expense: number
  balance: number
  carryOver: number
}

interface FinanceDashboardProps {
  transactions: Transaction[]
  allPeriodTransactions?: Transaction[]
  allTransactions?: Transaction[]
  currency: string
  themeColor?: ThemeColor
  account1Name?: string
  account2Name?: string
  account1Emoji?: string
  account2Emoji?: string
  account1Summary?: AccountSummaryData
  account2Summary?: AccountSummaryData
}

const THEME_HEX_MAP: Record<ThemeColor, string> = {
  emerald: '#10b981',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  rose: '#dd0081',
  neutral: '#52525b',
}

// Opacidades escalonadas del color de acento elegido para no hardcodear colores ajenos al tema
const CATEGORY_OPACITIES = [1, 0.78, 0.6, 0.45, 0.32, 0.22, 0.15]

const MONTH_SHORT_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

const MONTH_FULL_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function FinanceDashboard({
  transactions,
  allPeriodTransactions,
  allTransactions = [],
  currency,
  themeColor = 'emerald',
  account1Name = 'Vivi',
  account2Name = 'Papá',
  account1Emoji = '👩',
  account2Emoji = '👨',
  account1Summary,
  account2Summary,
}: FinanceDashboardProps) {
  const primaryHex = THEME_HEX_MAP[themeColor] || '#10b981'
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [annualChartType, setAnnualChartType] = useState<'bars' | 'lines'>('bars')
  const [accountsChartMode, setAccountsChartMode] = useState<'bars' | 'categories'>('bars')

  const acc1Label = `${account1Emoji} ${account1Name}`
  const acc2Label = `${account2Emoji} ${account2Name}`

  const effectiveAllTransactions = allTransactions.length > 0 ? allTransactions : transactions
  const periodBothAccountsTxs =
    allPeriodTransactions && allPeriodTransactions.length > 0 ? allPeriodTransactions : transactions

  // Datos para gráfico de barras: Comparativo Ingresos vs Egresos del mes actual
  const comparisonData = useMemo(() => {
    let income = 0
    let expense = 0

    transactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount
      else expense += tx.amount
    })

    return [
      { name: 'Ingresos', monto: income, fill: primaryHex },
      { name: 'Gastos', monto: expense, fill: '#991b1b' },
    ]
  }, [transactions, primaryHex])

  // Datos para gráfico de dona: Gastos por categoría del mes
  const categoryData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {}

    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount
      })

    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0)
  }, [categoryData])

  // Totales y comparativa entre las 2 Cuentas (Vivi vs Papá)
  const accountsTotals = useMemo(() => {
    let acc1Inc = 0
    let acc1Exp = 0
    let acc2Inc = 0
    let acc2Exp = 0

    periodBothAccountsTxs.forEach((tx) => {
      const isAcc2 = tx.scope === 'business'
      if (tx.type === 'income') {
        if (isAcc2) acc2Inc += tx.amount
        else acc1Inc += tx.amount
      } else {
        if (isAcc2) acc2Exp += tx.amount
        else acc1Exp += tx.amount
      }
    })

    const inc1 = account1Summary ? account1Summary.income : acc1Inc
    const exp1 = account1Summary ? account1Summary.expense : acc1Exp
    const bal1 = account1Summary ? account1Summary.balance : acc1Inc - acc1Exp

    const inc2 = account2Summary ? account2Summary.income : acc2Inc
    const exp2 = account2Summary ? account2Summary.expense : acc2Exp
    const bal2 = account2Summary ? account2Summary.balance : acc2Inc - acc2Exp

    return {
      inc1,
      exp1,
      bal1,
      inc2,
      exp2,
      bal2,
      barsData: [
        {
          concepto: 'Ingresos',
          cuenta1: inc1,
          cuenta2: inc2,
        },
        {
          concepto: 'Gastos',
          cuenta1: exp1,
          cuenta2: exp2,
        },
        {
          concepto: 'Disponible',
          cuenta1: Math.max(0, bal1),
          cuenta2: Math.max(0, bal2),
        },
      ],
    }
  }, [periodBothAccountsTxs, account1Summary, account2Summary])

  // Gastos por Categoría comparando Cuenta 1 vs Cuenta 2
  const accountsCategoryData = useMemo(() => {
    const map = new Map<string, { categoria: string; cuenta1: number; cuenta2: number; total: number }>()

    periodBothAccountsTxs
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const current = map.get(tx.category) || {
          categoria: tx.category.length > 14 ? tx.category.slice(0, 13) + '…' : tx.category,
          cuenta1: 0,
          cuenta2: 0,
          total: 0,
        }
        if (tx.scope === 'business') {
          current.cuenta2 += tx.amount
        } else {
          current.cuenta1 += tx.amount
        }
        current.total += tx.amount
        map.set(tx.category, current)
      })

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [periodBothAccountsTxs])

  // Resumen Anual de Ingresos y Gastos por Mes
  const annualData = useMemo(() => {
    const monthlyIncome = new Array(12).fill(0)
    const monthlyExpenses = new Array(12).fill(0)

    effectiveAllTransactions.forEach((tx) => {
      const [yearStr, monthStr] = tx.date.split('-')
      const y = parseInt(yearStr, 10)
      const m = parseInt(monthStr, 10) - 1
      if (y === selectedYear && m >= 0 && m < 12) {
        if (tx.type === 'income') {
          monthlyIncome[m] += tx.amount
        } else {
          monthlyExpenses[m] += tx.amount
        }
      }
    })

    return MONTH_SHORT_NAMES.map((name, index) => ({
      monthIndex: index,
      name,
      fullName: MONTH_FULL_NAMES[index],
      ingreso: monthlyIncome[index],
      gasto: monthlyExpenses[index],
      balance: monthlyIncome[index] - monthlyExpenses[index],
    }))
  }, [effectiveAllTransactions, selectedYear])

  // Métricas anuales calculadas (Ingresos, Gastos, Balance y Récords)
  const annualMetrics = useMemo(() => {
    const totalIncome = annualData.reduce((acc, curr) => acc + curr.ingreso, 0)
    const totalExpense = annualData.reduce((acc, curr) => acc + curr.gasto, 0)
    const netBalance = totalIncome - totalExpense

    let maxExpense = { name: '-', amount: 0 }
    let maxIncome = { name: '-', amount: 0 }
    let activeExpenseMonths = 0

    annualData.forEach((item) => {
      if (item.gasto > 0) activeExpenseMonths++
      if (item.gasto > maxExpense.amount) {
        maxExpense = { name: item.fullName, amount: item.gasto }
      }
      if (item.ingreso > maxIncome.amount) {
        maxIncome = { name: item.fullName, amount: item.ingreso }
      }
    })

    const avgExpense = activeExpenseMonths > 0 ? totalExpense / activeExpenseMonths : totalExpense / 12

    return {
      totalIncome,
      totalExpense,
      netBalance,
      avgExpense,
      highestExpenseMonth: maxExpense,
      highestIncomeMonth: maxIncome,
      hasData: totalIncome > 0 || totalExpense > 0,
    }
  }, [annualData])

  if (effectiveAllTransactions.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed bg-card/50">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h4 className="font-semibold text-sm text-foreground">Comienza registrando un movimiento</h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Anota tu primer ingreso o gasto con el botón <strong>+</strong> para ver aquí los gráficos comparativos, la tendencia lineal, la distribución por categorías y el resumen anual completo.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fila 1: Gráficos Mensuales (Flujo y Categorías) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico 1: Comparativo Ingresos vs Egresos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Flujo Mensual: Ingresos vs. Egresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), 'Monto']}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="monto" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Desglose de Gastos por Categoría */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Distribución por Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={primaryHex}
                          fillOpacity={CATEGORY_OPACITIES[index % CATEGORY_OPACITIES.length]}
                          stroke={primaryHex}
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${formatCurrency(Number(value) || 0, currency)} (${Math.round(
                          (Number(value) / totalExpense) * 100
                        )}%)`,
                        'Gasto',
                      ]}
                      labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a',
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No hay egresos registrados en este período.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: Comparativa de las 2 Cuentas (General y por Categoría) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Comparativa de las 2 Cuentas
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium">
                {acc1Label} vs. {acc2Label}
              </span>
            </div>

            {/* Selector de vista: Comparativa General vs Gastos por Rubro de cada Cuenta */}
            <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border self-start sm:self-auto gap-1">
              <button
                type="button"
                onClick={() => setAccountsChartMode('bars')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation select-none ${
                  accountsChartMode === 'bars'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'text-muted-foreground active:bg-primary/15 active:text-primary'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Comparativa</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountsChartMode('categories')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation select-none ${
                  accountsChartMode === 'categories'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                    : 'text-muted-foreground active:bg-primary/15 active:text-primary'
                }`}
              >
                <PieChartIcon className="h-3.5 w-3.5" />
                <span>Por Categoría</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resumen rápido de cada cuenta arriba del gráfico (100% adaptable al color del tema) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="h-6 w-6 rounded-lg bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                  {account1Emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{account1Name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Ing: +{formatCurrency(accountsTotals.inc1, currency)} • Gas: -
                    {formatCurrency(accountsTotals.exp1, currency)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <CurrencyText
                  amount={accountsTotals.bal1}
                  currency={currency}
                  autoFit={false}
                  className="text-sm font-extrabold text-foreground"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="h-6 w-6 rounded-lg bg-primary/15 text-primary border-2 border-primary text-xs flex items-center justify-center shrink-0">
                  {account2Emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{account2Name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Ing: +{formatCurrency(accountsTotals.inc2, currency)} • Gas: -
                    {formatCurrency(accountsTotals.exp2, currency)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <CurrencyText
                  amount={accountsTotals.bal2}
                  currency={currency}
                  autoFit={false}
                  className="text-sm font-extrabold text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Gráfico de las 2 Cuentas (responde 100% al color elegido en Ajustes) */}
          <div className="h-64 w-full">
            {accountsChartMode === 'bars' ? (
              <ResponsiveContainer key="accounts-bars" width="100%" height="100%">
                <BarChart data={accountsTotals.barsData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                  <XAxis dataKey="concepto" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      Math.abs(val) >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value) || 0, currency),
                      name,
                    ]}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="cuenta1"
                    name={acc1Label}
                    fill={primaryHex}
                    fillOpacity={1}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="cuenta2"
                    name={acc2Label}
                    fill={primaryHex}
                    fillOpacity={0.32}
                    stroke={primaryHex}
                    strokeWidth={1.8}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : accountsCategoryData.length > 0 ? (
              <ResponsiveContainer key="accounts-categories" width="100%" height="100%">
                <BarChart
                  data={accountsCategoryData}
                  layout="vertical"
                  margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      Math.abs(val) >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={92}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value) || 0, currency),
                      name,
                    ]}
                    labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={32}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="cuenta1"
                    name={acc1Label}
                    fill={primaryHex}
                    fillOpacity={1}
                    radius={[0, 5, 5, 0]}
                  />
                  <Bar
                    dataKey="cuenta2"
                    name={acc2Label}
                    fill={primaryHex}
                    fillOpacity={0.32}
                    stroke={primaryHex}
                    strokeWidth={1.8}
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No hay gastos por categoría registrados en este período.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fila 3: Resumen y Evolución Anual Completa (Ingresos + Gastos) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Resumen Financiero Anual
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparativa de ingresos y egresos mes a mes a lo largo del año.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Selector de Tipo de Gráfico: Barras o Líneas */}
              <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border gap-1">
                <button
                  type="button"
                  onClick={() => setAnnualChartType('bars')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation select-none ${
                    annualChartType === 'bars'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'text-muted-foreground active:bg-primary/15 active:text-primary'
                  }`}
                  title="Ver en Barras"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Barras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualChartType('lines')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation select-none ${
                    annualChartType === 'lines'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'text-muted-foreground active:bg-primary/15 active:text-primary'
                  }`}
                  title="Ver en Líneas"
                >
                  <LineChartIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Líneas</span>
                </button>
              </div>

              {/* Selector de Año */}
              <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground active:scale-90 active:bg-primary active:text-primary-foreground transition-all touch-manipulation"
                  title="Año anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold px-2 text-foreground min-w-[50px] text-center">
                  {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y + 1)}
                  className="p-1.5 rounded-lg bg-background/80 border border-border/60 text-foreground active:scale-90 active:bg-primary active:text-primary-foreground transition-all touch-manipulation"
                  title="Año siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Tarjetas de Métricas Anuales (Ingresos, Gastos y Balance Neto) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Ingresos */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary shrink-0" />
                Total Ingresos ({selectedYear})
              </span>
              <CurrencyText
                amount={annualMetrics.totalIncome}
                currency={currency}
                autoFit={true}
                className="text-lg font-bold text-primary"
              />
            </div>

            {/* Total Gastos */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-[#991b1b] shrink-0" />
                Total Gastos ({selectedYear})
              </span>
              <CurrencyText
                amount={annualMetrics.totalExpense}
                currency={currency}
                autoFit={true}
                className="text-lg font-bold text-[#991b1b] dark:text-red-400"
              />
            </div>

            {/* Balance Neto Anual */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                <Scale className="h-3.5 w-3.5 text-primary shrink-0" />
                Balance Neto ({selectedYear})
              </span>
              <CurrencyText
                amount={annualMetrics.netBalance}
                currency={currency}
                sign={annualMetrics.netBalance >= 0 ? 'plus' : 'auto'}
                autoFit={true}
                className={`text-lg font-bold ${
                  annualMetrics.netBalance >= 0
                    ? 'text-primary'
                    : 'text-[#991b1b] dark:text-red-400'
                }`}
              />
            </div>
          </div>

          {/* Gráfico Anual de los 12 meses (Alternable Barras / Líneas) */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Evolución Comparativa: Ingresos vs. Gastos
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer key={annualChartType} width="100%" height="100%">
                {annualChartType === 'bars' ? (
                  <BarChart data={annualData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`)}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value) || 0, currency),
                        name === 'ingreso' ? 'Ingreso' : 'Gasto',
                      ]}
                      labelFormatter={(label) => {
                        const item = annualData.find((d) => d.name === label)
                        return item ? `${item.fullName} ${selectedYear}` : label
                      }}
                      labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: '#0f172a',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={36}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Bar dataKey="ingreso" name="Ingresos" fill={primaryHex} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gasto" name="Gastos" fill="#991b1b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={annualData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorIngresoAnnual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryHex} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={primaryHex} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorGastoAnnual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#991b1b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#991b1b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`)}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value) || 0, currency),
                        name === 'ingreso' ? 'Ingreso' : 'Gasto',
                      ]}
                      labelFormatter={(label) => {
                        const item = annualData.find((d) => d.name === label)
                        return item ? `${item.fullName} ${selectedYear}` : label
                      }}
                      labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                      itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: '#0f172a',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={36}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ingreso"
                      name="Ingresos"
                      stroke={primaryHex}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorIngresoAnnual)"
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gasto"
                      name="Gastos"
                      stroke="#991b1b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorGastoAnnual)"
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cuadrícula compacta de los 12 meses con Ingresos, Gastos y Balance */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Detalle Mes a Mes ({selectedYear})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {annualData.map((m) => {
                const hasMovement = m.ingreso > 0 || m.gasto > 0
                return (
                  <div
                    key={m.name}
                    className={`p-2.5 rounded-xl border text-center transition-all min-w-0 overflow-hidden active:scale-95 touch-manipulation ${
                      hasMovement
                        ? 'border-primary/25 bg-card shadow-xs'
                        : 'border-dashed border-border/70 bg-muted/10 opacity-70'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      {m.name}
                    </span>
                    <div className="mt-1 space-y-0.5 flex flex-col items-center">
                      {m.ingreso > 0 && (
                        <CurrencyText
                          amount={m.ingreso}
                          currency={currency}
                          sign="plus"
                          autoFit={true}
                          className="text-[11px] font-semibold text-primary justify-center w-full"
                        />
                      )}
                      {m.gasto > 0 && (
                        <CurrencyText
                          amount={m.gasto}
                          currency={currency}
                          sign="minus"
                          autoFit={true}
                          className="text-[11px] font-semibold text-[#991b1b] dark:text-red-400 justify-center w-full"
                        />
                      )}
                      {!hasMovement && (
                        <CurrencyText
                          amount={0}
                          currency={currency}
                          className="text-xs text-muted-foreground justify-center"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
