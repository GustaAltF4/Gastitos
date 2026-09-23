export type TransactionType = 'income' | 'expense'

export type TransactionScope = 'personal' | 'business'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  scope: TransactionScope
  date: string // YYYY-MM-DD
  description: string
  createdAt: string
}

export type ReminderStatus = 'pending' | 'completed' | 'dismissed'

export interface Reminder {
  id: string
  title: string
  amount?: number
  dueDateTime: string // ISO string format (YYYY-MM-DDTHH:mm)
  scope: TransactionScope
  status: ReminderStatus
  notificationId: number
  notes?: string
  createdAt: string
}

export interface CategoryInfo {
  id: string
  name: string
  icon: string
  color: string
  type: TransactionType | 'both'
}

export const DEFAULT_CATEGORIES: string[] = [
  'General',
  'Servicios',
  'Compras',
  'Ingresos',
]
