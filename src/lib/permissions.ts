export const PERMISSIONS = [
  'kitchen',
  'products',
  'categories',
  'transactions',
  'sales-report',
  'coupons',
  'staff',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const permissionPaths: Record<Permission, string> = {
  kitchen: '/dashboard/kitchen',
  products: '/dashboard/products',
  categories: '/dashboard/categories',
  transactions: '/dashboard/transactions',
  'sales-report': '/dashboard/sales-report',
  coupons: '/dashboard/coupons',
  staff: '/dashboard/staff',
};

export function hasRoutePermission(pathname: string, permissions: readonly string[]) {
  return PERMISSIONS.some((permission) => {
    if (!permissions.includes(permission)) return false;
    const path = permissionPaths[permission];
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export function firstPermittedPath(permissions: readonly string[]) {
  return PERMISSIONS.map((permission) => permissionPaths[permission]).find((path, index) =>
    permissions.includes(PERMISSIONS[index]),
  ) ?? '/login';
}
