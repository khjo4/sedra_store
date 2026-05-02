'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // مؤقتاً - استخدم بيانات صلبة
    if (email === 'admin@sedra.com' && password === 'admin123') {
      localStorage.setItem('admin_token', 'logged_in')
      toast.success('تم تسجيل الدخول بنجاح')
      router.push('/admin')
    } else {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">تسجيل دخول المشرف</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sedra.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                كلمة المرور
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>للاختبار: admin@sedra.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}