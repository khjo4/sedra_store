"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getCart, getWishlist } from "@/lib/store"
import { getSettings } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Home, ShoppingBag, Heart, ShoppingCart, User } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const settings = getSettings()

  useEffect(() => {
    const updateCounts = () => {
      const cart = getCart()
      const wishlist = getWishlist()
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
      setWishlistCount(wishlist.length)
    }

    updateCounts()
    
    // Check if user is admin (you can modify this logic)
    const checkAdmin = () => {
      // Option 1: Check localStorage
      const adminToken = localStorage.getItem("admin_token")
      setIsAdmin(!!adminToken)
      
      // Option 2: Check if user is logged in with admin email
      // const user = JSON.parse(localStorage.getItem("user") || "{}")
      // setIsAdmin(user.email === "admin@sedra.com")
    }
    
    checkAdmin()
    
    // Listen for storage changes
    const handleStorage = () => {
      updateCounts()
      checkAdmin()
    }
    window.addEventListener("storage", handleStorage)
    
    // Poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      updateCounts()
      checkAdmin()
    }, 1000)
    
    return () => {
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  // Don't show on admin pages
  if (pathname.startsWith("/admin")) return null

  const navItems = [
    { href: "/", icon: Home, label: "الرئيسية" },
    { href: "/shop", icon: ShoppingBag, label: "المتجر" },
    { href: "/wishlist", icon: Heart, label: "المفضلة", badge: wishlistCount },
    { href: "/cart", icon: ShoppingCart, label: "السلة", badge: cartCount },
  ]

  // Add admin link only if user is admin
  if (isAdmin) {
    navItems.push({ href: "/admin", icon: User, label: "لوحة التحكم" })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge ? (
                  <span className="absolute -top-2 -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
        
        {/* WhatsApp Button */}
        {settings.whatsappUrl && (
          <a
            href={settings.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <div className="relative">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.99.53 3.93 1.54 5.66L2 22l4.56-1.19c1.64.92 3.5 1.41 5.4 1.41 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.36 14.06c-.27.75-1.56 1.38-2.56 1.56-.68.12-1.56.22-2.56-.22-.86-.38-1.66-1.04-2.56-2.04-1.4-1.5-2.1-3.2-2.2-3.4-.1-.2-.5-.85-.5-1.62 0-.77.4-1.14.6-1.3.2-.16.4-.2.6-.2.2 0 .4.02.6.02.2 0 .4-.06.6.48.2.54.8 1.86.86 2 .06.14.1.3.02.46-.08.16-.14.26-.26.4-.12.14-.24.3-.36.4-.12.1-.24.22-.1.42.14.2.62 1.02 1.32 1.64.9.8 1.66 1.06 1.9 1.18.24.12.4.1.54-.06.14-.16.62-.72.78-.96.16-.24.32-.2.54-.12.22.08 1.38.65 1.62.77.24.12.4.18.46.28.06.1.06.58-.2 1.33z" />
              </svg>
            </div>
            <span>واتساب</span>
          </a>
        )}
      </div>
    </nav>
  )
}