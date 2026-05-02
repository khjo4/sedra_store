'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Heart, ShoppingBag, Minus, Plus, Star, ChevronLeft, Truck, RefreshCw, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { 
  addToCart, 
  addToWishlist, 
  removeFromWishlist, 
  isInWishlist, 
  formatPrice, 
  getCurrency 
} from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import { toast } from 'sonner'

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)

  // جلب المنتج من API
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const data = await response.json()
        
        // التأكد من أن المصفوفات موجودة
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
        setIsWishlisted(isInWishlist(safeProduct.id))
      } catch (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProduct()
    setCurrency(getCurrency())

    const handleCurrencyChange = () => setCurrency(getCurrency())
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [id])

  // جلب المنتجات المشابهة
  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!product) return
      
      try {
        const response = await fetch('/api/products')
        const allProducts = await response.json()
        const related = allProducts
          .filter((p: Product) => p.category === product.category && p.id !== product.id)
          .slice(0, 4)
        setRelatedProducts(related)
      } catch (error) {
        console.error('Error fetching related products:', error)
      }
    }
    
    fetchRelatedProducts()
  }, [product])

  // Helper function to get category name in Arabic
  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      dresses: 'فساتين',
      blouses: 'بلوزات',
      skirts: 'تنانير',
      pants: 'بناطيل',
      abayas: 'عبايات',
      accessories: 'اكسسوارات',
      perfumes: 'عطورات',
      makeup: 'مكياج',
      'gift-sets': 'مجموعات الهدايا',
    }
    return categoryMap[category] || category
  }

  // عرض شاشة تحميل
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

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('الرجاء اختيار المقاس')
      return
    }

    addToCart({
      productId: product.id,
      quantity,
      selectedColor,
      selectedSize,
    })
    
    toast.success('تمت الإضافة إلى السلة', {
      description: `${product.name} (${quantity})`,
      action: {
        label: 'عرض السلة',
        onClick: () => router.push('/cart'),
      },
    })
    
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id)
      setIsWishlisted(false)
      toast.info('تمت الإزالة من المفضلة')
    } else {
      addToWishlist(product.id)
      setIsWishlisted(true)
      toast.success('تمت الإضافة إلى المفضلة')
    }
    window.dispatchEvent(new Event('wishlistUpdated'))
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const placeholderImage = `https://placehold.co/600x800/f5f0eb/d4a574?text=${encodeURIComponent(product.name.slice(0, 10))}`

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

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-5 w-5',
                        i < Math.floor(product.rating || 0)
                          ? 'fill-accent text-accent'
                          : 'fill-muted text-muted'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating || 0} ({product.reviewCount || 0} تقييم)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price, currency)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice, currency)}
                    </span>
                    <Badge className="bg-destructive text-destructive-foreground">
                      وفري {discount}%
                    </Badge>
                  </>
                )}
              </div>

              <Separator />

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="font-medium mb-3">اللون: {selectedColor}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'px-4 py-2 rounded-lg border-2 transition-colors text-sm',
                          selectedColor === color
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stock > 0 ? `${product.stock} متوفر` : 'نفذت الكمية'}
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
                >
                  <ShoppingBag className="h-5 w-5" />
                  {product.stock === 0 ? 'نفذت الكمية' : 'أضيفي للسلة'}
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
                  <RefreshCw className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs">استبدال مجاني</p>
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
                    <li>شحن مجاني للطلبات فوق 100$</li>
                    <li>الدفع عند الاستلام متاح</li>
                    <li>استبدال مجاني خلال 14 يوم</li>
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