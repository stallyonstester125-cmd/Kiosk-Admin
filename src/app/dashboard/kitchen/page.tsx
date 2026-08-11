"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, RefreshCw, Clock, UtensilsCrossed } from "lucide-react";
import { fetchKitchenOrders, fetchCompletedOrders, updateOrderStatus, Order } from "@/lib/admin-api";
import { useSearch } from "@/context/SearchContext";

// ─── Status config ────────────────────────────────────────────────────────────
type KitchenStatus = "received" | "confirmed" | "preparing" | "ready" | "completed";

const STATUS_CONFIG: Record<KitchenStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  received: {
    label: "Received",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  preparing: {
    label: "Preparing",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  ready: {
    label: "Ready",
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
};

// FIFO next-step map (matches server-side ALLOWED_TRANSITIONS)
const NEXT_STATUS: Record<KitchenStatus, KitchenStatus | "completed" | null> = {
  received: "confirmed",
  confirmed: "completed",
  preparing: "completed",
  ready: "completed",
  completed: null,
};

const NEXT_LABEL: Record<string, string> = {
  received: "Confirm Order",
  confirmed: "Mark Completed",
  preparing: "Mark Completed",
  ready: "Mark Completed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function elapsedTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function isKitchenStatus(s: string): s is KitchenStatus {
  return ["received", "confirmed", "preparing", "ready", "completed"].includes(s);
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onAdvance,
  advancing,
}: {
  order: Order;
  onAdvance: (id: string, next: string) => void;
  advancing: boolean;
}) {
  const status = order.status as KitchenStatus;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.received;
  const next = isKitchenStatus(status) ? NEXT_STATUS[status] : null;

  return (
    <div
      className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 flex flex-col gap-4 shadow-sm transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {order.orderType === "eat-in" ? "Dine In" : order.orderType === "take-away" ? "Take Away" : "—"}
          </p>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
            #{order.orderNumber}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{order.customerName}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.text} bg-white/60 dark:bg-black/20 border ${cfg.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {cfg.label}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Clock className="w-3.5 h-3.5" />
        <span>
          {order.status === "completed"
            ? `Completed ${order.completedAt ? elapsedTime(order.completedAt) : elapsedTime(order.updatedAt)}`
            : elapsedTime(order.createdAt)}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5 border-t border-zinc-200 dark:border-zinc-700 pt-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-start text-sm">
            <span className="text-zinc-700 dark:text-zinc-200 font-medium">{item.name}{item.customizations?.flatMap((group) => group.options).length ? <span className="mt-1 block text-xs font-normal text-zinc-500">{item.customizations.flatMap((group) => group.options.map((option) => option.name)).join(', ')}</span> : null}</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-semibold">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Payment badge */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            order.paymentStatus === "paid"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {order.paymentMethod === "card" ? "💳 Card" : "💵 Cash"}
        </span>
        {order.paymentStatus === "paid" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Paid
          </span>
        )}
      </div>

      {/* Action button */}
      {next && (
        <button
          onClick={() => onAdvance(order._id, next)}
          disabled={advancing}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            status === "confirmed" || status === "preparing" || status === "ready"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100"
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {advancing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          {NEXT_LABEL[status] ?? "Advance"}
        </button>
      )}
    </div>
  );
}

// ─── Filter tab ───────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all", label: "All Active" },
  { key: "received", label: "Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KitchenPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());


  const { filteredData } = useSearch();

  const displayOrders = useMemo(() => {
    const list = filter === "completed" ? completedOrders : activeOrders;
    const searchFiltered = filteredData(list);
    if (filter === "all" || filter === "completed") {
      return searchFiltered;
    }
    return searchFiltered.filter((o) => o.status === filter);
  }, [filter, activeOrders, completedOrders, filteredData]);

  const loadOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const [activeData, completedData] = await Promise.all([
        fetchKitchenOrders(),
        fetchCompletedOrders(),
      ]);

      setActiveOrders(activeData);
      setCompletedOrders(completedData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load kitchen orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling every 8 seconds
  useEffect(() => {
    void loadOrders();
    const interval = setInterval(() => void loadOrders(true), 8000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleAdvance = async (orderId: string, nextStatus: string) => {
    setAdvancing(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus as Order["status"]);
      // Refresh immediately after a status change
      await loadOrders(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setAdvancing(null);
    }
  };

  const countByStatus = (s: string) => {
    if (s === "completed") {
      return filteredData(completedOrders).length;
    }
    return filteredData(activeOrders).filter((o) => o.status === s).length;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]">
            Kitchen
          </span>
          <div className="flex items-center gap-2 mt-1">
            <UtensilsCrossed className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Kitchen Queue</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Auto-refreshes every 8s · Last updated {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => void loadOrders()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Status summary strip */}
      <div className="grid grid-cols-2 gap-3">
        {(["received", "confirmed"] as KitchenStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = countByStatus(s);
          return (
            <div
              key={s}
              className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 text-center`}
            >
              <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 opacity-60">({countByStatus(tab.key)})</span>
            )}
          </button>
        ))}
      </div>

      {/* Order grid — FIFO (oldest first, from API) */}
      {displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <UtensilsCrossed className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-400 dark:text-zinc-500 text-lg font-medium">
            {filter === "completed" ? "No completed orders" : "No active orders"}
          </p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">
            {filter === "completed"
              ? "Completed orders will be listed here"
              : "New orders will appear here automatically"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {displayOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onAdvance={handleAdvance}
              advancing={advancing === order._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
