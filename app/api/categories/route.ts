import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/db';
import { query } from '@/lib/db';

// ✅ GET - جلب جميع الأقسام
export async function GET() {
  try {
    const categories = await getAllCategories();
    
    // إضافة Cache Headers - الأقسام تتغير نادراً
    const response = NextResponse.json(categories);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب الأقسام' },
      { status: 500 }
    );
  }
}

// ✅ PUT - تحديث صورة القسم
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slug, image } = body;
    
    if (!slug) {
      return NextResponse.json({ error: 'slug مطلوب' }, { status: 400 });
    }
    
    // تحديث صورة القسم في قاعدة البيانات
    await query(
      'UPDATE categories SET image = ? WHERE slug = ?',
      [image || null, slug]
    );
    
    // جلب الأقسام المحدثة لإرجاعها
    const updatedCategories = await getAllCategories();
    
    return NextResponse.json({ 
      success: true, 
      categories: updatedCategories 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث القسم' },
      { status: 500 }
    );
  }
}