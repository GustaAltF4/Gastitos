import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "ARS"): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$ ${amount.toLocaleString("es-AR")}`
  }
}

/**
 * Formatea una fecha local en formato YYYY-MM-DD sin desfasaje de zona horaria UTC
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parsea un string YYYY-MM-DD en fecha local (sin desfase por UTC midnight)
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(dateString: string): string {
  try {
    const date = dateString.includes('T') ? new Date(dateString) : parseLocalDate(dateString)
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch {
    return dateString
  }
}
