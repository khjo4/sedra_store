import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

let pool: mysql.Pool | null = null;

// إنشاء مجموعة اتصالات (Pool)
export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sedra_store',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// دالة مساعدة لتنفيذ الاستعلامات
export async function query(sql: string, params: any[] = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ================================================
// دوال مساعدة لتحويل البيانات (snake_case → camelCase)
// ================================================

function parseJSONSafe(jsonStr: string | null, defaultValue: any = []) {
  if (!jsonStr) return defaultValue;
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function toBoolean(value: any): boolean {
  return value === 1 || value === true;
}

// ================================================
// المنتجات (Products)
// ================================================

export async function getAllProducts() {
  const rows = await query('SELECT * FROM products ORDER BY created_at DESC');
  
  return (rows as any[]).map(product => ({
    id: product.id,
    name: product.name,
    nameEn: product.name_en,
    description: product.description,
    descriptionEn: product.description_en,
    price: Number(product.price),
    originalPrice: product.original_price ? Number(product.original_price) : null,
    category: product.category,
    stock: Number(product.stock),
    featured: toBoolean(product.featured),
    bestSeller: toBoolean(product.best_seller),
    newArrival: toBoolean(product.new_arrival),
    rating: Number(product.rating),
    reviewCount: Number(product.review_count),
    images: parseJSONSafe(product.images, []),
    colors: parseJSONSafe(product.colors, []),
    sizes: parseJSONSafe(product.sizes, []),
    createdAt: product.created_at,
  }));
}

export async function getProductById(id: string) {
  const rows = await query('SELECT * FROM products WHERE id = ?', [id]);
  const product = (rows as any[])[0];
  if (!product) return null;
  
  return {
    id: product.id,
    name: product.name,
    nameEn: product.name_en,
    description: product.description,
    descriptionEn: product.description_en,
    price: Number(product.price),
    originalPrice: product.original_price ? Number(product.original_price) : null,
    category: product.category,
    stock: Number(product.stock),
    featured: toBoolean(product.featured),
    bestSeller: toBoolean(product.best_seller),
    newArrival: toBoolean(product.new_arrival),
    rating: Number(product.rating),
    reviewCount: Number(product.review_count),
    images: parseJSONSafe(product.images, []),
    colors: parseJSONSafe(product.colors, []),
    sizes: parseJSONSafe(product.sizes, []),
    createdAt: product.created_at,
  };
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = await query(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
  return (rows as any[]).map(product => ({
    id: product.id,
    name: product.name,
    nameEn: product.name_en,
    description: product.description,
    descriptionEn: product.description_en,
    price: Number(product.price),
    originalPrice: product.original_price ? Number(product.original_price) : null,
    category: product.category,
    stock: Number(product.stock),
    featured: toBoolean(product.featured),
    bestSeller: toBoolean(product.best_seller),
    newArrival: toBoolean(product.new_arrival),
    rating: Number(product.rating),
    reviewCount: Number(product.review_count),
    images: parseJSONSafe(product.images, []),
    colors: parseJSONSafe(product.colors, []),
    sizes: parseJSONSafe(product.sizes, []),
    createdAt: product.created_at,
  }));
}

export async function createProduct(productData: any) {
  const id = productData.id || randomUUID();
  
  await query(
    `INSERT INTO products 
      (id, name, name_en, description, description_en, price, original_price, 
       category, stock, featured, best_seller, new_arrival, 
       rating, review_count, images, colors, sizes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      productData.name,
      productData.nameEn || '',
      productData.description || '',
      productData.descriptionEn || '',
      productData.price,
      productData.originalPrice || null,
      productData.category,
      productData.stock || 0,
      productData.featured ? 1 : 0,
      productData.bestSeller ? 1 : 0,
      productData.newArrival ? 1 : 0,
      productData.rating || 0,
      productData.reviewCount || 0,
      JSON.stringify(productData.images || []),
      JSON.stringify(productData.colors || []),
      JSON.stringify(productData.sizes || [])
    ]
  );
  
  // ✅ تحديث عدد المنتجات في القسم
  await updateCategoryProductCount(productData.category);
  
  return { id, ...productData };
}

// تحديث عدد المنتجات في القسم
async function updateCategoryProductCount(category: string) {
  // حساب عدد المنتجات في هذا القسم
  const result = await query(
    'SELECT COUNT(*) as count FROM products WHERE category = ?',
    [category]
  );
  const count = (result as any[])[0]?.count || 0;
  
  // تحديث جدول categories
  await query(
    'UPDATE categories SET product_count = ? WHERE slug = ?',
    [count, category]
  );
}

export async function updateProduct(id: string, productData: any) {
  // ✅ جلب القسم القديم
  const oldProduct = await getProductById(id);
  const oldCategory = oldProduct?.category;
  
  await query(
    `UPDATE products SET 
      name = ?, name_en = ?, description = ?, description_en = ?, 
      price = ?, original_price = ?, category = ?, stock = ?,
      featured = ?, best_seller = ?, new_arrival = ?,
      images = ?, colors = ?, sizes = ?
     WHERE id = ?`,
    [
      productData.name,
      productData.nameEn || '',
      productData.description || '',
      productData.descriptionEn || '',
      productData.price,
      productData.originalPrice || null,
      productData.category,
      productData.stock || 0,
      productData.featured ? 1 : 0,
      productData.bestSeller ? 1 : 0,
      productData.newArrival ? 1 : 0,
      JSON.stringify(productData.images || []),
      JSON.stringify(productData.colors || []),
      JSON.stringify(productData.sizes || []),
      id
    ]
  );
  
  // ✅ تحديث عدد المنتجات للقسم القديم (إذا تغير)
  if (oldCategory && oldCategory !== productData.category) {
    await updateCategoryProductCount(oldCategory);
  }
  
  // ✅ تحديث عدد المنتجات للقسم الجديد
  await updateCategoryProductCount(productData.category);
  
  return { id, ...productData };
}

export async function deleteProduct(id: string) {
  // ✅ جلب القسم قبل الحذف
  const product = await getProductById(id);
  const category = product?.category;
  
  await query('DELETE FROM products WHERE id = ?', [id]);
  
  // ✅ تحديث عدد المنتجات في القسم
  if (category) {
    await updateCategoryProductCount(category);
  }
}

// ================================================
// الطلبات (Orders)
// ================================================

export async function getAllOrders() {
  const rows = await query('SELECT * FROM orders ORDER BY created_at DESC');
  
  return (rows as any[]).map(order => ({
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    address: order.address,
    city: order.city,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method,
    couponCode: order.coupon_code,
    notes: order.notes,
    items: parseJSONSafe(order.items, []),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  }));
}

export async function getOrderById(id: string) {
  const rows = await query('SELECT * FROM orders WHERE id = ?', [id]);
  const order = (rows as any[])[0];
  if (!order) return null;
  
  return {
    id: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    address: order.address,
    city: order.city,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method,
    couponCode: order.coupon_code,
    notes: order.notes,
    items: parseJSONSafe(order.items, []),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export async function createOrder(orderData: any) {
  const id = orderData.id || `ORD-${randomUUID().slice(0, 8)}`;
  
  await query(
    `INSERT INTO orders 
      (id, customer_name, customer_email, customer_phone, address, city, 
       subtotal, discount, shipping, total, status, payment_method, 
       coupon_code, notes, items)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      orderData.customerName,
      orderData.customerEmail || null,
      orderData.customerPhone,
      orderData.address,
      orderData.city,
      orderData.subtotal || 0,
      orderData.discount || 0,
      orderData.shipping || 0,
      orderData.total || 0,
      orderData.status || 'pending',
      orderData.paymentMethod || 'cod',
      orderData.couponCode || null,
      orderData.notes || null,
      JSON.stringify(orderData.items || [])
    ]
  );
  
  return { id, ...orderData };
}

export async function updateOrderStatus(id: string, status: string) {
  await query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
}

// ================================================
// الكوبونات (Coupons)
// ================================================

export async function getAllCoupons() {
  const rows = await query('SELECT * FROM coupons ORDER BY created_at DESC');
  
  return (rows as any[]).map(coupon => ({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minPurchase: Number(coupon.min_purchase),
    maxUses: Number(coupon.max_uses),
    usedCount: Number(coupon.used_count),
    active: toBoolean(coupon.active),
    expiresAt: coupon.expires_at,
    createdAt: coupon.created_at,
  }));
}

export async function getCouponByCode(code: string) {
  const rows = await query('SELECT * FROM coupons WHERE code = ?', [code.toUpperCase()]);
  const coupon = (rows as any[])[0];
  if (!coupon) return null;
  
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minPurchase: Number(coupon.min_purchase),
    maxUses: Number(coupon.max_uses),
    usedCount: Number(coupon.used_count),
    active: toBoolean(coupon.active),
    expiresAt: coupon.expires_at,
    createdAt: coupon.created_at,
  };
}

export async function getCouponById(id: string) {
  const rows = await query('SELECT * FROM coupons WHERE id = ?', [id]);
  const coupon = (rows as any[])[0];
  if (!coupon) return null;
  
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minPurchase: Number(coupon.min_purchase),
    maxUses: Number(coupon.max_uses),
    usedCount: Number(coupon.used_count),
    active: toBoolean(coupon.active),
    expiresAt: coupon.expires_at,
    createdAt: coupon.created_at,
  };
}

export async function createCoupon(couponData: any) {
  const id = couponData.id || `CPN-${randomUUID().slice(0, 8)}`;
  
  await query(
    `INSERT INTO coupons 
      (id, code, type, value, min_purchase, max_uses, used_count, active, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      couponData.code.toUpperCase(),
      couponData.type,
      couponData.value,
      couponData.minPurchase || 0,
      couponData.maxUses || 100,
      couponData.usedCount || 0,
      couponData.active ? 1 : 0,
      couponData.expiresAt || null
    ]
  );
  
  return { id, ...couponData };
}

export async function updateCoupon(id: string, couponData: any) {
  await query(
    `UPDATE coupons SET 
      code = ?, type = ?, value = ?, min_purchase = ?, 
      max_uses = ?, active = ?, expires_at = ?
     WHERE id = ?`,
    [
      couponData.code.toUpperCase(),
      couponData.type,
      couponData.value,
      couponData.minPurchase || 0,
      couponData.maxUses || 100,
      couponData.active ? 1 : 0,
      couponData.expiresAt || null,
      id
    ]
  );
}

export async function deleteCoupon(id: string) {
  await query('DELETE FROM coupons WHERE id = ?', [id]);
}

export async function incrementCouponUsage(code: string) {
  await query('UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND active = 1', [code]);
}

// ================================================
// العملاء (Customers)
// ================================================

export async function getAllCustomers() {
  const rows = await query('SELECT * FROM customers ORDER BY created_at DESC');
  
  return (rows as any[]).map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    ordersCount: Number(customer.orders_count),
    totalSpent: Number(customer.total_spent),
    createdAt: customer.created_at,
  }));
}

export async function getCustomerByEmail(email: string) {
  const rows = await query('SELECT * FROM customers WHERE email = ?', [email]);
  const customer = (rows as any[])[0];
  if (!customer) return null;
  
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    ordersCount: Number(customer.orders_count),
    totalSpent: Number(customer.total_spent),
    createdAt: customer.created_at,
  };
}

export async function createOrUpdateCustomer(customerData: any) {
  const email = customerData.email?.trim();
  const phone = customerData.phone?.trim();
  
  // ✅ إذا ما في إيميل ولا هاتف، نخرج
  if (!email && !phone) {
    console.log('⚠️ No email or phone provided');
    return null;
  }
  
  let existing = null;
  
  // ✅ البحث بالإيميل
  if (email) {
    existing = await getCustomerByEmail(email);
  }
  
  // ✅ إذا ما لقينا، جرب بالهاتف
  if (!existing && phone) {
    const rows = await query('SELECT * FROM customers WHERE phone = ?', [phone]);
    existing = (rows as any[])[0] || null;
  }
  
  if (existing) {
    // ✅ زيادة orders_count و total_spent
    const newOrdersCount = existing.orders_count + 1;
    const newTotalSpent = (existing.total_spent || 0) + (customerData.totalSpent || 0);
    
    await query(
      `UPDATE customers 
       SET orders_count = ?, total_spent = ? 
       WHERE id = ?`,
      [newOrdersCount, newTotalSpent, existing.id]
    );
    
    console.log(`✅ Customer ${existing.id} updated: orders=${newOrdersCount}, spent=${newTotalSpent}`);
    return existing;
  } else {
    // ✅ إنشاء عميل جديد
    const id = `CUST-${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO customers 
        (id, name, email, phone, address, city, orders_count, total_spent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        customerData.name,
        email || null,
        phone || null,
        customerData.address || null,
        customerData.city || null,
        1,
        customerData.totalSpent || 0
      ]
    );
    console.log(`✅ New customer created: ${id}`);
    return { id, ...customerData };
  }
}

// ================================================
// الإعدادات (Settings)
// ================================================

export async function getSettings() {
  const rows = await query('SELECT * FROM settings WHERE id = 1');
  const settings = (rows as any[])[0];
  if (!settings) return null;
  
  return {
    id: settings.id,
    storeName: settings.store_name,
    storeNameEn: settings.store_name_en,
    currency: settings.currency,
    exchangeRate: Number(settings.exchange_rate),
    freeShippingThreshold: Number(settings.free_shipping_threshold),
    shippingCost: Number(settings.shipping_cost),
    contactEmail: settings.contact_email,
    contactPhone: settings.contact_phone,
    whatsappNumber: settings.whatsapp_number,
    instagramUrl: settings.instagram_url,
    facebookUrl: settings.facebook_url,
    whatsappUrl: settings.whatsapp_url,
    heroTitle: settings.hero_title,
    heroSubtitle: settings.hero_subtitle,
    announcement: settings.announcement,
    announcementActive: toBoolean(settings.announcement_active),
    updatedAt: settings.updated_at,
  };
}

export async function updateSettings(settingsData: any) {
  await query(
    `UPDATE settings SET 
      store_name = ?, store_name_en = ?, currency = ?, exchange_rate = ?,
      free_shipping_threshold = ?, shipping_cost = ?, contact_email = ?,
      contact_phone = ?, whatsapp_number = ?, instagram_url = ?,
      facebook_url = ?, whatsapp_url = ?, hero_title = ?,
      hero_subtitle = ?, announcement = ?, announcement_active = ?
     WHERE id = 1`,
    [
      settingsData.storeName,
      settingsData.storeNameEn,
      settingsData.currency,
      settingsData.exchangeRate,
      settingsData.freeShippingThreshold,
      settingsData.shippingCost,
      settingsData.contactEmail,
      settingsData.contactPhone,
      settingsData.whatsappNumber || null,
      settingsData.instagramUrl || null,
      settingsData.facebookUrl || null,
      settingsData.whatsappUrl || null,
      settingsData.heroTitle,
      settingsData.heroSubtitle,
      settingsData.announcement || null,
      settingsData.announcementActive ? 1 : 0
    ]
  );
}

// ================================================
// الأقسام (Categories)
// ================================================

export async function getAllCategories() {
  const rows = await query('SELECT * FROM categories ORDER BY id');
  
  return (rows as any[]).map(category => ({
    id: category.id,
    name: category.name,
    nameEn: category.name_en,
    slug: category.slug,
    image: category.image,
    productCount: Number(category.product_count),
  }));
}

// ================================================
// السلة (Cart)
// ================================================

export async function getCart(sessionId: string) {
  const rows = await query(
    `SELECT c.*, p.name, p.price, p.images 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.session_id = ?`,
    [sessionId]
  );
  
  return (rows as any[]).map(item => ({
    id: item.id,
    sessionId: item.session_id,
    productId: item.product_id,
    quantity: Number(item.quantity),
    selectedColor: item.selected_color,
    selectedSize: item.selected_size,
    addedAt: item.added_at,
    product: {
      name: item.name,
      price: Number(item.price),
      images: parseJSONSafe(item.images, []),
    }
  }));
}

export async function addToCart(item: any) {
  const existing = await query(
    `SELECT * FROM cart WHERE session_id = ? AND product_id = ? 
     AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
     AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))`,
    [item.sessionId, item.productId, item.selectedColor || null, item.selectedColor || null, item.selectedSize || null, item.selectedSize || null]
  );
  
  if ((existing as any[]).length > 0) {
    await query(
      `UPDATE cart SET quantity = quantity + ? 
       WHERE session_id = ? AND product_id = ? 
       AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
       AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))`,
      [item.quantity || 1, item.sessionId, item.productId, item.selectedColor || null, item.selectedColor || null, item.selectedSize || null, item.selectedSize || null]
    );
  } else {
    const id = `CART-${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO cart (id, session_id, product_id, quantity, selected_color, selected_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, item.sessionId, item.productId, item.quantity || 1, item.selectedColor || null, item.selectedSize || null]
    );
  }
}

export async function updateCartItem(item: any) {
  if (item.quantity <= 0) {
    await query(
      `DELETE FROM cart WHERE session_id = ? AND product_id = ? 
       AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
       AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))`,
      [item.sessionId, item.productId, item.selectedColor || null, item.selectedColor || null, item.selectedSize || null, item.selectedSize || null]
    );
  } else {
    await query(
      `UPDATE cart SET quantity = ? 
       WHERE session_id = ? AND product_id = ? 
       AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
       AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))`,
      [item.quantity, item.sessionId, item.productId, item.selectedColor || null, item.selectedColor || null, item.selectedSize || null, item.selectedSize || null]
    );
  }
}

export async function clearCart(sessionId: string) {
  await query('DELETE FROM cart WHERE session_id = ?', [sessionId]);
}

// ================================================
// المفضلة (Wishlist)
// ================================================

export async function getWishlist(customerEmail: string) {
  const rows = await query(
    `SELECT w.*, p.name, p.price, p.images 
     FROM wishlist w 
     JOIN products p ON w.product_id = p.id 
     WHERE w.customer_email = ?`,
    [customerEmail]
  );
  
  return (rows as any[]).map(item => ({
    id: item.id,
    customerEmail: item.customer_email,
    productId: item.product_id,
    addedAt: item.added_at,
    product: {
      name: item.name,
      price: Number(item.price),
      images: parseJSONSafe(item.images, []),
    }
  }));
}

export async function addToWishlist(customerEmail: string, productId: string) {
  const existing = await query(
    'SELECT * FROM wishlist WHERE customer_email = ? AND product_id = ?',
    [customerEmail, productId]
  );
  
  if ((existing as any[]).length === 0) {
    const id = `WISH-${randomUUID().slice(0, 8)}`;
    await query(
      'INSERT INTO wishlist (id, customer_email, product_id) VALUES (?, ?, ?)',
      [id, customerEmail, productId]
    );
  }
}

export async function removeFromWishlist(customerEmail: string, productId: string) {
  await query(
    'DELETE FROM wishlist WHERE customer_email = ? AND product_id = ?',
    [customerEmail, productId]
  );
}

// ================================================
// دالة اختبار الاتصال
// ================================================

export async function testConnection() {
  try {
    const result = await query('SELECT 1 as connected');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// ================================================
// مصادقة العملاء (Customer Authentication)
// ================================================
import bcrypt from 'bcryptjs';

// إنشاء حساب جديد مع تشفير كلمة المرور
export async function registerCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  // التحقق من عدم وجود البريد الإلكتروني مسبقاً
  const existing = await getCustomerByEmail(data.email);
  if (existing) {
    throw new Error('البريد الإلكتروني مستخدم بالفعل');
  }

  // تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = `CUST-${randomUUID().slice(0, 8)}`;

  await query(
    `INSERT INTO customers (id, name, email, phone, password)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.name, data.email.toLowerCase(), data.phone || null, hashedPassword]
  );

  return {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
  };
}

// تسجيل دخول العميل (التحقق من البريد الإلكتروني وكلمة المرور)
export async function loginCustomer(email: string, password: string) {
  const customer = await getCustomerByEmail(email.toLowerCase());
  
  if (!customer) {
    return null;
  }

  // جلب كلمة المرور المشفرة من قاعدة البيانات
  const rows = await query('SELECT password FROM customers WHERE email = ?', [email.toLowerCase()]);
  const hashedPassword = (rows as any[])[0]?.password;
  
  if (!hashedPassword) {
    return null;
  }

  const isValid = await bcrypt.compare(password, hashedPassword);
  if (!isValid) {
    return null;
  }

  return customer;
}

// تحديث كلمة مرور العميل (لحالة نسيت كلمة المرور)
export async function updateCustomerPassword(email: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await query(
    'UPDATE customers SET password = ? WHERE email = ?',
    [hashedPassword, email.toLowerCase()]
  );
}

export async function getCustomerById(id: string) {
  const rows = await query('SELECT * FROM customers WHERE id = ?', [id]);
  const customer = (rows as any[])[0];
  if (!customer) return null;
  
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    ordersCount: Number(customer.orders_count),
    totalSpent: Number(customer.total_spent),
    createdAt: customer.created_at,
  };
}

// ================================================
// المديرين (Admins)
// ================================================
export async function getAdminByEmail(email: string) {
  const rows = await query('SELECT * FROM admins WHERE email = ?', [email.toLowerCase()]);
  return (rows as any[])[0] || null;
}

export async function verifyAdmin(email: string, password: string) {
  const admin = await getAdminByEmail(email);
  if (!admin) return null;
  
  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) return null;
  
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
  };
}

export async function createAdmin(data: { name: string; email: string; password: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = `ADMIN-${randomUUID().slice(0, 8)}`;
  
  await query(
    'INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)',
    [id, data.name, data.email.toLowerCase(), hashedPassword]
  );
  
  return { id, name: data.name, email: data.email };
}