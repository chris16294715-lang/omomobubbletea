import { apiFetch } from './client';

export interface Category {
  _id: string;
  name: string;
  sort: number;
  isActive: boolean;
}

export interface MenuItem {
  _id: string;
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  isAvailable: boolean;
  sort: number;
}

export function listCategories() {
  return apiFetch<Category[]>('/admin/menu/categories?all=true');
}

export function createCategory(name: string, sort = 0) {
  return apiFetch<Category>('/admin/menu/categories', {
    method: 'POST',
    body: JSON.stringify({ name, sort }),
  });
}

export function updateCategory(id: string, data: Partial<Pick<Category, 'name' | 'sort' | 'isActive'>>) {
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
  name: string;
  description?: string;
  basePrice: number;
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
    name: string;
    description: string;
    basePrice: number;
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

export function formatPrice(cents: number) {
  return (cents / 100).toFixed(2);
}

export function parsePrice(yuan: string) {
  return Math.round(Number(yuan) * 100);
}
