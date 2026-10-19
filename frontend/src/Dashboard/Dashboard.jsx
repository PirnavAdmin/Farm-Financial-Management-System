import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
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

export default function Dashboard({ onNavigate }) {
  const [showAllWidgets, setShowAllWidgets] = useState(true);
  const [txFilter, setTxFilter] = useState('All');

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

  return (
    <div className="dashboard-page">
      {/* 1. Header */}
      <div className="dashboard-title-row">
        <div>
          <h1 className="dashboard-main-title">Dashboard</h1>
          <p className="dashboard-sub">
            Real-time financial overview and farm operational intelligence
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

      {/* 2. Top 3 Primary Cards (Wireframe Section 3) */}
      <section className="top-financial-cards">
        <div
          className="fin-card card-income"
          onClick={() => onNavigate && onNavigate('Income')}
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
      </section>

      {/* 3. Dashboard Widgets Grid (All 12 Widgets from Requirements List) */}
      <section className="widgets-section">
        <div className="section-header-row">
          <div>
            <h3 className="section-heading">Dashboard Widgets</h3>
            <span className="section-sub-tag">Comprehensive Operational &amp; Financial Metrics</span>
          </div>
          <button
            type="button"
            className="toggle-widgets-btn"
            onClick={() => setShowAllWidgets((prev) => !prev)}
          >
            {showAllWidgets ? 'Collapse Widgets ▲' : 'View All 12 Widgets ▼'}
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

      {/* 4. Analytical Charts Grid (Wireframe Section 3) */}
      <section className="charts-grid-two">
        {/* Crop-wise Profit [Chart] */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Crop-wise Profit</h3>
              <span className="chart-badge">[Chart]</span>
            </div>
            <div className="chart-legend-row">
              <span className="legend-chip green"><i /> Income</span>
              <span className="legend-chip amber"><i /> Expense</span>
              <span className="legend-chip emerald"><i /> Profit</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cropProfitData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ece8" vertical={false} />
                <XAxis
                  dataKey="crop"
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
                    name === 'income' ? 'Income' : name === 'expense' ? 'Expense' : 'Net Profit'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d2dcd4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                <Bar dataKey="income" name="income" fill="#2d6a4f" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="expense" name="expense" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="netProfit" name="netProfit" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense [Monthly Chart] */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Income vs Expense</h3>
              <span className="chart-badge">[Monthly Chart]</span>
            </div>
            <div className="chart-legend-row">
              <span className="legend-chip green"><i /> Monthly Inflow</span>
              <span className="legend-chip amber"><i /> Monthly Outflow</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
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
              onClick={() => onNavigate && onNavigate('Crops')}
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
