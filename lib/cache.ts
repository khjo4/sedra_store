/**
 * Cache Configuration and Utilities
 * تحسين أداء الموقع من خلال استراتيجيات التخزين المؤقت المختلفة
 */

// Cache durations in seconds
export const CACHE_DURATIONS = {
  // Static content - يتغير نادراً جداً
  STATIC: 31536000, // 1 year
  
  // Categories and settings - يتغيران نادراً
  CATEGORIES: 3600, // 1 hour
  SETTINGS: 3600, // 1 hour
  
  // Products - يتغيرون متوسط الأحيان
  PRODUCTS: 600, // 10 minutes
  FEATURED_PRODUCTS: 1800, // 30 minutes
  
  // Cart and user data - بيانات حساسة - بدون caching
  CART: 0,
  USER_DATA: 0,
};

// Cache-Control headers
export const CACHE_HEADERS = {
  // للملفات الثابتة (الصور، CSS، JS)
  STATIC: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  
  // للبيانات شبه الثابتة (الأقسام، الإعدادات)
  SEMI_STATIC: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  
  // للبيانات الديناميكية (المنتجات)
  DYNAMIC: {
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
  },
  
  // للبيانات الحساسة (السلة، بيانات المستخدم)
  PRIVATE: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  },
};

/**
 * تحديد Cache Headers بناءً على نوع البيانات
 */
export function getCacheHeaders(type: 'static' | 'semi-static' | 'dynamic' | 'private') {
  return CACHE_HEADERS[type.toUpperCase() as keyof typeof CACHE_HEADERS] || CACHE_HEADERS.DYNAMIC;
}

/**
 * Generate cache key
 */
export function generateCacheKey(type: string, params?: Record<string, any>): string {
  if (!params) return type;
  return `${type}:${JSON.stringify(params)}`;
}
