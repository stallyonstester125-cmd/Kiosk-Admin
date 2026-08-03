"use client";


import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">404</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Page not found</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-orange)] text-white font-semibold rounded-lg hover:bg-[var(--brand-orange-hover)] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}