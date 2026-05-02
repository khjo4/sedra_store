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
import { cn } from '@/lib/utils'
import { getCartCount, getWishlist, getCurrency, setCurrency, getSettings, formatPrice } from '@/lib/store'
import { categories } from '@/lib/data'
import type { Currency } from '@/lib/types'

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/shop', label: 'المتجر' },
  { href: '/shop?filter=new', label: 'وصل حديثاً' },
  { href: '/shop?filter=sale', label: 'تخفيضات' },
]

export function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [currency, setCurrentCurrency] = useState<Currency>('USD')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const settings = getSettings()

  useEffect(() => {
    const checkAdmin = () => {
      const adminToken = localStorage.getItem("admin_token")
      setIsAdmin(!!adminToken)
    }
    checkAdmin()
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
      setCurrentCurrency(getCurrency())
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

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
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

  return (
    <>
      {/* Announcement Bar */}
      {settings.announcementActive && settings.announcement && (
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
              <SheetContent side="right" className="w-75 sm:w-87.5">
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
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
              <span className="text-2xl md:text-3xl font-bold text-gradient">
                {settings.storeNameEn}
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
              {/* Currency Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex text-xs gap-1">
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
                  <div className="px-2 py-1 text-xs text-muted-foreground border-t">
                    سعر الصرف: {formatPrice(1, 'SYP')}
                  </div>
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
                      {wishlistCount}
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
                      {cartCount}
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