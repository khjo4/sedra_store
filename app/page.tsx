'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles, Truck, Shield, ChevronLeft, ChevronRight, Star, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
        <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-linear-to-bl from-pink-light via-background to-beige">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-16 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* الصورة */}
              <div className="relative block animate-slide-up">
                <div className="relative aspect-3/4 max-w-md mx-auto">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-3" />
                  <div className="absolute inset-0 glass rounded-3xl overflow-hidden">
                    <Image
                      src="/image/logo.png"
                      alt="مجموعة سيدرا"
                      fill
                      className="object-contain p-8"
                      priority
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 glass-strong rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">أناقتك تهمنا</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* النص */}
              <div className="text-center lg:text-right animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold mb-5 text-balance leading-tight">
                  {settings.hero_title || settings.heroTitle}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 text-pretty">
                  {settings.hero_subtitle || settings.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button asChild size="lg" className="text-base gap-2">
                    <Link href="/shop">تسوقي الآن <ArrowLeft className="h-5 w-5" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-base">
                    <Link href="/shop?filter=new">المجموعة الجديدة</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 border-y border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">تسوقي حسب القسم</h2>
                <p className="text-muted-foreground">اختاري من تشكيلتنا المتنوعة</p>
              </div>
              <Button variant="ghost" asChild className="hidden sm:flex gap-1">
                <Link href="/shop">عرض الكل <ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link key={category.id} href={`/shop?category=${category.slug}`} className="group relative aspect-3/4 rounded-2xl overflow-hidden hover-lift">
                  <Image 
                    src={category.image || '/placeholder-category.jpg'} 
                    alt={category.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-foreground/20 to-transparent" />
                  <div className="absolute bottom-0 right-0 left-0 p-4 text-primary-foreground">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm opacity-80">{category.productCount} منتج</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">منتجات مميزة</h2>
                <p className="text-muted-foreground">اختيارات مميزة لك</p>
              </div>
              <Button variant="ghost" asChild className="gap-1">
                <Link href="/shop">عرض الكل <ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Best Sellers & New Arrivals */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold">الأكثر مبيعاً</h2>
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link href="/shop?filter=bestseller">المزيد <ArrowLeft className="h-4 w-4" /></Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {bestSellers.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold">وصل حديثاً</h2>
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link href="/shop?filter=new">المزيد <ArrowLeft className="h-4 w-4" /></Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {newArrivals.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">ماذا تقول عميلاتنا</h2>
              <p className="text-muted-foreground">آراء حقيقية من عميلاتنا</p>
            </div>
            <div className="max-w-2xl mx-auto relative">
              <div className="overflow-hidden">
                <div className="flex transition-transform duration-500" style={{ transform: `translateX(${currentTestimonial * 100}%)` }}>
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className="shrink-0 w-full">
                      <CardContent className="pt-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 overflow-hidden">
                          <Image 
                            src={testimonial.avatar} 
                            alt={testimonial.name} 
                            width={64} 
                            height={64} 
                            className="object-cover" 
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                          ))}
                        </div>
                        <p className="text-lg mb-4 text-pretty">{testimonial.text}</p>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                {testimonials.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentTestimonial(i)} 
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors', 
                      i === currentTestimonial ? 'bg-primary' : 'bg-muted-foreground/30'
                    )} 
                  />
                ))}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-primary to-primary/80 text-primary-foreground p-8 md:p-12">
              <div className="relative z-10 text-center max-w-2xl mx-auto">
                <p className="text-primary-foreground/80 mb-6">
                  احصلي على خصم 10% على طلبك الأول واطلعي على أحدث العروض والمنتجات
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}