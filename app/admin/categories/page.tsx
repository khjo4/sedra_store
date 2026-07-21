'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  nameEn: string
  slug: string
  image: string
  productCount: number
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      const categoriesArray = Array.isArray(data) ? data : data.categories || []
      setCategories(categoriesArray)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('حدث خطأ في جلب الأقسام')
    } finally {
      setLoading(false)
    }
  }

  const updateImage = async (slug: string, imageUrl: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, image: imageUrl }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('تم تحديث الصورة بنجاح')
      loadCategories()
    } catch (error) {
      console.error('Error updating image:', error)
      toast.error('حدث خطأ في تحديث الصورة')
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-16">جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">إدارة الأقسام</h1>
        <p className="text-muted-foreground">تعديل صور وأسماء الأقسام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={category.image || '/placeholder-category.jpg'}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="/image/categories/xxx.jpg"
                  defaultValue={category.image || ''}
                  id={`image-${category.slug}`}
                />
                <Button
                  onClick={() => {
                    const input = document.getElementById(`image-${category.slug}`) as HTMLInputElement
                    updateImage(category.slug, input.value)
                  }}
                >
                  تحديث
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                عدد المنتجات: {category.productCount}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}