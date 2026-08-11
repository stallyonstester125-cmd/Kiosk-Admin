"use client";


import { useEffect, useState, useMemo } from "react";
import { Edit, Trash2, Plus, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AdminAuthContext";
import { fetchCategories, createCategory, updateCategory, deleteCategory, Category } from "@/lib/admin-api";
import { useSearch } from "@/context/SearchContext";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { filteredData } = useSearch();
  const filteredCategories = useMemo(() => filteredData(categories), [categories, filteredData]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    displayOrder: "",
  });
  
  const [errors, setErrors] = useState<{ name?: string; displayOrder?: string }>({});

  // Hide AI Help Chat and lock body scroll when any overlay is open
  useEffect(() => {
    const anyModalOpen = isModalOpen || !!deletingCategory;
    if (typeof window !== "undefined") {
      if (anyModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      window.dispatchEvent(
        new CustomEvent("edit-modal-state-change", {
          detail: { isEditing: anyModalOpen },
        })
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
        window.dispatchEvent(
          new CustomEvent("edit-modal-state-change", {
            detail: { isEditing: false },
          })
        );
      }
    };
  }, [isModalOpen, deletingCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; displayOrder?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }
    
    if (formData.displayOrder && (parseInt(formData.displayOrder) < 0 || isNaN(parseInt(formData.displayOrder)))) {
      newErrors.displayOrder = "Display order must be a non-negative number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayOrder: "",
    });
    setErrors({});
    setEditingCategory(null);
  };

  const openAddModal = () => {
    setFormData({ name: "", displayOrder: "" });
    setErrors({});
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      displayOrder: category.displayOrder.toString(),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        name: formData.name.trim(),
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
      };
      
      if (editingCategory) {
        await updateCategory(editingCategory._id, {
          name: formData.name.trim(),
          displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
        });
      } else {
        await createCategory({
          name: formData.name.trim(),
          displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteCategory(deletingCategory._id);
      setDeletingCategory(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (category: Category) => {
    setDeletingCategory(category);
  };

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
        <button 
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-[var(--brand-orange)] text-white rounded-lg hover:bg-[var(--brand-orange-hover)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="text-xs font-semibold text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)] uppercase tracking-wider">
          FOOD
        </span>
        <nav className="flex items-center gap-2 text-sm text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" aria-label="Breadcrumb">
          <span>Home</span>
          <span>/</span>
          <span className="font-medium">Menu Layout</span>
          <span>/</span>
          <span className="font-medium">Category</span>
        </nav>
      </div>

      <div className="relative">
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {categories.length === 0 ? "No categories yet" : "No matching categories found"}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {categories.length === 0 ? "Get started by adding your first category" : "Try searching with a different search term"}
            </p>
            {categories.length === 0 && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-orange)] text-white font-semibold rounded-lg hover:bg-[var(--brand-orange-hover)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Display Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider pr-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-zinc-900 dark:text-white">{category.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {category.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[var(--brand-orange-light)] dark:hover:bg-[var(--brand-orange-dark)]/20 hover:text-[var(--brand-orange)] dark:hover:text-[var(--brand-orange-hover)] transition-colors shadow-sm"
                          aria-label="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(category)}
                          className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[var(--brand-orange-light)] dark:hover:bg-[var(--brand-orange-dark)]/20 hover:text-[var(--brand-orange)] dark:hover:text-[var(--brand-orange-hover)] transition-colors shadow-sm"
                          aria-label="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={openAddModal}
        className="fixed bottom-6 right-6 lg:bottom-6 lg:right-6 bottom-6 left-6 lg:right-6 lg:left-auto w-14 h-14 rounded-full bg-[var(--brand-orange)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--brand-orange-hover)] hover:shadow-xl transition-all duration-200 hover:scale-105 z-10"
        aria-label="Add new category"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>

    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden"
      style={{ display: isModalOpen ? "flex" : "none" }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {editingCategory ? "Edit Category" : "Add Category"}
          </h2>
          <button
            onClick={() => { setIsModalOpen(false); resetForm(); }}
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Category Name <span className="text-[var(--brand-orange)]">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.name 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                    : "border-zinc-300 dark:border-zinc-600 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg px-4 py-3 transition-colors`}
                placeholder="Enter category name"
                disabled={isSubmitting}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Display Order
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Controls the order this category appears in the menu — lower numbers appear first
              </p>
              <input
                type="number"
                id="displayOrder"
                value={formData.displayOrder}
                onChange={(e) => handleChange("displayOrder", e.target.value)}
                min="0"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.displayOrder 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                    : "border-zinc-300 dark:border-zinc-600 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg px-4 py-3 transition-colors`}
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.displayOrder && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.displayOrder}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg bg-[var(--brand-orange)] text-white font-semibold hover:bg-[var(--brand-orange-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingCategory ? "Save Changes" : "Save Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden"
      style={{ display: deletingCategory ? "flex" : "none" }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/30">
          <AlertCircle className="w-6 h-6 text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-2">
          Delete Category
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6">
          Are you sure you want to delete <span className="font-medium">{deletingCategory?.name}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeletingCategory(null)}
            className="flex-1 py-3 px-4 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-lg bg-[var(--brand-orange)] text-white font-semibold hover:bg-[var(--brand-orange-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
