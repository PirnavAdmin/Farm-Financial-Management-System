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

function getTypeBadge(type = '') {
  switch (type) {
    case 'Stock In':
      return { className: 'inv-cat-fertilizers', label: 'Stock In', icon: '📥' }
    case 'Stock Out':
      return { className: 'inv-cat-pesticides', label: 'Stock Out', icon: '📤' }
    case 'Stock Transfer':
      return { className: 'inv-cat-parts', label: 'Stock Transfer', icon: '🔁' }
    case 'Stock Adjustment':
      return { className: 'inv-cat-chemicals', label: 'Stock Adjustment', icon: '⚖️' }
    case 'Opening Stock':
      return { className: 'inv-cat-consumables', label: 'Opening Stock', icon: '📦' }
    default:
      return { className: 'inv-cat-consumables', label: type, icon: '📄' }
  }
}

export default function StockLedger() {
  const { stockLedgerRecords, categories, products } = useInventoryContext()

  // Filters state
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedProductCode, setSelectedProductCode] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const pageSize = 10

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Summary Metrics calculated from all ledger records
  const metrics = useMemo(() => {
    let inward = 0
    let outward = 0
    stockLedgerRecords.forEach((r) => {
      inward += Number(r.inwardQty) || 0
      outward += Number(r.outwardQty) || 0
    })
    return {
      totalInward: inward,
      totalOutward: outward,
      netMovement: inward - outward,
      totalEntries: stockLedgerRecords.length,
    }
  }, [stockLedgerRecords])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return stockLedgerRecords.filter((record) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        record.productName?.toLowerCase().includes(q) ||
        record.productCode?.toLowerCase().includes(q) ||
        record.transactionId?.toLowerCase().includes(q) ||
        record.partyOrLocation?.toLowerCase().includes(q) ||
        record.remarks?.toLowerCase().includes(q)

      const matchesCategory =
        selectedCategory === 'All' || record.category === selectedCategory

      const matchesType =
        selectedType === 'All' || record.type === selectedType

      const matchesProduct =
        selectedProductCode === 'All' || record.productCode === selectedProductCode

      let matchesDate = true
      if (fromDate && record.date < fromDate) matchesDate = false
      if (toDate && record.date > toDate) matchesDate = false

      return matchesQuery && matchesCategory && matchesType && matchesProduct && matchesDate
    })
  }, [stockLedgerRecords, query, selectedCategory, selectedType, selectedProductCode, fromDate, toDate])

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, currentPage, pageSize])

  const handleResetFilters = () => {
    setQuery('')
    setSelectedCategory('All')
    setSelectedType('All')
    setSelectedProductCode('All')
    setFromDate('')
    setToDate('')
    setPage(1)
    showToast('Filters have been reset.')
  }

  // Export CSV functionality
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('No ledger records to export.')
      return
    }

    const headers = [
      'Date',
      'Transaction ID',
      'Product Code',
      'Product Name',
      'Category',
      'Transaction Type',
      'Inward Qty',
      'Outward Qty',
      'Closing Balance',
      'Unit',
      'Party / Location / Reference',
      'Remarks',
    ]

    const csvRows = [
      headers.join(','),
      ...filteredRecords.map((r) =>
        [
          `"${r.date || ''}"`,
          `"${r.transactionId || ''}"`,
          `"${r.productCode || ''}"`,
          `"${(r.productName || '').replace(/"/g, '""')}"`,
          `"${r.category || ''}"`,
          `"${r.type || ''}"`,
          r.inwardQty || 0,
          r.outwardQty || 0,
          r.balance || 0,
          `"${r.unit || ''}"`,
          `"${(r.partyOrLocation || '').replace(/"/g, '""')}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `Stock_Ledger_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Exported ${filteredRecords.length} ledger records to CSV.`)
  }

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>STOCK LEDGER</strong>
            <span className="inv-badge-live">
              <i /> Real-time Audit Trail
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="9" y1="7" x2="16" y2="7" />
              <line x1="9" y1="11" x2="16" y2="11" />
              <line x1="9" y1="15" x2="13" y2="15" />
            </svg>
            Stock Ledger & Audit Trail
          </h1>
          <p>
            Complete chronologic ledger of all stock transactions. Track opening stocks, incoming receipts, farm consumption, inter-warehouse transfers, and periodic reconciliations.
          </p>
        </div>
        <div className="inv-header-actions">
          <button className="inv-secondary-btn" type="button" onClick={handleExportCSV} title="Download CSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-green">📥</div>
          <div className="inv-stat-info">
            <small>Total Inward Stock</small>
            <strong>+{metrics.totalInward.toLocaleString()}</strong>
            <span>Total units received into inventory</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-orange">📤</div>
          <div className="inv-stat-info">
            <small>Total Outward Stock</small>
            <strong>-{metrics.totalOutward.toLocaleString()}</strong>
            <span>Total units consumed / issued</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">⚖️</div>
          <div className="inv-stat-info">
            <small>Net Movement</small>
            <strong style={{ color: metrics.netMovement >= 0 ? '#15803d' : '#dc2626' }}>
              {metrics.netMovement >= 0 ? '+' : ''}
              {metrics.netMovement.toLocaleString()}
            </strong>
            <span>Overall net balance variance</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-purple">📋</div>
          <div className="inv-stat-info">
            <small>Total Ledger Entries</small>
            <strong>{metrics.totalEntries}</strong>
            <span>Recorded audit transactions</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & Ledger Table Panel */}
      <section className="inv-panel">
        <div className="inv-toolbar">
          {/* Search */}
          <div className="inv-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by product, code, trans ID, party or remarks..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Product Filter */}
          <select
            value={selectedProductCode}
            onChange={(e) => {
              setSelectedProductCode(e.target.value)
              setPage(1)
            }}
            title="Filter by Product"
          >
            <option value="All">All Products ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.productCode}>
                {p.productCode} - {p.productName}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setPage(1)
            }}
            title="Filter by Category"
          >
            <option value="All">All Categories (6)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Transaction Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setPage(1)
            }}
            title="Filter by Transaction Type"
          >
            <option value="All">All Transaction Types</option>
            <option value="Stock In">Stock In (Receipts)</option>
            <option value="Stock Out">Stock Out (Issues)</option>
            <option value="Stock Transfer">Stock Transfer</option>
            <option value="Stock Adjustment">Stock Adjustment</option>
            <option value="Opening Stock">Opening Stock</option>
          </select>

          {/* Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
              title="From Date"
            />
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
              title="To Date"
            />
          </div>

          {/* Reset Filters */}
          <button className="inv-reset-btn" type="button" onClick={handleResetFilters}>
            ↻ Reset Filters
          </button>
        </div>

        {/* Ledger Table */}
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Trans. ID</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Trans. Type</th>
                <th style={{ textAlign: 'right' }}>Inward Qty</th>
                <th style={{ textAlign: 'right' }}>Outward Qty</th>
                <th style={{ textAlign: 'right' }}>Closing Bal.</th>
                <th>Unit</th>
                <th>Party / Location / Reference</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((record) => {
                const badge = getTypeBadge(record.type)
                return (
                  <tr key={record.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--inv-text-dark)', whiteSpace: 'nowrap' }}>
                        {record.date}
                      </span>
                    </td>
                    <td>
                      <span className="inv-code-chip">{record.transactionId}</span>
                    </td>
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
                      <span className={`inv-cat-pill ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {Number(record.inwardQty) > 0 ? (
                        <span className="inv-inward-num">
                          +{Number(record.inwardQty).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {Number(record.outwardQty) > 0 ? (
                        <span className="inv-outward-num">
                          -{Number(record.outwardQty).toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: 'var(--inv-text-dark)', fontSize: '13px' }}>
                        {Number(record.balance).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontWeight: 550 }}>{record.unit}</span>
                    </td>
                    <td>
                      <span style={{ color: '#334155', fontSize: '11.5px', fontWeight: 500 }}>
                        {record.partyOrLocation || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: '#64748b',
                          fontSize: '11px',
                          maxWidth: '220px',
                          display: 'inline-block',
                          whiteSpace: 'normal',
                          lineHeight: '1.3',
                        }}
                      >
                        {record.remarks || '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div className="inv-empty">
                      <div className="inv-empty-icon">🔍</div>
                      <strong>No stock ledger transactions match your criteria</strong>
                      <p>Try clearing filters or searching with a different product or date range.</p>
                      <button className="inv-secondary-btn" type="button" onClick={handleResetFilters}>
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ color: '#64748b', fontSize: '11.5px' }}>
            Showing{' '}
            <strong>
              {filteredRecords.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredRecords.length)}
            </strong>{' '}
            of <strong>{filteredRecords.length}</strong> transactions (
            {stockLedgerRecords.length} total)
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="inv-secondary-btn"
              style={{ height: '30px', padding: '0 10px', fontSize: '11px' }}
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Previous
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pageCount || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1]
                return (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {prev && p - prev > 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                    <button
                      type="button"
                      style={{
                        height: '30px',
                        minWidth: '30px',
                        padding: '0 8px',
                        borderRadius: '5px',
                        border: p === currentPage ? '1px solid var(--inv-primary)' : '1px solid #e2e8f0',
                        background: p === currentPage ? 'var(--inv-primary)' : '#ffffff',
                        color: p === currentPage ? '#ffffff' : '#475569',
                        fontWeight: p === currentPage ? '700' : '500',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                )
              })}
            <button
              className="inv-secondary-btn"
              style={{ height: '30px', padding: '0 10px', fontSize: '11px' }}
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next ›
            </button>
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="user-toast" role="status">
          <span>✓</span>
          {toast}
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}
