'use client'

import Link from 'next/link'
import { Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { getSettings } from '@/lib/store'
import { categories } from '@/lib/data'

export function Footer() {
  const settings = getSettings()

  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-gradient">
                {settings.storeNameEn}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              وجهتك الأولى للاكسسوارات النسائية الراقية. نقدم لك أحدث صيحات الموضة بجودة عالية وأسعار مناسبة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  المتجر
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=new" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  وصل حديثاً
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=sale" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  تخفيضات
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  المفضلة
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">تواصلي معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>إدلب، سوريا</span>
              </li>
            </ul>
               <br></br>
            <div className="flex gap-3">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
               {settings.whatsappUrl && (
               <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
               >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.99.53 3.93 1.54 5.66L2 22l4.56-1.19c1.64.92 3.5 1.41 5.4 1.41 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.36 14.06c-.27.75-1.56 1.38-2.56 1.56-.68.12-1.56.22-2.56-.22-.86-.38-1.66-1.04-2.56-2.04-1.4-1.5-2.1-3.2-2.2-3.4-.1-.2-.5-.85-.5-1.62 0-.77.4-1.14.6-1.3.2-.16.4-.2.6-.2.2 0 .4.02.6.02.2 0 .4-.06.6.48.2.54.8 1.86.86 2 .06.14.1.3.02.46-.08.16-.14.26-.26.4-.12.14-.24.3-.36.4-.12.1-.24.22-.1.42.14.2.62 1.02 1.32 1.64.9.8 1.66 1.06 1.9 1.18.24.12.4.1.54-.06.14-.16.62-.72.78-.96.16-.24.32-.2.54-.12.22.08 1.38.65 1.62.77.24.12.4.18.46.28.06.1.06.58-.2 1.33z" />
                </svg>
               <span className="sr-only">WhatsApp</span>
               </a>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            جميع الحقوق محفوظة {new Date().getFullYear()} {settings.storeNameEn}
          </p>
         </div>
      </div>
    </footer>
  )
}
