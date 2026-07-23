/** تطبيع رقم الهاتف لأرقام فقط */
export function normalizePhone(phone?: string | null): string {
  return String(phone || '').replace(/\D/g, '');
}

export function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

export function normalizeName(name?: string | null): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** مقارنة أرقام سورية/دولية بمرونة (09… مقابل 9639…) */
export function phonesMatch(
  a?: string | null,
  b?: string | null
): boolean {
  const pa = normalizePhone(a);
  const pb = normalizePhone(b);
  if (!pa || !pb) return false;
  if (pa === pb) return true;
  if (pa.endsWith(pb) || pb.endsWith(pa)) return true;
  const a9 = pa.slice(-9);
  const b9 = pb.slice(-9);
  return a9.length >= 9 && a9 === b9;
}

export function emailsMatch(
  a?: string | null,
  b?: string | null
): boolean {
  const ea = normalizeEmail(a);
  const eb = normalizeEmail(b);
  return Boolean(ea && eb && ea === eb);
}

export function orderBelongsToCustomer(
  order: {
    customerPhone?: string | null;
    customerEmail?: string | null;
    customerName?: string | null;
    city?: string | null;
  },
  customer: {
    phone?: string | null;
    email?: string | null;
    name?: string | null;
    city?: string | null;
  }
): boolean {
  if (phonesMatch(customer.phone, order.customerPhone)) return true;
  if (emailsMatch(customer.email, order.customerEmail)) return true;

  // احتياط: نفس الاسم + نفس المدينة (للطلبات بدون بريد وباختلاف بسيط في الهاتف)
  const sameName =
    normalizeName(customer.name) &&
    normalizeName(customer.name) === normalizeName(order.customerName);
  const sameCity =
    normalizeName(customer.city) &&
    normalizeName(customer.city) === normalizeName(order.city);
  if (sameName && sameCity) return true;

  return false;
}
