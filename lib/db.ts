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
    id: String(product.id),
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
    id: String(product.id),
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
  const cleanIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  if (cleanIds.length === 0) return [];
  const placeholders = cleanIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT * FROM products WHERE id IN (${placeholders})`,
    cleanIds
  );
  return (rows as any[]).map((product) => ({
    id: String(product.id),
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
  // جدول المنتجات يستخدم id رقمي AUTO_INCREMENT — لا نُدرج id نصي مثل p123...
  const result: any = await query(
    `INSERT INTO products 
      (name, name_en, description, description_en, price, original_price, 
       category, stock, featured, best_seller, new_arrival, 
       rating, review_count, images, colors, sizes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      productData.name,
      productData.nameEn || '',
      productData.description || '',
      productData.descriptionEn || '',
      productData.price,
      productData.originalPrice ?? null,
      productData.category,
      productData.stock || 0,
      productData.featured ? 1 : 0,
      productData.bestSeller ? 1 : 0,
      productData.newArrival ? 1 : 0,
      productData.rating || 0,
      productData.reviewCount || 0,
      JSON.stringify(productData.images || []),
      JSON.stringify(productData.colors || []),
      JSON.stringify(productData.sizes || []),
    ]
  );

  const id = String(result.insertId);

  try {
    await updateCategoryProductCount(productData.category);
  } catch (err) {
    console.error('updateCategoryProductCount failed:', err);
  }

  return {
    id,
    ...productData,
  };
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
    id: String(order.id),
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
    id: String(order.id),
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
  const result: any = await query(
    `INSERT INTO orders 
      (customer_name, customer_email, customer_phone, address, city, 
       subtotal, discount, shipping, total, status, payment_method, 
       coupon_code, notes, items)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderData.customerName,
      orderData.customerEmail?.trim() || '',
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
  
  return { id: String(result.insertId), ...orderData };
}

/**
 * Create order with server-side price calculation, stock locks, and coupon increment.
 * Client-supplied prices are ignored.
 */
export async function createOrderSecure(input: {
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  address: string;
  city: string;
  notes?: string | null;
  paymentMethod?: string;
  couponCode?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    selectedColor?: string | null;
    selectedSize?: string | null;
  }>;
}) {
  if (!input.items?.length) {
    throw new Error('الطلب يجب أن يحتوي على منتجات');
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        throw new Error('كمية غير صالحة');
      }

      const [rows] = await conn.execute(
        'SELECT id, name, price, stock, images FROM products WHERE id = ? FOR UPDATE',
        [item.productId]
      );
      const product = (rows as any[])[0];
      if (!product) {
        throw new Error(`المنتج غير موجود: ${item.productId}`);
      }
      if (Number(product.stock) < qty) {
        throw new Error(
          `المنتج ${product.name} غير متوفر بالكمية المطلوبة. المتوفر: ${product.stock}`
        );
      }

      const unitPrice = Number(product.price);
      subtotal += unitPrice * qty;

      const [updateResult] = await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [qty, item.productId, qty]
      );
      if ((updateResult as any).affectedRows !== 1) {
        throw new Error(`فشل تحديث مخزون المنتج: ${product.name}`);
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: qty,
        price: unitPrice,
        selectedColor: item.selectedColor || null,
        selectedSize: item.selectedSize || null,
        images: parseJSONSafe(product.images, []),
      });
    }

    let discount = 0;
    let couponCode: string | null = null;

    if (input.couponCode) {
      const [couponRows] = await conn.execute(
        'SELECT * FROM coupons WHERE UPPER(code) = ? FOR UPDATE',
        [input.couponCode.toUpperCase().trim()]
      );
      const coupon = (couponRows as any[])[0];
      const isActive =
        coupon &&
        (coupon.active === 1 ||
          coupon.active === true ||
          coupon.active === '1');
      if (!coupon || !isActive) {
        throw new Error('كود الخصم غير صالح');
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('كود الخصم منتهي الصلاحية');
      }
      const maxUses = Number(coupon.max_uses) || 0;
      const usedCount = Number(coupon.used_count) || 0;
      // max_uses = 0 يعني غير محدود
      if (maxUses > 0 && usedCount >= maxUses) {
        throw new Error('تم استخدام كود الخصم بالكامل');
      }
      if (subtotal < Number(coupon.min_purchase || 0)) {
        throw new Error(`الحد الأدنى للشراء ${coupon.min_purchase}`);
      }

      if (coupon.type === 'percentage') {
        discount = (subtotal * Number(coupon.value)) / 100;
      } else {
        discount = Number(coupon.value);
      }
      discount = Math.min(discount, subtotal);
      couponCode = String(coupon.code).toUpperCase();

      const [usageResult] = await conn.execute(
        'UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE id = ?',
        [coupon.id]
      );
      if ((usageResult as any).affectedRows !== 1) {
        throw new Error('فشل تحديث عدد استخدامات الكوبون');
      }
    }

    const [settingsRows] = await conn.execute(
      'SELECT free_shipping_threshold FROM settings WHERE id = 1'
    );
    const settings = (settingsRows as any[])[0];
    const freeThreshold = Number(settings?.free_shipping_threshold ?? 0);
    const { calculateShipping } = await import('@/lib/shipping');
    const shipping = calculateShipping({
      city: input.city,
      subtotal,
      discount,
      freeShippingThreshold: freeThreshold,
    });
    const total = Math.max(0, subtotal - discount + shipping);

    // الجدول AUTO_INCREMENT — لا نُدرج id يدوياً
    const [insertResult] = await conn.execute(
      `INSERT INTO orders 
        (customer_name, customer_email, customer_phone, address, city, 
         subtotal, discount, shipping, total, status, payment_method, 
         coupon_code, notes, items)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.customerName,
        input.customerEmail?.trim() || '',
        input.customerPhone,
        input.address,
        input.city,
        subtotal,
        discount,
        shipping,
        total,
        'pending',
        input.paymentMethod || 'cod',
        couponCode,
        input.notes || null,
        JSON.stringify(orderItems),
      ]
    );
    const id = String((insertResult as any).insertId);

    await conn.commit();
    return {
      id,
      subtotal,
      discount,
      shipping,
      total,
      couponCode,
      items: orderItems,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
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
    id: String(coupon.id),
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minPurchase: Number(coupon.min_purchase),
    maxUses: Number(coupon.max_uses),
    usedCount: Number(coupon.used_count) || 0,
    active: toBoolean(coupon.active),
    expiresAt: coupon.expires_at,
    createdAt: coupon.created_at,
  }));
}

export async function getCouponByCode(code: string) {
  const rows = await query('SELECT * FROM coupons WHERE UPPER(code) = ?', [
    code.toUpperCase().trim(),
  ]);
  const coupon = (rows as any[])[0];
  if (!coupon) return null;
  
  return {
    id: String(coupon.id),
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minPurchase: Number(coupon.min_purchase),
    maxUses: Number(coupon.max_uses),
    usedCount: Number(coupon.used_count) || 0,
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
  // جدول الكوبونات غالباً id رقمي AUTO_INCREMENT — لا نُدرج CPN-...
  const expiresAt = normalizeMysqlDateTime(couponData.expiresAt);
  const maxUsesRaw = Number(couponData.maxUses);
  const maxUses =
    Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? maxUsesRaw : 0; // 0 = غير محدود
  const code = String(couponData.code).toUpperCase().trim();
  const active = couponData.active === false || couponData.active === 0 ? 0 : 1;
  const payload = [
    code,
    couponData.type,
    Number(couponData.value),
    Number(couponData.minPurchase) || 0,
    maxUses,
    0,
    active,
    expiresAt,
  ];

  let id = '';
  try {
    const result: any = await query(
      `INSERT INTO coupons 
        (code, type, value, min_purchase, max_uses, used_count, active, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      payload
    );
    id = String(result.insertId);
  } catch (error: any) {
    // إن كان id نصي بدون AUTO_INCREMENT
    const msg = String(error?.sqlMessage || error?.message || '');
    if (!msg.toLowerCase().includes('id') && error?.code !== 'ER_NO_DEFAULT_FOR_FIELD') {
      throw error;
    }
    id = `CPN-${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO coupons 
        (id, code, type, value, min_purchase, max_uses, used_count, active, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ...payload]
    );
  }

  return {
    id,
    code,
    type: couponData.type,
    value: Number(couponData.value),
    minPurchase: Number(couponData.minPurchase) || 0,
    maxUses,
    usedCount: 0,
    active: active === 1,
    expiresAt,
  };
}

function normalizeMysqlDateTime(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  // YYYY-MM-DD HH:MM:SS (UTC) — متوافق مع MySQL DATETIME
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function updateCoupon(id: string, couponData: any) {
  const expiresAt = normalizeMysqlDateTime(couponData.expiresAt);
  const maxUsesRaw = Number(couponData.maxUses);
  const maxUses =
    Number.isFinite(maxUsesRaw) && maxUsesRaw > 0 ? maxUsesRaw : 0;

  await query(
    `UPDATE coupons SET 
      code = ?, type = ?, value = ?, min_purchase = ?, 
      max_uses = ?, active = ?, expires_at = ?
     WHERE id = ?`,
    [
      String(couponData.code).toUpperCase().trim(),
      couponData.type,
      Number(couponData.value),
      Number(couponData.minPurchase) || 0,
      maxUses,
      couponData.active === false || couponData.active === 0 ? 0 : 1,
      expiresAt,
      id,
    ]
  );
}

export async function deleteCoupon(id: string) {
  await query('DELETE FROM coupons WHERE id = ?', [id]);
}

export async function incrementCouponUsage(code: string) {
  await query(
    'UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE UPPER(code) = ? AND active = 1',
    [code.toUpperCase().trim()]
  );
}

// ================================================
// العملاء (Customers)
// ================================================

function mapCustomerRow(customer: any) {
  return {
    id: String(customer.id),
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    ordersCount: Number(customer.orders_count || 0),
    totalSpent: Number(customer.total_spent || 0),
    createdAt: customer.created_at,
  };
}

/** أنشئ سجلات عملاء مفقودة من الطلبات (ضيوف بدون حساب) */
async function ensureGuestCustomersFromOrders() {
  // نظّف البريد/الهاتف الفارغ حتى لا يمنع UNIQUE إضافة ضيوف جدد
  await query(
    `UPDATE customers SET email = NULL WHERE email IS NOT NULL AND TRIM(email) = ''`
  ).catch(() => {});
  await query(
    `UPDATE customers SET phone = NULL WHERE phone IS NOT NULL AND TRIM(phone) = ''`
  ).catch(() => {});

  const { orderBelongsToCustomer, normalizePhone } = await import(
    '@/lib/customer-match'
  );
  const orders = await getAllOrders();
  const rows = (await query('SELECT * FROM customers')) as any[];

  for (const order of orders) {
    const hasMatch = rows.some((c) =>
      orderBelongsToCustomer(
        {
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          city: order.city,
        },
        {
          phone: c.phone,
          email: c.email,
          name: c.name,
          city: c.city,
        }
      )
    );
    if (hasMatch) continue;

    const phone = String(order.customerPhone || '').trim();
    const email = String(order.customerEmail || '').trim();
    if (!normalizePhone(phone) && !email) continue;

    try {
      const created = await createOrUpdateCustomer({
        name: order.customerName || 'عميل',
        email: email || null,
        phone: phone || null,
        address: order.address || null,
        city: order.city || null,
      });
      if (created?.id) {
        rows.push({
          id: created.id,
          name: created.name,
          email: created.email,
          phone: created.phone,
          city: order.city,
        });
      }
    } catch (err) {
      console.error('ensureGuestCustomersFromOrders:', order.id, err);
    }
  }
}

export async function getAllCustomers() {
  // املأ أي مشترٍ ضيف ظهر في الطلبات ولم يُحفظ كعميل
  await ensureGuestCustomersFromOrders();

  const rows = (await query(
    'SELECT * FROM customers ORDER BY created_at DESC'
  )) as any[];
  const orders = await getAllOrders();
  const { orderBelongsToCustomer } = await import('@/lib/customer-match');

  return rows.map((customer) => {
    const base = mapCustomerRow(customer);

    const matchedOrders = orders.filter((order) =>
      orderBelongsToCustomer(
        {
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          city: order.city,
        },
        base
      )
    );
    const liveCount = matchedOrders.length;
    const liveSpent = matchedOrders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );

    if (
      liveCount !== base.ordersCount ||
      liveSpent !== base.totalSpent
    ) {
      query(
        'UPDATE customers SET orders_count = ?, total_spent = ? WHERE id = ?',
        [liveCount, liveSpent, customer.id]
      ).catch(() => {});
    }

    return {
      ...base,
      ordersCount: liveCount,
      totalSpent: liveSpent,
    };
  });
}

export async function getCustomerByEmail(email: string) {
  if (!email?.trim()) return null;
  const rows = await query('SELECT * FROM customers WHERE email = ?', [
    email.trim().toLowerCase(),
  ]);
  const customer = (rows as any[])[0];
  if (!customer) return null;
  return mapCustomerRow(customer);
}

export async function createOrUpdateCustomer(customerData: any) {
  const email = String(customerData.email || '')
    .trim()
    .toLowerCase();
  const phoneRaw = String(customerData.phone || '').trim();
  const { normalizePhone, phonesMatch } = await import('@/lib/customer-match');
  const phoneDigits = normalizePhone(phoneRaw);

  if (!customerData.id && !email && !phoneDigits) {
    return null;
  }

  let existing = null as any;

  if (customerData.id) {
    existing = await getCustomerById(String(customerData.id));
  }

  if (!existing && email) {
    existing = await getCustomerByEmail(email);
  }

  if (!existing && phoneDigits) {
    const rows = (await query(
      `SELECT * FROM customers
       WHERE phone IS NOT NULL AND TRIM(phone) != ''`
    )) as any[];
    existing =
      rows.find((row) => phonesMatch(row.phone, phoneRaw)) || null;
  }

  const syncStats = async (
    customerId: string,
    customerPhone: string,
    customerEmail: string,
    customerName: string,
    customerCity: string
  ) => {
    const { orderBelongsToCustomer: belongs } = await import(
      '@/lib/customer-match'
    );
    const orders = await getAllOrders();
    const matched = orders.filter((o) =>
      belongs(
        {
          customerPhone: o.customerPhone,
          customerEmail: o.customerEmail,
          customerName: o.customerName,
          city: o.city,
        },
        {
          phone: customerPhone,
          email: customerEmail,
          name: customerName,
          city: customerCity,
        }
      )
    );
    const ordersCount = matched.length;
    const totalSpent = matched.reduce((s, o) => s + Number(o.total || 0), 0);
    await query(
      'UPDATE customers SET orders_count = ?, total_spent = ? WHERE id = ?',
      [ordersCount, totalSpent, customerId]
    );
    return { ordersCount, totalSpent };
  };

  if (existing) {
    const existingId = existing.id;
    const nextPhone = phoneRaw || existing.phone || '';
    const nextEmail = email || existing.email || '';
    const nextName = customerData.name || existing.name || '';
    const nextCity = customerData.city || existing.city || '';

    await query(
      `UPDATE customers 
       SET name = ?, 
           phone = COALESCE(NULLIF(?, ''), phone),
           address = COALESCE(?, address),
           city = COALESCE(?, city),
           email = CASE WHEN ? != '' THEN ? ELSE email END
       WHERE id = ?`,
      [
        nextName,
        phoneRaw,
        customerData.address || null,
        customerData.city || null,
        email,
        email,
        existingId,
      ]
    );

    const stats = await syncStats(
      existingId,
      nextPhone,
      nextEmail,
      nextName,
      nextCity
    );
    return {
      id: existingId,
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      ...stats,
    };
  }

  // لا نُدرج id يدوياً — الجدول AUTO_INCREMENT رقمي
  try {
    const result: any = await query(
      `INSERT INTO customers 
        (name, email, phone, address, city, orders_count, total_spent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerData.name || 'عميل',
        email || null,
        phoneRaw || null,
        customerData.address || null,
        customerData.city || null,
        0,
        0,
      ]
    );
    const newId = String(result.insertId);

    const stats = await syncStats(
      newId,
      phoneRaw,
      email,
      customerData.name || 'عميل',
      customerData.city || ''
    );
    return {
      id: newId,
      name: customerData.name || 'عميل',
      email,
      phone: phoneRaw,
      ...stats,
    };
  } catch (insertError: any) {
    // إن فشل الإدراج بسبب تكرار، أعد المحاولة كتحديث بعد البحث
    console.error(
      'createOrUpdateCustomer insert failed, retrying match:',
      insertError?.message || insertError
    );
    if (email) {
      existing = await getCustomerByEmail(email);
    }
    if (!existing && phoneDigits) {
      const rows = (await query(
        `SELECT * FROM customers WHERE phone IS NOT NULL AND TRIM(phone) != ''`
      )) as any[];
      existing =
        rows.find((row) => phonesMatch(row.phone, phoneRaw)) || null;
    }
    if (existing) {
      return createOrUpdateCustomer({
        ...customerData,
        id: existing.id,
      });
    }
    // إن كان البريد NOT NULL في مخطط قديم: استخدم بريداً فريداً للضيف
    if (
      !email &&
      (String(insertError?.message || '').includes('email') ||
        insertError?.code === 'ER_BAD_NULL_ERROR' ||
        insertError?.errno === 1048)
    ) {
      const fallbackEmail = `guest-${phoneDigits || randomUUID().slice(0, 8)}@sedra.local`;
      return createOrUpdateCustomer({
        ...customerData,
        email: fallbackEmail,
      });
    }
    throw insertError;
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
  const productId = String(item.productId);
  const existing = await query(
    `SELECT * FROM cart WHERE session_id = ? AND product_id = ? 
     AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
     AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))`,
    [
      item.sessionId,
      productId,
      item.selectedColor || null,
      item.selectedColor || null,
      item.selectedSize || null,
      item.selectedSize || null,
    ]
  );

  if ((existing as any[]).length > 0) {
    await query(
      `UPDATE cart SET quantity = quantity + ? 
       WHERE session_id = ? AND product_id = ? 
       AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
       AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))`,
      [
        item.quantity || 1,
        item.sessionId,
        productId,
        item.selectedColor || null,
        item.selectedColor || null,
        item.selectedSize || null,
        item.selectedSize || null,
      ]
    );
    return;
  }

  try {
    await query(
      `INSERT INTO cart (session_id, product_id, quantity, selected_color, selected_size)
       VALUES (?, ?, ?, ?, ?)`,
      [
        item.sessionId,
        productId,
        item.quantity || 1,
        item.selectedColor || null,
        item.selectedSize || null,
      ]
    );
  } catch {
    // بعض المخططات تتطلب عمود id يدوياً
    const id = `CART-${randomUUID().slice(0, 8)}`;
    await query(
      `INSERT INTO cart (id, session_id, product_id, quantity, selected_color, selected_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.sessionId,
        productId,
        item.quantity || 1,
        item.selectedColor || null,
        item.selectedSize || null,
      ]
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

  const result: any = await query(
    `INSERT INTO customers (name, email, phone, password)
     VALUES (?, ?, ?, ?)`,
    [data.name, data.email.toLowerCase(), data.phone || null, hashedPassword]
  );

  return {
    id: String(result.insertId),
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