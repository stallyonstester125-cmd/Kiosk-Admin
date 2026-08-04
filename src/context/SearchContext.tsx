"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

type SearchConfig = {
  placeholder: string;
  searchFields: string[];
  filterFn: (data: any[], query: string) => any[];
};

const IGNORED_KEYS = new Set([
  "_id",
  "id",
  "productId",
  "groupId",
  "createdAt",
  "updatedAt",
  "__v",
  "image",
  "imagePreview",
  "password",
  "hash",
  "token",
]);

const genericFilter = (data: any[], query: string) => {
  const q = query.toLowerCase().trim();
  if (!q) return data;
  return data.filter((item) => {
    if (!item) return false;
    return Object.entries(item).some(([key, val]) => {
      if (IGNORED_KEYS.has(key)) return false;
      if (val === null || val === undefined) return false;
      if (typeof val === "string" || typeof val === "number") {
        return val.toString().toLowerCase().includes(q);
      }
      if (Array.isArray(val)) {
        return val.some((subItem) => {
          if (typeof subItem === "string" || typeof subItem === "number") {
            return subItem.toString().toLowerCase().includes(q);
          }
          if (subItem && typeof subItem === "object") {
            return Object.entries(subItem).some(
              ([subKey, subVal]) =>
                !IGNORED_KEYS.has(subKey) &&
                (typeof subVal === "string" || typeof subVal === "number") &&
                subVal.toString().toLowerCase().includes(q)
            );
          }
          return false;
        });
      }
      if (typeof val === "object") {
        return Object.entries(val).some(
          ([subKey, subVal]) =>
            !IGNORED_KEYS.has(subKey) &&
            (typeof subVal === "string" || typeof subVal === "number") &&
            subVal.toString().toLowerCase().includes(q)
        );
      }
      return false;
    });
  });
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
        (typeof item.category === "string" ? item.category.toLowerCase().includes(q) : item.category?.name?.toLowerCase().includes(q)) ||
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
        (Array.isArray(item.items) && item.items.some((i: any) => i.name?.toLowerCase().includes(q)))
      );
    },
  },
  "/dashboard/transactions": {
    placeholder: "Search transactions...",
    searchFields: ["orderNumber", "customerName", "paymentMethod", "total"],
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
  "/dashboard/categories": {
    placeholder: "Search categories...",
    searchFields: ["name", "displayOrder"],
    filterFn: (data: any[], query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return data;
      return data.filter((item) =>
        item.name?.toLowerCase().includes(q) ||
        item.displayOrder?.toString().includes(q)
      );
    },
  },
  "/dashboard": {
    placeholder: "Search...",
    searchFields: [],
    filterFn: genericFilter,
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
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  
  // Mark as client after mount to avoid static generation issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  const cleanPath = pathname
    ? pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname
    : "/dashboard";

  const defaultConfig: SearchConfig = {
    placeholder: "Search...",
    searchFields: [],
    filterFn: genericFilter,
  };
  
  const config = isClient
    ? PAGE_SEARCH_CONFIG[cleanPath] || defaultConfig
    : PAGE_SEARCH_CONFIG["/dashboard"] || defaultConfig;
  
  // Clear query when page changes
  useEffect(() => {
    if (isClient) {
      setQuery("");
    }
  }, [cleanPath, isClient]);

  const clearQuery = useCallback(() => setQuery(""), []);
  
  const filteredData = useCallback(<T,>(data: T[]) => {
    if (!data || !Array.isArray(data)) return [];
    const q = query.toLowerCase().trim();
    if (!q) return data;
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