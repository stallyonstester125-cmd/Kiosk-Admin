import { API_BASE_URL } from './api-config';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  permissions?: string[]; // Added this line for staff permissions
}

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: 'staff';
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  permissions?: string[];  // Array of permissions like 'kitchen', 'products', etc.
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
  coupon_code?: string | null;
  discount_amount?: number;
  subtotal_before_discount?: number;
  subtotal_after_discount?: number;
  tax_after_discount?: number;
  grand_total?: number;
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
  const adminData = json.data.admin as AdminUser;
  return {
    ...adminData,
    permissions: adminData.permissions || []
  };
}

export async function adminMe(): Promise<AdminUser | null> {
  const res = await fetch(`${API_BASE_URL}/admin/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const json = await res.json();
  const adminData = json.data as AdminUser;
  return {
    ...adminData,
    permissions: adminData.permissions || []
  };
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

export async function createStaff(payload: { name: string; email: string; password: string; permissions?: string[] }): Promise<StaffMember> {
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

export async function updateStaff(id: string, payload: { name?: string; email?: string; permissions?: string[] }): Promise<StaffMember> {
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

// ─── Coupons ─────────────────────────────────────────────────────────────────

export interface Coupon {
  _id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  percentage?: number | null;
  fixed_amount?: number | null;
  minimum_order?: number | null;
  maximum_discount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  per_customer_limit?: number | null;
  starts_at: string;
  expires_at: string;
  first_order_only: boolean;
  stackable: boolean;
  status: 'active' | 'inactive';
  created_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCoupons(status?: string, discountType?: string): Promise<Coupon[]> {
  let url = `${API_BASE_URL}/coupons`;
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (discountType) params.append('discountType', discountType);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch coupons');
  return json.data as Coupon[];
}

export async function fetchCouponById(id: string): Promise<Coupon> {
  const res = await fetch(`${API_BASE_URL}/coupons/${id}`, { credentials: 'include', cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch coupon');
  return json.data as Coupon;
}

export async function createCoupon(payload: Partial<Coupon>): Promise<Coupon> {
  const res = await fetch(`${API_BASE_URL}/coupons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create coupon');
  return json.data as Coupon;
}

export async function updateCoupon(id: string, payload: Partial<Coupon>): Promise<Coupon> {
  const res = await fetch(`${API_BASE_URL}/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update coupon');
  return json.data as Coupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/coupons/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete coupon');
}

export async function enableCoupon(id: string): Promise<Coupon> {
  const res = await fetch(`${API_BASE_URL}/coupons/${id}/enable`, {
    method: 'PATCH',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to enable coupon');
  return json.data as Coupon;
}

export async function disableCoupon(id: string): Promise<Coupon> {
  const res = await fetch(`${API_BASE_URL}/coupons/${id}/disable`, {
    method: 'PATCH',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to disable coupon');
  return json.data as Coupon;
}

export async function duplicateCoupon(id: string): Promise<Coupon> {
  const res = await fetch(`${API_BASE_URL}/coupons/${id}/duplicate`, {
    method: 'POST',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to duplicate coupon');
  return json.data as Coupon;
}

export async function downloadSalesReport(params: Record<string, string>): Promise<void> {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/orders/export/sales?${query}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Failed to export sales report');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  let filename = `Sales_Report_${new Date().toISOString().slice(0, 10)}`;
  if (disposition && disposition.includes('filename=')) {
    const parts = disposition.split('filename=');
    if (parts[1]) filename = parts[1].replace(/"/g, '').trim();
  } else {
    const ext = params.exportType === 'xlsx' ? 'xlsx' : params.exportType === 'pdf' ? 'pdf' : 'csv';
    filename += `.${ext}`;
  }

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadTransactionsReport(params: Record<string, string>): Promise<void> {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/orders/export/transactions?${query}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Failed to export transactions report');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  let filename = `Transaction_Report_${new Date().toISOString().slice(0, 10)}`;
  if (disposition && disposition.includes('filename=')) {
    const parts = disposition.split('filename=');
    if (parts[1]) filename = parts[1].replace(/"/g, '').trim();
  } else {
    const ext = params.exportType === 'xlsx' ? 'xlsx' : params.exportType === 'pdf' ? 'pdf' : 'csv';
    filename += `.${ext}`;
  }

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}