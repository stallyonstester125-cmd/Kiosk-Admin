"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Loader2, X, Receipt, ShoppingBag, Download, ChevronDown, FileText, FileSpreadsheet, Sheet } from "lucide-react";
import { fetchOrders, Order, downloadTransactionsReport } from "@/lib/admin-api";
import { useSearch } from "@/context/SearchContext";

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { query, filteredData } = useSearch();
  const filteredOrders = useMemo(() => {
    const filtered = filteredData(orders);
    const q = query.toLowerCase().trim();
    if (!q) return filtered;
    return filtered.filter(
      (order) =>
        (typeof order.customerName === "string" && order.customerName.toLowerCase().includes(q)) ||
        (order.orderNumber !== undefined && order.orderNumber !== null && order.orderNumber.toString().toLowerCase().includes(q)) ||
        (typeof order.paymentMethod === "string" && order.paymentMethod.toLowerCase().includes(q)) ||
        (order.coupon_code && order.coupon_code.toLowerCase().includes(q)) ||
        (order.total !== undefined && order.total !== null && order.total.toString().toLowerCase().includes(q))
    );
  }, [orders, filteredData, query]);

  useEffect(() => {
    setPage(1);
  }, [filteredOrders.length]);

  // Hide AI Help Chat when any overlay is open
  useEffect(() => {
    if (typeof window !== "undefined") {
      const anyModalOpen = !!selectedOrder;
      window.dispatchEvent(
        new CustomEvent("edit-modal-state-change", {
          detail: { isEditing: anyModalOpen },
        })
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("edit-modal-state-change", {
            detail: { isEditing: false },
          })
        );
      }
    };
  }, [selectedOrder]);

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

  useEffect(() => {
    void loadData();
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleExport = async (exportType: "csv" | "xlsx" | "pdf") => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const params: Record<string, string> = { exportType };
      if (query) params.search = query;
      await downloadTransactionsReport(params);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const currentRows = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={() => void loadData()}
          className="mt-4 rounded-lg bg-[var(--brand-orange)] px-4 py-2 text-white hover:bg-[var(--brand-orange-hover)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Transaction and Analytics</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              View sales histories, applied coupons, and order invoice summaries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                id="transactions-export-btn"
                onClick={() => setShowExportMenu((v) => !v)}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? "Exporting..." : "Export"}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              {showExportMenu && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 lg:right-0 lg:left-auto">
                  <button
                    id="transactions-export-csv"
                    onClick={() => void handleExport("csv")}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <FileText className="h-4 w-4 text-green-600" />
                    Export as CSV
                  </button>
                  <button
                    id="transactions-export-xlsx"
                    onClick={() => void handleExport("xlsx")}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <Sheet className="h-4 w-4 text-emerald-600" />
                    Export as Excel
                  </button>
                  <button
                    id="transactions-export-pdf"
                    onClick={() => void handleExport("pdf")}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-red-500" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" aria-label="Breadcrumb">
              <span>Home</span>
              <span>/</span>
              <span className="font-medium">Transaction and Analytics</span>
            </nav>
          </div>
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
                <thead className="bg-[var(--brand-orange)] text-xs font-semibold uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Order Number</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Coupon</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Final Total</th>
                    <th className="px-6 py-4">Payment Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {currentRows.map((order) => (
                    <tr 
                      key={order._id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {fullDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                        {order.orderType === "eat-in" ? "Dine In" : order.orderType === "take-away" ? "Take Away" : "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--brand-orange)]">
                        {order.coupon_code || "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                        {order.discount_amount ? `-${money(order.discount_amount)}` : "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                        {money(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-zinc-500">
                        No matching transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-6 py-3 dark:border-zinc-700 pb-20 lg:pb-0">
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

      {/* Order Detail Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        style={{ display: selectedOrder ? "flex" : "none" }}
      >
        <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-100 dark:border-zinc-700 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-700 mb-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[var(--brand-orange)]" />
              Order #{selectedOrder?.orderNumber}
            </h3>
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600"
            >
              <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer & Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl">
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block text-xs uppercase tracking-wider">Customer</span>
                  <span className="text-zinc-900 dark:text-white font-medium">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block text-xs uppercase tracking-wider">Date</span>
                  <span className="text-zinc-950 dark:text-white">{fullDate(selectedOrder.createdAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block text-xs uppercase tracking-wider">Type</span>
                  <span>{selectedOrder.orderType === "eat-in" ? "Dine In" : selectedOrder.orderType === "take-away" ? "Take Away" : "—"}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block text-xs uppercase tracking-wider">Status</span>
                  <span className="capitalize font-semibold text-[var(--brand-orange)]">{selectedOrder.status}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-zinc-400" /> Ordered Items
                </h4>
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-700">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-start text-sm bg-white dark:bg-zinc-800">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-white">{item.name}</span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-bold ml-1.5">× {item.quantity}</span>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="mt-1 ml-3 border-l-2 border-zinc-200 dark:border-zinc-700 pl-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {item.customizations.map((g, gIdx) => (
                              <div key={gIdx}>
                                <span className="font-semibold">{g.groupTitle}:</span> {g.options.map(o => o.name).join(", ")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">{money(item.basePrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price calculation block */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    {money(selectedOrder.subtotal_before_discount ?? selectedOrder.subtotal)}
                  </span>
                </div>

                {selectedOrder.coupon_code && (
                  <>
                    <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                      <span className="flex items-center gap-1">
                        Coupon Used ({selectedOrder.coupon_code})
                      </span>
                      <span>
                        -{money(selectedOrder.discount_amount ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-xs pl-2">
                      <span>Discounted Subtotal</span>
                      <span>
                        {money(selectedOrder.subtotal_after_discount ?? (selectedOrder.subtotal - (selectedOrder.discount_amount ?? 0)))}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Tax (10% inclusive/after discount)</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    {money(selectedOrder.tax_after_discount ?? selectedOrder.tax)}
                  </span>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 flex justify-between text-base font-bold">
                  <span className="text-zinc-900 dark:text-white">Grand Total</span>
                  <span className="text-lg text-[var(--brand-orange)]">
                    {money(selectedOrder.grand_total ?? selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 text-xs text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
                <span>Payment Method: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{selectedOrder.paymentMethod}</strong></span>
                <span>Payment Status: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{selectedOrder.paymentStatus}</strong></span>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
