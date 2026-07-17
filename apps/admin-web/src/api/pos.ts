import { apiFetch } from './client';
import type { I18nText } from './menu';

export interface PosCategory {
  _id: string;
  name: I18nText;
  displayName: string;
  sort: number;
  isActive: boolean;
}

export interface PosMenuToppingOption {
  name: string;
  displayName: string;
  catalog: string;
  price: number;
  maxQty: number;
}

export interface PosMenuToppingCatalog {
  name: I18nText;
  displayName: string;
  selectionMode: 'single' | 'multiple';
  options: PosMenuToppingOption[];
}

export interface PosMenuItem {
  _id: string;
  categoryId: string;
  name: I18nText;
  displayName: string;
  displayDescription?: string;
  basePrice: number;
  toppingCatalogs?: PosMenuToppingCatalog[];
  isAvailable: boolean;
}

export interface PosMenuResponse {
  lang: string;
  categories: PosCategory[];
  items: PosMenuItem[];
}

export interface PosOrder {
  _id: string;
  orderNo: string;
  pickupNo?: string;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentCash?: number;
  paymentCard?: number;
  items: { name: string; qty: number; subtotal: number }[];
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mixed';

export function fetchPosMenu(lang: 'zh' | 'en' = 'zh') {
  return apiFetch<PosMenuResponse>(`/pos/menu?lang=${lang}`);
}

export function createPosOrder(data: {
  storeId: string;
  items: {
    menuItemId: string;
    name: string;
    unitPrice: number;
    qty: number;
    toppings?: { catalog?: string; name: string; qty: number }[];
  }[];
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  cardAmount?: number;
  customerNote?: string;
}) {
  return apiFetch<PosOrder>('/pos/orders', {
    method: 'POST',
    body: JSON.stringify({ ...data, source: 'pos' }),
  });
}

export function listTodayOrders(storeId?: string) {
  const q = storeId ? `?storeId=${storeId}` : '';
  return apiFetch<PosOrder[]>(`/pos/orders/today${q}`);
}

export { formatPrice, formatMoney } from '../utils/currency';
