"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AdminAuthContext";
import AdminTopBar from "@/components/AdminTopBar";
import AdminSidebar from "@/components/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/login");
      return;
    }

    // Staff can only access the kitchen page
    if (!loading && admin && admin.role === "staff" && pathname !== "/dashboard/kitchen") {
      router.push("/dashboard/kitchen");
    }
  }, [admin, loading, router, pathname]);

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
  if (admin.role === "staff" && pathname !== "/dashboard/kitchen") {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <AdminSidebar role={admin.role} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <AdminTopBar />
        <main className="flex-1 p-6 sm:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}