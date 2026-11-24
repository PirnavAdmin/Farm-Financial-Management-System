import TableActionMenu from '../../TableActionMenu';
import { useEffect, useMemo, useState } from 'react';
import salesService, { formatCurrency, formatDate } from '../../services/salesService';
import './customers.css';

export default function Customers({ onNavigate }) {
  const [buyers, setBuyers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [buyerModal, setBuyerModal] = useState(null); // null | { isEdit: boolean, data: object }
  const [viewDetails, setViewDetails] = useState(null); // null | buyer object
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | buyer object

  // Form State
  const initialForm = {
    buyerCode: '',
    buyerName: '',
    mobile: '',
    address: '',
    businessName: '',
    gstin: '',
    openingBalance: 0,
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [buyersList, salesList] = await Promise.all([
        salesService.getBuyers(),
        salesService.getSales()
      ]);
      setBuyers(buyersList);
      setSales(salesList);
    } catch (err) {
      console.error('[Customers] Error loading data:', err);
      setToast(err.friendlyMessage || err.message || 'Failed to load customers data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  // Open Add Modal
  const openAddModal = () => {
    const existingCodes = buyers
      .map((b) => b.buyerCode)
      .filter((c) => c && c.startsWith('BUY-'))
      .map((c) => parseInt(c.replace('BUY-', ''), 10))
      .filter((n) => !isNaN(n));
    const nextSeq = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : buyers.length + 1;
    const generatedCode = `BUY-${String(nextSeq).padStart(3, '0')}`;

    setFormData({
      ...initialForm,
      buyerCode: generatedCode,
      openingBalance: 0,
      status: 'Active'
    });
    setFormErrors({});
    setBuyerModal({ isEdit: false });
  };

  // Open Edit Modal
  const openEditModal = (buyer) => {
    setFormData({
      id: buyer.id,
      buyerCode: buyer.buyerCode,
      buyerName: buyer.buyerName,
      mobile: buyer.mobile || '',
      address: buyer.address || '',
      businessName: buyer.businessName || '',
      gstin: buyer.gstin || '',
      openingBalance: buyer.openingBalance || 0,
      status: buyer.status || 'Active'
    });
    setFormErrors({});
    setBuyerModal({ isEdit: true, data: buyer });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.buyerName?.trim()) errors.buyerName = 'Buyer Name is required.';
    if (!formData.mobile?.trim()) {
      errors.mobile = 'Mobile number is required.';
    } else if (!/^[0-9+\s-]{8,15}$/.test(formData.mobile.trim())) {
      errors.mobile = 'Enter a valid mobile phone number.';
    }

    if (formData.openingBalance < 0) {
      errors.openingBalance = 'Opening balance cannot be negative.';
    }

    // Duplicate check on Add
    if (!buyerModal.isEdit) {
      if (buyers.some((b) => b.buyerCode.toLowerCase() === formData.buyerCode.trim().toLowerCase())) {
        errors.buyerCode = `Buyer Code '${formData.buyerCode}' already exists.`;
      }
      if (buyers.some((b) => b.mobile.replace(/\D/g, '') === formData.mobile.replace(/\D/g, ''))) {
        errors.mobile = `A customer with mobile '${formData.mobile}' already exists.`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (buyerModal.isEdit) {
        await salesService.updateBuyer(formData.id, formData);
        setToast(`Buyer '${formData.buyerName}' updated.`);
      } else {
        await salesService.createBuyer(formData);
        setToast(`Buyer '${formData.buyerName}' registered.`);
      }
      setBuyerModal(null);
      await loadData();
    } catch (err) {
      setToast(err.friendlyMessage || err.message || 'Failed to save buyer record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await salesService.deleteBuyer(deleteConfirm.id);
      setToast(`Buyer '${deleteConfirm.buyerName}' deleted.`);
      setDeleteConfirm(null);
      if (viewDetails?.id === deleteConfirm.id) setViewDetails(null);
      await loadData();
    } catch (err) {
      setToast(err.friendlyMessage || err.message || 'Failed to delete buyer.');
    }
  };

  // KPI Stats
  const totalBuyers = buyers.length;
  const activeBuyers = buyers.filter((b) => (b.status || 'Active') === 'Active').length;
  const totalOpeningBalance = buyers.reduce((sum, b) => sum + (Number(b.openingBalance) || 0), 0);
  const totalAssociatedSales = sales.length;

  // Filtered Buyers
  const filteredBuyers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buyers.filter((b) => {
      const matchSearch =
        !q ||
        (b.buyerCode && b.buyerCode.toLowerCase().includes(q)) ||
        (b.buyerName && b.buyerName.toLowerCase().includes(q)) ||
        (b.mobile && b.mobile.toLowerCase().includes(q)) ||
        (b.businessName && b.businessName.toLowerCase().includes(q)) ||
        (b.gstin && b.gstin.toLowerCase().includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' || (b.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [buyers, query, statusFilter]);

  const totalRecords = filteredBuyers.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredBuyers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('All');
    setPage(1);
  };

  return (
    <div className="users-page sales-page-container">
      {/* Title & Header */}
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            SALES <span>/</span> CUSTOMERS
          </div>
          <h1>Customers & Buyers</h1>
          <p>Maintain registered buyer details, business identities, GSTIN, and opening ledger balances.</p>
        </div>
        <button className="users-add" type="button" onClick={openAddModal}>
          <span>＋</span> Add Buyer
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="sales-stats-grid">
        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-blue">👥</span>
          <div className="sales-stat-info">
            <small>REGISTERED BUYERS</small>
            <strong>{totalBuyers} Customers</strong>
            <span>Active client accounts</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-green">✓</span>
          <div className="sales-stat-info">
            <small>ACTIVE ACCOUNTS</small>
            <strong>{activeBuyers} Active</strong>
            <span>Eligible for new sales</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-amber">₹</span>
          <div className="sales-stat-info">
            <small>OPENING BALANCES</small>
            <strong>{formatCurrency(totalOpeningBalance)}</strong>
            <span>Initial buyer ledger credit</span>
          </div>
        </article>

        <article className="sales-stat-card">
          <span className="sales-stat-icon sales-icon-purple">▤</span>
          <div className="sales-stat-info">
            <small>TOTAL SALES LINKED</small>
            <strong>{totalAssociatedSales} Invoices</strong>
            <span>Across all buyers</span>
          </div>
        </article>
      </div>

      {/* Main Panel */}
      <section className="users-panel">
        {/* Toolbar */}
        <div className="sales-toolbar">
          <div className="sales-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by Buyer Code, Name, Mobile, Business, GSTIN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>


        </div>

        {/* Data Table */}
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              <tr>
                <th>BUYER CODE</th>
                <th>BUYER NAME</th>
                <th>MOBILE</th>
                <th>ADDRESS</th>
                <th>BUSINESS NAME</th>
                <th>GSTIN</th>
                <th>OPENING BALANCE</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px' }}>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>Loading buyers...</div>
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="users-empty">
                      <span>⌕</span>
                      <strong>No buyer records found</strong>
                      <p>Add a new buyer or try a different search term.</p>
                      <button type="button" onClick={resetFilters}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((buyer) => (
                  <tr key={buyer.id || buyer.buyerCode}>
                    <td>
                      <span className="sales-code-badge">{buyer.buyerCode}</span>
                    </td>
                    <td>
                      <strong>{buyer.buyerName}</strong>
                    </td>
                    <td>{buyer.mobile || '—'}</td>
                    <td title={buyer.address} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {buyer.address || '—'}
                    </td>
                    <td>{buyer.businessName || '—'}</td>
                    <td>
                      {buyer.gstin ? (
                        <code style={{ fontSize: '11px', background: '#f8fafc', padding: '2px 5px', borderRadius: '4px' }}>
                          {buyer.gstin}
                        </code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="sales-bold-amount">{formatCurrency(buyer.openingBalance || 0)}</td>
                    <td>
                      <div className="sales-actions-cell" style={{ justifyContent: 'center' }}>
                        <TableActionMenu
                          items={[
                            { label: 'View Details', icon: 'view', onClick: () => setViewDetails(buyer) },
                            { label: 'Edit Buyer', icon: 'edit', onClick: () => openEditModal(buyer) },
                            { label: 'Delete Buyer', icon: 'delete', danger: true, onClick: () => setDeleteConfirm(buyer) },
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

        {/* Footer */}
        <div className="users-table-footer">
          <span>
            Showing <strong>{totalRecords ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> buyers
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

      {/* ADD / EDIT BUYER MODAL */}
      {buyerModal && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setBuyerModal(null)}
        >
          <form className="user-modal sales-modal-large" style={{ maxWidth: '580px' }} onSubmit={handleSave}>
            <header className="modal-header">
              <div>
                <span>SALES / {buyerModal.isEdit ? 'EDIT BUYER' : 'NEW BUYER'}</span>
                <h2>{buyerModal.isEdit ? `Edit Buyer: ${formData.buyerName}` : 'Add New Buyer'}</h2>
                <p>Register complete customer and trade commercial profile details.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setBuyerModal(null)}
              >
                ×
              </button>
            </header>

            <div className="modal-body" style={{ padding: 0 }}>
              <div className="sales-form-section">
                <div className="sales-form-grid-2">
                  <label>
                    Buyer Code *
                    <input
                      type="text"
                      name="buyerCode"
                      value={formData.buyerCode}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g. BUY-001"
                      readOnly={buyerModal.isEdit}
                      style={buyerModal.isEdit ? { background: '#f8fafc', color: '#64748b' } : {}}
                    />
                    {formErrors.buyerCode && <small className="field-error">{formErrors.buyerCode}</small>}
                  </label>

                  <label>
                    Buyer Name *
                    <input
                      type="text"
                      name="buyerName"
                      placeholder="e.g. Sri Lakshmi Traders"
                      value={formData.buyerName}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.buyerName && <small className="field-error">{formErrors.buyerName}</small>}
                  </label>
                </div>

                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    Mobile Number *
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.mobile && <small className="field-error">{formErrors.mobile}</small>}
                  </label>

                  <label>
                    Business Name
                    <input
                      type="text"
                      name="businessName"
                      placeholder="e.g. Sri Lakshmi Agri Traders"
                      value={formData.businessName}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>

                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    GSTIN
                    <input
                      type="text"
                      name="gstin"
                      placeholder="e.g. 37ABCDE1234F1Z5"
                      value={formData.gstin}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Opening Balance (₹)
                    <input
                      type="number"
                      name="openingBalance"
                      step="any"
                      min="0"
                      placeholder="e.g. 25000"
                      value={formData.openingBalance}
                      onChange={handleFormChange}
                    />
                    {formErrors.openingBalance && <small className="field-error">{formErrors.openingBalance}</small>}
                  </label>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label>
                    Address
                    <textarea
                      name="address"
                      rows="2"
                      placeholder="Enter full business address, market yard, or town..."
                      value={formData.address}
                      onChange={handleFormChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #dcdfdc', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </label>
                </div>

                <div className="sales-form-grid-2" style={{ marginTop: '10px' }}>
                  <label>
                    Status
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Required for sales billing and collection tracking</span>
              <div>
                <button type="button" onClick={() => setBuyerModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : buyerModal.isEdit ? 'Update Buyer' : 'Register Buyer'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* VIEW BUYER DETAILS MODAL */}
      {viewDetails && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewDetails(null)}
        >
          <div className="user-modal sales-modal-large" style={{ maxWidth: '620px' }}>
            <header className="modal-header">
              <div>
                <span>SALES / BUYER PROFILE</span>
                <h2>{viewDetails.buyerName} ({viewDetails.buyerCode})</h2>
                <p>Commercial customer profile and linked sales transactions.</p>
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
                    <small>BUYER CODE</small>
                    <span className="sales-code-badge">{viewDetails.buyerCode}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>CONTACT MOBILE</small>
                    <span>{viewDetails.mobile || '—'}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>STATUS</small>
                    <div>
                      <span className={`sales-status-badge ${viewDetails.status === 'Active' ? 'sales-status-paid' : 'sales-status-pending'}`}>
                        <i /> {viewDetails.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item">
                    <small>BUSINESS NAME</small>
                    <strong>{viewDetails.businessName || '—'}</strong>
                  </div>
                  <div className="sales-detail-item">
                    <small>GSTIN</small>
                    <span>{viewDetails.gstin || 'Unregistered'}</span>
                  </div>
                  <div className="sales-detail-item">
                    <small>OPENING BALANCE</small>
                    <strong style={{ color: '#b45309' }}>{formatCurrency(viewDetails.openingBalance || 0)}</strong>
                  </div>
                </div>

                <div className="sales-detail-row">
                  <div className="sales-detail-item" style={{ gridColumn: 'span 3' }}>
                    <small>ADDRESS</small>
                    <span>{viewDetails.address || '—'}</span>
                  </div>
                </div>

                {/* Buyer's Sales History */}
                <div style={{ marginTop: '10px' }}>
                  <div className="sales-section-title">Sales History for this Buyer</div>
                  {(() => {
                    const buyerSales = sales.filter((s) => s.buyer === viewDetails.buyerName);
                    const totalPurchased = buyerSales.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0);

                    if (buyerSales.length === 0) {
                      return (
                        <div style={{ padding: '16px', textAlign: 'center', background: '#fafafa', borderRadius: '6px', color: '#64748b', fontSize: '12px' }}>
                          No sales transactions recorded for this buyer yet.
                        </div>
                      );
                    }

                    return (
                      <div>
                        <table className="sales-mini-table">
                          <thead>
                            <tr>
                              <th>SALES NO</th>
                              <th>DATE</th>
                              <th>CROP</th>
                              <th>NET AMOUNT</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {buyerSales.map((s) => (
                              <tr key={s.id || s.salesNo}>
                                <td><span className="sales-code-badge">{s.salesNo}</span></td>
                                <td>{formatDate(s.salesDate)}</td>
                                <td>{s.crop}</td>
                                <td><strong>{formatCurrency(s.netAmount)}</strong></td>
                                <td>
                                  <span className={`sales-status-badge ${s.paymentStatus === 'Paid' ? 'sales-status-paid' : s.paymentStatus?.includes('Part') ? 'sales-status-partial' : 'sales-status-pending'}`}>
                                    <i /> {s.paymentStatus || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>
                          Total Invoiced Value: <span style={{ color: '#15803d' }}>{formatCurrency(totalPurchased)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>Customer Master Record</span>
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
                  Edit Buyer Profile
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
            <h3>Delete Buyer?</h3>
            <p>
              Are you sure you want to remove buyer <strong>{deleteConfirm.buyerName}</strong> ({deleteConfirm.buyerCode})?
              <br />
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Note: Existing sales recorded under this buyer will keep their sales history intact.
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
                onClick={handleDelete}
              >
                Yes, Delete Buyer
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
