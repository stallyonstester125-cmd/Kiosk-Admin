"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle, 
  Copy, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  Percent, 
  DollarSign, 
  Calendar,
  Ticket
} from "lucide-react";
import { 
  fetchCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  enableCoupon, 
  disableCoupon, 
  duplicateCoupon, 
  Coupon 
} from "@/lib/admin-api";
import { useSearch } from "@/context/SearchContext";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [filterType, setFilterType] = useState<"all" | "percentage" | "fixed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest-discount" | "most-used" | "expiring-soon">("newest");

  const { query } = useSearch();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    percentage: "",
    fixed_amount: "",
    minimum_order: "",
    maximum_discount: "",
    usage_limit: "",
    per_customer_limit: "",
    starts_at: "",
    expires_at: "",
    status: "active",
    first_order_only: false,
    stackable: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Sorted Coupons
  const filteredCoupons = useMemo(() => {
    let result = [...coupons];
    const now = new Date();

    // 1. Search Query
    const q = query.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q) ||
          c.discount_type.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (filterStatus !== "all") {
      if (filterStatus === "expired") {
        result = result.filter((c) => new Date(c.expires_at) < now);
      } else {
        result = result.filter((c) => c.status === filterStatus);
      }
    }

    // 3. Discount Type Filter
    if (filterType !== "all") {
      result = result.filter((c) => c.discount_type === filterType);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "highest-discount") {
        const valA = a.discount_type === "percentage" ? (a.percentage ?? 0) : (a.fixed_amount ?? 0);
        const valB = b.discount_type === "percentage" ? (b.percentage ?? 0) : (b.fixed_amount ?? 0);
        return valB - valA;
      }
      if (sortBy === "most-used") {
        return b.used_count - a.used_count;
      }
      if (sortBy === "expiring-soon") {
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      return 0;
    });

    return result;
  }, [coupons, query, filterStatus, filterType, sortBy]);

  // Form Validations
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required";
    }

    const start = new Date(formData.starts_at);
    const end = new Date(formData.expires_at);

    if (!formData.starts_at) {
      newErrors.starts_at = "Start date is required";
    }

    if (!formData.expires_at) {
      newErrors.expires_at = "Expiry date is required";
    } else if (formData.starts_at && end <= start) {
      newErrors.expires_at = "Expiry date must be after the start date";
    } else if (end.getTime() <= Date.now() && !editingCoupon) {
      newErrors.expires_at = "Cannot create an expired coupon";
    }

    if (formData.discount_type === "percentage") {
      const pct = parseFloat(formData.percentage);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        newErrors.percentage = "Percentage discount must be between 1 and 100";
      }
    } else {
      const amt = parseFloat(formData.fixed_amount);
      if (isNaN(amt) || amt < 0) {
        newErrors.fixed_amount = "Fixed discount cannot be negative";
      }
    }

    if (formData.minimum_order && parseFloat(formData.minimum_order) < 0) {
      newErrors.minimum_order = "Minimum order cannot be negative";
    }

    if (formData.usage_limit && parseInt(formData.usage_limit) < 0) {
      newErrors.usage_limit = "Usage limit cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      percentage: "",
      fixed_amount: "",
      minimum_order: "",
      maximum_discount: "",
      usage_limit: "",
      per_customer_limit: "",
      starts_at: "",
      expires_at: "",
      status: "active",
      first_order_only: false,
      stackable: false,
    });
    setErrors({});
    setEditingCoupon(null);
  };

  const openCreateModal = () => {
    resetForm();
    // Default dates: start is now, expiry is 30 days from now
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);
    
    // Format YYYY-MM-DDTHH:MM
    const startStr = now.toISOString().slice(0, 16);
    const endStr = future.toISOString().slice(0, 16);

    setFormData((prev) => ({
      ...prev,
      starts_at: startStr,
      expires_at: endStr,
    }));
    setIsFormModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    
    // Format dates to YYYY-MM-DDTHH:MM for inputs
    const startStr = new Date(coupon.starts_at).toISOString().slice(0, 16);
    const endStr = new Date(coupon.expires_at).toISOString().slice(0, 16);

    setFormData({
      code: coupon.code,
      description: coupon.description ?? "",
      discount_type: coupon.discount_type,
      percentage: coupon.percentage?.toString() ?? "",
      fixed_amount: coupon.fixed_amount?.toString() ?? "",
      minimum_order: coupon.minimum_order?.toString() ?? "",
      maximum_discount: coupon.maximum_discount?.toString() ?? "",
      usage_limit: coupon.usage_limit?.toString() ?? "",
      per_customer_limit: coupon.per_customer_limit?.toString() ?? "",
      starts_at: startStr,
      expires_at: endStr,
      status: coupon.status,
      first_order_only: coupon.first_order_only,
      stackable: coupon.stackable,
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  const openViewModal = (coupon: Coupon) => {
    setViewingCoupon(coupon);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<Coupon> = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        discount_type: formData.discount_type as "percentage" | "fixed",
        percentage: formData.discount_type === "percentage" ? parseFloat(formData.percentage) : null,
        fixed_amount: formData.discount_type === "fixed" ? parseFloat(formData.fixed_amount) : null,
        minimum_order: formData.minimum_order ? parseFloat(formData.minimum_order) : null,
        maximum_discount: formData.discount_type === "percentage" && formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_customer_limit: formData.per_customer_limit ? parseInt(formData.per_customer_limit) : null,
        starts_at: new Date(formData.starts_at).toISOString(),
        expires_at: new Date(formData.expires_at).toISOString(),
        status: formData.status as "active" | "inactive",
        first_order_only: formData.first_order_only,
        stackable: formData.stackable,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, payload);
      } else {
        await createCoupon(payload);
      }

      setIsFormModalOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCoupon) return;
    setIsDeleting(true);
    setError(null);

    try {
      await deleteCoupon(deletingCoupon._id);
      setDeletingCoupon(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    setError(null);
    try {
      if (coupon.status === "active") {
        await disableCoupon(coupon._id);
      } else {
        await enableCoupon(coupon._id);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleDuplicate = async (coupon: Coupon) => {
    setError(null);
    try {
      await duplicateCoupon(coupon._id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate coupon");
    }
  };

  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-[var(--brand-orange)]" />
              Coupons
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create and manage discount coupons.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-orange)] hover:bg-[var(--brand-orange-hover)] text-white font-semibold rounded-lg shadow transition-colors touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>

        {/* Filters and Sorting bar */}
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg p-2.5 text-zinc-800 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="expired">Expired Only</option>
              </select>
            </div>

            {/* Discount Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Discount Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg p-2.5 text-zinc-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-sm bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg p-2.5 text-zinc-800 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-discount">Highest Discount</option>
                <option value="most-used">Most Used</option>
                <option value="expiring-soon">Expiring Soon</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main error display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Coupons Table */}
        <div className="relative">
          {filteredCoupons.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Ticket className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                {coupons.length === 0 ? "No coupons yet" : "No matching coupons found"}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                {coupons.length === 0 ? "Create your first discount coupon to get started" : "Try adjusting your search filters"}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Coupon Code</th>
                      <th className="px-6 py-4">Discount</th>
                      <th className="px-6 py-4">Min Order</th>
                      <th className="px-6 py-4">Usage Limit</th>
                      <th className="px-6 py-4">Used Count</th>
                      <th className="px-6 py-4">Expires</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
                    {filteredCoupons.map((coupon) => {
                      const isExpired = new Date(coupon.expires_at) < new Date();
                      return (
                        <tr key={coupon._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-900 dark:text-white">
                            {coupon.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                            {coupon.discount_type === "percentage" ? (
                              <span className="flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
                                {coupon.percentage}%
                                {coupon.maximum_discount ? (
                                  <span className="text-xs text-zinc-400 font-normal">
                                    (Max {money(coupon.maximum_discount)})
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <DollarSign className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
                                {coupon.fixed_amount}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                            {coupon.minimum_order ? money(coupon.minimum_order) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                            {coupon.usage_limit ?? "Unlimited"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                            {coupon.used_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                            <span className={isExpired ? "text-red-500 font-medium" : ""}>
                              {formatDateStr(coupon.expires_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isExpired ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                Expired
                              </span>
                            ) : coupon.status === "active" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-700/50 dark:text-zinc-400">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Action */}
                              <button
                                onClick={() => openViewModal(coupon)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors"
                                title="View Coupon"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Action */}
                              <button
                                onClick={() => openEditModal(coupon)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-[var(--brand-orange-light)] hover:text-[var(--brand-orange)] text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors"
                                title="Edit Coupon"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Toggle Status (Enable/Disable) */}
                              <button
                                onClick={() => handleToggleStatus(coupon)}
                                className={`w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-colors ${
                                  coupon.status === "active"
                                    ? "hover:bg-amber-100 text-amber-600"
                                    : "hover:bg-green-100 text-green-600"
                                }`}
                                title={coupon.status === "active" ? "Disable Coupon" : "Enable Coupon"}
                              >
                                {coupon.status === "active" ? (
                                  <ToggleRight className="w-4 h-4" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                              </button>

                              {/* Duplicate Action */}
                              <button
                                onClick={() => handleDuplicate(coupon)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 hover:text-blue-600 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors"
                                title="Duplicate Coupon"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => setDeletingCoupon(coupon)}
                                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-red-100 hover:text-red-600 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-colors"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal (Create/Edit) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        style={{ display: isFormModalOpen ? "flex" : "none" }}
      >
        <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </h2>
            <button
              onClick={() => {
                setIsFormModalOpen(false);
                resetForm();
              }}
              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleFormChange("code", e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.code ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-[var(--brand-orange)]`}
                disabled={isSubmitting}
                required
              />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Optional description of the coupon"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => handleFormChange("discount_type", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  disabled={isSubmitting}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              {formData.discount_type === "percentage" ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Percentage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.percentage}
                    onChange={(e) => handleFormChange("percentage", e.target.value)}
                    min="1"
                    max="100"
                    placeholder="1-100"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.percentage ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                    } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white`}
                    required
                    disabled={isSubmitting}
                  />
                  {errors.percentage && <p className="mt-1 text-xs text-red-500">{errors.percentage}</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.fixed_amount}
                    onChange={(e) => handleFormChange("fixed_amount", e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Amount in dollars"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.fixed_amount ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                    } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white`}
                    required
                    disabled={isSubmitting}
                  />
                  {errors.fixed_amount && <p className="mt-1 text-xs text-red-500">{errors.fixed_amount}</p>}
                </div>
              )}
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Min Order ($)
                </label>
                <input
                  type="number"
                  value={formData.minimum_order}
                  onChange={(e) => handleFormChange("minimum_order", e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Leave blank for none"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.minimum_order ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                  } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white`}
                  disabled={isSubmitting}
                />
                {errors.minimum_order && <p className="mt-1 text-xs text-red-500">{errors.minimum_order}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Max Discount ($)
                </label>
                <input
                  type="number"
                  value={formData.maximum_discount}
                  onChange={(e) => handleFormChange("maximum_discount", e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Percentage only"
                  disabled={formData.discount_type !== "percentage" || isSubmitting}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>

            {/* Usage Limit & Per Customer Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => handleFormChange("usage_limit", e.target.value)}
                  min="1"
                  placeholder="Blank = Unlimited"
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.usage_limit ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                  } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white`}
                  disabled={isSubmitting}
                />
                {errors.usage_limit && <p className="mt-1 text-xs text-red-500">{errors.usage_limit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Per Customer Limit
                </label>
                <input
                  type="number"
                  value={formData.per_customer_limit}
                  onChange={(e) => handleFormChange("per_customer_limit", e.target.value)}
                  min="1"
                  placeholder="Blank = Unlimited"
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Starts At & Expires At */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Start Date/Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => handleFormChange("starts_at", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.starts_at ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                  } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white`}
                  required
                  disabled={isSubmitting}
                />
                {errors.starts_at && <p className="mt-1 text-xs text-red-500">{errors.starts_at}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Expiry Date/Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => handleFormChange("expires_at", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.expires_at ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
                  } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white`}
                  required
                  disabled={isSubmitting}
                />
                {errors.expires_at && <p className="mt-1 text-xs text-red-500">{errors.expires_at}</p>}
              </div>
            </div>

            {/* Checkboxes: First Order, Stackable & Status */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={formData.first_order_only}
                  onChange={(e) => handleFormChange("first_order_only", e.target.checked)}
                  className="rounded border-zinc-300 text-[var(--brand-orange)] focus:ring-[var(--brand-orange)] w-4 h-4"
                  disabled={isSubmitting}
                />
                First Order Only
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={formData.stackable}
                  onChange={(e) => handleFormChange("stackable", e.target.checked)}
                  className="rounded border-zinc-300 text-[var(--brand-orange)] focus:ring-[var(--brand-orange)] w-4 h-4"
                  disabled={isSubmitting}
                />
                Stackable discount
              </label>
            </div>

            {/* Status dropdown */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFormChange("status", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                disabled={isSubmitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-[var(--brand-orange)] hover:bg-[var(--brand-orange-hover)] text-white font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : editingCoupon ? (
                  "Save Changes"
                ) : (
                  "Create Coupon"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* View Coupon Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        style={{ display: isViewModalOpen ? "flex" : "none" }}
      >
        <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-700 mb-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[var(--brand-orange)]" />
              Coupon Details
            </h3>
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                setViewingCoupon(null);
              }}
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600"
            >
              <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {viewingCoupon && (
            <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl font-mono text-center text-lg font-bold text-zinc-950 dark:text-white border border-dashed border-zinc-200 dark:border-zinc-700">
                {viewingCoupon.code}
              </div>

              {viewingCoupon.description && (
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Description</span>
                  <span>{viewingCoupon.description}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Discount Type</span>
                  <span className="capitalize">{viewingCoupon.discount_type}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Discount Value</span>
                  <span>
                    {viewingCoupon.discount_type === "percentage"
                      ? `${viewingCoupon.percentage}%`
                      : money(viewingCoupon.fixed_amount ?? 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Minimum Order</span>
                  <span>{viewingCoupon.minimum_order ? money(viewingCoupon.minimum_order) : "None"}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Maximum Discount</span>
                  <span>
                    {viewingCoupon.discount_type === "percentage" && viewingCoupon.maximum_discount
                      ? money(viewingCoupon.maximum_discount)
                      : "Unlimited"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Usage Limit</span>
                  <span>{viewingCoupon.usage_limit ?? "Unlimited"}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Used Count</span>
                  <span>{viewingCoupon.used_count}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">Per Customer Limit</span>
                  <span>{viewingCoupon.per_customer_limit ?? "Unlimited"}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400 block">First Order Only</span>
                  <span>{viewingCoupon.first_order_only ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Validity Period</span>
                <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateStr(viewingCoupon.starts_at)}
                  <span>to</span>
                  {formatDateStr(viewingCoupon.expires_at)}
                </span>
              </div>

              <div>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingCoupon.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {viewingCoupon.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                setViewingCoupon(null);
              }}
              className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Coupon Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        style={{ display: deletingCoupon ? "flex" : "none" }}
      >
        <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-2">
            Delete Coupon
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6 text-sm">
            Are you sure you want to delete coupon <span className="font-bold text-zinc-950 dark:text-white">{deletingCoupon?.code}</span>? 
            This action will soft delete the coupon and cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingCoupon(null)}
              className="flex-1 py-2.5 px-4 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
