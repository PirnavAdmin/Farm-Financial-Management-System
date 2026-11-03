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

export default function StockAdjustment() {
  const { products, adjustmentReasons, stockAdjustmentRecords, recordStockAdjustment } = useInventoryContext()

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [physicalStockInput, setPhysicalStockInput] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState(adjustmentReasons[0] || 'Physical Count Discrepancy')
  const [adjustmentDate, setAdjustmentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  // Search & filter
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId)) || null
  }, [products, selectedProductId])

  // Automatically calculate difference
  const { difference, autoType } = useMemo(() => {
    if (!selectedProduct || physicalStockInput === '' || Number.isNaN(Number(physicalStockInput))) {
      return { difference: 0, autoType: 'Increase' }
    }
    const diff = Number(physicalStockInput) - Number(selectedProduct.currentStock)
    return {
      difference: diff,
      autoType: diff >= 0 ? 'Increase' : 'Decrease',
    }
  }, [selectedProduct, physicalStockInput])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleResetForm = () => {
    setSelectedProductId('')
    setPhysicalStockInput('')
    setAdjustmentReason(adjustmentReasons[0] || 'Physical Count Discrepancy')
    setAdjustmentDate(new Date().toISOString().slice(0, 10))
    setRemarks('')
    setFormError('')
  }

  // Handle submit adjustment
  const handleSubmitAdjustment = (e) => {
    e.preventDefault()
    setFormError('')

    if (!selectedProduct) {
      setFormError('Please select a product for stock reconciliation.')
      return
    }

    if (physicalStockInput === '' || Number.isNaN(Number(physicalStockInput))) {
      setFormError('Please enter the actual physical stock count.')
      return
    }

    const physical = Number(physicalStockInput)
    if (physical < 0) {
      setFormError('Actual physical stock count cannot be negative.')
      return
    }

    try {
      recordStockAdjustment({
        productId: selectedProduct.id,
        productCode: selectedProduct.productCode,
        physicalStock: physical,
        reason: adjustmentReason,
        adjustmentDate,
        remarks: remarks.trim(),
      })

      showToast(
        `Reconciliation saved: ${selectedProduct.productName} balance updated to ${physical} ${selectedProduct.unit} (${difference >= 0 ? '+' : ''}${difference})`
      )
      handleResetForm()
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err.message || 'Stock adjustment failed.')
    }
  }

  // Filtered adjustment records
  const filteredRecords = useMemo(() => {
    return stockAdjustmentRecords.filter((rec) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        rec.productName.toLowerCase().includes(q) ||
        rec.productCode.toLowerCase().includes(q) ||
        rec.reason.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q)

      const matchesCat = selectedCategory === 'All' || rec.category === selectedCategory
      return matchesQuery && matchesCat
    })
  }, [stockAdjustmentRecords, query, selectedCategory])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Metrics
  const totalAdjustments = stockAdjustmentRecords.length
  const netVariance = stockAdjustmentRecords.reduce((sum, r) => sum + (Number(r.difference) || 0), 0)

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>STOCK ADJUSTMENT</strong>
            <span className="inv-badge-live">
              <i /> Physical Reconciliation
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20v-6M6 20V10M18 20V4" />
            </svg>
            Stock Adjustment & Reconciliation
          </h1>
          <p>
            Reconcile physical stock counts with system recorded balances. Automatically calculate inventory gain or loss variances.
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
            <span>＋</span> Record Stock Adjustment
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="inv-stats-grid-3 inv-stats-grid">
        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-orange">⚖️</div>
          <div className="inv-stat-info">
            <small>Total Audit Reconciliations</small>
            <strong>{totalAdjustments}</strong>
            <span>Recorded physical counts</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">📊</div>
          <div className="inv-stat-info">
            <small>Net Stock Variance</small>
            <strong style={{ color: netVariance >= 0 ? '#15803d' : '#dc2626' }}>
              {netVariance >= 0 ? `+${netVariance}` : netVariance}
            </strong>
            <span>Cumulative unit discrepancy</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-purple">📋</div>
          <div className="inv-stat-info">
            <small>Reconciliation Reasons</small>
            <strong>{adjustmentReasons.length}</strong>
            <span>Discrepancy classifications</span>
          </div>
        </article>
      </div>

      {/* 3. Pop-up Modal Box for Adding Stock Adjustment */}
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
          <form className="user-modal" onSubmit={handleSubmitAdjustment} style={{ maxWidth: '680px' }}>
            <header className="modal-header">
              <div>
                <span>INVENTORY / STOCK ADJUSTMENT</span>
                <h2>Record Physical Stock Reconciliation</h2>
                <p>Enter physical verification count to automatically determine variances.</p>
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
                    Select Product to Reconcile <em>*</em>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value)
                        setFormError('')
                      }}
                      required
                    >
                      <option value="">-- Choose inventory item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName} ({p.productCode}) &bull; Current System Stock: {p.currentStock} {p.unit}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* System Stock */}
                  <label>
                    System Recorded Stock
                    <input
                      readOnly
                      value={
                        selectedProduct
                          ? `${selectedProduct.currentStock} ${selectedProduct.unit}`
                          : 'Select a product first'
                      }
                      style={{ background: '#f8fafc', color: '#475569', fontWeight: 600 }}
                    />
                  </label>

                  {/* Actual Physical Stock Count */}
                  <label>
                    Actual Physical Count <em>*</em>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Enter verified stock"
                      value={physicalStockInput}
                      onChange={(e) => {
                        setPhysicalStockInput(e.target.value)
                        setFormError('')
                      }}
                      required
                    />
                  </label>

                  {/* Calculated Difference */}
                  <label>
                    Calculated Variance / Difference
                    <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
                      {selectedProduct && physicalStockInput !== '' ? (
                        <span
                          className={`inv-diff-pill ${
                            difference > 0
                              ? 'inv-diff-inc'
                              : difference < 0
                              ? 'inv-diff-dec'
                              : 'inv-diff-zero'
                          }`}
                        >
                          {difference > 0 ? `+${difference}` : difference} {selectedProduct.unit} (
                          {autoType})
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                          Auto-calculated on physical count
                        </span>
                      )}
                    </div>
                  </label>

                  {/* Adjustment Type Display */}
                  <label>
                    Adjustment Type
                    <input
                      readOnly
                      value={autoType}
                      style={{
                        background: '#f8fafc',
                        fontWeight: 700,
                        color: autoType === 'Increase' ? '#15803d' : '#dc2626',
                      }}
                    />
                  </label>

                  {/* Adjustment Reason */}
                  <label>
                    Discrepancy Reason <em>*</em>
                    <select
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      required
                    >
                      {adjustmentReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Adjustment Date */}
                  <label>
                    Reconciliation Date <em>*</em>
                    <input
                      type="date"
                      value={adjustmentDate}
                      onChange={(e) => setAdjustmentDate(e.target.value)}
                      required
                    />
                  </label>

                  {/* Remarks */}
                  <label className="field-wide">
                    Audit Verification Remarks
                    <textarea
                      placeholder="e.g. Physical godown audit performed by verification officer"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Adjustment directly reconciles system balance to physical count.</span>
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
                  Save Stock Adjustment
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
              placeholder="Search by product, code, reason or voucher..."
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
                <th>Reconciled Date</th>
                <th>Product Details</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Pre-Audit System</th>
                <th style={{ textAlign: 'right' }}>Physical Verified</th>
                <th style={{ textAlign: 'right' }}>Variance / Difference</th>
                <th>Adjustment Type</th>
                <th>Reason</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="inv-code-chip">{record.id}</span>
                  </td>
                  <td>{record.adjustmentDate}</td>
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
                  <td style={{ textAlign: 'right' }}>{record.systemStock}</td>
                  <td style={{ textAlign: 'right', fontWeight: 650 }}>{record.physicalStock}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      className={`inv-diff-pill ${
                        record.difference > 0
                          ? 'inv-diff-inc'
                          : record.difference < 0
                          ? 'inv-diff-dec'
                          : 'inv-diff-zero'
                      }`}
                    >
                      {record.difference > 0 ? `+${record.difference}` : record.difference}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: record.adjustmentType === 'Increase' ? '#15803d' : '#dc2626',
                        fontWeight: 650,
                      }}
                    >
                      {record.adjustmentType}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#334155', fontWeight: 550, fontSize: '11.5px' }}>
                      {record.reason}
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
                      <strong>No adjustment records found</strong>
                      <p>Record a new reconciliation above or clear search filters.</p>
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
