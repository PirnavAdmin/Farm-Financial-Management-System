/**
 * AGRIMAN Farm Financial Management System
 * printReportHelper.js — Isolated Hidden Iframe Printing Utility
 *
 * Provides 100% reliable printing in Chrome/Chromium without blank preview bugs,
 * flex/overflow clipping, or CSS inheritance pollution from parent app shells.
 */

import { formatINR, formatDate } from './reportsService.js';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateReportHtml({
  reportMeta,
  appliedFilters = {},
  rows = [],
  totalAmount = 0,
  cashAmount = 0,
  bankAmount = 0,
  txnCount = 0,
  summaryCards = []
}) {
  const isDailyIncome = reportMeta?.id === 'daily-income';
  const reportTitle = isDailyIncome ? 'Daily Income Report' : (reportMeta?.name || 'Report Document');

  const now = new Date();
  const dateFormatted = appliedFilters.date ? formatDate(appliedFilters.date) : 'All Dates';
  const timestamp = `${now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })} at ${now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  // Filter bar items
  const filterDate = appliedFilters.date ? formatDate(appliedFilters.date) : 'All Dates';
  const filterFarm = appliedFilters.farm || 'All Farms';
  const filterCrop = appliedFilters.crop || 'All Crops';
  const filterMode = appliedFilters.paymentMode || 'All Modes';

  // Build KPI Cards HTML
  let kpiCardsHtml = '';
  if (isDailyIncome) {
    kpiCardsHtml = `
      <div class="kpi-grid">
        <div class="kpi-card accent-green">
          <span class="kpi-label">TOTAL DAILY INCOME</span>
          <div class="kpi-val">${escapeHtml(formatINR(totalAmount))}</div>
        </div>
        <div class="kpi-card accent-blue">
          <span class="kpi-label">CASH REALIZED</span>
          <div class="kpi-val">${escapeHtml(formatINR(cashAmount))}</div>
        </div>
        <div class="kpi-card accent-amber">
          <span class="kpi-label">BANK / ONLINE TRANSFERS</span>
          <div class="kpi-val">${escapeHtml(formatINR(bankAmount))}</div>
        </div>
        <div class="kpi-card accent-purple">
          <span class="kpi-label">TRANSACTIONS AUDITED</span>
          <div class="kpi-val">${escapeHtml(txnCount)}</div>
        </div>
      </div>
    `;
  } else if (summaryCards && summaryCards.length > 0) {
    const accents = ['accent-green', 'accent-blue', 'accent-amber', 'accent-purple'];
    kpiCardsHtml = `
      <div class="kpi-grid" style="grid-template-columns: repeat(${Math.min(summaryCards.length, 4)}, 1fr);">
        ${summaryCards.map((c, i) => `
          <div class="kpi-card ${accents[i % accents.length]}">
            <span class="kpi-label">${escapeHtml(c.label)}</span>
            <div class="kpi-val">${escapeHtml(c.value)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Build Table HTML
  let tableHtml = '';
  if (isDailyIncome) {
    const tableRows = rows.length === 0
      ? `<tr><td colspan="10" class="text-center empty-cell">No income transactions matched the selected filters.</td></tr>`
      : rows.map((r, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td class="text-center">${escapeHtml(r.date || '—')}</td>
            <td class="text-center font-bold">${escapeHtml(r.incomeNo || '—')}</td>
            <td class="text-left">${escapeHtml(r.farmer || '—')}</td>
            <td class="text-left">${escapeHtml(r.farm || '—')}</td>
            <td class="text-left">${escapeHtml(r.crop || '—')}</td>
            <td class="text-left">${escapeHtml(r.incomeType || '—')}</td>
            <td class="text-left">${escapeHtml(r.buyer || '—')}</td>
            <td class="text-right font-bold text-green">${escapeHtml(formatINR(r.amount))}</td>
            <td class="text-center">${escapeHtml(r.paymentMode || '—')}</td>
          </tr>
        `).join('');

    tableHtml = `
      <table class="rpt-table">
        <colgroup>
          <col style="width: 45px;" />
          <col style="width: 90px;" />
          <col style="width: 105px;" />
          <col style="width: 135px;" />
          <col style="width: 130px;" />
          <col style="width: 85px;" />
          <col style="width: 130px;" />
          <col style="width: 135px;" />
          <col style="width: 105px;" />
          <col style="width: 95px;" />
        </colgroup>
        <thead>
          <tr>
            <th class="text-center">S.No.</th>
            <th class="text-center">Date</th>
            <th class="text-center">Income No.</th>
            <th class="text-left">Farmer</th>
            <th class="text-left">Farm</th>
            <th class="text-left">Crop</th>
            <th class="text-left">Income Type</th>
            <th class="text-left">Buyer / Source</th>
            <th class="text-right">Amount (₹)</th>
            <th class="text-center">Payment Mode</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="8" class="total-label">TOTAL DAILY INCOME</td>
            <td class="total-amount">${escapeHtml(formatINR(totalAmount))}</td>
            <td class="total-mode">${escapeHtml(txnCount)} ${txnCount === 1 ? 'Record' : 'Records'}</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else {
    // Generic table fallback
    const cols = reportMeta?.columns || [];
    const theadCols = cols.map(c => `
      <th class="${c.isCurrency ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}">
        ${escapeHtml(c.label)}
      </th>
    `).join('');

    const tbodyRows = rows.length === 0
      ? `<tr><td colspan="${cols.length}" class="text-center empty-cell">No records matched the selected filters.</td></tr>`
      : rows.map(r => `
          <tr>
            ${cols.map(c => {
              const val = r[c.key];
              const displayVal = c.isCurrency
                ? formatINR(val)
                : val === undefined || val === null || val === ''
                ? '—'
                : val;
              return `
                <td class="${c.isCurrency ? 'text-right font-bold text-green' : c.align === 'center' ? 'text-center' : 'text-left'}">
                  ${escapeHtml(displayVal)}
                </td>
              `;
            }).join('')}
          </tr>
        `).join('');

    tableHtml = `
      <table class="rpt-table">
        <thead>
          <tr>${theadCols}</tr>
        </thead>
        <tbody>
          ${tbodyRows}
        </tbody>
      </table>
    `;
  }

  // Standalone Full HTML Document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AGRIMAN - ${escapeHtml(reportTitle)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm 10mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      padding: 0;
      margin: 0;
    }
    .print-doc {
      width: 100%;
      max-width: 100%;
    }

    /* 1. Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      page-break-inside: avoid;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      height: 44px;
      width: auto;
      max-width: 160px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      color: #166534;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
    }
    .header-meta {
      text-align: right;
    }
    .doc-title {
      font-size: 19px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 3px 0;
      letter-spacing: 0.3px;
    }
    .meta-line {
      font-size: 10.5px;
      color: #475569;
      line-height: 1.35;
    }
    .meta-line strong {
      color: #1e293b;
    }

    /* Green divider */
    .divider {
      height: 2.5px;
      background-color: #166534;
      margin: 8px 0 10px 0;
      border: none;
      page-break-inside: avoid;
    }

    /* 2. Applied Filters */
    .filters-bar {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .filter-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #166534;
      margin-right: 4px;
      white-space: nowrap;
    }
    .filter-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #334155;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 8px;
      white-space: nowrap;
    }
    .filter-pill strong {
      color: #475569;
      font-weight: 600;
    }

    /* 3. Summary KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .kpi-card {
      padding: 8px 12px;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .kpi-card.accent-green {
      border-top: 3.5px solid #166534;
      background-color: #f0fdf4;
    }
    .kpi-card.accent-blue {
      border-top: 3.5px solid #2563eb;
      background-color: #eff6ff;
    }
    .kpi-card.accent-amber {
      border-top: 3.5px solid #d97706;
      background-color: #fffbeb;
    }
    .kpi-card.accent-purple {
      border-top: 3.5px solid #7c3aed;
      background-color: #f5f3ff;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .kpi-card.accent-green .kpi-label { color: #166534; }
    .kpi-card.accent-blue .kpi-label { color: #1d4ed8; }
    .kpi-card.accent-amber .kpi-label { color: #b45309; }
    .kpi-card.accent-purple .kpi-label { color: #6d28d9; }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    /* 4. Transaction Table */
    .table-wrap {
      width: 100%;
      margin-bottom: 12px;
    }
    .rpt-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10.5px;
    }
    .rpt-table thead {
      display: table-header-group;
    }
    .rpt-table tfoot {
      display: table-footer-group;
    }
    .rpt-table tr {
      page-break-inside: avoid;
    }
    .rpt-table th {
      background-color: #166534;
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 6px;
      border: 1px solid #14532d;
    }
    .rpt-table td {
      padding: 6.5px 6px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      font-size: 10.5px;
      word-break: break-word;
    }
    .rpt-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .rpt-table tbody tr:nth-child(odd) {
      background-color: #ffffff;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .text-green { color: #166534; }
    .empty-cell {
      padding: 24px;
      color: #64748b;
    }

    /* 5. Total Row */
    .total-row {
      background-color: #f0fdf4;
      font-weight: 800;
      page-break-inside: avoid;
    }
    .total-row td {
      border-top: 2px solid #166534;
      border-bottom: 2px solid #166534;
      padding: 8px 6px;
    }
    .total-label {
      text-align: right;
      font-size: 11px;
      font-weight: 800;
      color: #166534;
      letter-spacing: 0.5px;
      padding-right: 8px;
    }
    .total-amount {
      text-align: right;
      font-size: 12.5px;
      font-weight: 800;
      color: #166534;
    }
    .total-mode {
      text-align: center;
      font-size: 10.5px;
      font-weight: 700;
      color: #166534;
    }

    /* 6. Footer */
    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 9.5px;
      color: #64748b;
      page-break-inside: avoid;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-dot {
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="print-doc">
    <!-- 1. Header -->
    <div class="doc-header">
      <div class="brand-wrap">
        <img
          src="/agriman-logo.png"
          alt="AGRIMAN Logo"
          class="brand-logo"
          onerror="this.style.display='none'"
        />
        <div>
          <div class="brand-name">AGRIMAN</div>
          <div class="brand-sub">Farm Financial Management System</div>
        </div>
      </div>
      <div class="header-meta">
        <h1 class="doc-title">${escapeHtml(reportTitle)}</h1>
        <div class="meta-line">
          <strong>Transaction Date:</strong> ${escapeHtml(dateFormatted)}
        </div>
        <div class="meta-line">
          <strong>Generated:</strong> ${escapeHtml(timestamp)}
        </div>
      </div>
    </div>

    <!-- Thin dark-green divider -->
    <hr class="divider" />

    <!-- 2. Applied Filters -->
    <div class="filters-bar">
      <span class="filter-label">Applied Filters:</span>
      <span class="filter-pill"><strong>Date:</strong> ${escapeHtml(filterDate)}</span>
      <span class="filter-pill"><strong>Farm / Land:</strong> ${escapeHtml(filterFarm)}</span>
      <span class="filter-pill"><strong>Crop:</strong> ${escapeHtml(filterCrop)}</span>
      <span class="filter-pill"><strong>Payment Mode:</strong> ${escapeHtml(filterMode)}</span>
    </div>

    <!-- 3. Summary KPI Cards -->
    ${kpiCardsHtml}

    <!-- 4. Transaction Table -->
    <div class="table-wrap">
      ${tableHtml}
    </div>

    <!-- 5. Footer -->
    <div class="doc-footer">
      <div class="footer-left">
        <span>AGRIMAN – Farm Financial Management</span>
        <span class="footer-dot">•</span>
        <span>Official Farm Accounts &amp; Audit Record</span>
      </div>
      <div>
        <span>Daily Income Audit Report</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printDailyIncomeReport(options) {
  const html = generateReportHtml(options);

  // Hidden Iframe Execution
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Print iframe error:', err);
    } finally {
      // Auto-cleanup iframe when print dialog concludes or after safe timeout
      if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = () => {
          try {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          } catch (e) {}
        };
      }
      setTimeout(() => {
        try {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        } catch (e) {}
      }, 60000);
    }
  };

  // Wait for images to load before printing
  const images = Array.from(doc.images || []);
  const pendingImages = images.filter(img => !img.complete);

  if (pendingImages.length > 0) {
    let loaded = 0;
    const onImgDone = () => {
      loaded++;
      if (loaded >= pendingImages.length) {
        doPrint();
      }
    };
    pendingImages.forEach(img => {
      img.addEventListener('load', onImgDone);
      img.addEventListener('error', onImgDone);
    });
    // Fallback if load event doesn't fire
    setTimeout(doPrint, 500);
  } else {
    setTimeout(doPrint, 120);
  }
}
