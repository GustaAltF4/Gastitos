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

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
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
