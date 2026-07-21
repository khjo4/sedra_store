import { NextRequest, NextResponse } from 'next/server';

// ✅ المسارات التي تحتاج إلى حماية (للمدير فقط)
const adminPaths = [
  '/admin',
  '/api/admin',
  '/api/customers',
  '/api/coupons',
  '/api/settings',
  '/api/orders',        // GET فقط محمي، POST عام
];

// ✅ المسارات العامة (لا تحتاج حماية)
const publicPaths = [
  '/api/products',
  '/api/categories',
  '/api/cart',
  '/api/wishlist',
  '/admin/login',
  '/api/settings',
  '/api/admin/login',
];

// ✅ مسارات العملاء المحمية
const customerProtectedPaths = [
  '/account',
  '/api/auth/me',
];

// 🔄 Cache configuration
const cacheConfig = {
  '/api/categories': 'public, s-maxage=3600, stale-while-revalidate=86400',
  '/api/products': 'public, s-maxage=600, stale-while-revalidate=3600',
  '/image/': 'public, max-age=31536000, immutable',
  '/_next/static/': 'public, max-age=31536000, immutable',
};

// ✅ التحقق من صحة التوكن
function isValidAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token === 'logged_in' || token.startsWith('Bearer ');
}

// 🔄 دالة لتطبيق Cache Headers
function applyCache(response: NextResponse, pathname: string): NextResponse {
  for (const [path, cacheHeader] of Object.entries(cacheConfig)) {
    if (pathname.startsWith(path)) {
      response.headers.set('Cache-Control', cacheHeader);
      break;
    }
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // ✅ السماح لصفحة تسجيل الدخول
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }
  
  // ✅ معالجة خاصة لـ /api/orders
  if (pathname === '/api/orders') {
    if (method === 'POST') {
      return NextResponse.next();
    }
    if (method === 'GET') {
      const token = request.cookies.get('admin_token')?.value || 
                    request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!isValidAdminToken(token)) {
        return NextResponse.json(
          { error: 'غير مصرح به. الرجاء تسجيل الدخول' },
          { status: 401 }
        );
      }
    }
  }
  
  // ✅ 1. التحقق من مسارات العملاء المحمية (قبل كل شيء)
  const isCustomerProtectedPath = customerProtectedPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (isCustomerProtectedPath) {
    const customerToken = request.cookies.get('customer_token')?.value;
    
    if (!customerToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'غير مصرح به. الرجاء تسجيل الدخول' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // ✅ إذا كان العميل مسجلاً دخول، نسمح بالمرور
    const response = NextResponse.next();
    return applyCache(response, pathname);
  }
  
  // ✅ 2. التحقق من المسارات العامة
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublicPath) {
    const response = NextResponse.next();
    return applyCache(response, pathname);
  }
  
  // ✅ 3. التحقق من مسارات المدير المحمية
  const isAdminPath = adminPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  
  if (isAdminPath) {
    const token = request.cookies.get('admin_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!isValidAdminToken(token)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'غير مصرح به. الرجاء تسجيل الدخول' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  const response = NextResponse.next();
  return applyCache(response, pathname);
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*', '/account', '/login', '/register'],
};