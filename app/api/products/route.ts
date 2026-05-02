import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM products ORDER BY created_at DESC');
    
    const products = (rows as any[]).map(product => ({
      ...product,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : undefined,
    }));
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المنتجات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📦 Creating product:', body);
    
    const connection = await getConnection();
    
    const { 
      id, name, nameEn, description, descriptionEn, price, originalPrice, 
      category, stock, featured, bestSeller, newArrival, 
      rating, reviewCount, images, colors, sizes 
    } = body;
    
    // ✅ تحويل undefined إلى null لكل القيم
    const productId = id || `p${Date.now()}`;
    const productName = name || 'منتج جديد';
    const productNameEn = nameEn !== undefined ? nameEn : null;
    const productDescription = description !== undefined ? description : null;
    const productDescriptionEn = descriptionEn !== undefined ? descriptionEn : null;
    const productPrice = price !== undefined && price !== null ? parseFloat(price) : 0;
    const productOriginalPrice = originalPrice !== undefined && originalPrice !== null && originalPrice !== '' ? parseFloat(originalPrice) : null;
    const productCategory = category || 'uncategorized';
    const productStock = stock !== undefined && stock !== null ? parseInt(stock) : 0;
    const productFeatured = featured ? 1 : 0;
    const productBestSeller = bestSeller ? 1 : 0;
    const productNewArrival = newArrival ? 1 : 0;
    const productRating = rating || 0;
    const productReviewCount = reviewCount || 0;
    
    // تحويل المصفوفات إلى JSON
    const imagesJson = images && Array.isArray(images) ? JSON.stringify(images) : JSON.stringify([]);
    const colorsJson = colors && Array.isArray(colors) ? JSON.stringify(colors) : JSON.stringify([]);
    const sizesJson = sizes && Array.isArray(sizes) ? JSON.stringify(sizes) : JSON.stringify([]);
    
    await connection.execute(
      `INSERT INTO products 
        (id, name, name_en, description, description_en, price, original_price, 
         category, stock, featured, best_seller, new_arrival, rating, review_count, images, colors, sizes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId, productName, productNameEn, productDescription, productDescriptionEn,
        productPrice, productOriginalPrice, productCategory, productStock,
        productFeatured, productBestSeller, productNewArrival,
        productRating, productReviewCount, imagesJson, colorsJson, sizesJson
      ]
    );
    
    return NextResponse.json({ success: true, id: productId }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة المنتج' },
      { status: 500 }
    );
  }
}