// LIPIKAAR E-Commerce Types

export interface Product {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  price: number
  originalPrice?: number
  category: string
  subcategory?: string
  images: string[]
  stock: number
  featured: boolean
  bestSeller: boolean
  newArrival: boolean
  colors?: string[]
  sizes?: string[]
  rating: number
  reviewCount: number
  createdAt: string
}

export interface CartItem {
  productId: string
  quantity: number
  selectedColor?: string
  selectedSize?: string
}

export interface WishlistItem {
  productId: string
  addedAt: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  city: string
  items: CartItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'cod'
  couponCode?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  ordersCount: number
  totalSpent: number
  createdAt: string
}

export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number
  maxUses: number
  usedCount: number
  active: boolean
  expiresAt: string
  createdAt: string
}

export interface SiteSettings {
  storeName: string
  storeNameEn: string
  logo?: string
  currency: 'USD' | 'SYP'
  exchangeRate: number // SYP per 1 USD
  freeShippingThreshold: number
  shippingCost: number
  contactEmail: string
  contactPhone: string
  whatsappUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  heroTitle: string
  heroSubtitle: string
  heroImage?: string
  announcement?: string
  announcementActive: boolean
}

export interface Category {
  id: string
  name: string
  nameEn: string
  slug: string
  image: string
  productCount: number
}

export type Currency = 'USD' | 'SYP'
