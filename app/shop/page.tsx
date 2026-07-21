'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, SlidersHorizontal, Grid3X3, LayoutGrid, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { cn, formatPriceAsync, fetchExchangeRate } from '@/lib/utils'
import type { Product, Currency, Category } from '@/lib/types'

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating'

// ================================================
// ✅ دوال العملة - تم استبدالها بـ lib/utils
// ================================================
// تم إزالة getCurrencyLocal و formatPriceLocal
// الآن نستخدم:
// - formatPriceAsync من lib/utils
// - fetchExchangeRate من lib/utils

function ShopContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
  // ✅ حالة لتخزين الأسعار المنسقة للـ Slider
  const [formattedMinPrice, setFormattedMinPrice] = useState('')
  const [formattedMaxPrice, setFormattedMaxPrice] = useState('')

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [showOnSale, setShowOnSale] = useState(false)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [showBestSellers, setShowBestSellers] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  // ✅ تحميل العملة وسعر الصرف
  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = localStorage.getItem('sedra_currency')
      const currentCurrency = (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
      setCurrency(currentCurrency)
      
      const rate = await fetchExchangeRate()
      setExchangeRate(rate)
      
      // تنسيق الأسعار للـ Slider
      const minFormatted = await formatPriceAsync(priceRange[0], currentCurrency)
      const maxFormatted = await formatPriceAsync(priceRange[1], currentCurrency)
      setFormattedMinPrice(minFormatted)
      setFormattedMaxPrice(maxFormatted)
    }
    
    loadCurrency()
    
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [priceRange])

  // Initialize from URL params
  useEffect(() => {
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const search = searchParams.get('search')

    if (category) {
      setSelectedCategories([category])
    }
    if (filter === 'new') {
      setShowNewOnly(true)
    } else if (filter === 'sale') {
      setShowOnSale(true)
    } else if (filter === 'bestseller') {
      setShowBestSellers(true)
    }
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  // جلب الأقسام من API
useEffect(() => {
  fetch('/api/categories', { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      const categoriesArray = Array.isArray(data) ? data : data.categories || []
      setCategories(categoriesArray)
    })
    .catch(err => console.error('Error fetching categories:', err))
}, [])

  // جلب المنتجات من API
useEffect(() => {
  async function fetchProducts() {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      const productsArray = Array.isArray(data) ? data : data.products || []
      setProducts(productsArray)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([]) // ✅ في حالة الخطأ، نضع مصفوفة فاضية
    } finally {
      setLoading(false)
    }
  }
  
  fetchProducts()
}, [])

  // ✅ تحديث العملة عند تغييرها (بدون استخدام getCurrencyLocal)
  useEffect(() => {
    const handleCurrencyChange = () => {
      const savedCurrency = localStorage.getItem('sedra_currency')
      setCurrency((savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency)
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.nameEn?.toLowerCase() || '').includes(query) ||
          (p.description?.toLowerCase() || '').includes(query)
      )
    }

    // Categories
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category))
    }

    // Price range
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])

    // On sale
    if (showOnSale) {
      result = result.filter((p) => p.originalPrice && p.originalPrice > p.price)
    }

    // New arrivals
    if (showNewOnly) {
      result = result.filter((p) => p.newArrival)
    }

    // Best sellers
    if (showBestSellers) {
      result = result.filter((p) => p.bestSeller)
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    return result
  }, [products, searchQuery, selectedCategories, priceRange, showOnSale, showNewOnly, showBestSellers, sortBy])

  const clearFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 100])
    setShowOnSale(false)
    setShowNewOnly(false)
    setShowBestSellers(false)
    setSearchQuery('')
  }

  const activeFiltersCount = 
    selectedCategories.length + 
    (showOnSale ? 1 : 0) + 
    (showNewOnly ? 1 : 0) + 
    (showBestSellers ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 100 ? 1 : 0)

  // عرض شاشة تحميل أثناء جلب البيانات
  if (loading || categories.length === 0) {
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

  const FiltersSidebar = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-sm font-medium mb-2 block">البحث</Label>
        <Input
          type="search"
          placeholder="ابحثي عن منتج..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <Label className="text-sm font-medium mb-3 block">الأقسام</Label>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, cat.slug])
                  } else {
                    setSelectedCategories(selectedCategories.filter((c) => c !== cat.slug))
                  }
                }}
              />
              <Label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer flex-1">
                {cat.name}
              </Label>
              <span className="text-xs text-muted-foreground">({cat.productCount})</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* ✅ Price Range - تم تحديثه */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          نطاق السعر: {formattedMinPrice} - {formattedMaxPrice}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={100}
          step={10}
          className="mt-4"
        />
      </div>

      <Separator />

      {/* Quick Filters */}
      <div>
        <Label className="text-sm font-medium mb-3 block">تصفية سريعة</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="on-sale"
              checked={showOnSale}
              onCheckedChange={(checked) => setShowOnSale(!!checked)}
            />
            <Label htmlFor="on-sale" className="text-sm cursor-pointer">
              تخفيضات فقط
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="new-only"
              checked={showNewOnly}
              onCheckedChange={(checked) => setShowNewOnly(!!checked)}
            />
            <Label htmlFor="new-only" className="text-sm cursor-pointer">
              وصل حديثاً
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="best-sellers"
              checked={showBestSellers}
              onCheckedChange={(checked) => setShowBestSellers(!!checked)}
            />
            <Label htmlFor="best-sellers" className="text-sm cursor-pointer">
              الأكثر مبيعاً
            </Label>
          </div>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" onClick={clearFilters} className="w-full">
            مسح الفلاتر ({activeFiltersCount})
          </Button>
        </>
      )}
    </div>
  )

  return (
    <>
      <Header />

      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">المتجر</h1>
            <p className="text-muted-foreground">
              {filteredProducts.length} منتج
              {searchQuery && ` - نتائج البحث عن "${searchQuery}"`}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 glass-strong rounded-xl p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  الفلاتر
                </h2>
                <FiltersSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                {/* Mobile Filter Button */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2">
                      <Filter className="h-4 w-4" />
                      الفلاتر
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="mr-1">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-75 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>الفلاتر</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FiltersSidebar />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground hidden sm:inline">ترتيب حسب:</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="price-asc">السعر: من الأقل</SelectItem>
                      <SelectItem value="price-desc">السعر: من الأعلى</SelectItem>
                      <SelectItem value="popular">الأكثر شعبية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Grid Toggle */}
                <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={gridCols === 2 ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridCols(2)}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridCols === 3 ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridCols(3)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={gridCols === 4 ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGridCols(4)}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="3" height="3" />
                      <rect x="5" y="1" width="3" height="3" />
                      <rect x="9" y="1" width="3" height="3" />
                      <rect x="13" y="1" width="2" height="3" />
                      <rect x="1" y="5" width="3" height="3" />
                      <rect x="5" y="5" width="3" height="3" />
                      <rect x="9" y="5" width="3" height="3" />
                      <rect x="13" y="5" width="2" height="3" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-6">
                  <span className="text-sm text-muted-foreground">الفلاتر النشطة:</span>
                  {selectedCategories.map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => setSelectedCategories(selectedCategories.filter((c) => c !== cat))}
                    >
                      {categories.find((c) => c.slug === cat)?.name}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                  {showOnSale && (
                    <Badge
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => setShowOnSale(false)}
                    >
                      تخفيضات
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {showNewOnly && (
                    <Badge
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => setShowNewOnly(false)}
                    >
                      جديد
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                  {showBestSellers && (
                    <Badge
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => setShowBestSellers(false)}
                    >
                      الأكثر مبيعاً
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    مسح الكل
                  </Button>
                </div>
              )}

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-4 md:gap-6',
                    gridCols === 2 && 'grid-cols-2',
                    gridCols === 3 && 'grid-cols-2 md:grid-cols-3',
                    gridCols === 4 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  )}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Filter className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">لا توجد منتجات</h3>
                  <p className="text-muted-foreground mb-4">
                    جربي تغيير الفلاتر أو البحث عن شيء آخر
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    مسح الفلاتر
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}