"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dialog"
import { Search, Eye, Mail, Phone, MapPin, ShoppingBag, Calendar } from "lucide-react"
import type { Customer, Order, Currency } from "@/lib/types"
import { toast } from "sonner"

// دوال مساعدة محلية (بدلاً من store.ts)
const CURRENCY_KEY = 'sedra_currency'

const getCurrencyLocal = (): Currency => {
  if (typeof window === 'undefined') return 'USD'
  const savedCurrency = localStorage.getItem(CURRENCY_KEY)
  return (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
}

const getSettingsLocal = () => {
  return {
    currency: getCurrencyLocal(),
    exchangeRate: 14500,
  }
}

const formatPriceLocal = (price: number | string, currency: Currency) => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numericPrice)) return `$${0}`
  
  if (currency === 'SYP') {
    const settings = getSettingsLocal()
    return `${Math.round(numericPrice * settings.exchangeRate).toLocaleString('ar-SY')} ل.س`
  }
  return `$${numericPrice.toFixed(2)}`
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // جلب العملاء من API
const fetchCustomers = async () => {
  try {
    const response = await fetch('/api/customers')
    const data = await response.json()
    const customersArray = Array.isArray(data) ? data : data.customers || []
    setCustomers(customersArray)
  } catch (error) {
    console.error('Error fetching customers:', error)
    toast.error('حدث خطأ في جلب العملاء')
    setCustomers([])
  }
}

// جلب الطلبات من API
const fetchOrders = async () => {
  try {
    const response = await fetch('/api/orders')
    const data = await response.json()
    const ordersArray = Array.isArray(data) ? data : data.orders || []
    setOrders(ordersArray)
  } catch (error) {
    console.error('Error fetching orders:', error)
    toast.error('حدث خطأ في جلب الطلبات')
    setOrders([])
  }
}
  useEffect(() => {
    Promise.all([fetchCustomers(), fetchOrders()]).finally(() => setLoading(false))
    setCurrency(getCurrencyLocal())

    const handleCurrencyChange = () => setCurrency(getCurrencyLocal())
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  const filteredCustomers = Array.isArray(customers)
  ? customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
    )
  : []

  const getCustomerOrders = (email: string) => {
    return orders.filter((order) => order.customerEmail === email)
  }

  const getCustomerTotalSpent = (email: string) => {
    const customerOrders = getCustomerOrders(email)
    return customerOrders.reduce((total, order) => total + order.total, 0)
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerOrders(getCustomerOrders(customer.email))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">العملاء</h1>
          <p className="text-muted-foreground">إدارة قاعدة بيانات العملاء</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {customers.length} عميل
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="البحث بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">التواصل</TableHead>
                <TableHead className="text-right">الطلبات</TableHead>
                <TableHead className="text-right">إجمالي المشتريات</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا يوجد عملاء
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const orderCount = getCustomerOrders(customer.email).length
                  const totalSpent = getCustomerTotalSpent(customer.email)
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={orderCount > 0 ? "default" : "secondary"}>
                          {orderCount} طلب
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPriceLocal(totalSpent, currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString("ar-SY")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل العميل</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {selectedCustomer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{selectedCustomer.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomer.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedCustomer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedCustomer.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {selectedCustomer.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      انضم في {new Date(selectedCustomer.createdAt).toLocaleDateString("ar-SY")}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      إحصائيات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إجمالي الطلبات</span>
                      <Badge>{customerOrders.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إجمالي المشتريات</span>
                      <span className="font-semibold text-primary">
                        {formatPriceLocal(
                          customerOrders.reduce((t, o) => t + o.total, 0),
                          currency
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">متوسط قيمة الطلب</span>
                      <span className="font-medium">
                        {customerOrders.length > 0
                          ? formatPriceLocal(
                              customerOrders.reduce((t, o) => t + o.total, 0) / customerOrders.length,
                              currency
                            )
                          : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    سجل الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerOrders.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      لا توجد طلبات لهذا العميل
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("ar-SY")}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">
                              {formatPriceLocal(order.total, currency)}
                            </p>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {order.status === "pending" && "قيد الانتظار"}
                              {order.status === "confirmed" && "مؤكد"}
                              {order.status === "processing" && "قيد التجهيز"}
                              {order.status === "shipped" && "تم الشحن"}
                              {order.status === "delivered" && "تم التسليم"}
                              {order.status === "cancelled" && "ملغي"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}