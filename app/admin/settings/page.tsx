
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Store, 
  DollarSign, 
  Truck, 
  Phone, 
  Mail, 
  Save,
  RefreshCw,
  Globe,
  Instagram,
  Facebook
} from 'lucide-react'
import { toast } from 'sonner'
import type { SiteSettings } from '@/lib/types'

// ✅ القيم الافتراضية (تأكدي من وجود جميع الحقول)
const defaultFormData: SiteSettings = {
  storeName: '',
  storeNameEn: '',
  currency: 'USD',
  exchangeRate: 14500,
  freeShippingThreshold: 100,
  shippingCost: 5,
  contactEmail: '',
  contactPhone: '',
  instagramUrl: '',
  facebookUrl: '',
  whatsappUrl: '',
  heroTitle: '',
  heroSubtitle: '',
  announcement: '',
  announcementActive: false,
}

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [initialSettings, setInitialSettings] = useState<SiteSettings | null>(null)
  const [formData, setFormData] = useState<SiteSettings>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' })
        const data = await response.json()
        setInitialSettings(data)
        setFormData(prev => ({ ...prev, ...data }))
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('حدث خطأ في جلب الإعدادات')
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        storeName: formData.storeName,
        storeNameEn: formData.storeNameEn,
        currency: formData.currency,
        exchangeRate: Number(formData.exchangeRate) || 0,
        freeShippingThreshold: Number(formData.freeShippingThreshold) || 0,
        shippingCost: Number(formData.shippingCost) || 0,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        instagramUrl: formData.instagramUrl || '',
        facebookUrl: formData.facebookUrl || '',
        whatsappUrl: formData.whatsappUrl || '',
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        announcement: formData.announcement || '',
        announcementActive: formData.announcementActive,
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('فشل في حفظ الإعدادات')

      const result = await response.json()
      const saved = result.settings || formData
      setInitialSettings(saved)
      setFormData((prev) => ({ ...prev, ...saved }))
      toast.success('تم حفظ الإعدادات بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('حدث خطأ في حفظ الإعدادات')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (initialSettings) {
      setFormData(initialSettings)
      toast.info('تم استعادة الإعدادات المحفوظة')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة إعدادات المتجر</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            استعادة
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              معلومات المتجر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeName" className="mb-2 block">اسم المتجر</Label>
              <Input
                id="storeName"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="storeNameEn" className="mb-2 block">اسم المتجر (إنجليزي)</Label>
              <Input
                id="storeNameEn"
                value={formData.storeNameEn}
                onChange={(e) => setFormData({ ...formData, storeNameEn: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              إعدادات العملة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency" className="mb-2 block">العملة الافتراضية</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: 'USD' | 'SYP') =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="SYP">ليرة سورية (SYP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="exchangeRate" className="mb-2 block">سعر صرف الدولار (ل.س)</Label>
              <Input
                id="exchangeRate"
                type="number"
                min="1"
                value={formData.exchangeRate}
                onChange={(e) =>
                  setFormData({ ...formData, exchangeRate: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                1 دولار = {(formData.exchangeRate || 0).toLocaleString('ar-SY')} ل.س
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              إعدادات الشحن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">أسعار الشحن حسب المحافظة</p>
              <p className="text-muted-foreground">إدلب: $2</p>
              <p className="text-muted-foreground">باقي المحافظات: $3</p>
              <p className="text-xs text-muted-foreground mt-2">
                تُحسب تلقائياً عند اختيار المدينة في صفحة الدفع
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <div>
                <Label htmlFor="freeShippingEnabled" className="cursor-pointer">
                  تفعيل الشحن المجاني
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  عند التعطيل لن يُمنح شحن مجاني مهما بلغ مبلغ الطلب
                </p>
              </div>
              <Switch
                id="freeShippingEnabled"
                checked={(formData.freeShippingThreshold || 0) > 0}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    freeShippingThreshold: checked
                      ? formData.freeShippingThreshold > 0
                        ? formData.freeShippingThreshold
                        : 50
                      : 0,
                  })
                }
              />
            </div>
            {(formData.freeShippingThreshold || 0) > 0 && (
              <div>
                <Label htmlFor="freeShippingThreshold" className="mb-2 block">
                  حد الشحن المجاني (بالدولار)
                </Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.freeShippingThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      freeShippingThreshold: Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  الشحن مجاني عندما يصل مبلغ الطلب (بعد الخصم) إلى $
                  {formData.freeShippingThreshold} أو أكثر
                </p>
              </div>
            )}
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">معاينة</p>
              <p className="text-muted-foreground">
                {(formData.freeShippingThreshold || 0) > 0
                  ? `شحن مجاني فوق $${formData.freeShippingThreshold}`
                  : 'الشحن المجاني معطّل'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              القسم الرئيسي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroTitle" className="mb-2 block">العنوان الرئيسي</Label>
              <Input
                id="heroTitle"
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="heroSubtitle" className="mb-2 block">النص الفرعي</Label>
              <Input
                id="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="announcement" className="mb-2 block">شريط الإعلانات</Label>
              <Textarea
                id="announcement"
                value={formData.announcement || ''}
                onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <Label htmlFor="announcementActive" className="cursor-pointer leading-none">
                تفعيل شريط الإعلانات
              </Label>
              <Switch
                id="announcementActive"
                checked={formData.announcementActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, announcementActive: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              معلومات التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactEmail" className="mb-2 block">البريد الإلكتروني</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactPhone" className="mb-2 block">رقم الهاتف</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="whatsappUrl" className="mb-2 block">رابط واتساب</Label>
              <Input
                id="whatsappUrl"
                value={formData.whatsappUrl || ''}
                onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                placeholder="https://wa.me/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              وسائل التواصل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instagramUrl" className="mb-2 block">انستجرام</Label>
              <Input
                id="instagramUrl"
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <Label htmlFor="facebookUrl" className="mb-2 block">فيسبوك</Label>
              <Input
                id="facebookUrl"
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <Label htmlFor="whatsappUrl" className="mb-2 block">واتساب</Label>
              <Input
                id="whatsappUrl"
                value={formData.whatsappUrl || ''}
                onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                placeholder="https://wa.me/..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}