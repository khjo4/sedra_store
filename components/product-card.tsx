'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  addToCart, 
  addToWishlist, 
  removeFromWishlist, 
  isInWishlist, 
  formatPrice,
  getCurrency 
} from '@/lib/store'
import type { Product, Currency } from '@/lib/types'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  // Animation states
  const [heartAnimating, setHeartAnimating] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)
  const [showRipple, setShowRipple] = useState(false)
  const [floatingHearts, setFloatingHearts] = useState<number[]>([])
  const [flyingProduct, setFlyingProduct] = useState(false)
  
  const cardRef = useRef<HTMLAnchorElement>(null)
  const heartIdCounter = useRef(0)

  useEffect(() => {
    setIsWishlisted(isInWishlist(product.id))
    setCurrency(getCurrency())
    
    const handleCurrencyChange = () => {
      setCurrency(getCurrency())
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Trigger animations
    setCartAnimating(true)
    setFlyingProduct(true)
    
    // Reset cart animation
    setTimeout(() => setCartAnimating(false), 300)
    
    // Reset flying animation
    setTimeout(() => setFlyingProduct(false), 600)
    
    addToCart({
      productId: product.id,
      quantity: 1,
      selectedColor: product.colors?.[0],
      selectedSize: product.sizes?.[0],
    })
    
    toast.success('تمت الإضافة إلى السلة', {
      description: product.name,
    })
    
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isWishlisted) {
      removeFromWishlist(product.id)
      setIsWishlisted(false)
      toast.info('تمت الإزالة من المفضلة')
    } else {
      // Trigger animations for adding to wishlist
      setHeartAnimating(true)
      setShowRipple(true)
      
      // Add floating hearts
      const newHearts = [heartIdCounter.current++, heartIdCounter.current++, heartIdCounter.current++]
      setFloatingHearts(newHearts)
      
      // Reset animations
      setTimeout(() => {
        setHeartAnimating(false)
        setShowRipple(false)
      }, 400)
      
      setTimeout(() => setFloatingHearts([]), 800)
      
      addToWishlist(product.id)
      setIsWishlisted(true)
      toast.success('تمت الإضافة إلى المفضلة')
    }
    
    window.dispatchEvent(new Event('wishlistUpdated'))
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
          onError={() => setImageError(true)}
        />

        {/* Flying product animation */}
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

        {/* Out of Stock Overlay */}
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
        {/* Category */}
        <p className="text-xs text-muted-foreground mb-1">
          {product.category === 'accessories' && 'اكسسوارات'}
          {product.category === 'perfumes' && 'عطورات'}
          {product.category === 'makeup' && 'مكياج'}
          {product.category === 'gift-sets' && 'مجموعات الهدايا'}
        </p>

        {/* Name */}
        <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < Math.floor(product.rating)
                    ? 'fill-accent text-accent'
                    : 'fill-muted text-muted'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-primary">
            {formatPrice(product.price, currency)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice, currency)}
            </span>
          )}
        </div>

        {/* Action Buttons - ثابتة دائماً */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-border/50">
          {/* Wishlist Button */}
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
            
            {/* Floating hearts */}
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
          
          {/* Add to Cart Button */}
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
          
          {/* Quick View Button */}
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

        {/* Colors */}
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