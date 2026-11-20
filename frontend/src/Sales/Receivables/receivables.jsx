import TableActionMenu from '../../TableActionMenu';
import { useEffect, useMemo, useState } from 'react';
import salesService, { formatCurrency, formatDate } from '../../services/salesService';
import './receivables.css';

export default function Receivables({ onNavigate }) {
  // Active Tab: 'receivables' | 'payments'
  const [activeTab, setActiveTab] = useState('receivables');

  const [sales, setSales] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Filters state
  const [query, setQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [paymentModal, setPaymentModal] = useState(null); // null | { isEdit?: boolean, targetSale?: object }
  const [viewPayment, setViewPayment] = useState(null); // null | payment object
  const [viewSale, setViewSale] = useState(null); // null | sale object
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | payment object

  // Form matching EXACT screen fields:
  // 1. Buyer, 2. Sales Number, 3. Sales Date, 4. Total Sales Amount, 5. Amount Received, 6. Outstanding Amount, 7. Payment Status
  const initialForm = {
    buyer: '',
    salesNo: '',
    salesDate: new Date().toISOString().slice(0, 10),
    totalSalesAmount: '',
    amountReceived: '',
    outstandingAmount: 0,
    paymentStatus: 'Pending',
    // Optional payment ledger details
    paymentMode: 'Bank',
    referenceNo: '',
    remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [salesList, buyersList, paymentsList] = await Promise.all([
        salesService.getSales(),
        salesService.getBuyers(),
        salesService.getPayments()
      ]);
      setSales(salesList);
      setBuyers(buyersList);
      setPayments(paymentsList);
    } catch (err) {
      console.error('[Receivables] Error loading data:', err);
      setToast('Failed to load receivables data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, buyerFilter, statusFilter, modeFilter, dateFilter, activeTab]);

  // Compute Receivables mapped rows matching exact screen columns
  const receivables = useMemo(() => {
    return sales.map((sale) => {
      const related = payments.filter((p) => p.salesNo === sale.salesNo);
      const rawReceived = related.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
      const totalAmount = Number(sale.netAmount) || 0;
      const amountReceived = sale.paymentStatus === 'Paid' ? totalAmount : Math.min(totalAmount, rawReceived);
      const outstandingAmount = Math.max(0, Math.round((totalAmount - amountReceived) * 100) / 100);

      let status = sale.paymentStatus;
      if (!status || status === 'Pending') {
        if (outstandingAmount <= 0 && amountReceived > 0) status = 'Paid';
        else if (amountReceived > 0) status = 'Partially Paid';
        else status = 'Pending';
      }

      return {
        ...sale,
        totalSalesAmount: totalAmount,
        amountReceived,
        outstandingAmount,
        computedStatus: status,
        paymentsCount: related.length
      };
    });
  }, [sales, payments]);

  // KPI Calculations
  const totalReceivablesInvoiced = receivables.reduce((sum, r) => sum + (Number(r.totalSalesAmount) || 0), 0);
  const totalAmountReceived = receivables.reduce((sum, r) => sum + (Number(r.amountReceived) || 0), 0);
  const totalOutstanding = Math.max(0, Math.round((totalReceivablesInvoiced - totalAmountReceived) * 100) / 100);
  const pendingInvoicesCount = receivables.filter((r) => r.computedStatus !== 'Paid').length;

  // Filtered Receivables
  const filteredReceivables = useMemo(() => {
    const q = query.trim().toLowerCase();
    return receivables.filter((r) => {
      const matchSearch =
        !q ||
        (r.salesNo && r.salesNo.toLowerCase().includes(q)) ||
        (r.buyer && r.buyer.toLowerCase().includes(q)) ||
        (r.crop && r.crop.toLowerCase().includes(q));

      const matchBuyer = buyerFilter === 'All' || r.buyer === buyerFilter;
      const matchStatus =
        statusFilter === 'All' ||
        r.computedStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchBuyer && matchStatus;
    });
  }, [receivables, query, buyerFilter, statusFilter]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        (p.paymentNo && p.paymentNo.toLowerCase().includes(q)) ||
        (p.buyer && p.buyer.toLowerCase().includes(q)) ||
        (p.salesNo && p.salesNo.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
        (p.remarks && p.remarks.toLowerCase().includes(q));

      const matchBuyer = buyerFilter === 'All' || p.buyer === buyerFilter;
      const matchMode = modeFilter === 'All' || p.paymentMode === modeFilter;
      const matchDate = !dateFilter || (p.paymentDate || '').slice(0, 10) === dateFilter;

      return matchSearch && matchBuyer && matchMode && matchDate;
    });
  }, [payments, query, buyerFilter, modeFilter, dateFilter]);

  // Current active page list
  const currentItems = activeTab === 'receivables' ? filteredReceivables : filteredPayments;
  const totalRecords = currentItems.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = currentItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Open Record Payment Modal with screen-matching fields
  const openRecordPaymentModal = (preselectedSale = null) => {
    const targetSale = preselectedSale || receivables[0];
    const total = targetSale ? Number(targetSale.totalSalesAmount ?? targetSale.netAmount) || 0 : 0;
    const received = targetSale ? Number(targetSale.amountReceived) || 0 : 0;
    const outstanding = targetSale ? targetSale.outstandingAmount : 0;
    const status = targetSale ? targetSale.computedStatus || 'Pending' : 'Pending';

    setFormData({
      buyer: targetSale?.buyer || buyers[0]?.buyerName || '',
      salesNo: targetSale?.salesNo || '',
      salesDate: targetSale?.salesDate ? targetSale.salesDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      totalSalesAmount: total || '',
      amountReceived: received || '',
      outstandingAmount: outstanding,
      paymentStatus: status,
      paymentMode: 'Bank',
      referenceNo: '',
      remarks: targetSale ? `Payment received for sale #${targetSale.salesNo}` : ''
    });
    setFormErrors({});
    setPaymentModal({ targetSale });
  };

  // When Sales Number changes in modal, auto-fill all 7 screen fields
  const handleSaleSelect = (e) => {
    const selectedSalesNo = e.target.value;
    const selected = receivables.find((r) => r.salesNo === selectedSalesNo);
    if (selected) {
      const total = Number(selected.totalSalesAmount ?? selected.netAmount) || 0;
      const received = Number(selected.amountReceived) || 0;
      const outstanding = Math.max(0, Math.round((total - received) * 100) / 100);

      setFormData((prev) => ({
        ...prev,
        salesNo: selectedSalesNo,
        buyer: selected.buyer || prev.buyer,
        salesDate: (selected.salesDate || '').slice(0, 10) || prev.salesDate,
        totalSalesAmount: total,
        amountReceived: received,
        outstandingAmount: outstanding,
        paymentStatus: selected.computedStatus || (outstanding === 0 ? 'Paid' : received > 0 ? 'Partially Paid' : 'Pending'),
        remarks: `Payment received for sale #${selectedSalesNo}`
      }));
    } else {
      setFormData((prev) => ({ ...prev, salesNo: selectedSalesNo }));
    }
    if (formErrors.salesNo) setFormErrors((prev) => ({ ...prev, salesNo: '' }));
  };

  // When Buyer changes in modal
  const handleBuyerSelect = (e) => {
    const selectedBuyer = e.target.value;
    const matchingSale = receivables.find((r) => r.buyer === selectedBuyer);
    if (matchingSale) {
      const total = Number(matchingSale.totalSalesAmount ?? matchingSale.netAmount) || 0;
      const received = Number(matchingSale.amountReceived) || 0;
      const outstanding = Math.max(0, Math.round((total - received) * 100) / 100);
      setFormData((prev) => ({
        ...prev,
        buyer: selectedBuyer,
        salesNo: matchingSale.salesNo,
        salesDate: (matchingSale.salesDate || '').slice(0, 10),
        totalSalesAmount: total,
        amountReceived: received,
        outstandingAmount: outstanding,
        paymentStatus: matchingSale.computedStatus
      }));
    } else {
      setFormData((prev) => ({ ...prev, buyer: selectedBuyer }));
    }
  };

  // Re-calculate Outstanding Amount and Payment Status dynamically when amounts change
  const handleAmountReceivedChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const total = parseFloat(prev.totalSalesAmount) || 0;
      const rec = parseFloat(val) || 0;
      const out = Math.max(0, Math.round((total - rec) * 100) / 100);

      let status = 'Pending';
      if (rec >= total && total > 0) {
        status = 'Paid';
      } else if (rec > 0) {
        status = 'Partially Paid';
      }

      return {
        ...prev,
        amountReceived: val,
        outstandingAmount: out,
        paymentStatus: status
      };
    });
    if (formErrors.amountReceived) setFormErrors((prev) => ({ ...prev, amountReceived: '' }));
  };

  const handleTotalSalesAmountChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const total = parseFloat(val) || 0;
      const rec = parseFloat(prev.amountReceived) || 0;
      const out = Math.max(0, Math.round((total - rec) * 100) / 100);

      let status = 'Pending';
      if (rec >= total && total > 0) {
        status = 'Paid';
      } else if (rec > 0) {
        status = 'Partially Paid';
      }

      return {
        ...prev,
        totalSalesAmount: val,
        outstandingAmount: out,
        paymentStatus: status
      };
    });
    if (formErrors.totalSalesAmount) setFormErrors((prev) => ({ ...prev, totalSalesAmount: '' }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.buyer?.trim()) errors.buyer = 'Buyer is required.';
    if (!formData.salesNo?.trim()) errors.salesNo = 'Sales Number is required.';
    if (!formData.salesDate) errors.salesDate = 'Sales Date is required.';

    const total = parseFloat(formData.totalSalesAmount);
    if (isNaN(total) || total < 0) errors.totalSalesAmount = 'Enter a valid Total Sales Amount.';

    const rec = parseFloat(formData.amountReceived);
    if (isNaN(rec) || rec < 0) errors.amountReceived = 'Enter a valid Amount Received.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await salesService.updateReceivable(formData);
      setToast(`Receivables & payment for ${formData.salesNo} updated.`);
      setPaymentModal(null);
      await loadData();
    } catch (err) {
      setToast(err.message || 'Failed to save payment & receivable details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteConfirm) return;
    try {
      await salesService.deletePayment(deleteConfirm.id);
      setToast(`Payment voucher #${deleteConfirm.paymentNo} deleted.`);
      setDeleteConfirm(null);
      if (viewPayment?.id === deleteConfirm.id) setViewPayment(null);
      await loadData();
    } catch (err) {
      setToast(err.message || 'Failed to delete payment.');
    }
  };

  const resetFilters = () => {
    setQuery('');
    setBuyerFilter('All');
    setStatusFilter('All');
    setModeFilter('All');
    setDateFilter('');
    setPage(1);
  };

  return (
    <div className="users-page sales-page-container">
      {/* Title & Header */}
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            SALES <span>/</span> PAYMENTS & RECEIVABLES
          </div>
          <h1>Payments & Receivables</h1>
          <p>Monitor buyer outstanding ledger balances, payment history, and collection reconciliations.</p>
        </div>
        <button className="users-add" type="button" onClick={() => openRecordPaymentModal()}>
          <span>＋</span> Record Payment
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="sales-stats-grid">
        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-blue">₹</span>
          <div className="sales-stat-info">
            <small>TOTAL RECEIVABLES</small>
            <strong>{formatCurrency(totalReceivablesInvoiced)}</strong>
            <span>Net invoiced harvest value</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-green">✓</span>
          <div className="sales-stat-info">
            <small>AMOUNT COLLECTED</small>
            <strong>{formatCurrency(totalAmountReceived)}</strong>
            <span>Total payments received</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-rose">⏳</span>
          <div className="sales-stat-info">
            <small>OUTSTANDING BALANCE</small>
            <strong style={{ color: totalOutstanding > 0 ? '#b91c1c' : '#15803d' }}>
              {formatCurrency(totalOutstanding)}
            </strong>
            <span>Remaining balance due</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-amber">▤</span>
          <div className="sales-stat-info">
            <small>PENDING INVOICES</small>
            <strong>{pendingInvoicesCount} Pending</strong>
            <span>Awaiting full settlement</span>
          </div>
        </article>
      </div>

      {/* View Switcher Tabs */}
      <div className="sales-view-switch">
        <button
          type="button"
          className={activeTab === 'receivables' ? 'selected' : ''}
          onClick={() => setActiveTab('receivables')}
        >
          <span>Receivables & Outstanding Balances</span>
          <span className="tab-count">{receivables.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'payments' ? 'selected' : ''}
          onClick={() => setActiveTab('payments')}
        >
          <span>Payment History Records</span>
          <span className="tab-count">{payments.length}</span>
        </button>
      </div>

      {/* Main Table Panel */}
      <section className="users-panel">
        {/* Filters Toolbar */}
        <div className="sales-toolbar">
          <div className="sales-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder={
                activeTab === 'receivables'
                  ? 'Search by Buyer, Sales No, Crop...'
                  : 'Search by Voucher No, Buyer, Sales No, Ref...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            value={buyerFilter}
            onChange={(e) => setBuyerFilter(e.target.value)}
            title="Filter by Buyer"
          >
            <option value="All">All Buyers</option>
            {buyers.map((b) => (
              <option key={b.id || b.buyerCode} value={b.buyerName}>
                {b.buyerName}
              </option>
            ))}
          </select>

          {activeTab === 'receivables' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by payment status"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
          ) : (
            <>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                title="Filter by payment mode"
              >
                <option value="All">All Payment Modes</option>
                <option value="Bank">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>

              <div className="sales-date-filter-group">
                <span>Date:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  title="Filter by payment date"
                />
              </div>
            </>
          )}

          <button className="sales-reset-btn" type="button" onClick={resetFilters}>
            ↻ Reset Filters
          </button>
        </div>

        {/* Dynamic Table Content */}
        {activeTab === 'receivables' ? (
          /* TAB 1: RECEIVABLES SECTION */
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>BUYER</th>
                  <th>SALES NUMBER</th>
                  <th>SALES DATE</th>
                  <th>TOTAL SALES AMOUNT</th>
                  <th>AMOUNT RECEIVED</th>
                  <th>OUTSTANDING AMOUNT</th>
                  <th>PAYMENT STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px' }}>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>Loading receivables...</div>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No receivables records found</strong>
                        <p>No sales match your search or filter criteria.</p>
                        <button type="button" onClick={resetFilters}>
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((item) => {
                    const isPaid = (item.computedStatus || '').toLowerCase() === 'paid';
                    const isPartial = (item.computedStatus || '').toLowerCase().includes('part');

                    return (
                      <tr key={item.id || item.salesNo}>
                        <td>
                          <strong>{item.buyer}</strong>
                        </td>
                        <td>
                          <span className="sales-code-badge">{item.salesNo}</span>
                        </td>
                        <td>{formatDate(item.salesDate)}</td>
                        <td className="sales-bold-amount">{formatCurrency(item.totalSalesAmount)}</td>
                        <td style={{ color: '#166534', fontWeight: 650 }}>
                          {formatCurrency(item.amountReceived)}
                        </td>
                        <td>
                          <strong style={{ color: item.outstandingAmount > 0 ? '#b91c1c' : '#166534' }}>
                            {formatCurrency(item.outstandingAmount)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`sales-status-badge ${
                              isPaid
                                ? 'sales-status-paid'
                                : isPartial
                                ? 'sales-status-partial'
                                : 'sales-status-pending'
                            }`}
                          >
                            <i /> {item.computedStatus}
                          </span>
                        </td>
                        <td>
                          <div className="sales-actions-cell" style={{ justifyContent: 'center' }}>
                            <TableActionMenu
                              items={[
                                { label: 'Record Payment', icon: 'pay', onClick: () => openRecordPaymentModal(item) },
                                { label: 'View Sale Details', icon: 'view', onClick: () => setViewSale(item) },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: PAYMENTS SECTION */
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>PAYMENT NUMBER</th>
                  <th>PAYMENT DATE</th>
                  <th>BUYER</th>
                  <th>REFERENCE SALES NO</th>
                  <th>PAYMENT AMOUNT</th>
                  <th>PAYMENT MODE</th>
                  <th>REFERENCE NO</th>
                  <th>REMARKS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px' }}>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>Loading payment vouchers...</div>
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No payment vouchers found</strong>
                        <p>Record a payment or adjust your search filters.</p>
                        <button type="button" onClick={resetFilters}>
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((payment) => (
                    <tr key={payment.id || payment.paymentNo}>
                      <td>
                        <span className="sales-code-badge">{payment.paymentNo}</span>
                      </td>
                      <td>{formatDate(payment.paymentDate)}</td>
                      <td>
                        <strong>{payment.buyer}</strong>
                      </td>
                      <td>
                        <span
                          className="sales-code-badge"
                          style={{ cursor: 'pointer', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                          title="Click to view related sale"
                          onClick={() => {
                            const foundSale = sales.find((s) => s.salesNo === payment.salesNo);
                            if (foundSale) setViewSale(foundSale);
                          }}
                        >
                          {payment.salesNo}
                        </span>
                      </td>
                      <td className="sales-bold-amount" style={{ color: '#166534' }}>
                        {formatCurrency(payment.paymentAmount)}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 650,
                            background: payment.paymentMode === 'UPI' ? '#eff6ff' : payment.paymentMode === 'Cash' ? '#fefce8' : '#f0fdf4',
                            color: payment.paymentMode === 'UPI' ? '#1d4ed8' : payment.paymentMode === 'Cash' ? '#854d0e' : '#15803d',
                            border: '1px solid currentColor'
                          }}
                        >
                          {payment.paymentMode}
                        </span>
                      </td>
                      <td>
                        {payment.referenceNo ? (
                          <code style={{ fontSize: '11px', background: '#f8fafc', padding: '2px 5px', borderRadius: '4px' }}>
                            {payment.referenceNo}
                          </code>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td title={payment.remarks} style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {payment.remarks || '—'}
                      </td>
                      <td>
                        <div className="sales-actions-cell" style={{ justifyContent: 'center' }}>
                          <TableActionMenu
                            items={[
                              { label: 'View Voucher Slip', icon: 'view', onClick: () => setViewPayment(payment) },
                              { label: 'Delete Voucher', icon: 'delete', danger: true, onClick: () => setDeleteConfirm(payment) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer & Pagination */}
        <div className="users-table-footer">
          <span>
            Showing <strong>{totalRecords ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> {activeTab === 'receivables' ? 'sales balances' : 'payment vouchers'}
          </span>
          <div className="pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                className={currentPage === i + 1 ? 'current' : ''}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* RECORD PAYMENT MODAL — EXACT SCREEN FIELDS */}
      {paymentModal && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setPaymentModal(null)}
        >
          <form className="user-modal sales-modal-large" style={{ maxWidth: '620px' }} onSubmit={handleSavePayment}>
            <header className="modal-header">
              <div>
                <span>SALES / RECORD PAYMENT</span>
                <h2>Record Payment & Receivable Details</h2>
                <p>Fields match the screen columns: Buyer, Sales No, Date, Amounts, and Status.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setPaymentModal(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body" style={{ padding: 0 }}>
              <div className="sales-form-section">
                {/* 1. Buyer & 2. Sales Number */}
                <div className="sales-form-grid-2">
                  <label>
                    Buyer *
                    <select
                      name="buyer"
                      value={formData.buyer}
                      onChange={handleBuyerSelect}
                      required
                    >
                      <option value="">Select Buyer</option>
                      {buyers.map((b) => (
                        <option key={b.id || b.buyerCode} value={b.buyerName}>
                          {b.buyerName} ({b.buyerCode})
                        </option>
                      ))}
                    </select>
                    {formErrors.buyer && <small className="field-error">{formErrors.buyer}</small>}
                  </label>

                  <label>
                    Sales Number *
                    <select
                      name="salesNo"
                      value={formData.salesNo}
                      onChange={handleSaleSelect}
                      required
                    >
                      <option value="">Select Sales Number</option>
                      {receivables.map((r) => (
                        <option key={r.salesNo} value={r.salesNo}>
                          {r.salesNo} — {r.buyer} ({formatCurrency(r.totalSalesAmount)})
                        </option>
                      ))}
                    </select>
                    {formErrors.salesNo && <small className="field-error">{formErrors.salesNo}</small>}
                  </label>
                </div>

                {/* 3. Sales Date & 4. Total Sales Amount */}
                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    Sales Date *
                    <input
                      type="date"
                      name="salesDate"
                      value={formData.salesDate}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.salesDate && <small className="field-error">{formErrors.salesDate}</small>}
                  </label>

                  <label>
                    Total Sales Amount (₹) *
                    <input
                      type="number"
                      name="totalSalesAmount"
                      step="any"
                      min="0"
                      placeholder="e.g. 220000"
                      value={formData.totalSalesAmount}
                      onChange={handleTotalSalesAmountChange}
                      required
                    />
                    {formErrors.totalSalesAmount && <small className="field-error">{formErrors.totalSalesAmount}</small>}
                  </label>
                </div>

                {/* 5. Amount Received & 6. Outstanding Amount */}
                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    Amount Received (₹) *
                    <input
                      type="number"
                      name="amountReceived"
                      step="any"
                      min="0"
                      placeholder="Enter amount received"
                      value={formData.amountReceived}
                      onChange={handleAmountReceivedChange}
                      required
                    />
                    {formErrors.amountReceived && <small className="field-error">{formErrors.amountReceived}</small>}
                  </label>

                  <label>
                    Outstanding Amount (₹)
                    <input
                      type="number"
                      name="outstandingAmount"
                      value={formData.outstandingAmount}
                      readOnly
                      style={{
                        background: '#f8fafc',
                        fontWeight: 750,
                        color: Number(formData.outstandingAmount) > 0 ? '#b91c1c' : '#15803d'
                      }}
                      title="Auto-calculated: Total Sales Amount − Amount Received"
                    />
                  </label>
                </div>

                {/* 7. Payment Status */}
                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    Payment Status *
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="Paid">Paid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Optional Payment Ledger Details */}
              <div className="sales-form-section" style={{ background: '#fafbfa' }}>
                <div className="sales-section-title" style={{ fontSize: '11px', color: '#64748b' }}>
                  Payment Method Details (Optional)
                </div>
                <div className="sales-form-grid-3">
                  <label>
                    Payment Mode
                    <select
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleFormChange}
                    >
                      <option value="Bank">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </label>

                  <label>
                    Reference No
                    <input
                      type="text"
                      name="referenceNo"
                      placeholder="UTR / Cheque No"
                      value={formData.referenceNo}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Remarks / Notes
                    <input
                      type="text"
                      name="remarks"
                      placeholder="Notes"
                      value={formData.remarks}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>
                Outstanding Amount = {formatCurrency(formData.totalSalesAmount || 0)} − {formatCurrency(formData.amountReceived || 0)} = {formatCurrency(formData.outstandingAmount || 0)}
              </span>
              <div>
                <button type="button" onClick={() => setPaymentModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* VIEW PAYMENT VOUCHER MODAL */}
      {viewPayment && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewPayment(null)}
        >
          <div className="user-modal sales-modal-large" style={{ maxWidth: '540px' }}>
            <header className="modal-header">
              <div>
                <span>SALES / PAYMENT RECEIPT VOUCHER</span>
                <h2>Voucher #{viewPayment.paymentNo}</h2>
                <p>Recorded cash/bank collection receipt voucher.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewPayment(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body" style={{ padding: 0 }}>
              <div className="sales-detail-card">
                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>VOUCHER NO</small>
                    <span className="sales-code-badge">{viewPayment.paymentNo}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>PAYMENT DATE</small>
                    <span>{formatDate(viewPayment.paymentDate)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>PAYMENT MODE</small>
                    <strong style={{ color: '#2563eb' }}>{viewPayment.paymentMode}</strong>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>BUYER / PAYEE</small>
                    <strong>{viewPayment.buyer}</strong>
                  </div>
                  <div className="sales-detail-item">
                    <small>REFERENCE SALE</small>
                    <span className="sales-code-badge">{viewPayment.salesNo}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>AMOUNT RECEIVED</small>
                    <strong style={{ color: '#15803d', fontSize: '18px' }}>
                      {formatCurrency(viewPayment.paymentAmount)}
                    </strong>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>TRANSACTION / UTR NO</small>
                    <code>{viewPayment.referenceNo || '—'}</code>
                  </div>
                  <div className="sales-detail-item" style={{ gridColumn: 'span 2' }}>
                    <small>REMARKS</small>
                    <span>{viewPayment.remarks || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Collection Receipt</span>
              <div>
                <button type="button" onClick={() => setViewPayment(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    const foundSale = sales.find((s) => s.salesNo === viewPayment.salesNo);
                    if (foundSale) {
                      setViewPayment(null);
                      setViewSale(foundSale);
                    }
                  }}
                >
                  View Related Sale
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* VIEW SALE MODAL */}
      {viewSale && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewSale(null)}
        >
          <div className="user-modal sales-modal-large" style={{ maxWidth: '620px' }}>
            <header className="modal-header">
              <div>
                <span>SALES / SALE DETAILS</span>
                <h2>Sale #{viewSale.salesNo}</h2>
                <p>Complete sales invoice details and collection status.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewSale(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body" style={{ padding: 0 }}>
              <div className="sales-detail-card">
                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>SALES NO</small>
                    <span className="sales-code-badge">{viewSale.salesNo}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>DATE</small>
                    <span>{formatDate(viewSale.salesDate)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>BUYER</small>
                    <strong>{viewSale.buyer}</strong>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>CROP</small>
                    <span className="sales-crop-pill">{viewSale.crop}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>QUANTITY & RATE</small>
                    <span>
                      {(Number(viewSale.quantity) || 0).toLocaleString('en-IN')} {viewSale.unit} @ {formatCurrency(viewSale.rate)}
                    </span>
                  </div>
                  <div className="sales-detail-item">
                    <small>NET INVOICE VALUE</small>
                    <strong style={{ color: '#15803d', fontSize: '16px' }}>
                      {formatCurrency(viewSale.netAmount)}
                    </strong>
                  </div>
                </div>

                <div className="sales-detail-row" style={{ background: '#f8fafc', padding: '10px' }}>
                  <div className="sales-detail-item">
                    <small>GROSS AMOUNT</small>
                    <span>{formatCurrency(viewSale.grossAmount)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>COMMISSION</small>
                    <span>− {formatCurrency(viewSale.commission || 0)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>TRANSPORT</small>
                    <span>− {formatCurrency(viewSale.transport || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>View-only details</span>
              <div>
                <button type="button" onClick={() => setViewSale(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    const target = viewSale;
                    setViewSale(null);
                    openRecordPaymentModal(target);
                  }}
                >
                  Record Payment For This Sale
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="sales-delete-modal">
            <span className="sales-delete-icon">⚠️</span>
            <h3>Delete Payment Voucher?</h3>
            <p>
              Are you sure you want to delete payment voucher <strong>#{deleteConfirm.paymentNo}</strong> for <strong>{deleteConfirm.buyer}</strong> ({formatCurrency(deleteConfirm.paymentAmount)})?
              <br />
              <span style={{ fontSize: '11px', color: '#b91c1c' }}>
                The outstanding balance for sale #{deleteConfirm.salesNo} will be restored automatically.
              </span>
            </p>
            <div className="sales-delete-actions">
              <button
                type="button"
                className="sales-delete-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sales-delete-confirm"
                onClick={handleDeletePayment}
              >
                Yes, Delete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
  );
}
