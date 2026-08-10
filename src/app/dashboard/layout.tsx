"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AdminAuthContext";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";
import { firstPermittedPath, hasRoutePermission } from "@/lib/permissions";
import AiHelpChat from "@/components/AiHelpChat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isImpersonating = admin?.impersonation?.active === true;

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/login");
      return;
    }

    // Staff can only access pages they have permissions for
    if (!loading && admin && admin.role === "staff") {
      // Staff management is intentionally admin-only on the API as well.
      const permissions = (admin.permissions || []).filter((permission) => permission !== "staff");
      if (!hasRoutePermission(pathname, permissions)) {
        router.replace(firstPermittedPath(permissions));
      }
    }
  }, [admin, loading, router, pathname]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  // Prevent flash of forbidden page for staff
  if (admin.role === "staff") {
    if (!hasRoutePermission(pathname, (admin.permissions || []).filter((permission) => permission !== "staff"))) return null;
  }

  // When the impersonation banner is shown (36px), the topbar shifts down.
  // Add extra padding-top so content doesn't hide behind both the banner and the topbar.
  const topOffset = isImpersonating ? "pt-[136px] lg:pt-[100px]" : "pt-28 lg:pt-16";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <AdminSidebar role={admin.role} permissions={admin.permissions} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 lg:ml-64 flex flex-col min-h-screen ${topOffset}`}>
        <AdminTopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <AiHelpChat />
      </div>
    </div>
  );
}
