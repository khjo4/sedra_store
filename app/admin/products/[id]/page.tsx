'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const categories = [
  { value: 'accessories', label: 'اكسسوارات' },
  { value: 'perfumes', label: 'عطورات' },
  { value: 'makeup', label: 'مكياج' },
  { value: 'cup', label: 'أكواب' },
  { value: 'care', label: 'العناية والاهتمام' },
  { value: 'gift-sets', label: 'مجموعات الهدايا' },
]

export default function AdminEditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    featured: false,
    bestSeller: false,
    newArrival: false,
    colors: '',
    sizes: '',
    images: '',
  })

  // جلب المنتج من API
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const p = await response.json()
        setProduct(p)
        setFormData({
          name: p.name,
          nameEn: p.nameEn || '',
          description: p.description || '',
          descriptionEn: p.descriptionEn || '',
          price: p.price.toString(),
          originalPrice: p.originalPrice?.toString() || '',
          category: p.category,
          stock: p.stock.toString(),
          featured: p.featured,
          bestSeller: p.bestSeller,
          newArrival: p.newArrival,
          colors: Array.isArray(p.colors) ? p.colors.join(', ') : '',
          sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : '',
          images: Array.isArray(p.images) ? p.images.join(', ') : '',
        })
      } catch (error) {
        console.error('Error fetching product:', error)
        toast.error('حدث خطأ في جلب المنتج')
      } finally {
        setInitialLoading(false)
      }
    }
    
    fetchProduct()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updatedProduct = {
  name: formData.name || '',
  nameEn: formData.nameEn || '',
  description: formData.description || '',
  descriptionEn: formData.descriptionEn || '',
  price: parseFloat(formData.price) || 0,
  originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
  category: formData.category || '',
  images: formData.images ? formData.images.split(',').map(img => img.trim()) : ['/placeholder.jpg'],
  stock: parseInt(formData.stock) || 0,
  featured: formData.featured || false,
  bestSeller: formData.bestSeller || false,
  newArrival: formData.newArrival || false,
  colors: formData.colors ? formData.colors.split(',').map(c => c.trim()) : [],
  sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : [],
}

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      toast.success('تم تحديث المنتج بنجاح')
      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('حدث خطأ أثناء تحديث المنتج')
    } finally {
      setLoading(false)
    }
  }

  // عرض شاشة تحميل
  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">تعديل المنتج</h1>
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
        <Button asChild>
          <Link href="/admin/products">العودة للمنتجات</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">تعديل المنتج</h1>
          <p className="text-muted-foreground">تعديل بيانات المنتج "{product.name}"</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات المنتج</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="mb-2 block">الاسم (عربي) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameEn" className="mb-2 block">الاسم (إنجليزي)</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2 block">الوصف (عربي) *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descriptionEn" className="mb-2 block">الوصف (إنجليزي)</Label>
                  <Textarea
                    id="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>السعر والمخزون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="mb-2 block">السعر ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice" className="mb-2 block">السعر قبل الخصم</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="stock" className="mb-2 block">الكمية المتاحة *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الخيارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="colors" className="mb-2 block">الألوان (مفصولة بفواصل)</Label>
                    <Input
                      id="colors"
                      placeholder="أحمر, أزرق, أسود"
                      value={formData.colors}
                      onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sizes" className="mb-2 block">المقاسات (مفصولة بفواصل)</Label>
                    <Input
                      id="sizes"
                      placeholder="S, M, L, XL"
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="images" className="mb-2 block">صور المنتج (روابط مفصولة بفواصل)</Label>
                  <Input
                    id="images"
                    placeholder="/image/product1.jpg, /image/product2.jpg"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>القسم والتصنيف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="mb-2 block">القسم *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الحالة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">منتج مميز</Label>
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bestSeller">الأكثر مبيعاً</Label>
                  <Switch
                    id="bestSeller"
                    checked={formData.bestSeller}
                    onCheckedChange={(checked) => setFormData({ ...formData, bestSeller: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newArrival">وصل حديثاً</Label>
                  <Switch
                    id="newArrival"
                    checked={formData.newArrival}
                    onCheckedChange={(checked) => setFormData({ ...formData, newArrival: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    <Save className="h-4 w-4 ml-2" />
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/products">
                      <X className="h-4 w-4 ml-2" />
                      إلغاء
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}