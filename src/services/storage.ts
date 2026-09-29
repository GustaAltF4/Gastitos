import { Preferences } from '@capacitor/preferences'
import { Transaction, Reminder, TattooAppointment, DEFAULT_CATEGORIES } from '../types/finance'
import { getLocalDateString } from '../lib/utils'

const TRANSACTIONS_KEY = 'app_gastos_transactions'
const REMINDERS_KEY = 'app_gastos_reminders'
const USER_CONFIG_KEY = 'app_gastos_config'
const TATTOO_APPOINTMENTS_KEY = 'app_gastos_tattoo_appointments'
const TATTOO_WEEK_KEY = 'app_gastos_tattoo_week'

// Obtener la fecha del Lunes de la semana actual (YYYY-MM-DD) para control de reinicio semanal
export function getMondayOfWeek(d: Date = new Date()): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  const monday = new Date(date.setDate(diff))
  return getLocalDateString(monday)
}

export type ThemeColor = 'emerald' | 'indigo' | 'violet' | 'amber' | 'cyan' | 'rose' | 'neutral'

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full'

export const RADIUS_VALUES: Record<BorderRadius, string> = {
  none: '0px',
  sm: '6px',
  md: '12px',
  lg: '18px',
  full: '26px',
}

export interface UserConfig {
  currency: string
  userName: string
  darkMode: boolean
  themeColor: ThemeColor
  borderRadius: BorderRadius
  monthlyBudget?: number
  savingsGoal?: number
  notificationSound: boolean
  categories: string[]
}

const DEFAULT_CONFIG: UserConfig = {
  currency: 'ARS',
  userName: 'Mi Negocio / Finanzas',
  darkMode: false,
  themeColor: 'emerald',
  borderRadius: 'md',
  monthlyBudget: 0,
  savingsGoal: 0,
  notificationSound: true,
  categories: DEFAULT_CATEGORIES,
}

// La aplicación inicia completamente en blanco (0 movimientos y 0 recordatorios)
const INITIAL_TRANSACTIONS: Transaction[] = []
const INITIAL_REMINDERS: Reminder[] = []

export const storageService = {
  async getTransactions(): Promise<Transaction[]> {
    try {
      const { value } = await Preferences.get({ key: TRANSACTIONS_KEY })
      if (!value) {
        return []
      }
      return JSON.parse(value)
    } catch {
      return []
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await Preferences.set({
      key: TRANSACTIONS_KEY,
      value: JSON.stringify(transactions),
    })
  },

  async getReminders(): Promise<Reminder[]> {
    try {
      const { value } = await Preferences.get({ key: REMINDERS_KEY })
      if (!value) {
        return []
      }
      return JSON.parse(value)
    } catch {
      return []
    }
  },

  async saveReminders(reminders: Reminder[]): Promise<void> {
    await Preferences.set({
      key: REMINDERS_KEY,
      value: JSON.stringify(reminders),
    })
  },

  async getConfig(): Promise<UserConfig> {
    try {
      const { value } = await Preferences.get({ key: USER_CONFIG_KEY })
      if (!value) return DEFAULT_CONFIG
      const parsed = JSON.parse(value)
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        categories:
          Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : DEFAULT_CONFIG.categories,
      }
    } catch {
      return DEFAULT_CONFIG
    }
  },

  async saveConfig(config: UserConfig): Promise<void> {
    await Preferences.set({
      key: USER_CONFIG_KEY,
      value: JSON.stringify(config),
    })
  },

  async exportData(): Promise<string> {
    const transactions = await this.getTransactions()
    const reminders = await this.getReminders()
    const config = await this.getConfig()
    return JSON.stringify({ transactions, reminders, config, exportDate: new Date().toISOString() }, null, 2)
  },

  async importData(jsonContent: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonContent)
      if (Array.isArray(data.transactions)) {
        await this.saveTransactions(data.transactions)
      }
      if (Array.isArray(data.reminders)) {
        await this.saveReminders(data.reminders)
      }
      if (data.config) {
        await this.saveConfig(data.config)
      }
      return true
    } catch (e) {
      console.error('Error importing data', e)
      return false
    }
  },

  async clearAllData(): Promise<void> {
    await Preferences.remove({ key: TRANSACTIONS_KEY })
    await Preferences.remove({ key: REMINDERS_KEY })
    await Preferences.remove({ key: TATTOO_APPOINTMENTS_KEY })
    await Preferences.remove({ key: TATTOO_WEEK_KEY })
  },

  // Obtener turnos de tattoo con limpieza automática de días pasados (mantiene desde 1 día antes en adelante)
  async getTattooAppointments(): Promise<TattooAppointment[]> {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = getLocalDateString(yesterday)

      const { value } = await Preferences.get({ key: TATTOO_APPOINTMENTS_KEY })
      if (!value) return []

      const parsed: TattooAppointment[] = JSON.parse(value)
      // Mantiene turnos desde ayer en adelante; descarta automáticamente lo anterior a ayer
      const active = parsed.filter((a) => a.date >= yesterdayStr)

      if (active.length !== parsed.length) {
        await Preferences.set({
          key: TATTOO_APPOINTMENTS_KEY,
          value: JSON.stringify(active),
        })
      }
      return active
    } catch {
      return []
    }
  },

  async saveTattooAppointments(appointments: TattooAppointment[]): Promise<void> {
    await Preferences.set({
      key: TATTOO_APPOINTMENTS_KEY,
      value: JSON.stringify(appointments),
    })
  },

  async resetTattooWeek(): Promise<void> {
    await Preferences.set({ key: TATTOO_APPOINTMENTS_KEY, value: JSON.stringify([]) })
  },
}

