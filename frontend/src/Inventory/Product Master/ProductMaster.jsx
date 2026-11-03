import { useMemo, useState } from 'react'
import { useInventoryContext } from '../InventoryContext'
import '../inventory.css'

function getCategoryClass(cat = '') {
  const c = cat.toLowerCase()
  if (c.includes('seed')) return 'inv-cat-seeds'
  if (c.includes('fertil')) return 'inv-cat-fertilizers'
  if (c.includes('pestic')) return 'inv-cat-pesticides'
  if (c.includes('spray') || c.includes('chem')) return 'inv-cat-chemicals'
  if (c.includes('part')) return 'inv-cat-parts'
  return 'inv-cat-consumables'
}

function getStockStatus(product) {
  if (product.status === 'Inactive') return { label: 'Inactive', className: 'inv-status-out-of-stock' }
  const cur = Number(product.currentStock)
  const min = Number(product.minimumStockLevel)
  if (cur <= 0) return { label: 'Out of Stock', className: 'inv-status-out-of-stock' }
  if (cur <= min * 0.5) return { label: 'Critical Low', className: 'inv-status-critical' }
  if (cur <= min) return { label: 'Low Stock', className: 'inv-status-low-stock' }
  return { label: 'In Stock', className: 'inv-status-in-stock' }
}

export default function ProductMaster() {
  const { products, categories, units, addProduct, updateProduct, deleteProduct } = useInventoryContext()

  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 8

  // Modal states
  const [editModalProduct, setEditModalProduct] = useState(null) // null or product obj or { isNew: true }
  const [viewProduct, setViewProduct] = useState(null)
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        p.productName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q))

      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory

      const statusObj = getStockStatus(p)
      const matchesStatus =
        selectedStatus === 'All' ||
        statusObj.label === selectedStatus ||
        (selectedStatus === 'Low / Critical' && (statusObj.label === 'Low Stock' || statusObj.label === 'Critical Low'))

      return matchesQuery && matchesCat && matchesStatus
    })
  }, [products, query, selectedCategory, selectedStatus])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRecords = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // KPI calculations
  const totalCount = products.length
  const inStockCount = products.filter((p) => Number(p.currentStock) > Number(p.minimumStockLevel)).length
  const lowStockCount = products.filter((p) => {
    const cur = Number(p.currentStock)
    const min = Number(p.minimumStockLevel)
    return cur > 0 && cur <= min
  }).length
  const outOfStockCount = products.filter((p) => Number(p.currentStock) <= 0).length

  // Save Add/Edit handler
  const handleSaveProduct = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    try {
      if (editModalProduct.isNew) {
        addProduct(data)
        showToast(`Product "${data.productName}" added successfully.`)
      } else {
        updateProduct(editModalProduct.id, data)
        showToast(`Product "${data.productName}" updated successfully.`)
      }
      setEditModalProduct(null)
    } catch (err) {
      alert(err.message || 'Error saving product.')
    }
  }

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!deleteConfirmProduct) return
    const name = deleteConfirmProduct.productName
    deleteProduct(deleteConfirmProduct.id)
    setDeleteConfirmProduct(null)
    showToast(`Product "${name}" deleted successfully.`)
  }

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>PRODUCT MASTER</strong>
            <span className="inv-badge-live">
              <i /> Master Catalog
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Product Master
          </h1>
          <p>
            Manage agricultural inventory items, minimum safety levels, units, categories, and active catalog stock.
          </p>
        </div>

        <button
          className="inv-primary-btn"
          type="button"
          onClick={() => setEditModalProduct({ isNew: true })}
        >
          <span>＋</span> Add New Product
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="inv-stats-grid">
        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-green">📦</div>
          <div className="inv-stat-info">
            <small>Total Catalog Items</small>
            <strong>{totalCount}</strong>
            <span>Active registered products</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">✓</div>
          <div className="inv-stat-info">
            <small>Healthy Stock</small>
            <strong>{inStockCount}</strong>
            <span>Above minimum threshold</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-orange">⚠️</div>
          <div className="inv-stat-info">
            <small>Low Stock Items</small>
            <strong>{lowStockCount}</strong>
            <span>At or below minimum level</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-red">🚫</div>
          <div className="inv-stat-info">
            <small>Out of Stock</small>
            <strong>{outOfStockCount}</strong>
            <span>Urgent replenishment needed</span>
          </div>
        </article>
      </div>

      {/* 3. Panel with Toolbar and Table */}
      <section className="inv-panel">
        <div className="inv-toolbar">
          <div className="inv-search">
            <span>⌕</span>
            <input
              placeholder="Search products by name or code..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="All">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low / Critical">Low / Critical</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            className="inv-reset-btn"
            type="button"
            onClick={() => {
              setQuery('')
              setSelectedCategory('All')
              setSelectedStatus('All')
              setPage(1)
            }}
          >
            ↻ Reset Filters
          </button>
        </div>

        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Min. Level</th>
                <th>Available Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((product) => {
                const status = getStockStatus(product)
                return (
                  <tr key={product.id}>
                    <td>
                      <span className="inv-code-chip">{product.productCode}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <strong style={{ color: 'var(--inv-text-dark)', fontSize: '12.5px' }}>
                          {product.productName}
                        </strong>
                        {product.description && (
                          <span style={{ color: '#64748b', fontSize: '11px' }}>
                            {product.description.slice(0, 55)}
                            {product.description.length > 55 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`inv-cat-pill ${getCategoryClass(product.category)}`}>
                        {product.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#475569', fontWeight: 550 }}>{product.unit}</span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b' }}>{product.minimumStockLevel}</span>
                    </td>
                    <td>
                      <strong
                        style={{
                          fontSize: '13px',
                          color:
                            product.currentStock <= 0
                              ? '#dc2626'
                              : product.currentStock <= product.minimumStockLevel
                              ? '#d97706'
                              : '#15803d',
                        }}
                      >
                        {product.currentStock} {product.unit}
                      </strong>
                    </td>
                    <td>
                      <span className={`inv-status-pill ${status.className}`}>
                        <i /> {status.label}
                      </span>
                    </td>
                    <td>
                      <div className="inv-actions-cell" style={{ justifyContent: 'center' }}>
                        <button
                          className="inv-action-btn"
                          type="button"
                          title="View Details"
                          onClick={() => setViewProduct(product)}
                        >
                          👁
                        </button>
                        <button
                          className="inv-action-btn"
                          type="button"
                          title="Edit Product"
                          onClick={() => setEditModalProduct(product)}
                        >
                          ✎
                        </button>
                        <button
                          className="inv-action-btn btn-delete"
                          type="button"
                          title="Delete Product"
                          onClick={() => setDeleteConfirmProduct(product)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="inv-empty">
                      <span className="inv-empty-icon">⌕</span>
                      <strong>No matching products found</strong>
                      <p>Try adjusting your search keyword or selected category filter.</p>
                      <button
                        className="inv-secondary-btn"
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setSelectedCategory('All')
                          setSelectedStatus('All')
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer */}
        <div className="inv-table-footer">
          <span>
            Showing <strong>{filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0}&ndash;{Math.min(currentPage * pageSize, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> products
          </span>

          <div className="inv-pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                className={currentPage === num ? 'active' : ''}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* 5. Add / Edit Modal */}
      {editModalProduct && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setEditModalProduct(null)}
        >
          <form className="user-modal" onSubmit={handleSaveProduct} style={{ maxWidth: '640px' }}>
            <header className="modal-header">
              <div>
                <span>INVENTORY / PRODUCT MASTER</span>
                <h2>{editModalProduct.isNew ? 'Add New Product' : 'Edit Product Details'}</h2>
                <p>Configure product attributes, categorization, and threshold levels.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditModalProduct(null)}
              >
                &times;
              </button>
            </header>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-grid">
                  <label className="field-wide">
                    Product Name <em>*</em>
                    <input
                      name="productName"
                      defaultValue={editModalProduct.productName || ''}
                      required
                      placeholder="e.g. Paddy Seeds (BPT 5204)"
                    />
                  </label>

                  <label>
                    Product Code
                    <input
                      name="productCode"
                      defaultValue={editModalProduct.productCode || ''}
                      placeholder="Auto-generated if left blank"
                    />
                  </label>

                  <label>
                    Inventory Category <em>*</em>
                    <select
                      name="category"
                      defaultValue={editModalProduct.category || categories[0]}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Unit of Measurement <em>*</em>
                    <select
                      name="unit"
                      defaultValue={editModalProduct.unit || 'Bag'}
                      required
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Minimum Stock Level <em>*</em>
                    <input
                      name="minimumStockLevel"
                      type="number"
                      min="0"
                      defaultValue={editModalProduct.minimumStockLevel ?? 10}
                      required
                      placeholder="e.g. 15"
                    />
                  </label>

                  {editModalProduct.isNew && (
                    <label>
                      Opening Stock (Initial Qty)
                      <input
                        name="openingStock"
                        type="number"
                        min="0"
                        defaultValue="0"
                        placeholder="e.g. 50"
                      />
                    </label>
                  )}

                  <label>
                    Estimated Unit Cost (₹)
                    <input
                      name="costPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={editModalProduct.costPrice ?? 0}
                      placeholder="e.g. 850"
                    />
                  </label>

                  <label>
                    Status
                    <select
                      name="status"
                      defaultValue={editModalProduct.status || 'Active'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>

                  <label className="field-wide">
                    Primary Supplier Name
                    <input
                      name="supplier"
                      defaultValue={editModalProduct.supplier || ''}
                      placeholder="e.g. National Seeds Corporation"
                    />
                  </label>

                  <label className="field-wide">
                    Description & Specifications
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={editModalProduct.description || ''}
                      placeholder="Provide technical specifications, active ingredients, or usage instructions..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #e2e8e1',
                        borderRadius: '5px',
                        font: 'inherit',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>All mandatory fields marked with an asterisk (*).</span>
              <div>
                <button type="button" onClick={() => setEditModalProduct(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  {editModalProduct.isNew ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* 6. View Details Modal */}
      {viewProduct && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewProduct(null)}
        >
          <div className="user-modal" style={{ maxWidth: '580px' }}>
            <header className="modal-header">
              <div>
                <span className={`inv-cat-pill ${getCategoryClass(viewProduct.category)}`}>
                  {viewProduct.category}
                </span>
                <h2>{viewProduct.productName}</h2>
                <p>Code: <strong style={{ color: 'var(--inv-primary)' }}>{viewProduct.productCode}</strong></p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewProduct(null)}
              >
                &times;
              </button>
            </header>

            <div className="modal-body" style={{ padding: '16px 24px' }}>
              <div className="inv-detail-grid">
                <div className="inv-detail-item">
                  <small>Available Stock</small>
                  <strong style={{ fontSize: '18px', color: 'var(--inv-primary)' }}>
                    {viewProduct.currentStock} {viewProduct.unit}
                  </strong>
                </div>

                <div className="inv-detail-item">
                  <small>Minimum Safe Level</small>
                  <strong>{viewProduct.minimumStockLevel} {viewProduct.unit}</strong>
                </div>

                <div className="inv-detail-item">
                  <small>Opening Balance</small>
                  <span>{viewProduct.openingStock ?? 0} {viewProduct.unit}</span>
                </div>

                <div className="inv-detail-item">
                  <small>Unit Cost</small>
                  <span>₹{viewProduct.costPrice ? Number(viewProduct.costPrice).toLocaleString('en-IN') : '—'}</span>
                </div>

                <div className="inv-detail-item">
                  <small>Default Supplier</small>
                  <span>{viewProduct.supplier || 'Not specified'}</span>
                </div>

                <div className="inv-detail-item">
                  <small>Stock Health</small>
                  <div>
                    {(() => {
                      const st = getStockStatus(viewProduct)
                      return (
                        <span className={`inv-status-pill ${st.className}`}>
                          <i /> {st.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <div className="inv-detail-item full-width">
                  <small>Description / Technical Notes</small>
                  <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '12px', lineHeight: 1.5 }}>
                    {viewProduct.description || 'No additional specifications provided.'}
                  </p>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Catalog Record ID #{viewProduct.id}</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const p = viewProduct
                    setViewProduct(null)
                    setEditModalProduct(p)
                  }}
                >
                  ✎ Edit
                </button>
                <button
                  className="save-button"
                  type="button"
                  onClick={() => setViewProduct(null)}
                >
                  Close
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      {deleteConfirmProduct && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setDeleteConfirmProduct(null)}
        >
          <div className="confirm-dialog">
            <span className="delete-symbol">🗑</span>
            <h2>Delete Product?</h2>
            <p>
              Are you sure you want to delete <strong>{deleteConfirmProduct.productName}</strong> (
              <code>{deleteConfirmProduct.productCode}</code>)?
              <br />
              This will remove the product and its status from the active inventory catalog.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
              >
                Cancel
              </button>
              <button
                className="delete-button"
                type="button"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="user-toast" role="status">
          <span>✓</span>
          {toast}
          <button type="button" onClick={() => setToast('')}>
            &times;
          </button>
        </div>
      )}
    </div>
  )
}
