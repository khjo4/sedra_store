import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 🔥 متغير مؤقت لتخزين سعر الصرف (caching)
let cachedExchangeRate: number | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

// 🔥 دالة لجلب سعر الصرف من API
export async function fetchExchangeRate(): Promise<number> {
  const now = Date.now();
  
  // إذا كان cache لا يزال صالحاً
  if (cachedExchangeRate !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedExchangeRate;
  }
  
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    const settings = await response.json();
    cachedExchangeRate = Number(settings.exchangeRate) || 14500;
    lastFetchTime = now;
    return cachedExchangeRate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 14500; // القيمة الافتراضية
  }
}

// 🔥 دالة تنسيق السعر (المتزامنة الأصلية - تبقى كما هي)
export function formatPrice(
  priceUSD: number,
  currency: "USD" | "SYP" = "USD",
  exchangeRate: number = 14500
): string {
  if (currency === "SYP") {
    const priceSYP = priceUSD * exchangeRate;
    return `${priceSYP.toLocaleString("ar-SY")} ل.س`;
  }
  return `$${priceUSD.toFixed(2)}`;
}

// 🔥 دالة تنسيق السعر (غير متزامنة - تجلب سعر الصرف تلقائياً)
export async function formatPriceAsync(
  priceUSD: number,
  currency: "USD" | "SYP" = "USD"
): Promise<string> {
  if (currency === "SYP") {
    const exchangeRate = await fetchExchangeRate();
    const priceSYP = priceUSD * exchangeRate;
    return `${priceSYP.toLocaleString("ar-SY")} ل.س`;
  }
  return `$${priceUSD.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ar-SY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}