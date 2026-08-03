"use client";


import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, Loader2, Search } from "lucide-react";
import { fetchOrders, Order } from "@/lib/admin-api";

type SalesRow = { id: string; customer: string; orderId: string; product: string; quantity: number; price: number; date: Date };
const PAGE_SIZE = 15;
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const shortDate = (date: Date) => `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

export default function SalesReportPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ field: "date" | "price"; direction: "asc" | "desc" }>({ field: "date", direction: "desc" });

  const loadData = async () => {
    try { setLoading(true); setError(null); setOrders(await fetchOrders()); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load sales data"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadData(); }, []);

  const rows = useMemo(() => orders.flatMap((order) => order.items.map((item: { productId?: string; name: string; quantity: number; basePrice: number }, index: number) => ({ id: `${order._id}-${item.productId ?? index}`, customer: order.customerName, orderId: order.orderNumber, product: item.name, quantity: item.quantity, price: item.basePrice * item.quantity, date: new Date(order.createdAt) }))), [orders]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => !term || row.customer.toLowerCase().includes(term) || row.product.toLowerCase().includes(term)).sort((a, b) => {
      const result = sort.field === "date" ? a.date.getTime() - b.date.getTime() : a.price - b.price;
      return sort.direction === "asc" ? result : -result;
    });
  }, [rows, search, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const netSales = filteredRows.reduce((sum, row) => sum + row.price, 0);
  const toggleSort = (field: "date" | "price") => setSort((current) => ({ field, direction: current.field === field && current.direction === "desc" ? "asc" : "desc" }));

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--brand-orange)]" /></div>;
  if (error) return <div className="py-12 text-center"><p className="text-red-600 dark:text-red-400">Error: {error}</p><button onClick={() => void loadData()} className="mt-4 rounded-lg bg-[var(--brand-orange)] px-4 py-2 text-white hover:bg-[var(--brand-orange-hover)]">Retry</button></div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]">Sales Report</span><nav className="flex items-center gap-2 text-sm text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" aria-label="Breadcrumb"><span>Home</span><span>/</span><span className="font-medium">Sales Report</span></nav></div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search..." className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-zinc-900 outline-none focus:border-[var(--brand-orange)] dark:border-zinc-600 dark:bg-zinc-800 dark:text-white" /></div>
    {rows.length === 0 ? <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-md dark:border-zinc-700 dark:bg-zinc-800"><p className="text-zinc-500 dark:text-zinc-400">No sales data yet</p></div> : <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-800"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40"><tr>{["Customer", "Order ID", "Product", "Quantity"].map((label) => <th key={label} className="px-6 py-4"><span className="inline-flex items-center gap-1">{label}<ChevronDown className="h-3.5 w-3.5" /></span></th>)}<th className="px-6 py-4"><button onClick={() => toggleSort("price")} className="inline-flex items-center gap-1">Price<ArrowUpDown className="h-3.5 w-3.5" /></button></th><th className="px-6 py-4"><button onClick={() => toggleSort("date")} className="inline-flex items-center gap-1">Date<ArrowUpDown className="h-3.5 w-3.5" /></button></th></tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">{currentRows.map((row) => <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30"><td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">{row.customer}</td><td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{row.orderId}</td><td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{row.product}</td><td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{row.quantity}</td><td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">{money(row.price)}</td><td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{shortDate(row.date)}</td></tr>)}{currentRows.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-500">No matching sales data</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-700"><span className="font-semibold text-zinc-900 dark:text-white">Net Sales</span><span className="text-lg font-bold text-green-600 dark:text-green-400">{money(netSales)}</span></div>{pageCount > 1 && <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-6 py-3 dark:border-zinc-700"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded px-3 py-1 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-zinc-500">{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage(page + 1)} className="rounded px-3 py-1 text-sm disabled:opacity-40">Next</button></div>}</div>}
  </div>;
}
