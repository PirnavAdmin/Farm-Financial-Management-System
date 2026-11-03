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

export default function StockTransfer() {
  const { products, locations, stockTransferRecords, recordStockTransfer } = useInventoryContext()

  // Modal open state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [sourceLocation, setSourceLocation] = useState(locations[0] || 'Central Warehouse')
  const [destinationLocation, setDestinationLocation] = useState(locations[1] || 'North Field Storage Godown')
  const [transferQty, setTransferQty] = useState('')
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [referenceNumber, setReferenceNumber] = useState('')
  const [remarks, setRemarks] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  // Search & filter
  const [query, setQuery] = useState('')
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('All')
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
    setSourceLocation(locations[0] || 'Central Warehouse')
    setDestinationLocation(locations[1] || 'North Field Storage Godown')
    setTransferQty('')
    setTransferDate(new Date().toISOString().slice(0, 10))
    setReferenceNumber('')
    setRemarks('')
    setFormError('')
  }

  // Submit transfer
  const handleSubmitTransfer = (e) => {
    e.preventDefault()
    setFormError('')

    if (!selectedProduct) {
      setFormError('Please select a product to transfer.')
      return
    }

    const qty = Number(transferQty)
    if (!qty || qty <= 0) {
      setFormError('Transfer quantity must be greater than 0.')
      return
    }

    if (qty > Number(selectedProduct.currentStock)) {
      setFormError(
        `Transfer exceeds available stock! Requested ${qty} ${selectedProduct.unit}, but only ${selectedProduct.currentStock} ${selectedProduct.unit} available.`
      )
      return
    }

    if (sourceLocation === destinationLocation) {
      setFormError('Source and destination locations cannot be the same.')
      return
    }

    try {
      recordStockTransfer({
        productId: selectedProduct.id,
        productCode: selectedProduct.productCode,
        quantity: qty,
        sourceLocation,
        destinationLocation,
        transferDate,
        referenceNumber: referenceNumber.trim() || `TRF-${Date.now().toString().slice(-4)}`,
        remarks: remarks.trim(),
      })

      showToast(`Transferred ${qty} ${selectedProduct.unit} of ${selectedProduct.productName} successfully.`)
      handleResetForm()
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err.message || 'Transfer failed.')
    }
  }

  // Filtered records
  const filteredRecords = useMemo(() => {
    return stockTransferRecords.filter((rec) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        rec.productName.toLowerCase().includes(q) ||
        rec.productCode.toLowerCase().includes(q) ||
        rec.sourceLocation.toLowerCase().includes(q) ||
        rec.destinationLocation.toLowerCase().includes(q) ||
        (rec.referenceNumber && rec.referenceNumber.toLowerCase().includes(q)) ||
        rec.id.toLowerCase().includes(q)

      const matchesLocation =
        selectedLocationFilter === 'All' ||
        rec.sourceLocation === selectedLocationFilter ||
        rec.destinationLocation === selectedLocationFilter

      return matchesQuery && matchesLocation
    })
  }, [stockTransferRecords, query, selectedLocationFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Metrics
  const totalTransfers = stockTransferRecords.length
  const totalUnitsTransferred = stockTransferRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>STOCK TRANSFER</strong>
            <span className="inv-badge-live">
              <i /> Inter-Location Movements
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3h5v5" />
              <path d="M4 20L21 3" />
              <path d="M21 16v5h-5" />
              <path d="M15 15l6 6" />
              <path d="M4 4l5 5" />
            </svg>
            Inter-Location Stock Transfer
          </h1>
          <p>
            Shift inventory between central godowns, greenhouses, and field storages with full traceability.
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
            <span>＋</span> Record Stock Transfer
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="inv-stats-grid-3 inv-stats-grid">
        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">🔁</div>
          <div className="inv-stat-info">
            <small>Total Transfer Entries</small>
            <strong>{totalTransfers}</strong>
            <span>Recorded movements</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-green">📦</div>
          <div className="inv-stat-info">
            <small>Units Shifted</small>
            <strong>{totalUnitsTransferred.toLocaleString('en-IN')}</strong>
            <span>Internal relocation volume</span>
          </div>
        </article>

        <article className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-purple">📍</div>
          <div className="inv-stat-info">
            <small>Tracked Storage Hubs</small>
            <strong>{locations.length}</strong>
            <span>Active warehouses & depots</span>
          </div>
        </article>
      </div>

      {/* 3. Pop-up Modal Box for Adding Stock Transfer */}
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
          <form className="user-modal" onSubmit={handleSubmitTransfer} style={{ maxWidth: '680px' }}>
            <header className="modal-header">
              <div>
                <span>INVENTORY / STOCK TRANSFER</span>
                <h2>Record Inter-Location Transfer</h2>
                <p>Transfer inventory between central godowns, greenhouses, and field storages.</p>
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
                    Select Product to Transfer <em>*</em>
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

                  {/* Available Quantity Display */}
                  <label>
                    Available Balance
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

                  {/* Transfer Quantity */}
                  <label>
                    Transfer Quantity <em>*</em>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="e.g. 25"
                      value={transferQty}
                      onChange={(e) => {
                        setTransferQty(e.target.value)
                        setFormError('')
                      }}
                      required
                    />
                  </label>

                  {/* Source Location */}
                  <label>
                    Source Location <em>*</em>
                    <select
                      value={sourceLocation}
                      onChange={(e) => setSourceLocation(e.target.value)}
                      required
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Destination Location */}
                  <label>
                    Destination Location <em>*</em>
                    <select
                      value={destinationLocation}
                      onChange={(e) => setDestinationLocation(e.target.value)}
                      required
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Transfer Date */}
                  <label>
                    Transfer Date <em>*</em>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      required
                    />
                  </label>

                  {/* Reference Number */}
                  <label>
                    Transfer Voucher / Gate Pass Ref
                    <input
                      type="text"
                      placeholder="e.g. TR-2026-104"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </label>

                  {/* Remarks */}
                  <label className="field-wide">
                    Movement Remarks
                    <textarea
                      placeholder="e.g. Dispatched via tractor trailer for block 4 spraying"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Transfers update warehouse location records without altering total stock.</span>
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
                  Confirm Stock Transfer
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
              placeholder="Search by product, code, location or voucher..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            value={selectedLocationFilter}
            onChange={(e) => {
              setSelectedLocationFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="All">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <button
            className="inv-reset-btn"
            type="button"
            onClick={() => {
              setQuery('')
              setSelectedLocationFilter('All')
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
                <th>Date</th>
                <th>Product Details</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Transfer Qty</th>
                <th>Location Route (Source ➔ Destination)</th>
                <th>Gate Pass Ref</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="inv-code-chip">{record.id}</span>
                  </td>
                  <td>{record.transferDate}</td>
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
                    <strong style={{ color: 'var(--inv-primary)', fontSize: '13px' }}>
                      {record.quantity} {record.unit}
                    </strong>
                  </td>
                  <td>
                    <span className="inv-location-pill">
                      <span>{record.sourceLocation}</span>
                      <span className="inv-location-arrow">➔</span>
                      <span>{record.destinationLocation}</span>
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
                  <td colSpan={8}>
                    <div className="inv-empty">
                      <span className="inv-empty-icon">⌕</span>
                      <strong>No transfer records found</strong>
                      <p>Record a new location transfer above or clear search filters.</p>
                      <button
                        className="inv-secondary-btn"
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setSelectedLocationFilter('All')
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
