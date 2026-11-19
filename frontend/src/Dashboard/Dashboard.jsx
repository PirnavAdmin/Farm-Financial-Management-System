import React, { useState, useEffect, useCallback } from 'react';
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
  buildDashboardWidgets
} from '../services/dashboardService';
import './Dashboard.css';

export default function Dashboard({ onNavigate, userName }) {
  const [showAllWidgets, setShowAllWidgets] = useState(false);
  const [txFilter, setTxFilter] = useState('All');
  const [cropMetric, setCropMetric] = useState('area');

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Financial summary primary cards
  const [financialCards, setFinancialCards] = useState({
    totalIncome: '₹ 0',
    totalExpense: '₹ 0',
    netProfit: '₹ 0',
    marginText: '0.0% operating margin'
  });

  // 12 KPI Widgets
  const [widgets, setWidgets] = useState(() => buildDashboardWidgets({}));

  // Analytical Charts
  const [cropProfitData, setCropProfitData] = useState([]);
  const [monthlyCashflowData, setMonthlyCashflowData] = useState([]);

  // Quad Panels Data
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
      setCropProfitData(data.cropProfitData);
      setMonthlyCashflowData(data.monthlyData);
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

  const filteredTransactions = recentTransactions.filter((tx) => {
    if (txFilter === 'All') return true;
    return tx.type.toLowerCase() === txFilter.toLowerCase();
  });
  const farmAreaWidget = widgets.find((widget) => widget.id === 'total-farm-area');
  const activeCropsWidget = widgets.find((widget) => widget.id === 'active-crops');
  const greetingName = String(userName || '').trim().split(/\s+/)[0];
  const displayName = greetingName && !greetingName.includes('@') && greetingName !== 'User'
    ? greetingName
    : 'there';
  const cropPerformanceData = cropMetric === 'area'
    ? activeCrops.slice(0, 4).map((crop) => ({
      id: crop.id,
      label: crop.crop,
      value: Number.parseFloat(crop.area) || 0,
      displayValue: crop.area
    }))
    : cropProfitData.slice(0, 4).map((crop) => ({
      id: crop.id,
      label: crop.crop,
      value: Number(crop.netProfit) || 0,
      displayValue: `₹ ${Number(crop.netProfit).toLocaleString('en-IN')}`
    }));
  const maxCropPerformance = Math.max(...cropPerformanceData.map((crop) => crop.value), 1);

  return (
    <div className="dashboard-page">
      {/* 1. Header */}
      <div className="dashboard-title-row">
        <div>
          <h1 className="dashboard-main-title">Good morning, {displayName}</h1>
          <p className="dashboard-sub">
            Here’s what’s happening across your farm this season.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loading && (
            <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="badge-dot" style={{ background: '#0284c7', display: 'inline-block' }} /> Syncing live data...
            </span>
          )}
          {error && !loading && (
            <button
              type="button"
              onClick={fetchDashboardData}
              title={error}
              style={{
                fontSize: '11.5px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              ⚠ Retry Sync
            </button>
          )}
          <div className="dashboard-header-badge">
            <span className="badge-dot" /> Kharif &amp; Rabi 2025–26
          </div>
        </div>
      </div>

      <section className="season-banner">
        <div className="season-banner-content">
          <span className="season-banner-eyebrow">SEASON AT A GLANCE</span>
          <h2>A healthy season starts with a clear picture.</h2>
          <p>Track farm finances, crop progress and upcoming work — all in one place.</p>
          <div className="season-highlights">
            <span>● {activeCropsWidget?.numeric ?? activeCrops.length} active crops</span>
            <span>● {farmAreaWidget?.value ?? '0 Acres'} in cultivation</span>
          </div>
        </div>
        <div className="season-banner-mark" aria-hidden="true">♧</div>
      </section>

      <div className="dashboard-section-heading">
        <div>
          <h2>Financial summary</h2>
          <p>A quick look at your numbers for this season</p>
        </div>
      </div>

      {/* 2. Primary financial and farm area cards */}
      <section className="top-financial-cards">
        <div
          className="fin-card card-income"
          onClick={() => onNavigate && onNavigate('Income')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (onNavigate) onNavigate('Income');
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="fin-card-header">
            <span className="fin-label">Total Income</span>
            <span className="fin-icon green">↗</span>
          </div>
          <div className="fin-amount">{financialCards.totalIncome}</div>
          <div className="fin-sub">Realized sales &amp; agri subsidies</div>
        </div>

        <div
          className="fin-card card-expense"
          onClick={() => onNavigate && onNavigate('Expenses')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (onNavigate) onNavigate('Expenses');
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="fin-card-header">
            <span className="fin-label">Total Expense</span>
            <span className="fin-icon amber">↘</span>
          </div>
          <div className="fin-amount">{financialCards.totalExpense}</div>
          <div className="fin-sub">Inputs, labour &amp; machinery costs</div>
        </div>

        <div
          className="fin-card card-profit"
          onClick={() => onNavigate && onNavigate('Reports')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (onNavigate) onNavigate('Reports');
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="fin-card-header">
            <span className="fin-label">Net Profit</span>
            <span className="fin-icon emerald">★</span>
          </div>
          <div className="fin-amount profit-text">{financialCards.netProfit}</div>
          <div className="fin-sub">{financialCards.marginText}</div>
        </div>

        <div
          className="fin-card card-area"
          onClick={() => onNavigate && onNavigate('Farms')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (onNavigate) onNavigate('Farms');
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="fin-card-header">
            <span className="fin-label">Cultivated Land</span>
            <span className="fin-icon green">⌂</span>
          </div>
          <div className="fin-amount">{farmAreaWidget?.value ?? '0 Acres'}</div>
          <div className="fin-sub">{farmAreaWidget?.subtext ?? 'Across your active farm parcels'}</div>
        </div>
      </section>

      {/* Additional KPIs stay available without crowding the overview. */}
      <section className="widgets-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-heading">More farm metrics</h3>
            <span className="section-sub-tag">Sales, purchases, receivables and operating costs</span>
          </div>
          <button
            type="button"
            className="toggle-widgets-btn"
            onClick={() => setShowAllWidgets((prev) => !prev)}
          >
            {showAllWidgets ? 'Hide metrics ▲' : 'View all 12 metrics ▼'}
          </button>
        </div>

        {showAllWidgets && (
          <div className="widgets-grid-12">
            {widgets.map((w) => (
              <div key={w.id} className="kpi-widget-card" style={{ borderLeftColor: w.color }}>
                <div className="kpi-widget-top">
                  <span className="kpi-widget-label">{w.label}</span>
                  <span className="kpi-widget-icon" style={{ backgroundColor: w.bgColor, color: w.color }}>
                    {w.icon}
                  </span>
                </div>
                <div className="kpi-widget-val" style={{ color: w.color }}>
                  {w.value}
                </div>
                <div className="kpi-widget-sub">{w.subtext}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Analytical charts */}
      <section className="charts-grid-two">
        {/* Crop area or profitability */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Crop performance</h3>
              <span className="chart-badge">
                {cropMetric === 'area' ? 'Cultivated area by crop' : 'Net profit by crop'}
              </span>
            </div>
            <div className="crop-metric-toggle" role="group" aria-label="Crop performance metric">
              <button
                type="button"
                className={cropMetric === 'area' ? 'active' : ''}
                onClick={() => setCropMetric('area')}
              >
                Area
              </button>
              <button
                type="button"
                className={cropMetric === 'profit' ? 'active' : ''}
                onClick={() => setCropMetric('profit')}
              >
                Profit
              </button>
            </div>
          </div>

          <div className="crop-performance-list">
            {cropPerformanceData.length === 0 ? (
              <div className="dashboard-empty-state">
                {loading ? 'Loading crop performance...' : 'No crop performance data available yet.'}
              </div>
            ) : (
              cropPerformanceData.map((crop) => (
                <div className="crop-performance-row" key={crop.id}>
                  <span className="crop-performance-name">{crop.label}</span>
                  <div className="crop-performance-track">
                    <span style={{ width: `${Math.max((crop.value / maxCropPerformance) * 100, crop.value ? 4 : 0)}%` }} />
                  </div>
                  <span className="crop-performance-value">{crop.displayValue}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly cashflow */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Income &amp; expenses</h3>
              <span className="chart-badge">Your farm finances, month by month</span>
            </div>
            <div className="chart-legend-row">
              <span className="legend-chip green"><i /> Income</span>
              <span className="legend-chip amber"><i /> Expenses</span>
            </div>
          </div>

          <div className="cashflow-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyCashflowData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ece8" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#ccd6cd' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#ccd6cd' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val, name) => [
                    `₹ ${Number(val).toLocaleString('en-IN')}`,
                    name === 'income' ? 'Income' : 'Expense'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d2dcd4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#2d6a4f"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incGrad)"
                  name="income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expGrad)"
                  name="expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 5. 4 Core Sections (Wireframe Section 3) */}
      <section className="quad-panels-grid">
        {/* 1. Active Crops */}
        <div className="panel-box">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Active Crops</h3>
              <span className="panel-sub">Current standing crop cycles</span>
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
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      {loading ? 'Loading active crops...' : 'No active crop cycles found.'}
                    </td>
                  </tr>
                ) : (
                  activeCrops.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="crop-td-name">
                          <span className="crop-seed-ico">🌱</span>
                          <div>
                            <strong>{c.crop}</strong>
                            <small>{c.variety}</small>
                          </div>
                        </div>
                      </td>
                      <td>{c.farm}</td>
                      <td><strong>{c.area}</strong></td>
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

        {/* 2. Upcoming Payments */}
        <div className="panel-box">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Upcoming Payments</h3>
              <span className="panel-sub">Loan EMIs, input dealer &amp; labour dues</span>
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
              <div style={{ textAlign: 'center', padding: '28px', color: '#6b7280' }}>
                {loading ? 'Loading scheduled payments...' : 'No upcoming payments scheduled.'}
              </div>
            ) : (
              upcomingPayments.map((p) => (
                <div key={p.id} className="payment-item-card">
                  <div className="payment-date-badge">
                    <span className="p-day">{p.day}</span>
                    <span className="p-month">{p.month}</span>
                  </div>
                  <div className="payment-body">
                    <strong>{p.payee}</strong>
                    <p>{p.purpose}</p>
                    <span className="payment-tag">{p.category}</span>
                  </div>
                  <div className="payment-right">
                    <span className="p-amount">{p.amount}</span>
                    <span className="p-status-pill">{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Recent Transactions */}
        <div className="panel-box">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Recent Transactions</h3>
              <span className="panel-sub">Latest cash and bank log</span>
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      {loading ? 'Loading recent transactions...' : `No transactions found for "${txFilter}".`}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td><span className="voucher-tag">{tx.voucher}</span></td>
                      <td>{tx.date}</td>
                      <td>
                        <div>
                          <strong>{tx.title}</strong>
                          <small style={{ display: 'block', color: '#6b7280' }}>{tx.party}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`tx-type-badge ${tx.type === 'Income' ? 'in' : 'out'}`}>
                          {tx.type === 'Income' ? '↗ Income' : '↘ Expense'}
                        </span>
                      </td>
                      <td>{tx.mode}</td>
                      <td className={`amount-col ${tx.type === 'Income' ? 'text-green' : 'text-amber'}`}>
                        {tx.type === 'Income' ? `+ ${tx.amount}` : `- ${tx.amount}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Low Stock Items */}
        <div className="panel-box">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-title">Low Stock Items</h3>
              <span className="panel-sub">Critical inventory replenishment alerts</span>
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
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      {loading ? 'Loading inventory alerts...' : 'All inventory items are within safe stock levels.'}
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="stock-td-item">
                          <span className="stock-ico">📦</span>
                          <strong>{s.item}</strong>
                        </div>
                      </td>
                      <td>{s.category}</td>
                      <td><strong className="text-red">{s.currentQty}</strong></td>
                      <td>{s.minStock}</td>
                      <td>
                        <span className={`stock-status-pill ${s.level}`}>
                          {s.status}
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
    </div>
  );
}
