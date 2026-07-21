'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice, fetchExchangeRate } from '@/lib/utils'
import type { Product, Currency } from '@/lib/types'
import { toast } from 'sonner'

// ================================================
// تم إزالة getCurrencyLocal و formatPriceLocal
// الآن نستخدم formatPrice من lib/utils
// ================================================

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  
  // حالات للأسعار المنسقة
  const [formattedPrices, setFormattedPrices] = useState<Record<string, string>>({})
  const [formattedOriginalPrices, setFormattedOriginalPrices] = useState<Record<string, string>>({})

  // تحميل العملة وسعر الصرف
  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = localStorage.getItem('sedra_currency')
      const currentCurrency = (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
      setCurrency(currentCurrency)
      
      const rate = await fetchExchangeRate()
      setExchangeRate(rate)
    }
    
    loadCurrency()
    
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  // جلب المنتجات من API
  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      const productsData = Array.isArray(data) ? data : data.products || []
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('حدث خطأ في جلب المنتجات')
    } finally {
      setLoading(false)
    }
  }

  // تحديث الأسعار المنسقة عند تغير المنتجات أو العملة أو سعر الصرف
  useEffect(() => {
    const updatePrices = () => {
      const prices: Record<string, string> = {}
      const originalPrices: Record<string, string> = {}
      
      products.forEach(product => {
        prices[product.id] = formatPrice(product.price, currency, exchangeRate)
        if (product.originalPrice) {
          originalPrices[product.id] = formatPrice(product.originalPrice, currency, exchangeRate)
        }
      })
      
      setFormattedPrices(prices)
      setFormattedOriginalPrices(originalPrices)
    }
    
    updatePrices()
  }, [products, currency, exchangeRate])

  // حذف منتج
  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete')
      }
      
      loadProducts()
      toast.success('تم حذف المنتج بنجاح')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('حدث خطأ في حذف المنتج')
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    let result = [...products]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.nameEn?.toLowerCase() || '').includes(query) ||
          String(p.id).toLowerCase().includes(query)
      )
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter)
    }

    setFilteredProducts(result)
  }, [products, searchQuery, categoryFilter])

  const getCategoryName = (slug: string) => {
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
    return categoryMap[slug] || slug
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">المنتجات</h1>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">المنتجات</h1>
          <p className="text-muted-foreground">{products.length} منتج</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 ml-2" />
            إضافة منتج
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="كل الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accessories">اكسسوارات</SelectItem>
                <SelectItem value="perfumes">عطورات</SelectItem>
                <SelectItem value="makeup">مكياج</SelectItem>
                <SelectItem value="cup">أكواب</SelectItem>
                <SelectItem value="care">العناية والاهتمام</SelectItem>
                <SelectItem value="gift-sets">مجموعات الهدايا</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-center">القسم</TableHead>
                  <TableHead className="text-center">السعر</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                            <Image
                              src={product.images?.[0] || '/placeholder.jpg'}
                              alt={product.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `https://placehold.co/100x130/f5f0eb/d4a574?text=${encodeURIComponent(product.name.slice(0, 3))}`
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{product.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getCategoryName(product.category)}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <p className="font-medium">{formattedPrices[product.id] || formatPrice(product.price, currency, exchangeRate)}</p>
                          {product.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formattedOriginalPrices[product.id] || formatPrice(product.originalPrice, currency, exchangeRate)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.featured && <Badge variant="outline">مميز</Badge>}
                          {product.newArrival && <Badge variant="outline">جديد</Badge>}
                          {product.bestSeller && <Badge variant="outline">الأكثر مبيعاً</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/product/${product.id}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف المنتج &quot;{product.name}&quot; نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد منتجات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}