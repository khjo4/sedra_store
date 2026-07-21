'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/types'

// ================================================
// ✅ دوال المفضلة - محسنة لاستخدام API بدلاً من جلب كل المنتجات
// ================================================
const WISHLIST_KEY = 'sedra_wishlist'

const getWishlist = (): string[] => {
  if (typeof window === 'undefined') return []
  const wishlist = localStorage.getItem(WISHLIST_KEY)
  return wishlist ? JSON.parse(wishlist) : []
}

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadWishlist = async () => {
    setLoading(true)
    
    const wishlistIds = getWishlist()
    
    if (wishlistIds.length === 0) {
      setWishlistProducts([])
      setLoading(false)
      return
    }
    
    try {
      // ✅ تحسين الأداء: جلب المنتجات المحددة فقط بدلاً من كل المنتجات
      const idsParam = wishlistIds.join(',')
      const response = await fetch(`/api/products?ids=${idsParam}`)
      const data = await response.json()
      
      // ✅ API الآن يرجع { products: [...], total, page, ... }
      const products = Array.isArray(data) ? data : data.products || []
      
      // الحفاظ على ترتيب المفضلة كما هو
      const orderedProducts = wishlistIds
        .map(id => products.find((p: Product) => p.id === id))
        .filter(Boolean) as Product[]
      
      setWishlistProducts(orderedProducts)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()

    const handleWishlistUpdate = () => loadWishlist()
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
  }, [])

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

  if (wishlistProducts.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">قائمة الأمنيات فارغة</h1>
            <p className="text-muted-foreground mb-6">لم تضيفي أي منتجات بعد</p>
            <Button asChild>
              <Link href="/shop">
                <ShoppingBag className="h-5 w-5 ml-2" />
                تسوقي الآن
              </Link>
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
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">قائمة الأمنيات</h1>
            <p className="text-muted-foreground">{wishlistProducts.length} منتج</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}