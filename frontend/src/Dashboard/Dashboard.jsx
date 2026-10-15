import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import QuickPayModal from '../components/QuickPayModal';
import ReorderModal from '../components/ReorderModal';

export default function Dashboard({ onNavigate }) {
  const {
    crops,
    metrics,
    cropProfitSummary,
    monthlyCashflow,
    cropSeasons,
    upcomingPayments,
    recentTransactions,
    lowStockItems
  } = useFarm();

  const [activePaymentForPay, setActivePaymentForPay] = useState(null);
  const [activeItemForReorder, setActiveItemForReorder] = useState(null);
  const [txFilter, setTxFilter] = useState('All');

  // Filter transactions
  const filteredTransactions = recentTransactions.filter((tx) => {
    if (txFilter === 'All') return true;
    return tx.type.toLowerCase() === txFilter.toLowerCase();
  });

  // Dynamically compute Crop-wise Profit data for ALL crops (ensuring all 8 crops appear on the chart)
  const dynamicCropProfitData = useMemo(() => {
    return crops.map((c) => {
      // 1. Check if exact financial entry exists in cropProfitSummary
      const foundInSummary = cropProfitSummary.find(
        (cps) => cps.crop?.toLowerCase() === c.name?.toLowerCase()
      );
      if (foundInSummary) return foundInSummary;

      // 2. Check if a season entry exists with revenue
      const foundInSeason = cropSeasons.find(
        (cs) => (cs.cropId === c.id || cs.cropName?.toLowerCase() === c.name?.toLowerCase()) && cs.expectedRevenue
      );
      if (foundInSeason && foundInSeason.expectedRevenue) {
        const inc = Number(foundInSeason.expectedRevenue) || 0;
        const exp = Number(foundInSeason.totalExpenses) || Math.round(inc * 0.35);
        return {
          crop: c.name,
          acres: Number(foundInSeason.area) || 5,
          income: inc,
          expense: exp,
          netProfit: inc - exp
        };
      }

      // 3. Baseline projection for registered crops
      let inc = 140000;
      let exp = 55000;
      if (c.name?.toLowerCase() === 'sugarcane') {
        inc = 310000;
        exp = 110000;
      }
      return {
        crop: c.name,
        acres: 5,
        income: inc,
        expense: exp,
        netProfit: inc - exp
      };
    });
  }, [crops, cropProfitSummary, cropSeasons]);

  // Ensure every crop in the Crops module has an entry and is visible on Dashboard Active Crops
  const activeCropsList = crops.map((c) => {
    const existing = cropSeasons.find(
      (cs) => cs.cropId === c.id || cs.cropName?.toLowerCase() === c.name?.toLowerCase()
    );
    const varietyName = Array.isArray(c.varieties) ? c.varieties[0] : (c.varieties || 'Standard');

    if (existing) {
      // Clean up previous dummy dates if they were auto-generated
      if (existing.sowingDate === '2026-10-15' && existing.expectedHarvestDate === '2027-02-02') {
        return {
          ...existing,
          variety: varietyName,
          farmName: 'Unassigned',
          area: null,
          sowingDate: null,
          expectedHarvestDate: null,
          expectedRevenue: null,
          status: 'Registered'
        };
      }
      return existing;
    }

    return {
      id: c.id,
      cropName: c.name,
      variety: varietyName,
      farmName: 'Unassigned',
      area: null,
      areaUnit: 'Acres',
      sowingDate: null,
      expectedHarvestDate: null,
      expectedRevenue: null,
      status: 'Registered'
    };
  });

  const formatCurrency = (val) => {
    return '₹ ' + (Number(val) || 0).toLocaleString('en-IN');
  };

  return (
    <div className="dashboard-wrapper">
      {/* Dashboard Title */}
      <div className="dashboard-header-simple">
        <h1 className="dashboard-main-heading">Dashboard</h1>
      </div>

      {/* Top 3 Summary Cards */}
      <section className="top-summary-grid">
        <div className="summary-card card-income" onClick={() => onNavigate && onNavigate('Income')}>
          <div className="summary-card-label">Total Income</div>
          <div className="summary-card-value">{formatCurrency(metrics.totalIncome)}</div>
        </div>

        <div className="summary-card card-expense" onClick={() => onNavigate && onNavigate('Expenses')}>
          <div className="summary-card-label">Total Expense</div>
          <div className="summary-card-value">{formatCurrency(metrics.totalExpense)}</div>
        </div>

        <div className="summary-card card-profit" onClick={() => onNavigate && onNavigate('Reports')}>
          <div className="summary-card-label">Net Profit</div>
          <div className="summary-card-value highlight-profit">{formatCurrency(metrics.netProfit)}</div>
        </div>
      </section>

      {/* Analytical Charts */}
      <div className="dashboard-charts-grid">
        {/* Crop-wise Profit [Chart] */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <h3 className="chart-title">Crop-wise Profit</h3>
              <span className="chart-sub-tag">[Chart]</span>
            </div>
          </div>

          <div className="chart-container" style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicCropProfitData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ece8" vertical={false} />
                <XAxis
                  dataKey="crop"
                  tick={{ fill: '#556558', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#ccd6cd' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fill: '#738377', fontSize: 11 }}
                  axisLine={{ stroke: '#ccd6cd' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val, name) => [
                    `₹ ${Number(val).toLocaleString('en-IN')}`,
                    name === 'income' ? 'Gross Revenue' : name === 'expense' ? 'Total Expenses' : 'Net Profit'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d2dcd4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                  formatter={(value) => (value === 'income' ? 'Income' : value === 'expense' ? 'Expenses' : 'Net Profit')}
                />
                <Bar dataKey="income" fill="#2d6a4f" radius={[4, 4, 0, 0]} name="income" />
                <Bar dataKey="expense" fill="#d97706" radius={[4, 4, 0, 0]} name="expense" />
                <Bar dataKey="netProfit" fill="#059669" radius={[4, 4, 0, 0]} name="netProfit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expense [Monthly Chart] */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <div>
              <h3 className="chart-title">Income vs Expense</h3>
              <span className="chart-sub-tag">[Monthly Chart]</span>
            </div>
            <div className="chart-legend-pill">
              <span className="dot green" /> Income
              <span className="dot amber" /> Expense
            </div>
          </div>

          <div className="chart-container" style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyCashflow}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ece8" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#556558', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#ccd6cd' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fill: '#738377', fontSize: 11 }}
                  axisLine={{ stroke: '#ccd6cd' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val, name) => [
                    `₹ ${Number(val).toLocaleString('en-IN')}`,
                    name === 'income' ? 'Monthly Income' : 'Monthly Expense'
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#d2dcd4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                  formatter={(value) => (value === 'income' ? 'Income' : 'Expense')}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#2d6a4f"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4 Essential Functional Sections */}
      <div className="dashboard-quad-grid">
        {/* 1. Active Crops */}
        <div className="quad-card">
          <div className="quad-card-header">
            <h3 className="quad-title">Active Crops</h3>
            <button
              type="button"
              className="quad-action-link"
              onClick={() => onNavigate && onNavigate('Crops')}
            >
              View All ({activeCropsList.length}) →
            </button>
          </div>

          <div className="crops-table-wrapper">
            <table className="mini-data-table">
              <thead>
                <tr>
                  <th>Crop & Variety</th>
                  <th>Farm Parcel</th>
                  <th>Area</th>
                  <th>Sowing</th>
                  <th>Harvest</th>
                  <th>Exp. Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeCropsList.map((cs) => (
                  <tr key={cs.id}>
                    <td>
                      <div className="crop-cell-primary">
                        <span className="crop-seed-icon">♧</span>
                        <div>
                          <strong>{cs.cropName}</strong>
                          <small>{cs.variety}</small>
                        </div>
                      </div>
                    </td>
                    <td>{cs.farmName && cs.farmName !== 'Unassigned' ? cs.farmName : '—'}</td>
                    <td>{cs.area ? <strong>{cs.area} {cs.areaUnit || 'Acres'}</strong> : '—'}</td>
                    <td>{cs.sowingDate || '—'}</td>
                    <td>{cs.expectedHarvestDate || '—'}</td>
                    <td className="text-emerald-700 font-semibold">
                      {cs.expectedRevenue ? formatCurrency(cs.expectedRevenue) : '—'}
                    </td>
                    <td>
                      <span className={`status-tag ${cs.status?.includes('Completed') ? 'status-done' : cs.status === 'Registered' ? 'status-neutral' : 'status-live'}`}>
                        {cs.status?.split('(')[0] || 'Registered'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Upcoming Payments */}
        <div className="quad-card">
          <div className="quad-card-header">
            <h3 className="quad-title">Upcoming Payments</h3>
            <button
              type="button"
              className="quad-action-link"
              onClick={() => onNavigate && onNavigate('Loans & Payments')}
            >
              Payments Ledger →
            </button>
          </div>

          <div className="payments-list">
            {upcomingPayments.map((p) => (
              <div key={p.id} className={`payment-row-card ${p.status === 'Completed' ? 'is-paid' : ''}`}>
                <div className="payment-left">
                  <div className="payment-due-date-badge">
                    <span className="pay-day">{p.dueDate.split('-')[2]}</span>
                    <span className="pay-month">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(p.dueDate.split('-')[1])-1]}
                    </span>
                  </div>
                  <div className="payment-party-info">
                    <strong>{p.party}</strong>
                    <div className="payment-type-note">
                      <span>{p.type}</span> • <small>{p.mode}</small>
                    </div>
                  </div>
                </div>

                <div className="payment-right">
                  <div className="payment-amount-val">{formatCurrency(p.amount)}</div>
                  {p.status === 'Completed' ? (
                    <span className="status-tag status-done">✓ Paid</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-pay-now"
                      onClick={() => setActivePaymentForPay(p)}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Recent Transactions */}
        <div className="quad-card">
          <div className="quad-card-header">
            <h3 className="quad-title">Recent Transactions</h3>
            <div className="tx-filter-pills">
              <button
                type="button"
                className={`tx-pill ${txFilter === 'All' ? 'active' : ''}`}
                onClick={() => setTxFilter('All')}
              >
                All
              </button>
              <button
                type="button"
                className={`tx-pill ${txFilter === 'Income' ? 'active' : ''}`}
                onClick={() => setTxFilter('Income')}
              >
                Income
              </button>
              <button
                type="button"
                className={`tx-pill ${txFilter === 'Expense' ? 'active' : ''}`}
                onClick={() => setTxFilter('Expense')}
              >
                Expense
              </button>
            </div>
          </div>

          <div className="transactions-list">
            {filteredTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="tx-row">
                <div className={`tx-icon ${tx.type === 'Income' ? 'tx-inc' : 'tx-exp'}`}>
                  {tx.type === 'Income' ? '↓' : '↑'}
                </div>
                <div className="tx-details">
                  <div className="tx-title-line">
                    <strong>{tx.category}</strong>
                    <span className="tx-ref">{tx.refNo}</span>
                  </div>
                  <div className="tx-meta-line">
                    <span>{tx.party}</span> • <span>{tx.farm}</span> • <time>{tx.date}</time>
                  </div>
                </div>
                <div className="tx-amount-col">
                  <span className={`tx-amt ${tx.type === 'Income' ? 'text-green' : 'text-red'}`}>
                    {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                  <small className="tx-mode">{tx.mode}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="quad-footer">
            <button
              type="button"
              className="view-all-link-btn"
              onClick={() => onNavigate && onNavigate('Transactions')}
            >
              View Full Transaction Journal →
            </button>
          </div>
        </div>

        {/* 4. Low Stock Items */}
        <div className="quad-card">
          <div className="quad-card-header">
            <h3 className="quad-title">Low Stock Items</h3>
            <button
              type="button"
              className="quad-action-link"
              onClick={() => onNavigate && onNavigate('Inventory')}
            >
              Warehouse Inventory →
            </button>
          </div>

          <div className="low-stock-list">
            {lowStockItems.map((item) => {
              const percent = Math.min(100, Math.round((item.currentStock / item.reorderLevel) * 100));
              const isReplenished = item.status.includes('Replenished');
              return (
                <div key={item.id} className="stock-alert-item">
                  <div className="stock-alert-top">
                    <div className="stock-name-box">
                      <strong>{item.productName}</strong>
                      <span className="stock-category-badge">{item.category}</span>
                    </div>
                    <span className={`stock-status-badge ${isReplenished ? 'status-done' : item.currentStock <= 5 ? 'badge-critical' : 'badge-warning'}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="stock-meter-area">
                    <div className="stock-numbers">
                      <span>Available: <strong>{item.currentStock} {item.unit}</strong></span>
                      <span>Min Required: <strong>{item.reorderLevel} {item.unit}</strong></span>
                    </div>
                    <div className="stock-progress-bar">
                      <div
                        className={`stock-progress-fill ${isReplenished ? 'bg-emerald-500' : percent <= 30 ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="stock-alert-bottom">
                    <span className="stock-supplier-tag">Supplier: {item.supplier}</span>
                    <button
                      type="button"
                      className="btn-reorder-stock"
                      onClick={() => setActiveItemForReorder(item)}
                    >
                      + Reorder Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dashboard widgets (12 official widgets) */}
      <div className="widgets-section-header">
        <h2 className="widgets-section-title">Dashboard widgets</h2>
      </div>

      <div className="twelve-widgets-grid">
        {/* 1. Total Income */}
        <div className="widget-card widget-income" onClick={() => onNavigate && onNavigate('Income')}>
          <div className="widget-card-top">
            <span className="widget-icon-box green">₹</span>
          </div>
          <div className="widget-name">Total Income</div>
          <div className="widget-amount">{formatCurrency(metrics.totalIncome)}</div>
        </div>

        {/* 2. Total Expenditure */}
        <div className="widget-card widget-expense" onClick={() => onNavigate && onNavigate('Expenses')}>
          <div className="widget-card-top">
            <span className="widget-icon-box amber">⌁</span>
          </div>
          <div className="widget-name">Total Expenditure</div>
          <div className="widget-amount">{formatCurrency(metrics.totalExpense)}</div>
        </div>

        {/* 3. Net Profit */}
        <div className="widget-card widget-profit" onClick={() => onNavigate && onNavigate('Reports')}>
          <div className="widget-card-top">
            <span className="widget-icon-box teal">▲</span>
          </div>
          <div className="widget-name">Net Profit</div>
          <div className="widget-amount text-teal-800">{formatCurrency(metrics.netProfit)}</div>
        </div>

        {/* 4. Total Farm Area */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Machinery & Assets')}>
          <div className="widget-card-top">
            <span className="widget-icon-box forest">⊞</span>
          </div>
          <div className="widget-name">Total Farm Area</div>
          <div className="widget-amount">{metrics.totalFarmArea} <small className="unit-label">Acres</small></div>
        </div>

        {/* 5. Active Crops */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Crops')}>
          <div className="widget-card-top">
            <span className="widget-icon-box lime">♧</span>
          </div>
          <div className="widget-name">Active Crops</div>
          <div className="widget-amount">{crops.length} <small className="unit-label">Crops</small></div>
        </div>

        {/* 6. Total Sales */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Income')}>
          <div className="widget-card-top">
            <span className="widget-icon-box blue">↗</span>
          </div>
          <div className="widget-name">Total Sales</div>
          <div className="widget-amount">{formatCurrency(metrics.totalSales)}</div>
        </div>

        {/* 7. Total Purchases */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Inventory')}>
          <div className="widget-card-top">
            <span className="widget-icon-box orange">▣</span>
          </div>
          <div className="widget-name">Total Purchases</div>
          <div className="widget-amount">{formatCurrency(metrics.totalPurchases)}</div>
        </div>

        {/* 8. Outstanding Receivables */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Income')}>
          <div className="widget-card-top">
            <span className="widget-icon-box indigo">⌛</span>
          </div>
          <div className="widget-name">Outstanding Receivables</div>
          <div className="widget-amount">{formatCurrency(metrics.outstandingReceivables)}</div>
        </div>

        {/* 9. Outstanding Payables */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Loans & Payments')}>
          <div className="widget-card-top">
            <span className="widget-icon-box rose">⏳</span>
          </div>
          <div className="widget-name">Outstanding Payables</div>
          <div className="widget-amount">{formatCurrency(metrics.outstandingPayables)}</div>
        </div>

        {/* 10. Labour Cost */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Expenses')}>
          <div className="widget-card-top">
            <span className="widget-icon-box cyan">👥</span>
          </div>
          <div className="widget-name">Labour Cost</div>
          <div className="widget-amount">{formatCurrency(metrics.labourCost)}</div>
        </div>

        {/* 11. Input Cost */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Inventory')}>
          <div className="widget-card-top">
            <span className="widget-icon-box violet">🌱</span>
          </div>
          <div className="widget-name">Input Cost</div>
          <div className="widget-amount">{formatCurrency(metrics.inputCost)}</div>
        </div>

        {/* 12. Machinery Cost */}
        <div className="widget-card" onClick={() => onNavigate && onNavigate('Machinery & Assets')}>
          <div className="widget-card-top">
            <span className="widget-icon-box brown">⚙</span>
          </div>
          <div className="widget-name">Machinery Cost</div>
          <div className="widget-amount">{formatCurrency(metrics.machineryCost)}</div>
        </div>
      </div>

      {/* Interactive Quick Modals for 4 Sections */}
      <QuickPayModal
        payment={activePaymentForPay}
        isOpen={Boolean(activePaymentForPay)}
        onClose={() => setActivePaymentForPay(null)}
      />

      <ReorderModal
        item={activeItemForReorder}
        isOpen={Boolean(activeItemForReorder)}
        onClose={() => setActiveItemForReorder(null)}
      />
    </div>
  );
}
