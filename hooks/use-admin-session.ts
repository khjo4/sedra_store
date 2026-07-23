'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * يتحقق من جلسة المدير عبر الكوكي httpOnly (وليس localStorage).
 * العميل المسجّل لن يظهر له رابط لوحة التحكم أبداً بدون JWT أدمن صالح.
 */
export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' })
      if (res.ok) {
        setIsAdmin(true)
        return true
      }
      setIsAdmin(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
      }
      return false
    } catch {
      setIsAdmin(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    const onLogout = () => {
      setIsAdmin(false)
      localStorage.removeItem('admin_token')
    }
    const onLogin = () => {
      refresh()
    }

    window.addEventListener('adminLogout', onLogout)
    window.addEventListener('adminLogin', onLogin)
    return () => {
      window.removeEventListener('adminLogout', onLogout)
      window.removeEventListener('adminLogin', onLogin)
    }
  }, [refresh])

  return { isAdmin, loading, refresh }
}
