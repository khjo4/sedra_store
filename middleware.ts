import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, verifyToken } from '@/lib/auth-jwt';

const cacheConfig: Record<string, string> = {
  '/api/categories': 'public, s-maxage=3600, stale-while-revalidate=86400',
  '/api/products': 'public, s-maxage=600, stale-while-revalidate=3600',
  '/image/': 'public, max-age=31536000, immutable',
  '/_next/static/': 'public, max-age=31536000, immutable',
};

function applyCache(response: NextResponse, pathname: string): NextResponse {
  for (const [path, cacheHeader] of Object.entries(cacheConfig)) {
    if (pathname.startsWith(path)) {
      response.headers.set('Cache-Control', cacheHeader);
      break;
    }
  }
  return response;
}

function unauthorized(pathname: string, request: NextRequest, loginPath: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'غير مصرح به. الرجاء تسجيل الدخول' },
      { status: 401 }
    );
  }
  return NextResponse.redirect(new URL(loginPath, request.url));
}

async function requireAdmin(request: NextRequest, pathname: string) {
  const token = request.cookies.get('admin_token')?.value;
  const admin = token ? await verifyAdminToken(token) : null;
  if (!admin) {
    return unauthorized(pathname, request, '/admin/login');
  }
  return null;
}

async function requireCustomer(request: NextRequest, pathname: string) {
  const token = request.cookies.get('customer_token')?.value;
  const customer = token ? await verifyToken(token) : null;
  if (!customer) {
    return unauthorized(pathname, request, '/login');
  }
  return null;
}

function isPublicAuthPath(pathname: string) {
  return (
    pathname === '/api/admin/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/admin/logout'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // صفحة دخول الأدمن عامة — إن وُجدت جلسة أدمن صالحة وجّه للوحة
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    const token = request.cookies.get('admin_token')?.value;
    const admin = token ? await verifyAdminToken(token) : null;
    if (admin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (isPublicAuthPath(pathname)) {
    return NextResponse.next();
  }

  // حساب العميل فقط — المفضلة تعمل محلياً للزائر أيضاً
  if (
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    pathname === '/api/auth/me'
  ) {
    const denied = await requireCustomer(request, pathname);
    if (denied) return denied;
    return applyCache(NextResponse.next(), pathname);
  }

  // المفضلة: مسموحة للجميع على مستوى الـ middleware (الـ route يتحقق من الجلسة عند الحاجة)
  if (pathname === '/api/wishlist' || pathname.startsWith('/api/wishlist/')) {
    return NextResponse.next();
  }

  if (pathname === '/api/orders' && method === 'POST') {
    return NextResponse.next();
  }

  if (
    pathname === '/api/coupons' &&
    method === 'GET' &&
    request.nextUrl.searchParams.has('code')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/api/cart' || pathname.startsWith('/api/cart/')) {
    return NextResponse.next();
  }

  if (
    method === 'GET' &&
    (pathname.startsWith('/api/products') ||
      pathname.startsWith('/api/categories') ||
      pathname === '/api/settings')
  ) {
    // لا تخزّن مؤقتاً طلبات المنتجات بمعرفات محددة (سلة/مفضلة)
    if (
      pathname.startsWith('/api/products') &&
      request.nextUrl.searchParams.has('ids')
    ) {
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'private, no-store, max-age=0')
      return response
    }
    return applyCache(NextResponse.next(), pathname);
  }

  // لوحة التحكم وواجهات الإدارة — JWT أدمن فقط
  const needsAdmin =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/customers') ||
    pathname.startsWith('/api/coupons') ||
    pathname.startsWith('/api/orders') ||
    pathname === '/api/settings' ||
    pathname.startsWith('/api/settings/') ||
    (pathname.startsWith('/api/products') && method !== 'GET') ||
    (pathname.startsWith('/api/categories') && method !== 'GET');

  if (needsAdmin) {
    const denied = await requireAdmin(request, pathname);
    if (denied) return denied;
  }

  return applyCache(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/:path*',
    '/account',
    '/account/:path*',
  ],
};
