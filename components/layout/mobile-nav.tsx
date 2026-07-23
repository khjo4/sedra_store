'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, ShoppingBag, Heart, ShoppingCart, User, LayoutDashboard, MessageCircle } from 'lucide-react'
import { useAdminSession } from '@/hooks/use-admin-session'
import { getCart, getWishlistIds } from '@/lib/cart-wishlist'

function buildWhatsAppUrl(settings: any): string {
  const direct = settings?.whatsappUrl || settings?.whatsapp_url || ''
  if (direct) return direct
  const number = String(
    settings?.whatsappNumber || settings?.whatsapp_number || '963950534327'
  ).replace(/[^0-9]/g, '')
  return `https://wa.me/${number || '963950534327'}`
}

export function MobileNav() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const { isAdmin } = useAdminSession()
  const [user, setUser] = useState<any>(null)
  const [whatsappUrl, setWhatsappUrl] = useState('https://wa.me/963950534327')

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setWhatsappUrl(buildWhatsAppUrl(data)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }
    fetchUser()
  }, [pathname])

  useEffect(() => {
    const updateCounts = () => {
      const cart = getCart()
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 0), 0))
      setWishlistCount(getWishlistIds().length)
    }

    updateCounts()
    window.addEventListener('storage', updateCounts)
    window.addEventListener('cartUpdated', updateCounts)
    window.addEventListener('wishlistUpdated', updateCounts)

    return () => {
      window.removeEventListener('storage', updateCounts)
      window.removeEventListener('cartUpdated', updateCounts)
      window.removeEventListener('wishlistUpdated', updateCounts)
    }
  }, [])

  if (pathname.startsWith('/admin')) return null

  const navItems: Array<{
    key: string
    href: string
    label: string
    badge?: number
    external?: boolean
    icon: React.ReactNode
  }> = [
    {
      key: 'home',
      href: '/',
      label: 'الرئيسية',
      icon: <Home className="h-5 w-5" />,
    },
    {
      key: 'shop',
      href: '/shop',
      label: 'المتجر',
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      key: 'wishlist',
      href: '/wishlist',
      label: 'المفضلة',
      badge: wishlistCount,
      icon: <Heart className="h-5 w-5" />,
    },
    {
      key: 'cart',
      href: '/cart',
      label: 'السلة',
      badge: cartCount,
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      key: 'whatsapp',
      href: whatsappUrl,
      label: 'واتساب',
      external: true,
      icon: <MessageCircle className="h-5 w-5" />,
    },
  ]

  if (isAdmin) {
    navItems.push({
      key: 'admin',
      href: '/admin',
      label: 'لوحة التحكم',
      icon: <LayoutDashboard className="h-5 w-5" />,
    })
  } else if (user) {
    navItems.push({
      key: 'account',
      href: '/account',
      label: 'حسابي',
      icon: <User className="h-5 w-5" />,
    })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive =
            !item.external &&
            (pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href)))

          const className = cn(
            'relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )

          if (item.external) {
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            )
          }

          return (
            <Link key={item.key} href={item.href} className={className}>
              {item.icon}
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute top-1 start-1/2 ms-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
