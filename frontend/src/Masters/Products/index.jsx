import React, { useState, useEffect, useMemo, useCallback } from 'react';
import productService, { SEED_PRODUCT_CATEGORIES, SEED_UNITS } from '../../services/productService.js';
import TableActionMenu from '../../TableActionMenu.jsx';
import './products.css';

// ─── Category Helper Functions ───────────────────────────────────────────────
function getCategorySlug(categoryName = '') {
  const c = String(categoryName).toLowerCase();
  if (c.includes('seed')) return 'seeds';
  if (c.includes('fertil')) return 'fertilizers';
  if (c.includes('pestic')) return 'pesticides';
  if (c.includes('spray') || c.includes('chem')) return 'sprayer-chemicals';
  if (c.includes('part')) return 'spare-parts';
  return 'other-consumables';
}

function renderCategoryIcon(slug) {
  switch (slug) {
    case 'seeds':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-9" />
          <path d="M12 13a5 5 0 0 0 5-5c0-4-5-6-5-6s-5 2-5 6a5 5 0 0 0 5 5z" />
          <path d="M12 17c-2 0-3.5 1-4.5 2.5" />
        </svg>
      );
    case 'fertilizers':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31M14 2v7.31" />
          <path d="M8.5 2h7" />
          <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
          <path d="M5.52 16h12.96" />
        </svg>
      );
    case 'pesticides':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'sprayer-chemicals':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
    case 'spare-parts':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
  }
}

// ─── Format Currency ─────────────────────────────────────────────────────────
function formatINR(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(num);
}

// ─── Main Products Master Component ──────────────────────────────────────────
export default function Products({ onNavigate }) {
  // State: Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(SEED_PRODUCT_CATEGORIES);
  const [units, setUnits] = useState(SEED_UNITS);
  const [loading, setLoading] = useState(true);

  // State: Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // State: Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // State: Modals
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [deactivateProduct, setDeactivateProduct] = useState(null);

  // State: Form State & Validation
  const initialFormState = {
    code: '',
    name: '',
    categoryId: 1,
    unitId: 5,
    standardCost: '',
    reorderLevel: '',
    description: '',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State: Feedback Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catList, unitList, prodList] = await Promise.all([
        productService.getCategories(),
        productService.getUnits(),
        productService.getProducts()
      ]);
      setCategories(catList);
      setUnits(unitList);
      setProducts(prodList);
    } catch {
      showToast('Could not load products. Using local catalog.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Filtered Data ─────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.code?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.unitName?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (p) => String(p.categoryId) === String(selectedCategory) || p.categoryName === selectedCategory
      );
    }

    // Status filter
    if (selectedStatus !== 'All') {
      result = result.filter((p) => p.status === selectedStatus);
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  // ─── Pagination Calculations ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // ─── Summary Statistics ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === 'Active').length;
    const inactive = products.filter((p) => p.status === 'Inactive').length;
    const categoryCount = new Set(products.map((p) => p.categoryId)).size;
    return { total, active, inactive, categoryCount };
  }, [products]);

  // ─── Form Handlers ─────────────────────────────────────────────────────────
  const openAddModal = async () => {
    let nextCode = '';
    try {
      nextCode = await productService.generateNextCode();
    } catch {
      nextCode = `PRD-0${products.length + 1}`;
    }

    setFormData({
      code: nextCode,
      name: '',
      categoryId: categories[0]?.id || 1,
      unitId: units[0]?.id || 5,
      standardCost: '',
      reorderLevel: '',
      description: '',
      status: 'Active'
    });
    setFormErrors({});
    setSelectedProduct(null);
    setModalMode('add');
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      code: product.code || '',
      name: product.name || '',
      categoryId: product.categoryId || 1,
      unitId: product.unitId || 5,
      standardCost: product.standardCost != null ? String(product.standardCost) : '',
      reorderLevel: product.reorderLevel != null ? String(product.reorderLevel) : '',
      description: product.description || '',
      status: product.status || 'Active'
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Product Code
    const trimmedCode = (formData.code || '').trim();
    if (!trimmedCode) {
      errors.code = 'Product code is required.';
    } else {
      // Duplicate code check
      const isDuplicate = products.some((p) => {
        if (modalMode === 'edit' && selectedProduct && String(p.id) === String(selectedProduct.id)) {
          return false;
        }
        return p.code?.trim().toLowerCase() === trimmedCode.toLowerCase();
      });
      if (isDuplicate) {
        errors.code = `Product code "${trimmedCode}" is already used by another product.`;
      }
    }

    // Product Name
    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      errors.name = 'Product name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Product name must be at least 2 characters.';
    }

    // Category & Unit
    if (!formData.categoryId) errors.categoryId = 'Please select a product category.';
    if (!formData.unitId) errors.unitId = 'Please select a unit of measurement.';

    // Numeric validations
    if (formData.standardCost !== '') {
      const cost = Number(formData.standardCost);
      if (isNaN(cost) || cost < 0) {
        errors.standardCost = 'Standard cost must be 0 or a positive number.';
      }
    }

    if (formData.reorderLevel !== '') {
      const level = Number(formData.reorderLevel);
      if (isNaN(level) || level < 0) {
        errors.reorderLevel = 'Reorder level must be 0 or a positive number.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const created = await productService.createProduct(formData);
        showToast(`Product "${created.name}" created successfully.`);
      } else if (modalMode === 'edit' && selectedProduct) {
        const updated = await productService.updateProduct(selectedProduct.id, formData);
        showToast(`Product "${updated.name}" updated successfully.`);
      }
      setModalMode(null);
      setSelectedProduct(null);
      await loadData();
    } catch (err) {
      setFormErrors((prev) => ({
        ...prev,
        submit: err.message || 'An error occurred while saving the product.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Safe Deactivation / Delete Handler ────────────────────────────────────
  const confirmDeactivation = async () => {
    if (!deactivateProduct) return;
    setIsSubmitting(true);
    try {
      const res = await productService.deleteProduct(deactivateProduct.id, {
        forceDeactivate: deactivateProduct.status === 'Active'
      });
      showToast(res.message || 'Product updated successfully.');
      setDeactivateProduct(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update product status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── CSV Export ────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      showToast('No products to export in current filter view.', 'error');
      return;
    }
    const headers = ['Product Code', 'Product Name', 'Category', 'Unit', 'Standard Cost (₹)', 'Reorder Level', 'Status', 'Description'];
    const rows = filteredProducts.map((p) => [
      `"${p.code || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.categoryName || ''}"`,
      `"${p.unitName || ''} (${p.unitShortCode || ''})"`,
      `"${p.standardCost ?? 0}"`,
      `"${p.reorderLevel ?? 0}"`,
      `"${p.status || ''}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agriman_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredProducts.length} products to CSV.`);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedStatus !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
  };

  return (
    <div className="prd-page">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="prd-header">
        <div>
          <div className="prd-eyebrow">
            WORKSPACE <span>/</span> MASTERS <span>/</span> INVENTORY INPUTS
          </div>
          <h1 className="prd-title">
            Products Master
            <span
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#15803d',
                background: '#eaf5ec',
                padding: '2px 8px',
                borderRadius: '10px'
              }}
            >
              {products.length} Items
            </span>
          </h1>
          <p className="prd-subtitle">
            Manage agricultural inputs across seeds, fertilizers, pesticides, sprayer chemicals, spare parts, and consumables.
          </p>
        </div>

        <div className="prd-head-actions">
          <button type="button" className="prd-btn-secondary" onClick={exportToCSV} title="Export filtered products list as CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button type="button" className="prd-btn-primary" onClick={openAddModal}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────────────────── */}
      <div className="prd-stats-grid">
        <div className="prd-stat-card">
          <div className="prd-stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="prd-stat-info">
            <div className="prd-stat-label">Total Products</div>
            <div className="prd-stat-val">{stats.total}</div>
            <div className="prd-stat-hint">Catalog Master Records</div>
          </div>
        </div>

        <div className="prd-stat-card">
          <div className="prd-stat-icon active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="prd-stat-info">
            <div className="prd-stat-label">Active Inputs</div>
            <div className="prd-stat-val">{stats.active}</div>
            <div className="prd-stat-hint">Available for Operations</div>
          </div>
        </div>

        <div className="prd-stat-card">
          <div className="prd-stat-icon inactive">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div className="prd-stat-info">
            <div className="prd-stat-label">Inactive / Archived</div>
            <div className="prd-stat-val">{stats.inactive}</div>
            <div className="prd-stat-hint">Safely Deactivated</div>
          </div>
        </div>

        <div className="prd-stat-card">
          <div className="prd-stat-icon categories">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <div className="prd-stat-info">
            <div className="prd-stat-label">Categories</div>
            <div className="prd-stat-val">{categories.length}</div>
            <div className="prd-stat-hint">Seeds, Chemical & Spares</div>
          </div>
        </div>
      </div>

      {/* ── Main Data Panel & Toolbar ─────────────────────────────────────── */}
      <div className="prd-panel">
        <div className="prd-toolbar">
          {/* Search Box */}
          <div className="prd-search-box">
            <span className="prd-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="prd-search-input"
              placeholder="Search products by code, name, category, or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="prd-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="prd-toolbar-filters">
            {/* Category Filter */}
            <div className="prd-select-wrap">
              <select
                className="prd-select-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                title="Filter by input category"
              >
                <option value="All">All Categories ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="prd-select-arrow">▾</span>
            </div>

            {/* Status Filter */}
            <div className="prd-select-wrap">
              <select
                className="prd-select-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                title="Filter by active status"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <span className="prd-select-arrow">▾</span>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button type="button" className="prd-reset-btn" onClick={resetFilters} title="Reset all search and filter conditions">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Table Area ──────────────────────────────────────────────────── */}
        <div className="prd-table-wrap">
          <table className="prd-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Product Code</th>
                <th style={{ width: '310px' }}>Product Name & Specs</th>
                <th style={{ width: '170px' }}>Category</th>
                <th style={{ width: '130px' }}>Unit</th>
                <th style={{ width: '140px' }}>Standard Cost</th>
                <th style={{ width: '120px' }}>Reorder Level</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>Loading agricultural product catalog...</div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="prd-empty-state">
                      <div className="prd-empty-icon">📦</div>
                      <strong>No products found</strong>
                      <p>
                        {hasActiveFilters
                          ? 'No products match your current search or filter criteria.'
                          : 'No agricultural input products have been recorded yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="prd-btn-secondary" onClick={resetFilters}>
                          Clear Filters
                        </button>
                      ) : (
                        <button type="button" className="prd-btn-primary" onClick={openAddModal}>
                          Add First Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const catSlug = getCategorySlug(p.categoryName);
                  const isInactive = p.status === 'Inactive';

                  return (
                    <tr key={p.id}>
                      {/* Product Code */}
                      <td>
                        <span className="prd-code-chip">{p.code}</span>
                      </td>

                      {/* Product Name & Specs */}
                      <td>
                        <div className="prd-name-cell">
                          <div className={`prd-avatar ${catSlug}`} title={p.categoryName}>
                            {renderCategoryIcon(catSlug)}
                          </div>
                          <div className="prd-name-info">
                            <span className="prd-name-text" title={p.name}>
                              {p.name}
                            </span>
                            {p.description && (
                              <span className="prd-desc-sub" title={p.description}>
                                {p.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={`prd-cat-pill ${catSlug}`}>
                          {p.categoryName || 'Other consumables'}
                        </span>
                      </td>

                      {/* Unit */}
                      <td>
                        <span className="prd-unit-pill">
                          {p.unitName}
                          {p.unitShortCode && <span className="prd-unit-code">({p.unitShortCode})</span>}
                        </span>
                      </td>

                      {/* Standard Cost */}
                      <td>
                        <span className="prd-cost-text">
                          {p.standardCost != null ? formatINR(p.standardCost) : '—'}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td>
                        <span className="prd-reorder-text">
                          {p.reorderLevel != null ? `${p.reorderLevel} ${p.unitShortCode || 'units'}` : '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`prd-status-pill ${isInactive ? 'inactive' : 'active'}`}>
                          <span className="prd-status-dot" />
                          {p.status || 'Active'}
                        </span>
                      </td>

                      {/* Row Actions Menu */}
                      <td style={{ textAlign: 'center' }}>
                        <TableActionMenu
                          align="right"
                          items={[
                            {
                              label: 'View Details',
                              type: 'view',
                              onClick: () => setViewProduct(p)
                            },
                            {
                              label: 'Edit Product',
                              type: 'edit',
                              onClick: () => openEditModal(p)
                            },
                            {
                              label: isInactive ? 'Delete Record' : 'Deactivate',
                              type: 'delete',
                              danger: true,
                              onClick: () => setDeactivateProduct(p)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer & Pagination ───────────────────────────────────── */}
        {!loading && filteredProducts.length > 0 && (
          <div className="prd-table-footer">
            <div className="prd-pagination-info">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filteredProducts.length)}</strong> of{' '}
              <strong>{filteredProducts.length}</strong> products
              {hasActiveFilters && ` (filtered from ${products.length} total)`}
            </div>

            <div className="prd-pagination-btns">
              <button
                type="button"
                className="prd-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <span className="prd-page-indicator">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="prd-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Product Modal ───────────────────────────────────────── */}
      {modalMode && (
        <div className="prd-modal-backdrop" onClick={() => !isSubmitting && setModalMode(null)}>
          <div className="prd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prd-modal-header">
              <h3>{modalMode === 'add' ? 'Add New Agricultural Product' : `Edit Product — ${formData.code}`}</h3>
              <button
                type="button"
                className="prd-modal-close"
                onClick={() => !isSubmitting && setModalMode(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form className="prd-form" onSubmit={handleSubmit}>
              <div className="prd-modal-body">
                {/* Global error banner */}
                {formErrors.submit && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '500'
                    }}
                  >
                    ⚠️ {formErrors.submit}
                  </div>
                )}

                <div className="prd-form-grid">
                  {/* Product Code */}
                  <div className="prd-field">
                    <label className="prd-label">
                      Product Code <span className="prd-req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`prd-input ${formErrors.code ? 'prd-input-invalid' : ''}`}
                      placeholder="e.g. PRD-019"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                    />
                    {formErrors.code ? (
                      <span className="prd-field-error">⚠️ {formErrors.code}</span>
                    ) : (
                      <span className="prd-field-hint">Unique identifier for this agricultural inventory input.</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="prd-field">
                    <label className="prd-label">
                      Operational Status <span className="prd-req">*</span>
                    </label>
                    <div className="prd-select-wrap" style={{ width: '100%' }}>
                      <select
                        className="prd-select-filter"
                        style={{ width: '100%' }}
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="Active">Active (Available for farm use)</option>
                        <option value="Inactive">Inactive (Deactivated)</option>
                      </select>
                      <span className="prd-select-arrow">▾</span>
                    </div>
                    <span className="prd-field-hint">Inactive products cannot be selected in new transactions.</span>
                  </div>

                  {/* Product Name */}
                  <div className="prd-field full">
                    <label className="prd-label">
                      Product Name <span className="prd-req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`prd-input ${formErrors.name ? 'prd-input-invalid' : ''}`}
                      placeholder="e.g. Paddy Seeds (BPT 5204) or Urea 46% Nitrogen"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {formErrors.name && <span className="prd-field-error">⚠️ {formErrors.name}</span>}
                  </div>

                  {/* Category */}
                  <div className="prd-field">
                    <label className="prd-label">
                      Category <span className="prd-req">*</span>
                    </label>
                    <div className="prd-select-wrap" style={{ width: '100%' }}>
                      <select
                        className={`prd-select-filter ${formErrors.categoryId ? 'prd-input-invalid' : ''}`}
                        style={{ width: '100%' }}
                        value={formData.categoryId}
                        onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <span className="prd-select-arrow">▾</span>
                    </div>
                    {formErrors.categoryId && <span className="prd-field-error">⚠️ {formErrors.categoryId}</span>}
                  </div>

                  {/* Unit of Measurement */}
                  <div className="prd-field">
                    <label className="prd-label">
                      Unit of Measurement <span className="prd-req">*</span>
                    </label>
                    <div className="prd-select-wrap" style={{ width: '100%' }}>
                      <select
                        className={`prd-select-filter ${formErrors.unitId ? 'prd-input-invalid' : ''}`}
                        style={{ width: '100%' }}
                        value={formData.unitId}
                        onChange={(e) => handleInputChange('unitId', e.target.value)}
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.shortCode})
                          </option>
                        ))}
                      </select>
                      <span className="prd-select-arrow">▾</span>
                    </div>
                    {formErrors.unitId && <span className="prd-field-error">⚠️ {formErrors.unitId}</span>}
                  </div>

                  {/* Standard Cost */}
                  <div className="prd-field">
                    <label className="prd-label">Standard Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`prd-input ${formErrors.standardCost ? 'prd-input-invalid' : ''}`}
                      placeholder="0.00"
                      value={formData.standardCost}
                      onChange={(e) => handleInputChange('standardCost', e.target.value)}
                    />
                    {formErrors.standardCost ? (
                      <span className="prd-field-error">⚠️ {formErrors.standardCost}</span>
                    ) : (
                      <span className="prd-field-hint">Default procurement or reference cost per unit.</span>
                    )}
                  </div>

                  {/* Reorder Level */}
                  <div className="prd-field">
                    <label className="prd-label">Reorder Level</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className={`prd-input ${formErrors.reorderLevel ? 'prd-input-invalid' : ''}`}
                      placeholder="e.g. 15"
                      value={formData.reorderLevel}
                      onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                    />
                    {formErrors.reorderLevel ? (
                      <span className="prd-field-error">⚠️ {formErrors.reorderLevel}</span>
                    ) : (
                      <span className="prd-field-hint">Minimum threshold quantity for reordering warnings.</span>
                    )}
                  </div>

                  {/* Description / Notes */}
                  <div className="prd-field full">
                    <label className="prd-label">Description & Technical Specifications</label>
                    <textarea
                      className="prd-textarea"
                      placeholder="Enter variety details, active chemical percentage, dosage instructions, or maintenance notes..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="prd-modal-footer">
                <button
                  type="button"
                  className="prd-btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => setModalMode(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="prd-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Product Details Modal ─────────────────────────────────────── */}
      {viewProduct && (
        <div className="prd-modal-backdrop" onClick={() => setViewProduct(null)}>
          <div className="prd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prd-modal-header">
              <div>
                <span className="prd-code-chip" style={{ marginRight: '8px' }}>
                  {viewProduct.code}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e3325' }}>
                  {viewProduct.name}
                </span>
              </div>
              <button type="button" className="prd-modal-close" onClick={() => setViewProduct(null)}>
                ✕
              </button>
            </div>

            <div className="prd-modal-body">
              <div className="prd-view-header-badge">
                <span className={`prd-cat-pill ${getCategorySlug(viewProduct.categoryName)}`}>
                  {viewProduct.categoryName}
                </span>
                <span className={`prd-status-pill ${viewProduct.status === 'Inactive' ? 'inactive' : 'active'}`}>
                  <span className="prd-status-dot" />
                  {viewProduct.status || 'Active'}
                </span>
              </div>

              <div className="prd-detail-grid">
                <div className="prd-detail-item">
                  <span className="prd-detail-label">Product Code</span>
                  <span className="prd-detail-val" style={{ fontFamily: 'monospace' }}>
                    {viewProduct.code}
                  </span>
                </div>

                <div className="prd-detail-item">
                  <span className="prd-detail-label">Input Category</span>
                  <span className="prd-detail-val">{viewProduct.categoryName}</span>
                </div>

                <div className="prd-detail-item">
                  <span className="prd-detail-label">Unit of Measurement</span>
                  <span className="prd-detail-val">
                    {viewProduct.unitName} ({viewProduct.unitShortCode || 'units'})
                  </span>
                </div>

                <div className="prd-detail-item">
                  <span className="prd-detail-label">Standard Reference Cost</span>
                  <span className="prd-detail-val">{formatINR(viewProduct.standardCost)}</span>
                </div>

                <div className="prd-detail-item">
                  <span className="prd-detail-label">Reorder Level</span>
                  <span className="prd-detail-val">
                    {viewProduct.reorderLevel != null
                      ? `${viewProduct.reorderLevel} ${viewProduct.unitShortCode || 'units'}`
                      : 'Not defined'}
                  </span>
                </div>

                <div className="prd-detail-item">
                  <span className="prd-detail-label">Catalog Status</span>
                  <span className="prd-detail-val">{viewProduct.status || 'Active'}</span>
                </div>

                <div className="prd-detail-item full">
                  <span className="prd-detail-label">Description & Usage Guidelines</span>
                  <p className="prd-detail-desc">
                    {viewProduct.description || 'No description or technical notes have been recorded for this product.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="prd-modal-footer">
              <button type="button" className="prd-btn-secondary" onClick={() => setViewProduct(null)}>
                Close
              </button>
              <button
                type="button"
                className="prd-btn-primary"
                onClick={() => {
                  const target = viewProduct;
                  setViewProduct(null);
                  openEditModal(target);
                }}
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Safe Deactivation / Delete Confirmation Modal ─────────────────── */}
      {deactivateProduct && (
        <div className="prd-modal-backdrop" onClick={() => !isSubmitting && setDeactivateProduct(null)}>
          <div className="prd-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="prd-modal-header">
              <h3 style={{ color: deactivateProduct.status === 'Active' ? '#b45309' : '#dc2626' }}>
                {deactivateProduct.status === 'Active' ? 'Safe Deactivate Product' : 'Delete Product Record'}
              </h3>
              <button
                type="button"
                className="prd-modal-close"
                disabled={isSubmitting}
                onClick={() => setDeactivateProduct(null)}
              >
                ✕
              </button>
            </div>

            <div className="prd-modal-body">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: deactivateProduct.status === 'Active' ? '#fef3c7' : '#fee2e2',
                    color: deactivateProduct.status === 'Active' ? '#b45309' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: '#1e293b', fontWeight: '500' }}>
                    {deactivateProduct.status === 'Active' ? (
                      <>
                        Are you sure you want to deactivate <strong>{deactivateProduct.name}</strong> (
                        <code>{deactivateProduct.code}</code>)?
                      </>
                    ) : (
                      <>
                        Permanently remove inactive product record <strong>{deactivateProduct.name}</strong> (
                        <code>{deactivateProduct.code}</code>)?
                      </>
                    )}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.45' }}>
                    {deactivateProduct.status === 'Active'
                      ? 'Safe deactivation preserves all historical expense vouchers, crop activity logs, and receipts while preventing this product from appearing in new transaction selections.'
                      : 'This product has already been deactivated and will be permanently removed from your catalog list.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="prd-modal-footer">
              <button
                type="button"
                className="prd-btn-secondary"
                disabled={isSubmitting}
                onClick={() => setDeactivateProduct(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={deactivateProduct.status === 'Active' ? 'prd-btn-primary' : 'prd-btn-danger'}
                style={deactivateProduct.status === 'Active' ? { background: '#d97706' } : {}}
                disabled={isSubmitting}
                onClick={confirmDeactivation}
              >
                {isSubmitting
                  ? 'Processing...'
                  : deactivateProduct.status === 'Active'
                  ? 'Deactivate Product'
                  : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification Banner ─────────────────────────────────────── */}
      {toast && (
        <div className={`prd-toast ${toast.type === 'error' ? 'error' : ''}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
          <button type="button" className="prd-toast-close" onClick={() => setToast(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
