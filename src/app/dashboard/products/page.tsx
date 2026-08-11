"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Edit,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AdminAuthContext";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
  Category,
  CustomizationGroup,
} from "@/lib/admin-api";
import { useSearch } from "@/context/SearchContext";

interface FormData {
  name: string;
  price: string;
  categoryId: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
  isActive: boolean;
  customizations: CustomizationGroup[];
}

interface FormErrors {
  name?: string;
  price?: string;
  categoryId?: string;
  description?: string;
  image?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Notify AiHelpChat and lock body scroll when modal opens/closes.
  useEffect(() => {
    const anyModalOpen = isModalOpen || !!deletingProduct;
    if (typeof window !== "undefined") {
      if (anyModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      window.dispatchEvent(
        new CustomEvent("edit-modal-state-change", {
          detail: {
            isEditing: anyModalOpen,
          },
        })
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
        window.dispatchEvent(
          new CustomEvent("edit-modal-state-change", {
            detail: {
              isEditing: false,
            },
          })
        );
      }
    };
  }, [isModalOpen, deletingProduct]);

  const { filteredData } = useSearch();

  const filteredProducts = useMemo(
    () => filteredData(products),
    [products, filteredData]
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: "",
    categoryId: "",
    description: "",
    image: null,
    imagePreview: null,
    isActive: true,
    customizations: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData.filter((c) => c.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);

    try {
      const data = await fetchCategories();
      setCategories(data.filter((c) => c.isActive));
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      loadCategories();
    }
  }, [isModalOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!editingProduct && !formData.image) {
      newErrors.image = "Product image is required";
    }

    formData.customizations.forEach((group, index) => {
      const min = group.required
        ? Math.max(1, group.minSelections)
        : group.minSelections;

      if (
        !group.title.trim() ||
        !group.options.length ||
        group.options.some(
          (option) =>
            !option.name.trim() ||
            !Number.isFinite(option.priceAdd) ||
            option.priceAdd < 0
        ) ||
        (group.maxSelections !== null && group.maxSelections < min)
      ) {
        newErrors.description = `Customization group ${
          index + 1
        } has invalid values`;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        image: "File must be an image",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "Image must be less than 5MB",
      }));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: event.target?.result as string,
      }));

      setErrors((prev) => ({
        ...prev,
        image: undefined,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const updateCustomizations = (
    customizations: CustomizationGroup[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      customizations,
    }));
  };

  const addGroup = () => {
    updateCustomizations([
      ...formData.customizations,
      {
        id: crypto.randomUUID(),
        title: "",
        type: "single",
        required: false,
        minSelections: 0,
        maxSelections: 1,
        isActive: true,
        displayOrder: formData.customizations.length,
        options: [],
      },
    ]);
  };

  const updateGroup = (
    index: number,
    patch: Partial<CustomizationGroup>
  ) => {
    updateCustomizations(
      formData.customizations.map((group, groupIndex) =>
        groupIndex === index
          ? {
              ...group,
              ...patch,
            }
          : group
      )
    );
  };

  const addOption = (groupIndex: number) => {
    updateGroup(groupIndex, {
      options: [
        ...formData.customizations[groupIndex].options,
        {
          id: crypto.randomUUID(),
          name: "",
          priceAdd: 0,
          isActive: true,
          displayOrder:
            formData.customizations[groupIndex].options.length,
        },
      ],
    });
  };

  const updateOption = (
    groupIndex: number,
    optionIndex: number,
    patch: Partial<CustomizationGroup["options"][number]>
  ) => {
    updateGroup(groupIndex, {
      options: formData.customizations[groupIndex].options.map(
        (option, index) =>
          index === optionIndex
            ? {
                ...option,
                ...patch,
              }
            : option
      ),
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      categoryId: "",
      description: "",
      image: null,
      imagePreview: null,
      isActive: true,
      customizations: [],
    });

    setErrors({});
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.category?._id || "",
      description: product.description || "",
      image: null,
      imagePreview: product.image,
      isActive: product.isActive ?? true,

      customizations: (product.customizations || []).map(
        (group, groupIndex) => ({
          ...group,
          minSelections: group.minSelections ?? 0,
          maxSelections:
            group.maxSelections ??
            (group.type === "single" ? 1 : null),
          isActive: group.isActive ?? true,
          displayOrder: group.displayOrder ?? groupIndex,

          options: group.options.map(
            (option, optionIndex) => ({
              ...option,
              isActive: option.isActive ?? true,
              displayOrder:
                option.displayOrder ?? optionIndex,
            })
          ),
        })
      ),
    });

    setErrors({});
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append(
        "category",
        formData.categoryId
      );
      formDataToSend.append(
        "description",
        formData.description
      );
      formDataToSend.append(
        "isActive",
        editingProduct
          ? formData.isActive
            ? "true"
            : "false"
          : "true"
      );

      formDataToSend.append(
        "customizations",
        JSON.stringify(formData.customizations)
      );

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      if (editingProduct) {
        await updateProduct(
          editingProduct._id,
          formDataToSend
        );
      } else {
        await createProduct(formDataToSend);
      }

      resetForm();
      setIsModalOpen(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProduct(deletingProduct._id);

      setDeletingProduct(null);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-red-600 dark:text-red-400">
          Error: {error}
        </p>

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
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="text-xs font-semibold text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)] uppercase tracking-wider">
            FOOD
          </span>

          <nav
            className="flex flex-wrap items-center gap-2 text-sm text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]"
            aria-label="Breadcrumb"
          >
            <span>Home</span>
            <span>/</span>
            <span className="font-medium">Menu Layout</span>
            <span>/</span>
            <span className="font-medium">Product</span>
          </nav>
        </div>

        {/* Product grid */}
        <div className="relative">
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 p-6 sm:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-zinc-400 dark:text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                {products.length === 0
                  ? "No products yet"
                  : "No matching products found"}
              </h3>

              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                {products.length === 0
                  ? "Get started by adding your first product"
                  : "Try searching with a different search term"}
              </p>

              {products.length === 0 && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-orange)] text-white font-semibold rounded-lg hover:bg-[var(--brand-orange-hover)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <article
                  key={product._id}
                  className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Product actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          openEditModal(product)
                        }
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[var(--brand-orange-light)] dark:hover:bg-[var(--brand-orange-dark)]/20 hover:text-[var(--brand-orange)] dark:hover:text-[var(--brand-orange-hover)] transition-colors shadow-sm"
                        aria-label="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          confirmDelete(product)
                        }
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[var(--brand-orange-light)] dark:hover:bg-[var(--brand-orange-dark)]/20 hover:text-[var(--brand-orange)] dark:hover:text-[var(--brand-orange-hover)] transition-colors shadow-sm"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-base line-clamp-1 mb-1">
                      {product.name}
                    </h3>

                    <p className="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 mb-3">
                      {product.description ||
                        "No description"}
                    </p>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <span className="text-lg font-bold text-zinc-900 dark:text-white shrink-0">
                        ${product.price.toFixed(2)}
                      </span>

                      <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize truncate text-right">
                        {product.category?.name ||
                          "Uncategorized"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Add Product floating button */}
        <button
          onClick={openAddModal}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--brand-orange)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--brand-orange-hover)] hover:shadow-xl transition-all duration-200 hover:scale-105 z-10"
          aria-label="Add new product"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-hidden">
          <div
            className="
              bg-white dark:bg-zinc-800
              rounded-xl sm:rounded-2xl
              w-full
              max-w-2xl
              max-h-[96vh] sm:max-h-[90vh]
              overflow-y-auto
              overscroll-contain
            "
          >
            {/* Modal header */}
            <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white truncate">
                {editingProduct
                  ? "Edit Product"
                  : "Add Product"}
              </h2>

              <button
                onClick={closeProductModal}
                className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6"
            >
              {/* Main product information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                {/* Image */}
                <div className="w-full min-w-0">
                  <div className="relative aspect-square w-full max-w-md mx-auto lg:max-w-none rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-700 mb-4">
                    {formData.imagePreview ? (
                      <Image
                        src={formData.imagePreview}
                        alt="Product preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 300px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <label className="w-full block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                      id="product-image"
                      disabled={isSubmitting}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("product-image")
                          ?.click()
                      }
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 font-medium hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] dark:hover:text-[var(--brand-orange-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Product Image
                    </button>
                  </label>

                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.image}
                    </p>
                  )}
                </div>

                {/* Product fields */}
                <div className="w-full min-w-0 space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                    >
                      Product Name{" "}
                      <span className="text-[var(--brand-orange)]">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleChange(
                          "name",
                          e.target.value
                        )
                      }
                      className={`w-full min-w-0 px-4 py-3 rounded-lg border ${
                        errors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-600 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                      } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white transition-colors`}
                      placeholder="Enter product name"
                      disabled={isSubmitting}
                      required
                    />

                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                      >
                        Price ($){" "}
                        <span className="text-[var(--brand-orange)]">
                          *
                        </span>
                      </label>

                      <input
                        type="number"
                        id="price"
                        value={formData.price}
                        onChange={(e) =>
                          handleChange(
                            "price",
                            e.target.value
                          )
                        }
                        step="0.01"
                        min="0.01"
                        className={`w-full min-w-0 px-4 py-3 rounded-lg border ${
                          errors.price
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-zinc-300 dark:border-zinc-600 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                        } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white transition-colors`}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        required
                      />

                      {errors.price && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                      >
                        Category{" "}
                        <span className="text-[var(--brand-orange)]">
                          *
                        </span>
                      </label>

                      <select
                        id="category"
                        value={formData.categoryId}
                        onChange={(e) =>
                          handleChange(
                            "categoryId",
                            e.target.value
                          )
                        }
                        className={`w-full min-w-0 px-4 py-3 rounded-lg border ${
                          errors.categoryId
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-zinc-300 dark:border-zinc-600 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                        } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white transition-colors`}
                        disabled={
                          isSubmitting ||
                          categoriesLoading
                        }
                        required
                      >
                        <option value="">
                          Select a category
                        </option>

                        {categoriesLoading ? (
                          <option value="" disabled>
                            Loading categories...
                          </option>
                        ) : (
                          categories.map((category) => (
                            <option
                              key={category._id}
                              value={category._id}
                            >
                              {category.name}
                            </option>
                          ))
                        )}
                      </select>

                      {errors.categoryId && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.categoryId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                    >
                      Description{" "}
                      <span className="text-[var(--brand-orange)]">
                        *
                      </span>
                    </label>

                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleChange(
                          "description",
                          e.target.value
                        )
                      }
                      rows={4}
                      className={`w-full min-w-0 px-4 py-3 rounded-lg border ${
                        errors.description
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 dark:border-zinc-600 focus:border-[var(--brand-orange)] focus:ring-[var(--brand-orange)]"
                      } bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white transition-colors resize-none`}
                      placeholder="Enter product description"
                      disabled={isSubmitting}
                      required
                    />

                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customizations */}
              <section className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-700">
                {/* Responsive customization header */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      Customizations
                    </h3>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-5">
                      Optional choices shown with this
                      product in the kiosk.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addGroup}
                    disabled={isSubmitting}
                    className="self-start sm:self-auto shrink-0 rounded-lg border border-[var(--brand-orange)] px-3 py-2 text-sm font-semibold text-[var(--brand-orange)] hover:bg-[var(--brand-orange-light)] transition-colors disabled:opacity-50"
                  >
                    + Add Group
                  </button>
                </div>

                {/* Groups */}
                <div className="space-y-4">
                  {formData.customizations.map(
                    (group, groupIndex) => (
                      <div
                        key={group.id}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 sm:p-4 min-w-0 overflow-hidden"
                      >
                        {/* Group title / delete */}
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            Customization Group{" "}
                            {groupIndex + 1}
                          </h4>

                          <button
                            type="button"
                            onClick={() =>
                              updateCustomizations(
                                formData.customizations.filter(
                                  (_, index) =>
                                    index !== groupIndex
                                )
                              )
                            }
                            className="self-start sm:self-auto shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Delete group
                          </button>
                        </div>

                        {/* Group fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                          <input
                            value={group.title}
                            onChange={(event) =>
                              updateGroup(groupIndex, {
                                title: event.target.value,
                              })
                            }
                            placeholder="Group name, e.g. Choose Your Cheese"
                            className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                          />

                          <select
                            value={group.type}
                            onChange={(event) =>
                              updateGroup(groupIndex, {
                                type: event.target
                                  .value as CustomizationGroup["type"],
                                maxSelections:
                                  event.target.value ===
                                  "single"
                                    ? 1
                                    : group.maxSelections,
                              })
                            }
                            className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                          >
                            <option value="single">
                              Single choice
                            </option>
                            <option value="multiple">
                              Multiple choice
                            </option>
                          </select>

                          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 min-w-0">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(event) =>
                                updateGroup(groupIndex, {
                                  required:
                                    event.target.checked,
                                  minSelections:
                                    event.target.checked
                                      ? Math.max(
                                          1,
                                          group.minSelections
                                        )
                                      : group.minSelections,
                                })
                              }
                              className="shrink-0"
                            />

                            <span>Required</span>
                          </label>

                          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 min-w-0">
                            <input
                              type="checkbox"
                              checked={group.isActive}
                              onChange={(event) =>
                                updateGroup(groupIndex, {
                                  isActive:
                                    event.target.checked,
                                })
                              }
                              className="shrink-0"
                            />

                            <span>Active</span>
                          </label>

                          {group.type === "multiple" && (
                            <>
                              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 min-w-0">
                                <span className="shrink-0">
                                  Min
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  value={group.minSelections}
                                  onChange={(event) =>
                                    updateGroup(
                                      groupIndex,
                                      {
                                        minSelections:
                                          Number(
                                            event.target
                                              .value
                                          ),
                                      }
                                    )
                                  }
                                  className="w-20 max-w-full rounded-lg border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                                />
                              </label>

                              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 min-w-0">
                                <span className="shrink-0">
                                  Max
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    group.maxSelections ??
                                    ""
                                  }
                                  onChange={(event) =>
                                    updateGroup(
                                      groupIndex,
                                      {
                                        maxSelections:
                                          event.target
                                            .value === ""
                                            ? null
                                            : Number(
                                                event.target
                                                  .value
                                              ),
                                      }
                                    )
                                  }
                                  className="w-20 max-w-full rounded-lg border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                                />
                              </label>
                            </>
                          )}
                        </div>

                        {/* Options */}
                        <div className="mt-4 space-y-3">
                          {group.options.map(
                            (option, optionIndex) => (
                              <div
                                key={option.id}
                                className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 min-w-0"
                              >
                                {/* Option inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px] gap-2 min-w-0">
                                  <input
                                    value={option.name}
                                    onChange={(event) =>
                                      updateOption(
                                        groupIndex,
                                        optionIndex,
                                        {
                                          name: event.target
                                            .value,
                                        }
                                      )
                                    }
                                    placeholder="Option name"
                                    className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                                  />

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={option.priceAdd}
                                    onChange={(event) =>
                                      updateOption(
                                        groupIndex,
                                        optionIndex,
                                        {
                                          priceAdd: Number(
                                            event.target
                                              .value
                                          ),
                                        }
                                      )
                                    }
                                    className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                                    placeholder="Price"
                                  />
                                </div>

                                {/* Option actions */}
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={
                                        option.isActive
                                      }
                                      onChange={(event) =>
                                        updateOption(
                                          groupIndex,
                                          optionIndex,
                                          {
                                            isActive:
                                              event.target
                                                .checked,
                                          }
                                        )
                                      }
                                    />

                                    <span>Active</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateGroup(
                                        groupIndex,
                                        {
                                          options:
                                            group.options.filter(
                                              (_, index) =>
                                                index !==
                                                optionIndex
                                            ),
                                        }
                                      )
                                    }
                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* Add option */}
                        <button
                          type="button"
                          onClick={() =>
                            addOption(groupIndex)
                          }
                          disabled={isSubmitting}
                          className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--brand-orange)] hover:text-[var(--brand-orange-hover)] disabled:opacity-50"
                        >
                          + Add Option
                        </button>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* Footer actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={closeProductModal}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[var(--brand-orange)] text-white font-semibold hover:bg-[var(--brand-orange-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    "Save Changes"
                  ) : (
                    "Save Upload"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--brand-orange-light)] dark:bg-[var(--brand-orange-dark)]/30">
              <AlertCircle className="w-6 h-6 text-[var(--brand-orange)] dark:text-[var(--brand-orange-hover)]" />
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-2">
              Delete Product
            </h3>

            <p className="text-zinc-600 dark:text-zinc-400 text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {deletingProduct?.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() =>
                  setDeletingProduct(null)
                }
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
      )}
    </>
  );
}