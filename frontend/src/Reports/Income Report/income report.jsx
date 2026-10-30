import { useMemo, useState } from 'react'
import './income report.css'

const reportTitle = 'Income Report'
const reportDescription = 'Review income transactions by date, farm, crop, and income type.'

function readRecords(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function amount(value) {
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function currency(value) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === '') return '—'
  const num = amount(value)
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

function dateISO(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const match = String(value).trim().match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
  if (!match) return ''
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[2]) + 1
  return month ? `${match[3]}-${String(month).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}` : ''
}

function getCategoryBadgeClass(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('crop')) return 'ir-cat-crop'
  if (t.includes('milk') || t.includes('dairy')) return 'ir-cat-milk'
  if (t.includes('subsid')) return 'ir-cat-subsidy'
  if (t.includes('rent')) return 'ir-cat-rental'
  return 'ir-cat-other'
}

function buildReport() {
  const rawIncome = readRecords('agriman-finance-income-records')
  const expenses = readRecords('agriman-finance-expenses-records')

  // Filter out empty or unpopulated records
  const income = rawIncome.filter((row) => {
    if (!row || typeof row !== 'object') return false
    return Boolean(
      row.Date || row['Income Date'] || row.incomeDate ||
      row['Income No'] || row.incomeNo ||
      row.Farmer || row.farmer ||
      row.Farm || row.farm ||
      row.Crop || row.crop ||
      row['Income Type'] || row.incomeType ||
      row['Net Amount'] || row.netAmount || row.Amount || row.amount
    )
  })

  const totalIncome = income.reduce(
    (sum, row) => sum + amount(row['Net Amount'] ?? row.netAmount ?? row.Amount ?? row.amount),
    0
  )
  const totalExpenses = expenses.reduce(
    (sum, row) => sum + amount(row.Amount ?? row.amount),
    0
  )

  const columns = ['Date', 'Income No', 'Farmer', 'Farm', 'Crop', 'Income Type', 'Net Amount', 'Payment Mode']
  const rows = income.map((row) => ({
    Date: row.Date || row['Income Date'] || row.incomeDate || '',
    'Income No': row['Income No'] || row.incomeNo || '',
    Farmer: row.Farmer || row.farmer || '',
    Farm: row.Farm || row.farm || '',
    Crop: row.Crop || row.crop || '',
    'Income Type': row['Income Type'] || row.incomeType || row.category || '',
    'Net Amount': row['Net Amount'] ?? row.netAmount ?? row.Amount ?? row.amount ?? '',
    'Payment Mode': row['Payment Mode'] || row.paymentMode || ''
  }))

  return { columns, rows, totalIncome, totalExpenses }
}

function exportCsv(columns, rows) {
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    columns.map(quote).join(','),
    ...rows.map((row) =>
      columns
        .map((column) =>
          quote(column === 'Net Amount' ? formatCurrency(row[column]) : (row[column] || ''))
        )
        .join(',')
    )
  ].join('\n')

  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  link.download = `income-report-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function IncomeReport() {
  const report = useMemo(() => buildReport(), [])
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  // Compute category distribution
  const categoryCounts = useMemo(() => {
    const counts = { All: report.rows.length }
    report.rows.forEach((r) => {
      const type = r['Income Type'] || 'Other'
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [report.rows])

  const categories = useMemo(() => {
    return ['All', ...Object.keys(categoryCounts).filter((k) => k !== 'All')]
  }, [categoryCounts])

  // Filter records
  const filtered = useMemo(() => {
    return report.rows.filter((row) => {
      const textMatch = !query || Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase())
      const rowDate = dateISO(row.Date)
      const dateMatch = (!dateFrom || !rowDate || rowDate >= dateFrom) && (!dateTo || !rowDate || rowDate <= dateTo)
      const catVal = row['Income Type'] || 'Other'
      const categoryMatch = selectedCategory === 'All' || catVal === selectedCategory
      return textMatch && dateMatch && categoryMatch
    })
  }, [report.rows, query, dateFrom, dateTo, selectedCategory])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const avgTransaction = report.rows.length > 0 ? Math.round(report.totalIncome / report.rows.length) : 0

  return (
    <div className="ir-page">
      {/* 1. Header with Title & Export Action */}
      <div className="ir-header">
        <div>
          <div className="ir-breadcrumb">
            <span>REPORTS</span>
            <span>/</span>
            <strong>{reportTitle.toUpperCase()}</strong>
            <span className="ir-badge">
              <i />
              Financial Analytics
            </span>
          </div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#245a36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            {reportTitle}
          </h1>
          <p>{reportDescription}</p>
        </div>

        <button
          className="ir-export-btn"
          type="button"
          onClick={() => exportCsv(report.columns, filtered)}
          title="Download filtered report as CSV file"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="ir-stats-grid">
        <article className="ir-stat-card">
          <div className="ir-stat-icon ir-icon-income">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="ir-stat-info">
            <small>Total Realized Income</small>
            <strong>{currency(report.totalIncome)}</strong>
            <span>From recorded transactions</span>
          </div>
        </article>

        <article className="ir-stat-card">
          <div className="ir-stat-icon ir-icon-profit">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="ir-stat-info">
            <small>Net Profit Margin</small>
            <strong>{currency(report.totalIncome - report.totalExpenses)}</strong>
            <span>Income less expenses</span>
          </div>
        </article>

        <article className="ir-stat-card">
          <div className="ir-stat-icon ir-icon-avg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="ir-stat-info">
            <small>Avg Transaction Value</small>
            <strong>{currency(avgTransaction)}</strong>
            <span>Per income entry</span>
          </div>
        </article>

        <article className="ir-stat-card">
          <div className="ir-stat-icon ir-icon-rows">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </div>
          <div className="ir-stat-info">
            <small>Audited Records</small>
            <strong>{report.rows.length}</strong>
            <span>Active ledger records</span>
          </div>
        </article>
      </div>

      {/* 3. Quick Category Filter Pills */}
      {categories.length > 2 && (
        <div className="ir-filter-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ir-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat)
                setPage(1)
              }}
            >
              <span>{cat === 'All' ? 'All Income Types' : cat}</span>
              <span className="ir-tab-count">{categoryCounts[cat] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Report Panel (Toolbar + Table + Pagination) */}
      <section className="ir-panel">
        <div className="ir-toolbar">
          <div className="ir-search">
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              aria-label="Search income report"
              placeholder="Search by farmer, farm, crop, invoice..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="ir-filter-field">
            <span>Date Period</span>
            <div className="ir-date-range">
              <input
                aria-label="From date"
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value)
                  setPage(1)
                }}
              />
              <span>to</span>
              <input
                aria-label="To date"
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="ir-filter-field">
            <span>Type Filter</span>
            <select
              aria-label="Filter by income type"
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value)
                setPage(1)
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Income Types' : c}
                </option>
              ))}
            </select>
          </div>

          <button
            className="ir-reset-btn"
            type="button"
            title="Reset all filters"
            onClick={() => {
              setQuery('')
              setDateFrom('')
              setDateTo('')
              setSelectedCategory('All')
              setPage(1)
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Reset</span>
          </button>
        </div>

        {/* 5. Styled Data Table */}
        <div className="ir-table-wrap">
          <table className="ir-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Income No</th>
                <th>Farmer</th>
                <th>Farm</th>
                <th>Crop</th>
                <th>Income Type</th>
                <th style={{ textAlign: 'right' }}>Net Amount</th>
                <th>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={`${row['Income No'] || index}-${index}`}>
                  <td>
                    <span className="ir-nowrap">{row.Date || '—'}</span>
                  </td>
                  <td>
                    <span className="ir-code-badge">{row['Income No'] || '—'}</span>
                  </td>
                  <td>
                    <span className="ir-farmer-name">{row.Farmer || '—'}</span>
                  </td>
                  <td>
                    <span>{row.Farm || '—'}</span>
                  </td>
                  <td>
                    <span>{row.Crop || '—'}</span>
                  </td>
                  <td>
                    <span className={`ir-cat-tag ${getCategoryBadgeClass(row['Income Type'])}`}>
                      {row['Income Type'] || '—'}
                    </span>
                  </td>
                  <td className="ir-amount-cell">
                    {formatCurrency(row['Net Amount'])}
                  </td>
                  <td>
                    <span className="ir-pay-mode">
                      {row['Payment Mode'] || '—'}
                    </span>
                  </td>
                </tr>
              ))}

              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="ir-empty">
                      <span className="ir-empty-icon">⌕</span>
                      <strong>No matching income records found</strong>
                      <p>Try adjusting your search query, category filter, or date range.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setDateFrom('')
                          setDateTo('')
                          setSelectedCategory('All')
                          setPage(1)
                        }}
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Footer & Pagination */}
        <div className="ir-table-footer">
          <span>
            Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
          </span>

          <div className="ir-pagination">
            <label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </label>

            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>

            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', minWidth: '70px', textAlign: 'center' }}>
              Page {currentPage} of {pageCount}
            </span>

            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* 7. Audit Disclaimer */}
      <div className="ir-disclaimer">
        Report data • Audited from Finance records saved in this workspace.
      </div>
    </div>
  )
}
