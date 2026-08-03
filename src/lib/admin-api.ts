import { API_BASE_URL } from './api-config';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: 'staff';
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  customizations: {
    groupId: string;
    groupTitle: string;
    options: { id: string; name: string; priceAdd: number }[];
  }[];
}

export interface Order {
  _id: string;
  orderNumber: string;
  orderType: 'eat-in' | 'take-away';
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: 'received' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: {
    _id: string;
    name: string;
  };
  image: string;
  isActive?: boolean;
  customizations?: unknown[];
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Login failed');
  }
  return json.data.admin as AdminUser;
}

export async function adminMe(): Promise<AdminUser | null> {
  const res = await fetch(`${API_BASE_URL}/admin/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as AdminUser;
}

export async function adminLogout() {
  await fetch(`${API_BASE_URL}/admin/logout`, {
    method: 'PUT',
    credentials: 'include',
  });
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function fetchOrders(status?: string): Promise<Order[]> {
  const url = status
    ? `${API_BASE_URL}/orders?status=${status}`
    : `${API_BASE_URL}/orders`;
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch orders');
  return json.data as Order[];
}

export async function fetchKitchenOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE_URL}/orders/kitchen`, {
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch kitchen orders');
  return json.data as Order[];
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update order status');
  return json.data as Order;
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/products`, { credentials: 'include', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch products');
  return json.data as Product[];
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`, { credentials: 'include', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch categories');
  return json.data as Category[];
}

export async function createCategory(payload: { name: string; displayOrder?: number }): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create category');
  return json.data as Category;
}

export async function updateCategory(id: string, payload: { name?: string; displayOrder?: number }): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update category');
  return json.data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete category');
}

export async function createProduct(formData: FormData): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create product');
  }
  return json.data as Product;
}

export async function updateProduct(id: string, formData: FormData): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update product');
  }
  return json.data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to delete product');
  }
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export async function fetchStaff(): Promise<StaffMember[]> {
  const res = await fetch(`${API_BASE_URL}/staff`, { credentials: 'include', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch staff');
  return json.data as StaffMember[];
}

export async function createStaff(payload: { name: string; email: string; password: string }): Promise<StaffMember> {
  const res = await fetch(`${API_BASE_URL}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create staff member');
  return json.data as StaffMember;
}

export async function updateStaff(id: string, payload: { name?: string; email?: string }): Promise<StaffMember> {
  const res = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update staff member');
  return json.data as StaffMember;
}

export async function updateStaffStatus(id: string, isActive: boolean): Promise<StaffMember> {
  const res = await fetch(`${API_BASE_URL}/staff/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isActive }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update staff status');
  return json.data as StaffMember;
}

export async function resetStaffPassword(id: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/staff/${id}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to reset password');
}
