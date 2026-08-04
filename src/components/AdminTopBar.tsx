"use client";

import { useAuth } from "@/context/AdminAuthContext";
import { useState } from "react";
import { LogOut } from "lucide-react";

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
    <header className="h-16 bg-[var(--brand-orange)] fixed top-0 left-64 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left - Page title could go here if needed */}
      <div className="flex items-center gap-4">
        {/* Empty space where logo used to be */}
      </div>

      {/* Right — user info + logout */}
      {admin && (
        <div className="flex items-center gap-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold select-none ring-1 ring-white/30">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {admin.name}
              </span>
              <span className="text-xs text-zinc-700 dark:text-zinc-300">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/30" />

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
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