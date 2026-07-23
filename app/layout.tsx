import type { Metadata, Viewport } from 'next'
import { Cairo, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { MobileNav } from '@/components/layout/mobile-nav'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'سيدرا | SEDRA - منتجات واكسسوارات راقية',
  description: 'تسوقي أجمل تشكيلة من المنتجات الراقية - منتجات واكسسوارات بأفضل الأسعار مع شحن سريع',
  keywords: ['عطورات', 'هدايا', 'اكسسوارات', 'تسوق أونلاين', 'سوريا'],
  authors: [{ name: 'SEDRA' }],
  creator: 'SEDRA',
  publisher: 'SEDRA',
  openGraph: {
    type: 'website',
    locale: 'ar_SY',
    url: 'https://sedra.com',
    siteName: 'سيدرا | SEDRA',
    title: 'سيدرا | SEDRA - منتجات واكسسوارات راقية',
    description: 'تسوقي أجمل تشكيلة من المنتجات الراقية',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سيدرا | SEDRA',
    description: 'اكسسوارات ومنتجات راقية',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf6f5' },
    { media: '(prefers-color-scheme: dark)', color: '#2a2220' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${geistMono.variable}`}>
      <body className={`${cairo.className} font-sans antialiased min-h-screen pb-20 md:pb-0`}>
        {children}
        <MobileNav />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              direction: 'rtl',
              borderRadius: '1rem',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}