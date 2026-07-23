'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminLoginPage() {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('admin_token', '1')
        window.dispatchEvent(new Event('adminLogin'))
        toast.success('تم تسجيل الدخول بنجاح')
        router.push('/admin')
        router.refresh()
      } else {
        triggerShake()
        toast.error(data.error || 'بيانات الدخول غير صحيحة')
      }
    } catch (error) {
      console.error('Login error:', error)
      triggerShake()
      toast.error('حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary/40 p-4">
      <div
        className="login-orb right-[-5rem] top-24 h-64 w-64 bg-primary/15"
        aria-hidden
      />
      <div
        className="login-orb login-orb-delay bottom-20 left-[-4rem] h-72 w-72 bg-accent/25"
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
              <p className="text-sm text-muted-foreground">
                تسجيل دخول المشرف لإدارة المتجر
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 animate-slide-up">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="block text-sm font-medium">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ادخل البريد"
                  className="h-11 pr-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm font-medium">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
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
                'دخول لوحة التحكم'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
