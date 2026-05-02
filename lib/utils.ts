import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  priceUSD: number,
  currency: "USD" | "SYP" = "USD",
  exchangeRate: number = 14500
): string {
  if (currency === "SYP") {
    const priceSYP = priceUSD * exchangeRate
    return `${priceSYP.toLocaleString("ar-SY")} ل.س`
  }
  return `$${priceUSD.toFixed(2)}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
