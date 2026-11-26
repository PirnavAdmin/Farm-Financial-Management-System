import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Filter,
  RotateCcw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wheat,
  MapPin,
  Ruler,
  Users,
  Tractor,
  Boxes,
  ClipboardList,
  ShoppingCart,
  PackageMinus,
  TriangleAlert,
  AlertCircle,
  IndianRupee,
  Sprout,
  Package
} from 'lucide-react';
import { getReportById } from './reportsCatalog';
import { fetchReportData, exportReportToCSV, formatINR, formatDate, generateSampleRows } from './reportsService';
import { printDailyIncomeReport } from './printReportHelper';
import './reports.css';

const ICON_MAP = {
  IndianRupee,
  Sprout,
  Package,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wheat,
  MapPin,
  Ruler,
  Users,
  Tractor,
  Boxes,
  ClipboardList,
  ShoppingCart,
  PackageMinus,
  TriangleAlert
};

export default function ReportViewer({
  reportId,
  onBackToReports,
  onNavigateHome
}) {
  const reportMeta = getReportById(reportId);
  const [filters, setFilters] = useState(() => ({ ...(reportMeta?.defaultFilters || {}) }));
  const [appliedFilters, setAppliedFilters] = useState(() => ({ ...(reportMeta?.defaultFilters || {}) }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(null);

  // Stale request tracking
  const requestIdRef = useRef(0);

  const loadData = useCallback(async () => {
    if (!reportMeta) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchReportData(
        reportMeta.id,
        appliedFilters,
        { page, pageSize }
      );

      // Prevent race conditions where an older response arrives later
      if (currentRequestId === requestIdRef.current) {
        setReportData(data);
        setLoading(false);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        console.warn(`[ReportViewer] Fallback preview activated for ${reportMeta.id}:`, err);
        const sampleRows = generateSampleRows(reportMeta.id, appliedFilters);
        setReportData({
          reportId: reportMeta.id,
          reportName: reportMeta.name,
          columns: reportMeta.columns,
          summaryCards: [
            { label: 'Total Records', value: String(sampleRows.length), hint: 'Development sample preview' },
            { label: 'Backend Status', value: 'Reconnecting...', hint: 'Offline fallback active' }
          ],
          rows: sampleRows.slice(0, pageSize),
          allFilteredRows: sampleRows,
          totalCount: sampleRows.length,
          page: 1,
          pageSize,
          totalPages: Math.ceil(sampleRows.length / pageSize) || 1,
          isAuthoritativeBackend: false,
          backendNotice: `Offline preview: ${err.friendlyMessage || err.message || 'Connecting to backend API...'}`
        });
        setError(null);
        setLoading(false);
      }
    }
  }, [reportMeta, appliedFilters, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    if (loading) return; // Prevent duplicate submissions
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    const defaultVals = { ...(reportMeta?.defaultFilters || {}) };
    setFilters(defaultVals);
    setAppliedFilters(defaultVals);
    setPage(1);
    setExportFeedback(null);
  };

  const handleExport = () => {
    setExportFeedback(null);
    const rowsToExport = reportData?.allFilteredRows || reportData?.rows || [];

    if (!rowsToExport || rowsToExport.length === 0) {
      setExportFeedback({
        type: 'warning',
        message: 'No records available to export for the applied filters.'
      });
      setTimeout(() => setExportFeedback(null), 4000);
      return;
    }

    try {
      setIsExporting(true);
      const datePart = appliedFilters.date || new Date().toISOString().slice(0, 10);
      const exportFilename = `${reportMeta.id}-${datePart}.csv`;

      exportReportToCSV(
        reportMeta.name,
        reportMeta.columns,
        rowsToExport,
        exportFilename
      );

      setExportFeedback({
        type: 'success',
        message: `Successfully exported ${rowsToExport.length} records to ${exportFilename}`
      });
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err) {
      console.error('Export CSV failed:', err);
      setExportFeedback({
        type: 'error',
        message: 'Failed to generate CSV export. Please try again.'
      });
      setTimeout(() => setExportFeedback(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      const rowsToPrint = reportData?.allFilteredRows || reportData?.rows || [];
      const totalAmount = rowsToPrint.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const cashAmount = rowsToPrint
        .filter((r) => String(r.paymentMode || '').toLowerCase() === 'cash')
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const bankAmount = rowsToPrint
        .filter((r) => String(r.paymentMode || '').toLowerCase() !== 'cash')
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const txnCount = rowsToPrint.length;

      printDailyIncomeReport({
        reportMeta,
        appliedFilters,
        rows: rowsToPrint,
        totalAmount,
        cashAmount,
        bankAmount,
        txnCount,
        summaryCards: reportData?.summaryCards || []
      });
    } catch (err) {
      console.error('Print dialog error:', err);
      try {
        window.print();
      } catch (fallbackErr) {
        setExportFeedback({
          type: 'error',
          message: 'Printing is unavailable or blocked by browser settings.'
        });
        setTimeout(() => setExportFeedback(null), 4000);
      }
    }
  };

  if (!reportMeta) {
    return (
      <div className="rpt-container">
        <div className="rpt-error-box">
          <AlertCircle size={24} />
          <h2>Report Not Found</h2>
          <p>The requested report ID "{reportId}" does not exist in the catalog.</p>
          <button type="button" className="rpt-btn-primary" onClick={onBackToReports}>
            Return to Reports
          </button>
        </div>
      </div>
    );
  }

  const ReportIcon = ICON_MAP[reportMeta.iconName] || ChartNoAxesCombined;
  const columns = reportData?.columns || reportMeta.columns || [];
  const rows = reportData?.rows || [];
  const summaryCards = reportData?.summaryCards || [];
  const totalCount = reportData?.totalCount || 0;
  const totalPages = reportData?.totalPages || 1;

  const printRows = reportData?.allFilteredRows || reportData?.rows || [];
  const isDailyIncome = reportMeta?.id === 'daily-income';
  const printTotalAmount = printRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const printCashAmount = printRows
    .filter((r) => String(r.paymentMode || '').toLowerCase() === 'cash')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const printBankAmount = printRows
    .filter((r) => String(r.paymentMode || '').toLowerCase() !== 'cash')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const printTxnCount = printRows.length;

  return (
    <div className="rpt-container">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── SCREEN VIEW (Interactive workspace view, hidden during print) ─ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="rpt-screen-view">
        {/* ── 1. Top Breadcrumb ─────────────────────────────────────────────── */}
        <nav className="rpt-breadcrumb" aria-label="Breadcrumb">
        <button
          type="button"
          className="rpt-breadcrumb-link"
          onClick={onNavigateHome}
        >
          Home
        </button>
        <span className="rpt-breadcrumb-sep">/</span>
        <button
          type="button"
          className="rpt-breadcrumb-link"
          onClick={onBackToReports}
        >
          Reports
        </button>
        <span className="rpt-breadcrumb-sep">/</span>
        <span className="rpt-breadcrumb-current" aria-current="page">
          {reportMeta.name}
        </span>
      </nav>

      {/* ── 2. Report Title & Back Navigation Header ─────────────────────── */}
      <div className="rpt-view-head">
        <div className="rpt-view-head-main">
          <button
            type="button"
            className="rpt-btn-back"
            onClick={onBackToReports}
            aria-label="Back to Reports Hub"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span>Back to Reports</span>
          </button>

          <div className="rpt-title-wrap">
            <div className={`rpt-title-icon-badge ${reportMeta.category}`}>
              <ReportIcon size={22} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div>
              <h1 className="rpt-view-title">{reportMeta.name}</h1>
              <p className="rpt-view-subtitle">{reportMeta.description}</p>
            </div>
          </div>
        </div>

        <div className="rpt-head-actions">
          <button
            type="button"
            className="rpt-btn-export"
            onClick={handleExport}
            disabled={loading || isExporting}
            title="Download CSV report for applied filters"
          >
            <Download size={16} strokeWidth={2} aria-hidden="true" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            className="rpt-btn-print"
            onClick={handlePrint}
            disabled={loading}
            title="Print report document"
          >
            <Printer size={16} strokeWidth={2} aria-hidden="true" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ── Feedback Banner ──────────────────────────────────────────────── */}
      {exportFeedback && (
        <div className={`rpt-feedback-banner ${exportFeedback.type}`}>
          <span>{exportFeedback.message}</span>
          <button
            type="button"
            className="rpt-feedback-close"
            onClick={() => setExportFeedback(null)}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {/* ── 3. Filter Panel ───────────────────────────────────────────────── */}
      <form className="rpt-filter-panel" onSubmit={handleApplyFilters}>
        <div className="rpt-filter-grid">
          {reportMeta.filterConfig?.map((cfg) => (
            <div key={cfg.key} className="rpt-filter-item">
              <label htmlFor={`filter-${cfg.key}`} className="rpt-filter-label">
                {cfg.label}
              </label>
              {cfg.type === 'select' ? (
                <div className="rpt-select-wrap">
                  <select
                    id={`filter-${cfg.key}`}
                    className="rpt-filter-select"
                    value={filters[cfg.key] || ''}
                    onChange={(e) => handleFilterChange(cfg.key, e.target.value)}
                  >
                    {cfg.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  id={`filter-${cfg.key}`}
                  type={cfg.type || 'text'}
                  className="rpt-filter-input"
                  value={filters[cfg.key] || ''}
                  onChange={(e) => handleFilterChange(cfg.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="rpt-filter-actions">
            <button
              type="submit"
              className="rpt-btn-primary"
              disabled={loading}
              title="Apply selected filters"
            >
              {loading ? (
                <>
                  <span className="rpt-btn-spinner" aria-hidden="true" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Filter size={16} strokeWidth={2} aria-hidden="true" />
                  <span>Apply Filters</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="rpt-btn-reset"
              onClick={handleResetFilters}
              disabled={loading}
              title="Reset all filters to defaults"
            >
              <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── 4. Authoritative Summary Cards ───────────────────────────────── */}
      <div className="rpt-summary-grid">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="rpt-summary-card">
            <span className="rpt-summary-label">{card.label}</span>
            <div className="rpt-summary-val">{card.value}</div>
            {card.hint && <span className="rpt-summary-hint">{card.hint}</span>}
          </div>
        ))}
      </div>

      {/* Optional Backend Notice Pill */}
      {reportData?.backendNotice && (
        <div className="rpt-notice-bar">
          <span className="rpt-notice-tag">Data Source</span>
          <span className="rpt-notice-text">{reportData.backendNotice}</span>
        </div>
      )}

      {/* ── 5. Results Table & States ─────────────────────────────────────── */}
      <div className="rpt-table-container">
        {loading ? (
          <div className="rpt-loading-state">
            <div className="rpt-spinner" aria-hidden="true" />
            <p>Loading {reportMeta.name} records from database...</p>
          </div>
        ) : error ? (
          <div className="rpt-error-state">
            <AlertCircle size={32} className="rpt-error-icon" />
            <h3>Unable to load report records</h3>
            <p>{error}</p>
            <button type="button" className="rpt-btn-primary" onClick={loadData}>
              Retry Query
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rpt-empty-state">
            <h3>No Records Found</h3>
            <p>No transactions matched the selected filters. Try broadening your criteria or reset filters.</p>
            <button type="button" className="rpt-btn-reset" onClick={handleResetFilters}>
              <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <colgroup>
                {columns.map((col, idx) => (
                  <col
                    key={idx}
                    style={{ width: col.width || 'auto' }}
                  />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={col.align === 'center' ? 'align-center' : 'align-left'}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={row.id || rowIdx}>
                    {columns.map((col, colIdx) => {
                      const rawVal = row[col.key];
                      const isAlignCentered = col.align === 'center';

                      let displayVal = rawVal;
                      if (col.isCurrency) {
                        displayVal = formatINR(rawVal);
                      } else if (rawVal === undefined || rawVal === null || rawVal === '') {
                        displayVal = '—';
                      }

                      return (
                        <td
                          key={colIdx}
                          className={`${isAlignCentered ? 'align-center' : 'align-left'}${
                            col.isHighlight ? ' font-highlight' : ''
                          }`}
                        >
                          {col.isBadge ? (
                            <span className={`rpt-status-badge ${String(displayVal).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                              {displayVal}
                            </span>
                          ) : (
                            displayVal
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. Pagination & Record Count ─────────────────────────────────── */}
      {!loading && !error && rows.length > 0 && (
        <div className="rpt-pagination-bar">
          <div className="rpt-page-info">
            Showing{' '}
            <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(page * pageSize, totalCount)}</strong> of{' '}
            <strong>{totalCount}</strong> records
          </div>

          <div className="rpt-pagination-controls">
            <div className="rpt-pagesize-wrap">
              <label htmlFor="rpt-pagesize" className="rpt-pagesize-label">
                Rows:
              </label>
              <select
                id="rpt-pagesize"
                className="rpt-pagesize-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              type="button"
              className="rpt-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="rpt-page-ellipsis">…</span>}
                    <button
                      type="button"
                      className={`rpt-page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                      aria-current={page === p ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              className="rpt-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── PRINT VIEW (Displayed only during print / Save as PDF) ─────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="rpt-print-view" aria-hidden="true">
        {/* 1. Report Header */}
        <div className="rpt-print-header">
          <div className="rpt-print-brand-wrap">
            <img
              src="/agriman-logo.png"
              alt="AGRIMAN Logo"
              className="rpt-print-brand-logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="rpt-print-brand-text">
              <div className="rpt-print-brand-name">AGRIMAN</div>
              <div className="rpt-print-brand-sub">Farm Financial Management System</div>
            </div>
          </div>

          <div className="rpt-print-header-meta">
            <h1 className="rpt-print-doc-title">
              {isDailyIncome ? 'Daily Income Report' : reportMeta.name}
            </h1>
            <div className="rpt-print-meta-row">
              <strong>Transaction Date:</strong>{' '}
              {appliedFilters.date ? formatDate(appliedFilters.date) : 'All Dates'}
            </div>
            <div className="rpt-print-meta-row">
              <strong>Generated:</strong>{' '}
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}{' '}
              at{' '}
              {new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Thin dark-green divider */}
        <hr className="rpt-print-divider" />

        {/* 2. Applied Filters (Compact Horizontal Section) */}
        <div className="rpt-print-filters-bar">
          <span className="rpt-print-filter-title">Applied Filters:</span>
          <span className="rpt-print-filter-pill">
            <strong>Date:</strong> {appliedFilters.date ? formatDate(appliedFilters.date) : 'All Dates'}
          </span>
          <span className="rpt-print-filter-pill">
            <strong>Farm / Land:</strong> {appliedFilters.farm || 'All Farms'}
          </span>
          <span className="rpt-print-filter-pill">
            <strong>Crop:</strong> {appliedFilters.crop || 'All Crops'}
          </span>
          <span className="rpt-print-filter-pill">
            <strong>Payment Mode:</strong> {appliedFilters.paymentMode || 'All Modes'}
          </span>
        </div>

        {/* 3. Summary Cards (Four equal-width cards with green, blue, amber, and purple accents) */}
        {isDailyIncome ? (
          <div className="rpt-print-kpi-grid">
            <div className="rpt-print-kpi-card accent-green">
              <span className="rpt-print-kpi-label">TOTAL DAILY INCOME</span>
              <div className="rpt-print-kpi-val">{formatINR(printTotalAmount)}</div>
            </div>
            <div className="rpt-print-kpi-card accent-blue">
              <span className="rpt-print-kpi-label">CASH REALIZED</span>
              <div className="rpt-print-kpi-val">{formatINR(printCashAmount)}</div>
            </div>
            <div className="rpt-print-kpi-card accent-amber">
              <span className="rpt-print-kpi-label">BANK / ONLINE TRANSFERS</span>
              <div className="rpt-print-kpi-val">{formatINR(printBankAmount)}</div>
            </div>
            <div className="rpt-print-kpi-card accent-purple">
              <span className="rpt-print-kpi-label">TRANSACTIONS AUDITED</span>
              <div className="rpt-print-kpi-val">{printTxnCount}</div>
            </div>
          </div>
        ) : (
          <div className="rpt-print-kpi-grid">
            {summaryCards.map((card, idx) => (
              <div
                key={idx}
                className={`rpt-print-kpi-card ${
                  idx === 0
                    ? 'accent-green'
                    : idx === 1
                    ? 'accent-blue'
                    : idx === 2
                    ? 'accent-amber'
                    : 'accent-purple'
                }`}
              >
                <span className="rpt-print-kpi-label">{card.label}</span>
                <div className="rpt-print-kpi-val">{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Transaction Table */}
        <div className="rpt-print-table-wrap">
          {isDailyIncome ? (
            <table className="rpt-print-table">
              <colgroup>
                <col style={{ width: '45px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '105px' }} />
                <col style={{ width: '135px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '135px' }} />
                <col style={{ width: '105px' }} />
                <col style={{ width: '95px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-center">S.No.</th>
                  <th className="text-center">Date</th>
                  <th className="text-center">Income No.</th>
                  <th className="text-left">Farmer</th>
                  <th className="text-left">Farm</th>
                  <th className="text-left">Crop</th>
                  <th className="text-left">Income Type</th>
                  <th className="text-left">Buyer / Source</th>
                  <th className="text-right">Amount (₹)</th>
                  <th className="text-center">Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {printRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center"
                      style={{ padding: '24px', color: '#64748b' }}
                    >
                      No income transactions matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  printRows.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="text-center">{row.date || '—'}</td>
                      <td className="text-center" style={{ fontWeight: 600 }}>
                        {row.incomeNo || '—'}
                      </td>
                      <td className="text-left">{row.farmer || '—'}</td>
                      <td className="text-left">{row.farm || '—'}</td>
                      <td className="text-left">{row.crop || '—'}</td>
                      <td className="text-left">{row.incomeType || '—'}</td>
                      <td className="text-left">{row.buyer || '—'}</td>
                      <td className="text-right">{formatINR(row.amount)}</td>
                      <td className="text-center">{row.paymentMode || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* 5. Total Income Row */}
              <tfoot>
                <tr className="rpt-print-total-row">
                  <td colSpan={8} className="rpt-print-total-label">
                    TOTAL DAILY INCOME
                  </td>
                  <td className="rpt-print-total-amount">
                    {formatINR(printTotalAmount)}
                  </td>
                  <td className="rpt-print-total-mode">
                    {printTxnCount} {printTxnCount === 1 ? 'Record' : 'Records'}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="rpt-print-table">
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={
                        col.isCurrency
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {printRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center"
                      style={{ padding: '24px', color: '#64748b' }}
                    >
                      No records matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  printRows.map((row, rowIdx) => (
                    <tr key={row.id || rowIdx}>
                      {columns.map((col, colIdx) => {
                        const rawVal = row[col.key];
                        const displayVal = col.isCurrency
                          ? formatINR(rawVal)
                          : rawVal === undefined || rawVal === null || rawVal === ''
                          ? '—'
                          : rawVal;
                        return (
                          <td
                            key={colIdx}
                            className={
                              col.isCurrency
                                ? 'text-right'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            }
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 6. Print Footer */}
        <div className="rpt-print-footer">
          <div className="rpt-print-footer-left">
            <span>AGRIMAN – Farm Financial Management</span>
            <span className="rpt-print-footer-dot">•</span>
            <span>Official Farm Accounts & Audit Record</span>
          </div>
          <div className="rpt-print-footer-right">
            <span>Daily Income Audit Report</span>
          </div>
        </div>
      </div>
    </div>
  );
}
