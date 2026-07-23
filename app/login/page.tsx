'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.customer) {
          localStorage.setItem('customer_data', JSON.stringify(data.customer))
          localStorage.setItem('user_email', data.customer.email)
        }
        // لا تخلط جلسة العميل مع واجهة الأدمن
        localStorage.removeItem('admin_token')
        window.dispatchEvent(new Event('adminLogout'))
        toast.success('تم تسجيل الدخول بنجاح')
        router.push('/account')
        router.refresh()
      } else {
        triggerShake()
        toast.error(data.error || 'فشل تسجيل الدخول')
      }
    } catch {
      triggerShake()
      toast.error('حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden bg-muted/20 px-4 py-12">
        <div
          className="login-orb right-[-4rem] top-16 h-48 w-48 bg-primary/20"
          aria-hidden
        />
        <div
          className="login-orb login-orb-delay bottom-10 left-[-3rem] h-56 w-56 bg-accent/30"
          aria-hidden
        />

        <Card
          className={cn(
            'relative z-10 w-full max-w-md animate-login-card gap-0 py-0 shadow-lg',
            shake && 'animate-login-shake'
          )}
        >
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-3 text-center animate-fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">أهلاً بعودتك</h1>
                <p className="text-sm text-muted-foreground">
                  سجّلي دخولك لمتابعة طلباتك ومفضلتك
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
              <div className="space-y-2">
                <label htmlFor="customer-email" className="block text-sm font-medium">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="h-11 pr-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="customer-password" className="block text-sm font-medium">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="h-11 pr-10 pl-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 left-3 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="login-submit-btn h-11 w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  )
}
