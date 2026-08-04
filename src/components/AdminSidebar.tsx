"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Layers, ClipboardList, CreditCard, BarChart3, ChevronRight, UtensilsCrossed, Users } from "lucide-react";
import { useAuth } from "@/context/AdminAuthContext";

type NavItem = {
  key: string;
  label: string;
  href?: string;
  iconType: "image" | "lucide";
  iconSrc?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  subItems?: Array<{ label: string; href: string }>;
  adminOnly?: boolean;
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
    subItems: [
      { label: "Product", href: "/dashboard/products" },
      { label: "Category", href: "/dashboard/categories" },
    ],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    href: "/dashboard/kitchen",
    iconType: "lucide",
    icon: UtensilsCrossed,
    adminOnly: false,
  },
  {
    key: "salesReport",
    label: "Sales Report",
    href: "/dashboard/sales-report",
    iconType: "lucide",
    icon: ClipboardList,
    adminOnly: true,
  },
  {
    key: "paymentSettings",
    label: "Payment Settings",
    href: "/dashboard/payment-settings",
    iconType: "lucide",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    key: "transactions",
    label: "Transaction & Analytics",
    href: "/dashboard/transactions",
    iconType: "lucide",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    key: "staff",
    label: "Staff Management",
    href: "/dashboard/staff",
    iconType: "lucide",
    icon: Users,
    adminOnly: true,
  },
];

interface AdminSidebarProps {
  role?: string;
}

export default function AdminSidebar({ role = "admin" }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const { admin } = useAuth();

  const isAdmin = role === "admin";
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

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
      <nav className="flex-1 p-4  space-y-2 pb-[42vh]">
        <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-3 py-2">
          {isAdmin ? "MAIN" : "KITCHEN"}
        </div>

        {visibleItems.map((item) => {
          const active = isActive(item.href);

          if (item.subItems) {
            const subActive = item.subItems.some((sub) => isActive(sub.href));
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

                {isExpanded && (
                  <div className="mt-1 ml-6 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-3">
                    {item.subItems.map((sub) => {
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
      <div className="absolute bottom-0 left-0 right-0 z-0" style={{ height: "40vh", maxHeight: "40vh" }}>
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