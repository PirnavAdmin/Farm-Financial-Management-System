import { useEffect, useMemo, useState } from 'react'
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

export default function StockIn() {
  const {
    products,
    stockInRecords,
    recordStockIn,
    prefilledStockInProduct,
    setPrefilledStockInProduct,
  } = useInventoryContext()

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [receivedQty, setReceivedQty] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [remarks, setRemarks] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  // Search & filter for table
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 8

  // Handle prefill if navigated from Low Stock
  useEffect(() => {
    if (prefilledStockInProduct) {
      setSelectedProductId(String(prefilledStockInProduct.id))
      setUnitPrice(prefilledStockInProduct.costPrice ? String(prefilledStockInProduct.costPrice) : '')
      if (prefilledStockInProduct.supplier) setSupplierName(prefilledStockInProduct.supplier)
      if (prefilledStockInProduct.deficit) setReceivedQty(String(prefilledStockInProduct.deficit))
      setPrefilledStockInProduct(null)
      setIsModalOpen(true)
    }
  }, [prefilledStockInProduct, setPrefilledStockInProduct])

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId)) || null
  }, [products, selectedProductId])

  // Auto calculate total
  const totalAmount = useMemo(() => {
    const q = Number(receivedQty) || 0
    const p = Number(unitPrice) || 0
    return q * p
  }, [receivedQty, unitPrice])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Handle product selection change
  const handleProductChange = (e) => {
    const prodId = e.target.value
    setSelectedProductId(prodId)
    setFormError('')
    const found = products.find((p) => String(p.id) === String(prodId))
    if (found) {
      if (found.costPrice && !unitPrice) setUnitPrice(String(found.costPrice))
      if (found.supplier && !supplierName) setSupplierName(found.supplier)
    }
  }

  const handleResetForm = () => {
    setSelectedProductId('')
    setReceivedQty('')
    setUnitPrice('')
    setSupplierName('')
    setPurchaseDate(new Date().toISOString().slice(0, 10))
    setInvoiceNumber('')
    setRemarks('')
    setFormError('')
  }

  // Handle save stock in
  const handleSubmitStockIn = (e) => {
    e.preventDefault()
    setFormError('')

    if (!selectedProduct) {
      setFormError('Please select a valid inventory product.')
      return
    }

    const qty = Number(receivedQty)
    if (!qty || qty <= 0) {
      setFormError('Received quantity must be greater than zero.')
      return
    }

    const price = Number(unitPrice)
    if (unitPrice === '' || price < 0 || Number.isNaN(price)) {
      setFormError('Please enter a valid non-negative unit price.')
      return
    }

    try {
      recordStockIn({
        productId: selectedProduct.id,
        productCode: selectedProduct.productCode,
        productName: selectedProduct.productName,
        category: selectedProduct.category,
        quantity: qty,
        unit: selectedProduct.unit,
        unitPrice: price,
        supplierName: supplierName.trim() || selectedProduct.supplier || 'Direct Agro Supplier',
        purchaseDate,
        invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-4)}`,
        remarks: remarks.trim(),
      })

      showToast(`Stock In recorded: +${qty} ${selectedProduct.unit} for ${selectedProduct.productName}`)
      handleResetForm()
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save stock in entry.')
    }
  }

  // Filtered transactions for the table
  const filteredRecords = useMemo(() => {
    return stockInRecords.filter((rec) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        rec.productName.toLowerCase().includes(q) ||
        rec.productCode.toLowerCase().includes(q) ||
        (rec.supplierName && rec.supplierName.toLowerCase().includes(q)) ||
        (rec.invoiceNumber && rec.invoiceNumber.toLowerCase().includes(q)) ||
        rec.id.toLowerCase().includes(q)

      const matchesCat = selectedCategory === 'All' || rec.category === selectedCategory
      return matchesQuery && matchesCat
    })
  }, [stockInRecords, query, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Metrics
  const totalEntries = stockInRecords.length
  const totalUnitsReceived = stockInRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  const totalValueReceived = stockInRecords.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0)

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>STOCK IN</strong>
            <span className="inv-badge-live">
              <i /> Inward Receipts
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13m0 0l-4-4m4 4l4-4" />
              <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
            </svg>
            Stock In Management
          </h1>
          <p>
            Record incoming inventory consignments from suppliers, manage unit purchase rates, and automatically update available stock.
          </p>
        </div>
        <div className="inv-header-actions">
          <button
            className="inv-primary-btn"
            type="button"
            onClick={() => {
              handleResetForm()
              setIsModalOpen(true)
            }}
          >
            <span>＋</span> Record Stock In
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="inv-stats-grid-3 inv-stats-grid">
        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-green">📥</div>
          <div className="inv-stat-info">
            <small>Total Units Received</small>
            <strong>{totalUnitsReceived.toLocaleString('en-IN')}</strong>
            <span>Recorded in inventory</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">₹</div>
          <div className="inv-stat-info">
            <small>Inward Stock Value</small>
            <strong>₹{totalValueReceived.toLocaleString('en-IN')}</strong>
            <span>Cumulative inward valuation</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-purple">📋</div>
          <div className="inv-stat-info">
            <small>Receipt Vouchers</small>
            <strong>{totalEntries}</strong>
            <span>Supplier invoices verified</span>
          </div>
        </article>
      </div>

      {/* 3. Pop-up Modal Box for Adding Stock In */}
      {isModalOpen && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
              handleResetForm()
            }
          }}
        >
          <form className="user-modal" onSubmit={handleSubmitStockIn} style={{ maxWidth: '680px' }}>
            <header className="modal-header">
              <div>
                <span>INVENTORY / STOCK IN</span>
                <h2>Record Incoming Consignment</h2>
                <p>Enter invoice details, supplier rates, and verified received quantities.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setIsModalOpen(false)
                  handleResetForm()
                }}
              >
                &times;
              </button>
            </header>

            <div className="modal-body">
              {formError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '7px',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    fontSize: '12px',
                    margin: '14px 0 6px',
                    border: '1px solid #fecaca',
                  }}
                >
                  ⚠️ {formError}
                </div>
              )}

              <div className="form-section">
                <div className="form-grid">
                  {/* Select Product */}
                  <label className="field-wide">
                    Select Product <em>*</em>
                    <select value={selectedProductId} onChange={handleProductChange} required>
                      <option value="">-- Choose product from catalog --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName} ({p.productCode}) &bull; Current Stock: {p.currentStock} {p.unit}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Category Display */}
                  <label>
                    Category
                    <input
                      readOnly
                      value={selectedProduct ? selectedProduct.category : '—'}
                      style={{ background: '#f8fafc', color: '#475569', fontWeight: 600 }}
                    />
                  </label>

                  {/* Unit of Measurement */}
                  <label>
                    Unit of Measurement
                    <input
                      readOnly
                      value={selectedProduct ? selectedProduct.unit : '—'}
                      style={{ background: '#f8fafc', color: '#475569', fontWeight: 600 }}
                    />
                  </label>

                  {/* Received Quantity */}
                  <label>
                    Received Quantity <em>*</em>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="e.g. 50"
                      value={receivedQty}
                      onChange={(e) => {
                        setReceivedQty(e.target.value)
                        setFormError('')
                      }}
                      required
                    />
                  </label>

                  {/* Unit Price */}
                  <label>
                    Unit Purchase Price (₹) <em>*</em>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 270"
                      value={unitPrice}
                      onChange={(e) => {
                        setUnitPrice(e.target.value)
                        setFormError('')
                      }}
                      required
                    />
                  </label>

                  {/* Total Value */}
                  <label>
                    Total Value (₹)
                    <input
                      readOnly
                      value={totalAmount > 0 ? `₹${totalAmount.toLocaleString('en-IN')}` : '₹0'}
                      style={{ background: '#f8fafc', color: '#15803d', fontWeight: 700 }}
                    />
                  </label>

                  {/* Supplier Name */}
                  <label>
                    Supplier Name
                    <input
                      type="text"
                      placeholder="e.g. IFFCO Agro Center"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </label>

                  {/* Purchase Date */}
                  <label>
                    Purchase / Delivery Date <em>*</em>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                    />
                  </label>

                  {/* Invoice / Reference Number */}
                  <label>
                    Invoice / DC Number
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-884"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </label>

                  {/* Remarks */}
                  <label className="field-wide">
                    Consignment Remarks
                    <textarea
                      placeholder="Add batch numbers, lot details, quality check notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Stock In increases available system balance immediately.</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    handleResetForm()
                  }}
                >
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  Save Inward Consignment
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* 4. Transactions Table Section */}
      <section className="inv-panel">
        <div className="inv-toolbar">
          <div className="inv-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by product, code, supplier or invoice..."
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
            <option value="All">All Categories</option>
            {['Seeds', 'Fertilizers', 'Pesticides', 'Sprayer Chemicals', 'Spare Parts', 'Other Consumables'].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>

          <button
            className="inv-reset-btn"
            type="button"
            onClick={() => {
              setQuery('')
              setSelectedCategory('All')
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
                <th>Receipt No</th>
                <th>Purchase Date</th>
                <th>Product Details</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Received Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Rate</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th>Supplier</th>
                <th>Invoice / DC</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="inv-code-chip">{record.id}</span>
                  </td>
                  <td>{record.purchaseDate}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <strong style={{ color: 'var(--inv-text-dark)', fontSize: '12.5px' }}>
                        {record.productName}
                      </strong>
                      <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                        {record.productCode}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`inv-cat-pill ${getCategoryClass(record.category)}`}>
                      {record.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="inv-inward-num">
                      +{record.quantity} {record.unit}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(record.unitPrice).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                    ₹{Number(record.totalAmount).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span style={{ color: '#334155', fontWeight: 550 }}>
                      {record.supplierName || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {record.invoiceNumber || '—'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: '#64748b',
                        fontSize: '11.5px',
                        maxWidth: '200px',
                        display: 'inline-block',
                        whiteSpace: 'normal',
                      }}
                    >
                      {record.remarks || '—'}
                    </span>
                  </td>
                </tr>
              ))}

              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="inv-empty">
                      <span className="inv-empty-icon">⌕</span>
                      <strong>No stock in records found</strong>
                      <p>Record a new consignment above or clear search filters.</p>
                      <button
                        className="inv-secondary-btn"
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setSelectedCategory('All')
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

        {/* Footer */}
        <div className="inv-table-footer">
          <span>
            Showing <strong>{filteredRecords.length ? (currentPage - 1) * pageSize + 1 : 0}&ndash;{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> of <strong>{filteredRecords.length}</strong> records
          </span>

          <div className="inv-pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={p === currentPage ? 'active' : ''}
                onClick={() => setPage(p)}
              >
                {p}
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
