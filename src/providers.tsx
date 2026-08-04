"use client";

import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { SearchProvider } from "@/context/SearchContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <SearchProvider>
        {children}
      </SearchProvider>
    </AdminAuthProvider>
  );
}