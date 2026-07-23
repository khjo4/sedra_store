'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Heart, ShoppingBag, Minus, Plus, Star, ChevronLeft, Truck, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { cn, formatPrice, fetchExchangeRate } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import { toast } from 'sonner'
import {
  getCart,
  saveCart,
  sameCartVariant,
  isInWishlist,
  toggleWishlistId,
} from '@/lib/cart-wishlist'

const isVariantInCart = (
  productId: string,
  color?: string,
  size?: string
) => getCart().some((item) => sameCartVariant(item, productId, color, size))

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [inCart, setInCart] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // حالات للأسعار المنسقة
  const [formattedPrice, setFormattedPrice] = useState('')
  const [formattedOriginalPrice, setFormattedOriginalPrice] = useState('')
  const [shippingInfo, setShippingInfo] = useState({
    freeThreshold: 0,
  })

  // ================================================
  // جلب المنتج من API
  // ================================================
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const data = await response.json()
        
        const safeProduct = {
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
          colors: Array.isArray(data.colors) ? data.colors : [],
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
        }
        
        setProduct(safeProduct)
        setSelectedColor(safeProduct.colors?.[0] || '')
        setSelectedSize(safeProduct.sizes?.[0] || '')
        
        setIsWishlisted(isInWishlist(String(safeProduct.id)))
      } catch (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // تحديث حالة «في السلة» حسب اللون/المقاس المختار
  useEffect(() => {
    if (!product) return
    const sync = () => {
      setInCart(isVariantInCart(product.id, selectedColor, selectedSize))
    }
    sync()
    window.addEventListener('cartUpdated', sync)
    return () => window.removeEventListener('cartUpdated', sync)
  }, [product, selectedColor, selectedSize])

  // ================================================
  // تحميل العملة وسعر الصرف
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

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        setShippingInfo({
          freeThreshold: Number(
            data.freeShippingThreshold ?? data.free_shipping_threshold ?? 0
          ),
        })
      })
      .catch(() => {})
    
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  // ================================================
  // تحديث الأسعار عند تغير المنتج أو العملة
  // ================================================
  useEffect(() => {
    if (!product) return
    
    const updatePrices = () => {
      const priceFormatted = formatPrice(product.price, currency, exchangeRate)
      setFormattedPrice(priceFormatted)
      
      if (product.originalPrice) {
        const originalFormatted = formatPrice(product.originalPrice, currency, exchangeRate)
        setFormattedOriginalPrice(originalFormatted)
      }
    }
    
    updatePrices()
  }, [product, currency, exchangeRate])

  // ================================================
  // جلب المنتجات المشابهة (محسّن)
  // ================================================
  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!product) return
      
      try {
        // ✅ تحسين الأداء: جلب المنتجات من نفس القسم فقط
        const response = await fetch(`/api/products?category=${product.category}&limit=5`)
        const data = await response.json()
        const allProducts = Array.isArray(data) ? data : data.products || []
        const related = allProducts
          .filter((p: Product) => p.id !== product.id)
          .slice(0, 4)
        setRelatedProducts(related)
      } catch (error) {
        console.error('Error fetching related products:', error)
        // Fallback: جلب منتجات عشوائية
        try {
          const fallbackResponse = await fetch('/api/products?limit=4')
          const fallbackData = await fallbackResponse.json()
          const fallbackProducts = Array.isArray(fallbackData) ? fallbackData : fallbackData.products || []
          setRelatedProducts(fallbackProducts.filter((p: Product) => p.id !== product.id))
        } catch (fallbackError) {
          console.error('Fallback failed:', fallbackError)
        }
      }
    }
    
    fetchRelatedProducts()
  }, [product])

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      accessories: 'اكسسوارات',
      perfumes: 'عطورات',
      makeup: 'مكياج',
      cup: 'أكواب',
      care: 'العناية والاهتمام',
      'gift-sets': 'مجموعات الهدايا',
    }
    return categoryMap[category] || category
  }

  const handleAddToCart = () => {
    if (!product) return

    // الزر يعرض «في السلة» — لا تضف مرة ثانية، اذهب للسلة
    if (inCart || isVariantInCart(product.id, selectedColor, selectedSize)) {
      router.push('/cart')
      return
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('الرجاء اختيار المقاس')
      return
    }

    const cart = getCart()
    cart.push({
      productId: String(product.id),
      quantity,
      selectedColor: selectedColor || '',
      selectedSize: selectedSize || '',
    })

    saveCart(cart)
    setInCart(true)

    toast.success('تمت الإضافة إلى السلة', {
      description: `${product.name} (${quantity})`,
      action: {
        label: 'عرض السلة',
        onClick: () => router.push('/cart'),
      },
    })
  }

  const handleWishlist = async () => {
    if (!product) return

    const productId = String(product.id)
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
      // الزائر يعتمد على localStorage فقط
    }
  }

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const placeholderImage = `https://placehold.co/600x800/f5f0eb/d4a574?text=${encodeURIComponent(product?.name?.slice(0, 10) || 'Product')}`

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
            <Button asChild>
              <Link href="/shop">العودة للمتجر</Link>
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
            <Link href="/" className="hover:text-primary">الرئيسية</Link>
            <ChevronLeft className="h-4 w-4" />
            <Link href="/shop" className="hover:text-primary">المتجر</Link>
            <ChevronLeft className="h-4 w-4" />
            <Link href={`/shop?category=${product.category}`} className="hover:text-primary">
              {getCategoryName(product.category)}
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-muted">
                <Image
                  src={imageError ? placeholderImage : (product.images?.[selectedImage] || placeholderImage)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                />
                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
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
              </div>
              {/* ✅ حالة المخزون - هنا مكانها المناسب */}
            <div className="mt-4">
              {product.stock > 10 ? (
                <p className="text-green-600 text-sm">متوفر ({product.stock} قطعة)</p>
              ) : product.stock > 0 ? (
                <p className="text-orange-500 text-sm"> كمية محدودة - متبقي {product.stock} قطعة فقط</p>
              ) : (
                <p className="text-red-500 text-sm"> نفذت الكمية - سيتوفر قريباً</p>
              )}
            </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        'relative w-20 h-24 rounded-lg overflow-hidden shrink-0 border-2 transition-colors',
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      )}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = placeholderImage
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getCategoryName(product.category)}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
                <p className="text-sm text-muted-foreground">{product.nameEn}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formattedPrice}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through leading-normal">
                      {formattedOriginalPrice}
                    </span>
                    <Badge className="bg-destructive text-destructive-foreground">
                      وفري {discount}%
                    </Badge>
                  </>
                )}
              </div>

              <Separator />

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <p className="font-medium mb-3">المقاس: {selectedSize || 'اختاري المقاس'}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'w-12 h-12 rounded-lg border-2 transition-colors font-medium',
                          selectedSize === size
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="font-medium mb-3">الكمية</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={inCart || quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={inCart || quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stock > 0 ? `${product.stock} متوفر` : 'نفذت الكمية'}
                    {inCart ? ' · عدّلي الكمية من السلة' : ''}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  variant={inCart ? 'secondary' : 'default'}
                >
                  <ShoppingBag className={cn('h-5 w-5', inCart && 'fill-current')} />
                  {product.stock === 0
                    ? 'نفذت الكمية'
                    : inCart
                      ? 'في السلة — عرض السلة'
                      : 'أضيفي للسلة'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleWishlist}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      isWishlisted && 'fill-primary text-primary'
                    )}
                  />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs">شحن سريع</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs"> بضاعة مميزة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs">دفع عند الاستلام</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="description" className="flex-1">الوصف</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">التفاصيل</TabsTrigger>
                  <TabsTrigger value="shipping" className="flex-1">الشحن</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {product.descriptionEn}
                  </p>
                </TabsContent>
                <TabsContent value="details" className="mt-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>الفئة: {getCategoryName(product.category)}</li>
                    {product.colors && product.colors.length > 0 && (
                      <li>الألوان المتاحة: {product.colors.join('، ')}</li>
                    )}
                    {product.sizes && product.sizes.length > 0 && (
                      <li>المقاسات المتاحة: {product.sizes.join('، ')}</li>
                    )}
                    <li>كود المنتج: {product.id}</li>
                  </ul>
                </TabsContent>
                <TabsContent value="shipping" className="mt-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>التوصيل خلال 3-5 أيام عمل</li>
                    <li>شحن إدلب: $2 — باقي المحافظات: $3</li>
                    <li>
                      {shippingInfo.freeThreshold > 0
                        ? `شحن مجاني للطلبات فوق $${shippingInfo.freeThreshold}`
                        : 'الشحن المجاني غير مفعّل حالياً'}
                    </li>
                    <li>الدفع عند الاستلام متاح</li>
                  </ul>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-8">منتجات مشابهة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}