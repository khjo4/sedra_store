"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Ticket, Percent, DollarSign, Calendar } from "lucide-react"
import type { Coupon } from "@/lib/types"
import { toast } from "sonner"

const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await fetch('/api/coupons')
    const data = await response.json()
    const couponsArray = Array.isArray(data) ? data : data.coupons || []
    return couponsArray
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return []
  }
}

const createCouponAPI = async (couponData: any): Promise<any> => {
  const response = await fetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(couponData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'فشل إنشاء الكوبون')
  }
  return data
}

const updateCouponAPI = async (id: string, couponData: any): Promise<any> => {
  const response = await fetch(`/api/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'فشل تحديث الكوبون')
  }
  return data
}

const deleteCouponAPI = async (id: string): Promise<void> => {
  try {
    await fetch(`/api/coupons/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    throw error
  }
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    minPurchase: 0,
    maxUses: 100,
    expiresAt: "",
    active: true,
  })

  const loadCoupons = async () => {
  setLoading(true)
  const data = await fetchCoupons()
  setCoupons(data) // data الآن مصفوفة بالتأكيد
  setLoading(false)
}

  useEffect(() => {
    loadCoupons()
  }, [])

  const refreshCoupons = () => {
    loadCoupons()
  }

  const resetForm = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: 0,
      minPurchase: 0,
      maxUses: 100,
      expiresAt: "",
      active: true,
    })
    setEditingCoupon(null)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase || 0,
      maxUses: coupon.maxUses || 100,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
      active: coupon.active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      toast.error('كود الكوبون مطلوب')
      return
    }
    if (!formData.value || formData.value <= 0) {
      toast.error('قيمة الخصم يجب أن تكون أكبر من 0')
      return
    }
    
    const couponData = {
      code: formData.code.toUpperCase().trim(),
      type: formData.type,
      value: Number(formData.value),
      minPurchase: Number(formData.minPurchase) || 0,
      maxUses: Number(formData.maxUses) || 100,
      expiresAt: formData.expiresAt
        ? new Date(formData.expiresAt).toISOString()
        : null,
      active: formData.active,
    }

    try {
      if (editingCoupon) {
        await updateCouponAPI(editingCoupon.id, couponData)
        toast.success("تم تحديث الكوبون بنجاح")
      } else {
        await createCouponAPI(couponData)
        toast.success("تم إضافة الكوبون بنجاح")
      }
      refreshCoupons()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ الكوبون")
    }
  }

  const handleDelete = async (couponId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الكوبون؟")) {
      try {
        await deleteCouponAPI(couponId)
        refreshCoupons()
        toast.success("تم حذف الكوبون بنجاح")
      } catch (error) {
        toast.error("حدث خطأ أثناء حذف الكوبون")
      }
    }
  }

  const isCouponExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const isCouponExhausted = (coupon: Coupon) => {
    if (!coupon.maxUses || coupon.maxUses <= 0) return false
    return coupon.usedCount >= coupon.maxUses
  }

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.active) return { label: "معطل", variant: "secondary" as const }
    if (isCouponExpired(coupon.expiresAt)) return { label: "منتهي", variant: "destructive" as const }
    if (isCouponExhausted(coupon)) return { label: "مستنفد", variant: "destructive" as const }
    return { label: "نشط", variant: "default" as const }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">الكوبونات</h1>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">الكوبونات</h1>
          <p className="text-muted-foreground">إدارة كوبونات الخصم</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة كوبون
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "تعديل الكوبون" : "إضافة كوبون جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="mb-2 block">كود الكوبون</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: SAVE20"
                  className="uppercase"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type" className="mb-2 block">نوع الخصم</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value" className="mb-2 block">قيمة الخصم</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={formData.type === "percentage" ? 100 : undefined}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minPurchase" className="mb-2 block">الحد الأدنى للطلب ($)</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    min="0"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchase: Number(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">اتركه 0 لعدم وجود حد أدنى</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses" className="mb-2 block">الحد الأقصى للاستخدام</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="mb-2 block">تاريخ الانتهاء</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">اتركه فارغاً لكوبون ينتهي بعد 30 يوم</p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
                <Label htmlFor="active" className="cursor-pointer leading-none">
                  الكوبون نشط
                </Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCoupon ? "حفظ التغييرات" : "إضافة الكوبون"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الكوبونات
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الكوبونات النشطة
            </CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {coupons.filter((c) => c.active && !isCouponExpired(c.expiresAt) && !isCouponExhausted(c)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الاستخدام
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الكود</TableHead>
                <TableHead className="text-right">الخصم</TableHead>
                <TableHead className="text-right">الحد الأدنى</TableHead>
                <TableHead className="text-right">الاستخدام</TableHead>
                <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد كوبونات. أضف كوبون جديد للبدء.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => {
                  const status = getCouponStatus(coupon)
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                          {coupon.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.type === "percentage" ? (
                            <>
                              <Percent className="h-3 w-3" />
                              {coupon.value}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3" />
                              {coupon.value}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.minPurchase ? `$${coupon.minPurchase}` : "-"}
                      </TableCell>
                      <TableCell>
                        {coupon.maxUses
                          ? `${coupon.usedCount}/${coupon.maxUses}`
                          : `${coupon.usedCount} (غير محدود)`}
                      </TableCell>
                      <TableCell>
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(coupon.expiresAt).toLocaleDateString("ar-SY")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}