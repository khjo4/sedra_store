'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatPriceAsync, fetchExchangeRate } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import { toast } from 'sonner'
import {
  addLocalCartItem,
  getOrCreateCartSessionId,
  isInWishlist,
  isProductInCart,
  toggleWishlistId,
} from '@/lib/cart-wishlist'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [inCart, setInCart] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [formattedPrice, setFormattedPrice] = useState('')
  const [formattedOriginalPrice, setFormattedOriginalPrice] = useState('')
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [heartAnimating, setHeartAnimating] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)
  const [floatingHearts] = useState<number[]>([])
  const [flyingProduct, setFlyingProduct] = useState(false)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const productId = String(product.id)

  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = localStorage.getItem('sedra_currency')
      const currentCurrency = (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
      setCurrency(currentCurrency)
      await fetchExchangeRate()
      setFormattedPrice(await formatPriceAsync(product.price, currentCurrency))
      if (product.originalPrice) {
        setFormattedOriginalPrice(
          await formatPriceAsync(product.originalPrice, currentCurrency)
        )
      }
    }
    loadCurrency()
    const handleCurrencyChange = () => loadCurrency()
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [product.price, product.originalPrice])

  useEffect(() => {
    setIsWishlisted(isInWishlist(productId))
    setInCart(isProductInCart(productId))
    const syncCart = () => setInCart(isProductInCart(productId))
    const syncWishlist = () => setIsWishlisted(isInWishlist(productId))
    window.addEventListener('cartUpdated', syncCart)
    window.addEventListener('wishlistUpdated', syncWishlist)
    window.addEventListener('storage', syncCart)
    window.addEventListener('storage', syncWishlist)
    return () => {
      window.removeEventListener('cartUpdated', syncCart)
      window.removeEventListener('wishlistUpdated', syncWishlist)
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('storage', syncWishlist)
    }
  }, [productId])

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
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCart || isProductInCart(productId)) {
      window.location.href = '/cart'
      return
    }

    setCartAnimating(true)
    setFlyingProduct(true)
    setTimeout(() => setCartAnimating(false), 300)
    setTimeout(() => setFlyingProduct(false), 600)

    addLocalCartItem({
      productId,
      quantity: 1,
      selectedColor: product.colors?.[0] || '',
      selectedSize: product.sizes?.[0] || '',
    })
    setInCart(true)
    toast.success('تمت الإضافة إلى السلة', { description: product.name })

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getOrCreateCartSessionId(),
          productId,
          quantity: 1,
          selectedColor: product.colors?.[0] || null,
          selectedSize: product.sizes?.[0] || null,
        }),
      })
    } catch (error) {
      console.error('Cart API sync failed (local cart OK):', error)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setHeartAnimating(true)
    setTimeout(() => setHeartAnimating(false), 300)

    const adding = toggleWishlistId(productId)
    setIsWishlisted(adding)
    toast[adding ? 'success' : 'info'](
      adding ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة'
    )

    try {
      if (adding) {
        await fetch('/api/wishlist', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
      } else {
        await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      }
    } catch {
      // الزائر يعتمد على localStorage
    }
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  const placeholderImage = `https://placehold.co/400x500/f5f0eb/d4a574?text=${encodeURIComponent(product.name.slice(0, 10))}`
  const imageSrc = imageError ? placeholderImage : product.images?.[0] || placeholderImage

  return (
    <Link
      ref={cardRef}
      href={`/product/${productId}`}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-border/50 bg-card/90 shadow-[0_1px_0_oklch(0_0_0/0.03)] transition-all duration-300 hover:border-primary/25 hover:shadow-[0_18px_40px_-28px_oklch(0.35_0.04_20/0.4)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        'transition-all duration-500 ease-out',
        className
      )}
    >
      <div className="relative aspect-4/5 overflow-hidden bg-secondary/40">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          unoptimized={imageSrc.includes('placehold.co')}
          onError={() => setImageError(true)}
        />

        {flyingProduct && (
          <div className="absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 animate-fly-to-cart">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
          </div>
        )}

        <div className="absolute top-3 start-3 flex flex-col gap-2">
          {discount > 0 && (
            <Badge className="rounded-lg bg-destructive text-destructive-foreground shadow-sm">
              -{discount}%
            </Badge>
          )}
          {product.newArrival && (
            <Badge variant="secondary" className="rounded-lg">
              جديد
            </Badge>
          )}
          {product.bestSeller && (
            <Badge className="rounded-lg bg-accent text-accent-foreground shadow-sm">
              الأكثر مبيعاً
            </Badge>
          )}
        </div>

        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px]">
            <Badge variant="outline" className="rounded-xl px-4 py-2 text-base">
              نفذت الكمية
            </Badge>
          </div>
        )}
      </div>

      <div className="p-3.5 md:p-4">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {product.category === 'accessories' && 'اكسسوارات'}
          {product.category === 'perfumes' && 'عطورات'}
          {product.category === 'makeup' && 'مكياج'}
          {product.category === 'cup' && 'أكواب'}
          {product.category === 'care' && 'العناية والاهتمام'}
          {product.category === 'gift-sets' && 'مجموعات الهدايا'}
        </p>
        {product.stock === 0 && <p className="mt-1 text-xs text-destructive">نفذت الكمية</p>}
        {product.stock > 0 && product.stock < 5 && (
          <p className="mt-1 text-xs text-orange-600">متبقي {product.stock} قطع فقط!</p>
        )}
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-bold text-primary">{formattedPrice}</span>
          {product.originalPrice && formattedOriginalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formattedOriginalPrice}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-border/40 pt-2.5">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-9 w-9 rounded-full hover:bg-primary/10',
              heartAnimating && 'animate-heart-pop',
              isWishlisted && 'bg-primary/10 text-primary'
            )}
            onClick={handleWishlist}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-primary text-primary')} />
            <span className="sr-only">إضافة للمفضلة</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-9 w-9 rounded-full hover:bg-primary/10',
              cartAnimating && 'animate-cart-click',
              inCart && 'bg-primary/10 text-primary'
            )}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            title={inCart ? 'عرض السلة' : 'إضافة للسلة'}
          >
            <ShoppingBag className={cn('h-4 w-4', inCart && 'fill-primary text-primary')} />
            <span className="sr-only">{inCart ? 'عرض السلة' : 'إضافة للسلة'}</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full hover:bg-primary/10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/product/${productId}`
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">عرض سريع</span>
          </Button>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{product.colors.length} ألوان</span>
          </div>
        )}
      </div>
    </Link>
  )
}
