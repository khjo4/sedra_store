'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, Facebook, MapPin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const pathname = usePathname()
  const [settings, setSettings] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error('Error fetching settings:', err))
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (pathname?.startsWith('/admin')) {
    return null
  }

  if (!mounted || !settings) {
    return (
      <footer className="mt-10 border-t border-border/60 bg-card/70">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </div>
      </footer>
    )
  }

  const storeNameEn = settings.storeNameEn || settings.store_name_en || 'SEDRA'
  const instagramUrl = settings.instagramUrl || settings.instagram_url
  const facebookUrl = settings.facebookUrl || settings.facebook_url
  const whatsappUrl =
    settings.whatsappUrl ||
    settings.whatsapp_url ||
    (settings.whatsappNumber || settings.whatsapp_number
      ? `https://wa.me/${String(settings.whatsappNumber || settings.whatsapp_number).replace(/[^0-9]/g, '')}`
      : null)

  return (
    <footer className="mt-10 border-t border-border/60 bg-card/70 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 inline-flex items-center gap-2.5">
              <img
                src="/image/logo.png"
                alt={storeNameEn}
                className="h-11 w-11 rounded-full object-contain bg-primary/5 p-0.5 ring-1 ring-border/50"
              />
              <span className="text-2xl font-bold text-gradient">{storeNameEn}</span>
            </Link>
            <p className="mb-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              وجهتك الأولى للاكسسوارات النسائية الراقية. نقدم لك أحدث صيحات الموضة بجودة عالية
              وأسعار مناسبة.
            </p>
            <div className="flex gap-2">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Facebook className="h-4 w-4" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.99.53 3.93 1.54 5.66L2 22l4.56-1.19c1.64.92 3.5 1.41 5.4 1.41 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.36 14.06c-.27.75-1.56 1.38-2.56 1.56-.68.12-1.56.22-2.56-.22-.86-.38-1.66-1.04-2.56-2.04-1.4-1.5-2.1-3.2-2.2-3.4-.1-.2-.5-.85-.5-1.62 0-.77.4-1.14.6-1.3.2-.16.4-.2.6-.2.2 0 .4.02.6.02.2 0 .4-.06.6.48.2.54.8 1.86.86 2 .06.14.1.3.02.46-.08.16-.14.26-.26.4-.12.14-.24.3-.36.4-.12.1-.24.22-.1.42.14.2.62 1.02 1.32 1.64.9.8 1.66 1.06 1.9 1.18.24.12.4.1.54-.06.14-.16.62-.72.78-.96.16-.24.32-.2.54-.12.22.08 1.38.65 1.62.77.24.12.4.18.46.28.06.1.06.58-.2 1.33z" />
                  </svg>
                  <span className="sr-only">WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'الرئيسية' },
                { href: '/shop', label: 'المتجر' },
                { href: '/shop?filter=new', label: 'وصل حديثاً' },
                { href: '/shop?filter=sale', label: 'تخفيضات' },
                { href: '/wishlist', label: 'المفضلة' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide">تواصلي معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                <span>إدلب، سوريا</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 opacity-60" />

        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <p>
            جميع الحقوق محفوظة {new Date().getFullYear()} {storeNameEn}
          </p>
        </div>
      </div>
    </footer>
  )
}
