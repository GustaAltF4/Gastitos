import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Transaction, Reminder, TransactionScope, DEFAULT_CATEGORIES } from './types/finance'
import { storageService, UserConfig, RADIUS_VALUES } from './services/storage'
import { notificationService } from './services/notifications'
import { Header } from './components/Header'
import { BalanceCard, AccountSummary } from './components/BalanceCard'
import { FinanceDashboard } from './components/FinanceDashboard'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { ReminderList } from './components/ReminderList'
import { ReminderModal } from './components/ReminderModal'
import { SettingsTab } from './components/SettingsTab'
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
  Calendar,
} from 'lucide-react'

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [config, setConfig] = useState<UserConfig>({
    currency: 'ARS',
    userName: 'Cuentas Vivi y Papá',
    account1Name: 'Vivi',
    account2Name: 'Papá',
    account1Emoji: '👩',
    account2Emoji: '👨',
    darkMode: false,
    themeColor: 'emerald',
    borderRadius: 'md',
    monthlyBudget: 0,
    savingsGoal: 0,
    notificationSound: true,
    categories: DEFAULT_CATEGORIES,
  })

  // Por defecto inicia en modo 'continuous' para que nunca se reinicie cada mes y se guarde todo continuamente
  const [viewMode, setViewMode] = useState<'continuous' | 'monthly'>('continuous')
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [scopeFilter, setScopeFilter] = useState<TransactionScope | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'reminders' | 'settings'>('dashboard')

  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)

  const account1Name = config.account1Name?.trim() || 'Vivi'
  const account2Name = config.account2Name?.trim() || 'Papá'
  const account1Emoji = config.account1Emoji?.trim() || '👩'
  const account2Emoji = config.account2Emoji?.trim() || '👨'

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

  // Cálculo de resúmenes por cada una de las 2 cuentas y totales con arrastre continuo
  const {
    displayedTransactions,
    allPeriodTransactions,
    allScopeTransactions,
    account1Summary,
    account2Summary,
    totalIncome,
    totalExpense,
    balance,
    carryOverBalance,
  } = useMemo(() => {
    const targetYear = currentMonth.getFullYear()
    const targetMonth = currentMonth.getMonth()

    const acc1: AccountSummary = { income: 0, expense: 0, balance: 0, carryOver: 0 }
    const acc2: AccountSummary = { income: 0, expense: 0, balance: 0, carryOver: 0 }

    const filteredForPeriodAndScope: Transaction[] = []
    const filteredForPeriodAllAccounts: Transaction[] = []
    const filteredForScopeOnly: Transaction[] = []

    // Ordenar de más reciente a más antiguo para la lista
    const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

    sortedTxs.forEach((tx) => {
      const [year, month] = tx.date.split('-').map(Number)
      const txMonthIndex = month - 1
      const isAcc2 = tx.scope === 'business'
      const targetAcc = isAcc2 ? acc2 : acc1

      const matchesScope = scopeFilter === 'all' || tx.scope === scopeFilter
      if (matchesScope) {
        filteredForScopeOnly.push(tx)
      }

      if (viewMode === 'continuous') {
        // Modo continuo: nunca se reinicia cada mes, suma todo el historial
        if (tx.type === 'income') {
          targetAcc.income += tx.amount
          targetAcc.balance += tx.amount
        } else {
          targetAcc.expense += tx.amount
          targetAcc.balance -= tx.amount
        }
        filteredForPeriodAllAccounts.push(tx)
        if (matchesScope) {
          filteredForPeriodAndScope.push(tx)
        }
      } else {
        // Modo mensual con arrastre: lo anterior al mes seleccionado se guarda como saldo arrastrado (carryOver)
        const isBeforeMonth =
          year < targetYear || (year === targetYear && txMonthIndex < targetMonth)
        const isCurrentMonth = year === targetYear && txMonthIndex === targetMonth

        if (isBeforeMonth) {
          if (tx.type === 'income') {
            targetAcc.carryOver += tx.amount
            targetAcc.balance += tx.amount
          } else {
            targetAcc.carryOver -= tx.amount
            targetAcc.balance -= tx.amount
          }
        } else if (isCurrentMonth) {
          if (tx.type === 'income') {
            targetAcc.income += tx.amount
            targetAcc.balance += tx.amount
          } else {
            targetAcc.expense += tx.amount
            targetAcc.balance -= tx.amount
          }
          filteredForPeriodAllAccounts.push(tx)
          if (matchesScope) {
            filteredForPeriodAndScope.push(tx)
          }
        }
      }
    })

    const activeSummary =
      scopeFilter === 'personal'
        ? acc1
        : scopeFilter === 'business'
        ? acc2
        : {
            income: acc1.income + acc2.income,
            expense: acc1.expense + acc2.expense,
            balance: acc1.balance + acc2.balance,
            carryOver: acc1.carryOver + acc2.carryOver,
          }

    return {
      displayedTransactions: filteredForPeriodAndScope,
      allPeriodTransactions: filteredForPeriodAllAccounts,
      allScopeTransactions: filteredForScopeOnly,
      account1Summary: acc1,
      account2Summary: acc2,
      totalIncome: activeSummary.income,
      totalExpense: activeSummary.expense,
      balance: activeSummary.balance,
      carryOverBalance: activeSummary.carryOver,
    }
  }, [transactions, currentMonth, scopeFilter, viewMode])

  // Descargar / Compartir informe profesional en PDF
  const handleDownloadPdf = async () => {
    await generatePdfReport(transactions, config, 'Informe Financiero Acumulado (2 Cuentas)')
  }

  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending').length

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col sm:pb-32"
      style={{
        paddingBottom: 'calc(6.5rem + max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px)))',
      }}
    >
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
            {/* Tab 1: Tablero y Balance de las 2 Cuentas */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <BalanceCard
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  currentMonth={currentMonth}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  balance={balance}
                  carryOverBalance={carryOverBalance}
                  account1Name={account1Name}
                  account2Name={account2Name}
                  account1Emoji={account1Emoji}
                  account2Emoji={account2Emoji}
                  account1Summary={account1Summary}
                  account2Summary={account2Summary}
                  scopeFilter={scopeFilter}
                  onScopeChange={setScopeFilter}
                  currency={config.currency}
                />

                <FinanceDashboard
                  transactions={displayedTransactions}
                  allPeriodTransactions={allPeriodTransactions}
                  allTransactions={allScopeTransactions}
                  currency={config.currency}
                  themeColor={config.themeColor}
                  account1Name={account1Name}
                  account2Name={account2Name}
                  account1Emoji={account1Emoji}
                  account2Emoji={account2Emoji}
                  account1Summary={account1Summary}
                  account2Summary={account2Summary}
                />
              </div>
            )}

            {/* Tab 2: Todos los Movimientos / Gastos */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {/* Barra de filtro de Cuentas y Período */}
                <div className="bg-card p-3 rounded-2xl border border-border shadow-xs space-y-2.5">
                  {/* Selector rápido de Cuenta en la pestaña Gastos */}
                  <div className="grid grid-cols-3 bg-muted/90 p-1 rounded-[calc(var(--radius)-2px)] text-xs gap-1 border border-border/60">
                    <button
                      type="button"
                      onClick={() => setScopeFilter('all')}
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
                      onClick={() => setScopeFilter('personal')}
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
                      onClick={() => setScopeFilter('business')}
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

                  {/* Filtro opcional por mes */}
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="text-muted-foreground font-medium">
                      {viewMode === 'continuous'
                        ? `${displayedTransactions.length} movimientos acumulados`
                        : `${displayedTransactions.length} movimientos en este mes`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode(viewMode === 'continuous' ? 'monthly' : 'continuous')}
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
                        onClick={handlePrevMonth}
                        className="p-1.5 bg-background/80 border border-border/60 rounded-lg text-foreground active:scale-90 active:bg-primary active:text-primary-foreground transition-all touch-manipulation"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-xs sm:text-sm capitalize text-foreground">
                        {new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(currentMonth)}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 bg-background/80 border border-border/60 rounded-lg text-foreground active:scale-90 active:bg-primary active:text-primary-foreground transition-all touch-manipulation"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <TransactionList
                  transactions={displayedTransactions}
                  onDelete={handleDeleteTransaction}
                  currency={config.currency}
                  account1Name={account1Name}
                  account2Name={account2Name}
                  account1Emoji={account1Emoji}
                  account2Emoji={account2Emoji}
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
                  account1Name={account1Name}
                  account2Name={account2Name}
                  account1Emoji={account1Emoji}
                  account2Emoji={account2Emoji}
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
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'dashboard'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px]">Tablero</span>
          </button>

          {/* Tab 2: Movimientos / Gastos */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'transactions'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-[10px]">Gastos</span>
          </button>

          {/* Botón Central [+] Elevado con interacción táctil llamativa */}
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
              className="relative h-16 w-16 -mt-7 shrink-0 rounded-2xl bg-gradient-to-tr from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-xl shadow-primary/40 flex items-center justify-center ring-4 ring-background transition-all active:scale-90 active:rotate-90 active:ring-primary/40 duration-150 ease-out select-none touch-manipulation"
              title={activeTab === 'reminders' ? 'Nuevo recordatorio 🐾' : 'Registrar nuevo movimiento 🐾'}
            >
              <Plus className="h-8 w-8 stroke-[2.8]" />
              <PawPrint className="h-3.5 w-3.5 absolute bottom-1.5 right-1.5 text-primary-foreground/85" />
            </button>
          </div>

          {/* Tab 3: Alertas */}
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none relative touch-manipulation ${
              activeTab === 'reminders'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
            }`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {pendingRemindersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-background animate-pulse" />
              )}
            </div>
            <span className="text-[10px]">Alertas</span>
          </button>

          {/* Tab 4: Configuración */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 mx-0.5 rounded-2xl transition-all active:scale-90 select-none touch-manipulation ${
              activeTab === 'settings'
                ? 'text-primary font-bold bg-primary/12'
                : 'text-muted-foreground active:bg-primary/10 active:text-primary'
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
        account1Name={account1Name}
        account2Name={account2Name}
        account1Emoji={account1Emoji}
        account2Emoji={account2Emoji}
        defaultScope={scopeFilter === 'business' ? 'business' : 'personal'}
      />

      <ReminderModal
        open={isReminderModalOpen}
        onOpenChange={setIsReminderModalOpen}
        onSave={handleAddReminder}
        account1Name={account1Name}
        account2Name={account2Name}
        account1Emoji={account1Emoji}
        account2Emoji={account2Emoji}
      />
    </div>
  )
}

export default App

