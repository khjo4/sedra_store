'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/types'
import { getWishlistIds, sameId } from '@/lib/cart-wishlist'

export default function WishlistPage() {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadWishlist = async () => {
    setLoading(true)
    const wishlistIds = getWishlistIds()

    if (wishlistIds.length === 0) {
      setWishlistProducts([])
      setLoading(false)
      return
    }

    try {
      const idsParam = wishlistIds.join(',')
      const response = await fetch(
        `/api/products?ids=${encodeURIComponent(idsParam)}`,
        { cache: 'no-store' }
      )
      if (!response.ok) throw new Error('failed to load wishlist products')
      const data = await response.json()
      const products = Array.isArray(data) ? data : data.products || []

      const seen = new Set<string>()
      const orderedProducts = wishlistIds
        .map((id) => products.find((p: Product) => sameId(p.id, id)))
        .filter((p): p is Product => {
          if (!p) return false
          const key = String(p.id)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

      setWishlistProducts(orderedProducts)
    } catch (error) {
      console.error('Error loading wishlist:', error)
      setWishlistProducts([])
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
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-9 w-9 text-primary/70" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">قائمة الأمنيات فارغة</h1>
            <p className="mb-6 text-muted-foreground">لم تضيفي أي منتجات بعد</p>
            <Button asChild size="lg">
              <Link href="/shop">
                <ShoppingBag className="ms-2 h-5 w-5" />
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
      <main className="min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">قائمة الأمنيات</h1>
            <p className="text-muted-foreground">{wishlistProducts.length} منتج</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {wishlistProducts.map((product) => (
              <ProductCard key={String(product.id)} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
