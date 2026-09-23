import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Transaction, Reminder, TransactionScope, DEFAULT_CATEGORIES } from './types/finance'
import { storageService, UserConfig, RADIUS_VALUES } from './services/storage'
import { notificationService } from './services/notifications'
import { Header } from './components/Header'
import { BalanceCard } from './components/BalanceCard'
import { FinanceDashboard } from './components/FinanceDashboard'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { ReminderList } from './components/ReminderList'
import { ReminderModal } from './components/ReminderModal'
import { SettingsTab } from './components/SettingsTab'
import { Card } from './components/ui/card'
import { formatCurrency } from './lib/utils'
import { generatePdfReport } from './services/pdfReport'
import {
  LayoutDashboard,
  Receipt,
  Bell,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  PawPrint,
} from 'lucide-react'

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [config, setConfig] = useState<UserConfig>({
    currency: 'ARS',
    userName: 'Mi Negocio / Finanzas',
    darkMode: false,
    themeColor: 'emerald',
    borderRadius: 'md',
    monthlyBudget: 0,
    savingsGoal: 0,
    notificationSound: true,
    categories: DEFAULT_CATEGORIES,
  })

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [scopeFilter, setScopeFilter] = useState<TransactionScope | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'reminders' | 'settings'>('dashboard')

  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

  // Aplicar clases de tema, modo oscuro y redondeo de bordes (--radius)
  const applyThemeClasses = (dark: boolean, theme: string, radius: string = 'md') => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    const allThemes = [
      'theme-emerald',
      'theme-indigo',
      'theme-violet',
      'theme-amber',
      'theme-cyan',
      'theme-rose',
      'theme-neutral',
    ]
    allThemes.forEach((t) => root.classList.remove(t))
    root.classList.add(`theme-${theme || 'emerald'}`)

    const radiusPx = RADIUS_VALUES[radius as keyof typeof RADIUS_VALUES] || '12px'
    root.style.setProperty('--radius', radiusPx)
  }

  // Carga inicial de datos
  useEffect(() => {
    async function loadData() {
      const [txs, rems, cfg] = await Promise.all([
        storageService.getTransactions(),
        storageService.getReminders(),
        storageService.getConfig(),
      ])
      setTransactions(txs)
      setReminders(rems)
      setConfig(cfg)
      applyThemeClasses(cfg.darkMode, cfg.themeColor, cfg.borderRadius)
    }
    loadData()
  }, [])

  // Actualizar configuración
  const handleUpdateConfig = async (partial: Partial<UserConfig>) => {
    const updated = { ...config, ...partial }
    setConfig(updated)
    applyThemeClasses(updated.darkMode, updated.themeColor, updated.borderRadius)
    await storageService.saveConfig(updated)
  }

  // Restablecer todos los datos a cero
  const handleClearAll = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas restablecer TODOS los movimientos y recordatorios a cero? Esta acción no se puede deshacer.'
      )
    ) {
      return
    }
    await storageService.clearAllData()
    setTransactions([])
    setReminders([])
    alert('Todos tus movimientos y recordatorios han sido eliminados. La app quedó 100% en blanco.')
  }

  // Guardar transacciones
  const handleAddTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    const updated = [newTx, ...transactions]
    setTransactions(updated)
    await storageService.saveTransactions(updated)
  }

  const handleAddCategory = (newCat: string) => {
    const current = config.categories || DEFAULT_CATEGORIES
    if (!current.includes(newCat)) {
      handleUpdateConfig({ categories: [...current, newCat] })
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    const updated = transactions.filter((t) => t.id !== id)
    setTransactions(updated)
    await storageService.saveTransactions(updated)
  }

  // Guardar recordatorios
  const handleAddReminder = async (
    remData: Omit<Reminder, 'id' | 'notificationId' | 'status' | 'createdAt'>
  ) => {
    const notificationId = Math.floor(Math.random() * 100000)
    const newReminder: Reminder = {
      ...remData,
      id: `rem-${Date.now()}`,
      notificationId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // Programar alerta en Capacitor
    await notificationService.scheduleReminderNotification(newReminder, config.currency)

    const updated = [newReminder, ...reminders]
    setReminders(updated)
    await storageService.saveReminders(updated)
  }

  const handleCompleteReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id)
    if (!target) return

    const newStatus = target.status === 'completed' ? 'pending' : 'completed'
    if (newStatus === 'completed' && target.notificationId) {
      await notificationService.cancelNotification(target.notificationId)
    }

    const updated = reminders.map((r) =>
      r.id === id ? { ...r, status: newStatus as any } : r
    )
    setReminders(updated)
    await storageService.saveReminders(updated)
  }

  const handleDeleteReminder = async (id: string) => {
    const target = reminders.find((r) => r.id === id)
    if (!target) return
    if (!confirm('¿Eliminar este recordatorio?')) return

    if (target.notificationId) {
      await notificationService.cancelNotification(target.notificationId)
    }
    const updated = reminders.filter((r) => r.id !== id)
    setReminders(updated)
    await storageService.saveReminders(updated)
  }

  // Probar notificación
  const handleTestNotification = async () => {
    await notificationService.triggerTestNotification()
  }

  // Dark mode toggle
  const handleToggleDarkMode = async () => {
    await handleUpdateConfig({ darkMode: !config.darkMode })
  }

  // Navegación de meses
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Filtrado de transacciones por mes seleccionado y ámbito
  const currentMonthTransactions = useMemo(() => {
    const targetYear = currentMonth.getFullYear()
    const targetMonth = currentMonth.getMonth()

    return transactions.filter((tx) => {
      const [year, month] = tx.date.split('-').map(Number)
      const matchesDate = year === targetYear && month - 1 === targetMonth
      const matchesScope = scopeFilter === 'all' || tx.scope === scopeFilter
      return matchesDate && matchesScope
    })
  }, [transactions, currentMonth, scopeFilter])

  // Totales de balance
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0
    let expense = 0
    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount
      else expense += tx.amount
    })
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    }
  }, [currentMonthTransactions])

  // Descargar informe profesional en PDF
  const handleDownloadPdf = () => {
    generatePdfReport(transactions, config, 'Informe Financiero Completo')
  }


  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-28 sm:pb-32">
      {/* Barra superior limpia */}
      <Header
        darkMode={config.darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        userName={config.userName}
      />

      {/* Contenido principal con transición fluida GPU */}
      <main className="container max-w-5xl mx-auto px-4 py-5 flex-1 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="hardware-accelerated space-y-6"
          >
            {/* Tab 1: Tablero y Balance (Exclusivo para métricas, balance y gráficos) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <BalanceCard
                  currentMonth={currentMonth}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  balance={balance}
                  scopeFilter={scopeFilter}
                  onScopeChange={setScopeFilter}
                  currency={config.currency}
                />

                <FinanceDashboard
                  transactions={currentMonthTransactions}
                  allTransactions={transactions}
                  currency={config.currency}
                  themeColor={config.themeColor}
                />
              </div>
            )}

            {/* Tab 2: Todos los Movimientos / Gastos (Sin tablero repetido) */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {/* Selector de Mes compacto para filtrar movimientos */}
                <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-muted rounded-xl transition-transform active:scale-90 text-muted-foreground hover:text-foreground"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="text-center">
                    <span className="font-bold text-sm sm:text-base capitalize text-foreground block">
                      {new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(currentMonth)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {currentMonthTransactions.length} registros en este mes
                    </span>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-muted rounded-xl transition-transform active:scale-90 text-muted-foreground hover:text-foreground"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <TransactionList
                  transactions={currentMonthTransactions}
                  onDelete={handleDeleteTransaction}
                  currency={config.currency}
                />
              </div>
            )}

            {/* Tab 3: Recordatorios */}
            {activeTab === 'reminders' && (
              <div className="space-y-4">
                <ReminderList
                  reminders={reminders}
                  onComplete={handleCompleteReminder}
                  onDelete={handleDeleteReminder}
                  onTestNotification={handleTestNotification}
                  onCreateNew={() => setIsReminderModalOpen(true)}
                  currency={config.currency}
                />
              </div>
            )}

            {/* Tab 4: Configuración & Personalización */}
            {activeTab === 'settings' && (
              <SettingsTab
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onDownloadPdf={handleDownloadPdf}
                onClearAll={handleClearAll}
                onTestNotification={handleTestNotification}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barra de Navegación Inferior Unificada (Móvil y Escritorio) */}
      <nav className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-xl border-t sm:border border-border z-40 sm:bottom-4 sm:max-w-lg sm:mx-auto sm:rounded-3xl sm:shadow-2xl pb-safe">
        <div className="flex items-center justify-around h-16 px-1 relative">
          {/* Tab 1: Tablero */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-transform active:scale-90 select-none ${
              activeTab === 'dashboard'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px]">Tablero</span>
          </button>

          {/* Tab 2: Movimientos / Gastos */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-transform active:scale-90 select-none ${
              activeTab === 'transactions'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-[10px]">Gastos</span>
          </button>

          {/* Botón Central [+] Elevado con interacción Spring */}
          <div className="flex-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'reminders') {
                    setIsReminderModalOpen(true)
                  } else {
                    setIsTxModalOpen(true)
                  }
                }}
                className="group relative h-12 w-12 -mt-5 rounded-2xl bg-gradient-to-tr from-primary via-primary/95 to-primary/80 hover:opacity-95 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center ring-4 ring-background transition-transform active:scale-85 hover:scale-105 duration-150 ease-out select-none"
                title={activeTab === 'reminders' ? 'Nuevo recordatorio 🐾' : 'Registrar nuevo movimiento 🐾'}
              >
                <Plus className="h-6 w-6 stroke-[2.5]" />
                <PawPrint className="h-3 w-3 absolute bottom-1 right-1 text-primary-foreground/75 opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
          </div>

          {/* Tab 3: Alertas */}
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-transform active:scale-90 select-none relative ${
              activeTab === 'reminders'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {pendingRemindersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
              )}
            </div>
            <span className="text-[10px]">Alertas</span>
          </button>

          {/* Tab 4: Configuración */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-transform active:scale-90 select-none ${
              activeTab === 'settings'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Modales */}
      <TransactionModal
        open={isTxModalOpen}
        onOpenChange={setIsTxModalOpen}
        onSave={handleAddTransaction}
        categories={config.categories}
        onAddCategory={handleAddCategory}
      />

      <ReminderModal
        open={isReminderModalOpen}
        onOpenChange={setIsReminderModalOpen}
        onSave={handleAddReminder}
      />
    </div>
  )
}

export default App
