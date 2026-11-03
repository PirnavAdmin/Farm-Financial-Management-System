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

export default function StockOut() {
  const { products, stockOutRecords, recordStockOut, usagePurposes } = useInventoryContext()

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [issueQty, setIssueQty] = useState('')
  const [usagePurpose, setUsagePurpose] = useState(usagePurposes[0] || 'Field Application')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [issuedTo, setIssuedTo] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [remarks, setRemarks] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  // Search & filter state
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId)) || null
  }, [products, selectedProductId])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleResetForm = () => {
    setSelectedProductId('')
    setIssueQty('')
    setUsagePurpose(usagePurposes[0] || 'Field Application')
    setIssueDate(new Date().toISOString().slice(0, 10))
    setIssuedTo('')
    setReferenceNumber('')
    setRemarks('')
    setFormError('')
  }

  // Submit Stock Out
  const handleSubmitStockOut = (e) => {
    e.preventDefault()
    setFormError('')

    if (!selectedProduct) {
      setFormError('Please select a product to issue.')
      return
    }

    const qty = Number(issueQty)
    if (!qty || qty <= 0) {
      setFormError('Issue quantity must be greater than 0.')
      return
    }

    // Validation: prevent issuing more than available stock
    if (qty > Number(selectedProduct.currentStock)) {
      setFormError(
        `Cannot issue ${qty} ${selectedProduct.unit}. Only ${selectedProduct.currentStock} ${selectedProduct.unit} available in inventory!`
      )
      return
    }

    try {
      recordStockOut({
        productId: selectedProduct.id,
        productCode: selectedProduct.productCode,
        quantity: qty,
        usagePurpose,
        issueDate,
        issuedTo: issuedTo.trim() || 'Field Farm Operation',
        referenceNumber: referenceNumber.trim() || `ISS-${Date.now().toString().slice(-4)}`,
        remarks: remarks.trim(),
      })

      showToast(`Stock Out recorded: -${qty} ${selectedProduct.unit} for ${selectedProduct.productName}`)
      handleResetForm()
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err.message || 'Failed to record stock out.')
    }
  }

  // Filtered transactions for table
  const filteredRecords = useMemo(() => {
    return stockOutRecords.filter((rec) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        rec.productName.toLowerCase().includes(q) ||
        rec.productCode.toLowerCase().includes(q) ||
        (rec.issuedTo && rec.issuedTo.toLowerCase().includes(q)) ||
        (rec.referenceNumber && rec.referenceNumber.toLowerCase().includes(q)) ||
        rec.id.toLowerCase().includes(q)

      const matchesCat = selectedCategory === 'All' || rec.category === selectedCategory
      return matchesQuery && matchesCat
    })
  }, [stockOutRecords, query, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Metrics
  const totalOutwardEntries = stockOutRecords.length
  const totalUnitsIssued = stockOutRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>STOCK OUT</strong>
            <span className="inv-badge-live">
              <i /> Field Consumption
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21V8m0 0l-4 4m4-4l4 4" />
              <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
            </svg>
            Stock Out Management
          </h1>
          <p>
            Record inventory issues, field consumption, crop maintenance usage, and enforce real-time available stock validation.
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
            <span>＋</span> Record Stock Out
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="inv-stats-grid-3 inv-stats-grid">
        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-orange">📤</div>
          <div className="inv-stat-info">
            <small>Total Units Issued</small>
            <strong>{totalUnitsIssued.toLocaleString('en-IN')}</strong>
            <span>Consumed across operations</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">🚜</div>
          <div className="inv-stat-info">
            <small>Active Purpose Categories</small>
            <strong>{usagePurposes.length}</strong>
            <span>Operational usage tracks</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-purple">📋</div>
          <div className="inv-stat-info">
            <small>Stock Out Transactions</small>
            <strong>{totalOutwardEntries}</strong>
            <span>Verified issue vouchers</span>
          </div>
        </article>
      </div>

      {/* 3. Pop-up Modal Box for Adding Stock Out */}
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
          <form className="user-modal" onSubmit={handleSubmitStockOut} style={{ maxWidth: '680px' }}>
            <header className="modal-header">
              <div>
                <span>INVENTORY / STOCK OUT</span>
                <h2>Record Stock Out / Material Issue</h2>
                <p>Select product, enter issue quantity and operational purpose.</p>
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
                  {/* Product Select */}
                  <label className="field-wide">
                    Select Product to Issue <em>*</em>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value)
                        setFormError('')
                      }}
                      required
                    >
                      <option value="">-- Choose inventory item --</option>
                      {products
                        .filter((p) => p.status === 'Active')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productName} ({p.productCode}) &bull; Available: {p.currentStock} {p.unit}
                          </option>
                        ))}
                    </select>
                  </label>

                  {/* Available Stock Display */}
                  <label>
                    Current Available Stock
                    <input
                      readOnly
                      value={
                        selectedProduct
                          ? `${selectedProduct.currentStock} ${selectedProduct.unit}`
                          : 'Select a product first'
                      }
                      style={{
                        fontWeight: 700,
                        color: selectedProduct
                          ? selectedProduct.currentStock <= 0
                            ? '#dc2626'
                            : selectedProduct.currentStock <= selectedProduct.minimumStockLevel
                            ? '#d97706'
                            : '#15803d'
                          : '#94a3b8',
                      }}
                    />
                  </label>

                  {/* Quantity to Issue */}
                  <label>
                    Quantity to Issue <em>*</em>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Enter quantity"
                      value={issueQty}
                      onChange={(e) => {
                        setIssueQty(e.target.value)
                        setFormError('')
                      }}
                      required
                    />
                  </label>

                  {/* Usage Purpose */}
                  <label>
                    Usage Purpose <em>*</em>
                    <select
                      value={usagePurpose}
                      onChange={(e) => setUsagePurpose(e.target.value)}
                      required
                    >
                      {usagePurposes.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Issue Date */}
                  <label>
                    Issue Date <em>*</em>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                    />
                  </label>

                  {/* Issued To */}
                  <label>
                    Issued To / Plot Location
                    <input
                      type="text"
                      placeholder="e.g. North Field (Plot 3) / Ramesh"
                      value={issuedTo}
                      onChange={(e) => setIssuedTo(e.target.value)}
                    />
                  </label>

                  {/* Reference Number */}
                  <label>
                    Issue Slip / Work Order Ref
                    <input
                      type="text"
                      placeholder="e.g. WO-2026-401"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </label>

                  {/* Remarks */}
                  <label className="field-wide">
                    Operational Remarks & Application Notes
                    <textarea
                      placeholder="e.g. Applied for second dose fertigation before evening irrigation"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>System prevents over-issuing beyond available balance.</span>
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
                  Confirm Stock Out
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
              placeholder="Search by product, code, issued-to or voucher..."
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
                <th>Voucher No</th>
                <th>Issue Date</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Purpose</th>
                <th style={{ textAlign: 'right' }}>Issued Quantity</th>
                <th>Issued To</th>
                <th>Reference</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="inv-code-chip">{record.id}</span>
                  </td>
                  <td>{record.issueDate}</td>
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
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600,
                        fontSize: '11px',
                      }}
                    >
                      {record.usagePurpose}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="inv-outward-num">
                      -{record.quantity} {record.unit}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#334155', fontWeight: 550 }}>
                      {record.issuedTo || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      {record.referenceNumber || '—'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: '#64748b',
                        fontSize: '11.5px',
                        maxWidth: '220px',
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
                  <td colSpan={9}>
                    <div className="inv-empty">
                      <span className="inv-empty-icon">⌕</span>
                      <strong>No stock out records found</strong>
                      <p>Record a new issue above or clear search filters.</p>
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
