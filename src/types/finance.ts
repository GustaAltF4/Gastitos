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

export type TattooReminderOption =
  | 'same_day_morning' // El mismo día a las 09:00 AM
  | '1_day_before'     // 1 día antes a las 18:00 PM
  | '2_days_before'    // 2 días antes a las 12:00 PM
  | '2_hours_before'   // 2 horas antes de la sesión
  | '10_min_before'    // 10 minutos antes (preparación y aviso cercano)
  | 'exact_time'       // A la hora exacta del turno
  | 'none'

export interface TattooAppointment {
  id: string
  clientName: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  deposit?: number // Seña abonada
  reminderOptions: TattooReminderOption[] // Múltiples alertas permitidas a la vez
  notificationIds?: number[] // IDs de todas las notificaciones programadas
  reminderOption?: TattooReminderOption // retrocompatibilidad
  notificationId?: number // retrocompatibilidad
  dayOfWeek?: number
  contact?: string
  design?: string
  totalPrice?: number
  notes?: string
  createdAt: string
}

