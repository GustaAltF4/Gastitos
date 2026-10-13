import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface CurrencyParts {
  symbol: string
  integer: string
  cents: string
  isNegative: boolean
}

export function formatCurrencyParts(amount: number, currency: string = "ARS"): CurrencyParts {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const isNegative = safeAmount < 0
  const absCents = Math.round(Math.abs(safeAmount) * 100)
  const integerPart = Math.floor(absCents / 100)
  const centsPart = String(absCents % 100).padStart(2, "0")

  let symbol = "$"
  if (currency === "USD") symbol = "US$"
  else if (currency === "EUR") symbol = "€"
  else if (currency === "BRL") symbol = "R$"

  const integerFormatted = integerPart.toLocaleString("es-AR")

  return {
    symbol,
    integer: integerFormatted,
    cents: centsPart,
    isNegative,
  }
}

export function formatCurrency(amount: number, currency: string = "ARS"): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    const { symbol, integer, cents, isNegative } = formatCurrencyParts(amount, currency)
    return `${isNegative ? "-" : ""}${symbol} ${integer},${cents}`
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
