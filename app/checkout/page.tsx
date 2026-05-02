'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle2, 
  ChevronLeft, 
  Truck, 
  CreditCard, 
  MapPin, 
  Tag, 
  X,
  Banknote,
  Smartphone,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  getCart,
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

// قائمة المدن السورية
const SYRIAN_CITIES = [
  'دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس',
  'دير الزور', 'الحسكة', 'الرقة', 'إدلب', 'السويداء', 'درعا', 'القنيطرة',
]

// طرق الدفع
type PaymentMethod = {
  id: string
  name: string
  description: string
  icon: React.ElementType
  instructions?: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'الدفع عند الاستلام',
    description: 'ادفعي نقداً عند استلام الطلب',
    icon: Banknote,
  },
  {
    id: 'sham_cash',
    name: 'تحويل شام كاش',
    description: 'تحويل عبر تطبيق شام كاش',
    icon: Smartphone,
    instructions: 'رقم شام كاش: 0999 123 456 | يرجى إرسال صورة الإيداع على واتساب',
  },
]

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<string>('cod')
  const [loading, setLoading] = useState(true)
  const settings = getSettings()

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // جلب المنتجات من API وتحويل عناصر السلة
  const loadCart = async () => {
    const cart = getCart()
    
    if (cart.length === 0) {
      setCartItems([])
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/products')
      const allProducts = await response.json()
      
      const itemsWithProducts = cart
        .map((item) => {
          const product = allProducts.find((p: Product) => p.id === item.productId)
          if (!product) return null
          return { ...item, product }
        })
        .filter(Boolean) as CartItemWithProduct[]
      
      setCartItems(itemsWithProducts)
      
      // Apply coupon from URL
      const couponCodeParam = searchParams.get('coupon')
      if (couponCodeParam) {
        const subtotal = itemsWithProducts.reduce(
          (sum, item) => sum + item.product.price * item.quantity, 0
        )
        const result = validateCoupon(couponCodeParam, subtotal)
        if (result.valid && result.coupon) {
          setAppliedCoupon(result.coupon)
          setCouponCode(couponCodeParam)
          toast.success('تم تطبيق الكوبون بنجاح!')
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
    setCurrency(getCurrency())

    const handleCurrencyChange = () => setCurrency(getCurrency())
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [searchParams])

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

  const shippingCost = subtotal - discount >= settings.freeShippingThreshold ? 0 : settings.shippingCost
  const total = subtotal - discount + shippingCost
  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedPayment)

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('الرجاء إدخال كود الخصم')
      return
    }

    setIsApplyingCoupon(true)
    const result = validateCoupon(couponCode, subtotal)
    
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon)
      toast.success(`تم تطبيق الكوبون ${couponCode} بنجاح!`)
    } else {
      toast.error(result.error || 'كود خصم غير صالح')
    }
    setIsApplyingCoupon(false)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    toast.info('تم إلغاء الكوبون')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'الاسم مطلوب'
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'رقم الهاتف مطلوب'
    } else if (!/^[\d\s+()-]{9,}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'رقم هاتف غير صحيح'
    }
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'بريد إلكتروني غير صحيح'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) {
    toast.error('الرجاء تعبئة جميع الحقول المطلوبة')
    return
  }

  if (cartItems.length === 0) {
    toast.error('السلة فارغة')
    return
  }

  setIsSubmitting(true)

  try {
    // إضافة تعليمات الدفع لشام كاش في الملاحظات
    let notes = formData.notes
    if (selectedPayment === 'sham_cash') {
      notes = `${formData.notes}\n\nطريقة الدفع: تحويل شام كاش\nرقم شام كاش: 0999 123 456\nيرجى إرسال صورة الإيداع على واتساب بعد الطلب`
    }

    // تحضير عناصر الطلب
    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      price: item.product.price,
      name: item.product.name,
    }))

    // إنشاء الطلب عبر API
    const orderData = {
      id: `ORD-${Date.now()}`,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || '',
      customerPhone: formData.customerPhone,
      address: formData.address,
      city: formData.city,
      subtotal: subtotal,
      discount: discount,
      shipping: shippingCost,
      total: total,
      status: 'pending',
      paymentMethod: selectedPayment,
      couponCode: appliedCoupon?.code || null,
      notes: notes,
      items: orderItems,
    }

    console.log('Sending order:', orderData) // للتأكد من البيانات

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    })

    const result = await response.json()
    console.log('Response:', result)

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create order')
    }

    // Clear cart
    clearCart()
    window.dispatchEvent(new Event('cartUpdated'))

    setOrderId(orderData.id)
    setOrderComplete(true)
  } catch (error) {
    console.error('Error creating order:', error)
    toast.error('حدث خطأ أثناء إنشاء الطلب')
  } finally {
    setIsSubmitting(false)
  }
}

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

  if (orderComplete) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">تم استلام طلبك بنجاح!</h1>
            <p className="text-muted-foreground mb-4">
              شكراً لك! سنتواصل معك قريباً لتأكيد الطلب
            </p>
            <Card className="mb-6 text-right">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الطلب</span>
                    <span className="font-mono">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ الإجمالي</span>
                    <span className="font-bold">{formatPrice(total, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">طريقة الدفع</span>
                    <span>{selectedPaymentMethod?.name}</span>
                  </div>
                  {selectedPayment === 'sham_cash' && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-right">
                      <p className="text-xs text-blue-700">
                        <strong>تعليمات الدفع:</strong> يرجى تحويل المبلغ على رقم شام كاش 0999 123 456 وإرسال صورة الإيداع على واتساب
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/shop">متابعة التسوق</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">الرئيسية</Link>
              </Button>
            </div>
          </div>
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
            <h1 className="text-2xl font-bold mb-4">السلة فارغة</h1>
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/cart" className="hover:text-primary">السلة</Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">إتمام الطلب</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      معلومات التوصيل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="mb-2 block">الاسم الكامل *</Label>
                        <Input
                          id="name"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className={errors.customerName ? 'border-destructive' : ''}
                        />
                        {errors.customerName && (
                          <p className="text-sm text-destructive mt-1">{errors.customerName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="mb-2 block">رقم الهاتف *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          dir="ltr"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                          className={errors.customerPhone ? 'border-destructive' : ''}
                        />
                        {errors.customerPhone && (
                          <p className="text-sm text-destructive mt-1">{errors.customerPhone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="mb-2 block">البريد الإلكتروني (اختياري)</Label>
                      <Input
                        id="email"
                        type="email"
                        dir="ltr"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className={errors.customerEmail ? 'border-destructive' : ''}
                      />
                      {errors.customerEmail && (
                        <p className="text-sm text-destructive mt-1">{errors.customerEmail}</p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="mb-2 block">المدينة *</Label>
                        <Select
                          value={formData.city}
                          onValueChange={(value) => setFormData({ ...formData, city: value })}
                        >
                          <SelectTrigger className={errors.city ? 'border-destructive' : ''}>
                            <SelectValue placeholder="اختر المدينة" />
                          </SelectTrigger>
                          <SelectContent>
                            {SYRIAN_CITIES.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.city && (
                          <p className="text-sm text-destructive mt-1">{errors.city}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="address" className="mb-2 block">العنوان التفصيلي *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className={errors.address ? 'border-destructive' : ''}
                        />
                        {errors.address && (
                          <p className="text-sm text-destructive mt-1">{errors.address}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="mb-2 block">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="تعليمات خاصة للتوصيل..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      طريقة الدفع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <div
                            key={method.id}
                            className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedPayment === method.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedPayment(method.id)}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                selectedPayment === method.id
                                  ? 'border-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedPayment === method.id && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span className="font-medium">{method.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {method.description}
                                </p>
                                {method.instructions && selectedPayment === method.id && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                    <p className="font-medium mb-1">📱 تعليمات الدفع:</p>
                                    <p>{method.instructions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري إنشاء الطلب...' : `تأكيد الطلب - ${formatPrice(total, currency)}`}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                        className="flex gap-3"
                      >
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image
                            src={item.product.images?.[0] || '/placeholder.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://placehold.co/100x120/f5f0eb/d4a574?text=${encodeURIComponent(item.product.name.slice(0, 3))}`
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.selectedColor} {item.selectedSize && `| ${item.selectedSize}`} x{item.quantity}
                          </p>
                          <p className="text-sm font-medium">
                            {formatPrice(item.product.price * item.quantity, currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <Label>كود الخصم</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="أدخل الكود"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                        className="flex-1"
                      />
                      {appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveCoupon}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          إلغاء
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                        >
                          <Tag className="h-4 w-4 ml-1" />
                          تطبيق
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-green-600">
                        تم تطبيق الكوبون {appliedCoupon.code}: 
                        {appliedCoupon.type === 'percentage' 
                          ? ` خصم ${appliedCoupon.value}%` 
                          : ` خصم ${formatPrice(appliedCoupon.value, currency)}`}
                      </p>
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
                        <span>الخصم ({appliedCoupon?.code})</span>
                        <span>-{formatPrice(discount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الشحن</span>
                      <span>
                        {shippingCost === 0 ? (
                          <span className="text-green-600">مجاني</span>
                        ) : (
                          formatPrice(shippingCost, currency)
                        )}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-primary">{formatPrice(total, currency)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}