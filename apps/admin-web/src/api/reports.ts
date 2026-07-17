import { apiFetch } from './client';
import { formatMoney } from '../utils/currency';

export interface SalesReport {
  startDate: string;
  endDate: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  bySource: { scan: number; pos: number };
  byPayment: Record<string, number>;
  orders?: ReportOrder[];
  dailyTrend?: DailyTrendRow[];
  aovDetail?: AovDetail;
}

export interface ReportOrder {
  _id: string;
  orderNo: string;
  pickupNo?: string;
  total: number;
  source: string;
  paymentMethod?: string;
  paymentCash?: number;
  paymentCard?: number;
  itemCount: number;
  items: { name: string; qty: number; subtotal: number }[];
  createdAt: string;
}

export interface DailyTrendRow {
  date: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface AovDetail {
  min: number;
  max: number;
  median: number;
  averageOrderValue: number;
  orders: {
    _id: string;
    orderNo: string;
    pickupNo?: string;
    total: number;
    paymentMethod?: string;
    createdAt: string;
  }[];
}

export type KpiKey = 'orders' | 'revenue' | 'aov';

export const PAYMENT_LABELS: Record<string, string> = {
  cash: '现金',
  card: '刷卡',
  mixed: '混合支付',
};

/** 爱尔兰门店报表仅展示现金、刷卡（混合支付已拆分计入二者） */
export const PAYMENT_CARD_ORDER = ['cash', 'card'] as const;
export type PaymentKey = (typeof PAYMENT_CARD_ORDER)[number];

function reportParams(startDate: string, endDate: string, storeId?: string, expand?: string) {
  const params = new URLSearchParams({ startDate, endDate });
  if (storeId) params.set('storeId', storeId);
  if (expand) params.set('expand', expand);
  return params;
}

/** 一次拉取汇总 + 全部详情（兼容未部署独立详情接口的环境） */
export function fetchSalesReport(startDate: string, endDate: string, storeId?: string) {
  return apiFetch<SalesReport>(
    `/admin/reports/sales?${reportParams(startDate, endDate, storeId, 'all')}`,
  );
}

export function formatPaymentLabel(order: {
  paymentMethod?: string;
  paymentCash?: number;
  paymentCard?: number;
}) {
  if (order.paymentMethod === 'mixed' && order.paymentCash != null && order.paymentCard != null) {
    return `混合（${formatMoney(order.paymentCash)} + ${formatMoney(order.paymentCard)}）`;
  }
  const method = order.paymentMethod ?? '';
  return PAYMENT_LABELS[method] ?? (method || '-');
}

export function formatSource(source: string) {
  return source === 'pos' ? '收银台' : source === 'scan' ? '扫码' : source;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function orderMatchesPayment(
  order: {
    paymentMethod?: string;
    paymentCash?: number;
    paymentCard?: number;
  },
  paymentKey: string,
): boolean {
  const method = order.paymentMethod ?? 'unknown';
  if (paymentKey === 'cash') {
    return method === 'cash' || (method === 'mixed' && (order.paymentCash ?? 0) > 0);
  }
  if (paymentKey === 'card') {
    return method === 'card' || (method === 'mixed' && (order.paymentCard ?? 0) > 0);
  }
  return method === paymentKey;
}

export function orderPaymentAmount(
  order: {
    total: number;
    paymentMethod?: string;
    paymentCash?: number;
    paymentCard?: number;
  },
  paymentKey: string,
): number {
  if (order.paymentMethod === 'mixed') {
    if (paymentKey === 'cash') return order.paymentCash ?? 0;
    if (paymentKey === 'card') return order.paymentCard ?? 0;
    return 0;
  }
  return orderMatchesPayment(order, paymentKey) ? order.total : 0;
}
