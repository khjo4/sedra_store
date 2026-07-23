'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Clock, MapPin, Phone, Mail, Download } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { pdf } from '@react-pdf/renderer'
import { OrderPDF } from '@/components/admin/order-pdf'
import { formatPrice, fetchExchangeRate } from '@/lib/utils'
import type { Order, Currency, Product } from '@/lib/types'
import { toast } from 'sonner'

// ================================================
// تم إزالة getCurrencyLocal و formatPriceLocal
// الآن نستخدم formatPrice من lib/utils
// ================================================

const statusOptions: { value: Order['status']; label: string }[] = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'processing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  
  // حالات للأسعار المنسقة
  const [formattedTotals, setFormattedTotals] = useState<Record<string, string>>({})
  const [formattedSubtotals, setFormattedSubtotals] = useState<Record<string, string>>({})
  const [formattedDiscounts, setFormattedDiscounts] = useState<Record<string, string>>({})
  const [formattedShipping, setFormattedShipping] = useState<Record<string, string>>({})
  const [formattedItemPrices, setFormattedItemPrices] = useState<Record<string, Record<number, string>>>({})

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
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      const productsData = Array.isArray(data) ? data : data.products || []
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  // جلب الطلبات من API
  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/orders?limit=10000')
      const data = await response.json()
      const ordersData = Array.isArray(data) ? data : data.orders || []
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('حدث خطأ في جلب الطلبات')
    } finally {
      setLoading(false)
    }
  }

  // تحديث الأسعار المنسقة عند تغير الطلبات أو العملة
  useEffect(() => {
    const updatePrices = () => {
      const totals: Record<string, string> = {}
      const subtotals: Record<string, string> = {}
      const discounts: Record<string, string> = {}
      const shipping: Record<string, string> = {}
      const itemPrices: Record<string, Record<number, string>> = {}

      orders.forEach(order => {
        totals[order.id] = formatPrice(order.total, currency, exchangeRate)
        subtotals[order.id] = formatPrice(order.subtotal, currency, exchangeRate)
        if (order.discount > 0) {
          discounts[order.id] = formatPrice(order.discount, currency, exchangeRate)
        }
        shipping[order.id] = order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping, currency, exchangeRate)

        // تنسيق أسعار العناصر في الطلب
        if (order.items && Array.isArray(order.items)) {
          const orderItemPrices: Record<number, string> = {}
          order.items.forEach((item, idx) => {
            const product = products.find(p => p.id === item.productId)
            if (product) {
              orderItemPrices[idx] = formatPrice(product.price * item.quantity, currency, exchangeRate)
            }
          })
          itemPrices[order.id] = orderItemPrices
        }
      })

      setFormattedTotals(totals)
      setFormattedSubtotals(subtotals)
      setFormattedDiscounts(discounts)
      setFormattedShipping(shipping)
      setFormattedItemPrices(itemPrices)
    }

    updatePrices()
  }, [orders, products, currency, exchangeRate])

  // تحديث حالة الطلب
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update')
      }

      await loadOrders()
      toast.success('تم تحديث حالة الطلب')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('حدث خطأ في تحديث حالة الطلب')
    }
  }

  // جلب اسم المنتج
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.name || productId
  }

  useEffect(() => {
    loadOrders()
    loadProducts()
  }, [])

  useEffect(() => {
    let result = [...orders]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          (o.id && String(o.id).toLowerCase().includes(query)) ||
          (o.customerName && String(o.customerName).toLowerCase().includes(query)) ||
          (o.customerPhone && String(o.customerPhone).includes(query))
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter)
    }

    setFilteredOrders(result)
  }, [orders, searchQuery, statusFilter])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">الطلبات</h1>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">الطلبات</h1>
        <p className="text-muted-foreground">{orders.length} طلب</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="text-right">
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">المجموع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-medium">{order.customerName || 'غير معروف'}</p>
                          <p className="text-xs text-muted-foreground">{order.city || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SY') : 'تاريخ غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        {formattedTotals[order.id] || formatPrice(order.total, currency, exchangeRate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                        >
                          <SelectTrigger className="w-35">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>تفاصيل الطلب {selectedOrder?.id}</DialogTitle>
                              <DialogDescription>
                                {selectedOrder && new Date(selectedOrder.createdAt).toLocaleString('ar-SY')}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <div>
                                  <h4 className="font-semibold mb-3">معلومات العميل</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">الاسم:</span>
                                      <span>{selectedOrder.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span dir="ltr">{selectedOrder.customerPhone || 'غير متوفر'}</span>
                                    </div>
                                    {selectedOrder.customerEmail && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedOrder.customerEmail}</span>
                                      </div>
                                    )}
                                    <div className="flex items-start gap-2 col-span-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                      <span>{selectedOrder.address}، {selectedOrder.city}</span>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-semibold mb-3">المنتجات</h4>
                                  <div className="space-y-3">
                                    {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                                      selectedOrder.items.map((item, index) => {
                                        const product = products.find(p => p.id === item.productId)
                                        const itemPrice = formattedItemPrices[selectedOrder.id]?.[index] ||
                                          (product ? formatPrice(product.price * item.quantity, currency, exchangeRate) : '')
                                        return (
                                          <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <div>
                                              <p className="font-medium">{product?.name || item.productId}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {item.selectedColor && `اللون: ${item.selectedColor}`}
                                                {item.selectedColor && item.selectedSize && ' | '}
                                                {item.selectedSize && `المقاس: ${item.selectedSize}`}
                                                {' | '}الكمية: {item.quantity}
                                              </p>
                                            </div>
                                            <span className="font-medium">
                                              {itemPrice}
                                            </span>
                                          </div>
                                        )
                                      })
                                    ) : (
                                      <p className="text-center text-muted-foreground py-4">لا توجد منتجات في هذا الطلب</p>
                                    )}
                                  </div>
                                </div>

                                <Separator />

                                {/* Order Summary */}
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">المجموع الفرعي</span>
                                    <span>{formattedSubtotals[selectedOrder.id] || formatPrice(selectedOrder.subtotal, currency, exchangeRate)}</span>
                                  </div>
                                  {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                      <span>الخصم {selectedOrder.couponCode && `(${selectedOrder.couponCode})`}</span>
                                      <span>-{formattedDiscounts[selectedOrder.id] || formatPrice(selectedOrder.discount, currency, exchangeRate)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">الشحن</span>
                                    <span>
                                      {formattedShipping[selectedOrder.id] || (selectedOrder.shipping === 0 ? 'مجاني' : formatPrice(selectedOrder.shipping, currency, exchangeRate))}
                                    </span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-bold text-lg">
                                    <span>الإجمالي</span>
                                    <span className="text-primary">{formattedTotals[selectedOrder.id] || formatPrice(selectedOrder.total, currency, exchangeRate)}</span>
                                  </div>
                                </div>

                                {selectedOrder.notes && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h4 className="font-semibold mb-2">ملاحظات</h4>
                                      <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات
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