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
import { formatPriceAsync, fetchExchangeRate } from '@/lib/utils'
import type { CartItem, Product, Currency, Coupon } from '@/lib/types'
import { toast } from 'sonner'

interface CartItemWithProduct extends CartItem {
  product: Product
}

// قائمة المدن مع أسعار الشحن (بالدولار)
const SYRIAN_CITIES_WITH_SHIPPING = [
  { name: 'إدلب', shippingCost: 2 },
  { name: 'دمشق', shippingCost: 3 },
  { name: 'ريف دمشق', shippingCost: 3 },
  { name: 'حلب', shippingCost: 3 },
  { name: 'حمص', shippingCost: 3 },
  { name: 'حماة', shippingCost: 3 },
  { name: 'اللاذقية', shippingCost: 3 },
  { name: 'طرطوس', shippingCost: 3 },
  { name: 'درعا', shippingCost: 3 },
  { name: 'دير الزور', shippingCost: 3 },
  { name: 'الحسكة', shippingCost: 3 },
  { name: 'الرقة', shippingCost: 3 },
];

// ✅ دالة لجلب سعر الشحن للمدينة
const getShippingCostByCity = (cityName: string) => {
  const city = SYRIAN_CITIES_WITH_SHIPPING.find(c => c.name === cityName);
  return city?.shippingCost || 2; // القيمة الافتراضية 2$
};

// طرق الدفع
type PaymentMethod = {
  id: string
  name: string
  description: string
  icon: React.ElementType
  instructions?: string
  qrCode?: string;
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
    instructions: 'رقم شام كاش: 1077061925569253',
    qrCode: '/image/shamcash.jpg',
  },
];

// ================================================
// دوال السلة
// ================================================
const CART_KEY = 'sedra_cart'

const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

const clearCart = () => {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cartUpdated'))
}

// ================================================
// دوال الكوبونات
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

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // ================================================
  // 1. useState
  // ================================================
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<string>('cod')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [finalTotal, setFinalTotal] = useState('')

  const [formattedSubtotal, setFormattedSubtotal] = useState('')
  const [formattedDiscount, setFormattedDiscount] = useState('')
  const [formattedShipping, setFormattedShipping] = useState('')
  const [formattedTotal, setFormattedTotal] = useState('')
  const [formattedItemPrices, setFormattedItemPrices] = useState<Record<string, string>>({})
  const [formattedCouponValue, setFormattedCouponValue] = useState('')
  const [formattedShippingRemaining, setFormattedShippingRemaining] = useState('')
  // حالة لتتبع ما إذا تم الدفع عبر شام كاش
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ================================================
  // 2. useEffect (لا تعتمد على قيم محسوبة)
  // ================================================
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error fetching settings:', err))
  }, [])

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

  // 3. useMemo
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
// 4. القيم المحسوبة (يجب أن تكون قبل الـ useEffect التي تستخدمها)
// ================================================
const freeShippingThreshold = settings?.free_shipping_threshold || 70

// ✅ حساب الشحن حسب المدينة
const shippingCost = useMemo(() => {
  if (subtotal - discount >= freeShippingThreshold) {
    return 0;
  }
  return getShippingCostByCity(formData.city || '');
}, [formData.city, subtotal, discount, freeShippingThreshold]);

const total = subtotal - discount + shippingCost
const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedPayment)
  // ================================================
  // 5. useEffect التي تعتمد على total
  // ================================================
  useEffect(() => {
    const updateFinalTotal = async () => {
      const formatted = await formatPriceAsync(total, currency)
      setFinalTotal(formatted)
    }
    updateFinalTotal()
  }, [total, currency])

  // ================================================
  // 6. loadCart و useEffect الخاص بها
  // ================================================
  const loadCart = async () => {
    const cart = getCart()
    
    if (cart.length === 0) {
      setCartItems([])
      setLoading(false)
      return
    }
    
    try {
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
      
      const couponCodeParam = searchParams.get('coupon')
      if (couponCodeParam && itemsWithProducts.length > 0) {
        const subtotalVal = itemsWithProducts.reduce(
          (sum, item) => sum + item.product.price * item.quantity, 0
        )
        const result = await validateCouponLocal(couponCodeParam, subtotalVal)
        if (result.valid && result.coupon) {
          setAppliedCoupon(result.coupon)
          setCouponCode(couponCodeParam)
          toast.success('تم تطبيق الكوبون بنجاح!')
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      toast.error('حدث خطأ في تحميل السلة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [searchParams])

  // ================================================
  // 7. تحديث الأسعار المنسقة
  // ================================================
  useEffect(() => {
    const updateFormattedPrices = async () => {
      const subtotalFormatted = await formatPriceAsync(subtotal, currency)
      setFormattedSubtotal(subtotalFormatted)
      
      if (discount > 0) {
        const discountFormatted = await formatPriceAsync(discount, currency)
        setFormattedDiscount(discountFormatted)
      }
      
      const shippingFormatted = shippingCost === 0 ? 'مجاني' : await formatPriceAsync(shippingCost, currency)
      setFormattedShipping(shippingFormatted)
      
      const totalFormatted = await formatPriceAsync(total, currency)
      setFormattedTotal(totalFormatted)
      
      if (appliedCoupon && appliedCoupon.type === 'fixed') {
        const couponFormatted = await formatPriceAsync(appliedCoupon.value, currency)
        setFormattedCouponValue(couponFormatted)
      }
      
      if (shippingCost > 0) {
        const remaining = freeShippingThreshold - (subtotal - discount)
        if (remaining > 0) {
          const remainingFormatted = await formatPriceAsync(remaining, currency)
          setFormattedShippingRemaining(remainingFormatted)
        }
      }
      
      const prices: Record<string, string> = {}
      for (const item of cartItems) {
        const key = `${item.productId}-${item.selectedColor || ''}-${item.selectedSize || ''}`
        prices[key] = await formatPriceAsync(item.product.price * item.quantity, currency)
      }
      setFormattedItemPrices(prices)
    }
    
    if (cartItems.length > 0 || total > 0) {
      updateFormattedPrices()
    }
  }, [subtotal, discount, shippingCost, total, currency, cartItems, appliedCoupon, freeShippingThreshold])

  // ================================================
  // 8. دوال المعالجة (Handlers)
  // ================================================
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('الرجاء إدخال كود الخصم')
      return
    }

    setIsApplyingCoupon(true)
    const result = await validateCouponLocal(couponCode, subtotal)
    
    if (result.valid && result.coupon) {
      await updateCouponUsage(couponCode)
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
    if (!formData.customerEmail.trim()) {
    newErrors.customerEmail = 'البريد الإلكتروني مطلوب'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'بريد إلكتروني غير صحيح'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب'
    }
      if (!formData.city.trim()) {
    newErrors.city = 'الرجاء اختيار المدينة'
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
      let notes = formData.notes
      if (selectedPayment === 'sham_cash') {
        notes = `${formData.notes}\n\nطريقة الدفع: تحويل شام كاش\nرقم شام كاش:5265397042128263\nيرجى إرسال صورة الإيداع على واتساب بعد الطلب`
      }

      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        price: item.product.price,
        name: item.product.name,
      }))

      const orderData = {
        id: `ORD-${Math.floor(Math.random() * 1000)}`,
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

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      clearCart()
      window.dispatchEvent(new Event('cartUpdated'))

      if (selectedPayment === 'sham_cash') {
        // تنسيق المجموع للرسالة (إزالة الرموز)
        const totalAmount = formattedTotal.replace('$', '').replace('ل.س', '').trim()
        
        const whatsappMessage = `مرحباً،\n\nأود تأكيد طلبي رقم ${orderData.id}:\n\n` +
          `الاسم: ${orderData.customerName}\n` +
          `الهاتف: ${orderData.customerPhone}\n` +
          `العنوان: ${orderData.address}، ${orderData.city}\n\n` +
          `المنتجات:\n${orderItems.map(item => `- ${item.name} (الكمية: ${item.quantity})`).join('\n')}\n\n` +
          `المجموع: ${totalAmount}\n` +
          `طريقة الدفع: شام كاش\n\n` +
          `الرجاء تأكيد طلبي. شكراً!`
        
        // رقم الواتساب من الإعدادات أو الرقم الافتراضي
        const whatsappNumber = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '963950534327'
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
        window.open(whatsappUrl, '_blank')
      }

      setOrderId(orderData.id)
      setOrderComplete(true)
      
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('حدث خطأ أثناء إنشاء الطلب')
    } finally {
      setIsSubmitting(false)
    }
  }
  // ================================================
  // 9. حالات التحميل والعرض
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
                    <span className="font-bold">{finalTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">طريقة الدفع</span>
                    <span>{selectedPaymentMethod?.name}</span>
                  </div>
                  {selectedPayment === 'sham_cash' && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-right">
                      <p className="text-xs text-blue-700">
                        <strong>تعليمات الدفع:</strong> يرجى تحويل المبلغ على رقم شام كاش 5265397042128263 وإرسال صورة الإيداع على واتساب
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
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/cart" className="hover:text-primary">السلة</Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">إتمام الطلب</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* نموذج معلومات التوصيل - نفس الكود */}
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
                      <Label htmlFor="email" className="mb-2 block">البريد الإلكتروني*</Label>
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
  const Icon = method.icon;
  return (
    <div
      key={method.id}
      className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
        selectedPayment === method.id
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={() => {
        setSelectedPayment(method.id);
        if (method.id !== 'sham_cash') {
          setIsPaymentConfirmed(false);
          setPaymentNote('');
        }
      }}
    >
      <div className="flex items-start gap-3">
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
        </div>
      </div>

      {/* ✅ تعليمات شام كاش مع QR Code وزر التأكيد */}
      {selectedPayment === 'sham_cash' && method.id === 'sham_cash' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* رمز QR */}
            {method.qrCode && (
              <div className="shrink-0">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <Image
                    src={method.qrCode}
                    alt="رمز الدفع عبر شام كاش"
                    width={150}
                    height={150}
                    className="w-36 h-36"
                  />
                </div>
                <p className="text-center text-xs text-blue-700 mt-2">
                  امسح الكود للدفع
                </p>
              </div>
            )}

            {/* تعليمات الدفع */}
            <div className="flex-1 text-right">
              <p className="font-semibold text-blue-800 mb-2">SEDRA</p>
              <p className="text-sm text-blue-700">
                بعد إتمام الدفع عبر الكود، انتظر لتفعيل زر <strong>"إتمام الطلب"</strong>
              </p>
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800 font-medium mb-1">📌 تذكير مهم</p>
                <p className="text-xs text-yellow-700">
                  بعد تأكيد الطلب، سيتم فتح محادثة واتساب تلقائياً مع رسالة تحتوي على تفاصيل طلبك.
                  يرجى إرسال هذه الرسالة لضمان معالجة طلبك بسرعة.
                </p>
              </div>
              
              {/* ✅ زر تأكيد الدفع */}
              <Button
                type="button"
                variant={isPaymentConfirmed ? "default" : "outline"}
                className="w-full mt-4"
                onClick={() => setIsPaymentConfirmed(!isPaymentConfirmed)}
              >
                {isPaymentConfirmed ? '✓ تم تأكيد الدفع' : '✔️ تأكيد الدفع'}
              </Button>
              {isPaymentConfirmed && (
                <p className="text-xs text-green-600 mt-2 text-center">
                  ✓ تم تأكيد الدفع. يمكنك الآن إتمام الطلب.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
})}
                    </div>
                  </CardContent>
                </Card>

                <Button 
  type="submit" 
  size="lg" 
  className="w-full" 
  disabled={isSubmitting || (selectedPayment === 'sham_cash' && !isPaymentConfirmed)}
>
  {isSubmitting 
    ? 'جاري إنشاء الطلب...' 
    : `تأكيد الطلب - ${formattedTotal}`
  }
</Button>
              </form>
            </div>

            <div>
  <Card className="sticky top-24">
    <CardHeader>
      <CardTitle>ملخص الطلب</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      
      {/* ✅ اختيار المدينة */}
      <div>
          <Label htmlFor="city" className="mb-2 block">
                المدينة <span className="text-destructive">*</span>
              </Label>        <Select
          value={formData.city}
          onValueChange={(value) => setFormData({ ...formData, city: value })}
        >
          <SelectTrigger className={errors.city ? 'border-destructive ring-destructive' : ''}>
                <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
          <SelectContent>
            {SYRIAN_CITIES_WITH_SHIPPING.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                <div className="flex justify-between w-full items-center gap-4">
                  <span>{city.name}</span>
                  <span className={`text-sm ${city.shippingCost === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    ${city.shippingCost}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Coupon */}
      <div>
        <div className="flex gap-2">
          <Input
            placeholder="أدخل الكود"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={!!appliedCoupon}
            className="flex-1"
          />
          {appliedCoupon ? (
            <Button type="button" variant="outline" onClick={handleRemoveCoupon} className="gap-1">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode.trim()}>
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
              : ` خصم ${formattedCouponValue}`}
          </p>
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
            <span>الخصم ({appliedCoupon?.code})</span>
            <span>-{formattedDiscount}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">الشحن</span>
          <span>{formattedShipping}</span>
        </div>
        {shippingCost > 0 && formattedShippingRemaining && (
          <p className="text-xs text-muted-foreground">
            أضيفي {formattedShippingRemaining} للحصول على شحن مجاني
          </p>
        )}
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-lg">
        <span>الإجمالي</span>
        <span className="text-primary">{formattedTotal}</span>
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