"use client";

import { useState } from "react";
import { Banknote, CreditCard, ChevronRight } from "lucide-react";

type PaymentMethod = "cash" | "card";

export default function PaymentSettingsPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [tipEnabled, setTipEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
          Payment Settings
        </span>
        <nav className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" aria-label="Breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span className="font-medium">Payment Settings</span>
        </nav>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-800">
        {/* Section: Payments */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Payments</h2>
        </div>

        {/* Cash row */}
        <button
          type="button"
          onClick={() => setSelectedMethod("cash")}
          className="flex w-full items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/40 focus:outline-none"
          aria-pressed={selectedMethod === "cash"}
        >
          {/* Icon */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
          </span>

          {/* Label */}
          <span className="flex-1 text-left text-sm font-medium text-zinc-900 dark:text-white">Cash</span>

          {/* Radio dot */}
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
              selectedMethod === "cash"
                ? "border-red-600 bg-red-600"
                : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
            }`}
          >
            {selectedMethod === "cash" && (
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            )}
          </span>
        </button>

        {/* Divider */}
        <div className="mx-6 border-t border-zinc-100 dark:border-zinc-700" />

        {/* Card row */}
        <button
          type="button"
          onClick={() => setSelectedMethod("card")}
          className="flex w-full items-center gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/40 focus:outline-none"
          aria-pressed={selectedMethod === "card"}
        >
          {/* Icon */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </span>

          {/* Label */}
          <span className="flex-1 text-left text-sm font-medium text-zinc-900 dark:text-white">Card</span>

          {/* Radio dot */}
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
              selectedMethod === "card"
                ? "border-red-600 bg-red-600"
                : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
            }`}
          >
            {selectedMethod === "card" && (
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            )}
          </span>
        </button>

        {/* Divider before Tip */}
        <div className="mx-6 border-t border-zinc-200 dark:border-zinc-700" />

        {/* Tip row */}
        <div className="flex w-full items-center gap-4 px-6 py-4">
          {/* Icon placeholder area for alignment */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ChevronRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </span>

          {/* Label */}
          <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-white">Tip</span>

          {/* Surcharge label + toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">surcharge</span>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={tipEnabled}
              onClick={() => setTipEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                tipEnabled
                  ? "bg-green-500 focus:ring-green-500"
                  : "bg-zinc-300 focus:ring-zinc-400 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  tipEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="pb-2" />
      </div>
    </div>
  );
}
