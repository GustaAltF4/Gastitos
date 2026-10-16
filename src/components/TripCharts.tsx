import { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { GastoViaje, TipoPlata } from '../services/tripStorage'
import { ThemeColor } from '../services/storage'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { PieChart as PieIcon, BarChart3 } from 'lucide-react'

interface TripChartsProps {
  gastos: GastoViaje[]
  plataArgentinaInicial: number
  plataChilenaInicial: number
  plataArgentina: number
  plataChilena: number
  themeColor?: ThemeColor
}

const THEME_HEX_MAP: Record<ThemeColor, string> = {
  emerald: '#10b981',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  rose: '#dd0081',
  neutral: '#71717a',
}

const CATEGORY_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
  '#f97316',
  '#14b8a6',
  '#84cc16',
  '#64748b',
]

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function TripCharts({
  gastos,
  plataArgentinaInicial,
  plataChilenaInicial,
  plataArgentina,
  plataChilena,
  themeColor = 'indigo',
}: TripChartsProps) {
  const primaryHex = THEME_HEX_MAP[themeColor] || '#6366f1'

  const soloGastos = useMemo(() => gastos.filter((g) => !g.esIngreso), [gastos])

  // 1. Distribución por Categoría de los Gastos
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    soloGastos.forEach((g) => {
      map[g.tipoGasto] = (map[g.tipoGasto] || 0) + g.monto
    })

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [soloGastos])

  const totalGastosMonto = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.value, 0)
  }, [categoryData])

  // 2. Comparativo ARS vs CLP: Gastado vs Disponible
  const currencyComparisonData = useMemo(() => {
    let arsGastado = 0
    let clpGastado = 0

    soloGastos.forEach((g) => {
      if (g.tipoPlata === 'Plata Chilena') {
        clpGastado += g.monto
      } else {
        arsGastado += g.monto
      }
    })

    return [
      {
        moneda: '🇦🇷 ARS',
        Gastado: arsGastado,
        Disponible: Math.max(0, plataArgentina),
      },
      {
        moneda: '🇨🇱 CLP',
        Gastado: clpGastado,
        Disponible: Math.max(0, plataChilena),
      },
    ]
  }, [soloGastos, plataArgentina, plataChilena])

  if (soloGastos.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-extrabold text-foreground">
          Estadísticas de este viaje
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gráfico 1: Gastos por Categoría */}
        <Card className="rounded-[var(--radius)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Gastos por Rubro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      `${formatCurrency(Number(value) || 0)} (${Math.round(
                        ((Number(value) || 0) / (totalGastosMonto || 1)) * 100
                      )}%)`,
                      'Gasto',
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Comparativa ARS vs CLP (Gastado vs Disponible) */}
        <Card className="rounded-[var(--radius)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Gastado vs. Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currencyComparisonData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="moneda"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value) || 0),
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                  <Bar
                    dataKey="Gastado"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="Disponible"
                    fill={primaryHex}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
