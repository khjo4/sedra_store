/** أدوات السلة والمفضلة — مصدر الحقيقة للمتصفح هو localStorage */

export const CART_KEY = 'sedra_cart'
export const WISHLIST_KEY = 'sedra_wishlist'
export const CART_SESSION_KEY = 'cart_session_id'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function sameId(a: unknown, b: unknown): boolean {
  return String(a ?? '') === String(b ?? '')
}

export type LocalCartItem = {
  productId: string
  quantity: number
  selectedColor?: string
  selectedSize?: string
}

export function getCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return []
  const items = safeParse<any[]>(localStorage.getItem(CART_KEY), [])
  return items
    .filter((i) => i && i.productId != null)
    .map((i) => ({
      productId: String(i.productId),
      quantity: Number(i.quantity) || 1,
      selectedColor: i.selectedColor || '',
      selectedSize: i.selectedSize || '',
    }))
}

export function saveCart(cart: LocalCartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export function clearLocalCart() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cartUpdated'))
}

export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = localStorage.getItem(CART_SESSION_KEY)
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(CART_SESSION_KEY, sessionId)
  }
  return sessionId
}

export function isProductInCart(productId: string): boolean {
  return getCart().some((item) => sameId(item.productId, productId))
}

export function sameCartVariant(
  item: LocalCartItem,
  productId: string,
  color?: string,
  size?: string
) {
  return (
    sameId(item.productId, productId) &&
    (item.selectedColor || '') === (color || '') &&
    (item.selectedSize || '') === (size || '')
  )
}

export function addLocalCartItem(item: LocalCartItem) {
  const cart = getCart()
  const index = cart.findIndex((i) =>
    sameCartVariant(i, item.productId, item.selectedColor, item.selectedSize)
  )
  if (index > -1) {
    cart[index].quantity += item.quantity
  } else {
    cart.push({
      productId: String(item.productId),
      quantity: item.quantity,
      selectedColor: item.selectedColor || '',
      selectedSize: item.selectedSize || '',
    })
  }
  saveCart(cart)
}

export function getWishlistIds(): string[] {
  if (typeof window === 'undefined') return []
  const ids = safeParse<any[]>(localStorage.getItem(WISHLIST_KEY), [])
  const normalized = ids.map((id) => String(id)).filter(Boolean)
  // يمنع تكرار نفس المنتج بسبب خلط number/string في التخزين القديم
  const unique = Array.from(new Set(normalized))
  if (unique.length !== ids.length || ids.some((id) => typeof id !== 'string')) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(unique))
  }
  return unique
}

export function saveWishlistIds(ids: string[]) {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids.map((id) => String(id)).filter(Boolean)))
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(unique))
  window.dispatchEvent(new Event('wishlistUpdated'))
}

export function isInWishlist(productId: string): boolean {
  return getWishlistIds().some((id) => sameId(id, productId))
}

export function toggleWishlistId(productId: string): boolean {
  const id = String(productId)
  let ids = getWishlistIds()
  const exists = ids.some((x) => sameId(x, id))
  if (exists) {
    ids = ids.filter((x) => !sameId(x, id))
  } else {
    ids.push(id)
  }
  saveWishlistIds(ids)
  return !exists
}
