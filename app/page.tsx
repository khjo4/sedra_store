'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles, Truck, Shield, ChevronLeft, ChevronRight, Star, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { cn } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import type { Category } from '@/lib/types'

const testimonials = [
  {
    id: 1,
    name: 'jody',
    location: 'دمشق',
    rating: 5,
    text: 'جودة ممتازة وتوصيل سريع! أنصح الجميع بالتعامل مع سيدرا',
    avatar: '/image/art/art1.jpg',
  },
  {
    id: 2,
    name: 'ريم محمد',
    location: 'حلب',
    rating: 4,
    text: 'سأكرر الطلب بالتأكيد',
    avatar: '/image/art/art2.jpg',
  },
  {
    id: 3,
    name: 'نور الهدى',
    location: 'اللاذقية',
    rating: 4,
    text: 'خدمة عملاء متميزة ومنتجات عالية الجودة',
    avatar: '/image/art/art3.jpg',
  },
]

const features = [
  { icon: Truck, title: 'شحن سريع', description: 'توصيل لجميع المحافظات' },
  { icon: Shield, title: 'دفع آمن', description: 'الدفع عند الاستلام' },
  { icon: Sparkles, title: 'جودة عالية', description: 'منتجات رائعة' },
  { icon: DollarSign, title: 'أسعار مناسبة', description: 'أفضل الأسعار في السوق' },
]

// ================================================
// تم إزالة getCurrencyLocal و formatPriceLocal
// لأنهما غير مستخدمين في هذا الملف (ProductCard يتولى التنسيق)
// ================================================

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [settings, setSettings] = useState<any>(null)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])

  // جلب الأقسام من API
  // جلب الأقسام من API
useEffect(() => {
  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories', { cache: 'no-store' })
      const data = await response.json()
      // ✅ معالجة البيانات بشكل صحيح
      const categoriesArray = Array.isArray(data) ? data : data.categories || []
      setCategories(categoriesArray)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([]) // ✅ في حالة الخطأ، نضع مصفوفة فاضية
    }
  }
  fetchCategories()
}, [])

  // جلب الإعدادات من API
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' })
        const data = await response.json()
        setSettings(data)
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // جلب المنتجات من API (محسّن)
  useEffect(() => {
    async function fetchProducts() {
      try {
        // ✅ تحسين الأداء: جلب المنتجات المميزة فقط
        const response = await fetch('/api/products?limit=20')
        const data = await response.json()
        const allProducts = Array.isArray(data) ? data : data.products || []
        
        setFeaturedProducts(allProducts.filter((p: Product) => p.featured).slice(0, 8))
        setBestSellers(allProducts.filter((p: Product) => p.bestSeller).slice(0, 4))
        setNewArrivals(allProducts.filter((p: Product) => p.newArrival).slice(0, 4))
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    
    // ✅ تحديث العملة من localStorage
    const savedCurrency = localStorage.getItem('sedra_currency')
    setCurrency((savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency)

    const handleCurrencyChange = () => {
      const newCurrency = localStorage.getItem('sedra_currency')
      setCurrency((newCurrency === 'SYP' ? 'SYP' : 'USD') as Currency)
    }
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  // التنقل التلقائي في آراء العملاء
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

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

  return (
    <>
      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative flex min-h-[78vh] items-center overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-bl from-pink-light via-background to-beige" />
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-16 inset-e-10 h-72 w-72 animate-[loginOrbFloat_12s_ease-in-out_infinite] rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute bottom-10 inset-s-8 h-96 w-96 animate-[loginOrbFloat_14s_ease-in-out_infinite] rounded-full bg-accent/20 blur-3xl [animation-delay:-5s]" />
          </div>

          <div className="container relative z-10 mx-auto px-4 py-16 md:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="relative order-1 animate-slide-up lg:order-2">
                <div className="relative mx-auto aspect-3/4 max-w-md">
                  <div className="absolute inset-0 rotate-2 rounded-4xl bg-linear-to-br from-primary/15 to-accent/20" />
                  <div className="absolute inset-0 overflow-hidden rounded-4xl border border-border/40 bg-card/50 shadow-[0_30px_80px_-40px_oklch(0.4_0.05_20/0.45)] backdrop-blur-sm">
                    <Image
                      src="/image/logo.png"
                      alt="SEDRA"
                      fill
                      className="object-contain p-10 md:p-12"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="order-2 animate-fade-in text-center lg:order-1 lg:text-start">
                <h1 className="mb-5 text-balance text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl lg:text-[3.25rem]">
                  {settings.hero_title || settings.heroTitle}
                </h1>
                <p className="mx-auto mb-9 max-w-xl text-pretty text-lg text-muted-foreground md:text-xl lg:mx-0">
                  {settings.hero_subtitle || settings.heroSubtitle}
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/shop">
                      تسوقي الآن <ArrowLeft className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/shop?filter=new">المجموعة الجديدة</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border/60 bg-card/60 py-10 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center px-2 py-2 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold md:text-base">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground md:text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="page-section">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="section-title">تسوقي حسب القسم</h2>
                <p className="section-subtitle">اختاري من تشكيلتنا المتنوعة</p>
              </div>
              <Button variant="ghost" asChild className="hidden gap-1 sm:flex">
                <Link href="/shop">
                  عرض الكل <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group relative aspect-3/4 overflow-hidden rounded-2xl hover-lift"
                >
                  <Image
                    src={category.image || '/placeholder-category.jpg'}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-foreground/75 via-foreground/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-primary-foreground md:p-4">
                    <h3 className="text-base font-semibold md:text-lg">{category.name}</h3>
                    <p className="text-xs opacity-80 md:text-sm">{category.productCount} منتج</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="page-section bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="section-title">منتجات مميزة</h2>
                <p className="section-subtitle">اختيارات مميزة لك</p>
              </div>
              <Button variant="ghost" asChild className="gap-1">
                <Link href="/shop">
                  عرض الكل <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Best Sellers & New Arrivals */}
        <section className="page-section">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight md:text-2xl">الأكثر مبيعاً</h2>
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link href="/shop?filter=bestseller">
                      المزيد <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {bestSellers.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight md:text-2xl">وصل حديثاً</h2>
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link href="/shop?filter=new">
                      المزيد <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {newArrivals.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="page-section bg-card/50">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="section-title">ماذا تقول عميلاتنا</h2>
              <p className="section-subtitle">آراء حقيقية من عميلاتنا</p>
            </div>
            <div className="relative mx-auto max-w-2xl">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="w-full shrink-0 px-1">
                      <div className="store-surface px-6 py-10 text-center md:px-10">
                        <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full bg-primary/10 ring-4 ring-primary/10">
                          <Image
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        </div>
                        <div className="mb-4 flex items-center justify-center gap-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                          ))}
                        </div>
                        <p className="mb-5 text-pretty text-lg leading-relaxed">{testimonial.text}</p>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentTestimonial((prev) =>
                      prev === 0 ? testimonials.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === currentTestimonial
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16 pt-4 md:pb-20">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-4xl gradient-primary p-8 text-primary-foreground md:p-12">
              <div className="absolute -inset-s-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-16 -inset-e-8 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="mb-3 text-2xl font-bold md:text-3xl">ابدئي تسوقك مع سيدرا</h2>
                <p className="mb-7 text-primary-foreground/85">
                  احصلي على خصم 10% على طلبك الأول واطلعي على أحدث العروض والمنتجات
                </p>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link href="/shop">تسوقي الآن</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}