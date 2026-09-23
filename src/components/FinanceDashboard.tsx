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

interface FinanceDashboardProps {
  transactions: Transaction[]
  allTransactions?: Transaction[]
  currency: string
  themeColor?: ThemeColor
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

const COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#991b1b', // dark crimson red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#64748b', // slate
]

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
  allTransactions = [],
  currency,
  themeColor = 'emerald',
}: FinanceDashboardProps) {
  const primaryHex = THEME_HEX_MAP[themeColor] || '#10b981'
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [annualChartType, setAnnualChartType] = useState<'bars' | 'lines'>('bars')

  const effectiveAllTransactions = allTransactions.length > 0 ? allTransactions : transactions

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

  // Datos diarios para gráfico lineal del período actual
  const dailyTimelineData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    const map = new Map<string, { date: string; displayDay: string; ingreso: number; gasto: number; balanceAcumulado: number }>()
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

    let accBalance = 0
    sorted.forEach((tx) => {
      const existing = map.get(tx.date) || {
        date: tx.date,
        displayDay: tx.date.split('-')[2] + '/' + tx.date.split('-')[1],
        ingreso: 0,
        gasto: 0,
        balanceAcumulado: 0,
      }
      if (tx.type === 'income') {
        existing.ingreso += tx.amount
        accBalance += tx.amount
      } else {
        existing.gasto += tx.amount
        accBalance -= tx.amount
      }
      existing.balanceAcumulado = accBalance
      map.set(tx.date, existing)
    })

    return Array.from(map.values())
  }, [transactions])

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
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
              <PieChartIcon className="h-4 w-4 text-indigo-600" />
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${formatCurrency(Number(value) || 0, currency)} (${Math.round(
                          (Number(value) / totalExpense) * 100
                        )}%)`,
                        'Gasto',
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
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

      {/* Fila 2: Gráfico Lineal de Evolución Diaria (si hay movimientos en el mes) */}
      {dailyTimelineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <CardTitle className="text-base flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-primary" />
                Tendencia y Evolución Diaria (Gráfico Lineal)
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium">
                Seguimiento de ingresos y egresos día a día
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTimelineData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIngresoDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryHex} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={primaryHex} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorGastoDaily" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#991b1b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
                  <XAxis dataKey="displayDay" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (Math.abs(val) >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`)}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value) || 0, currency),
                      name === 'Ingresos' ? 'Ingreso' : 'Gasto',
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                    fill="url(#colorIngresoDaily)"
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gasto"
                    name="Gastos"
                    stroke="#991b1b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGastoDaily)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setAnnualChartType('bars')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    annualChartType === 'bars'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Ver en Barras"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Barras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualChartType('lines')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    annualChartType === 'lines'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Ver en Líneas"
                >
                  <LineChartIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Líneas</span>
                </button>
              </div>

              {/* Selector de Año */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
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
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
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
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                Total Ingresos ({selectedYear})
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatCurrency(annualMetrics.totalIncome, currency)}
              </span>
            </div>

            {/* Total Gastos */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-[#991b1b]" />
                Total Gastos ({selectedYear})
              </span>
              <span className="text-lg font-bold text-[#991b1b] dark:text-red-400 mt-1 block">
                {formatCurrency(annualMetrics.totalExpense, currency)}
              </span>
            </div>

            {/* Balance Neto Anual */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-primary" />
                Balance Neto ({selectedYear})
              </span>
              <span
                className={`text-lg font-bold mt-1 block ${
                  annualMetrics.netBalance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-[#991b1b] dark:text-red-400'
                }`}
              >
                {annualMetrics.netBalance >= 0 ? '+' : ''}
                {formatCurrency(annualMetrics.netBalance, currency)}
              </span>
            </div>
          </div>

          {/* Gráfico Anual de los 12 meses (Alternable Barras / Líneas) */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Evolución Comparativa: Ingresos vs. Gastos
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      hasMovement
                        ? 'border-border bg-card shadow-xs'
                        : 'border-dashed border-border/70 bg-muted/10 opacity-70'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      {m.name}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {m.ingreso > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
                          +{formatCurrency(m.ingreso, currency)}
                        </span>
                      )}
                      {m.gasto > 0 && (
                        <span className="text-[11px] font-semibold text-[#991b1b] dark:text-red-400 block truncate">
                          -{formatCurrency(m.gasto, currency)}
                        </span>
                      )}
                      {!hasMovement && (
                        <span className="text-xs text-muted-foreground block">$0</span>
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
