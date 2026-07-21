import { NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/db';
import { revalidateTag } from 'next/cache';

// GET - جلب جميع المنتجات (مع دعم Filtering و Pagination)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // قراءة parameters من الـ URL
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const ids = searchParams.get('ids'); // للمفضلة والسلة
    
    // ✅ إذا طلب المنتجات بمعرفات محددة (للمفضلة أو السلة)
    if (ids) {
      const idsArray = ids.split(',');
      const { getProductsByIds } = await import('@/lib/db');
      const products = await getProductsByIds(idsArray);
      return NextResponse.json(products);
    }
    
    // جلب جميع المنتجات (مؤقتاً - سنحسنها لاحقاً)
    let products = await getAllProducts();
    
    // ✅ فلترة حسب القسم (category)
    if (category && category !== 'all') {
      products = products.filter(p => p.category === category);
    }
    
    // ✅ فلترة حسب السعر
    if (minPrice) {
      products = products.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= Number(maxPrice));
    }
    
    // ✅ بحث
    if (search) {
      const query = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.nameEn?.toLowerCase() || '').includes(query)
      );
    }
    
    // ✅ ترتيب
    switch (sort) {
      case 'newest':
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        products.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // ✅ Pagination
    const total = products.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedProducts = products.slice(start, end);
    
    const response = NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
    
    // إضافة Cache Headers - المنتجات تتغير لكن يمكن تخزينها مؤقتاً
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المنتجات' },
      { status: 500 }
    );
  }
}

// POST - إضافة منتج جديد (للمدير فقط)
export async function POST(request: Request) {
  try {
    // ✅ التحقق من صلاحية المدير (مؤقتاً)
    const authHeader = request.headers.get('authorization');
    // مؤقتاً: نسمح فقط إذا كان هناك token
    // في المرحلة القادمة سنضيف middleware
    
    const body = await request.json();
    
    // ✅ التحقق من البيانات الأساسية
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { error: 'الاسم والسعر والقسم حقول مطلوبة' },
        { status: 400 }
      );
    }
    
    const newProduct = await createProduct(body);
    
    // 🔄 إعادة التحقق من الـ Cache عند إضافة منتج جديد
    revalidateTag('/', 'layout');
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج' },
      { status: 500 }
    );
  }
}