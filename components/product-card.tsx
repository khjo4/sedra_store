'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatPriceAsync, fetchExchangeRate } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import { toast } from 'sonner'

// ================================================
// ✅ دوال السلة والمفضلة (مركزية - مؤقتاً)
// ================================================
const CART_KEY = 'sedra_cart'
const WISHLIST_KEY = 'sedra_wishlist'

const getCart = (): any[] => {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

const saveCart = (cart: any[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

const addToCart = (item: any) => {
  const cart = getCart()
  const existingIndex = cart.findIndex(
    (i: any) => i.productId === item.productId && 
               i.selectedColor === item.selectedColor && 
               i.selectedSize === item.selectedSize
  )
  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity
  } else {
    cart.push(item)
  }
  saveCart(cart)
}

const getWishlist = (): string[] => {
  if (typeof window === 'undefined') return []
  const wishlist = localStorage.getItem(WISHLIST_KEY)
  return wishlist ? JSON.parse(wishlist) : []
}

const saveWishlist = (wishlist: string[]) => {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  window.dispatchEvent(new Event('wishlistUpdated'))
}

const isInWishlistLocal = (productId: string): boolean => {
  return getWishlist().includes(productId)
}

// ================================================
// ✅ دوال العملة - محذوفة ومستبدلة بـ lib/utils
// ================================================
// تم إزالة getCurrencyLocal و formatPriceLocal
// الآن نستخدم:
// - formatPriceAsync من lib/utils
// - fetchExchangeRate من lib/utils

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [formattedPrice, setFormattedPrice] = useState('')
  const [formattedOriginalPrice, setFormattedOriginalPrice] = useState('')
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  // Animation states
  const [heartAnimating, setHeartAnimating] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)
  const [floatingHearts, setFloatingHearts] = useState<number[]>([])
  const [flyingProduct, setFlyingProduct] = useState(false)
  
  const cardRef = useRef<HTMLAnchorElement>(null)

  // ================================================
  // ✅ تحميل العملة وسعر الصرف
  // ================================================
  useEffect(() => {
    const loadCurrency = async () => {
      // جلب العملة من localStorage
      const savedCurrency = localStorage.getItem('sedra_currency')
      const currentCurrency = (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
      setCurrency(currentCurrency)
      
      // جلب سعر الصرف من API
      const rate = await fetchExchangeRate()
      setExchangeRate(rate)
      
      // تنسيق الأسعار
      const priceFormatted = await formatPriceAsync(product.price, currentCurrency)
      setFormattedPrice(priceFormatted)
      
      if (product.originalPrice) {
        const originalFormatted = await formatPriceAsync(product.originalPrice, currentCurrency)
        setFormattedOriginalPrice(originalFormatted)
      }
    }
    
    loadCurrency()
    
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [product.price, product.originalPrice])

  // ================================================
  // ✅ المفضلة
  // ================================================
  useEffect(() => {
    setIsWishlisted(isInWishlistLocal(product.id))
  }, [product.id])

  // Intersection observer for scroll fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  const handleAddToCart = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  
  setCartAnimating(true)
  setFlyingProduct(true)
  
  setTimeout(() => setCartAnimating(false), 300)
  setTimeout(() => setFlyingProduct(false), 600)
  
  // ✅ جلب sessionId من localStorage أو إنشاء واحد جديد
  let sessionId = localStorage.getItem('cart_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('cart_session_id', sessionId)
  }
  
  const cartItem = {
    sessionId: sessionId,
    productId: product.id,
    quantity: 1,
    selectedColor: product.colors?.[0],
    selectedSize: product.sizes?.[0],
  }
  
  try {
    // ✅ 1. إرسال إلى قاعدة البيانات عبر API
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cartItem),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to add to cart')
    }
    
    // ✅ 2. تحديث localStorage
    const cart = getCart()
    const existingIndex = cart.findIndex(
      (i: any) => i.productId === cartItem.productId && 
                 i.selectedColor === cartItem.selectedColor && 
                 i.selectedSize === cartItem.selectedSize
    )
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += cartItem.quantity
    } else {
      cart.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        selectedColor: cartItem.selectedColor,
        selectedSize: cartItem.selectedSize,
      })
    }
    saveCart(cart)
    
    toast.success('تمت الإضافة إلى السلة', {
      description: product.name,
    })
    
    window.dispatchEvent(new Event('cartUpdated'))
    
  } catch (error) {
    console.error('Error adding to cart:', error)
    toast.error('حدث خطأ في إضافة المنتج للسلة')
  }
}

const handleWishlist = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  
  const customerEmail = localStorage.getItem('user_email') || 'guest@sedra.com'
  const WISHLIST_KEY = 'sedra_wishlist'
  
  try {
    if (isWishlisted) {
      // ✅ 1. حذف من قاعدة البيانات
      const response = await fetch(`/api/wishlist?email=${customerEmail}&productId=${product.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to remove')
      
      // ✅ 2. تحديث localStorage
      let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
      wishlist = wishlist.filter((id: string) => id !== product.id)
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
      
      setIsWishlisted(false)
      toast.info('تمت الإزالة من المفضلة')
      
    } else {
      // ✅ 1. إضافة إلى قاعدة البيانات
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: customerEmail,
          productId: product.id,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to add')
      
      // ✅ 2. تحديث localStorage
      const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
      wishlist.push(product.id)
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
      
      setIsWishlisted(true)
      toast.success('تمت الإضافة إلى المفضلة')
    }
    
    // ✅ 3. نشر الأحداث
    window.dispatchEvent(new Event('wishlistUpdated'))
    window.dispatchEvent(new Event('storage'))
    
  } catch (error) {
    console.error('Error updating wishlist:', error)
    toast.error('حدث خطأ في تحديث المفضلة')
  }
}

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const placeholderImage = `https://placehold.co/400x500/f5f0eb/d4a574?text=${encodeURIComponent(product.name.slice(0, 10))}`

  return (
    <Link
      ref={cardRef}
      href={`/product/${product.id}`}
      className={cn(
        'group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover-lift',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        'transition-all duration-500 ease-out',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        <Image
          src={imageError ? placeholderImage : (product.images[0] || placeholderImage)}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false}
          loading="lazy"
          onError={() => setImageError(true)}
        />

        {flyingProduct && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-fly-to-cart">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          {product.newArrival && (
            <Badge variant="secondary">جديد</Badge>
          )}
          {product.bestSeller && (
            <Badge className="bg-accent text-accent-foreground">الأكثر مبيعاً</Badge>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="outline" className="text-base py-2 px-4">
              نفذت الكمية
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">
              {product.category === 'accessories' && 'اكسسوارات'}
              {product.category === 'perfumes' && 'عطورات'}
              {product.category === 'makeup' && 'مكياج'}
              {product.category === 'cup' && 'أكواب'}
              {product.category === 'care' && 'العناية والاهتمام'}
              {product.category === 'gift-sets' && 'مجموعات الهدايا'}
        </p>

{/* ✅ حالة المخزون في البطاقة */}
{product.stock === 0 && (
  <p className="text-xs text-red-500 mt-1">نفذت الكمية</p>
)}
{product.stock > 0 && product.stock < 5 && (
  <p className="text-xs text-orange-500 mt-1">متبقي {product.stock} قطع فقط!</p>
)}

        <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* ✅ Price - الآن يستخدم الأسعار المتزامنة مع API */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-primary">
            {formattedPrice}
          </span>
         {product.originalPrice && formattedOriginalPrice && (
  <span className="text-sm text-muted-foreground line-through relative -top-0.5">
    {formattedOriginalPrice}
  </span>
)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-border/50">
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-8 w-8 rounded-full hover:bg-primary/10 transition-all',
                heartAnimating && 'animate-heart-pop',
                isWishlisted && 'text-primary bg-primary/10'
              )}
              onClick={handleWishlist}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-all',
                  isWishlisted && 'fill-primary text-primary'
                )}
              />
              <span className="sr-only">إضافة للمفضلة</span>
            </Button>
            
            {floatingHearts.map((id, index) => (
              <Heart
                key={id}
                className={cn(
                  'absolute h-3 w-3 fill-primary text-primary animate-float-heart pointer-events-none',
                  index === 0 && 'top-0 left-1/2 -translate-x-1/2',
                  index === 1 && 'top-1 left-0',
                  index === 2 && 'top-1 right-0'
                )}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              />
            ))}
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-8 w-8 rounded-full hover:bg-primary/10 transition-all',
              cartAnimating && 'animate-cart-click'
            )}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="sr-only">إضافة للسلة</span>
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full hover:bg-primary/10 transition-all"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/product/${product.id}`
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">عرض سريع</span>
          </Button>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-muted-foreground">
              {product.colors.length} ألوان
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}