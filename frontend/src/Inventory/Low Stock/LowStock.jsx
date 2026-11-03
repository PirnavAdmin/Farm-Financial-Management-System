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

export default function LowStock({ onNavigate }) {
  const { lowStockProducts, categories, setPrefilledStockInProduct } = useInventoryContext()

  // Filter state
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSeverity, setSelectedSeverity] = useState('All')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const pageSize = 8

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    let outOfStock = 0
    let criticalLow = 0
    let lowStock = 0
    let totalDeficit = 0

    lowStockProducts.forEach((p) => {
      if (p.severity === 'Out of Stock') outOfStock += 1
      else if (p.severity === 'Critical Low') criticalLow += 1
      else lowStock += 1
      totalDeficit += Number(p.deficit) || 0
    })

    return {
      totalAlerts: lowStockProducts.length,
      outOfStock,
      criticalLow,
      lowStock,
      totalDeficit,
    }
  }, [lowStockProducts])

  // Filtered Low Stock List
  const filteredProducts = useMemo(() => {
    return lowStockProducts.filter((product) => {
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        product.productName?.toLowerCase().includes(q) ||
        product.productCode?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q)

      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory

      const matchesSeverity =
        selectedSeverity === 'All' || product.severity === selectedSeverity

      return matchesQuery && matchesCategory && matchesSeverity
    })
  }, [lowStockProducts, query, selectedCategory, selectedSeverity])

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const handleResetFilters = () => {
    setQuery('')
    setSelectedCategory('All')
    setSelectedSeverity('All')
    setPage(1)
    showToast('Filters reset.')
  }

  // Handle Quick Reorder / Stock In action
  const handleQuickStockIn = (product) => {
    if (setPrefilledStockInProduct) {
      setPrefilledStockInProduct({
        id: product.id,
        productCode: product.productCode,
        productName: product.productName,
        category: product.category,
        unit: product.unit,
        suggestedQty: product.deficit > 0 ? product.deficit : product.minimumStockLevel,
      })
    }
    showToast(`Selected ${product.productName} for incoming stock.`)
    if (onNavigate) {
      onNavigate('Stock In')
    }
  }

  return (
    <div className="inv-page">
      {/* 1. Header */}
      <div className="inv-header">
        <div>
          <div className="inv-breadcrumb">
            <span>INVENTORY</span>
            <span>/</span>
            <strong>LOW STOCK ALERTS</strong>
            <span
              className="inv-badge-live"
              style={{
                background: '#fef2f2',
                color: '#dc2626',
              }}
            >
              <i style={{ background: '#dc2626' }} /> Automated Threshold Detection
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Low Stock & Reorder Monitor
          </h1>
          <p>
            Real-time replenishment alerts for inventory products whose current stock is at or below defined minimum safety thresholds.
          </p>
        </div>
      </div>

      {/* 2. KPI Severity Warning Cards */}
      <div className="inv-stats-grid">
        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-red">🚨</div>
          <div className="inv-stat-info">
            <small>Out of Stock</small>
            <strong style={{ color: '#dc2626' }}>{metrics.outOfStock}</strong>
            <span>Zero units remaining in store</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-orange">⚠️</div>
          <div className="inv-stat-info">
            <small>Critical Low (&le; 50% min)</small>
            <strong style={{ color: '#ea580c' }}>{metrics.criticalLow}</strong>
            <span>Severely depleted inventory</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon" style={{ background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' }}>
            🔔
          </div>
          <div className="inv-stat-info">
            <small>Below Minimum Level</small>
            <strong style={{ color: '#ca8a04' }}>{metrics.lowStock}</strong>
            <span>Approaching minimum threshold</span>
          </div>
        </div>

        <div className="inv-stat-card">
          <div className="inv-stat-icon inv-icon-blue">📦</div>
          <div className="inv-stat-info">
            <small>Total Replenishment Deficit</small>
            <strong>{metrics.totalDeficit.toLocaleString()}</strong>
            <span>Units required to reach safety buffer</span>
          </div>
        </div>
      </div>

      {/* 3. Panel with Toolbar and Alert Table */}
      <section className="inv-panel">
        <div className="inv-toolbar">
          {/* Search */}
          <div className="inv-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search low-stock products by name, code or category..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value)
              setPage(1)
            }}
            title="Filter by Severity"
          >
            <option value="All">All Severity Levels ({lowStockProducts.length})</option>
            <option value="Out of Stock">Out of Stock ({metrics.outOfStock})</option>
            <option value="Critical Low">Critical Low ({metrics.criticalLow})</option>
            <option value="Low Stock">Low Stock ({metrics.lowStock})</option>
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

          {/* Reset Filters */}
          <button className="inv-reset-btn" type="button" onClick={handleResetFilters}>
            ↻ Reset Filters
          </button>
        </div>

        {/* Low Stock Table */}
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Severity Status</th>
                <th>Product Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Current Stock</th>
                <th style={{ textAlign: 'right' }}>Min. Safety Level</th>
                <th style={{ textAlign: 'right' }}>Replenishment Deficit</th>
                <th>Stock Health</th>
                <th>Unit</th>
                <th style={{ textAlign: 'center' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((product) => {
                const isOutOfStock = product.severity === 'Out of Stock'
                const isCritical = product.severity === 'Critical Low'

                const statusClass = isOutOfStock
                  ? 'inv-status-out-of-stock'
                  : isCritical
                  ? 'inv-status-critical'
                  : 'inv-status-low-stock'

                const healthFillClass = isOutOfStock
                  ? 'inv-health-red'
                  : isCritical
                  ? 'inv-health-yellow'
                  : 'inv-health-green'

                return (
                  <tr key={product.id}>
                    <td>
                      <span className={`inv-status-pill ${statusClass}`}>
                        <i /> {product.severity}
                      </span>
                    </td>
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
                            {product.description.slice(0, 50)}
                            {product.description.length > 50 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`inv-cat-pill ${getCategoryClass(product.category)}`}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: isOutOfStock ? '#dc2626' : isCritical ? '#ea580c' : '#d97706',
                        }}
                      >
                        {Number(product.currentStock).toLocaleString()}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>
                        {Number(product.minimumStockLevel).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          color: '#dc2626',
                          fontWeight: 700,
                          background: '#fef2f2',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #fee2e2',
                        }}
                      >
                        +{Number(product.deficit).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <div className="inv-health-bar">
                          <div
                            className={`inv-health-fill ${healthFillClass}`}
                            style={{ width: `${Math.max(4, product.healthPercent)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                          {product.healthPercent}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontWeight: 550 }}>{product.unit}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="inv-reorder-btn"
                        type="button"
                        onClick={() => handleQuickStockIn(product)}
                        title={`Record Stock In for ${product.productName}`}
                      >
                        ＋ Stock In
                      </button>
                    </td>
                  </tr>
                )
              })}

              {pagedRecords.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="inv-empty">
                      <div className="inv-empty-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                        ✓
                      </div>
                      <strong>No low stock alerts match your filters!</strong>
                      <p>
                        {lowStockProducts.length === 0
                          ? 'All inventory items are currently well stocked above minimum thresholds.'
                          : 'Try adjusting your search query, severity, or category filter.'}
                      </p>
                      {lowStockProducts.length > 0 && (
                        <button className="inv-secondary-btn" type="button" onClick={handleResetFilters}>
                          Reset Filters
                        </button>
                      )}
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
              {filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </strong>{' '}
            of <strong>{filteredProducts.length}</strong> items needing reorder (
            {lowStockProducts.length} total alerts)
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
