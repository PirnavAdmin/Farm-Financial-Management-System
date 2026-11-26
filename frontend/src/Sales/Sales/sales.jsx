import TableActionMenu from '../../TableActionMenu';
import { useEffect, useMemo, useState, useRef } from 'react';
import salesService, { formatCurrency, formatDate } from '../../services/salesService';
import './sales.css';

export default function Sales({ onNavigate }) {
  const [sales, setSales] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Filters state
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('All');
  const [farmFilter, setFarmFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Unified "Filters" dropdown state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isFilterOpen]);

  // Active filters count (excluding search query)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (fromDate) count++;
    if (toDate) count++;
    if (buyerFilter !== 'All') count++;
    if (farmFilter !== 'All') count++;
    if (cropFilter !== 'All') count++;
    if (statusFilter !== 'All') count++;
    return count;
  }, [fromDate, toDate, buyerFilter, farmFilter, cropFilter, statusFilter]);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [saleModal, setSaleModal] = useState(null); // null | { isEdit: boolean, data: object }
  const [viewDetails, setViewDetails] = useState(null); // null | sale object
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | sale object

  // Form state
  const initialForm = {
    salesNo: '',
    salesDate: '',
    buyer: '',
    farm: '',
    crop: '',
    quantity: '',
    unit: '',
    rate: '',
    grossAmount: 0,
    commission: '',
    transport: '',
    netAmount: 0,
    paymentStatus: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [salesList, buyersList, farmsList, cropsList, paymentsList] = await Promise.all([
        salesService.getSales(),
        salesService.getBuyers(),
        salesService.getFarms(),
        salesService.getCrops(),
        salesService.getPayments()
      ]);
      setSales(salesList);
      setBuyers(buyersList);
      setFarms(farmsList);
      setCrops(cropsList);
      setPayments(paymentsList);
    } catch (err) {
      console.error('[Sales] Error loading data:', err);
      setToast(err.friendlyMessage || err.message || 'Failed to load sales data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, fromDate, toDate, buyerFilter, farmFilter, cropFilter, statusFilter]);

  // Handle Form Change with dynamic auto-calculation
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      const qty = parseFloat(name === 'quantity' ? value : next.quantity) || 0;
      const rate = parseFloat(name === 'rate' ? value : next.rate) || 0;
      const comm = parseFloat(name === 'commission' ? value : next.commission) || 0;
      const transp = parseFloat(name === 'transport' ? value : next.transport) || 0;

      const gross = Math.round(qty * rate * 100) / 100;
      const net = Math.max(0, Math.round((gross - comm - transp) * 100) / 100);

      next.grossAmount = gross;
      next.netAmount = net;

      return next;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    const year = new Date().getFullYear();

    const existingSeq = sales
      .map((s) => s.salesNo)
      .filter((no) => no && no.startsWith(`SAL-${year}-`))
      .map((no) => parseInt(no.replace(`SAL-${year}-`, ''), 10))
      .filter((n) => !isNaN(n));
    const nextSeq = existingSeq.length > 0 ? Math.max(...existingSeq) + 1 : sales.length + 1;
    const generatedNo = `SAL-${year}-${String(nextSeq).padStart(3, '0')}`;

    setFormData({
      ...initialForm,
      salesNo: generatedNo,
      salesDate: '',
      buyer: '',
      farm: '',
      crop: '',
      quantity: '',
      unit: '',
      rate: '',
      grossAmount: 0,
      commission: '',
      transport: '',
      netAmount: 0,
      paymentStatus: ''
    });
    setFormErrors({});
    setSaleModal({ isEdit: false });
  };

  // Open Edit Modal
  const openEditModal = (sale) => {
    setFormData({
      id: sale.id,
      salesNo: sale.salesNo,
      salesDate: (sale.salesDate || '').slice(0, 10),
      buyer: sale.buyer,
      farm: sale.farm,
      crop: sale.crop,
      quantity: sale.quantity,
      unit: sale.unit || 'Quintals',
      rate: sale.rate,
      grossAmount: sale.grossAmount,
      commission: sale.commission || 0,
      transport: sale.transport || 0,
      netAmount: sale.netAmount,
      paymentStatus: sale.paymentStatus || 'Pending'
    });
    setFormErrors({});
    setSaleModal({ isEdit: true, data: sale });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.buyer?.trim()) errors.buyer = 'Buyer is required.';
    if (!formData.farm?.trim()) errors.farm = 'Farm is required.';
    if (!formData.crop?.trim()) errors.crop = 'Crop is required.';
    if (!formData.unit?.trim()) errors.unit = 'Unit is required.';
    if (!formData.salesDate) errors.salesDate = 'Sales Date is required.';

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) errors.quantity = 'Quantity must be greater than 0.';

    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate <= 0) errors.rate = 'Rate must be greater than 0.';

    const comm = parseFloat(formData.commission);
    if (isNaN(comm) || comm < 0) errors.commission = 'Commission cannot be negative.';

    const transp = parseFloat(formData.transport);
    if (isNaN(transp) || transp < 0) errors.transport = 'Transport cannot be negative.';

    if (formData.netAmount < 0) errors.netAmount = 'Net Amount cannot be negative.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (saleModal.isEdit) {
        await salesService.updateSale(formData.id, formData);
        setToast(`Sale #${formData.salesNo} updated successfully.`);
      } else {
        await salesService.createSale(formData);
        setToast(`Sale #${formData.salesNo} created successfully.`);
      }
      setSaleModal(null);
      await loadData();
    } catch (err) {
      setToast(err.friendlyMessage || err.message || 'Failed to save sales record.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await salesService.deleteSale(deleteConfirm.id, deleteConfirm.salesNo);
      setToast(`Sale #${deleteConfirm.salesNo} deleted.`);
      setDeleteConfirm(null);
      if (viewDetails?.id === deleteConfirm.id) setViewDetails(null);
      await loadData();
    } catch (err) {
      setToast(err.friendlyMessage || err.message || 'Failed to delete sale.');
    }
  };

  // KPI Calculations
  const totalSalesCount = sales.length;
  const totalGross = sales.reduce((sum, s) => sum + (Number(s.grossAmount) || 0), 0);
  const totalDeductions = sales.reduce((sum, s) => sum + (Number(s.commission) || 0) + (Number(s.transport) || 0), 0);
  const totalNet = sales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter((s) => {
      // Search
      const matchSearch =
        !q ||
        (s.salesNo && s.salesNo.toLowerCase().includes(q)) ||
        (s.buyer && s.buyer.toLowerCase().includes(q)) ||
        (s.farm && s.farm.toLowerCase().includes(q)) ||
        (s.crop && s.crop.toLowerCase().includes(q));

      // Date Range
      const saleDate = (s.salesDate || '').slice(0, 10);
      const matchFrom = !fromDate || saleDate >= fromDate;
      const matchTo = !toDate || saleDate <= toDate;

      // Dropdown filters
      const matchBuyer = buyerFilter === 'All' || s.buyer === buyerFilter;
      const matchFarm = farmFilter === 'All' || s.farm === farmFilter;
      const matchCrop = cropFilter === 'All' || s.crop === cropFilter;

      // Status
      const matchStatus =
        statusFilter === 'All' ||
        (s.paymentStatus || 'Pending').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchFrom && matchTo && matchBuyer && matchFarm && matchCrop && matchStatus;
    });
  }, [sales, query, fromDate, toDate, buyerFilter, farmFilter, cropFilter, statusFilter]);

  // Pagination calculations
  const totalRecords = filteredSales.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset all filters
  const resetFilters = () => {
    setQuery('');
    setFromDate('');
    setToDate('');
    setBuyerFilter('All');
    setFarmFilter('All');
    setCropFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  return (
    <div className="users-page sales-page-container">
      {/* Title & Header */}
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            SALES <span>/</span> SALES TRANSACTIONS
          </div>
          <h1>Sales Transactions</h1>
          <p>Record crop and farm produce sales, automated pricing, deductions, and payment status.</p>
        </div>
        <button className="users-add" type="button" onClick={openAddModal}>
          <span>＋</span> Add New Sale
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="sales-stats-grid">
        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-green">▤</span>
          <div className="sales-stat-info">
            <small>TOTAL SALES</small>
            <strong>{totalSalesCount} Transactions</strong>
            <span>Recorded sales cycles</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-blue">₹</span>
          <div className="sales-stat-info">
            <small>GROSS AMOUNT</small>
            <strong>{formatCurrency(totalGross)}</strong>
            <span>Total harvest billing</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-amber">⇄</span>
          <div className="sales-stat-info">
            <small>COMMISSION & TRANSPORT</small>
            <strong>{formatCurrency(totalDeductions)}</strong>
            <span>Operational deductions</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-purple">✓</span>
          <div className="sales-stat-info">
            <small>NET REALIZED AMOUNT</small>
            <strong>{formatCurrency(totalNet)}</strong>
            <span>Actual farm receivables</span>
          </div>
        </article>
      </div>

      {/* Main Panel */}
      <section className="users-panel">
        {/* Filters Toolbar */}
        <div className="sales-toolbar">
          <div className="sales-search">
            <svg
              className="sales-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by Sales No, Buyer, Farm, Crop..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="sales-toolbar-filters">
            {/* Unified "Filters" Dropdown */}
            <div className="sales-filters-dropdown-wrap" ref={filterDropdownRef}>
            <button
              type="button"
              className={`sales-filters-btn ${isFilterOpen ? 'active' : ''} ${activeFiltersCount > 0 ? 'has-active' : ''}`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              title="Filter by date, buyer, farm, crop, status"
              aria-haspopup="true"
              aria-expanded={isFilterOpen}
            >
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="sales-filters-count-badge">{activeFiltersCount}</span>
              )}
              <svg
                className={`sales-filters-chevron ${isFilterOpen ? 'rotated' : ''}`}
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M2.4 4.5h7.2a.5.5 0 0 1 .38.83l-3.6 4.1a.5.5 0 0 1-.76 0l-3.6-4.1a.5.5 0 0 1 .38-.83z" />
              </svg>
            </button>

            {isFilterOpen && (
              <div className="sales-filters-dropdown-menu">
                <div className="sales-filters-dropdown-header">
                  <div className="sales-filters-header-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span>Filter Sales</span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      className="sales-filters-clear-btn"
                      onClick={() => {
                        setFromDate('');
                        setToDate('');
                        setBuyerFilter('All');
                        setFarmFilter('All');
                        setCropFilter('All');
                        setStatusFilter('All');
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="sales-filters-dropdown-body">
                  {/* Sales Date Range: From & To */}
                  <div className="sales-filter-group">
                    <label className="sales-filter-group-label">Sales Date Range</label>
                    <div className="sales-filter-dates-row">
                      <div className="sales-filter-date-col">
                        <span>From:</span>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          title="Filter from sales date"
                        />
                      </div>
                      <div className="sales-filter-date-col">
                        <span>To:</span>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          title="Filter to sales date"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="sales-filter-dropdowns-grid">
                    {/* Buyer */}
                    <div className="sales-filter-group">
                      <label className="sales-filter-group-label">Buyer</label>
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
                    </div>

                    {/* Farm */}
                    <div className="sales-filter-group">
                      <label className="sales-filter-group-label">Farm</label>
                      <select
                        value={farmFilter}
                        onChange={(e) => setFarmFilter(e.target.value)}
                        title="Filter by Farm"
                      >
                        <option value="All">All Farms</option>
                        {farms.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Crop */}
                    <div className="sales-filter-group">
                      <label className="sales-filter-group-label">Crop</label>
                      <select
                        value={cropFilter}
                        onChange={(e) => setCropFilter(e.target.value)}
                        title="Filter by Crop"
                      >
                        <option value="All">All Crops</option>
                        {crops.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Status */}
                    <div className="sales-filter-group">
                      <label className="sales-filter-group-label">Payment Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        title="Filter by Payment Status"
                      >
                        <option value="All">All Payment Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="sales-filters-dropdown-footer">
                  <button
                    type="button"
                    className="sales-filters-apply-action"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Data Table */}
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>SALES NO</th>
                <th>SALES DATE</th>
                <th>BUYER</th>
                <th>FARM</th>
                <th>CROP</th>
                <th>QTY</th>
                <th>UNIT</th>
                <th>RATE</th>
                <th>GROSS AMOUNT</th>
                <th>COMMISSION</th>
                <th>TRANSPORT</th>
                <th>NET AMOUNT</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '36px' }}>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>Loading sales transactions...</div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="14">
                    <div className="users-empty">
                      <span>⌕</span>
                      <strong>No sales transactions found</strong>
                      <p>Try clearing filters or add a new sales entry.</p>
                      <button type="button" onClick={resetFilters}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((sale) => {
                  const status = sale.paymentStatus || 'Pending';
                  const isPaid = status.toLowerCase() === 'paid';
                  const isPartial = status.toLowerCase().includes('part');

                  return (
                    <tr key={sale.id || sale.salesNo}>
                      <td>
                        <span className="sales-code-badge">{sale.salesNo}</span>
                      </td>
                      <td>{formatDate(sale.salesDate)}</td>
                      <td>
                        <strong>{sale.buyer}</strong>
                      </td>
                      <td>{sale.farm || '—'}</td>
                      <td>
                        <span className="sales-crop-pill">{sale.crop}</span>
                      </td>
                      <td>{(Number(sale.quantity) || 0).toLocaleString('en-IN')}</td>
                      <td>{sale.unit}</td>
                      <td>{formatCurrency(sale.rate)}</td>
                      <td>{formatCurrency(sale.grossAmount)}</td>
                      <td>{Number(sale.commission) ? formatCurrency(sale.commission) : '₹0'}</td>
                      <td>{Number(sale.transport) ? formatCurrency(sale.transport) : '₹0'}</td>
                      <td className="sales-bold-amount">{formatCurrency(sale.netAmount)}</td>
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
                          <i /> {status}
                        </span>
                      </td>
                      <td>
                        <div className="sales-actions-cell" style={{ justifyContent: 'center' }}>
                          <TableActionMenu
                            items={[
                              { label: 'View Details', icon: 'view', onClick: () => setViewDetails(sale) },
                              { label: 'Edit Sale', icon: 'edit', onClick: () => openEditModal(sale) },
                              { label: 'Delete Sale', icon: 'delete', danger: true, onClick: () => setDeleteConfirm(sale) },
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

        {/* Table Footer & Pagination */}
        <div className="users-table-footer">
          <span>
            Showing <strong>{totalRecords ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> sales records
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

      {/* ADD / EDIT SALES ENTRY MODAL */}
      {saleModal && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setSaleModal(null)}
        >
          <form className="user-modal sales-modal-large" onSubmit={handleSave}>
            <header className="modal-header">
              <div>
                <span>SALES / {saleModal.isEdit ? 'EDIT SALE' : 'NEW SALE ENTRY'}</span>
                <h2>{saleModal.isEdit ? `Edit Sale #${formData.salesNo}` : 'Add New Sale Entry'}</h2>
                <p>Fill in the sales information, product rates, deductions, and payment status.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSaleModal(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body" style={{ padding: 0 }}>
              {/* SECTION 1: Sales Information */}
              <div className="sales-form-section">
                <div className="sales-section-title">1. Sales Information</div>
                <div className="sales-form-grid-3">
                  <label>
                    Sales No
                    <input
                      type="text"
                      name="salesNo"
                      value={formData.salesNo}
                      readOnly
                      style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      title="Auto-generated unique Sales Number"
                    />
                  </label>

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
                    Buyer / Customer *
                    <select
                      name="buyer"
                      value={formData.buyer}
                      onChange={handleFormChange}
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
                </div>

                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    Farm *
                    <select
                      name="farm"
                      value={formData.farm}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Farm</option>
                      {farms.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    {formErrors.farm && <small className="field-error">{formErrors.farm}</small>}
                  </label>

                  <label>
                    Crop *
                    <select
                      name="crop"
                      value={formData.crop}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Crop</option>
                      {crops.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {formErrors.crop && <small className="field-error">{formErrors.crop}</small>}
                  </label>
                </div>
              </div>

              {/* SECTION 2: Product / Sales Details */}
              <div className="sales-form-section">
                <div className="sales-section-title">2. Product / Sales Details</div>
                <div className="sales-form-grid-3">
                  <label>
                    Quantity *
                    <input
                      type="number"
                      name="quantity"
                      step="any"
                      min="0.01"
                      placeholder="e.g. 150"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.quantity && <small className="field-error">{formErrors.quantity}</small>}
                  </label>

                  <label>
                    Unit *
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select Unit</option>
                      <option value="Quintals">Quintals</option>
                      <option value="kg">kg</option>
                      <option value="Ton">Ton</option>
                      <option value="Bags">Bags</option>
                      <option value="Litre">Litre</option>
                    </select>
                    {formErrors.unit && <small className="field-error">{formErrors.unit}</small>}
                  </label>

                  <label>
                    Rate (₹ per unit) *
                    <input
                      type="number"
                      name="rate"
                      step="any"
                      min="0.01"
                      placeholder="e.g. 2200"
                      value={formData.rate}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.rate && <small className="field-error">{formErrors.rate}</small>}
                  </label>
                </div>
              </div>

              {/* SECTION 3: Amount Details & Calculations */}
              <div className="sales-form-section">
                <div className="sales-section-title">3. Amount Details (Auto-Calculated)</div>
                <div className="sales-form-grid-2">
                  <div className="sales-calc-display-box">
                    <small>GROSS AMOUNT (Qty × Rate)</small>
                    <strong>{formatCurrency(formData.grossAmount)}</strong>
                  </div>

                  <div className="sales-calc-display-box" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                    <small>NET REALIZED AMOUNT (Gross − Deductions)</small>
                    <strong style={{ color: '#0f172a' }}>{formatCurrency(formData.netAmount)}</strong>
                  </div>
                </div>

                <div className="sales-form-grid-2" style={{ marginTop: '12px' }}>
                  <label>
                    Commission (₹)
                    <input
                      type="number"
                      name="commission"
                      step="any"
                      min="0"
                      placeholder="e.g. 1500"
                      value={formData.commission}
                      onChange={handleFormChange}
                    />
                    {formErrors.commission && <small className="field-error">{formErrors.commission}</small>}
                  </label>

                  <label>
                    Transport (₹)
                    <input
                      type="number"
                      name="transport"
                      step="any"
                      min="0"
                      placeholder="e.g. 2000"
                      value={formData.transport}
                      onChange={handleFormChange}
                    />
                    {formErrors.transport && <small className="field-error">{formErrors.transport}</small>}
                  </label>
                </div>
              </div>

              {/* SECTION 4: Payment Information */}
              <div className="sales-form-section">
                <div className="sales-section-title">4. Payment Information</div>
                <div className="sales-form-grid-2">
                  <label>
                    Payment Status
                    <select
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Payment Status</option>
                      <option value="Pending">Pending (Unpaid)</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid (Full Settlement)</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Automatic computation: Gross = Qty × Rate; Net = Gross − Comm − Transp</span>
              <div>
                <button type="button" onClick={() => setSaleModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : saleModal.isEdit ? 'Update Sale Record' : 'Save Sale Record'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* VIEW SALE DETAILS MODAL */}
      {viewDetails && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewDetails(null)}
        >
          <div className="user-modal sales-modal-large" style={{ maxWidth: '680px' }}>
            <header className="modal-header">
              <div>
                <span>SALES / SALE DETAILS</span>
                <h2>Sale #{viewDetails.salesNo}</h2>
                <p>Complete harvest billing, breakdown, and collection history.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewDetails(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body" style={{ padding: 0 }}>
              <div className="sales-detail-card">
                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>SALES NUMBER</small>
                    <span className="sales-code-badge">{viewDetails.salesNo}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>SALES DATE</small>
                    <span>{formatDate(viewDetails.salesDate)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>PAYMENT STATUS</small>
                    <div>
                      <span
                        className={`sales-status-badge ${
                          (viewDetails.paymentStatus || '').toLowerCase() === 'paid'
                            ? 'sales-status-paid'
                            : (viewDetails.paymentStatus || '').toLowerCase().includes('part')
                            ? 'sales-status-partial'
                            : 'sales-status-pending'
                        }`}
                      >
                        <i /> {viewDetails.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>BUYER / CUSTOMER</small>
                    <strong>{viewDetails.buyer}</strong>
                  </div>
                  <div className="sales-detail-item">
                    <small>FARM</small>
                    <span>{viewDetails.farm || '—'}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>CROP PRODUCE</small>
                    <span className="sales-crop-pill">{viewDetails.crop}</span>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>QUANTITY & UNIT</small>
                    <span>
                      {(Number(viewDetails.quantity) || 0).toLocaleString('en-IN')} {viewDetails.unit}
                    </span>
                  </div>
                  <div className="sales-detail-item">
                    <small>UNIT RATE</small>
                    <span>{formatCurrency(viewDetails.rate)} / {viewDetails.unit}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>GROSS AMOUNT</small>
                    <strong style={{ color: '#2563eb' }}>{formatCurrency(viewDetails.grossAmount)}</strong>
                  </div>
                </div>

                <div className="sales-detail-row" style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                  <div className="sales-detail-item">
                    <small>COMMISSION</small>
                    <span style={{ color: '#b45309' }}>− {formatCurrency(viewDetails.commission || 0)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>TRANSPORT</small>
                    <span style={{ color: '#b45309' }}>− {formatCurrency(viewDetails.transport || 0)}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>NET REALIZED AMOUNT</small>
                    <strong style={{ color: '#15803d', fontSize: '18px' }}>
                      {formatCurrency(viewDetails.netAmount)}
                    </strong>
                  </div>
                </div>

                {/* Related Payments Section */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sales-section-title" style={{ margin: 0 }}>
                      Related Payment Collections
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        className="sales-btn-action"
                        style={{ fontSize: '11px' }}
                        onClick={() => {
                          setViewDetails(null);
                          onNavigate('Payments & Receivables');
                        }}
                      >
                        Go to Payments & Receivables →
                      </button>
                    )}
                  </div>

                  {(() => {
                    const related = payments.filter((p) => p.salesNo === viewDetails.salesNo);
                    const totalCollected = related.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
                    const balanceDue = Math.max(0, viewDetails.netAmount - totalCollected);

                    if (related.length === 0) {
                      return (
                        <div style={{ padding: '16px', textAlign: 'center', background: '#fafafa', borderRadius: '6px', color: '#64748b', fontSize: '12px', marginTop: '8px' }}>
                          No payment receipts recorded yet for this sale. Outstanding balance: <strong>{formatCurrency(viewDetails.netAmount)}</strong>.
                        </div>
                      );
                    }

                    return (
                      <div style={{ marginTop: '8px' }}>
                        <table className="sales-mini-table">
                          <thead>
                            <tr>
                              <th>VOUCHER</th>
                              <th>DATE</th>
                              <th>MODE</th>
                              <th>REF NO</th>
                              <th>AMOUNT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {related.map((p) => (
                              <tr key={p.id || p.paymentNo}>
                                <td><span className="sales-code-badge">{p.paymentNo}</span></td>
                                <td>{formatDate(p.paymentDate)}</td>
                                <td>{p.paymentMode}</td>
                                <td>{p.referenceNo || '—'}</td>
                                <td><strong>{formatCurrency(p.paymentAmount)}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px 0', fontSize: '12px' }}>
                          <span>Total Collected: <strong style={{ color: '#15803d' }}>{formatCurrency(totalCollected)}</strong></span>
                          <span>Balance Due: <strong style={{ color: balanceDue > 0 ? '#b91c1c' : '#15803d' }}>{formatCurrency(balanceDue)}</strong></span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>View-only details mode</span>
              <div>
                <button type="button" onClick={() => setViewDetails(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    const target = viewDetails;
                    setViewDetails(null);
                    openEditModal(target);
                  }}
                >
                  Edit This Sale
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirm && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="sales-delete-modal">
            <span className="sales-delete-icon">⚠️</span>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete sales record <strong>#{deleteConfirm.salesNo}</strong> for <strong>{deleteConfirm.buyer}</strong> ({formatCurrency(deleteConfirm.netAmount)})?
              <br />
              <span style={{ fontSize: '11px', color: '#dc2626' }}>This will remove associated line items and payment references.</span>
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
                onClick={handleDelete}
              >
                Yes, Delete Record
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
