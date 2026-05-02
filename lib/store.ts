'use client'

import type { CartItem, WishlistItem, Order, Customer, Coupon, SiteSettings, Currency, Product } from './types'
import { defaultSettings, defaultCoupons, products as initialProducts } from './data'

// LocalStorage keys
const CART_KEY = 'lipikaar_cart'
const WISHLIST_KEY = 'lipikaar_wishlist'
const ORDERS_KEY = 'lipikaar_orders'
const CUSTOMERS_KEY = 'lipikaar_customers'
const COUPONS_KEY = 'lipikaar_coupons'
const SETTINGS_KEY = 'lipikaar_settings'
const CURRENCY_KEY = 'lipikaar_currency'
const PRODUCTS_KEY = 'lipikaar_products'

// Helper to safely access localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

// Cart functions
export function getCart(): CartItem[] {
  return getFromStorage<CartItem[]>(CART_KEY, [])
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart()
  const existingIndex = cart.findIndex(
    i => i.productId === item.productId && 
         i.selectedColor === item.selectedColor && 
         i.selectedSize === item.selectedSize
  )
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity
  } else {
    cart.push(item)
  }
  
  setToStorage(CART_KEY, cart)
  return cart
}

export function updateCartItem(productId: string, quantity: number, color?: string, size?: string): CartItem[] {
  const cart = getCart()
  const index = cart.findIndex(
    i => i.productId === productId && 
         i.selectedColor === color && 
         i.selectedSize === size
  )
  
  if (index > -1) {
    if (quantity <= 0) {
      cart.splice(index, 1)
    } else {
      cart[index].quantity = quantity
    }
  }
  
  setToStorage(CART_KEY, cart)
  return cart
}

export function removeFromCart(productId: string, color?: string, size?: string): CartItem[] {
  const cart = getCart().filter(
    i => !(i.productId === productId && 
           i.selectedColor === color && 
           i.selectedSize === size)
  )
  setToStorage(CART_KEY, cart)
  return cart
}

export function clearCart(): void {
  setToStorage(CART_KEY, [])
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}

// Wishlist functions
export function getWishlist(): WishlistItem[] {
  return getFromStorage<WishlistItem[]>(WISHLIST_KEY, [])
}

export function addToWishlist(productId: string): WishlistItem[] {
  const wishlist = getWishlist()
  if (!wishlist.find(i => i.productId === productId)) {
    wishlist.push({ productId, addedAt: new Date().toISOString() })
    setToStorage(WISHLIST_KEY, wishlist)
  }
  return wishlist
}

export function removeFromWishlist(productId: string): WishlistItem[] {
  const wishlist = getWishlist().filter(i => i.productId !== productId)
  setToStorage(WISHLIST_KEY, wishlist)
  return wishlist
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().some(i => i.productId === productId)
}

// Orders functions
export function getOrders(): Order[] {
  return getFromStorage<Order[]>(ORDERS_KEY, [])
}

export function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getOrders()
  const newOrder: Order = {
    ...order,
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  orders.unshift(newOrder)
  setToStorage(ORDERS_KEY, orders)
  
  // Update customer data
  updateCustomerFromOrder(newOrder)
  
  return newOrder
}

export function updateOrderStatus(orderId: string, status: Order['status']): Order | null {
  const orders = getOrders()
  const index = orders.findIndex(o => o.id === orderId)
  if (index > -1) {
    orders[index].status = status
    orders[index].updatedAt = new Date().toISOString()
    setToStorage(ORDERS_KEY, orders)
    return orders[index]
  }
  return null
}

export function getOrderById(orderId: string): Order | undefined {
  return getOrders().find(o => o.id === orderId)
}

// Customers functions
export function getCustomers(): Customer[] {
  return getFromStorage<Customer[]>(CUSTOMERS_KEY, [])
}

function updateCustomerFromOrder(order: Order): void {
  const customers = getCustomers()
  const existingIndex = customers.findIndex(c => c.email === order.customerEmail)
  
  if (existingIndex > -1) {
    customers[existingIndex].ordersCount += 1
    customers[existingIndex].totalSpent += order.total
  } else {
    customers.push({
      id: `CUST-${Date.now()}`,
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.address,
      city: order.city,
      ordersCount: 1,
      totalSpent: order.total,
      createdAt: new Date().toISOString(),
    })
  }
  
  setToStorage(CUSTOMERS_KEY, customers)
}

// Coupons functions
export function getCoupons(): Coupon[] {
  return getFromStorage<Coupon[]>(COUPONS_KEY, defaultCoupons)
}

export function createCoupon(coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Coupon {
  const coupons = getCoupons()
  const newCoupon: Coupon = {
    ...coupon,
    id: `COUP-${Date.now()}`,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  }
  coupons.push(newCoupon)
  setToStorage(COUPONS_KEY, coupons)
  return newCoupon
}

export function updateCoupon(couponId: string, updates: Partial<Coupon>): Coupon | null {
  const coupons = getCoupons()
  const index = coupons.findIndex(c => c.id === couponId)
  if (index > -1) {
    coupons[index] = { ...coupons[index], ...updates }
    setToStorage(COUPONS_KEY, coupons)
    return coupons[index]
  }
  return null
}

export function deleteCoupon(couponId: string): void {
  const coupons = getCoupons().filter(c => c.id !== couponId)
  setToStorage(COUPONS_KEY, coupons)
}

export function validateCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; error?: string } {
  const coupons = getCoupons()
  const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase())
  
  if (!coupon) {
    return { valid: false, error: 'كود الخصم غير صحيح' }
  }
  
  if (!coupon.active) {
    return { valid: false, error: 'كود الخصم غير مفعل' }
  }
  
  if (new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, error: 'كود الخصم منتهي الصلاحية' }
  }
  
  if (coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'تم استخدام كود الخصم بالكامل' }
  }
  
  if (subtotal < coupon.minPurchase) {
    return { valid: false, error: `الحد الأدنى للشراء ${coupon.minPurchase}$` }
  }
  
  return { valid: true, coupon }
}

export function applyCoupon(code: string): void {
  const coupons = getCoupons()
  const index = coupons.findIndex(c => c.code.toLowerCase() === code.toLowerCase())
  if (index > -1) {
    coupons[index].usedCount += 1
    setToStorage(COUPONS_KEY, coupons)
  }
}

// Settings functions
export function getSettings(): SiteSettings {
  return getFromStorage<SiteSettings>(SETTINGS_KEY, defaultSettings)
}

export function updateSettings(updates: Partial<SiteSettings>): SiteSettings {
  const settings = { ...getSettings(), ...updates }
  setToStorage(SETTINGS_KEY, settings)
  return settings
}

// Currency functions
export function getCurrency(): Currency {
  return getFromStorage<Currency>(CURRENCY_KEY, 'USD')
}

export function setCurrency(currency: Currency): void {
  setToStorage(CURRENCY_KEY, currency)
}

export function formatPrice(priceUSD: number | string, currency?: Currency): string {
  const curr = currency || getCurrency()
  const settings = getSettings()
  
  // تحويل السعر إلى رقم إذا كان نصاً
  const price = typeof priceUSD === 'string' ? parseFloat(priceUSD) : priceUSD
  
  if (curr === 'SYP') {
    const priceSYP = Math.round(price * settings.exchangeRate)
    return `${priceSYP.toLocaleString('ar-SY')} ل.س`
  }
  
  return `$${price.toFixed(2)}`
}

// Products functions (for admin CRUD)
export function getProducts(): Product[] {
  return getFromStorage<Product[]>(PRODUCTS_KEY, initialProducts)
}

export function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = getProducts()
  const newProduct: Product = {
    ...product,
    id: `p${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  }
  products.push(newProduct)
  setToStorage(PRODUCTS_KEY, products)
  return newProduct
}

export function updateProduct(productId: string, updates: Partial<Product>): Product | null {
  const products = getProducts()
  const index = products.findIndex(p => p.id === productId)
  if (index > -1) {
    products[index] = { ...products[index], ...updates }
    setToStorage(PRODUCTS_KEY, products)
    return products[index]
  }
  return null
}

export function deleteProduct(productId: string): void {
  const products = getProducts().filter(p => p.id !== productId)
  setToStorage(PRODUCTS_KEY, products)
}

export function getProductByIdFromStore(id: string): Product | undefined {
  return getProducts().find(p => p.id === id)
}

// Stats for admin dashboard
export function getAdminStats() {
  const orders = getOrders()
  const customers = getCustomers()
  const products = getProducts()
  
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const completedOrders = orders.filter(o => o.status === 'delivered').length
  
  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders,
    completedOrders,
    totalCustomers: customers.length,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stock < 10).length,
  }
}