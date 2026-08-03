"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchOrders, Order } from "@/lib/admin-api";

const PAGE_SIZE = 15;

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const fullDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrders();
      // Newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentRows = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={() => void loadData()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
          Transaction and Analytics
        </span>
        <nav className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" aria-label="Breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span className="font-medium">Transaction and Analytics</span>
        </nav>
      </div>

      {/* Table card */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-md dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              {/* Red header band */}
              <thead className="bg-red-600 text-xs font-semibold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-6 py-4">Order Number</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Payment Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {currentRows.map((order) => (
                  <tr key={order._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {fullDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {money(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.paymentMethod === "card"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {capitalize(order.paymentMethod)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-6 py-3 dark:border-zinc-700">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                {page} / {pageCount}
              </span>
              <button
                disabled={page === pageCount}
                onClick={() => setPage(page + 1)}
                className="rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
