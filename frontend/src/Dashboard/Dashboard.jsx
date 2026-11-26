import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  loadCompleteDashboard,
  buildDashboardWidgets,
  formatINR
} from '../services/dashboardService';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  ChartNoAxesCombinedIcon,
  WalletIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  LandmarkIcon,
  LandPlotIcon,
  MapIcon,
  SproutIcon,
  ShoppingBagIcon,
  WalletCardsIcon,
  ReceiptIcon,
  UsersIcon,
  PackageIcon,
  TractorIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from './DashboardIcons';
import './Dashboard.css';

export default function Dashboard({ onNavigate, userName }) {
  const [txFilter, setTxFilter] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('Kharif 2025');
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const seasonDropdownRef = useRef(null);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Financial summary primary cards
  const [financialCards, setFinancialCards] = useState({
    totalIncome: '₹ 0',
    totalExpense: '₹ 0',
    netProfit: '₹ 0',
    marginText: '0.0% operating margin',
    operatingMargin: '100.0',
    rawIncome: 0,
    rawExpense: 0,
    rawProfit: 0,
    loansFinance: '₹ 0'
  });

  // KPI Widgets (includes 12 standard + loans-finance)
  const [widgets, setWidgets] = useState(() => buildDashboardWidgets({}));

  // Analytical Charts
  const [monthlyCashflowData, setMonthlyCashflowData] = useState([]);
  const [cropProfitData, setCropProfitData] = useState([]);
  const [cropMetric, setCropMetric] = useState('area'); // 'area' or 'profit'

  // Operational Panels Data
  const [activeCrops, setActiveCrops] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  /**
   * Fetch all dashboard data from backend API
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadCompleteDashboard();

      setFinancialCards(data.financialCards);
      setWidgets(data.widgets);
      setMonthlyCashflowData(data.monthlyData);
      setCropProfitData(data.cropProfitData || []);
      setActiveCrops(data.activeCrops);
      setUpcomingPayments(data.upcomingPayments);
      setRecentTransactions(data.recentTransactions);
      setLowStockItems(data.lowStockItems);
    } catch (err) {
      console.error('[Dashboard] Error fetching backend data:', err);
      setError(err.message || 'Unable to load real-time dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Click outside to close season dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(e.target)) {
        setShowSeasonDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredTransactions = recentTransactions.filter((tx) => {
    if (txFilter === 'All') return true;
    return tx.type.toLowerCase() === txFilter.toLowerCase();
  });

  // Helper widget lookups
  const farmAreaWidget = widgets.find((widget) => widget.id === 'total-farm-area');
  const activeCropsWidget = widgets.find((widget) => widget.id === 'active-crops');
  const totalSalesWidget = widgets.find((widget) => widget.id === 'total-sales');
  const totalPurchasesWidget = widgets.find((widget) => widget.id === 'total-purchases');
  const outstandingReceivablesWidget = widgets.find((widget) => widget.id === 'outstanding-receivables');
  const outstandingPayablesWidget = widgets.find((widget) => widget.id === 'outstanding-payables');
  const labourCostWidget = widgets.find((widget) => widget.id === 'labour-cost');
  const inputCostWidget = widgets.find((widget) => widget.id === 'input-cost');
  const machineryCostWidget = widgets.find((widget) => widget.id === 'machinery-cost');
  const loansFinanceWidget = widgets.find((widget) => widget.id === 'loans-finance');

  // Crop Performance computed metrics
  const totalCropArea = cropProfitData.reduce((acc, c) => acc + (Number(c.acres) || 0), 0) || (farmAreaWidget?.numeric || 50);
  const maxCropProfit = Math.max(...cropProfitData.map((c) => Math.abs(Number(c.netProfit) || 0)), 1);

  // Format Y-axis tick values like 0, 50K, 1.0L, 1.5L, 2.0L, 2.5L
  const formatYAxisTick = (val) => {
    if (val === 0) return '0';
    if (val >= 100000) {
      const l = val / 100000;
      return Number.isInteger(l) ? `${l}.0L` : `${l.toFixed(1)}L`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return `${k.toFixed(0)}K`;
    }
    return String(val);
  };

  return (
    <div className="dashboard-page">
      {/* =========================================================================
          1. HEADER SECTION
          ========================================================================= */}
      <div className="financial-summary-header">
        <div className="header-left-title-group">
          <div>
            <h1 className="financial-summary-title">Financial Summary</h1>
            <p className="financial-summary-sub">A quick look at your numbers for this season</p>
          </div>
        </div>

        <div className="header-right-season-group" ref={seasonDropdownRef}>
          {loading && (
            <span className="sync-status-indicator">
              <span className="sync-dot" /> Syncing live data...
            </span>
          )}
          {error && !loading && (
            <button
              type="button"
              className="sync-retry-btn"
              onClick={fetchDashboardData}
              title={error}
            >
              ⚠ Retry Sync
            </button>
          )}

          {/* Season Selector Dropdown */}
          <div className="season-selector-wrapper">
            <button
              type="button"
              className="season-selector-btn"
              onClick={() => setShowSeasonDropdown((prev) => !prev)}
              aria-expanded={showSeasonDropdown}
              aria-haspopup="listbox"
            >
              <span className="season-cal-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="season-name-label">
                Season: <strong>{selectedSeason}</strong>
              </span>
              <span className={`season-chevron ${showSeasonDropdown ? 'open' : ''}`} aria-hidden="true">
                ⌄
              </span>
            </button>

            {showSeasonDropdown && (
              <div className="season-dropdown-menu" role="listbox">
                {['Kharif 2025', 'Rabi 2025–26', 'Zaid 2025', 'Full Year 2025–26'].map((season) => (
                  <button
                    key={season}
                    type="button"
                    className={`season-option-item ${selectedSeason === season ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSeason(season);
                      setShowSeasonDropdown(false);
                    }}
                    role="option"
                    aria-selected={selectedSeason === season}
                  >
                    {selectedSeason === season && <span className="season-check">✓</span>}
                    <span>{season}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN 3-COLUMN DASHBOARD LAYOUT
          ========================================================================= */}
      <section className="dashboard-3col-grid">
        {/* COLUMN 1: Clean Enterprise Net Profit KPI Card */}
        <div
          className="net-profit-panel"
          onClick={() => onNavigate && onNavigate('Reports')}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onNavigate) {
              e.preventDefault();
              onNavigate('Reports');
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="net-profit-top-row">
            <span className="net-profit-title">Net Profit</span>
            <div className="net-profit-badge-btn" aria-hidden="true">
              <ChartNoAxesCombinedIcon size={18} strokeWidth={2.2} />
            </div>
          </div>

          <div className="net-profit-main-val">
            {financialCards.netProfit}
          </div>

          <div className="net-profit-growth-badge">
            {(() => {
              const marginNum = parseFloat(financialCards.operatingMargin || '0');
              const isNeg = marginNum < 0;
              const sign = isNeg ? '' : '+';
              const marginStr = financialCards.operatingMargin || '100.0';
              return (
                <span className={`growth-pill ${isNeg ? 'growth-negative' : 'growth-positive'}`}>
                  {isNeg ? (
                    <TrendingDownIcon size={12} strokeWidth={2.5} />
                  ) : (
                    <TrendingUpIcon size={12} strokeWidth={2.5} />
                  )}
                  {sign}{marginStr}%
                </span>
              );
            })()}
            <span className="growth-text">Compared with last season</span>
          </div>

          {/* Bottom stats row separated by a subtle divider */}
          <div className="net-profit-bottom-row">
            <div className="net-profit-bottom-item">
              <span className="net-profit-stat-icon" aria-hidden="true">
                <LandPlotIcon size={16} strokeWidth={2} />
              </span>
              <div className="net-profit-stat-texts">
                <strong className="net-profit-stat-val">{farmAreaWidget?.value ?? '50 Acres'}</strong>
                <span className="net-profit-stat-label">Cultivated Land</span>
              </div>
            </div>

            <div className="net-profit-stat-divider" aria-hidden="true" />

            <div className="net-profit-bottom-item">
              <span className="net-profit-stat-icon" aria-hidden="true">
                <SproutIcon size={16} strokeWidth={2} />
              </span>
              <div className="net-profit-stat-texts">
                <strong className="net-profit-stat-val">
                  {activeCropsWidget?.numeric ?? activeCrops.length} Crops
                </strong>
                <span className="net-profit-stat-label">Active Crops</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Income vs Expense Chart Panel */}
        <div className="income-expense-chart-card">
          <div className="chart-header-row">
            <h3 className="chart-panel-title">Income vs Expense</h3>
            <div className="chart-legend-pills">
              <span className="chart-legend-item green">
                <span className="legend-dot green" /> Income
              </span>
              <span className="chart-legend-item orange">
                <span className="legend-dot orange" /> Expense
              </span>
            </div>
          </div>

          <div className="chart-body-container">
            {monthlyCashflowData.length === 0 ? (
              <div className="chart-empty-state">
                <p>No monthly transaction records available for this season.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart
                  data={monthlyCashflowData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="chartIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="chartExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e58a2b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#e58a2b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f3ef" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `₹ ${Number(val).toLocaleString('en-IN')}`,
                      name === 'income' ? 'Income' : 'Expense'
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#chartIncomeGrad)"
                    name="income"
                    dot={{ r: 4, fill: '#ffffff', stroke: '#16a34a', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#e58a2b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#chartExpenseGrad)"
                    name="expense"
                    dot={{ r: 4, fill: '#ffffff', stroke: '#e58a2b', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#e58a2b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* COLUMN 3: Vertical Financial KPI Cards */}
        <div className="kpi-vertical-stack">
          {/* 1. Total Income */}
          <div
            className="kpi-vertical-card kpi-border-income"
            onClick={() => onNavigate && onNavigate('Income')}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-card-left">
              <div className="kpi-card-icon-box icon-box-income" aria-hidden="true">
                <WalletIcon size={25} strokeWidth={2.2} />
              </div>
              <div className="kpi-card-text">
                <span className="kpi-card-title">Total Income</span>
                <strong className="kpi-card-value text-green">{financialCards.totalIncome}</strong>
              </div>
            </div>
            <span className="kpi-trend-pill trend-green">↗</span>
          </div>

          {/* 2. Total Expense */}
          <div
            className="kpi-vertical-card kpi-border-expense"
            onClick={() => onNavigate && onNavigate('Expenses')}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-card-left">
              <div className="kpi-card-icon-box icon-box-expense" aria-hidden="true">
                <ReceiptTextIcon size={25} strokeWidth={2.2} />
              </div>
              <div className="kpi-card-text">
                <span className="kpi-card-title">Total Expense</span>
                <strong className="kpi-card-value">{financialCards.totalExpense}</strong>
              </div>
            </div>
            <span className="kpi-trend-pill trend-orange">↘</span>
          </div>

          {/* 3. Total Sales */}
          <div
            className="kpi-vertical-card kpi-border-sales"
            onClick={() => onNavigate && onNavigate('Sales')}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-card-left">
              <div className="kpi-card-icon-box icon-box-sales" aria-hidden="true">
                <ShoppingCartIcon size={25} strokeWidth={2.2} />
              </div>
              <div className="kpi-card-text">
                <span className="kpi-card-title">Total Sales</span>
                <strong className="kpi-card-value text-blue">{totalSalesWidget?.value ?? '₹ 0'}</strong>
              </div>
            </div>
            <span className="kpi-trend-pill trend-blue">↗</span>
          </div>

          {/* 4. Loans & Finance */}
          <div
            className="kpi-vertical-card kpi-border-loans"
            onClick={() => onNavigate && onNavigate('Loans & Finance')}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-card-left">
              <div className="kpi-card-icon-box icon-box-loans" aria-hidden="true">
                <LandmarkIcon size={25} strokeWidth={2.2} />
              </div>
              <div className="kpi-card-text">
                <span className="kpi-card-title">Loans &amp; Finance</span>
                <strong className="kpi-card-value">{loansFinanceWidget?.value ?? '₹ 0'}</strong>
              </div>
            </div>
            <span className="kpi-trend-pill trend-neutral">-</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MORE FARM METRICS SECTION (Horizontal row of 8 cards)
          ========================================================================= */}
      <section className="more-metrics-section">
        <div className="more-metrics-header">
          <div className="more-metrics-title-row">
            <span className="more-metrics-icon" aria-hidden="true">
              <ChartNoAxesCombinedIcon size={20} strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="more-metrics-title">More Farm Metrics</h3>
              <p className="more-metrics-sub">Sales, purchases, receivables and operating costs.</p>
            </div>
          </div>
        </div>

        <div className="more-metrics-row">
          {/* 1. Active Crops */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Crop Master')}>
            <div className="more-metric-icon-box icon-box-crops" aria-hidden="true">
              <SproutIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Active Crops</span>
            <strong className="more-metric-value">{activeCropsWidget?.numeric ?? activeCrops.length} Crops</strong>
          </div>

          {/* 2. Total Purchases */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Purchases')}>
            <div className="more-metric-icon-box icon-box-purchases" aria-hidden="true">
              <ShoppingBagIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Total Purchases</span>
            <strong className="more-metric-value">{totalPurchasesWidget?.value ?? '₹ 0'}</strong>
          </div>

          {/* 3. Outstanding Receivables */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Receivables')}>
            <div className="more-metric-icon-box icon-box-receivables" aria-hidden="true">
              <WalletCardsIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Outstanding Receivables</span>
            <strong className="more-metric-value text-blue">{outstandingReceivablesWidget?.value ?? '₹ 0'}</strong>
          </div>

          {/* 4. Outstanding Payables */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Payments')}>
            <div className="more-metric-icon-box icon-box-payables" aria-hidden="true">
              <ReceiptIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Outstanding Payables</span>
            <strong className="more-metric-value text-red">{outstandingPayablesWidget?.value ?? '₹ 0'}</strong>
          </div>

          {/* 5. Labour Cost */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Labour Attendance')}>
            <div className="more-metric-icon-box icon-box-labour" aria-hidden="true">
              <UsersIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Labour Cost</span>
            <strong className="more-metric-value">{labourCostWidget?.value ?? '₹ 0'}</strong>
          </div>

          {/* 6. Input Cost */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Inventory')}>
            <div className="more-metric-icon-box icon-box-input" aria-hidden="true">
              <PackageIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Input Cost</span>
            <strong className="more-metric-value">{inputCostWidget?.value ?? '₹ 0'}</strong>
          </div>

          {/* 7. Machinery Cost */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Machinery Usage')}>
            <div className="more-metric-icon-box icon-box-machinery" aria-hidden="true">
              <TractorIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Machinery Cost</span>
            <strong className="more-metric-value">{machineryCostWidget?.value ?? '₹ 0'}</strong>
          </div>

          {/* 8. Total Farm Area */}
          <div className="more-metric-card" onClick={() => onNavigate && onNavigate('Farms')}>
            <div className="more-metric-icon-box icon-box-land" aria-hidden="true">
              <MapIcon size={25} strokeWidth={2.2} />
            </div>
            <span className="more-metric-name">Total Farm Area</span>
            <strong className="more-metric-value">{farmAreaWidget?.value ?? '50 Acres'}</strong>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ROW ONE: CROP PERFORMANCE (Left) & ACTIVE CROPS (Right)
          ========================================================================= */}
      <section className="dashboard-two-col-row">
        {/* Section 1: Crop Performance */}
        <div className="panel-box crop-performance-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Crop Performance</h3>
              <span className="panel-sub">Cultivated area and profitability by crop.</span>
            </div>
            <div className="crop-metric-toggle">
              <button
                type="button"
                className={`metric-toggle-btn ${cropMetric === 'area' ? 'active' : ''}`}
                onClick={() => setCropMetric('area')}
              >
                Area
              </button>
              <button
                type="button"
                className={`metric-toggle-btn ${cropMetric === 'profit' ? 'active' : ''}`}
                onClick={() => setCropMetric('profit')}
              >
                Profit
              </button>
            </div>
          </div>

          <div className="crop-performance-body">
            {cropProfitData.length === 0 ? (
              <div className="dashboard-empty-card-state">
                <SproutIcon size={28} strokeWidth={1.8} className="empty-state-icon" />
                <p>{loading ? 'Loading crop performance data...' : 'No crop performance records available.'}</p>
              </div>
            ) : cropMetric === 'area' ? (
              /* Area View: Horizontal progress bars */
              <div className="crop-area-list">
                {cropProfitData.map((item, idx) => {
                  const acres = Number(item.acres) || 0;
                  const pct = totalCropArea > 0 ? ((acres / totalCropArea) * 100).toFixed(1) : '0.0';
                  const greenShades = [
                    'linear-gradient(90deg, #1b4332, #2d6a4f)',
                    'linear-gradient(90deg, #245438, #16834a)',
                    'linear-gradient(90deg, #2d6a4f, #40916c)',
                    'linear-gradient(90deg, #1e4620, #386641)',
                    'linear-gradient(90deg, #2b6140, #52b788)',
                    'linear-gradient(90deg, #1a4329, #2d6a4f)',
                    'linear-gradient(90deg, #2d5a3c, #40916c)'
                  ];
                  const barGradient = greenShades[idx % greenShades.length];

                  return (
                    <div key={item.id || item.crop} className="crop-area-row">
                      <div className="crop-area-meta">
                        <span className="crop-area-name">{item.crop}</span>
                        <div className="crop-area-numbers">
                          <strong className="crop-area-val">{acres} Acres</strong>
                          <span className="crop-area-pct">({pct}%)</span>
                        </div>
                      </div>
                      <div className="crop-area-track">
                        <div
                          className="crop-area-fill"
                          style={{
                            width: `${Math.min(Math.max(Number(pct), 4), 100)}%`,
                            background: barGradient
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Profit View: Horizontal bar chart with Income, Expense & Net Profit */
              <div className="crop-profit-list">
                {cropProfitData.map((item) => {
                  const profit = Number(item.netProfit) || 0;
                  const isPositive = profit >= 0;
                  const profitRatio = maxCropProfit > 0 ? (Math.abs(profit) / maxCropProfit) * 100 : 0;

                  return (
                    <div key={item.id || item.crop} className="crop-profit-row">
                      <div className="crop-profit-meta">
                        <div className="crop-profit-name-group">
                          <strong className="crop-profit-name">{item.crop}</strong>
                          <span className="crop-profit-breakdown">
                            Inc: {formatINR(item.income)} • Exp: {formatINR(item.expense)}
                          </span>
                        </div>
                        <span className={`crop-profit-badge ${isPositive ? 'profit-pos' : 'profit-neg'}`}>
                          {isPositive ? `+ ${formatINR(profit)}` : `- ${formatINR(Math.abs(profit))}`}
                        </span>
                      </div>
                      <div className="crop-profit-track">
                        <div
                          className={`crop-profit-fill ${isPositive ? 'fill-pos' : 'fill-neg'}`}
                          style={{
                            width: `${Math.min(Math.max(profitRatio, 5), 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Active Crops */}
        <div className="panel-box active-crops-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Active Crops</h3>
              <span className="panel-sub">Current standing crop cycles.</span>
            </div>
            <button
              type="button"
              className="panel-link-btn"
              onClick={() => onNavigate && onNavigate('Crop Master')}
            >
              View Crops ({activeCrops.length}) →
            </button>
          </div>

          <div className="panel-table-container">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Crop &amp; Variety</th>
                  <th>Farm Parcel</th>
                  <th>Area</th>
                  <th>Sowing</th>
                  <th>Harvest</th>
                  <th>Exp. Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeCrops.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="dashboard-table-empty">
                      {loading ? 'Loading active crops...' : 'No active crop cycles found.'}
                    </td>
                  </tr>
                ) : (
                  activeCrops.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="crop-td-name">
                          <span className="crop-outline-icon" aria-hidden="true">
                            <SproutIcon size={16} strokeWidth={2} />
                          </span>
                          <div>
                            <strong>{c.crop}</strong>
                            <small>{c.variety}</small>
                          </div>
                        </div>
                      </td>
                      <td>{c.farm}</td>
                      <td><strong className="text-forest">{c.area}</strong></td>
                      <td>{c.sowing}</td>
                      <td>{c.harvest}</td>
                      <td className="amount-col">{c.expRevenue}</td>
                      <td>
                        <span className={`status-badge ${c.status === 'Harvested' ? 'done' : c.status === 'Registered' ? 'neutral' : 'live'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. ROW TWO: UPCOMING PAYMENTS (Left) & RECENT TRANSACTIONS (Right)
          ========================================================================= */}
      <section className="dashboard-two-col-row">
        {/* Section 3: Upcoming Payments */}
        <div className="panel-box upcoming-payments-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Upcoming Payments</h3>
              <span className="panel-sub">Loan EMIs, input dealer and labour dues.</span>
            </div>
            <button
              type="button"
              className="panel-link-btn"
              onClick={() => onNavigate && onNavigate('Payments')}
            >
              Payments Ledger →
            </button>
          </div>

          <div className="payments-cards-list">
            {upcomingPayments.length === 0 ? (
              <div className="dashboard-empty-card-state">
                <CalendarIcon size={32} strokeWidth={1.8} className="empty-state-icon" />
                <p>No upcoming payments scheduled.</p>
              </div>
            ) : (
              upcomingPayments.map((p) => {
                const isOverdue = p.status?.toLowerCase().includes('overdue');
                const isPaid = p.status?.toLowerCase().includes('paid');
                const isUpcoming = p.status?.toLowerCase().includes('upcoming');
                const statusClass = isOverdue ? 'status-overdue' : isPaid ? 'status-paid' : isUpcoming ? 'status-upcoming' : 'status-due-soon';

                return (
                  <div key={p.id} className={`payment-item-card ${isOverdue ? 'payment-card-overdue' : ''}`}>
                    <div className="payment-date-badge">
                      <span className="p-day">{p.day}</span>
                      <span className="p-month">{p.month}</span>
                    </div>
                    <div className="payment-body">
                      <strong className="payment-title">{p.payee}</strong>
                      <p className="payment-purpose">{p.purpose}</p>
                      <span className="payment-tag">{p.category}</span>
                    </div>
                    <div className="payment-right">
                      <span className="p-amount">{p.amount}</span>
                      <span className={`p-status-pill ${statusClass}`}>{p.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 4: Recent Transactions */}
        <div className="panel-box recent-transactions-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Recent Transactions</h3>
              <span className="panel-sub">Latest cash and bank log.</span>
            </div>
            <div className="tx-filter-pills">
              {['All', 'Income', 'Expense'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`tx-filter-btn ${txFilter === f ? 'active' : ''}`}
                  onClick={() => setTxFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-table-container">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Voucher</th>
                  <th>Date</th>
                  <th>Description / Party</th>
                  <th>Type</th>
                  <th>Payment Mode</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="dashboard-table-empty">
                      {loading ? 'Loading recent transactions...' : `No transactions found for "${txFilter}".`}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type?.toLowerCase() === 'income';
                    return (
                      <tr key={tx.id}>
                        <td><span className="voucher-tag">{tx.voucher}</span></td>
                        <td>{tx.date}</td>
                        <td>
                          <div>
                            <strong>{tx.title}</strong>
                            <small className="tx-party-sub">{tx.party}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`tx-type-badge ${isIncome ? 'in' : 'out'}`}>
                            {isIncome ? '↗ Income' : '↘ Expense'}
                          </span>
                        </td>
                        <td>{tx.mode}</td>
                        <td className={`amount-col ${isIncome ? 'text-income-cell' : 'text-expense-cell'}`}>
                          {isIncome ? `+ ${tx.amount}` : `- ${tx.amount}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. ROW THREE: LOW STOCK ITEMS (Full Width)
          ========================================================================= */}
      <section className="dashboard-full-row">
        <div className="panel-box low-stock-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Low Stock Items</h3>
              <span className="panel-sub">Critical inventory replenishment alerts.</span>
            </div>
            <button
              type="button"
              className="panel-link-btn"
              onClick={() => onNavigate && onNavigate('Inventory')}
            >
              Inventory Ledger →
            </button>
          </div>

          <div className="panel-table-container">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min. Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="dashboard-table-empty">
                      <div className="empty-inline-box">
                        <CheckCircleIcon size={18} strokeWidth={2} className="text-green" />
                        <span>All inventory items are within safe stock levels.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((s) => {
                    const isCritical = s.level === 'critical';
                    const isWarning = s.level === 'warning';
                    const badgeClass = isCritical ? 'stock-critical' : isWarning ? 'stock-warning' : 'stock-normal';

                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="stock-td-item">
                            <span className="stock-outline-icon" aria-hidden="true">
                              <PackageIcon size={16} strokeWidth={2} />
                            </span>
                            <strong>{s.item}</strong>
                          </div>
                        </td>
                        <td>{s.category}</td>
                        <td>
                          <strong className={isCritical ? 'text-red' : isWarning ? 'text-amber' : 'text-green'}>
                            {s.currentQty}
                          </strong>
                        </td>
                        <td>{s.minStock}</td>
                        <td>
                          <span className={`stock-status-pill ${badgeClass}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
