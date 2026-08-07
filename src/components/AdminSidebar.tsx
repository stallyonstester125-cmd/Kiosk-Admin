"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Layers, ClipboardList, Ticket, BarChart3, ChevronRight, UtensilsCrossed, Users } from "lucide-react";
import { useAuth } from "@/context/AdminAuthContext";

type SubNavItem = {
  label: string;
  href: string;
  permission?: string; // Permission required for this sub-item
};

type NavItem = {
  key: string;
  label: string;
  href?: string;
  iconType: "image" | "lucide";
  iconSrc?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  subItems?: SubNavItem[];
  adminOnly?: boolean;
  permission?: string; // Permission required to see this item
};

const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    iconType: "image",
    iconSrc: "/images/Sidebar_DasboardIcon.png",
    adminOnly: true,
  },
  {
    key: "menuLayout",
    label: "Menu Layout",
    iconType: "lucide",
    icon: Layers,
    adminOnly: true,
    permission: "products",
    subItems: [
      { label: "Product", href: "/dashboard/products", permission: "products" },
      { label: "Category", href: "/dashboard/categories", permission: "categories" },
    ],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    href: "/dashboard/kitchen",
    iconType: "lucide",
    icon: UtensilsCrossed,
    adminOnly: false,
    permission: "kitchen",
  },
  {
    key: "salesReport",
    label: "Sales Report",
    href: "/dashboard/sales-report",
    iconType: "lucide",
    icon: ClipboardList,
    adminOnly: true,
    permission: "sales-report",
  },
  {
    key: "coupons",
    label: "Coupons",
    href: "/dashboard/coupons",
    iconType: "lucide",
    icon: Ticket,
    adminOnly: true,
    permission: "coupons",
  },
  {
    key: "transactions",
    label: "Transaction & Analytics",
    href: "/dashboard/transactions",
    iconType: "lucide",
    icon: BarChart3,
    adminOnly: true,
    permission: "transactions",
  },
  {
    key: "staff",
    label: "Staff Management",
    href: "/dashboard/staff",
    iconType: "lucide",
    icon: Users,
    adminOnly: true,
    permission: "staff",
  },
];

interface AdminSidebarProps {
  role?: string;
  permissions?: string[];
}

export default function AdminSidebar({ role = "admin", permissions = [] }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { admin } = useAuth();

  const isAdmin = role === "admin";
  
  // Check if user has permission to see a nav item
  const hasPermission = (item: NavItem): boolean => {
    // Admin sees everything
    if (isAdmin) return true;
    // If item has no permission requirement, allow
    if (!item.permission) return true;
    // Check if user has the required permission
    return permissions?.includes(item.permission) ?? false;
  };

  // Check if user has permission for a sub-item
  const hasSubPermission = (sub: SubNavItem): boolean => {
    // Admin sees everything
    if (isAdmin) return true;
    // If sub-item has no permission requirement, allow
    if (!sub.permission) return true;
    // Check if user has the required permission
    return permissions?.includes(sub.permission) ?? false;
  };

  const visibleItems = navItems.filter((item) => {
    // Check adminOnly first
    if (item.adminOnly && !isAdmin) return false;
    // Check permission
    return hasPermission(item);
  });

  const visibleSubItems = (item: NavItem) => {
    if (!item.subItems) return [];
    return item.subItems.filter(sub => hasSubPermission(sub));
  };

  const hasVisibleSubItems = (item: NavItem): boolean => {
    if (!item.subItems) return false;
    return item.subItems.some(sub => hasSubPermission(sub));
  };

  const isActive = (href?: string) =>
    href && (pathname === href || pathname.startsWith(href + "/"));

  const handleMenuToggle = (key: string) => {
    setExpandedMenu(expandedMenu === key ? null : key);
  };

  const renderIcon = (item: NavItem, isActiveItem: boolean) => {
    if (item.iconType === "image") {
      return (
        <Image
          src={item.iconSrc!}
          alt=""
          width={20}
          height={20}
          className={isActiveItem ? "brightness-0 saturate-100" : ""}
          style={
            isActiveItem
              ? {
                  filter:
                    "invert(32%) sepia(74%) saturate(4096%) hue-rotate(339deg) brightness(94%) contrast(101%)",
                }
              : {}
          }
        />
      );
    }
    const Icon = item.icon!;
    return (
      <Icon
        className={`w-5 h-5 ${
          isActiveItem
            ? "text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
        strokeWidth={2}
      />
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 fixed top-0 left-0 h-full z-40 flex flex-col">
      {/* Logo at top of sidebar */}
      <div className="flex items-center justify-center h-24 px-4">
        <Image
          src="/images/logo.svg"
          alt="QuickCrave Logo"
          height={48}
          width={200}
          className="h-12 w-auto"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-0 px-4 space-y-2">
        <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-2">
          {isAdmin ? "MAIN" : "KITCHEN"}
        </div>

        {visibleItems.map((item) => {
          const active = isActive(item.href);

          if (item.subItems) {
            const visibleSubItems = item.subItems.filter(sub => hasSubPermission(sub));
            const subActive = visibleSubItems.some((sub) => isActive(sub.href));
            const isExpanded = expandedMenu === item.key;
            const isActiveItem = active || subActive;

            return (
              <div key={item.key}>
                <button
                  onClick={() => handleMenuToggle(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActiveItem
                      ? "bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/20 text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                  style={isActiveItem ? { borderLeft: `4px solid var(--brand-orange)` } : {}}
                >
                  {renderIcon(item, isActiveItem)}
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""} ${
                      isActiveItem ? "text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" : "text-zinc-500 dark:text-zinc-400"
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {isExpanded && visibleSubItems.length > 0 && (
                  <div className="mt-1 ml-6 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-3">
                    {visibleSubItems.map((sub) => {
                      const subItemActive = isActive(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            subItemActive
                              ? "bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/20 text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)] font-medium"
                              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                          style={subItemActive ? { borderLeft: `4px solid var(--brand-orange)` } : {}}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? "bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/20 text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
              style={active ? { borderLeft: `4px solid var(--brand-orange)` } : {}}
            >
              {renderIcon(item, active)}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom - wave.svg */}
      <div className="absolute bottom-[-15vh] left-0 right-0 z-0" style={{ height: "40vh", maxHeight: "40vh" }}>
        <Image
          src="/images/wave.svg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="256px"
        />
      </div>
    </aside>
  );
}