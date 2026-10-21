import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cropService } from '../../services/cropService';
import './crops.css';

export default function Crops({ initialTab = 'crops', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [cropsList, setCropsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [varietiesList, setVarietiesList] = useState([]);
  const [seasonsList, setSeasonsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Forms
  const [modalType, setModalType] = useState(null); // 'crop' | 'season' | 'variety' | 'category' | null
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }

  // Form states
  const [cropForm, setCropForm] = useState({
    cropCode: '', cropName: '', cropType: 'Kharif / Food Grain',
    cropCategory: 'Cereals', defaultUnit: 'Quintals', status: 'Active', description: ''
  });
  const [seasonForm, setSeasonForm] = useState({
    seasonCode: '', farm: 'Farm 1 (South Block)', crop: 'Paddy',
    variety: 'BPT 5204 (Samba Mahsuri)', season: 'Kharif 2025-26',
    sowingDate: '', expectedHarvestDate: '', actualHarvestDate: '',
    area: '5 Acres', expectedYield: '', expectedRevenue: '', status: 'In Progress'
  });
  const [varietyForm, setVarietyForm] = useState({
    code: '', cropName: 'Paddy', varietyName: '', durationDays: 120,
    season: 'Kharif', expectedYield: '', status: 'Active'
  });
  const [categoryForm, setCategoryForm] = useState({
    code: '', name: '', description: '', status: 'Active'
  });

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load all crop data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [crops, categories, varieties, seasons] = await Promise.all([
        cropService.getCrops(),
        cropService.getCategories(),
        cropService.getVarieties(),
        cropService.getSeasons()
      ]);
      setCropsList(crops || []);
      setCategoriesList(categories || []);
      setVarietiesList(varieties || []);
      setSeasonsList(seasons || []);
    } catch (err) {
      console.error('[Crops] Failed to load data:', err);
      showToast('Error loading crop records.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall Statistics
  const totalCropsCount = cropsList.length;
  const activeSeasonsCount = seasonsList.filter(s => s.status === 'In Progress' || s.status === 'Active').length;
  const totalAreaAcres = seasonsList.reduce((acc, curr) => {
    const num = parseFloat(curr.area) || 0;
    return acc + num;
  }, 0);
  const totalRevenueNumber = seasonsList.reduce((acc, curr) => {
    const clean = String(curr.expectedRevenue || '').replace(/[^\d]/g, '');
    return acc + (Number(clean) || 0);
  }, 0);

  // Filtering for Crop Master
  const filteredCrops = useMemo(() => {
    return cropsList.filter(c => {
      const matchSearch = (
        c.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cropCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cropCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cropType.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [cropsList, searchQuery, statusFilter]);

  // Filtering for Crop Seasons
  const filteredSeasons = useMemo(() => {
    return seasonsList.filter(s => {
      const matchSearch = (
        s.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.farm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.variety && s.variety.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.season.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.seasonCode && s.seasonCode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const matchStatus = statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [seasonsList, searchQuery, statusFilter]);

  // Filtering for Crop Varieties
  const filteredVarieties = useMemo(() => {
    return varietiesList.filter(v => {
      const matchSearch = (
        v.varietyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || v.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [varietiesList, searchQuery, statusFilter]);

  // Filtering for Crop Categories
  const filteredCategories = useMemo(() => {
    return categoriesList.filter(cat => {
      const matchSearch = (
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || cat.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [categoriesList, searchQuery, statusFilter]);

  // Handlers for Add / Edit
  const handleOpenAdd = () => {
    setEditingItem(null);
    if (activeTab === 'crops') {
      const nextNum = cropsList.length + 1;
      setCropForm({
        cropCode: `CRP-${String(nextNum).padStart(3, '0')}`,
        cropName: '',
        cropType: 'Kharif / Food Grain',
        cropCategory: categoriesList[0]?.name || 'Cereals',
        defaultUnit: 'Quintals',
        status: 'Active',
        description: ''
      });
      setModalType('crop');
    } else if (activeTab === 'seasons') {
      const nextNum = seasonsList.length + 1;
      setSeasonForm({
        seasonCode: `CS-${new Date().getFullYear()}-${String(nextNum).padStart(2, '0')}`,
        farm: 'Farm 1 (South Block)',
        crop: cropsList[0]?.cropName || 'Paddy',
        variety: varietiesList[0]?.varietyName || 'Standard Hybrid',
        season: 'Kharif 2025-26',
        sowingDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: '',
        actualHarvestDate: '',
        area: '5 Acres',
        expectedYield: '50 Quintals',
        expectedRevenue: '₹ 1,50,000',
        status: 'In Progress'
      });
      setModalType('season');
    } else if (activeTab === 'varieties') {
      const nextNum = varietiesList.length + 1;
      setVarietyForm({
        code: `VAR-${String(nextNum).padStart(3, '0')}`,
        cropName: cropsList[0]?.cropName || 'Paddy',
        varietyName: '',
        durationDays: 120,
        season: 'Kharif',
        expectedYield: '25-30 Qtl/Acre',
        status: 'Active'
      });
      setModalType('variety');
    } else if (activeTab === 'categories') {
      const nextNum = categoriesList.length + 1;
      setCategoryForm({
        code: `CAT-${String(nextNum).padStart(2, '0')}`,
        name: '',
        description: '',
        status: 'Active'
      });
      setModalType('category');
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'crops') {
      setCropForm({ ...item });
      setModalType('crop');
    } else if (activeTab === 'seasons') {
      setSeasonForm({ ...item });
      setModalType('season');
    } else if (activeTab === 'varieties') {
      setVarietyForm({ ...item });
      setModalType('variety');
    } else if (activeTab === 'categories') {
      setCategoryForm({ ...item });
      setModalType('category');
    }
  };

  // Submit Save
  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'crop') {
        if (!cropForm.cropName.trim()) {
          showToast('Crop name is required', 'error');
          return;
        }
        if (editingItem) {
          await cropService.updateCrop(editingItem.id, cropForm);
          showToast(`Crop "${cropForm.cropName}" updated successfully.`);
        } else {
          await cropService.createCrop(cropForm);
          showToast(`Crop "${cropForm.cropName}" created successfully.`);
        }
      } else if (modalType === 'season') {
        if (!seasonForm.crop || !seasonForm.farm) {
          showToast('Farm and Crop selection are required', 'error');
          return;
        }
        if (editingItem) {
          await cropService.updateSeason(editingItem.id, seasonForm);
          showToast(`Crop Season "${seasonForm.seasonCode}" updated.`);
        } else {
          await cropService.createSeason(seasonForm);
          showToast(`Crop Season created for "${seasonForm.crop}".`);
        }
      } else if (modalType === 'variety') {
        if (!varietyForm.varietyName.trim()) {
          showToast('Variety name is required', 'error');
          return;
        }
        if (editingItem) {
          await cropService.updateVariety(editingItem.id, varietyForm);
          showToast(`Variety "${varietyForm.varietyName}" updated.`);
        } else {
          await cropService.createVariety(varietyForm);
          showToast(`Variety "${varietyForm.varietyName}" added.`);
        }
      } else if (modalType === 'category') {
        if (!categoryForm.name.trim()) {
          showToast('Category name is required', 'error');
          return;
        }
        if (editingItem) {
          await cropService.updateCategory(editingItem.id, categoryForm);
          showToast(`Category "${categoryForm.name}" updated.`);
        } else {
          await cropService.createCategory(categoryForm);
          showToast(`Category "${categoryForm.name}" created.`);
        }
      }
      setModalType(null);
      setEditingItem(null);
      loadData();
    } catch (err) {
      console.error('[Crops] Error saving item:', err);
      showToast('Failed to save record.', 'error');
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (item, type) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      if (type === 'crop') {
        await cropService.updateCrop(item.id, { ...item, status: nextStatus });
        showToast(`${item.cropName} is now ${nextStatus}.`);
      } else if (type === 'season') {
        const nextSeasonStatus = item.status === 'In Progress' ? 'Harvested' : 'In Progress';
        await cropService.updateSeason(item.id, { ...item, status: nextSeasonStatus });
        showToast(`Season ${item.seasonCode} status changed to ${nextSeasonStatus}.`);
      } else if (type === 'variety') {
        await cropService.updateVariety(item.id, { ...item, status: nextStatus });
        showToast(`Variety ${item.varietyName} is now ${nextStatus}.`);
      } else if (type === 'category') {
        await cropService.updateCategory(item.id, { ...item, status: nextStatus });
        showToast(`Category ${item.name} is now ${nextStatus}.`);
      }
      loadData();
    } catch (err) {
      console.error('[Crops] Toggle status error:', err);
      showToast('Failed to toggle status', 'error');
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    try {
      if (type === 'crop') {
        await cropService.deleteCrop(item.id);
        showToast(`Crop "${item.cropName}" deleted.`);
      } else if (type === 'season') {
        await cropService.deleteSeason(item.id);
        showToast(`Season "${item.seasonCode}" removed.`);
      } else if (type === 'variety') {
        await cropService.deleteVariety(item.id);
        showToast(`Variety "${item.varietyName}" deleted.`);
      } else if (type === 'category') {
        await cropService.deleteCategory(item.id);
        showToast(`Category "${item.name}" deleted.`);
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('[Crops] Error deleting record:', err);
      showToast('Failed to delete record.', 'error');
    }
  };

  return (
    <div className="cr-page">
      {/* 1. Header */}
      <div className="cr-page-head">
        <div>
          <div className="cr-eyebrow">AGRICULTURE &amp; MASTERS • CROP MANAGEMENT</div>
          <h1 className="cr-title">Crop Management</h1>
          <p className="cr-subtitle">
            Configure crop masters, standing seasonal cycles, hybrid varieties, and classification categories
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="cr-btn-primary"
            onClick={handleOpenAdd}
          >
            <span>+</span> Add {activeTab === 'crops' ? 'Crop' : activeTab === 'seasons' ? 'Season Record' : activeTab === 'varieties' ? 'Variety' : 'Category'}
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="cr-stats-grid">
        <div className="cr-stat-card">
          <div className="cr-stat-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
            🌱
          </div>
          <div className="cr-stat-info">
            <span className="cr-stat-label">Crop Master</span>
            <span className="cr-stat-value">{totalCropsCount} Crops</span>
          </div>
        </div>

        <div className="cr-stat-card">
          <div className="cr-stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            ▦
          </div>
          <div className="cr-stat-info">
            <span className="cr-stat-label">Active Seasons</span>
            <span className="cr-stat-value">{activeSeasonsCount} Standing</span>
          </div>
        </div>

        <div className="cr-stat-card">
          <div className="cr-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            ▤
          </div>
          <div className="cr-stat-info">
            <span className="cr-stat-label">Total Sown Area</span>
            <span className="cr-stat-value">{totalAreaAcres} Acres</span>
          </div>
        </div>

        <div className="cr-stat-card">
          <div className="cr-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            ₹
          </div>
          <div className="cr-stat-info">
            <span className="cr-stat-label">Expected Revenue</span>
            <span className="cr-stat-value">₹ {totalRevenueNumber.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 3. Sub Tabs Navigation */}
      <div className="cr-tabs-bar">
        <button
          type="button"
          className={`cr-tab-btn ${activeTab === 'crops' ? 'active' : ''}`}
          onClick={() => { setActiveTab('crops'); setSearchQuery(''); }}
        >
          <span>🌱 Crop Master (crops)</span>
          <span className="cr-tab-badge">{cropsList.length}</span>
        </button>

        <button
          type="button"
          className={`cr-tab-btn ${activeTab === 'seasons' ? 'active' : ''}`}
          onClick={() => { setActiveTab('seasons'); setSearchQuery(''); }}
        >
          <span>📅 Crop Season (crop_seasons)</span>
          <span className="cr-tab-badge">{seasonsList.length}</span>
        </button>

        <button
          type="button"
          className={`cr-tab-btn ${activeTab === 'varieties' ? 'active' : ''}`}
          onClick={() => { setActiveTab('varieties'); setSearchQuery(''); }}
        >
          <span>🌾 Crop Varieties (crop_varieties)</span>
          <span className="cr-tab-badge">{varietiesList.length}</span>
        </button>

        <button
          type="button"
          className={`cr-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
        >
          <span>🏷️ Categories (crop_categories)</span>
          <span className="cr-tab-badge">{categoriesList.length}</span>
        </button>
      </div>

      {/* 4. Toolbar: Search & Filter Pills */}
      <div className="cr-toolbar">
        <div className="cr-search-wrap">
          <span className="cr-search-icon">🔍</span>
          <input
            type="text"
            className="cr-search"
            placeholder={`Search ${activeTab === 'crops' ? 'crops (Paddy, Cotton...)' : activeTab === 'seasons' ? 'seasons, farms, dates...' : activeTab === 'varieties' ? 'varieties, hybrids...' : 'categories...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cr-clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="cr-filter-group">
          {['All', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              type="button"
              className={`cr-filter-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Main Content Tables */}
      {/* ─── TAB 1: CROP MASTER ────────────────────────────────────────── */}
      {activeTab === 'crops' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Crop ID</th>
                <th>Crop Name</th>
                <th>Crop Type</th>
                <th>Crop Category</th>
                <th>Default Unit</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Loading crops...</td></tr>
              ) : filteredCrops.length === 0 ? (
                <tr>
                  <td colSpan="7" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🌱</span>
                      <p>No crops found matching filters</p>
                      <span>Try clearing your search or add a new crop master</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCrops.map((c) => (
                  <tr key={c.id}>
                    <td><span className="cr-code-badge">{c.cropCode}</span></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-icon">🌾</span>
                        <div>
                          <span className="cr-item-title">{c.cropName}</span>
                          <span className="cr-item-sub">{c.description || 'Standard cultivar'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="cr-tag-pill">{c.cropType}</span></td>
                    <td><strong>{c.cropCategory}</strong></td>
                    <td>{c.defaultUnit}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${c.status === 'Active' ? 'cr-status-active' : 'cr-status-inactive'}`}
                        onClick={() => handleToggleStatus(c, 'crop')}
                        title="Click to toggle status"
                      >
                        {c.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Crop"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'crop', item: c })}
                          title="Delete Crop"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 2: CROP SEASON ────────────────────────────────────────── */}
      {activeTab === 'seasons' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Season ID</th>
                <th>Farm Parcel</th>
                <th>Crop &amp; Variety</th>
                <th>Season</th>
                <th>Sowing Date</th>
                <th>Exp. Harvest</th>
                <th>Actual Harvest</th>
                <th>Area</th>
                <th>Expected Yield</th>
                <th>Expected Revenue</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px' }}>Loading seasons...</td></tr>
              ) : filteredSeasons.length === 0 ? (
                <tr>
                  <td colSpan="12" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">📅</span>
                      <p>No crop season records found</p>
                      <span>Plan a crop season across active farm land parcels</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSeasons.map((s) => (
                  <tr key={s.id}>
                    <td><span className="cr-code-badge">{s.seasonCode}</span></td>
                    <td><strong>{s.farm}</strong></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-icon">🌱</span>
                        <div>
                          <span className="cr-item-title">{s.crop}</span>
                          <span className="cr-item-sub">{s.variety || 'Standard'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="cr-tag-pill">{s.season}</span></td>
                    <td>{s.sowingDate || '-'}</td>
                    <td>{s.expectedHarvestDate || '-'}</td>
                    <td>{s.actualHarvestDate || <span style={{ color: '#94a3b8' }}>Pending</span>}</td>
                    <td><strong>{s.area}</strong></td>
                    <td>{s.expectedYield || '-'}</td>
                    <td style={{ fontWeight: 700, color: '#15803d' }}>{s.expectedRevenue || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${
                          s.status === 'Harvested' ? 'cr-status-harvested' :
                          s.status === 'Planned' ? 'cr-status-planned' : 'cr-status-progress'
                        }`}
                        onClick={() => handleToggleStatus(s, 'season')}
                        title="Click to advance status"
                      >
                        {s.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Season Cycle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'season', item: s })}
                          title="Delete Season"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3: CROP VARIETIES ─────────────────────────────────────── */}
      {activeTab === 'varieties' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Variety ID</th>
                <th>Crop Name</th>
                <th>Variety / Hybrid Name</th>
                <th>Duration (Days)</th>
                <th>Season</th>
                <th>Expected Yield</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading varieties...</td></tr>
              ) : filteredVarieties.length === 0 ? (
                <tr>
                  <td colSpan="8" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🌾</span>
                      <p>No crop varieties found</p>
                      <span>Add seed varieties, hybrids, and duration specifications</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVarieties.map((v) => (
                  <tr key={v.id}>
                    <td><span className="cr-code-badge">{v.code}</span></td>
                    <td><strong>{v.cropName}</strong></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-icon">🧬</span>
                        <span className="cr-item-title">{v.varietyName}</span>
                      </div>
                    </td>
                    <td>{v.durationDays} days</td>
                    <td><span className="cr-tag-pill">{v.season}</span></td>
                    <td>{v.expectedYield}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${v.status === 'Active' ? 'cr-status-active' : 'cr-status-inactive'}`}
                        onClick={() => handleToggleStatus(v, 'variety')}
                        title="Click to toggle status"
                      >
                        {v.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(v)}
                          title="Edit Variety"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'variety', item: v })}
                          title="Delete Variety"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 4: CROP CATEGORIES ────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="cr-table-wrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Category ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cr-empty">
                    <div className="cr-empty-state">
                      <span className="cr-empty-icon">🏷️</span>
                      <p>No categories found</p>
                      <span>Create crop classification categories</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td><span className="cr-code-badge">{cat.code}</span></td>
                    <td>
                      <div className="cr-item-cell">
                        <span className="cr-item-icon">📂</span>
                        <span className="cr-item-title">{cat.name}</span>
                      </div>
                    </td>
                    <td>{cat.description || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className={`cr-status-pill ${cat.status === 'Active' ? 'cr-status-active' : 'cr-status-inactive'}`}
                        onClick={() => handleToggleStatus(cat, 'category')}
                        title="Click to toggle status"
                      >
                        {cat.status}
                      </button>
                    </td>
                    <td>
                      <div className="cr-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="cr-action-btn edit"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="cr-action-btn delete"
                          onClick={() => setDeleteTarget({ type: 'category', item: cat })}
                          title="Delete Category"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL: CROP MASTER FORM ───────────────────────────────────── */}
      {modalType === 'crop' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Record' : 'Add New Crop (Crop Master)'}</h2>
                <p>Register crop species, biological type, category, and standard yield units</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop ID / Code</label>
                    <input
                      type="text"
                      value={cropForm.cropCode}
                      onChange={(e) => setCropForm({ ...cropForm, cropCode: e.target.value })}
                      placeholder="e.g. CRP-001"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Crop Name <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={cropForm.cropName}
                      onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                      placeholder="e.g. Paddy, Cotton, Chilli..."
                      required
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop Type</label>
                    <select
                      value={cropForm.cropType}
                      onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })}
                    >
                      <option value="Kharif / Food Grain">Kharif / Food Grain</option>
                      <option value="Kharif / Cash Crop">Kharif / Cash Crop</option>
                      <option value="Kharif-Rabi / Spices">Kharif-Rabi / Spices</option>
                      <option value="Kharif-Rabi / Oilseeds">Kharif-Rabi / Oilseeds</option>
                      <option value="Rabi / Horticulture">Rabi / Horticulture</option>
                      <option value="Perennial / Commercial">Perennial / Commercial</option>
                      <option value="Zaid / Summer">Zaid / Summer</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Crop Category</label>
                    <select
                      value={cropForm.cropCategory}
                      onChange={(e) => setCropForm({ ...cropForm, cropCategory: e.target.value })}
                    >
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Cereals">Cereals</option>
                      <option value="Fibre Crops">Fibre Crops</option>
                      <option value="Spices">Spices</option>
                      <option value="Oilseeds">Oilseeds</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Default Unit</label>
                    <select
                      value={cropForm.defaultUnit}
                      onChange={(e) => setCropForm({ ...cropForm, defaultUnit: e.target.value })}
                    >
                      <option value="Quintals">Quintals</option>
                      <option value="Bags">Bags</option>
                      <option value="Kg">Kg</option>
                      <option value="Tonnes">Tonnes</option>
                      <option value="Boxes">Boxes</option>
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={cropForm.status}
                      onChange={(e) => setCropForm({ ...cropForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="cr-field cr-field-full">
                  <label>Description &amp; Agricultural Notes</label>
                  <textarea
                    rows="2"
                    value={cropForm.description || ''}
                    onChange={(e) => setCropForm({ ...cropForm, description: e.target.value })}
                    placeholder="Soil specifications, climate requirements..."
                  />
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="cr-btn-primary">Save Crop Master</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CROP SEASON FORM ───────────────────────────────────── */}
      {modalType === 'season' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Season' : 'Add New Crop Season (crop_seasons)'}</h2>
                <p>Record farm parcel, standing crop cycle, sowing &amp; harvest timeline, yield, and revenue</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Season Record ID</label>
                    <input
                      type="text"
                      value={seasonForm.seasonCode}
                      onChange={(e) => setSeasonForm({ ...seasonForm, seasonCode: e.target.value })}
                      placeholder="e.g. CS-2025-01"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Farm Parcel <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.farm}
                      onChange={(e) => setSeasonForm({ ...seasonForm, farm: e.target.value })}
                      placeholder="e.g. Farm 1 (South Block)"
                      required
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Crop <span className="cr-req">*</span></label>
                    <select
                      value={seasonForm.crop}
                      onChange={(e) => setSeasonForm({ ...seasonForm, crop: e.target.value })}
                      required
                    >
                      {cropsList.map(c => (
                        <option key={c.id} value={c.cropName}>{c.cropName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cr-field">
                    <label>Variety / Hybrid</label>
                    <input
                      type="text"
                      value={seasonForm.variety || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, variety: e.target.value })}
                      placeholder="e.g. BT Cotton-2, BPT 5204"
                    />
                  </div>
                </div>

                <div className="cr-row-3">
                  <div className="cr-field">
                    <label>Season</label>
                    <input
                      type="text"
                      value={seasonForm.season}
                      onChange={(e) => setSeasonForm({ ...seasonForm, season: e.target.value })}
                      placeholder="e.g. Kharif 2025-26"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Area <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={seasonForm.area}
                      onChange={(e) => setSeasonForm({ ...seasonForm, area: e.target.value })}
                      placeholder="e.g. 10 Acres"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={seasonForm.status}
                      onChange={(e) => setSeasonForm({ ...seasonForm, status: e.target.value })}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Harvest Ready">Harvest Ready</option>
                      <option value="Harvested">Harvested</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="cr-row-3">
                  <div className="cr-field">
                    <label>Sowing Date</label>
                    <input
                      type="date"
                      value={seasonForm.sowingDate}
                      onChange={(e) => setSeasonForm({ ...seasonForm, sowingDate: e.target.value })}
                    />
                  </div>
                  <div className="cr-field">
                    <label>Exp. Harvest Date</label>
                    <input
                      type="date"
                      value={seasonForm.expectedHarvestDate}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedHarvestDate: e.target.value })}
                    />
                  </div>
                  <div className="cr-field">
                    <label>Actual Harvest Date</label>
                    <input
                      type="date"
                      value={seasonForm.actualHarvestDate || ''}
                      onChange={(e) => setSeasonForm({ ...seasonForm, actualHarvestDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cr-row">
                  <div className="cr-field">
                    <label>Expected Yield</label>
                    <input
                      type="text"
                      value={seasonForm.expectedYield}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedYield: e.target.value })}
                      placeholder="e.g. 140 Quintals"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Expected Revenue (INR)</label>
                    <input
                      type="text"
                      value={seasonForm.expectedRevenue}
                      onChange={(e) => setSeasonForm({ ...seasonForm, expectedRevenue: e.target.value })}
                      placeholder="e.g. ₹ 3,80,000"
                    />
                  </div>
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="cr-btn-primary">Save Season Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VARIETY FORM ───────────────────────────────────────── */}
      {modalType === 'variety' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Crop Variety' : 'Add New Variety (crop_varieties)'}</h2>
                <p>Register cultivar hybrids, seed duration, and expected yield traits</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Variety Code</label>
                    <input
                      type="text"
                      value={varietyForm.code}
                      onChange={(e) => setVarietyForm({ ...varietyForm, code: e.target.value })}
                      placeholder="e.g. VAR-001"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Parent Crop <span className="cr-req">*</span></label>
                    <select
                      value={varietyForm.cropName}
                      onChange={(e) => setVarietyForm({ ...varietyForm, cropName: e.target.value })}
                      required
                    >
                      {cropsList.map(c => (
                        <option key={c.id} value={c.cropName}>{c.cropName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cr-field">
                  <label>Variety / Hybrid Name <span className="cr-req">*</span></label>
                  <input
                    type="text"
                    value={varietyForm.varietyName}
                    onChange={(e) => setVarietyForm({ ...varietyForm, varietyName: e.target.value })}
                    placeholder="e.g. BPT 5204 (Samba Mahsuri)"
                    required
                  />
                </div>

                <div className="cr-row-3">
                  <div className="cr-field">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      value={varietyForm.durationDays}
                      onChange={(e) => setVarietyForm({ ...varietyForm, durationDays: Number(e.target.value) })}
                      placeholder="120"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Recommended Season</label>
                    <input
                      type="text"
                      value={varietyForm.season}
                      onChange={(e) => setVarietyForm({ ...varietyForm, season: e.target.value })}
                      placeholder="Kharif"
                    />
                  </div>
                  <div className="cr-field">
                    <label>Status</label>
                    <select
                      value={varietyForm.status}
                      onChange={(e) => setVarietyForm({ ...varietyForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="cr-field">
                  <label>Expected Yield Benchmark</label>
                  <input
                    type="text"
                    value={varietyForm.expectedYield}
                    onChange={(e) => setVarietyForm({ ...varietyForm, expectedYield: e.target.value })}
                    placeholder="e.g. 25-30 Quintals/Acre"
                  />
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="cr-btn-primary">Save Variety</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CATEGORY FORM ──────────────────────────────────────── */}
      {modalType === 'category' && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-modal">
            <div className="cr-modal-head">
              <div>
                <h2>{editingItem ? 'Edit Category' : 'Add Crop Category (crop_categories)'}</h2>
                <p>Define classification groups for sorting and reporting crops</p>
              </div>
              <button type="button" className="cr-close" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="cr-form" onSubmit={handleSaveForm}>
              <div className="cr-form-body">
                <div className="cr-row">
                  <div className="cr-field">
                    <label>Category Code</label>
                    <input
                      type="text"
                      value={categoryForm.code}
                      onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                      placeholder="e.g. CAT-01"
                      required
                    />
                  </div>
                  <div className="cr-field">
                    <label>Category Name <span className="cr-req">*</span></label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. Cereals, Oilseeds..."
                      required
                    />
                  </div>
                </div>

                <div className="cr-field">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Brief description of this crop classification..."
                  />
                </div>

                <div className="cr-field">
                  <label>Status</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="cr-modal-foot">
                <button type="button" className="cr-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="cr-btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="cr-overlay" role="dialog" aria-modal="true">
          <div className="cr-confirm">
            <div className="cr-confirm-icon">⚠️</div>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete this record? This action will remove the record from your active agricultural list.
            </p>
            <div className="cr-confirm-btns">
              <button
                type="button"
                className="cr-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cr-btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ─────────────────────────────────────────── */}
      {toast && (
        <div className={`cr-toast cr-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
        </div>
      )}
    </div>
  );
}
