import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supplierService, SEED_SUPPLIERS, SEED_TRANSACTIONS, SEED_PAYMENTS } from '../../services/supplierService';
import './suppliers.css';

// Currency formatter for Indian Rupees (₹)
const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹ ' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const SUPPLIER_TYPES = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Farm Machinery',
  'Irrigation & Equipment',
  'Bio-Inputs & Nutrients',
  'Feed & Fodder',
  'Packaging',
  'General Farm Inputs'
];

const EMPTY_SUPPLIER_FORM = {
  supplierCode: '',
  supplierName: '',
  supplierType: 'Seeds',
  mobile: '',
  email: '',
  address: '',
  city: '',
  district: '',
  state: 'Andhra Pradesh',
  pinCode: '',
  gstin: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  openingBalance: 0,
  status: 'Active',
  notes: ''
};

const EMPTY_TRANSACTION_FORM = {
  transactionCode: '',
  transactionDate: new Date().toISOString().split('T')[0],
  supplierId: '',
  supplierName: '',
  transactionType: 'Purchase',
  referenceNo: '',
  category: 'Seeds',
  itemsSummary: '',
  amount: '',
  paidAmount: '',
  notes: ''
};

const EMPTY_PAYMENT_FORM = {
  paymentCode: '',
  paymentDate: new Date().toISOString().split('T')[0],
  supplierId: '',
  supplierName: '',
  amountPaid: '',
  paymentMode: 'Bank Transfer',
  referenceNo: '',
  bankAccount: 'SBI Farm Operational A/C - 8812',
  notes: ''
};

export default function Suppliers({ initialTab = 'suppliers', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'suppliers' | 'transactions' | 'payments' | 'ledger'

  // Data states
  const [suppliersList, setSuppliersList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedLedgerSupplierId, setSelectedLedgerSupplierId] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 7;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState(EMPTY_SUPPLIER_FORM);
  const [formErrors, setFormErrors] = useState({});

  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, item }

  // Quick Transaction & Payment Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txFormData, setTxFormData] = useState(EMPTY_TRANSACTION_FORM);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState(EMPTY_PAYMENT_FORM);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load All Data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [suppliers, transactions, payments] = await Promise.all([
        supplierService.getSuppliers(),
        supplierService.getTransactions(),
        supplierService.getPayments()
      ]);
      setSuppliersList(suppliers || []);
      setTransactionsList(transactions || []);
      setPaymentsList(payments || []);
      if (!selectedLedgerSupplierId && suppliers?.length > 0) {
        setSelectedLedgerSupplierId(String(suppliers[0].id));
      }
    } catch (err) {
      console.error('[Suppliers] Error fetching data:', err);
      showToast('Loaded local supplier records.', 'info');
    } finally {
      setLoading(false);
    }
  }, [selectedLedgerSupplierId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Overall Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = suppliersList.length;
    const active = suppliersList.filter((s) => s.status === 'Active').length;

    // Calculate total outstanding payables across all suppliers
    let totalPayables = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    suppliersList.forEach((s) => {
      const fin = supplierService.computeSupplierFinancials(s, transactionsList, paymentsList);
      totalPayables += fin.outstandingBalance;
      totalInvoiced += fin.totalPurchases;
      totalPaid += fin.totalPayments;
    });

    return {
      total,
      active,
      inactive: total - active,
      totalPayables,
      totalInvoiced,
      totalPaid
    };
  }, [suppliersList, transactionsList, paymentsList]);

  // ── Filtered Suppliers ─────────────────────────────────────────────────────
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return suppliersList.filter((s) => {
      const matchesSearch =
        !q ||
        (s.supplierName && s.supplierName.toLowerCase().includes(q)) ||
        (s.supplierCode && s.supplierCode.toLowerCase().includes(q)) ||
        (s.mobile && s.mobile.includes(q)) ||
        (s.gstin && s.gstin.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.district && s.district.toLowerCase().includes(q)) ||
        (s.supplierType && s.supplierType.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesType = typeFilter === 'All' || s.supplierType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [suppliersList, searchQuery, statusFilter, typeFilter]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const currentSuppliersPage = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);

  // ── Filtered Transactions ──────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactionsList.filter((t) => {
      const matchesSearch =
        !q ||
        (t.supplierName && t.supplierName.toLowerCase().includes(q)) ||
        (t.transactionCode && t.transactionCode.toLowerCase().includes(q)) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || t.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactionsList, searchQuery, statusFilter]);

  // ── Filtered Payments ──────────────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return paymentsList.filter((p) => {
      return (
        !q ||
        (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
        (p.paymentCode && p.paymentCode.toLowerCase().includes(q)) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
        (p.paymentMode && p.paymentMode.toLowerCase().includes(q))
      );
    });
  }, [paymentsList, searchQuery]);

  // ── Form Validation ────────────────────────────────────────────────────────
  const validateSupplierForm = () => {
    const errs = {};
    if (!supplierFormData.supplierName?.trim()) {
      errs.supplierName = 'Supplier Name is required';
    }
    if (!supplierFormData.mobile?.trim()) {
      errs.mobile = 'Mobile Number is required';
    } else if (!/^\d{10}$/.test(supplierFormData.mobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (!supplierFormData.address?.trim()) {
      errs.address = 'Address is required';
    }
    if (supplierFormData.gstin?.trim()) {
      const gstinVal = supplierFormData.gstin.trim();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstinVal)) {
        errs.gstin = 'Invalid GSTIN format (e.g., 37ABCDE1234F1Z5)';
      }
    }
    if (supplierFormData.pinCode?.trim() && !/^\d{6}$/.test(supplierFormData.pinCode.trim())) {
      errs.pinCode = 'PIN code must be 6 digits';
    }
    if (supplierFormData.email?.trim() && !/\S+@\S+\.\S+/.test(supplierFormData.email.trim())) {
      errs.email = 'Invalid email address';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Open Add Modal ─────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    const nextCode = supplierService.generateSupplierCode(suppliersList);
    setSupplierFormData({
      ...EMPTY_SUPPLIER_FORM,
      supplierCode: nextCode
    });
    setEditingSupplier(null);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // ── Open Edit Modal ────────────────────────────────────────────────────────
  const handleOpenEdit = (supplier) => {
    setSupplierFormData({
      ...EMPTY_SUPPLIER_FORM,
      ...supplier,
      openingBalance: supplier.openingBalance !== undefined ? supplier.openingBalance : 0
    });
    setEditingSupplier(supplier);
    setFormErrors({});
    setIsFormOpen(true);
  };

  // ── Save Supplier (Create / Update) ────────────────────────────────────────
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!validateSupplierForm()) return;

    try {
      if (editingSupplier) {
        const updated = await supplierService.updateSupplier(editingSupplier.id, supplierFormData);
        setSuppliersList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        showToast(`Supplier "${updated.supplierName}" updated successfully.`);
      } else {
        const created = await supplierService.createSupplier(supplierFormData);
        setSuppliersList((prev) => [created, ...prev]);
        showToast(`Supplier "${created.supplierName}" registered successfully.`);
      }
      setIsFormOpen(false);
      setEditingSupplier(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to save supplier. Please verify details.', 'error');
    }
  };

  // ── Toggle Status ──────────────────────────────────────────────────────────
  const handleToggleStatus = async (supplier) => {
    const newStatus = supplier.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await supplierService.updateSupplier(supplier.id, {
        ...supplier,
        status: newStatus
      });
      setSuppliersList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showToast(`Supplier status updated to ${newStatus}.`);
    } catch {
      showToast('Could not update status.', 'error');
    }
  };

  // ── Delete Supplier ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'supplier') {
        await supplierService.deleteSupplier(deleteConfirm.item.id);
        setSuppliersList((prev) => prev.filter((s) => s.id !== deleteConfirm.item.id));
        showToast(`Supplier "${deleteConfirm.item.supplierName}" deleted.`);
      } else if (deleteConfirm.type === 'transaction') {
        await supplierService.deleteTransaction(deleteConfirm.item.id);
        setTransactionsList((prev) => prev.filter((t) => t.id !== deleteConfirm.item.id));
        showToast(`Transaction "${deleteConfirm.item.transactionCode}" deleted.`);
      } else if (deleteConfirm.type === 'payment') {
        await supplierService.deletePayment(deleteConfirm.item.id);
        setPaymentsList((prev) => prev.filter((p) => p.id !== deleteConfirm.item.id));
        showToast(`Payment voucher "${deleteConfirm.item.paymentCode}" deleted.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Delete operation failed.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ── Open Quick Payment Modal for a Supplier ────────────────────────────────
  const handleQuickPay = (supplier) => {
    const nextCode = supplierService.generatePaymentCode(paymentsList);
    setPaymentFormData({
      ...EMPTY_PAYMENT_FORM,
      paymentCode: nextCode,
      supplierId: supplier.id,
      supplierName: supplier.supplierName,
      amountPaid: ''
    });
    setIsPaymentModalOpen(true);
  };

  // ── Save Transaction (Bill) ────────────────────────────────────────────────
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!txFormData.supplierId || !txFormData.amount) {
      showToast('Please select supplier and specify bill amount.', 'error');
      return;
    }
    const sup = suppliersList.find((s) => String(s.id) === String(txFormData.supplierId));
    try {
      const newTx = await supplierService.createTransaction({
        ...txFormData,
        supplierName: sup ? sup.supplierName : txFormData.supplierName
      });
      setTransactionsList((prev) => [newTx, ...prev]);
      setIsTxModalOpen(false);
      showToast(`Purchase invoice ${newTx.transactionCode} recorded.`);
    } catch {
      showToast('Failed to record transaction.', 'error');
    }
  };

  // ── Save Payment ───────────────────────────────────────────────────────────
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentFormData.supplierId || !paymentFormData.amountPaid) {
      showToast('Please select supplier and enter payment amount.', 'error');
      return;
    }
    const sup = suppliersList.find((s) => String(s.id) === String(paymentFormData.supplierId));
    try {
      const newPy = await supplierService.createPayment({
        ...paymentFormData,
        supplierName: sup ? sup.supplierName : paymentFormData.supplierName
      });
      setPaymentsList((prev) => [newPy, ...prev]);
      setIsPaymentModalOpen(false);
      showToast(`Payment voucher ${newPy.paymentCode} saved successfully.`);
    } catch {
      showToast('Failed to save payment voucher.', 'error');
    }
  };

  // ── Export to CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      'Supplier Code',
      'Supplier Name',
      'Supplier Type',
      'Mobile',
      'Email',
      'Address',
      'City',
      'District',
      'State',
      'PIN',
      'GSTIN',
      'Bank Name',
      'Account Number',
      'IFSC',
      'Opening Balance',
      'Status'
    ];

    const rows = filteredSuppliers.map((s) => [
      `"${s.supplierCode}"`,
      `"${s.supplierName}"`,
      `"${s.supplierType}"`,
      `"${s.mobile}"`,
      `"${s.email || ''}"`,
      `"${s.address || ''}"`,
      `"${s.city || ''}"`,
      `"${s.district || ''}"`,
      `"${s.state || ''}"`,
      `"${s.pinCode || ''}"`,
      `"${s.gstin || ''}"`,
      `"${s.bankName || ''}"`,
      `"${s.accountNumber || ''}"`,
      `"${s.ifscCode || ''}"`,
      `"${s.openingBalance || 0}"`,
      `"${s.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agriman_suppliers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Supplier records exported to CSV.');
  };

  // ── Active Supplier Ledger Statement Calculation ──────────────────────────
  const currentStatement = useMemo(() => {
    if (!selectedLedgerSupplierId) return null;
    return supplierService.getSupplierStatement(
      selectedLedgerSupplierId,
      suppliersList,
      transactionsList,
      paymentsList
    );
  }, [selectedLedgerSupplierId, suppliersList, transactionsList, paymentsList]);

  return (
    <div className="sup-page">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="sup-page-head">
        <div>
          <div className="sup-eyebrow">
            MASTERS <span>/</span> SUPPLIER MANAGEMENT
          </div>
          <h1 className="sup-title">Supplier Management</h1>
          <p className="sup-subtitle">
            Manage agricultural input suppliers, purchase bills, payment settlements, and ledger accounts.
          </p>
        </div>
        <div className="sup-head-actions">
          <button className="sup-btn-secondary" type="button" onClick={handleExportCSV}>
            <span>⬇</span> Export CSV
          </button>
          {activeTab === 'suppliers' && (
            <button className="sup-btn-primary" type="button" onClick={handleOpenAdd}>
              <span>＋</span> Add Supplier
            </button>
          )}
          {activeTab === 'transactions' && (
            <button
              className="sup-btn-primary"
              type="button"
              onClick={() => {
                const nextCode = supplierService.generateTransactionCode(transactionsList);
                setTxFormData({
                  ...EMPTY_TRANSACTION_FORM,
                  transactionCode: nextCode,
                  supplierId: suppliersList[0]?.id || ''
                });
                setIsTxModalOpen(true);
              }}
            >
              <span>＋</span> Record Purchase Bill
            </button>
          )}
          {activeTab === 'payments' && (
            <button
              className="sup-btn-primary"
              type="button"
              onClick={() => {
                const nextCode = supplierService.generatePaymentCode(paymentsList);
                setPaymentFormData({
                  ...EMPTY_PAYMENT_FORM,
                  paymentCode: nextCode,
                  supplierId: suppliersList[0]?.id || ''
                });
                setIsPaymentModalOpen(true);
              }}
            >
              <span>＋</span> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="sup-tabs-nav" role="tablist">
        <button
          className={`sup-tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setActiveTab('suppliers');
            setPage(1);
          }}
        >
          <span>Suppliers Directory</span>
          <span className="sup-tab-badge">{suppliersList.length}</span>
        </button>

        <button
          className={`sup-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setActiveTab('transactions');
            setPage(1);
          }}
        >
          <span>Purchase Bills & Invoices</span>
          <span className="sup-tab-badge">{transactionsList.length}</span>
        </button>

        <button
          className={`sup-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setActiveTab('payments');
            setPage(1);
          }}
        >
          <span>Payment Vouchers</span>
          <span className="sup-tab-badge">{paymentsList.length}</span>
        </button>

        <button
          className={`sup-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('ledger')}
        >
          <span>Supplier Statements & Ledger</span>
        </button>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────────────────── */}
      <div className="sup-stats-grid">
        <div className="sup-stat-card">
          <div className="sup-stat-icon">🏢</div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">TOTAL SUPPLIERS</span>
            <strong className="sup-stat-val">{stats.total}</strong>
            <span className="sup-stat-hint">{stats.active} Active vendors</span>
          </div>
        </div>

        <div className="sup-stat-card">
          <div className="sup-stat-icon active">✓</div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">ACTIVE STATUS</span>
            <strong className="sup-stat-val">{stats.active}</strong>
            <span className="sup-stat-hint">{stats.inactive} Inactive</span>
          </div>
        </div>

        <div className="sup-stat-card">
          <div className="sup-stat-icon warning">₹</div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">OUTSTANDING PAYABLES</span>
            <strong className="sup-stat-val" style={{ color: '#b45309' }}>
              {formatINR(stats.totalPayables)}
            </strong>
            <span className="sup-stat-hint">Net pending settlements</span>
          </div>
        </div>

        <div className="sup-stat-card">
          <div className="sup-stat-icon info">📑</div>
          <div className="sup-stat-info">
            <span className="sup-stat-label">TOTAL PURCHASES INVOICED</span>
            <strong className="sup-stat-val">{formatINR(stats.totalInvoiced)}</strong>
            <span className="sup-stat-hint">{formatINR(stats.totalPaid)} total paid</span>
          </div>
        </div>
      </div>

      {/* ── TAB 1: SUPPLIERS DIRECTORY ────────────────────────────────────── */}
      {activeTab === 'suppliers' && (
        <section className="sup-panel">
          {/* Toolbar */}
          <div className="sup-toolbar">
            <div className="sup-search-box">
              <span>⌕</span>
              <input
                className="sup-search-input"
                placeholder="Search by supplier name, code, mobile, GSTIN, city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="sup-select-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              className="sup-select-filter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {SUPPLIER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {(searchQuery || statusFilter !== 'All' || typeFilter !== 'All') && (
              <button
                className="sup-reset-btn"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setTypeFilter('All');
                  setPage(1);
                }}
              >
                ↻ Reset
              </button>
            )}
          </div>

          {/* Table */}
          <div className="sup-table-wrap">
            <table className="sup-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>SUPPLIER NAME & CATEGORY</th>
                  <th>MOBILE</th>
                  <th>ADDRESS & CITY</th>
                  <th>GSTIN</th>
                  <th>BANK DETAILS</th>
                  <th>OPENING BAL</th>
                  <th>OUTSTANDING</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="sup-empty-state">
                      <div className="sup-empty-icon">⏳</div>
                      <strong>Loading suppliers...</strong>
                      <p>Connecting to database...</p>
                    </td>
                  </tr>
                ) : currentSuppliersPage.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="sup-empty-state">
                      <div className="sup-empty-icon">🔍</div>
                      <strong>No suppliers found</strong>
                      <p>Try adjusting your search query or filter criteria.</p>
                      <button className="sup-btn-primary" type="button" onClick={handleOpenAdd}>
                        + Add First Supplier
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentSuppliersPage.map((s) => {
                    const fin = supplierService.computeSupplierFinancials(s, transactionsList, paymentsList);
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="sup-code-badge">{s.supplierCode}</span>
                        </td>
                        <td>
                          <div className="sup-name-cell">
                            <div className="sup-avatar">{s.supplierName.charAt(0)}</div>
                            <div className="sup-name-info">
                              <strong title={s.supplierName}>{s.supplierName}</strong>
                              <span className="sup-type-tag">{s.supplierType || 'General'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{s.mobile}</div>
                          {s.email && <small style={{ color: '#94a3b8' }}>{s.email}</small>}
                        </td>
                        <td>
                          <div>{s.address}</div>
                          <small style={{ color: '#64748b' }}>
                            {[s.city, s.district, s.state].filter(Boolean).join(', ')}
                          </small>
                        </td>
                        <td>
                          {s.gstin ? (
                            <span className="sup-gstin-badge">{s.gstin}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className="sup-bank-cell">
                            <span className="sup-bank-name">{s.bankName || '—'}</span>
                            {s.accountNumber && (
                              <span className="sup-bank-acc">
                                A/C: ••••{s.accountNumber.slice(-4)} | {s.ifscCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="sup-amount">{formatINR(s.openingBalance)}</span>
                        </td>
                        <td>
                          <span className={`sup-amount ${fin.outstandingBalance > 0 ? 'due' : 'cleared'}`}>
                            {formatINR(fin.outstandingBalance)}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`sup-status-pill ${s.status === 'Active' ? 'active' : 'inactive'}`}
                            type="button"
                            title={`Click to toggle to ${s.status === 'Active' ? 'Inactive' : 'Active'}`}
                            onClick={() => handleToggleStatus(s)}
                          >
                            <span className="sup-status-dot" />
                            {s.status}
                          </button>
                        </td>
                        <td>
                          <div className="sup-actions">
                            <button
                              className="sup-action-btn"
                              type="button"
                              title="View Supplier Profile"
                              onClick={() => setViewingSupplier(s)}
                            >
                              👁
                            </button>
                            <button
                              className="sup-action-btn"
                              type="button"
                              title="Edit Supplier"
                              onClick={() => handleOpenEdit(s)}
                            >
                              ✎
                            </button>
                            <button
                              className="sup-action-btn pay"
                              type="button"
                              title="Record Payment"
                              onClick={() => handleQuickPay(s)}
                            >
                              ₹
                            </button>
                            <button
                              className="sup-action-btn delete"
                              type="button"
                              title="Delete Supplier"
                              onClick={() => setDeleteConfirm({ type: 'supplier', item: s })}
                            >
                              ⛌
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination */}
          <div className="sup-table-footer">
            <span>
              Showing <strong>{filteredSuppliers.length ? (page - 1) * pageSize + 1 : 0}</strong>–
              <strong>{Math.min(page * pageSize, filteredSuppliers.length)}</strong> of{' '}
              <strong>{filteredSuppliers.length}</strong> suppliers
            </span>
            <div className="sup-pagination">
              <button
                className="sup-pg-btn"
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`sup-pg-btn ${page === i + 1 ? 'active' : ''}`}
                  type="button"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="sup-pg-btn"
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── TAB 2: PURCHASE BILLS & TRANSACTIONS ─────────────────────────── */}
      {activeTab === 'transactions' && (
        <section className="sup-panel">
          <div className="sup-toolbar">
            <div className="sup-search-box">
              <span>⌕</span>
              <input
                className="sup-search-input"
                placeholder="Search transactions by code, invoice number, supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="sup-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="sup-table-wrap">
            <table className="sup-table">
              <thead>
                <tr>
                  <th>TX CODE</th>
                  <th>DATE</th>
                  <th>SUPPLIER NAME</th>
                  <th>INVOICE / REF NO</th>
                  <th>CATEGORY & ITEMS</th>
                  <th>INVOICE AMOUNT</th>
                  <th>PAID AMOUNT</th>
                  <th>BALANCE DUE</th>
                  <th>PAY STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="sup-empty-state">
                      <div className="sup-empty-icon">🧾</div>
                      <strong>No purchase transactions found</strong>
                      <p>Click "Record Purchase Bill" to log supplier deliveries.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className="sup-code-badge">{tx.transactionCode}</span>
                      </td>
                      <td>{tx.transactionDate}</td>
                      <td>
                        <strong>{tx.supplierName}</strong>
                      </td>
                      <td>
                        <span className="sup-gstin-badge">{tx.referenceNo || '—'}</span>
                      </td>
                      <td>
                        <div>
                          <span className="sup-type-tag">{tx.category}</span>
                        </div>
                        <small style={{ color: '#64748b' }}>{tx.itemsSummary}</small>
                      </td>
                      <td>
                        <span className="sup-amount">{formatINR(tx.amount)}</span>
                      </td>
                      <td>
                        <span className="sup-amount cleared">{formatINR(tx.paidAmount)}</span>
                      </td>
                      <td>
                        <span className={`sup-amount ${tx.balanceAmount > 0 ? 'due' : 'cleared'}`}>
                          {formatINR(tx.balanceAmount)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`sup-payment-badge ${
                            tx.paymentStatus === 'Paid'
                              ? 'paid'
                              : tx.paymentStatus === 'Partially Paid'
                              ? 'partially-paid'
                              : 'pending'
                          }`}
                        >
                          {tx.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="sup-actions">
                          <button
                            className="sup-action-btn delete"
                            type="button"
                            title="Delete Transaction"
                            onClick={() => setDeleteConfirm({ type: 'transaction', item: tx })}
                          >
                            ⛌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB 3: PAYMENT VOUCHERS ───────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <section className="sup-panel">
          <div className="sup-toolbar">
            <div className="sup-search-box">
              <span>⌕</span>
              <input
                className="sup-search-input"
                placeholder="Search payments by voucher code, supplier name, UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="sup-table-wrap">
            <table className="sup-table">
              <thead>
                <tr>
                  <th>VOUCHER NO</th>
                  <th>PAYMENT DATE</th>
                  <th>SUPPLIER NAME</th>
                  <th>AMOUNT PAID</th>
                  <th>PAYMENT MODE</th>
                  <th>REFERENCE / UTR NO</th>
                  <th>FROM BANK ACCOUNT</th>
                  <th>REMARKS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="sup-empty-state">
                      <div className="sup-empty-icon">💳</div>
                      <strong>No payment vouchers found</strong>
                      <p>Click "Record Payment" to issue a supplier payment settlement.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((py) => (
                    <tr key={py.id}>
                      <td>
                        <span className="sup-code-badge">{py.paymentCode}</span>
                      </td>
                      <td>{py.paymentDate}</td>
                      <td>
                        <strong>{py.supplierName}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#15803d', fontSize: '13px' }}>
                          {formatINR(py.amountPaid)}
                        </strong>
                      </td>
                      <td>
                        <span className="sup-type-tag">{py.paymentMode}</span>
                      </td>
                      <td>
                        <span className="sup-gstin-badge">{py.referenceNo || '—'}</span>
                      </td>
                      <td>
                        <small style={{ color: '#475569' }}>{py.bankAccount}</small>
                      </td>
                      <td>
                        <small style={{ color: '#64748b' }}>{py.notes || '—'}</small>
                      </td>
                      <td>
                        <div className="sup-actions">
                          <button
                            className="sup-action-btn delete"
                            type="button"
                            title="Delete Payment Voucher"
                            onClick={() => setDeleteConfirm({ type: 'payment', item: py })}
                          >
                            ⛌
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB 4: SUPPLIER STATEMENTS & LEDGER ───────────────────────────── */}
      {activeTab === 'ledger' && (
        <section className="sup-panel" style={{ padding: '20px' }}>
          <div className="sup-statement-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="sup-label" style={{ margin: 0 }}>
                Select Supplier:
              </label>
              <select
                className="sup-select"
                style={{ width: '280px' }}
                value={selectedLedgerSupplierId}
                onChange={(e) => setSelectedLedgerSupplierId(e.target.value)}
              >
                {suppliersList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierCode} - {s.supplierName} ({s.supplierType})
                  </option>
                ))}
              </select>
            </div>

            {currentStatement && (
              <div className="sup-ledger-summary-strip">
                <div className="sup-ledger-summary-item">
                  <small>Opening Balance</small>
                  <strong>{formatINR(currentStatement.openingBalance)}</strong>
                </div>
                <div className="sup-ledger-summary-item">
                  <small>Total Invoiced</small>
                  <strong style={{ color: '#2563eb' }}>{formatINR(currentStatement.totalDebit)}</strong>
                </div>
                <div className="sup-ledger-summary-item">
                  <small>Total Paid</small>
                  <strong style={{ color: '#16a34a' }}>{formatINR(currentStatement.totalCredit)}</strong>
                </div>
                <div className="sup-ledger-summary-item">
                  <small>Current Outstanding Due</small>
                  <strong style={{ color: currentStatement.netDue > 0 ? '#b45309' : '#16a34a' }}>
                    {formatINR(currentStatement.netDue)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {currentStatement ? (
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>ENTRY TYPE</th>
                    <th>VOUCHER / INVOICE REF</th>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: 'right' }}>DEBIT (INVOICE ₹)</th>
                    <th style={{ textAlign: 'right' }}>CREDIT (PAYMENT ₹)</th>
                    <th style={{ textAlign: 'right' }}>RUNNING BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#f8faf9' }}>
                    <td>—</td>
                    <td>
                      <strong>Opening Balance</strong>
                    </td>
                    <td>—</td>
                    <td>Carried forward opening balance</td>
                    <td style={{ textAlign: 'right' }}>{formatINR(currentStatement.openingBalance)}</td>
                    <td style={{ textAlign: 'right' }}>—</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatINR(currentStatement.openingBalance)}
                    </td>
                  </tr>

                  {currentStatement.entries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="sup-empty-state">
                        <p>No transactions or payments recorded yet for this supplier.</p>
                      </td>
                    </tr>
                  ) : (
                    currentStatement.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>
                          <span
                            className={`sup-type-tag ${entry.debit > 0 ? '' : 'sup-payment-badge paid'}`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td>
                          <span className="sup-gstin-badge">{entry.ref}</span>
                        </td>
                        <td>{entry.description}</td>
                        <td style={{ textAlign: 'right', color: entry.debit ? '#1e293b' : '#94a3b8' }}>
                          {entry.debit ? formatINR(entry.debit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', color: entry.credit ? '#16a34a' : '#94a3b8' }}>
                          {entry.credit ? formatINR(entry.credit) : '—'}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            color: entry.balance > 0 ? '#b45309' : '#16a34a'
                          }}
                        >
                          {formatINR(entry.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="sup-empty-state">
              <strong>Select a supplier to display account statement.</strong>
            </div>
          )}
        </section>
      )}

      {/* ── MODAL 1: ADD / EDIT SUPPLIER ──────────────────────────────────── */}
      {isFormOpen && (
        <div
          className="sup-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setIsFormOpen(false)}
        >
          <div className="sup-modal wide">
            <div className="sup-modal-header">
              <div>
                <h3>{editingSupplier ? 'Edit Supplier Details' : 'Register New Supplier'}</h3>
                <p>Provide supplier profile, contact, tax identification, and banking details.</p>
              </div>
              <button
                className="sup-modal-close"
                type="button"
                aria-label="Close"
                onClick={() => setIsFormOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div className="sup-modal-body">
                {/* 1. Basic Details */}
                <div>
                  <h4 className="sup-section-title">1. Basic Supplier Information</h4>
                  <div className="sup-form-grid">
                    <div className="sup-field">
                      <label className="sup-label">
                        Supplier Code <em>*</em>
                      </label>
                      <input
                        className="sup-input"
                        value={supplierFormData.supplierCode}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, supplierCode: e.target.value })
                        }
                        placeholder="e.g. SUP-001"
                        required
                      />
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">
                        Supplier Category / Type <em>*</em>
                      </label>
                      <select
                        className="sup-select"
                        value={supplierFormData.supplierType}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, supplierType: e.target.value })
                        }
                        required
                      >
                        {SUPPLIER_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sup-field full">
                      <label className="sup-label">
                        Supplier / Firm Name <em>*</em>
                      </label>
                      <input
                        className="sup-input"
                        value={supplierFormData.supplierName}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, supplierName: e.target.value })
                        }
                        placeholder="Enter full legal business or company name"
                        required
                      />
                      {formErrors.supplierName && (
                        <span className="sup-field-error">{formErrors.supplierName}</span>
                      )}
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">
                        Contact Mobile Number <em>*</em>
                      </label>
                      <input
                        className="sup-input"
                        type="tel"
                        maxLength="10"
                        value={supplierFormData.mobile}
                        onChange={(e) =>
                          setSupplierFormData({
                            ...supplierFormData,
                            mobile: e.target.value.replace(/\D/g, '')
                          })
                        }
                        placeholder="10-digit mobile (e.g. 9849123410)"
                        required
                      />
                      {formErrors.mobile && (
                        <span className="sup-field-error">{formErrors.mobile}</span>
                      )}
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">Email Address</label>
                      <input
                        className="sup-input"
                        type="email"
                        value={supplierFormData.email}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, email: e.target.value })
                        }
                        placeholder="contact@supplier.com"
                      />
                      {formErrors.email && (
                        <span className="sup-field-error">{formErrors.email}</span>
                      )}
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">Status</label>
                      <select
                        className="sup-select"
                        value={supplierFormData.status}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, status: e.target.value })
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Address Details */}
                <div>
                  <h4 className="sup-section-title">2. Address & Location</h4>
                  <div className="sup-form-grid">
                    <div className="sup-field full">
                      <label className="sup-label">
                        Street Address / Landmark <em>*</em>
                      </label>
                      <input
                        className="sup-input"
                        value={supplierFormData.address}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, address: e.target.value })
                        }
                        placeholder="Plot / Street / Godown address"
                        required
                      />
                      {formErrors.address && (
                        <span className="sup-field-error">{formErrors.address}</span>
                      )}
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">City / Town / Mandal</label>
                      <input
                        className="sup-input"
                        value={supplierFormData.city}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, city: e.target.value })
                        }
                        placeholder="e.g. Vijayawada"
                      />
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">District</label>
                      <input
                        className="sup-input"
                        value={supplierFormData.district}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, district: e.target.value })
                        }
                        placeholder="e.g. Krishna"
                      />
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">State</label>
                      <select
                        className="sup-select"
                        value={supplierFormData.state}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, state: e.target.value })
                        }
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">PIN Code</label>
                      <input
                        className="sup-input"
                        maxLength="6"
                        value={supplierFormData.pinCode}
                        onChange={(e) =>
                          setSupplierFormData({
                            ...supplierFormData,
                            pinCode: e.target.value.replace(/\D/g, '')
                          })
                        }
                        placeholder="6-digit PIN"
                      />
                      {formErrors.pinCode && (
                        <span className="sup-field-error">{formErrors.pinCode}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. GSTIN & Tax Details */}
                <div>
                  <h4 className="sup-section-title">3. GSTIN & Tax Identification</h4>
                  <div className="sup-form-grid">
                    <div className="sup-field full">
                      <label className="sup-label">GSTIN (15 characters)</label>
                      <input
                        className="sup-input"
                        maxLength="15"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                        value={supplierFormData.gstin}
                        onChange={(e) =>
                          setSupplierFormData({
                            ...supplierFormData,
                            gstin: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="e.g. 37AABCN1234F1Z8"
                      />
                      {formErrors.gstin && (
                        <span className="sup-field-error">{formErrors.gstin}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Bank Details */}
                <div>
                  <h4 className="sup-section-title">4. Bank & Settlement Details</h4>
                  <div className="sup-form-grid">
                    <div className="sup-field">
                      <label className="sup-label">Bank Name</label>
                      <input
                        className="sup-input"
                        value={supplierFormData.bankName}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, bankName: e.target.value })
                        }
                        placeholder="e.g. State Bank of India, HDFC"
                      />
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">Account Number</label>
                      <input
                        className="sup-input"
                        style={{ fontFamily: 'monospace' }}
                        value={supplierFormData.accountNumber}
                        onChange={(e) =>
                          setSupplierFormData({
                            ...supplierFormData,
                            accountNumber: e.target.value.replace(/\D/g, '')
                          })
                        }
                        placeholder="Enter bank account number"
                      />
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">IFSC Code</label>
                      <input
                        className="sup-input"
                        maxLength="11"
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                        value={supplierFormData.ifscCode}
                        onChange={(e) =>
                          setSupplierFormData({
                            ...supplierFormData,
                            ifscCode: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="e.g. SBIN0001234"
                      />
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">Branch Name</label>
                      <input
                        className="sup-input"
                        value={supplierFormData.branchName}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, branchName: e.target.value })
                        }
                        placeholder="e.g. Autonagar Branch"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Opening Balance & Notes */}
                <div>
                  <h4 className="sup-section-title">5. Opening Balance & Accounting</h4>
                  <div className="sup-form-grid">
                    <div className="sup-field">
                      <label className="sup-label">Opening Balance (INR ₹)</label>
                      <input
                        className="sup-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={supplierFormData.openingBalance}
                        onChange={(e) =>
                          setSupplierFormData({
                            ...supplierFormData,
                            openingBalance: e.target.value
                          })
                        }
                        placeholder="0.00"
                      />
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>
                        Initial debit/payable balance as of starting date
                      </small>
                    </div>

                    <div className="sup-field">
                      <label className="sup-label">Remarks / Notes</label>
                      <input
                        className="sup-input"
                        value={supplierFormData.notes}
                        onChange={(e) =>
                          setSupplierFormData({ ...supplierFormData, notes: e.target.value })
                        }
                        placeholder="Optional remarks or specialty products"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sup-modal-footer">
                <button
                  className="sup-btn-secondary"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>
                <button className="sup-btn-primary" type="submit">
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: VIEW SUPPLIER PROFILE ────────────────────────────────── */}
      {viewingSupplier && (
        <div
          className="sup-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewingSupplier(null)}
        >
          <div className="sup-modal wide">
            <div className="sup-modal-header">
              <div>
                <h3>Supplier Profile & Financial Summary</h3>
                <p>Complete directory record, bank account, and invoice history.</p>
              </div>
              <button
                className="sup-modal-close"
                type="button"
                onClick={() => setViewingSupplier(null)}
              >
                ×
              </button>
            </div>

            <div className="sup-modal-body">
              {/* Header Card */}
              <div className="sup-view-header-card">
                <div className="sup-view-avatar">{viewingSupplier.supplierName.charAt(0)}</div>
                <div className="sup-view-title" style={{ flex: 1 }}>
                  <h2>{viewingSupplier.supplierName}</h2>
                  <div className="sup-view-tags">
                    <span className="sup-code-badge">{viewingSupplier.supplierCode}</span>
                    <span className="sup-type-tag">{viewingSupplier.supplierType}</span>
                    <span
                      className={`sup-status-pill ${
                        viewingSupplier.status === 'Active' ? 'active' : 'inactive'
                      }`}
                    >
                      <span className="sup-status-dot" />
                      {viewingSupplier.status}
                    </span>
                  </div>
                </div>
                <button
                  className="sup-btn-primary"
                  type="button"
                  onClick={() => {
                    const sup = viewingSupplier;
                    setViewingSupplier(null);
                    handleOpenEdit(sup);
                  }}
                >
                  ✎ Edit Profile
                </button>
              </div>

              {/* Financial Metrics */}
              {(() => {
                const fin = supplierService.computeSupplierFinancials(
                  viewingSupplier,
                  transactionsList,
                  paymentsList
                );
                return (
                  <div className="sup-view-metrics-grid">
                    <div className="sup-view-metric-box">
                      <small>Opening Balance</small>
                      <strong>{formatINR(fin.openingBalance)}</strong>
                    </div>
                    <div className="sup-view-metric-box">
                      <small>Total Purchases</small>
                      <strong style={{ color: '#2563eb' }}>{formatINR(fin.totalPurchases)}</strong>
                    </div>
                    <div className="sup-view-metric-box">
                      <small>Total Paid</small>
                      <strong style={{ color: '#16a34a' }}>{formatINR(fin.totalPayments)}</strong>
                    </div>
                    <div className="sup-view-metric-box">
                      <small>Outstanding Payable</small>
                      <strong style={{ color: fin.outstandingBalance > 0 ? '#b45309' : '#16a34a' }}>
                        {formatINR(fin.outstandingBalance)}
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed Cards */}
              <div className="sup-detail-grid">
                {/* Contact & Address */}
                <div className="sup-detail-card">
                  <h4>📞 Contact & Location</h4>
                  <div className="sup-detail-list">
                    <div className="sup-detail-row">
                      <span>Mobile:</span>
                      <strong>{viewingSupplier.mobile}</strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>Email:</span>
                      <strong>{viewingSupplier.email || '—'}</strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>Address:</span>
                      <strong>{viewingSupplier.address}</strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>City / Mandal:</span>
                      <strong>{viewingSupplier.city || '—'}</strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>District & State:</span>
                      <strong>
                        {[viewingSupplier.district, viewingSupplier.state].filter(Boolean).join(', ')}
                      </strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>PIN Code:</span>
                      <strong>{viewingSupplier.pinCode || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Tax & Banking */}
                <div className="sup-detail-card">
                  <h4>🏦 Tax & Banking Details</h4>
                  <div className="sup-detail-list">
                    <div className="sup-detail-row">
                      <span>GSTIN:</span>
                      <strong style={{ fontFamily: 'monospace' }}>
                        {viewingSupplier.gstin || 'Not Registered'}
                      </strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>Bank Name:</span>
                      <strong>{viewingSupplier.bankName || '—'}</strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>Account Number:</span>
                      <strong style={{ fontFamily: 'monospace' }}>
                        {viewingSupplier.accountNumber || '—'}
                      </strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>IFSC Code:</span>
                      <strong style={{ fontFamily: 'monospace' }}>
                        {viewingSupplier.ifscCode || '—'}
                      </strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>Branch:</span>
                      <strong>{viewingSupplier.branchName || '—'}</strong>
                    </div>
                    <div className="sup-detail-row">
                      <span>Notes:</span>
                      <strong style={{ fontWeight: 400 }}>{viewingSupplier.notes || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bills for this supplier */}
              <div>
                <h4 className="sup-section-title">Recent Purchase Bills (`supplier_transactions`)</h4>
                <div className="sup-table-wrap">
                  <table className="sup-table">
                    <thead>
                      <tr>
                        <th>CODE</th>
                        <th>DATE</th>
                        <th>REF NO</th>
                        <th>ITEMS</th>
                        <th>BILL AMOUNT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsList
                        .filter((t) => String(t.supplierId) === String(viewingSupplier.id))
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td>
                              <span className="sup-code-badge">{tx.transactionCode}</span>
                            </td>
                            <td>{tx.transactionDate}</td>
                            <td>{tx.referenceNo}</td>
                            <td>{tx.itemsSummary}</td>
                            <td>{formatINR(tx.amount)}</td>
                            <td>
                              <span
                                className={`sup-payment-badge ${
                                  tx.paymentStatus === 'Paid' ? 'paid' : 'pending'
                                }`}
                              >
                                {tx.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {transactionsList.filter(
                        (t) => String(t.supplierId) === String(viewingSupplier.id)
                      ).length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>
                            No purchase transactions on record.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="sup-modal-footer">
              <button
                className="sup-btn-secondary"
                type="button"
                onClick={() => setViewingSupplier(null)}
              >
                Close
              </button>
              <button
                className="sup-btn-primary"
                type="button"
                onClick={() => {
                  const s = viewingSupplier;
                  setViewingSupplier(null);
                  handleQuickPay(s);
                }}
              >
                ₹ Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: RECORD PURCHASE BILL ─────────────────────────────────── */}
      {isTxModalOpen && (
        <div
          className="sup-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setIsTxModalOpen(false)}
        >
          <div className="sup-modal">
            <div className="sup-modal-header">
              <div>
                <h3>Record Supplier Purchase Bill (`supplier_transactions`)</h3>
                <p>Log inward agricultural inputs, seeds, fertilizers, or machinery invoice.</p>
              </div>
              <button
                className="sup-modal-close"
                type="button"
                onClick={() => setIsTxModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="sup-modal-body">
                <div className="sup-form-grid">
                  <div className="sup-field">
                    <label className="sup-label">Transaction Code</label>
                    <input
                      className="sup-input"
                      value={txFormData.transactionCode}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, transactionCode: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Invoice Date</label>
                    <input
                      className="sup-input"
                      type="date"
                      value={txFormData.transactionDate}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, transactionDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sup-field full">
                    <label className="sup-label">
                      Supplier <em>*</em>
                    </label>
                    <select
                      className="sup-select"
                      value={txFormData.supplierId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const match = suppliersList.find((s) => String(s.id) === sid);
                        setTxFormData({
                          ...txFormData,
                          supplierId: sid,
                          supplierName: match?.supplierName || '',
                          category: match?.supplierType || 'General'
                        });
                      }}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supplierCode} - {s.supplierName} ({s.supplierType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Invoice / Bill Reference No</label>
                    <input
                      className="sup-input"
                      value={txFormData.referenceNo}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, referenceNo: e.target.value })
                      }
                      placeholder="e.g. INV-2026-901"
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Category</label>
                    <select
                      className="sup-select"
                      value={txFormData.category}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, category: e.target.value })
                      }
                    >
                      {SUPPLIER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sup-field full">
                    <label className="sup-label">Items Summary / Description</label>
                    <input
                      className="sup-input"
                      value={txFormData.itemsSummary}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, itemsSummary: e.target.value })
                      }
                      placeholder="e.g. 50 Bags Urea (45kg) + 10 Bags DAP"
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">
                      Invoice Total Amount (₹) <em>*</em>
                    </label>
                    <input
                      className="sup-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={txFormData.amount}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, amount: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Amount Paid Now (₹)</label>
                    <input
                      className="sup-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={txFormData.paidAmount}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, paidAmount: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="sup-field full">
                    <label className="sup-label">Remarks</label>
                    <input
                      className="sup-input"
                      value={txFormData.notes}
                      onChange={(e) =>
                        setTxFormData({ ...txFormData, notes: e.target.value })
                      }
                      placeholder="Delivery verification or batch notes"
                    />
                  </div>
                </div>
              </div>

              <div className="sup-modal-footer">
                <button
                  className="sup-btn-secondary"
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="sup-btn-primary" type="submit">
                  Record Invoice Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: RECORD PAYMENT VOUCHER ───────────────────────────────── */}
      {isPaymentModalOpen && (
        <div
          className="sup-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setIsPaymentModalOpen(false)}
        >
          <div className="sup-modal">
            <div className="sup-modal-header">
              <div>
                <h3>Record Supplier Payment Voucher (`supplier_payments`)</h3>
                <p>Issue settlement to supplier via Bank Transfer, UPI, Cheque, or Cash.</p>
              </div>
              <button
                className="sup-modal-close"
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="sup-modal-body">
                <div className="sup-form-grid">
                  <div className="sup-field">
                    <label className="sup-label">Voucher Code</label>
                    <input
                      className="sup-input"
                      value={paymentFormData.paymentCode}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, paymentCode: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Payment Date</label>
                    <input
                      className="sup-input"
                      type="date"
                      value={paymentFormData.paymentDate}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sup-field full">
                    <label className="sup-label">
                      Pay To Supplier <em>*</em>
                    </label>
                    <select
                      className="sup-select"
                      value={paymentFormData.supplierId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const match = suppliersList.find((s) => String(s.id) === sid);
                        setPaymentFormData({
                          ...paymentFormData,
                          supplierId: sid,
                          supplierName: match?.supplierName || ''
                        });
                      }}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliersList.map((s) => {
                        const fin = supplierService.computeSupplierFinancials(
                          s,
                          transactionsList,
                          paymentsList
                        );
                        return (
                          <option key={s.id} value={s.id}>
                            {s.supplierCode} - {s.supplierName} (Due: {formatINR(fin.outstandingBalance)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">
                      Amount Paid (INR ₹) <em>*</em>
                    </label>
                    <input
                      className="sup-input"
                      type="number"
                      step="0.01"
                      min="1"
                      value={paymentFormData.amountPaid}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, amountPaid: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Payment Mode</label>
                    <select
                      className="sup-select"
                      value={paymentFormData.paymentMode}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, paymentMode: e.target.value })
                      }
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI (Google Pay / PhonePe)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Reference No / UTR / Cheque No</label>
                    <input
                      className="sup-input"
                      value={paymentFormData.referenceNo}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, referenceNo: e.target.value })
                      }
                      placeholder="e.g. UTR-SBI-99238472"
                      required
                    />
                  </div>

                  <div className="sup-field">
                    <label className="sup-label">Source Bank Account</label>
                    <input
                      className="sup-input"
                      value={paymentFormData.bankAccount}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, bankAccount: e.target.value })
                      }
                      placeholder="e.g. SBI Farm Operational A/C - 8812"
                    />
                  </div>

                  <div className="sup-field full">
                    <label className="sup-label">Payment Notes</label>
                    <input
                      className="sup-input"
                      value={paymentFormData.notes}
                      onChange={(e) =>
                        setPaymentFormData({ ...paymentFormData, notes: e.target.value })
                      }
                      placeholder="e.g. Full settlement for invoice #..."
                    />
                  </div>
                </div>
              </div>

              <div className="sup-modal-footer">
                <button
                  className="sup-btn-secondary"
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="sup-btn-primary" type="submit">
                  Save Payment Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: CONFIRM DELETE ───────────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="sup-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="sup-modal compact">
            <div className="sup-modal-header">
              <div>
                <h3 style={{ color: '#dc2626' }}>Confirm Delete</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button
                className="sup-modal-close"
                type="button"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>

            <div className="sup-modal-body">
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
                Are you sure you want to permanently delete{' '}
                <strong>
                  {deleteConfirm.type === 'supplier'
                    ? `Supplier "${deleteConfirm.item.supplierName}" (${deleteConfirm.item.supplierCode})`
                    : deleteConfirm.type === 'transaction'
                    ? `Purchase Transaction "${deleteConfirm.item.transactionCode}"`
                    : `Payment Voucher "${deleteConfirm.item.paymentCode}"`}
                </strong>
                ?
              </p>
            </div>

            <div className="sup-modal-footer">
              <button
                className="sup-btn-secondary"
                type="button"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="sup-btn-primary"
                style={{ background: '#dc2626' }}
                type="button"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`sup-toast ${toast.type === 'error' ? 'error' : ''}`} role="alert">
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
          <button className="sup-toast-close" type="button" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
