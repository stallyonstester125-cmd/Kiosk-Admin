"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

type SearchConfig = {
  placeholder: string;
  searchFields: string[];
  filterFn: (data: any[], query: string) => any[];
};

const PAGE_SEARCH_CONFIG: Record<string, SearchConfig> = {
  "/dashboard/products": {
    placeholder: "Search products...",
    searchFields: ["name", "description", "category?.name", "price"],
    filterFn: (data: any[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return data;
      return data.filter((item) =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.name?.toLowerCase().includes(q) ||
        item.price?.toString().includes(q)
      );
    },
  },
  "/dashboard/kitchen": {
    placeholder: "Search orders...",
    searchFields: ["orderNumber", "customerName", "items.name"],
    filterFn: (data: any[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return data;
      return data.filter((item) =>
        item.orderNumber?.toString().toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.items?.some((i: any) => i.name?.toLowerCase().includes(q))
      );
    },
  },
  "/dashboard/transactions": {
    placeholder: "Search transactions...",
    searchFields: ["orderNumber", "customerName", "paymentMethod"],
    filterFn: (data: any[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return data;
      return data.filter((item) =>
        item.orderNumber?.toString().toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.paymentMethod?.toLowerCase().includes(q) ||
        item.total?.toString().includes(q)
      );
    },
  },
  "/dashboard/sales-report": {
    placeholder: "Search sales...",
    searchFields: ["customer", "orderId", "product"],
    filterFn: (data: any[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return data;
      return data.filter((item) =>
        item.customer?.toLowerCase().includes(q) ||
        item.orderId?.toString().toLowerCase().includes(q) ||
        item.product?.toLowerCase().includes(q)
      );
    },
  },
  "/dashboard/staff": {
    placeholder: "Search staff...",
    searchFields: ["name", "email"],
    filterFn: (data: any[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return data;
      return data.filter((item) =>
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q)
      );
    },
  },
  "/dashboard": {
    placeholder: "Search...",
    searchFields: [],
    filterFn: (data: any[], query: string) => data,
  },
};

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  config: SearchConfig;
  filteredData: <T>(data: T[]) => T[];
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  
  const config = PAGE_SEARCH_CONFIG[pathname] || PAGE_SEARCH_CONFIG["/dashboard"];
  
  // Clear query when page changes
  useEffect(() => {
    setQuery("");
  }, [pathname]);

  const clearQuery = useCallback(() => setQuery(""), []);
  
  const filteredData = useCallback(<T,>(data: T[]) => {
    return config.filterFn(data as any[], query) as T[];
  }, [config, query]);

  return (
    <SearchContext.Provider value={{ query, setQuery, clearQuery, config, filteredData }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}