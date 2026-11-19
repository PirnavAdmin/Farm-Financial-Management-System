import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  machineryService,
  normalizeMachine,
  SEED_MACHINERY
} from '../../services/machineryService.js';
import './machinery.css';

// Currency formatter for Indian Rupees (₹)
const formatINR = (val) => {
  const num = Number(val) || 0;
  return '₹ ' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

// Safe date formatter (e.g. "15 Apr 2022")
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
};

const MACHINE_TYPES = [
  'Tractor',
  'Power Tiller',
  'Power Weeder',
  'Sprayer',
  'Harvester',
  'Rotavator',
  'Cultivator',
  'Baler',
  'Digger',
  'Thresher',
  'Irrigation Pump',
  'Other'
];

const FUEL_TYPES = [
  'Diesel',
  'Petrol',
  'Battery / Electric',
  'PTO Driven',
  'Solar / Hybrid',
  'Manual / None'
];

const STATUS_OPTIONS = [
  'Active',
  'Inactive',
  'Under Maintenance'
];

const EMPTY_MACHINE_FORM = {
  machineCode: '',
  machineName: '',
  machineType: 'Tractor',
  registrationNo: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchaseCost: '',
  currentValue: '',
  fuelType: 'Diesel',
  status: 'Active',
  modelNumber: '',
  manufacturer: '',
  notes: ''
};

export default function Machinery({ onNavigate }) {
  // Data states
  const [machineryList, setMachineryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 7;

  // Add/Edit Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [formData, setFormData] = useState(EMPTY_MACHINE_FORM);
  const [formErrors, setFormErrors] = useState({});

  // View Details Modal State
  const [viewingMachine, setViewingMachine] = useState(null);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Three-dot Action Menu State (holds row ID of currently open dropdown)
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Click outside listener for the 3-dot dropdown menu
  useEffect(() => {
    if (!openActionMenuId) return;
    const handleClickOutside = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openActionMenuId]);

  // Load initial machinery records
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await machineryService.getMachinery();
      setMachineryList(data);
    } catch (err) {
      console.error('[Machinery] Error loading data:', err);
      showToast('Failed to load machinery from server. Displaying local records.', 'error');
      setMachineryList(SEED_MACHINERY.map(normalizeMachine));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered & Searched List
  const filteredMachinery = useMemo(() => {
    return machineryList.filter((m) => {
      // Search by machine name or registration number
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (m.machineName || '').toLowerCase().includes(q);
        const regMatch = (m.registrationNo || '').toLowerCase().includes(q);
        const codeMatch = (m.machineCode || '').toLowerCase().includes(q);
        const typeMatch = (m.machineType || '').toLowerCase().includes(q);
        if (!nameMatch && !regMatch && !codeMatch && !typeMatch) return false;
      }

      // Filter by Machine Type
      if (typeFilter !== 'All' && m.machineType !== typeFilter) {
        return false;
      }

      // Filter by Status
      if (statusFilter !== 'All' && m.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [machineryList, searchQuery, typeFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMachinery.length / pageSize));
  const currentPageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMachinery.slice(start, start + pageSize);
  }, [filteredMachinery, page, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    return machineryService.computeMachineryMetrics(machineryList);
  }, [machineryList]);

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.machineName || !formData.machineName.trim()) {
      errors.machineName = 'Machine Name is required';
    }

    if (!formData.machineType) {
      errors.machineType = 'Please select a Machine Type';
    }

    if (!formData.purchaseDate) {
      errors.purchaseDate = 'Purchase Date is required';
    } else {
      const d = new Date(formData.purchaseDate);
      if (isNaN(d.getTime())) {
        errors.purchaseDate = 'Please enter a valid date';
      }
    }

    if (formData.purchaseCost === '' || formData.purchaseCost === null || formData.purchaseCost === undefined) {
      errors.purchaseCost = 'Purchase Cost is required';
    } else {
      const cost = Number(formData.purchaseCost);
      if (isNaN(cost) || cost < 0) {
        errors.purchaseCost = 'Purchase Cost must be a positive number';
      }
    }

    if (formData.currentValue === '' || formData.currentValue === null || formData.currentValue === undefined) {
      errors.currentValue = 'Current Value is required';
    } else {
      const val = Number(formData.currentValue);
      if (isNaN(val) || val < 0) {
        errors.currentValue = 'Current Value must be a positive number';
      }
    }

    if (!formData.fuelType) {
      errors.fuelType = 'Please select a Fuel / Power Type';
    }

    if (!formData.status) {
      errors.status = 'Please select a Status';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextCode = machineryService.generateMachineCode(machineryList);
    setEditingMachine(null);
    setFormData({
      ...EMPTY_MACHINE_FORM,
      machineCode: nextCode,
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (machine) => {
    setEditingMachine(machine);
    setFormData({
      machineCode: machine.machineCode || '',
      machineName: machine.machineName || '',
      machineType: machine.machineType || 'Tractor',
      registrationNo: machine.registrationNo || '',
      purchaseDate: machine.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCost: machine.purchaseCost !== undefined ? machine.purchaseCost : '',
      currentValue: machine.currentValue !== undefined ? machine.currentValue : '',
      fuelType: machine.fuelType || 'Diesel',
      status: machine.status || 'Active',
      modelNumber: machine.modelNumber || '',
      manufacturer: machine.manufacturer || '',
      notes: machine.notes || ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingMachine) {
        const updated = await machineryService.updateMachine(editingMachine.id, formData);
        setMachineryList((prev) =>
          prev.map((m) => (String(m.id) === String(editingMachine.id) ? updated : m))
        );
        showToast(`Machinery "${updated.machineName}" updated successfully.`);
      } else {
        const created = await machineryService.createMachine(formData);
        setMachineryList((prev) => [created, ...prev]);
        showToast(`Machinery "${created.machineName}" registered successfully.`);
      }
      setIsFormOpen(false);
      setEditingMachine(null);
    } catch (err) {
      console.error('[Machinery] Submit error:', err);
      showToast(err.message || 'Error saving machinery record.', 'error');
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await machineryService.deleteMachine(deleteConfirm.id);
      setMachineryList((prev) => prev.filter((m) => String(m.id) !== String(deleteConfirm.id)));
      showToast(`Machine "${deleteConfirm.machineName}" was deleted.`);
      setDeleteConfirm(null);
      if (viewingMachine && String(viewingMachine.id) === String(deleteConfirm.id)) {
        setViewingMachine(null);
      }
    } catch (err) {
      console.error('[Machinery] Delete error:', err);
      showToast('Error deleting machinery record.', 'error');
    }
  };

  // Toggle status cycle: Active -> Under Maintenance -> Inactive -> Active
  const handleCycleStatus = async (machine, e) => {
    e.stopPropagation();
    let nextStatus = 'Active';
    if (machine.status === 'Active') nextStatus = 'Under Maintenance';
    else if (machine.status === 'Under Maintenance') nextStatus = 'Inactive';
    else nextStatus = 'Active';

    try {
      const updated = await machineryService.updateMachine(machine.id, { status: nextStatus });
      setMachineryList((prev) =>
        prev.map((m) => (String(m.id) === String(machine.id) ? updated : m))
      );
      showToast(`Status updated to "${nextStatus}" for ${machine.machineName}`);
    } catch (err) {
      console.error('[Machinery] Status toggle error:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (machineryList.length === 0) {
      showToast('No machinery records to export.', 'error');
      return;
    }

    const headers = [
      'Machine Code',
      'Machine Name',
      'Machine Type',
      'Registration No',
      'Purchase Date',
      'Purchase Cost (INR)',
      'Current Value (INR)',
      'Fuel / Power Type',
      'Status',
      'Model Number',
      'Manufacturer',
      'Notes'
    ];

    const rows = machineryList.map((m) => [
      `"${m.machineCode || ''}"`,
      `"${(m.machineName || '').replace(/"/g, '""')}"`,
      `"${m.machineType || ''}"`,
      `"${m.registrationNo || ''}"`,
      `"${m.purchaseDate || ''}"`,
      m.purchaseCost || 0,
      m.currentValue || 0,
      `"${m.fuelType || ''}"`,
      `"${m.status || ''}"`,
      `"${(m.modelNumber || '').replace(/"/g, '""')}"`,
      `"${(m.manufacturer || '').replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agriman_machinery_equipment_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Machinery inventory exported to CSV.');
  };

  // Helper for machine type icons/symbols
  const getMachineIcon = (type) => {
    switch (type) {
      case 'Tractor': return '🚜';
      case 'Power Tiller': return '🚜';
      case 'Power Weeder': return '⚙';
      case 'Sprayer': return '🚿';
      case 'Harvester': return '🌾';
      case 'Rotavator': return '🔄';
      case 'Cultivator': return '🌱';
      default: return '🚜';
    }
  };

  return (
    <div className="mch-page">
      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div className={`mch-toast ${toast.type === 'error' ? 'error' : ''}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
          <button
            type="button"
            className="mch-toast-close"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="mch-page-head">
        <div>
          <div className="mch-eyebrow">
            WORKSPACE <span>/</span> MASTERS <span>/</span> MACHINERY & EQUIPMENT
          </div>
          <h1 className="mch-title">Machinery & Equipment</h1>
          <p className="mch-subtitle">
            Maintain and manage agricultural machinery records, registration, valuation, and maintenance schedules.
          </p>
        </div>

        <div className="mch-head-actions">
          <button
            className="mch-btn-secondary"
            type="button"
            onClick={handleExportCSV}
            title="Export machinery list to CSV spreadsheet"
          >
            <span>↓</span> Export CSV
          </button>
          <button
            className="mch-btn-primary"
            type="button"
            onClick={handleOpenAdd}
          >
            <span>＋</span> Add Machinery
          </button>
        </div>
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────────────────── */}
      <div className="mch-stats-grid">
        <div className="mch-stat-card">
          <div className="mch-stat-icon active">🚜</div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Total Machinery</span>
            <span className="mch-stat-val">{metrics.total}</span>
            <span className="mch-stat-hint">Registered farm assets</span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon active">✓</div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Active / Operational</span>
            <span className="mch-stat-val">{metrics.active}</span>
            <span className="mch-stat-hint">Available for field work</span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon warning">🔧</div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Under Maintenance</span>
            <span className="mch-stat-val">{metrics.maintenance}</span>
            <span className="mch-stat-hint">Service & repair work</span>
          </div>
        </div>

        <div className="mch-stat-card">
          <div className="mch-stat-icon info">₹</div>
          <div className="mch-stat-info">
            <span className="mch-stat-label">Total Asset Value</span>
            <span className="mch-stat-val">{formatINR(metrics.totalCurrentValue)}</span>
            <span className="mch-stat-hint">
              Cost: {formatINR(metrics.totalPurchaseCost)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Machinery List Table Panel ────────────────────────────────────── */}
      <section className="mch-panel">
        {/* Toolbar: Search & Filters */}
        <div className="mch-toolbar">
          <div className="mch-search-box">
            <span>⌕</span>
            <input
              className="mch-search-input"
              placeholder="Search by Machine Name, Registration No, or Code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="mch-select-filter"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Machine Types</option>
            {MACHINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="mch-select-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {(searchQuery || typeFilter !== 'All' || statusFilter !== 'All') && (
            <button
              className="mch-reset-btn"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('All');
                setStatusFilter('All');
                setPage(1);
              }}
            >
              ↻ Clear Filters
            </button>
          )}
        </div>

        {/* Table View */}
        <div className="mch-table-wrap">
          <table className="mch-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>CODE</th>
                <th>MACHINE NAME</th>
                <th>MACHINE TYPE</th>
                <th>REGISTRATION NO</th>
                <th>PURCHASE DATE</th>
                <th>PURCHASE COST</th>
                <th>CURRENT VALUE</th>
                <th>FUEL / POWER</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center', width: '80px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="mch-empty-state">
                    <div className="mch-empty-icon">⏳</div>
                    <strong>Loading machinery records...</strong>
                    <p>Fetching data from farm management system...</p>
                  </td>
                </tr>
              ) : currentPageItems.length === 0 ? (
                <tr>
                  <td colSpan="10" className="mch-empty-state">
                    <div className="mch-empty-icon">🔍</div>
                    <strong>No machinery records found</strong>
                    <p>
                      {searchQuery || typeFilter !== 'All' || statusFilter !== 'All'
                        ? 'Try clearing or modifying your search and filter criteria.'
                        : 'Get started by registering your farm machinery.'}
                    </p>
                    <button
                      className="mch-btn-primary"
                      type="button"
                      onClick={handleOpenAdd}
                      style={{ marginTop: '8px' }}
                    >
                      + Add Machinery
                    </button>
                  </td>
                </tr>
              ) : (
                currentPageItems.map((m, index) => {
                  const icon = getMachineIcon(m.machineType);
                  const isNearBottom = index >= currentPageItems.length - 2 && currentPageItems.length > 2;

                  return (
                    <tr key={m.id}>
                      {/* S.No / Machine Code */}
                      <td>
                        <span className="mch-code-badge">{m.machineCode || `MCH-${m.id}`}</span>
                      </td>

                      {/* Machine Name */}
                      <td>
                        <div className="mch-name-cell">
                          <div className="mch-avatar">{icon}</div>
                          <div className="mch-name-info">
                            <strong title={m.machineName}>{m.machineName}</strong>
                            {m.modelNumber ? (
                              <span style={{ fontSize: '10px', color: '#64748b' }}>{m.modelNumber}</span>
                            ) : m.manufacturer ? (
                              <span style={{ fontSize: '10px', color: '#64748b' }}>{m.manufacturer}</span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Machine Type */}
                      <td>
                        <span className="mch-type-tag">{m.machineType || 'Tractor'}</span>
                      </td>

                      {/* Registration No */}
                      <td>
                        {m.registrationNo ? (
                          <span className="mch-reg-badge">{m.registrationNo}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unregistered / None</span>
                        )}
                      </td>

                      {/* Purchase Date */}
                      <td>
                        <span>{formatDate(m.purchaseDate)}</span>
                      </td>

                      {/* Purchase Cost */}
                      <td>
                        <span className="mch-amount">{formatINR(m.purchaseCost)}</span>
                      </td>

                      {/* Current Value */}
                      <td>
                        <span className="mch-amount depreciated">{formatINR(m.currentValue)}</span>
                      </td>

                      {/* Fuel Type */}
                      <td>
                        <span className="mch-fuel-tag">
                          <span>⛽</span> {m.fuelType || 'Diesel'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <button
                          className={`mch-status-pill ${
                            m.status === 'Active'
                              ? 'active'
                              : m.status === 'Under Maintenance'
                              ? 'maintenance'
                              : 'inactive'
                          }`}
                          type="button"
                          title="Click to cycle status: Active → Under Maintenance → Inactive"
                          onClick={(e) => handleCycleStatus(m, e)}
                        >
                          <span className="mch-status-dot" />
                          {m.status || 'Active'}
                        </button>
                      </td>

                      {/* Actions: Three-dot menu */}
                      <td>
                        <div className="mch-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className={`mch-action-btn mch-menu-trigger ${openActionMenuId === m.id ? 'active' : ''}`}
                            type="button"
                            title="Actions"
                            aria-label={`Actions for ${m.machineName}`}
                            aria-expanded={openActionMenuId === m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === m.id ? null : m.id);
                            }}
                          >
                            ⋮
                          </button>

                          {openActionMenuId === m.id && (
                            <div
                              className={`mch-action-dropdown ${isNearBottom ? 'drop-up' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="mch-action-menu-item"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setViewingMachine(m);
                                }}
                              >
                                <span className="mch-menu-item-icon">👁</span> View Details
                              </button>
                              <button
                                type="button"
                                className="mch-action-menu-item"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleOpenEdit(m);
                                }}
                              >
                                <span className="mch-menu-item-icon">✎</span> Edit
                              </button>
                              <button
                                type="button"
                                className="mch-action-menu-item delete"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setDeleteConfirm(m);
                                }}
                              >
                                <span className="mch-menu-item-icon">⛌</span> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="mch-table-footer">
          <div>
            Showing {filteredMachinery.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredMachinery.length)} of {filteredMachinery.length} records
          </div>

          {totalPages > 1 && (
            <div className="mch-pagination">
              <button
                className="mch-pg-btn"
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`mch-pg-btn ${page === p ? 'active' : ''}`}
                  type="button"
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="mch-pg-btn"
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── MODAL 1: ADD / EDIT MACHINERY ─────────────────────────────────── */}
      {isFormOpen && (
        <div className="mch-modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div
            className="mch-modal wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="machinery-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="machinery-form-title">
                  {editingMachine ? 'Edit Machinery Record' : 'Add New Machinery & Equipment'}
                </h3>
                <p>
                  {editingMachine
                    ? `Update specifications and valuation for ${editingMachine.machineName}`
                    : 'Register farm machinery, implement, or equipment into the AgriMaan system.'}
                </p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="mch-modal-body">
                {/* Section A: Primary Identification */}
                <div>
                  <h4 className="mch-section-title">1. Machine Identification</h4>
                  <div className="mch-form-grid">
                    <div className="mch-field">
                      <label className="mch-label">
                        Machine Code <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Auto-generated)</span>
                      </label>
                      <input
                        className="mch-input"
                        value={formData.machineCode}
                        onChange={(e) => setFormData({ ...formData, machineCode: e.target.value })}
                        placeholder="e.g. MCH-008"
                      />
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Machine Name <em>*</em>
                      </label>
                      <input
                        className={`mch-input ${formErrors.machineName ? 'error' : ''}`}
                        value={formData.machineName}
                        onChange={(e) => {
                          setFormData({ ...formData, machineName: e.target.value });
                          if (formErrors.machineName) {
                            setFormErrors({ ...formErrors, machineName: null });
                          }
                        }}
                        placeholder="e.g. Mahindra 575 DI Tractor"
                      />
                      {formErrors.machineName && (
                        <span className="mch-field-error">{formErrors.machineName}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Machine Type <em>*</em>
                      </label>
                      <select
                        className={`mch-select ${formErrors.machineType ? 'error' : ''}`}
                        value={formData.machineType}
                        onChange={(e) => {
                          setFormData({ ...formData, machineType: e.target.value });
                          if (formErrors.machineType) {
                            setFormErrors({ ...formErrors, machineType: null });
                          }
                        }}
                      >
                        {MACHINE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {formErrors.machineType && (
                        <span className="mch-field-error">{formErrors.machineType}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Registration No
                      </label>
                      <input
                        className="mch-input"
                        value={formData.registrationNo}
                        onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })}
                        placeholder="e.g. AP 16 CZ 4521"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Financial & Purchase Details */}
                <div>
                  <h4 className="mch-section-title">2. Purchase & Valuation</h4>
                  <div className="mch-form-grid three-col">
                    <div className="mch-field">
                      <label className="mch-label">
                        Purchase Date <em>*</em>
                      </label>
                      <input
                        type="date"
                        className={`mch-input ${formErrors.purchaseDate ? 'error' : ''}`}
                        value={formData.purchaseDate}
                        onChange={(e) => {
                          setFormData({ ...formData, purchaseDate: e.target.value });
                          if (formErrors.purchaseDate) {
                            setFormErrors({ ...formErrors, purchaseDate: null });
                          }
                        }}
                      />
                      {formErrors.purchaseDate && (
                        <span className="mch-field-error">{formErrors.purchaseDate}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Purchase Cost (₹) <em>*</em>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`mch-input ${formErrors.purchaseCost ? 'error' : ''}`}
                        value={formData.purchaseCost}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            purchaseCost: val,
                            // Auto-set currentValue if not yet customized
                            currentValue: formData.currentValue === '' || formData.currentValue === formData.purchaseCost ? val : formData.currentValue
                          });
                          if (formErrors.purchaseCost) {
                            setFormErrors({ ...formErrors, purchaseCost: null });
                          }
                        }}
                        placeholder="e.g. 750000"
                      />
                      {formErrors.purchaseCost && (
                        <span className="mch-field-error">{formErrors.purchaseCost}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Current Value (₹) <em>*</em>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={`mch-input ${formErrors.currentValue ? 'error' : ''}`}
                        value={formData.currentValue}
                        onChange={(e) => {
                          setFormData({ ...formData, currentValue: e.target.value });
                          if (formErrors.currentValue) {
                            setFormErrors({ ...formErrors, currentValue: null });
                          }
                        }}
                        placeholder="e.g. 610000"
                      />
                      {formErrors.currentValue && (
                        <span className="mch-field-error">{formErrors.currentValue}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section C: Operations, Fuel & Status */}
                <div>
                  <h4 className="mch-section-title">3. Specifications & Status</h4>
                  <div className="mch-form-grid">
                    <div className="mch-field">
                      <label className="mch-label">
                        Fuel / Power Type <em>*</em>
                      </label>
                      <select
                        className={`mch-select ${formErrors.fuelType ? 'error' : ''}`}
                        value={formData.fuelType}
                        onChange={(e) => {
                          setFormData({ ...formData, fuelType: e.target.value });
                          if (formErrors.fuelType) {
                            setFormErrors({ ...formErrors, fuelType: null });
                          }
                        }}
                      >
                        {FUEL_TYPES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      {formErrors.fuelType && (
                        <span className="mch-field-error">{formErrors.fuelType}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">
                        Status <em>*</em>
                      </label>
                      <select
                        className={`mch-select ${formErrors.status ? 'error' : ''}`}
                        value={formData.status}
                        onChange={(e) => {
                          setFormData({ ...formData, status: e.target.value });
                          if (formErrors.status) {
                            setFormErrors({ ...formErrors, status: null });
                          }
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {formErrors.status && (
                        <span className="mch-field-error">{formErrors.status}</span>
                      )}
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">Manufacturer / Brand</label>
                      <input
                        className="mch-input"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="e.g. Mahindra, VST, John Deere"
                      />
                    </div>

                    <div className="mch-field">
                      <label className="mch-label">Model Number / Horsepower</label>
                      <input
                        className="mch-input"
                        value={formData.modelNumber}
                        onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                        placeholder="e.g. 575 DI (45 HP)"
                      />
                    </div>

                    <div className="mch-field full">
                      <label className="mch-label">Notes & Maintenance Details</label>
                      <textarea
                        className="mch-textarea"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Usage notes, attachments supported, warranty or scheduled maintenance tasks..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mch-modal-footer">
                <button
                  type="button"
                  className="mch-btn-secondary"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mch-btn-primary"
                >
                  {editingMachine ? 'Save Changes' : 'Register Machinery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: VIEW MACHINERY DETAILS ───────────────────────────────── */}
      {viewingMachine && (
        <div className="mch-modal-backdrop" onClick={() => setViewingMachine(null)}>
          <div
            className="mch-modal wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-machine-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="view-machine-title">Machinery Profile</h3>
                <p>Complete asset profile and technical specifications</p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setViewingMachine(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <div className="mch-modal-body">
              {/* Header profile card */}
              <div className="mch-view-header-card">
                <div className="mch-view-avatar">
                  {getMachineIcon(viewingMachine.machineType)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#1e3325' }}>
                    {viewingMachine.machineName}
                  </h2>
                  <div className="mch-view-tags">
                    <span className="mch-code-badge">{viewingMachine.machineCode}</span>
                    <span className="mch-type-tag">{viewingMachine.machineType}</span>
                    <span
                      className={`mch-status-pill ${
                        viewingMachine.status === 'Active'
                          ? 'active'
                          : viewingMachine.status === 'Under Maintenance'
                          ? 'maintenance'
                          : 'inactive'
                      }`}
                    >
                      <span className="mch-status-dot" />
                      {viewingMachine.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Valuation metrics */}
              <div className="mch-view-metrics-grid">
                <div className="mch-view-metric-box">
                  <small>Purchase Cost</small>
                  <strong>{formatINR(viewingMachine.purchaseCost)}</strong>
                </div>
                <div className="mch-view-metric-box">
                  <small>Current Book Value</small>
                  <strong style={{ color: '#0369a1' }}>{formatINR(viewingMachine.currentValue)}</strong>
                </div>
                <div className="mch-view-metric-box">
                  <small>Estimated Depreciation</small>
                  <strong style={{ color: Number(viewingMachine.purchaseCost) - Number(viewingMachine.currentValue) > 0 ? '#b45309' : '#15803d' }}>
                    {formatINR(Math.max(0, Number(viewingMachine.purchaseCost) - Number(viewingMachine.currentValue)))}
                  </strong>
                </div>
              </div>

              {/* Technical & Operational Specs */}
              <div className="mch-detail-grid">
                <div className="mch-detail-card">
                  <h4>
                    <span>⚙</span> Machine Specifications
                  </h4>
                  <div className="mch-detail-list">
                    <div className="mch-detail-row">
                      <span>Machine Type:</span>
                      <strong>{viewingMachine.machineType}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Registration No:</span>
                      <strong>
                        {viewingMachine.registrationNo ? (
                          <span className="mch-reg-badge">{viewingMachine.registrationNo}</span>
                        ) : (
                          'None'
                        )}
                      </strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Fuel / Power:</span>
                      <strong>{viewingMachine.fuelType}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Manufacturer:</span>
                      <strong>{viewingMachine.manufacturer || '—'}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Model / HP:</span>
                      <strong>{viewingMachine.modelNumber || '—'}</strong>
                    </div>
                  </div>
                </div>

                <div className="mch-detail-card">
                  <h4>
                    <span>📅</span> Purchase & Operations
                  </h4>
                  <div className="mch-detail-list">
                    <div className="mch-detail-row">
                      <span>Purchase Date:</span>
                      <strong>{formatDate(viewingMachine.purchaseDate)}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Operational Status:</span>
                      <strong>{viewingMachine.status}</strong>
                    </div>
                    <div className="mch-detail-row">
                      <span>Asset Code:</span>
                      <strong>{viewingMachine.machineCode}</strong>
                    </div>
                  </div>

                  {viewingMachine.notes && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        Notes / Maintenance Log
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                        {viewingMachine.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mch-modal-footer">
              <button
                type="button"
                className="mch-btn-secondary"
                onClick={() => {
                  const m = viewingMachine;
                  setViewingMachine(null);
                  handleOpenEdit(m);
                }}
              >
                ✎ Edit Machine
              </button>
              <button
                type="button"
                className="mch-btn-primary"
                onClick={() => setViewingMachine(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteConfirm && (
        <div className="mch-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div
            className="mch-modal compact"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mch-modal-header">
              <div>
                <h3 id="delete-dialog-title" style={{ color: '#b91c1c' }}>
                  Confirm Deletion
                </h3>
                <p>Are you sure you want to remove this machinery record?</p>
              </div>
              <button
                type="button"
                className="mch-modal-close"
                onClick={() => setDeleteConfirm(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <div className="mch-modal-body">
              <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                You are about to delete <strong>{deleteConfirm.machineName}</strong> (
                <span className="mch-code-badge">{deleteConfirm.machineCode}</span>
                {deleteConfirm.registrationNo ? ` • ${deleteConfirm.registrationNo}` : ''}).
              </p>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '11px',
                  color: '#991b1b'
                }}
              >
                ⚠️ <strong>Warning:</strong> This will remove the machinery from your farm asset inventory and metrics. This action cannot be undone.
              </div>
            </div>

            <div className="mch-modal-footer">
              <button
                type="button"
                className="mch-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mch-btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Machinery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
