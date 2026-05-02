'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatPrice } from '@/lib/store'
import type { Order, Currency } from '@/lib/types'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4a574',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontSize: 10,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'medium',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 9,
  },
  colProduct: { width: '40%' },
  colDetails: { width: '30%' },
  colQuantity: { width: '15%' },
  colPrice: { width: '15%', textAlign: 'left' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4a574',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  // RTL text wrapper
  rtl: {
    direction: 'rtl',
    unicodeBidi: 'bidi-override',
  },
})

interface OrderPDFProps {
  order: Order
  currency: Currency
  getProductName: (productId: string) => string
}

export function OrderPDF({ order, currency, getProductName }: OrderPDFProps) {
  // Wrap text for RTL
  const rtlText = (text: string) => ({ children: text, style: styles.rtl })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, styles.rtl]}>سيدرا - SEDRA</Text>
          <Text style={[styles.subtitle, styles.rtl]}>فاتورة الطلب رقم {order.id}</Text>
          <Text style={[styles.subtitle, styles.rtl]}>
            التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-SY')}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.rtl]}>معلومات العميل</Text>
          <View style={styles.row}>
            <Text style={[styles.label, styles.rtl]}>الاسم:</Text>
            <Text style={[styles.value, styles.rtl]}>{order.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, styles.rtl]}>رقم الهاتف:</Text>
            <Text style={[styles.value, styles.rtl]}>{order.customerPhone}</Text>
          </View>
          {order.customerEmail && (
            <View style={styles.row}>
              <Text style={[styles.label, styles.rtl]}>البريد الإلكتروني:</Text>
              <Text style={[styles.value, styles.rtl]}>{order.customerEmail}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.label, styles.rtl]}>العنوان:</Text>
            <Text style={[styles.value, styles.rtl]}>
              {order.address}، {order.city}
            </Text>
          </View>
        </View>

{/* Order Items */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>المنتجات</Text>
  <View style={styles.table}>
    <View style={styles.tableHeader}>
      <Text style={styles.colProduct}>المنتج</Text>
      <Text style={styles.colDetails}>التفاصيل</Text>
      <Text style={styles.colQuantity}>الكمية</Text>
      <Text style={styles.colPrice}>السعر</Text>
    </View>
    {Array.isArray(order.items) && order.items.length > 0 ? (
      order.items.map((item, index) => {
        const productName = getProductName(item.productId)
        const details = [
          item.selectedColor && `اللون: ${item.selectedColor}`,
          item.selectedSize && `المقاس: ${item.selectedSize}`,
        ].filter(Boolean).join(' | ')
        
        const totalQuantity = order.items.reduce((sum, i) => sum + i.quantity, 0)
        const avgItemPrice = totalQuantity > 0 ? order.subtotal / totalQuantity : 0
        const itemTotal = avgItemPrice * item.quantity
        
        return (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colProduct}>{productName}</Text>
            <Text style={styles.colDetails}>{details || '—'}</Text>
            <Text style={styles.colQuantity}>{item.quantity}</Text>
            <Text style={styles.colPrice}>
              {formatPrice(itemTotal, currency)}
            </Text>
          </View>
        )
      })
    ) : (
      <View style={styles.tableRow}>
        <Text style={styles.colProduct}>لا توجد منتجات</Text>
        <Text style={styles.colDetails}>-</Text>
        <Text style={styles.colQuantity}>-</Text>
        <Text style={styles.colPrice}>-</Text>
      </View>
    )}
  </View>
</View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.rtl]}>المجموع الفرعي:</Text>
            <Text style={styles.rtl}>{formatPrice(order.subtotal, currency)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.rtl]}>الخصم {order.couponCode && `(${order.couponCode})`}:</Text>
              <Text style={[styles.rtl, { color: '#10b981' }]}>-{formatPrice(order.discount, currency)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.rtl]}>الشحن:</Text>
            <Text style={styles.rtl}>{order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping, currency)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 15, borderTopWidth: 2 }]}>
            <Text style={[styles.totalLabel, { fontSize: 14 }, styles.rtl]}>الإجمالي:</Text>
            <Text style={[styles.totalValue, styles.rtl]}>{formatPrice(order.total, currency)}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.rtl]}>ملاحظات</Text>
            <Text style={[styles.value, styles.rtl]}>{order.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.rtl}>شكراً لتسوقك من سيدرا</Text>
          <Text style={styles.rtl}>للاستفسار: {order.customerPhone}</Text>
        </View>
      </Page>
    </Document>
  )
}