"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowUpDown, Loader2, ChevronDown, Percent, Download, FileSpreadsheet, FileText, Sheet } from "lucide-react";
import { fetchOrders, Order, downloadSalesReport } from "@/lib/admin-api";
import { useSearch } from "@/context/SearchContext";

const PAGE_SIZE = 15;
const money = (value: number) => 
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const shortDate = (date: Date) => 
  date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();

export default function SalesReportPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<"low-high" | "high-low">("low-high");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { query, filteredData } = useSearch();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showSortMenu || showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortMenu, showExportMenu]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Map orders to sales rows (Invoice level)
  const rows = useMemo(() => {
    return orders.map((order) => ({
      id: order._id,
      customer: order.customerName,
      orderId: order.orderNumber,
      subtotal: order.subtotal_before_discount ?? order.subtotal,
      couponCode: order.coupon_code || "—",
      discount: order.discount_amount ?? 0,
      tax: order.tax_after_discount ?? order.tax,
      total: order.grand_total ?? order.total,
      date: new Date(order.createdAt),
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      itemsNames: order.items.map((item) => item.name).join(", "),
    }));
  }, [orders]);

  const filteredRows = useMemo(() => {
    const filtered = filteredData(rows);
    const q = query.toLowerCase().trim();
    const matched = q
      ? filtered.filter(
          (item) =>
            (typeof item.customer === "string" && item.customer.toLowerCase().includes(q)) ||
            (item.orderId !== undefined && item.orderId !== null && item.orderId.toString().toLowerCase().includes(q)) ||
            (item.couponCode && item.couponCode.toLowerCase().includes(q)) ||
            (typeof item.itemsNames === "string" && item.itemsNames.toLowerCase().includes(q))
        )
      : filtered;

    return [...matched].sort((a, b) => {
      const result = a.total - b.total;
      return sortOption === "low-high" ? result : -result;
    });
  }, [rows, sortOption, filteredData, query]);

  useEffect(() => {
    setPage(1);
  }, [filteredRows.length]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Totals calculations
  const netSales = filteredRows.reduce((sum, row) => sum + row.total, 0);
  const totalDiscounts = filteredRows.reduce((sum, row) => sum + row.discount, 0);

  const toggleSortMenu = () => setShowSortMenu(!showSortMenu);
  const selectSortOption = (option: "low-high" | "high-low") => {
    setSortOption(option);
    setShowSortMenu(false);
  };

  const handleExport = async (exportType: "csv" | "xlsx" | "pdf") => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      const params: Record<string, string> = { exportType };
      if (query) params.search = query;
      await downloadSalesReport(params);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sales Report</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Analyze gross sales, applied coupon discounts, collected taxes, and net revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              id="sales-export-btn"
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
              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  id="sales-export-csv"
                  onClick={() => void handleExport("csv")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <FileText className="h-4 w-4 text-green-600" />
                  Export as CSV
                </button>
                <button
                  id="sales-export-xlsx"
                  onClick={() => void handleExport("xlsx")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Sheet className="h-4 w-4 text-emerald-600" />
                  Export as Excel
                </button>
                <button
                  id="sales-export-pdf"
                  onClick={() => void handleExport("pdf")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <FileSpreadsheet className="h-4 w-4 text-red-500" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          <nav className="flex items-center gap-2 text-sm text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" aria-label="Breadcrumb">
            <span>Home</span>
            <span>/</span>
            <span className="font-medium">Sales Report</span>
          </nav>
        </div>
      </div>

      {/* Main Table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-md dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400">No sales data yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Invoice (Order ID)</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">Coupon</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Tax (Inclusive)</th>
                  <th className="px-6 py-4 relative">
                    <div className="relative" ref={sortMenuRef}>
                      <button
                        onClick={toggleSortMenu}
                        className="inline-flex items-center gap-1 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                      >
                        Final Total
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                      </button>
                      {showSortMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-10 min-w-[140px]">
                          <button
                            onClick={() => selectSortOption("low-high")}
                            className={`w-full px-3 py-2 text-sm text-left ${sortOption === "low-high" ? "bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/30 text-[var(--brand-orange)] font-medium" : "text-zinc-700 dark:text-zinc-300"} hover:bg-zinc-100 dark:hover:bg-zinc-700`}
                          >
                            Low to High
                          </button>
                          <button
                            onClick={() => selectSortOption("high-low")}
                            className={`w-full px-3 py-2 text-sm text-left ${sortOption === "high-low" ? "bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/30 text-[var(--brand-orange)] font-medium" : "text-zinc-700 dark:text-zinc-300"} hover:bg-zinc-100 dark:hover:bg-zinc-700`}
                          >
                            High to Low
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {currentRows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {row.customer}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {row.orderId}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {money(row.subtotal)}
                    </td>
                    <td className="px-6 py-4 font-bold text-[var(--brand-orange)]">
                      {row.couponCode}
                    </td>
                    <td className="px-6 py-4 text-red-600 dark:text-red-400 font-medium">
                      {row.discount > 0 ? `-${money(row.discount)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {money(row.tax)}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                      {money(row.total)}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {shortDate(row.date)}
                    </td>
                  </tr>
                ))}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-zinc-500">
                      No matching sales data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table summary row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-700 gap-4 bg-zinc-50/50 dark:bg-zinc-900/10">
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
              <div>
                Net Sales: <strong className="text-zinc-900 dark:text-white text-base">{money(netSales)}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                Total Discounts: <strong className="text-green-600 dark:text-green-400 text-base">-{money(totalDiscounts)}</strong>
              </div>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
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
          </div>
        </div>
      )}
    </div>
  );
}