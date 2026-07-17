import { apiFetch } from './client';

export interface I18nText {
  zh: string;
  en: string;
}

export interface Category {
  _id: string;
  name: I18nText;
  sort: number;
  isActive: boolean;
}

export interface MenuToppingOption {
  name: string;
  price: number;
  maxQty: number;
}

export interface MenuToppingCatalog {
  name: I18nText;
  selectionMode?: 'single' | 'multiple';
  options: MenuToppingOption[];
}

/** @deprecated 旧版扁平结构 */
export interface MenuTopping extends MenuToppingOption {}

export interface MenuItem {
  _id: string;
  categoryId: string;
  name: I18nText;
  description?: I18nText;
  basePrice: number;
  toppingCatalogs?: MenuToppingCatalog[];
  isAvailable: boolean;
  sort: number;
}

export function formatI18n(text: I18nText) {
  return `${text.zh} / ${text.en}`;
}

export function labelI18n(text: I18nText, lang: 'zh' | 'en' = 'zh') {
  return lang === 'en' ? text.en || text.zh : text.zh || text.en;
}

export function listCategories() {
  return apiFetch<Category[]>('/admin/menu/categories?all=true');
}

export function createCategory(name: I18nText, sort = 0) {
  return apiFetch<Category>('/admin/menu/categories', {
    method: 'POST',
    body: JSON.stringify({ name, sort }),
  });
}

export function updateCategory(
  id: string,
  data: Partial<{ name: I18nText; sort: number; isActive: boolean }>,
) {
  return apiFetch<Category>(`/admin/menu/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: string) {
  return apiFetch<Category>(`/admin/menu/categories/${id}`, { method: 'DELETE' });
}

export function listMenuItems() {
  return apiFetch<MenuItem[]>('/admin/menu/items?all=true');
}

export function createMenuItem(data: {
  categoryId: string;
  name: I18nText;
  description?: I18nText;
  basePrice: number;
  toppingCatalogs?: MenuToppingCatalog[];
  isAvailable?: boolean;
}) {
  return apiFetch<MenuItem>('/admin/menu/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMenuItem(
  id: string,
  data: Partial<{
    categoryId: string;
    name: I18nText;
    description: I18nText;
    basePrice: number;
    toppingCatalogs?: MenuToppingCatalog[];
    isAvailable: boolean;
    sort: number;
  }>,
) {
  return apiFetch<MenuItem>(`/admin/menu/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteMenuItem(id: string) {
  return apiFetch<{ deleted: boolean; id: string }>(`/admin/menu/items/${id}`, { method: 'DELETE' });
}

export { formatPrice, formatMoney, parsePrice } from '../utils/currency';
