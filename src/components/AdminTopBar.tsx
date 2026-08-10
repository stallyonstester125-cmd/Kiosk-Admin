"use client";

import { useAuth } from "@/context/AdminAuthContext";
import { useState } from "react";
import { LogOut, Search, X, UserCog, XCircle, Menu } from "lucide-react";
import { useSearch } from "@/context/SearchContext";

export default function AdminTopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { admin, logout, exitImpersonation } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [exitingImpersonation, setExitingImpersonation] = useState(false);
  const { query, setQuery, clearQuery, config } = useSearch();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleExitImpersonation = async () => {
    setExitingImpersonation(true);
    try {
      await exitImpersonation();
    } catch (err) {
      console.error("Failed to exit impersonation:", err);
    } finally {
      setExitingImpersonation(false);
    }
  };

  const initials = admin?.name
    ? admin.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  const roleLabel = admin?.role === "staff" ? "Staff" : "Admin";
  const isImpersonating = admin?.impersonation?.active === true;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <>
      {/* ── Impersonation Banner ─────────────────────────────────────────── */}
      {isImpersonating && (
        <div
          className="fixed top-0 left-0 lg:left-64 right-0 z-[60] flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5"
          style={{
            background: "linear-gradient(90deg, #b45309 0%, #d97706 50%, #f59e0b 100%)",
            minHeight: "36px",
          }}
        >
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-white flex-shrink-0" strokeWidth={2} />
            <span className="text-xs font-semibold text-white">
              Impersonating:{" "}
              <span className="font-bold">{admin?.name}</span>
              <span className="font-normal opacity-80 ml-1">({admin?.email})</span>
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            disabled={exitingImpersonation}
            title="Exit Impersonation"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-colors disabled:opacity-60"
          >
            <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">
              {exitingImpersonation ? "Exiting…" : "Exit Impersonation"}
            </span>
          </button>
        </div>
      )}

      {/* ── Main Top Bar ─────────────────────────────────────────────────── */}
      <header
        className="min-h-16 bg-[var(--brand-orange)] fixed left-0 lg:left-64 right-0 z-30 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 py-2 lg:py-0"
        style={{
          top: isImpersonating ? "36px" : "0px",
        }}
      >
        <button onClick={onMenuToggle} className="order-1 rounded-lg p-2 text-white hover:bg-white/20 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        {/* Left — Search */}
        <div className="order-2 w-full lg:order-1 lg:w-auto flex items-center gap-3 flex-1 max-w-none lg:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder={config.placeholder}
              className="w-full pl-10 pr-10 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 text-sm transition-colors"
            />
            {query && (
              <button
                onClick={clearQuery}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Right — user info + logout */}
        {admin && (
          <div className="order-1 lg:order-2 ml-auto flex items-center gap-3 flex-shrink-0">
            {/* Avatar + name */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none ring-1 ring-white/30 ${
                  isImpersonating ? "bg-amber-600/60" : "bg-white/20"
                }`}
              >
                {initials}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {admin.name}
                </span>
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  {isImpersonating ? "Impersonated Staff" : roleLabel}
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
    </>
  );
}
