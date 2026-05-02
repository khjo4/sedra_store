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
import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCoupon,
  formatPrice,
  getCurrency,
  getSettings,
} from '@/lib/store'
import type { CartItem, Product, Currency, Coupon } from '@/lib/types'
import { toast } from 'sonner'

interface CartItemWithProduct extends CartItem {
  product: Product
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(true)
  const settings = getSettings()

  // جلب المنتجات من API وتحويل عناصر السلة
  const loadCart = async () => {
    setLoading(true)
    const cart = getCart()
    
    if (cart.length === 0) {
      setCartItems([])
      setLoading(false)
      return
    }
    
    try {
      // جلب جميع المنتجات من API
      const response = await fetch('/api/products')
      const allProducts = await response.json()
      
      // ربط عناصر السلة بالمنتجات
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

  useEffect(() => {
    loadCart()
    setCurrency(getCurrency())

    const handleCartUpdate = () => loadCart()
    const handleCurrencyChange = () => setCurrency(getCurrency())

    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('currencyChanged', handleCurrencyChange)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('currencyChanged', handleCurrencyChange)
    }
  }, [])

  const handleQuantityChange = (item: CartItemWithProduct, newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > item.product.stock) {
      toast.error(`الكمية المتاحة: ${item.product.stock}`)
      return
    }
    updateCartItem(item.productId, newQuantity, item.selectedColor, item.selectedSize)
    loadCart()
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleRemove = (item: CartItemWithProduct) => {
    removeFromCart(item.productId, item.selectedColor, item.selectedSize)
    loadCart()
    window.dispatchEvent(new Event('cartUpdated'))
    toast.success('تمت الإزالة من السلة')
  }

  const handleClearCart = () => {
    clearCart()
    setCartItems([])
    setAppliedCoupon(null)
    window.dispatchEvent(new Event('cartUpdated'))
    toast.success('تم إفراغ السلة')
  }

  const handleApplyCoupon = () => {
    setCouponError('')
    const result = validateCoupon(couponCode, subtotal)
    if (result.valid && result.coupon) {
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

  const shipping = subtotal - discount >= settings.freeShippingThreshold ? 0 : settings.shippingCost
  const total = subtotal - discount + shipping

  // عرض شاشة تحميل
  if (loading) {
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
              {cartItems.map((item) => (
                <Card key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}>
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
                        <p className="font-bold text-primary">
                          {formatPrice(item.product.price, currency)}
                        </p>

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
                            <span className="font-semibold">
                              {formatPrice(item.product.price * item.quantity, currency)}
                            </span>
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
              ))}
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
                            : formatPrice(appliedCoupon.value, currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span>{formatPrice(subtotal, currency)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>الخصم</span>
                        <span>-{formatPrice(discount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحن</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-green-600">مجاني</span>
                        ) : (
                          formatPrice(shipping, currency)
                        )}
                      </span>
                    </div>
                    {shipping > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        أضيفي {formatPrice(settings.freeShippingThreshold - (subtotal - discount), currency)} للحصول على شحن مجاني
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">✓ أنت مؤهل للشحن المجاني</p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-primary">{formatPrice(total, currency)}</span>
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