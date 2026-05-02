'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { getWishlist } from '@/lib/store'
import type { Product } from '@/lib/types'

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadWishlist = async () => {
    setLoading(true)
    
    // جلب قائمة المفضلة من localStorage (مؤقتاً)
    const wishlist = getWishlist()
    
    if (wishlist.length === 0) {
      setWishlistProducts([])
      setLoading(false)
      return
    }
    
    try {
      // جلب جميع المنتجات من API
      const response = await fetch('/api/products')
      const allProducts = await response.json()
      
      // فلترة المنتجات الموجودة في المفضلة
      const products = wishlist
        .map((item) => allProducts.find((p: Product) => p.id === item.productId))
        .filter(Boolean) as Product[]
      
      setWishlistProducts(products)
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