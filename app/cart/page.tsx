'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { cn, formatPrice, fetchExchangeRate } from '@/lib/utils'
import type { CartItem, Product, Currency, Coupon } from '@/lib/types'
import { toast } from 'sonner'

interface CartItemWithProduct extends CartItem {
  product: Product
}

const CART_KEY = 'sedra_cart'

const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

const saveCart = (cart: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

const updateCartItem = (productId: string, quantity: number, color?: string, size?: string) => {
  const cart = getCart()
  const index = cart.findIndex(i => i.productId === productId && i.selectedColor === color && i.selectedSize === size)
  if (index > -1) {
    if (quantity <= 0) {
      cart.splice(index, 1)
    } else {
      cart[index].quantity = quantity
    }
    saveCart(cart)
  }
}

const removeFromCart = (productId: string, color?: string, size?: string) => {
  const newCart = getCart().filter(i => !(i.productId === productId && i.selectedColor === color && i.selectedSize === size))
  saveCart(newCart)
}

const clearCart = () => {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cartUpdated'))
}

// ================================================
// دوال الكوبونات (مؤقتاً - ستُنقل لاحقاً)
// ================================================
const validateCouponLocal = async (code: string, subtotal: number): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
  try {
    const response = await fetch(`/api/coupons?code=${code}`)
    const coupons = await response.json()
    const coupon = coupons.find((c: Coupon) => c.code.toLowerCase() === code.toLowerCase())
    
    if (!coupon) return { valid: false, error: 'كود الخصم غير صحيح' }
    if (!coupon.active) return { valid: false, error: 'كود الخصم غير مفعل' }
    if (new Date(coupon.expiresAt) < new Date()) return { valid: false, error: 'كود الخصم منتهي الصلاحية' }
    if (coupon.usedCount >= coupon.maxUses) return { valid: false, error: 'تم استخدام كود الخصم بالكامل' }
    if (subtotal < coupon.minPurchase) return { valid: false, error: `الحد الأدنى للشراء ${coupon.minPurchase}$` }
    
    return { valid: true, coupon }
  } catch (error) {
    return { valid: false, error: 'حدث خطأ في التحقق من الكوبون' }
  }
}

const updateCouponUsage = async (code: string) => {
  try {
    await fetch('/api/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  } catch (error) {
    console.error('Error updating coupon usage:', error)
  }
}

export default function CartPage() {
  // ================================================
  // 1. جميع الـ useState أولاً
  // ================================================
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  
  // حالات للأسعار المنسقة
  const [formattedSubtotal, setFormattedSubtotal] = useState('')
  const [formattedDiscount, setFormattedDiscount] = useState('')
  const [formattedShipping, setFormattedShipping] = useState('')
  const [formattedTotal, setFormattedTotal] = useState('')
  const [formattedShippingRemaining, setFormattedShippingRemaining] = useState('')
  
  // ✅ حالات لأسعار العناصر (خارج الـ map)
  const [itemPrices, setItemPrices] = useState<Record<string, string>>({})
  const [itemTotalPrices, setItemTotalPrices] = useState<Record<string, string>>({})

  // ================================================
  // 2. جلب الإعدادات من API
  // ================================================
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error fetching settings:', err))
  }, [])

  // ================================================
  // 3. جلب المنتجات من API وتحويل عناصر السلة
  // ================================================
  const loadCart = async () => {
    setLoading(true)
    const cart = getCart()
    
    if (cart.length === 0) {
      setCartItems([])
      setLoading(false)
      return
    }
    
    try {
      // تحسين الأداء: جلب المنتجات المحددة فقط
      const ids = cart.map(item => item.productId).join(',')
      const response = await fetch(`/api/products?ids=${ids}`)
      const data = await response.json()
      const allProducts = Array.isArray(data) ? data : data.products || []
      
      const itemsWithProducts = cart
        .map((item) => {
          const product = allProducts.find((p: Product) => p.id === item.productId)
          if (!product) return null
          return { ...item, product }
        })
        .filter(Boolean) as CartItemWithProduct[]
      
      setCartItems(itemsWithProducts)
    } catch (error) {
      console.error('Error loading cart:', error)
      toast.error('حدث خطأ في تحميل السلة')
    } finally {
      setLoading(false)
    }
  }

  // ================================================
  // 4. تحميل العملة وسعر الصرف
  // ================================================
  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = localStorage.getItem('sedra_currency')
      const currentCurrency = (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
      setCurrency(currentCurrency)
      
      const rate = await fetchExchangeRate()
      setExchangeRate(rate)
    }
    
    loadCurrency()
    
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  // ================================================
  // 5. تحميل السلة عند تغيرها
  // ================================================
  useEffect(() => {
    loadCart()

    const handleCartUpdate = () => loadCart()

    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  // ================================================
  // ✅ 6. تحديث أسعار العناصر (بعد cartItems و exchangeRate)
  // ================================================
  useEffect(() => {
    const updateAllPrices = () => {
      const prices: Record<string, string> = {}
      const totalPrices: Record<string, string> = {}
      
      for (const item of cartItems) {
        const key = `${item.productId}-${item.selectedColor || ''}-${item.selectedSize || ''}`
        prices[key] = formatPrice(item.product.price, currency, exchangeRate)
        totalPrices[key] = formatPrice(item.product.price * item.quantity, currency, exchangeRate)
      }
      
      setItemPrices(prices)
      setItemTotalPrices(totalPrices)
    }
    
    updateAllPrices()
  }, [cartItems, currency, exchangeRate])

  // ================================================
  // 7. الـ useMemo (subtotal, discount)
  // ================================================
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cartItems])

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100
    }
    return appliedCoupon.value
  }, [appliedCoupon, subtotal])

  // ================================================
  // 8. القيم المعتمدة على settings
  // ================================================
  const freeShippingThreshold = settings?.free_shipping_threshold || 70
  const shippingCost = settings?.shipping_cost || 2

  const shipping = subtotal - discount >= freeShippingThreshold ? 0 : shippingCost
  const total = subtotal - discount + shipping

  // ================================================
  // 9. تحديث الأسعار المنسقة
  // ================================================
  useEffect(() => {
    const updateFormattedPrices = () => {
      const subtotalFormatted = formatPrice(subtotal, currency, exchangeRate)
      setFormattedSubtotal(subtotalFormatted)
      
      if (discount > 0) {
        const discountFormatted = formatPrice(discount, currency, exchangeRate)
        setFormattedDiscount(discountFormatted)
      }
      
      const shippingFormatted = shipping === 0 ? 'مجاني' : formatPrice(shipping, currency, exchangeRate)
      setFormattedShipping(shippingFormatted)
      
      const totalFormatted = formatPrice(total, currency, exchangeRate)
      setFormattedTotal(totalFormatted)
      
      if (shipping > 0) {
        const remaining = freeShippingThreshold - (subtotal - discount)
        const remainingFormatted = formatPrice(remaining, currency, exchangeRate)
        setFormattedShippingRemaining(remainingFormatted)
      }
    }
    
    updateFormattedPrices()
  }, [subtotal, discount, shipping, total, currency, exchangeRate, freeShippingThreshold])

  // ================================================
  // 10. دوال المعالجة (Handlers)
  // ================================================
  const handleQuantityChange = (item: CartItemWithProduct, newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > item.product.stock) {
      toast.error(`الكمية المتاحة: ${item.product.stock}`)
      return
    }
    updateCartItem(item.productId, newQuantity, item.selectedColor, item.selectedSize)
    loadCart()
  }

  const handleRemove = (item: CartItemWithProduct) => {
    removeFromCart(item.productId, item.selectedColor, item.selectedSize)
    loadCart()
    toast.success('تمت الإزالة من السلة')
  }

  const handleClearCart = () => {
    clearCart()
    setCartItems([])
    setAppliedCoupon(null)
    toast.success('تم إفراغ السلة')
  }

  const handleApplyCoupon = async () => {
    setCouponError('')
    const result = await validateCouponLocal(couponCode, subtotal)
    if (result.valid && result.coupon) {
      await updateCouponUsage(couponCode)
      setAppliedCoupon(result.coupon)
      toast.success('تم تطبيق كود الخصم')
    } else {
      setCouponError(result.error || 'كود غير صحيح')
      setAppliedCoupon(null)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  // ================================================
  // 11. حالة التحميل والسلة الفارغة
  // ================================================
  if (loading || !settings) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
      </>
    )
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">سلة التسوق فارغة</h1>
            <p className="text-muted-foreground mb-6">لم تضيفي أي منتجات بعد</p>
            <Button asChild>
              <Link href="/shop">تسوقي الآن</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ================================================
  // 12. الـ JSX (واجهة المستخدم)
  // ================================================
  return (
    <>
      <Header />

      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">سلة التسوق</h1>
              <p className="text-muted-foreground">{cartItems.length} منتج</p>
            </div>
            <Button variant="ghost" onClick={handleClearCart} className="text-destructive">
              إفراغ السلة
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => {
                const key = `${item.productId}-${item.selectedColor || ''}-${item.selectedSize || ''}-${index}`
                return (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Link href={`/product/${item.productId}`} className="shrink-0">
                          <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={item.product.images?.[0] || '/placeholder.jpg'}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `https://placehold.co/200x300/f5f0eb/d4a574?text=${encodeURIComponent(item.product.name.slice(0, 5))}`
                              }}
                            />
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.productId}`}>
                            <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.selectedColor && `اللون: ${item.selectedColor}`}
                            {item.selectedColor && item.selectedSize && ' | '}
                            {item.selectedSize && `المقاس: ${item.selectedSize}`}
                          </p>
                          <p className="font-bold text-primary">{itemPrices[key] || ''}</p>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{itemTotalPrices[key] || ''}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemove(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon */}
                  <div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="كود الخصم"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon ? (
                        <Button variant="outline" onClick={handleRemoveCoupon}>
                          إزالة
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={handleApplyCoupon}>
                          تطبيق
                        </Button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-sm text-destructive mt-1">{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                        <Tag className="h-4 w-4" />
                        <span>
                          تم تطبيق {appliedCoupon.code} -{' '}
                          {appliedCoupon.type === 'percentage'
                            ? `${appliedCoupon.value}%`
                            : appliedCoupon.value}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span>{formattedSubtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>الخصم</span>
                        <span>-{formattedDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحن</span>
                      <span>{formattedShipping}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-primary">{formattedTotal}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button asChild className="w-full gap-2" size="lg">
                    <Link href={`/checkout?coupon=${appliedCoupon?.code || ''}`}>
                      إتمام الطلب
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/shop">متابعة التسوق</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}