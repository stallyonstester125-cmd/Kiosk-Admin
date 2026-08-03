"use client";

import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/context/AdminAuthContext";
import { useState } from "react";

export default function AdminTopBar() {
  const { admin, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = admin?.name
    ? admin.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  const roleLabel = admin?.role === "staff" ? "Staff" : "Admin";

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left — logo + mobile menu toggle */}
      <div className="flex items-center gap-4">
        <Image
          src="/images/logo.svg"
          alt="QuickCrave Logo"
          height={28}
          width={120}
          className="h-7 w-auto"
          priority
        />
        <button
          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {/* Right — user info + logout */}
      {admin && (
        <div className="flex items-center gap-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--brand-orange)] flex items-center justify-center text-white text-xs font-bold select-none">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {admin.name}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-[var(--brand-orange-light)] dark:hover:bg-[var(--brand-orange-dark)]/20 hover:text-[var(--brand-orange)] dark:hover:text-[var(--brand-orange-hover)] transition-colors disabled:opacity-50"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">
              {loggingOut ? "Logging out…" : "Logout"}
            </span>
          </button>
        </div>
      )}
    </header>
  );
}