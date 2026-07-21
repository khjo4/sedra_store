'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingBag, Heart, Search, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { cn, formatPriceAsync, fetchExchangeRate } from '@/lib/utils'
import type { Currency, Category } from '@/lib/types'

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/shop', label: 'المتجر' },
  { href: '/shop?filter=new', label: 'وصل حديثاً' },
  { href: '/shop?filter=sale', label: 'تخفيضات' },
]

// ================================================
// ✅ دوال السلة والمفضلة (مؤقتاً)
// ================================================
const CART_KEY = 'sedra_cart'
const WISHLIST_KEY = 'sedra_wishlist'
const ADMIN_TOKEN_KEY = 'admin_token'

const getCart = (): any[] => {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

const getCartCount = (): number => {
  return getCart().reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
}

const getWishlist = (): string[] => {
  if (typeof window === 'undefined') return []
  const wishlist = localStorage.getItem(WISHLIST_KEY)
  return wishlist ? JSON.parse(wishlist) : []
}

// ================================================
// ✅ دوال العملة - تم استبدالها بـ lib/utils
// ================================================

export function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [currency, setCurrentCurrency] = useState<Currency>('USD')
  const [exchangeRate, setExchangeRate] = useState(14500)
  const [formattedExchangeRate, setFormattedExchangeRate] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [user, setUser] = useState<any>(null);
const [userLoading, setUserLoading] = useState(true);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setUserLoading(false);
    }
  };
  fetchUser();
}, []);

  // جلب الإعدادات من API
  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error fetching settings:', err))
  }, [])

  // جلب الأقسام من API
useEffect(() => {
  fetch('/api/categories', { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      const categoriesArray = Array.isArray(data) ? data : data.categories || []
      setCategories(categoriesArray)
    })
    .catch(err => console.error('Error fetching categories:', err))
}, [])

  // ✅ تحميل العملة وسعر الصرف
  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = localStorage.getItem('sedra_currency')
      const currentCurrency = (savedCurrency === 'SYP' ? 'SYP' : 'USD') as Currency
      setCurrentCurrency(currentCurrency)
      
      const rate = await fetchExchangeRate()
      setExchangeRate(rate)
      
      // تنسيق سعر الصرف للعرض
      if (currentCurrency === 'SYP') {
        const formatted = await formatPriceAsync(1, 'SYP')
        setFormattedExchangeRate(formatted)
      }
    }
    
    loadCurrency()
    
    const handleCurrencyChange = () => {
      loadCurrency()
    }
    
    window.addEventListener('currencyChanged', handleCurrencyChange)
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange)
  }, [])

  useEffect(() => {
  setMounted(true)
  
  const checkAdmin = () => {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY)
    setIsAdmin(!!adminToken)
  }
  
  checkAdmin()
  
  // ✅ الاستماع لأي تغيير في localStorage
  const handleStorageChange = () => {
    checkAdmin()
  }
  
  // ✅ حدث مخصص لتسجيل الخروج
  const handleAdminLogout = () => {
    checkAdmin()
  }
  
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('adminLogout', handleAdminLogout)
  
  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('adminLogout', handleAdminLogout)
  }
}, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const updateCounts = () => {
      setCartCount(getCartCount())
      setWishlistCount(getWishlist().length)
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

  // ✅ تغيير العملة
  const handleCurrencyChange = (newCurrency: Currency) => {
    localStorage.setItem('sedra_currency', newCurrency)
    setCurrentCurrency(newCurrency)
    window.dispatchEvent(new Event('currencyChanged'))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`
      setSearchOpen(false)
    }
  }

  // أثناء التحميل، اعرض نسخة بسيطة
  if (!mounted || !settings || categories.length === 0) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-bold text-gradient">SEDRA</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
     {/* Announcement Bar */}
{settings?.announcementActive && settings?.announcement && (
  <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
    <p className="text-balance">{settings.announcement}</p>
  </div>
)}

      {/* Main Header */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled
            ? 'glass-strong shadow-md py-2'
            : 'bg-background py-4'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">فتح القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-75 sm:w-87.5  pr-4">
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                 <div className="mt-8 mb-4">
    {!user ? (
      <div className="flex flex-col gap-2">
        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
          <Button className="w-full">تسجيل الدخول</Button>
        </Link>
        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="outline" className="w-full">إنشاء حساب</Button>
        </Link>
      </div>
    ) : (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
          <Button size="sm">حسابي</Button>
        </Link>
      </div>
    )}
  </div>
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'text-lg font-medium py-2 border-b border-border transition-colors',
                        pathname === link.href
                          ? 'text-primary'
                          : 'text-foreground hover:text-primary'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-2">الأقسام</p>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-foreground hover:text-primary transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/10">
                <img
                  src="/image/logo.png"
                  alt={settings.store_name_en || 'SEDRA'}
                  className="w-full h-full object-cover p-1"
                />
              </div>
              <span className="text-2xl md:text-3xl font-bold text-gradient">
                {settings.store_name_en || 'SEDRA'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary relative',
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-foreground'
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute -bottom-1 right-0 left-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1">
                    الأقسام
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.id} asChild>
                      <Link href={`/shop?category=${cat.slug}`}>
                        {cat.name}
                        <span className="mr-auto text-muted-foreground text-xs">
                          ({cat.productCount})
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex text-xs gap-1">
                    {currency === 'USD' ? 'USD $' : 'SYP ل.س'}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCurrencyChange('USD')}>
                    USD $ (دولار)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCurrencyChange('SYP')}>
                    SYP ل.س (ليرة سورية)
                  </DropdownMenuItem>
                  {currency === 'SYP' && formattedExchangeRate && (
                    <div className="px-2 py-1 text-xs text-muted-foreground border-t">
                      سعر الصرف: {formattedExchangeRate}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">بحث</span>
              </Button>

              {/* Wishlist */}
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </Badge>
                  )}
                  <span className="sr-only">المفضلة</span>
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {cartCount > 9 ? '9+' : cartCount}
                    </Badge>
                  )}
                  <span className="sr-only">السلة</span>
                </Button>
              </Link>

              {/* Admin - Only show for admin users */}
              {isAdmin && (
                <Link href="/admin" className="hidden sm:block">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">لوحة التحكم</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="mt-4 animate-slide-up">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="search"
                  placeholder="ابحثي عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit">بحث</Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </header>
    </>
  )
}