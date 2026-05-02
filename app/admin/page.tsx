'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Clock,
  LogOut,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAdminStats, getOrders, getProducts, formatPrice, getCurrency } from '@/lib/store'
import type { Order, Product, Currency } from '@/lib/types'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])
  const [currency, setCurrency] = useState<Currency>('USD')

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return
    
    setStats(getAdminStats())
    setRecentOrders(getOrders().slice(0, 5))
    setLowStockItems(getProducts().filter(p => p.stock < 10).slice(0, 5))
    setCurrency(getCurrency())

    const handleCurrencyChange = () => setCurrency(getCurrency())
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [isAuthenticated])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const statCards = [
    {
      title: 'إجمالي الإيرادات',
      value: formatPrice(stats.totalRevenue, currency),
      icon: DollarSign,
      change: '+12%',
      positive: true,
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      change: '+8%',
      positive: true,
    },
    {
      title: 'العملاء',
      value: stats.totalCustomers.toString(),
      icon: Users,
      change: '+5%',
      positive: true,
    },
    {
      title: 'المنتجات',
      value: stats.totalProducts.toString(),
      icon: Package,
      subtext: `${stats.lowStockProducts} منخفض المخزون`,
    },
  ]

  const getStatusBadge = (status: Order['status']) => {
    const statusMap = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' as const },
      confirmed: { label: 'مؤكد', variant: 'default' as const },
      processing: { label: 'قيد التجهيز', variant: 'default' as const },
      shipped: { label: 'تم الشحن', variant: 'default' as const },
      delivered: { label: 'تم التوصيل', variant: 'default' as const },
      cancelled: { label: 'ملغي', variant: 'destructive' as const },
    }
    const { label, variant } = statusMap[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header with Logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم سيدرا</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}pwd
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className={`text-xs ${stat.positive ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} من الشهر الماضي
                </p>
              )}
              {stat.subtext && (
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>أحدث الطلبات</CardTitle>
              <CardDescription>
                {stats.pendingOrders} طلب بانتظار المعالجة
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{order.customerName}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString('ar-SY')}
                        <span>|</span>
                        <span className="font-mono">{order.id}</span>
                      </div>
                    </div>
                    <span className="font-bold text-primary">
                      {formatPrice(order.total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد طلبات بعد
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                تنبيه المخزون
              </CardTitle>
              <CardDescription>
                منتجات قاربت على النفاذ
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products" className="gap-1">
                عرض الكل
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.category}
                      </p>
                    </div>
                    <Badge variant={product.stock < 5 ? 'destructive' : 'secondary'}>
                      {product.stock} متبقي
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                جميع المنتجات متوفرة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin/products/new">
                <Package className="h-4 w-4 ml-2" />
                إضافة منتج جديد
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/orders">
                <ShoppingCart className="h-4 w-4 ml-2" />
                إدارة الطلبات
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/coupons">
                إنشاء كوبون خصم
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/settings">
                الإعدادات العامة
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}