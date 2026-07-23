/** أسعار الشحن حسب المحافظة (بالدولار) */
export const SYRIAN_CITIES_WITH_SHIPPING: Array<{
  name: string;
  shippingCost: number;
}> = [
  { name: 'إدلب', shippingCost: 2 },
  { name: 'دمشق', shippingCost: 3 },
  { name: 'ريف دمشق', shippingCost: 3 },
  { name: 'حلب', shippingCost: 3 },
  { name: 'حمص', shippingCost: 3 },
  { name: 'حماة', shippingCost: 3 },
  { name: 'اللاذقية', shippingCost: 3 },
  { name: 'طرطوس', shippingCost: 3 },
  { name: 'درعا', shippingCost: 3 },
  { name: 'دير الزور', shippingCost: 3 },
  { name: 'الحسكة', shippingCost: 3 },
  { name: 'الرقة', shippingCost: 3 },
];

export function getShippingCostByCity(cityName: string): number {
  const city = SYRIAN_CITIES_WITH_SHIPPING.find((c) => c.name === cityName);
  return city?.shippingCost ?? 3;
}

/** يحسب الشحن النهائي مع مراعاة حد الشحن المجاني من الإعدادات */
export function calculateShipping(options: {
  city: string;
  subtotal: number;
  discount?: number;
  freeShippingThreshold?: number;
}): number {
  const {
    city,
    subtotal,
    discount = 0,
    freeShippingThreshold = 0,
  } = options;
  const afterDiscount = subtotal - discount;
  if (freeShippingThreshold > 0 && afterDiscount >= freeShippingThreshold) {
    return 0;
  }
  return getShippingCostByCity(city);
}
