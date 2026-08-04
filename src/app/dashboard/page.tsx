"use client";


import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchOrders, fetchProducts, Order, Product } from "@/lib/admin-api";

const ACCENT_COLOR = "#C41E3A";
const CHART_LINE_COLOR = "#FFA600";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function groupOrdersByTime(orders: Order[]) {
  if (orders.length === 0) return [];

  const now = new Date();
  const oldest = new Date(Math.min(...orders.map((o) => new Date(o.createdAt).getTime())));
  const daysDiff = Math.ceil((now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));

  const groupByMonth = daysDiff > 60;

  const groups = new Map<string, { count: number; total: number }>();

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    let key: string;

    if (groupByMonth) {
      key = date.toLocaleString("default", { month: "short", year: "2-digit" });
    } else {
      key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    const existing = groups.get(key) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += order.total;
    groups.set(key, existing);
  });

  return Array.from(groups.entries())
    .map(([name, value]) => ({ name, ...value }))
    .slice(-12);
}

function getCurrentMonthOrders(orders: Order[]): Order[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return orders.filter((order) => {
    const date = new Date(order.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
}

function ChartGradient() {
  return (
    <svg width="0" height="0">
      <defs>
        <linearGradient id="transactionGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_LINE_COLOR} stopOpacity={0.3} />
          <stop offset="100%" stopColor={CHART_LINE_COLOR} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersData, productsData] = await Promise.all([fetchOrders(), fetchProducts()]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const chartData = groupOrdersByTime(orders);
  const currentMonthOrders = getCurrentMonthOrders(orders);
  const totalOrders = orders.length;
  const monthlyOrdersCount = currentMonthOrders.length;
  const monthlySalesTotal = currentMonthOrders.reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ChartGradient />
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Transaction Graph</h3>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">2026</span>
        </div>

        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: "#9ca3af", fontSize: "12px" }}
                  formatter={(value: any) => [value ?? 0, "Orders"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_LINE_COLOR}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#transactionGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-zinc-500 dark:text-zinc-400">No order data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <Image
              src="/images/OrderRecieved.png"
              alt="Order Received"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">{formatNumber(totalOrders)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Order Received</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <Image
              src="/images/MonthlyTransactons.png"
              alt="Monthly Transactions"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">{formatNumber(monthlyOrdersCount)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Monthly Transactions</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <Image
              src="/images/monthly-sales.png"
              alt="Monthly Sales"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
          <div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">Total: {formatCurrency(monthlySalesTotal)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">monthly sales</p>
          </div>
        </div>
      </div>
    </div>
  );
}