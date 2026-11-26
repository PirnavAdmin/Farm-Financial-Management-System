import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Calculator,
  Download,
  IndianRupee,
  Layers,
  Percent,
  Printer,
  RefreshCw,
  Search,
  Sprout,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import './crop profit.css'
import {
  applyMetricOverrides,
  EXPENSE_BUCKET_COLORS,
  formatINR,
  formatMetricINR,
  formatPercent,
  round2,
} from './cropProfitData.js'
import { fetchCropWisePnl, getBenchmarkCropPnl } from './cropProfitService.js'

const PAGE_SIZE = 8

function exportCropPnlCsv(rows) {
  const columns = [
    'Crop',
    'Area (Acres)',
    'Crop Sales',
    'Other Income',
    'Total Income',
    'Seeds',
    'Fertilizer',
    'Pesticides',
    'Labour',
    'Diesel',
    'Machinery',
    'Transport',
    'Other Expenses',
    'Total Expense',
    'Net Profit',
    'Cost / Acre',
    'Income / Acre',
    'Profit / Acre',
    'Total Qty (Kg)',
    'Cost / Kg',
    'Selling Price / Kg',
    'ROI %',
  ]
  const quote = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
  const lines = [
    columns.map(quote).join(','),
    ...rows.map((r) =>
      [
        r.crop,
        r.areaAcres,
        r.incomeBreakdown?.cropSales ?? 0,
        r.incomeBreakdown?.otherIncome ?? 0,
        r.totalIncome,
        r.expenseBreakdown?.seeds ?? 0,
        r.expenseBreakdown?.fertilizer ?? 0,
        r.expenseBreakdown?.pesticides ?? 0,
        r.expenseBreakdown?.labour ?? 0,
        r.expenseBreakdown?.diesel ?? 0,
        r.expenseBreakdown?.machinery ?? 0,
        r.expenseBreakdown?.transport ?? 0,
        r.expenseBreakdown?.other ?? 0,
        r.totalExpenses,
        r.netProfit,
        r.costPerAcre ?? '',
        r.incomePerAcre ?? '',
        r.profitPerAcre ?? '',
        r.totalQuantityKg ?? '',
        r.costPerKg ?? '',
        r.sellingPricePerKg ?? '',
        r.roiPercent ?? '',
      ]
        .map(quote)
        .join(',')
    ),
  ].join('\n')

  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([lines], { type: 'text/csv;charset=utf-8;' }))
  link.download = `crop-wise-profit-loss-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function formatAxisTick(value) {
  const abs = Math.abs(Number(value) || 0)
  const sign = Number(value) < 0 ? '-' : ''
  if (abs === 0) return '0'
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`
  if (abs >= 1000) return `${sign}₹${Math.round(abs / 1000)}K`
  return `${sign}₹${abs}`
}

export default function CropProfit() {
  const [rawRows, setRawRows] = useState([])
  const [dataSource, setDataSource] = useState({ source: 'loading', label: 'Loading live data...' })
  const [loading, setLoading] = useState(true)
  const [benchmarkMode, setBenchmarkMode] = useState(false)

  // Filters
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [farmFilter, setFarmFilter] = useState('All')
  const [seasonFilter, setSeasonFilter] = useState('All')
  const [sortBy, setSortBy] = useState('netProfit')
  const [page, setPage] = useState(1)

  // Selected crop & optional per-crop Area/Kg overrides for unit-economics simulation
  const [selectedCropId, setSelectedCropId] = useState('')
  const [overrides, setOverrides] = useState({})
  const [showAdjustBar, setShowAdjustBar] = useState(false)

  const loadData = useCallback(async () => {
    if (benchmarkMode) {
      const bm = getBenchmarkCropPnl()
      setRawRows(bm.rows)
      setDataSource({ source: bm.source, label: bm.sourceLabel })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await fetchCropWisePnl({
        fromDate: dateFrom,
        toDate: dateTo,
        farm: farmFilter,
        season: seasonFilter,
      })
      setRawRows(result.rows)
      setDataSource({ source: result.source, label: result.sourceLabel })
    } finally {
      setLoading(false)
    }
  }, [benchmarkMode, dateFrom, dateTo, farmFilter, seasonFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Apply overrides to rows
  const rows = useMemo(
    () => rawRows.map((row) => applyMetricOverrides(row, overrides[row.id])),
    [rawRows, overrides]
  )

  const farmOptions = useMemo(() => {
    const set = new Set()
    rows.forEach((r) => (r.farms || []).forEach((f) => set.add(f)))
    return ['All', ...[...set].sort()]
  }, [rows])

  const seasonOptions = useMemo(() => {
    const set = new Set()
    rows.forEach((r) => (r.seasons || []).forEach((s) => set.add(s)))
    return ['All', ...[...set].sort()]
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) => {
      if (farmFilter !== 'All' && !(r.farms || []).some((f) => f.toLowerCase().includes(farmFilter.toLowerCase()))) {
        return false
      }
      if (seasonFilter !== 'All' && !(r.seasons || []).some((s) => s.toLowerCase().includes(seasonFilter.toLowerCase()))) {
        return false
      }
      if (!q) return true
      const hay = [r.crop, r.cropCode, r.cropType, ...(r.farms || []), ...(r.seasons || [])].join(' ').toLowerCase()
      return hay.includes(q)
    })

    return [...list].sort((a, b) => {
      if (sortBy === 'roiPercent') return (b.roiPercent ?? -999999) - (a.roiPercent ?? -999999)
      if (sortBy === 'totalIncome') return b.totalIncome - a.totalIncome
      if (sortBy === 'totalExpenses') return b.totalExpenses - a.totalExpenses
      if (sortBy === 'areaAcres') return b.areaAcres - a.areaAcres
      return b.netProfit - a.netProfit
    })
  }, [rows, query, farmFilter, seasonFilter, sortBy])

  // Keep selectedCrop synced with filtered list
  const selectedCrop = useMemo(() => {
    if (filtered.length === 0) return null
    return filtered.find((r) => r.id === selectedCropId) || filtered[0]
  }, [filtered, selectedCropId])

  // Portfolio totals
  const portfolio = useMemo(() => {
    const totalIncome = round2(filtered.reduce((s, r) => s + r.totalIncome, 0))
    const totalExpenses = round2(filtered.reduce((s, r) => s + r.totalExpenses, 0))
    const netProfit = round2(totalIncome - totalExpenses)
    const totalArea = round2(filtered.reduce((s, r) => s + (r.areaAcres || 0), 0))
    const roiPercent = totalExpenses > 0 ? round2((netProfit / totalExpenses) * 100) : null
    const marginPercent = totalIncome > 0 ? round2((netProfit / totalIncome) * 100) : 0
    return { totalIncome, totalExpenses, netProfit, totalArea, roiPercent, marginPercent }
  }, [filtered])

  // Charts data
  const expenseChartData = useMemo(() => {
    if (!selectedCrop) return []
    return (selectedCrop.expenseBreakdown?.items || []).map((item) => ({
      name: item.category,
      amount: item.amount,
      fill: EXPENSE_BUCKET_COLORS[item.category] || EXPENSE_BUCKET_COLORS.Other,
    }))
  }, [selectedCrop])

  const cropComparisonData = useMemo(
    () =>
      filtered.slice(0, 8).map((r) => ({
        crop: r.crop,
        Income: r.totalIncome,
        Expenses: r.totalExpenses,
        'Net Profit': r.netProfit,
      })),
    [filtered]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const currentOverride = selectedCrop ? overrides[selectedCrop.id] || {} : {}

  const handleOverrideChange = (field, value) => {
    if (!selectedCrop) return
    setOverrides((prev) => ({
      ...prev,
      [selectedCrop.id]: {
        ...(prev[selectedCrop.id] || {}),
        [field]: value,
      },
    }))
  }

  const handleResetFilters = () => {
    setQuery('')
    setDateFrom('')
    setDateTo('')
    setFarmFilter('All')
    setSeasonFilter('All')
    setSortBy('netProfit')
    setPage(1)
  }

  return (
    <div className="cp-page">
      {/* 1. Header */}
      <div className="cp-header">
        <div>
          <div className="cp-breadcrumb">
            <span>REPORTS</span>
            <span>/</span>
            <strong>CROP-WISE PROFIT &amp; LOSS</strong>
            <span className="cp-badge">Core AgriMan Feature</span>
            <span className={`cp-source-pill ${dataSource.source === 'benchmark' ? 'benchmark' : ''}`}>
              {dataSource.label}
            </span>
          </div>
          <h1>
            <Sprout size={24} color="#245a36" />
            Crop-wise Profit &amp; Loss
          </h1>
          <p>
            Analyze Income, itemized Expenses (Seeds, Fertilizer, Pesticides, Labour, Diesel, Machinery, Transport),
            Net Profit, Cost &amp; Profit per Acre, Cost &amp; Selling Price per Kg, and ROI % for every crop.
          </p>
        </div>

        <div className="cp-header-actions">
          <button
            type="button"
            className={`cp-btn-secondary ${benchmarkMode ? 'active' : ''}`}
            onClick={() => setBenchmarkMode((v) => !v)}
            title="Toggle between live database/browser records and the Cotton 10-acre benchmark dataset"
          >
            <Layers size={15} />
            <span>{benchmarkMode ? 'Using Sample Benchmark' : 'Preview Cotton Benchmark'}</span>
          </button>

          <button
            type="button"
            className="cp-btn-secondary"
            onClick={() => window.print()}
            disabled={loading || filtered.length === 0}
          >
            <Printer size={15} />
            <span>Print Statement</span>
          </button>

          <button
            type="button"
            className="cp-btn-primary"
            onClick={() => exportCropPnlCsv(filtered)}
            disabled={loading || filtered.length === 0}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Portfolio KPI Strip */}
      <div className="cp-kpi-grid">
        <article className="cp-kpi-card">
          <div className="cp-kpi-icon income">
            <IndianRupee size={20} />
          </div>
          <div className="cp-kpi-body">
            <small>Total Crop Income</small>
            <strong style={{ color: '#059669' }}>{formatINR(portfolio.totalIncome)}</strong>
            <span>Across {filtered.length} crop{filtered.length === 1 ? '' : 's'}</span>
          </div>
        </article>

        <article className="cp-kpi-card">
          <div className="cp-kpi-icon expense">
            <TrendingDown size={20} />
          </div>
          <div className="cp-kpi-body">
            <small>Total Crop Expenses</small>
            <strong style={{ color: '#b45309' }}>{formatINR(portfolio.totalExpenses)}</strong>
            <span>Seeds, Inputs, Labour, Fuel &amp; Transport</span>
          </div>
        </article>

        <article className="cp-kpi-card">
          <div className={`cp-kpi-icon ${portfolio.netProfit >= 0 ? 'profit' : 'loss'}`}>
            <TrendingUp size={20} />
          </div>
          <div className="cp-kpi-body">
            <small>Net Profit</small>
            <strong style={{ color: portfolio.netProfit >= 0 ? '#15803d' : '#dc2626' }}>
              {formatINR(portfolio.netProfit)}
            </strong>
            <span>Income − Expenses ({formatPercent(portfolio.marginPercent)} margin)</span>
          </div>
        </article>

        <article className="cp-kpi-card">
          <div className="cp-kpi-icon roi">
            <Percent size={20} />
          </div>
          <div className="cp-kpi-body">
            <small>Portfolio ROI %</small>
            <strong style={{ color: '#4338ca' }}>{formatPercent(portfolio.roiPercent)}</strong>
            <span>{portfolio.totalArea > 0 ? `${portfolio.totalArea} Acres cultivated` : 'Net Profit ÷ Total Expense'}</span>
          </div>
        </article>
      </div>

      {/* 3. Filter Toolbar & Quick Crop Selector */}
      <section className="cp-filter-panel">
        <div className="cp-toolbar">
          <div className="cp-search">
            <Search size={15} />
            <input
              aria-label="Search crop P&L"
              placeholder="Search crop, farm, or season..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="cp-filter-group">
            <span>From</span>
            <input
              aria-label="From date"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
            <span>To</span>
            <input
              aria-label="To date"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="cp-filter-group">
            <span>Farm</span>
            <select
              aria-label="Filter by farm"
              value={farmFilter}
              onChange={(e) => {
                setFarmFilter(e.target.value)
                setPage(1)
              }}
            >
              {farmOptions.map((f) => (
                <option key={f} value={f}>
                  {f === 'All' ? 'All Farms' : f}
                </option>
              ))}
            </select>
          </div>

          <div className="cp-filter-group">
            <span>Season</span>
            <select
              aria-label="Filter by season"
              value={seasonFilter}
              onChange={(e) => {
                setSeasonFilter(e.target.value)
                setPage(1)
              }}
            >
              {seasonOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Seasons' : s}
                </option>
              ))}
            </select>
          </div>

          <div className="cp-filter-group">
            <span>Sort</span>
            <select aria-label="Sort crops" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="netProfit">Highest Net Profit</option>
              <option value="roiPercent">Highest ROI %</option>
              <option value="totalIncome">Highest Income</option>
              <option value="totalExpenses">Highest Expense</option>
              <option value="areaAcres">Largest Area</option>
            </select>
          </div>

          <button type="button" className="cp-btn-secondary" onClick={handleResetFilters}>
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {filtered.length > 0 && (
          <div className="cp-crop-pills">
            <span className="cp-crop-pills-label">Select Crop:</span>
            {filtered.map((item) => {
              const isSelected = selectedCrop?.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`cp-crop-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCropId(item.id)}
                >
                  <span>{item.crop}</span>
                  <span className={`cp-crop-pill-profit ${item.netProfit < 0 ? 'loss' : ''}`}>
                    {formatINR(item.netProfit)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* 4. Core Crop P&L Statement + Important Metrics + Breakdown Chart */}
      {loading ? (
        <div className="cp-card cp-empty-box">
          <h3>Calculating Crop-wise Profit &amp; Loss...</h3>
          <p>Aggregating Crop Sales, Income, Expenses, Land Area, and Yield records.</p>
        </div>
      ) : !selectedCrop ? (
        <div className="cp-card cp-empty-box">
          <h3>No matching crop P&amp;L records found</h3>
          <p>Adjust your filters or switch to Sample Benchmark Preview to inspect the Cotton 10-acre P&amp;L model.</p>
          <button type="button" className="cp-btn-primary" onClick={handleResetFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="cp-main-grid">
          {/* Left: Official Crop-wise P&L Statement */}
          <article className="cp-card">
            <div className="cp-card-header">
              <div className="cp-statement-title">
                <h2>
                  <Sprout size={19} color="#245a36" />
                  Crop: {selectedCrop.crop}
                </h2>
                <div className="cp-meta-chips">
                  <span className="cp-meta-chip area">
                    Area: {selectedCrop.areaAcres > 0 ? `${selectedCrop.areaAcres} Acres` : 'Not set'}
                  </span>
                  <span className="cp-meta-chip">
                    Yield / Sold:{' '}
                    {selectedCrop.totalQuantityKg > 0
                      ? `${selectedCrop.totalQuantityKg.toLocaleString('en-IN')} Kg`
                      : 'Not recorded'}
                  </span>
                  {selectedCrop.seasons?.length > 0 && (
                    <span className="cp-meta-chip">{selectedCrop.seasons.join(', ')}</span>
                  )}
                  {selectedCrop.farms?.length > 0 && (
                    <span className="cp-meta-chip">{selectedCrop.farms.join(', ')}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="cp-btn-secondary"
                onClick={() => setShowAdjustBar((v) => !v)}
                title="Adjust Area (Acres) or Harvest Weight (Kg) to recalculate per-acre & per-kg metrics"
              >
                <Calculator size={14} />
                <span>{showAdjustBar ? 'Hide Calculator' : 'Adjust Area / Kg'}</span>
              </button>
            </div>

            {showAdjustBar && (
              <div className="cp-override-bar">
                <label>
                  Area (Acres)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={String(selectedCrop.areaAcres || 10)}
                    value={currentOverride.areaAcres ?? ''}
                    onChange={(e) => handleOverrideChange('areaAcres', e.target.value)}
                  />
                </label>
                <label>
                  Quantity (Kg)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(selectedCrop.totalQuantityKg || 11800)}
                    value={currentOverride.totalQuantityKg ?? ''}
                    onChange={(e) => handleOverrideChange('totalQuantityKg', e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="cp-btn-secondary"
                  onClick={() =>
                    setOverrides((prev) => {
                      const next = { ...prev }
                      delete next[selectedCrop.id]
                      return next
                    })
                  }
                >
                  Reset to Recorded
                </button>
              </div>
            )}

            <div className="cp-statement-body">
              {/* Income Section */}
              <div className="cp-ledger-section">
                <div className="cp-ledger-heading income">
                  <span>Income</span>
                  <span>Amount</span>
                </div>
                {(selectedCrop.incomeBreakdown?.items || []).length === 0 ? (
                  <div className="cp-ledger-row">
                    <span className="cp-ledger-row-name">Crop Sales</span>
                    <div className="cp-share-bar-wrap">
                      <div className="cp-share-track" />
                      <span className="cp-share-pct">0%</span>
                    </div>
                    <span className="cp-ledger-amount">₹0</span>
                  </div>
                ) : (
                  selectedCrop.incomeBreakdown.items.map((item) => {
                    const pct =
                      selectedCrop.totalIncome > 0
                        ? Math.round((item.amount / selectedCrop.totalIncome) * 100)
                        : 0
                    return (
                      <div key={item.category} className="cp-ledger-row">
                        <span className="cp-ledger-row-name">
                          <span className="cp-dot" style={{ background: '#059669' }} />
                          {item.category}
                        </span>
                        <div className="cp-share-bar-wrap">
                          <div className="cp-share-track">
                            <div
                              className="cp-share-fill"
                              style={{ width: `${pct}%`, background: '#10b981' }}
                            />
                          </div>
                          <span className="cp-share-pct">{pct}%</span>
                        </div>
                        <span className="cp-ledger-amount">{formatINR(item.amount)}</span>
                      </div>
                    )
                  })
                )}
                <div className="cp-ledger-total income">
                  <span>Total Income</span>
                  <span>{formatINR(selectedCrop.totalIncome)}</span>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="cp-ledger-section">
                <div className="cp-ledger-heading expense">
                  <span>Expenses</span>
                  <span>Amount</span>
                </div>
                {(selectedCrop.expenseBreakdown?.items || []).map((item) => {
                  const pct =
                    selectedCrop.totalExpenses > 0
                      ? ((item.amount / selectedCrop.totalExpenses) * 100).toFixed(1)
                      : '0.0'
                  const color = EXPENSE_BUCKET_COLORS[item.category] || EXPENSE_BUCKET_COLORS.Other
                  return (
                    <div key={item.category} className="cp-ledger-row">
                      <span className="cp-ledger-row-name">
                        <span className="cp-dot" style={{ background: color }} />
                        {item.category}
                      </span>
                      <div className="cp-share-bar-wrap">
                        <div className="cp-share-track">
                          <div
                            className="cp-share-fill"
                            style={{ width: `${Math.min(Number(pct), 100)}%`, background: color }}
                          />
                        </div>
                        <span className="cp-share-pct">{pct}%</span>
                      </div>
                      <span className="cp-ledger-amount">{formatINR(item.amount)}</span>
                    </div>
                  )
                })}
                <div className="cp-ledger-total expense">
                  <span>Total Expense</span>
                  <span>{formatINR(selectedCrop.totalExpenses)}</span>
                </div>
              </div>

              {/* Net Profit Formula Banner */}
              <div className={`cp-net-profit-banner ${selectedCrop.netProfit < 0 ? 'loss' : ''}`}>
                <div className="cp-formula-text">
                  <span className="cp-formula-label">
                    Formula: Net Profit = Total Income − Total Expenses
                  </span>
                  <span className="cp-formula-eq">
                    {formatINR(selectedCrop.totalIncome)} − {formatINR(selectedCrop.totalExpenses)}
                  </span>
                </div>
                <div className="cp-net-profit-val">{formatINR(selectedCrop.netProfit)}</div>
              </div>
            </div>
          </article>

          {/* Right: 6 Important Metrics + Expense Breakdown Chart */}
          <div className="cp-right-stack">
            <article className="cp-card">
              <div className="cp-card-header">
                <div className="cp-statement-title">
                  <h2>Important Metrics — {selectedCrop.crop}</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Unit economics per Acre, per Kg, and Return on Investment
                  </span>
                </div>
              </div>

              <div className="cp-metrics-grid">
                <div className="cp-metric-tile">
                  <small>Cost / Acre</small>
                  <strong>{formatMetricINR(selectedCrop.costPerAcre)}</strong>
                  <span>
                    {selectedCrop.areaAcres > 0
                      ? `Expense ÷ ${selectedCrop.areaAcres} Ac`
                      : 'Set area to compute'}
                  </span>
                </div>

                <div className="cp-metric-tile">
                  <small>Income / Acre</small>
                  <strong>{formatMetricINR(selectedCrop.incomePerAcre)}</strong>
                  <span>
                    {selectedCrop.areaAcres > 0
                      ? `Income ÷ ${selectedCrop.areaAcres} Ac`
                      : 'Set area to compute'}
                  </span>
                </div>

                <div className="cp-metric-tile highlight">
                  <small>Profit / Acre</small>
                  <strong>{formatMetricINR(selectedCrop.profitPerAcre)}</strong>
                  <span>
                    {selectedCrop.areaAcres > 0
                      ? `Net Profit ÷ ${selectedCrop.areaAcres} Ac`
                      : 'Set area to compute'}
                  </span>
                </div>

                <div className="cp-metric-tile">
                  <small>Cost / Kg</small>
                  <strong>{formatMetricINR(selectedCrop.costPerKg)}</strong>
                  <span>
                    {selectedCrop.totalQuantityKg > 0
                      ? `Expense ÷ ${selectedCrop.totalQuantityKg.toLocaleString('en-IN')} Kg`
                      : 'Record yield/sales Kg'}
                  </span>
                </div>

                <div className="cp-metric-tile">
                  <small>Selling Price / Kg</small>
                  <strong>{formatMetricINR(selectedCrop.sellingPricePerKg)}</strong>
                  <span>
                    {selectedCrop.totalQuantityKg > 0
                      ? `Sales ÷ ${selectedCrop.totalQuantityKg.toLocaleString('en-IN')} Kg`
                      : 'Record sales Kg'}
                  </span>
                </div>

                <div className="cp-metric-tile roi">
                  <small>ROI %</small>
                  <strong>{formatPercent(selectedCrop.roiPercent, 1)}</strong>
                  <span>Net Profit ÷ Total Expense</span>
                </div>
              </div>
            </article>

            <article className="cp-card">
              <div className="cp-card-header">
                <div className="cp-statement-title">
                  <h2>Expense Breakdown — {selectedCrop.crop}</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Cost distribution across Seeds, Fertilizer, Pesticides, Labour, Diesel, Machinery &amp; Transport
                  </span>
                </div>
              </div>
              <div className="cp-chart-box">
                <ResponsiveContainer width="100%" height={235}>
                  <BarChart
                    data={expenseChartData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tickFormatter={formatAxisTick} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [formatINR(val), 'Expense']}
                      contentStyle={{
                        borderRadius: '8px',
                        borderColor: '#e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {expenseChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* 5. Multi-Crop Comparison Chart */}
      {filtered.length > 1 && (
        <article className="cp-card">
          <div className="cp-card-header">
            <div className="cp-statement-title">
              <h2>Crop-wise Income vs Expenses vs Net Profit</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Side-by-side profitability comparison across cultivated crops
              </span>
            </div>
          </div>
          <div className="cp-chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cropComparisonData} margin={{ top: 10, right: 20, left: 4, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="crop" tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tickFormatter={formatAxisTick} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name) => [formatINR(val), name]}
                  contentStyle={{ borderRadius: '8px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Income" fill="#16a34a" radius={[5, 5, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Expenses" fill="#d97706" radius={[5, 5, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Net Profit" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      )}

      {/* 6. Full Crop-wise P&L Comparison Table */}
      <article className="cp-card">
        <div className="cp-card-header">
          <div className="cp-statement-title">
            <h2>All Crops Profit &amp; Loss Matrix</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Click any crop row to open its full itemized P&amp;L statement above
            </span>
          </div>
        </div>

        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th className="num">Area</th>
                <th className="num">Total Income</th>
                <th className="num">Total Expense</th>
                <th className="num">Net Profit</th>
                <th className="num">Cost / Acre</th>
                <th className="num">Income / Acre</th>
                <th className="num">Profit / Acre</th>
                <th className="num">Cost / Kg</th>
                <th className="num">Selling / Kg</th>
                <th className="num">ROI %</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '28px' }}>
                    No crop P&amp;L records match the active filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const isSelected = selectedCrop?.id === row.id
                  return (
                    <tr
                      key={row.id}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => setSelectedCropId(row.id)}
                    >
                      <td>
                        <div className="cp-crop-cell">
                          <strong>{row.crop}</strong>
                          <small>
                            {row.seasons?.length
                              ? row.seasons[0]
                              : row.farms?.length
                                ? row.farms[0]
                                : row.cropType || 'Crop Ledger'}
                          </small>
                        </div>
                      </td>
                      <td className="num">{row.areaAcres > 0 ? `${row.areaAcres} Ac` : '—'}</td>
                      <td className="num" style={{ color: '#059669', fontWeight: 650 }}>
                        {formatINR(row.totalIncome)}
                      </td>
                      <td className="num" style={{ color: '#b45309', fontWeight: 650 }}>
                        {formatINR(row.totalExpenses)}
                      </td>
                      <td className="num">
                        <span className={`cp-profit-badge ${row.netProfit >= 0 ? 'pos' : 'neg'}`}>
                          {formatINR(row.netProfit)}
                        </span>
                      </td>
                      <td className="num">{formatMetricINR(row.costPerAcre)}</td>
                      <td className="num">{formatMetricINR(row.incomePerAcre)}</td>
                      <td className="num" style={{ fontWeight: 650 }}>
                        {formatMetricINR(row.profitPerAcre)}
                      </td>
                      <td className="num">{formatMetricINR(row.costPerKg)}</td>
                      <td className="num">{formatMetricINR(row.sellingPricePerKg)}</td>
                      <td className="num" style={{ color: '#4338ca', fontWeight: 700 }}>
                        {formatPercent(row.roiPercent, 1)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="cp-table-footer">
          <span>
            Showing{' '}
            <strong>
              {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </strong>{' '}
            of <strong>{filtered.length}</strong> crops
          </span>
          <div className="cp-pagination">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                className={currentPage === i + 1 ? 'current' : ''}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
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
      </article>

      <div className="cp-disclaimer">
        Formula: <strong>Net Profit = Total Income − Total Expenses</strong> •{' '}
        <strong>ROI % = (Net Profit ÷ Total Expenses) × 100</strong> • Data source: {dataSource.label}.
      </div>
    </div>
  )
}
