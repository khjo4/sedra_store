'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Settings,
  Menu,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/admin/customers', label: 'العملاء', icon: Users },
  { href: '/admin/coupons', label: 'كوبونات الخصم', icon: Ticket },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' })
        if (!res.ok) {
          localStorage.removeItem('admin_token')
          router.replace('/admin/login')
          return
        }
        if (!cancelled) setAuthorized(true)
      } catch {
        router.replace('/admin/login')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoginPage, router, pathname])

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_token')
    window.dispatchEvent(new Event('adminLogout'))
    router.replace('/admin/login')
    router.refresh()
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const storeName = settings?.storeNameEn || settings?.store_name_en || 'SEDRA'
  const storeNameAr = settings?.storeName || settings?.store_name || 'سيدرا'

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="relative overflow-hidden border-b border-sidebar-border px-5 py-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at top right, color-mix(in oklch, var(--primary) 28%, transparent), transparent 70%)',
          }}
        />
        <Link
          href="/admin"
          onClick={() => mobile && setSidebarOpen(false)}
          className="relative flex items-center gap-3"
        >
          <img
            src="/image/logo.png"
            alt={storeName}
            className="h-11 w-11 rounded-2xl object-contain bg-background/80 p-1 shadow-sm ring-1 ring-border/60"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-wide text-gradient">{storeName}</p>
            <p className="truncate text-xs text-muted-foreground">{storeNameAr} · إدارة</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/80">
          القائمة
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/12 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_22%,transparent)]'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary" />
                  )}
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/70 text-muted-foreground group-hover:bg-background group-hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer actions */}
      <div className="mt-auto space-y-2 border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/70">
            <ExternalLink className="h-4 w-4" />
          </span>
          <span>عرض المتجر</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <LogOut className="h-4 w-4" />
          </span>
          <span>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[color-mix(in_oklch,var(--beige)_55%,var(--background))]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 end-0 z-40 hidden w-[17.5rem] flex-col border-s border-sidebar-border bg-sidebar shadow-[-8px_0_30px_-18px_rgba(40,20,10,0.18)] lg:flex">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <img
            src="/image/logo.png"
            alt={storeName}
            className="h-8 w-8 rounded-xl object-contain bg-primary/5 p-0.5"
          />
          <span className="font-bold tracking-wide">{storeName}</span>
        </Link>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-xl">
              <Menu className="h-5 w-5" />
              <span className="sr-only">فتح القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[17.5rem] border-sidebar-border bg-sidebar p-0 [&>button]:top-4 [&>button]:end-4"
          >
            <SheetTitle className="sr-only">قائمة الإدارة</SheetTitle>
            <Sidebar mobile />
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:me-[17.5rem]">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
