import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import AddIncomeModal from './AddIncomeModal';
import AddExpenseModal from './AddExpenseModal';

export default function ModuleView({ moduleName, onNavigate }) {
  const {
    farmers,
    addFarmer,
    farms,
    addFarm,
    crops,
    addCrop,
    cropSeasons,
    cropProfitSummary,
    recentTransactions,
    upcomingPayments,
    payUpcomingPayment,
    lowStockItems,
    suppliers,
    buyers,
    labour,
    machinery,
    loans,
    metrics,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    academicYear,
    setAcademicYear
  } = useFarm();

  const [generalSettings, setGeneralSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('agriman_general_settings');
      return saved ? JSON.parse(saved) : {
        farmName: 'Shyam Reddy Agri Research & Commercial Farms',
        institution: 'Agricultural University Research Station',
        leadAgronomist: 'Admin User',
        currency: 'INR (₹ Indian Rupee)',
        landUnit: 'Acres (ac)',
        cropSeason: 'Kharif Season 2025-26',
        stockAlertThreshold: '25%',
        loanReminderDays: '5 Days'
      };
    } catch {
      return {
        farmName: 'Shyam Reddy Agri Research & Commercial Farms',
        institution: 'Agricultural University Research Station',
        leadAgronomist: 'Admin User',
        currency: 'INR (₹ Indian Rupee)',
        landUnit: 'Acres (ac)',
        cropSeason: 'Kharif Season 2025-26',
        stockAlertThreshold: '25%',
        loanReminderDays: '5 Days'
      };
    }
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Search inside module
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states for adding items
  const [farmerForm, setFarmerForm] = useState({
    name: '',
    fatherName: '',
    mobile: '',
    aadhaar: '',
    village: 'Narsapur',
    mandal: 'Siddipet',
    district: 'Siddipet',
    totalLand: '10 Acres',
    bankName: 'State Bank of India',
    accountNumber: '',
    ifsc: 'SBIN0020145'
  });

  const [farmForm, setFarmForm] = useState({
    farmName: '',
    farmerName: 'Shyam Reddy',
    surveyNumber: '',
    landArea: '10',
    areaUnit: 'Acres',
    landType: 'Wetland (Irrigated)',
    ownershipType: 'Owned',
    irrigationType: 'Borewell & Drip',
    soilType: 'Black Cotton Soil',
    village: 'Narsapur',
    mandal: 'Siddipet',
    district: 'Siddipet'
  });

  const [cropForm, setCropForm] = useState({
    name: '',
    type: 'Commercial',
    category: 'Fibre Crop',
    defaultUnit: 'Quintal',
    varieties: 'Hybrid Standard',
    farmName: '',
    area: '',
    sowingDate: '',
    expectedHarvestDate: '',
    expectedRevenue: ''
  });

  const formatCurrency = (val) => '₹ ' + (Number(val) || 0).toLocaleString('en-IN');

  // Submit handlers
  const handleFarmerSubmit = (e) => {
    e.preventDefault();
    addFarmer(farmerForm);
    setShowAddModal(false);
    setFarmerForm({
      name: '',
      fatherName: '',
      mobile: '',
      aadhaar: '',
      village: 'Narsapur',
      mandal: 'Siddipet',
      district: 'Siddipet',
      totalLand: '10 Acres',
      bankName: 'State Bank of India',
      accountNumber: '',
      ifsc: 'SBIN0020145'
    });
  };

  const handleFarmSubmit = (e) => {
    e.preventDefault();
    addFarm(farmForm);
    setShowAddModal(false);
    setFarmForm({
      farmName: '',
      farmerName: 'Shyam Reddy',
      surveyNumber: '',
      landArea: '10',
      areaUnit: 'Acres',
      landType: 'Wetland (Irrigated)',
      ownershipType: 'Owned',
      irrigationType: 'Borewell & Drip',
      soilType: 'Black Cotton Soil',
      village: 'Narsapur',
      mandal: 'Siddipet',
      district: 'Siddipet'
    });
  };

  const handleCropSubmit = (e) => {
    e.preventDefault();
    addCrop(cropForm);
    setShowAddModal(false);
    setCropForm({
      name: '',
      type: 'Commercial',
      category: 'Fibre Crop',
      defaultUnit: 'Quintal',
      varieties: 'Hybrid Standard',
      farmName: '',
      area: '',
      sowingDate: '',
      expectedHarvestDate: '',
      expectedRevenue: ''
    });
  };

  // Render view based on moduleName
  const renderContent = () => {
    switch (moduleName) {
      // ----------------------------------------------------
      // FARMERS MODULE (PDF Section 4)
      // ----------------------------------------------------
      case 'Farmers':
        const filteredFarmers = farmers.filter(
          (f) =>
            f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
          <div className="module-inner">
            <div className="module-toolbar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search farmer name, village, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                + Add Farmer
              </button>
            </div>

            <div className="table-card">
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Farmer Code</th>
                    <th>Farmer Name</th>
                    <th>Mobile</th>
                    <th>Village & District</th>
                    <th>Total Land</th>
                    <th>Bank Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((f) => (
                    <tr key={f.id}>
                      <td><span className="badge-code">{f.code}</span></td>
                      <td>
                        <strong>{f.name}</strong>
                        <div className="table-sub-text">S/o {f.fatherName || 'N/A'} • Aadhaar: {f.aadhaar}</div>
                      </td>
                      <td>{f.mobile}</td>
                      <td>{f.village}, {f.district}</td>
                      <td><strong className="text-emerald-800">{f.totalLand}</strong></td>
                      <td>
                        <small>{f.bankName}</small>
                        <div className="table-sub-text">A/c: {f.accountNumber} • IFSC: {f.ifsc}</div>
                      </td>
                      <td><span className="status-tag status-done">{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showAddModal && (
              <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h3 className="modal-title">Register New Farmer</h3>
                      <p className="modal-subtitle">Add farmer profile according to AgriMan schema</p>
                    </div>
                    <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                  </div>
                  <form onSubmit={handleFarmerSubmit} className="modal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Farmer Name *</label>
                        <input
                          type="text"
                          required
                          value={farmerForm.name}
                          onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Father / Husband Name</label>
                        <input
                          type="text"
                          value={farmerForm.fatherName}
                          onChange={(e) => setFarmerForm({ ...farmerForm, fatherName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label>Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          value={farmerForm.mobile}
                          onChange={(e) => setFarmerForm({ ...farmerForm, mobile: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Aadhaar Number</label>
                        <input
                          type="text"
                          value={farmerForm.aadhaar}
                          onChange={(e) => setFarmerForm({ ...farmerForm, aadhaar: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Land Owned</label>
                        <input
                          type="text"
                          value={farmerForm.totalLand}
                          onChange={(e) => setFarmerForm({ ...farmerForm, totalLand: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label>Village</label>
                        <input
                          type="text"
                          value={farmerForm.village}
                          onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Mandal</label>
                        <input
                          type="text"
                          value={farmerForm.mandal}
                          onChange={(e) => setFarmerForm({ ...farmerForm, mandal: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>District</label>
                        <input
                          type="text"
                          value={farmerForm.district}
                          onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          value={farmerForm.bankName}
                          onChange={(e) => setFarmerForm({ ...farmerForm, bankName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          value={farmerForm.accountNumber}
                          onChange={(e) => setFarmerForm({ ...farmerForm, accountNumber: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          value={farmerForm.ifsc}
                          onChange={(e) => setFarmerForm({ ...farmerForm, ifsc: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Farmer</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      // ----------------------------------------------------
      // FARMS MODULE (PDF Section 5)
      // ----------------------------------------------------
      case 'Farms':
        return (
          <div className="module-inner">
            <div className="module-toolbar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search farm name, survey number, irrigation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                + Add Farm / Land Parcel
              </button>
            </div>

            <div className="table-card">
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Farm Name</th>
                    <th>Owner / Farmer</th>
                    <th>Survey No</th>
                    <th>Area (Acres)</th>
                    <th>Land & Soil Type</th>
                    <th>Irrigation Type</th>
                    <th>Village</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {farms
                    .filter(
                      (f) =>
                        f.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.surveyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.farmerName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((f) => (
                      <tr key={f.id}>
                        <td><strong>{f.farmName}</strong></td>
                        <td>{f.farmerName}</td>
                        <td><span className="badge-code">{f.surveyNumber}</span></td>
                        <td><strong className="text-emerald-800">{f.landArea} {f.areaUnit}</strong></td>
                        <td>
                          <div>{f.soilType}</div>
                          <small className="text-gray-500">{f.landType}</small>
                        </td>
                        <td>
                          <span className="status-tag status-info">{f.irrigationType}</span>
                        </td>
                        <td>{f.village}, {f.district}</td>
                        <td><span className="status-tag status-done">{f.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {showAddModal && (
              <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h3 className="modal-title">Add Farm / Land Parcel</h3>
                      <p className="modal-subtitle">Record land details, survey numbers, and irrigation</p>
                    </div>
                    <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                  </div>
                  <form onSubmit={handleFarmSubmit} className="modal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Farm Name *</label>
                        <input
                          type="text"
                          required
                          value={farmForm.farmName}
                          onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                          placeholder="e.g. Farm 1 (South Block)"
                        />
                      </div>
                      <div className="form-group">
                        <label>Farmer Owner *</label>
                        <select
                          value={farmForm.farmerName}
                          onChange={(e) => setFarmForm({ ...farmForm, farmerName: e.target.value })}
                        >
                          {farmers.map((fm) => (
                            <option key={fm.id} value={fm.name}>{fm.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label>Survey Number *</label>
                        <input
                          type="text"
                          required
                          value={farmForm.surveyNumber}
                          onChange={(e) => setFarmForm({ ...farmForm, surveyNumber: e.target.value })}
                          placeholder="e.g. 123/A"
                        />
                      </div>
                      <div className="form-group">
                        <label>Land Area *</label>
                        <input
                          type="number"
                          required
                          value={farmForm.landArea}
                          onChange={(e) => setFarmForm({ ...farmForm, landArea: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Area Unit</label>
                        <input
                          type="text"
                          value={farmForm.areaUnit}
                          onChange={(e) => setFarmForm({ ...farmForm, areaUnit: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Irrigation Type</label>
                        <select
                          value={farmForm.irrigationType}
                          onChange={(e) => setFarmForm({ ...farmForm, irrigationType: e.target.value })}
                        >
                          <option value="Borewell & Drip">Borewell & Drip</option>
                          <option value="Canal & Sprinkler">Canal & Sprinkler</option>
                          <option value="River Lift Irrigation">River Lift Irrigation</option>
                          <option value="Rainfed (Dryland)">Rainfed (Dryland)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Soil Type</label>
                        <select
                          value={farmForm.soilType}
                          onChange={(e) => setFarmForm({ ...farmForm, soilType: e.target.value })}
                        >
                          <option value="Black Cotton Soil">Black Cotton Soil</option>
                          <option value="Red Loamy Soil">Red Loamy Soil</option>
                          <option value="Alluvial Soil">Alluvial Soil</option>
                          <option value="Clay Loam">Clay Loam</option>
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save Land Parcel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      // ----------------------------------------------------
      // CROPS MODULE (PDF Section 6)
      // ----------------------------------------------------
      case 'Crops':
      case 'Crop Varieties':
        return (
          <div className="module-inner">
            <div className="module-toolbar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search crop name, category, or variety..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                + Add Crop
              </button>
            </div>

            <div className="crops-grid-cards">
              {crops
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.category.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((crop) => (
                  <div key={crop.id} className="crop-master-card">
                    <div className="crop-card-top">
                      <span className="crop-huge-icon">🌱</span>
                      <div>
                        <h4 className="crop-title">{crop.name}</h4>
                        <span className="badge-tag">{crop.category}</span>
                      </div>
                      <span className="status-tag status-done">{crop.status}</span>
                    </div>
                    <div className="crop-meta-row">
                      <span>Type: <strong>{crop.type}</strong></span>
                      <span>Default Unit: <strong>{crop.defaultUnit}</strong></span>
                    </div>
                    <div className="crop-varieties-list">
                      <small>Approved Varieties:</small>
                      <div className="variety-chips">
                        {crop.varieties?.map((v, i) => (
                          <span key={i} className="variety-chip">{v}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {showAddModal && (
              <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h3 className="modal-title">Add Crop</h3>
                      <p className="modal-subtitle">Define crop details and optional cultivation schedule</p>
                    </div>
                    <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
                  </div>
                  <form onSubmit={handleCropSubmit} className="modal-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Crop Name *</label>
                        <input
                          type="text"
                          required
                          value={cropForm.name}
                          onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })}
                          placeholder="e.g. Mustard, Turmeric, Wheat"
                        />
                      </div>
                      <div className="form-group">
                        <label>Crop Type</label>
                        <select
                          value={cropForm.type}
                          onChange={(e) => setCropForm({ ...cropForm, type: e.target.value })}
                        >
                          <option value="Commercial">Commercial</option>
                          <option value="Food Grain">Food Grain</option>
                          <option value="Cash Crop">Cash Crop</option>
                          <option value="Oilseed">Oilseed</option>
                          <option value="Horticulture">Horticulture</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Category</label>
                        <select
                          value={cropForm.category}
                          onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })}
                        >
                          <option value="Fibre Crop">Fibre Crop (Cotton, Jute)</option>
                          <option value="Cereal">Cereal / Food Grain (Paddy, Wheat, Maize, Millets)</option>
                          <option value="Pulses / Legume">Pulses / Legume (Red Gram, Bengal Gram, Black Gram)</option>
                          <option value="Oilseed">Oilseed (Groundnut, Mustard, Soybean, Sunflower)</option>
                          <option value="Spices">Spices & Condiments (Chilli, Turmeric, Coriander, Ginger)</option>
                          <option value="Vegetable">Horticulture & Vegetable (Tomato, Onion, Potato, Brinjal)</option>
                          <option value="Sugar Crop">Sugar Crop (Sugarcane, Sugarbeet)</option>
                          <option value="Commercial / Cash Crop">Commercial / Cash Crop (Tobacco, Coffee, Tea)</option>
                          <option value="Fruits & Plantation">Fruits & Plantation (Mango, Banana, Guava, Citrus)</option>
                          <option value="Fodder Crop">Fodder & Forage Crop (Lucerne, Berseem, Napier)</option>
                          <option value="Medicinal & Aromatic">Medicinal & Aromatic Plants (Aloe Vera, Ashwagandha)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Default Unit</label>
                        <select
                          value={cropForm.defaultUnit}
                          onChange={(e) => setCropForm({ ...cropForm, defaultUnit: e.target.value })}
                        >
                          <option value="Quintal">Quintal (q / 100 kg)</option>
                          <option value="Bags (75kg)">Bags (75kg - Paddy)</option>
                          <option value="Bags (50kg)">Bags (50kg - Grain/Wheat)</option>
                          <option value="Bags (40kg)">Bags (40kg - Groundnut/Seeds)</option>
                          <option value="Tonnes">Tonnes (MT / 1000 kg)</option>
                          <option value="Boxes (25kg)">Boxes (25kg - Vegetables/Fruits)</option>
                          <option value="Boxes (10kg)">Boxes (10kg)</option>
                          <option value="Crates (20kg)">Crates (20kg - Tomato/Horticulture)</option>
                          <option value="Kilograms (kg)">Kilograms (kg)</option>
                          <option value="Bundles">Bundles (Sugarcane/Fodder)</option>
                          <option value="Litres">Litres</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Varieties (Comma separated)</label>
                      <input
                        type="text"
                        value={cropForm.varieties}
                        onChange={(e) => setCropForm({ ...cropForm, varieties: e.target.value })}
                        placeholder="e.g. Var-1, Var-2"
                      />
                    </div>

                    <div style={{ marginTop: 14, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e5e7eb', fontSize: 13, fontWeight: 700, color: '#166534' }}>
                      Cultivation Schedule (Optional — Leave blank if not yet planted)
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Farm Parcel (Optional)</label>
                        <select
                          value={cropForm.farmName}
                          onChange={(e) => setCropForm({ ...cropForm, farmName: e.target.value })}
                        >
                          <option value="">-- Not Assigned / Unallocated --</option>
                          {farms.map((f) => (
                            <option key={f.id} value={f.farmName}>
                              {f.farmName} ({f.landArea} Ac)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Cultivated Area (Acres, Optional)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={cropForm.area}
                          onChange={(e) => setCropForm({ ...cropForm, area: e.target.value })}
                          placeholder="e.g. 5"
                        />
                      </div>
                    </div>

                    <div className="form-grid-3">
                      <div className="form-group">
                        <label>Sowing Date (Optional)</label>
                        <input
                          type="date"
                          value={cropForm.sowingDate}
                          onChange={(e) => setCropForm({ ...cropForm, sowingDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expected Harvest Date (Optional)</label>
                        <input
                          type="date"
                          value={cropForm.expectedHarvestDate}
                          onChange={(e) => setCropForm({ ...cropForm, expectedHarvestDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expected Revenue (₹, Optional)</label>
                        <input
                          type="number"
                          min="0"
                          value={cropForm.expectedRevenue}
                          onChange={(e) => setCropForm({ ...cropForm, expectedRevenue: e.target.value })}
                          placeholder="e.g. 150000"
                        />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                      <button type="submit" className="btn-primary">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      // ----------------------------------------------------
      // CROP SEASONS & ACTIVITIES (PDF Section 5 & 6)
      // ----------------------------------------------------
      case 'Crop Seasons':
      case 'Crop Activities':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Seasons Tracked</span>
                <div className="stat-val">{cropSeasons.length}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Cultivated Area</span>
                <div className="stat-val">{cropSeasons.reduce((acc, c) => acc + c.area, 0)} Acres</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Projected Crop Revenue</span>
                <div className="stat-val text-emerald-700">
                  {formatCurrency(cropSeasons.reduce((acc, c) => acc + c.expectedRevenue, 0))}
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Cultivation Cost</span>
                <div className="stat-val text-amber-700">
                  {formatCurrency(cropSeasons.reduce((acc, c) => acc + c.totalExpenses, 0))}
                </div>
              </div>
            </div>

            <div className="table-card mt-4">
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Season ID</th>
                    <th>Crop & Variety</th>
                    <th>Farm Parcel</th>
                    <th>Season Cycle</th>
                    <th>Sowing Date</th>
                    <th>Harvest Date</th>
                    <th>Area (Acres)</th>
                    <th>Exp. Yield</th>
                    <th>Exp. Revenue</th>
                    <th>Net Profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cropSeasons.map((cs) => (
                    <tr key={cs.id}>
                      <td><span className="badge-code">{cs.id}</span></td>
                      <td>
                        <strong>{cs.cropName}</strong>
                        <div className="table-sub-text">{cs.variety}</div>
                      </td>
                      <td>{cs.farmName}</td>
                      <td><span className="badge-season">{cs.season}</span></td>
                      <td>{cs.sowingDate}</td>
                      <td>{cs.expectedHarvestDate}</td>
                      <td><strong>{cs.area} {cs.areaUnit}</strong></td>
                      <td>{cs.expectedYield}</td>
                      <td className="text-emerald-700 font-semibold">{formatCurrency(cs.expectedRevenue)}</td>
                      <td className="text-teal-800 font-semibold">{formatCurrency(cs.netProfit)}</td>
                      <td>
                        <span className={`status-tag ${cs.status.includes('Completed') ? 'status-done' : 'status-live'}`}>
                          {cs.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // CROP-WISE PROFIT & LOSS (PDF Section 18)
      // ----------------------------------------------------
      case 'Crop Profit':
      case 'P&L':
        return (
          <div className="module-inner">
            <div className="callout-banner">
              <div className="callout-icon">📊</div>
              <div>
                <h4>AgriMan Core Financial Engine: Crop-wise Profit & Loss</h4>
                <p>
                  Calculates Revenue, Detailed Input Cost Allocations (Seeds, Fertilizers, Pesticides, Labour, Machinery, Diesel, Transport), Cost per Acre, and Return on Investment (ROI %).
                </p>
              </div>
            </div>

            <div className="crop-pl-cards-grid mt-4">
              {cropProfitSummary.map((item, idx) => (
                <div key={idx} className="crop-pl-card">
                  <div className="crop-pl-header">
                    <div>
                      <h3 className="crop-pl-name">{item.crop}</h3>
                      <span className="crop-pl-acres">Total Area: <strong>{item.acres} Acres</strong></span>
                    </div>
                    <div className="crop-pl-net-box">
                      <span className="net-label">NET PROFIT</span>
                      <span className="net-amount">{formatCurrency(item.netProfit)}</span>
                    </div>
                  </div>

                  <div className="crop-pl-numbers-bar">
                    <div className="num-group">
                      <small>Gross Income</small>
                      <strong className="text-emerald-700">{formatCurrency(item.income)}</strong>
                    </div>
                    <div className="num-group">
                      <small>Total Expenses</small>
                      <strong className="text-amber-700">{formatCurrency(item.expense)}</strong>
                    </div>
                    <div className="num-group">
                      <small>Net ROI</small>
                      <strong className="text-teal-700">{item.roi}%</strong>
                    </div>
                  </div>

                  <div className="crop-pl-unit-metrics">
                    <div className="unit-stat">
                      <span>Cost / Acre:</span> <strong>{formatCurrency(item.costPerAcre)}</strong>
                    </div>
                    <div className="unit-stat">
                      <span>Income / Acre:</span> <strong>{formatCurrency(item.incomePerAcre)}</strong>
                    </div>
                    <div className="unit-stat">
                      <span>Profit / Acre:</span> <strong className="text-emerald-800">{formatCurrency(item.profitPerAcre)}</strong>
                    </div>
                  </div>

                  <div className="crop-pl-breakdown">
                    <h5>Cultivation Cost Breakdown:</h5>
                    <div className="breakdown-grid">
                      <div><span>Seeds:</span> <b>{formatCurrency(item.breakdown.seeds)}</b></div>
                      <div><span>Fertilizers:</span> <b>{formatCurrency(item.breakdown.fertilizer)}</b></div>
                      <div><span>Pesticides:</span> <b>{formatCurrency(item.breakdown.pesticides)}</b></div>
                      <div><span>Labour:</span> <b>{formatCurrency(item.breakdown.labour)}</b></div>
                      <div><span>Diesel:</span> <b>{formatCurrency(item.breakdown.diesel)}</b></div>
                      <div><span>Machinery:</span> <b>{formatCurrency(item.breakdown.machinery)}</b></div>
                      <div><span>Transport:</span> <b>{formatCurrency(item.breakdown.transport)}</b></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ----------------------------------------------------
      // INCOME MANAGEMENT (PDF Section 7)
      // ----------------------------------------------------
      case 'Income':
      case 'Income Report':
        const incomeList = recentTransactions.filter((tx) => tx.type === 'Income');
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Realized Income</span>
                <div className="stat-val text-emerald-700">{formatCurrency(metrics.totalIncome)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Income Inflow Transactions</span>
                <div className="stat-val">{incomeList.length} Entries</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Outstanding Receivables</span>
                <div className="stat-val text-indigo-700">{formatCurrency(metrics.outstandingReceivables)}</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Recorded Farm Income Transactions</h3>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowIncomeModal(true)}
                >
                  + Record New Income
                </button>
              </div>

              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher No</th>
                    <th>Category / Income Type</th>
                    <th>Buyer / Source</th>
                    <th>Farm Location</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Reference No</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeList.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>
                      <td><span className="badge-code">{tx.id}</span></td>
                      <td><strong>{tx.category}</strong></td>
                      <td>{tx.party}</td>
                      <td>{tx.farm}</td>
                      <td className="text-emerald-700 font-bold">+{formatCurrency(tx.amount)}</td>
                      <td><span className="badge-tag">{tx.mode}</span></td>
                      <td><small>{tx.refNo}</small></td>
                      <td><span className="status-tag status-done">{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // EXPENSES MANAGEMENT (PDF Section 8)
      // ----------------------------------------------------
      case 'Expenses':
      case 'Expense Report':
      case 'Expense Categories':
        const expenseList = recentTransactions.filter((tx) => tx.type === 'Expense');
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Expenditures</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.totalExpense)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Labour Expenditure</span>
                <div className="stat-val text-cyan-800">{formatCurrency(metrics.labourCost)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Inputs (Fertilizers & Seeds)</span>
                <div className="stat-val text-violet-800">{formatCurrency(metrics.inputCost)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Machinery & Fuel</span>
                <div className="stat-val text-stone-800">{formatCurrency(metrics.machineryCost)}</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Logged Expenditures & Vouchers</h3>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowExpenseModal(true)}
                >
                  + Log New Expense
                </button>
              </div>

              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense No</th>
                    <th>Category</th>
                    <th>Supplier / Recipient</th>
                    <th>Farm Allocation</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Reference No</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseList.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>
                      <td><span className="badge-code">{tx.id}</span></td>
                      <td><strong>{tx.category}</strong></td>
                      <td>{tx.party}</td>
                      <td>{tx.farm}</td>
                      <td className="text-amber-800 font-bold">-{formatCurrency(tx.amount)}</td>
                      <td><span className="badge-tag">{tx.mode}</span></td>
                      <td><small>{tx.refNo}</small></td>
                      <td><span className="status-tag status-done">{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // INVENTORY & PURCHASES MODULE (PDF Section 9 & 12)
      // ----------------------------------------------------
      case 'Inventory':
      case 'Purchases':
      case 'Stock In':
      case 'Stock Out':
      case 'Stock Adjustment':
      case 'Stock Ledger':
      case 'Products':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Purchases</span>
                <div className="stat-val text-blue-700">{formatCurrency(metrics.totalPurchases)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Inventory Items</span>
                <div className="stat-val">{lowStockItems.length + 8} SKUs</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Critical Reorder Alerts</span>
                <div className="stat-val text-red-600">
                  {lowStockItems.filter((i) => !i.status.includes('Replenished')).length} Items
                </div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Warehouse Agricultural Inputs Inventory & Stocks</h3>
                <span className="text-sm text-gray-500">Real-time balances & threshold tracking</span>
              </div>

              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Input / Product Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Safety Stock</th>
                    <th>Unit Cost</th>
                    <th>Preferred Supplier</th>
                    <th>Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id}>
                      <td><span className="badge-code">{item.id}</span></td>
                      <td><strong>{item.productName}</strong></td>
                      <td><span className="badge-tag">{item.category}</span></td>
                      <td><strong className="text-gray-900">{item.currentStock} {item.unit}</strong></td>
                      <td>{item.reorderLevel} {item.unit}</td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td>{item.supplier}</td>
                      <td>
                        <span className={`status-tag ${item.status.includes('Replenished') ? 'status-done' : 'badge-critical'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // SALES & BUYERS MODULE (PDF Section 10 & 16)
      // ----------------------------------------------------
      case 'Sales':
      case 'Customers':
      case 'Buyers':
      case 'Receivables':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Crop Sales</span>
                <div className="stat-val text-emerald-700">{formatCurrency(metrics.totalSales)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Pending Receivables</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.outstandingReceivables)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Registered Buyers / Mandis</span>
                <div className="stat-val">{buyers.length} Buyers</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Customer & Buyer Ledger</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Buyer Code</th>
                    <th>Buyer / Entity Name</th>
                    <th>Business Group</th>
                    <th>Contact Mobile</th>
                    <th>GSTIN</th>
                    <th>Opening Balance</th>
                    <th>Outstanding Receivable</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((b) => (
                    <tr key={b.id}>
                      <td><span className="badge-code">{b.code}</span></td>
                      <td><strong>{b.name}</strong></td>
                      <td>{b.businessName}</td>
                      <td>{b.mobile}</td>
                      <td><small>{b.gstin}</small></td>
                      <td>{formatCurrency(b.openingBalance)}</td>
                      <td className="text-amber-700 font-bold">{formatCurrency(b.outstandingReceivable)}</td>
                      <td><span className="status-tag status-done">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // LABOUR MANAGEMENT MODULE (PDF Section 11)
      // ----------------------------------------------------
      case 'Labour':
      case 'Labour Attendance':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Labour Headcount</span>
                <div className="stat-val">{labour.length} Workers</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Cumulative Labour Wages</span>
                <div className="stat-val text-cyan-800">{formatCurrency(metrics.labourCost)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Average Daily Wage Rate</span>
                <div className="stat-val">₹ 445 / Day</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Agricultural Labour Roster & Skill Master</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Worker ID</th>
                    <th>Labour Name</th>
                    <th>Gender</th>
                    <th>Mobile</th>
                    <th>Village</th>
                    <th>Assigned Skill / Operations</th>
                    <th>Daily Wage Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labour.map((w) => (
                    <tr key={w.id}>
                      <td><span className="badge-code">{w.id}</span></td>
                      <td><strong>{w.name}</strong></td>
                      <td>{w.gender}</td>
                      <td>{w.mobile}</td>
                      <td>{w.village}</td>
                      <td><span className="badge-tag">{w.skill}</span></td>
                      <td><strong>₹ {w.dailyRate} / day</strong></td>
                      <td><span className="status-tag status-done">{w.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // MACHINERY & EQUIPMENT MODULE (PDF Section 13)
      // ----------------------------------------------------
      case 'Machinery':
      case 'Machinery Usage':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Farm Machinery Fleet</span>
                <div className="stat-val">{machinery.length} Units</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Fleet Valuation</span>
                <div className="stat-val text-emerald-800">
                  {formatCurrency(machinery.reduce((acc, m) => acc + m.currentValue, 0))}
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Machinery & Fuel Cost</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.machineryCost)}</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Farm Machinery, Tractors & Implements Master</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Machine ID</th>
                    <th>Machine Name</th>
                    <th>Type</th>
                    <th>Registration No</th>
                    <th>Purchase Date</th>
                    <th>Purchase Cost</th>
                    <th>Current Value</th>
                    <th>Fuel / Power</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {machinery.map((m) => (
                    <tr key={m.id}>
                      <td><span className="badge-code">{m.id}</span></td>
                      <td><strong>{m.machineName}</strong></td>
                      <td>{m.machineType}</td>
                      <td><span className="badge-code">{m.registrationNo}</span></td>
                      <td>{m.purchaseDate}</td>
                      <td>{formatCurrency(m.purchaseCost)}</td>
                      <td className="text-emerald-800 font-semibold">{formatCurrency(m.currentValue)}</td>
                      <td><span className="badge-tag">{m.fuelType}</span></td>
                      <td><span className="status-tag status-done">{m.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // LOANS & FINANCE MODULE (PDF Section 14 & 17)
      // ----------------------------------------------------
      case 'Loans':
      case 'Payments':
      case 'Loans & Payments':
      case 'Receipts':
      case 'Bank Accounts':
      case 'Finance':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Outstanding Loan Liabilities</span>
                <div className="stat-val text-red-600">
                  {formatCurrency(loans.reduce((acc, l) => acc + l.outstandingAmount, 0))}
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Scheduled Upcoming Payments</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.outstandingPayables)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Net Profit Surplus</span>
                <div className="stat-val text-emerald-700">{formatCurrency(metrics.netProfit)}</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Active Bank & Agricultural Loans</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Loan No</th>
                    <th>Bank / Lending Institution</th>
                    <th>Loan Type & Purpose</th>
                    <th>Sanction Amount</th>
                    <th>Interest Rate</th>
                    <th>Monthly EMI</th>
                    <th>Outstanding Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td><span className="badge-code">{l.loanNo}</span></td>
                      <td><strong>{l.bankLender}</strong></td>
                      <td>
                        <div>{l.loanType}</div>
                        <small className="text-gray-500">{l.purpose}</small>
                      </td>
                      <td>{formatCurrency(l.sanctionAmount)}</td>
                      <td><strong>{l.interestRate}% p.a.</strong></td>
                      <td>{l.emi > 0 ? formatCurrency(l.emi) : 'Seasonal / Crop Repayment'}</td>
                      <td className="text-red-700 font-bold">{formatCurrency(l.outstandingAmount)}</td>
                      <td><span className="status-tag status-done">{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-card mt-5">
              <div className="card-header-bar">
                <h3>Upcoming Scheduled Liabilities & Dues</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Obligation Type</th>
                    <th>Payee / Party</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPayments.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.dueDate}</strong></td>
                      <td>{p.type}</td>
                      <td>{p.party}</td>
                      <td className="text-rose-700 font-bold">{formatCurrency(p.amount)}</td>
                      <td><span className="badge-tag">{p.mode}</span></td>
                      <td>
                        {p.status === 'Completed' ? (
                          <span className="status-tag status-done">✓ Paid</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-pay-now"
                            onClick={() => payUpcomingPayment(p.id)}
                          >
                            Settle Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // SUPPLIERS MODULE (PDF Section 15)
      // ----------------------------------------------------
      case 'Suppliers':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Active Input Suppliers</span>
                <div className="stat-val">{suppliers.length} Vendors</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Outstanding Supplier Dues</span>
                <div className="stat-val text-amber-700">
                  {formatCurrency(suppliers.reduce((acc, s) => acc + s.outstandingDue, 0))}
                </div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Registered Agricultural Input Suppliers & Dealers</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Supplier Code</th>
                    <th>Supplier Name</th>
                    <th>Contact Mobile</th>
                    <th>Address</th>
                    <th>GSTIN</th>
                    <th>Bank Details</th>
                    <th>Outstanding Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><span className="badge-code">{s.code}</span></td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.mobile}</td>
                      <td>{s.address}</td>
                      <td><small>{s.gstin}</small></td>
                      <td><small>{s.bankDetails}</small></td>
                      <td className="text-amber-800 font-bold">{formatCurrency(s.outstandingDue)}</td>
                      <td><span className="status-tag status-done">{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // NOTIFICATIONS CENTER (PDF Section 20)
      // ----------------------------------------------------
      case 'Notifications':
        return (
          <div className="module-inner">
            <div className="table-card">
              <div className="card-header-bar">
                <div>
                  <h3>System Notifications & Operational Alerts</h3>
                  <p className="text-sm text-gray-500">Live alerts for inventory, loan repayment, and harvests</p>
                </div>
                <button className="btn-secondary" onClick={markAllNotificationsRead}>
                  Mark all as read
                </button>
              </div>

              <div className="notifications-full-list">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notification-card-item ${n.read ? 'read' : 'unread'} notif-${n.type}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div className="notif-badge-icon">
                      {n.type === 'warning' ? '⚠' : n.type === 'success' ? '✓' : 'ℹ'}
                    </div>
                    <div className="notif-content-area">
                      <div className="notif-headline">
                        <strong>{n.title}</strong>
                        <span className="notif-timestamp">{n.time}</span>
                      </div>
                      <p>{n.message}</p>
                    </div>
                    {!n.read && <span className="unread-dot" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // REPORTS MODULE (PDF Section 19)
      // ----------------------------------------------------
      case 'Reports':
      case 'Farm Profit':
      case 'Cash Flow':
      case 'Dashboard Reports':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Realized Revenue</span>
                <div className="stat-val text-emerald-700">{formatCurrency(metrics.totalIncome)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Cultivation Expense</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.totalExpense)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Net Realized Surplus</span>
                <div className="stat-val text-teal-800">{formatCurrency(metrics.netProfit)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Farm Profitability Margin</span>
                <div className="stat-val">{metrics.roi}%</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Executive Financial Summary: Kharif & Rabi Seasons</h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.print()}
                >
                  🖨 Export / Print PDF
                </button>
              </div>

              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Farm Parcel</th>
                    <th>Total Acreage</th>
                    <th>Dominant Crops</th>
                    <th>Gross Income</th>
                    <th>Expenditure</th>
                    <th>Net Profit</th>
                    <th>ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {farms.map((f) => {
                    const estInc = f.landArea * 24038;
                    const estExp = f.landArea * 15000;
                    const estProf = estInc - estExp;
                    return (
                      <tr key={f.id}>
                        <td><strong>{f.farmName}</strong></td>
                        <td>{f.landArea} Acres</td>
                        <td>{f.soilType.includes('Black') ? 'Cotton, Chilli' : 'Paddy, Maize, Tomato'}</td>
                        <td className="text-emerald-700 font-semibold">{formatCurrency(estInc)}</td>
                        <td className="text-amber-700 font-semibold">{formatCurrency(estExp)}</td>
                        <td className="text-teal-800 font-bold">{formatCurrency(estProf)}</td>
                        <td><strong>60.3%</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // TRANSACTIONS MODULE (Unified Financial Ledger)
      // ----------------------------------------------------
      case 'Transactions':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Total Cash Inflow (Income)</span>
                <div className="stat-val text-emerald-700">{formatCurrency(metrics.totalIncome)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Cash Outflow (Expense)</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.totalExpense)}</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Net Operating Surplus</span>
                <div className="stat-val text-teal-800">{formatCurrency(metrics.netProfit)}</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Unified Farm Financial Transactions Journal</h3>
                <span className="text-sm text-gray-500">Live feed connected to Dashboard</span>
              </div>

              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher Ref</th>
                    <th>Type</th>
                    <th>Category / Description</th>
                    <th>Party / Beneficiary</th>
                    <th>Farm Allocation</th>
                    <th>Amount</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>
                      <td><span className="badge-code">{tx.refNo || tx.id}</span></td>
                      <td>
                        <span className={`status-tag ${tx.type === 'Income' ? 'status-done' : 'status-live'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td><strong>{tx.category}</strong></td>
                      <td>{tx.party}</td>
                      <td>{tx.farm}</td>
                      <td className={tx.type === 'Income' ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'}>
                        {tx.type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td><span className="badge-tag">{tx.mode}</span></td>
                      <td><span className="status-tag status-done">{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // MACHINERY & ASSETS MODULE
      // ----------------------------------------------------
      case 'Machinery & Assets':
        return (
          <div className="module-inner">
            <div className="module-stats-row">
              <div className="stat-box">
                <span className="stat-label">Machinery Units</span>
                <div className="stat-val">{machinery.length} Units</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Fleet Valuation</span>
                <div className="stat-val text-emerald-800">
                  {formatCurrency(machinery.reduce((acc, m) => acc + m.currentValue, 0))}
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Farm Land</span>
                <div className="stat-val text-teal-800">{metrics.totalFarmArea} Acres</div>
              </div>
              <div className="stat-box">
                <span className="stat-label">Machinery Operating Cost</span>
                <div className="stat-val text-amber-700">{formatCurrency(metrics.machineryCost)}</div>
              </div>
            </div>

            <div className="table-card mt-4">
              <div className="card-header-bar">
                <h3>Farm Machinery, Tractors & Implements</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Machine ID</th>
                    <th>Machine Name</th>
                    <th>Type</th>
                    <th>Registration No</th>
                    <th>Purchase Date</th>
                    <th>Purchase Cost</th>
                    <th>Current Value</th>
                    <th>Power / Fuel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {machinery.map((m) => (
                    <tr key={m.id}>
                      <td><span className="badge-code">{m.id}</span></td>
                      <td><strong>{m.machineName}</strong></td>
                      <td>{m.machineType}</td>
                      <td><span className="badge-code">{m.registrationNo}</span></td>
                      <td>{m.purchaseDate}</td>
                      <td>{formatCurrency(m.purchaseCost)}</td>
                      <td className="text-emerald-800 font-semibold">{formatCurrency(m.currentValue)}</td>
                      <td><span className="badge-tag">{m.fuelType}</span></td>
                      <td><span className="status-tag status-done">{m.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-card mt-5">
              <div className="card-header-bar">
                <h3>Farm Land Parcels & Survey Holdings</h3>
              </div>
              <table className="standard-data-table">
                <thead>
                  <tr>
                    <th>Farm Parcel</th>
                    <th>Survey No</th>
                    <th>Land Area</th>
                    <th>Irrigation Type</th>
                    <th>Soil Type</th>
                    <th>Ownership</th>
                  </tr>
                </thead>
                <tbody>
                  {farms.map((f) => (
                    <tr key={f.id}>
                      <td><strong>{f.farmName}</strong></td>
                      <td><span className="badge-code">{f.surveyNumber}</span></td>
                      <td><strong>{f.landArea} {f.areaUnit}</strong></td>
                      <td><span className="status-tag status-info">{f.irrigationType}</span></td>
                      <td>{f.soilType}</td>
                      <td>{f.ownershipType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // ----------------------------------------------------
      // GENERAL SETTINGS (Clean, No Users/Roles clutter)
      // ----------------------------------------------------
      case 'General Settings':
      case 'Settings':
        return (
          <div className="module-inner">
            {settingsSaved && (
              <div className="alert-success-banner">
                ✓ General Settings and Academic Year updated successfully!
              </div>
            )}

            <div className="table-card">
              <div className="card-header-bar">
                <div>
                  <h3>General Settings</h3>
                  <p className="text-sm text-gray-500">Configure academic year, farm profile, units, and system preferences</p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    try {
                      localStorage.setItem('agriman_general_settings', JSON.stringify(generalSettings));
                    } catch (e) {
                      console.warn(e);
                    }
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 2500);
                  }}
                >
                  Save Settings
                </button>
              </div>

              <div className="general-settings-container">
                {/* Section 1: Academic & Fiscal Year Configuration */}
                <div className="settings-section-card">
                  <div className="settings-sec-header">
                    <span className="sec-icon">🎓</span>
                    <div>
                      <h4>Academic & Cultivation Year</h4>
                      <p>Manage the operational academic year and crop cycle dates</p>
                    </div>
                  </div>

                  <div className="form-grid-3 mt-3">
                    <div className="form-group">
                      <label>Active Academic Year *</label>
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                      >
                        <option value="2025-2026">2025–2026 (Current Academic Year)</option>
                        <option value="2024-2025">2024–2025 (Previous Year)</option>
                        <option value="2023-2024">2023–2024 (Archived)</option>
                        <option value="2026-2027">2026–2027 (Upcoming Planning)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Active Crop Season</label>
                      <select
                        value={generalSettings.cropSeason}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, cropSeason: e.target.value })}
                      >
                        <option value="Kharif Season 2025-26">Kharif Season (Jun – Nov)</option>
                        <option value="Rabi Season 2025-26">Rabi Season (Nov – Apr)</option>
                        <option value="Annual Commercial 2025-26">Annual Commercial (Year-round)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Accounting Fiscal Cycle</label>
                      <input
                        type="text"
                        value="FY 2025–26 (Apr 1 – Mar 31)"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Farm Enterprise & Campus Details */}
                <div className="settings-section-card">
                  <div className="settings-sec-header">
                    <span className="sec-icon">🌱</span>
                    <div>
                      <h4>Farm Enterprise & Institutional Profile</h4>
                      <p>Farm identity, campus affiliation, and principal contacts</p>
                    </div>
                  </div>

                  <div className="form-grid-2 mt-3">
                    <div className="form-group">
                      <label>Farm Enterprise Name *</label>
                      <input
                        type="text"
                        value={generalSettings.farmName}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, farmName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Campus / Institutional Affiliation</label>
                      <input
                        type="text"
                        value={generalSettings.institution}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, institution: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2 mt-2">
                    <div className="form-group">
                      <label>Lead Agronomist / Manager</label>
                      <input
                        type="text"
                        value={generalSettings.leadAgronomist}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, leadAgronomist: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Primary Operational Region</label>
                      <input
                        type="text"
                        defaultValue="Siddipet & Nizamabad Districts, Telangana"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Currency & Measurement Units */}
                <div className="settings-section-card">
                  <div className="settings-sec-header">
                    <span className="sec-icon">⚙</span>
                    <div>
                      <h4>System Units & Standards</h4>
                      <p>Default currencies, land area standards, and agricultural measures</p>
                    </div>
                  </div>

                  <div className="form-grid-3 mt-3">
                    <div className="form-group">
                      <label>Default Currency</label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                      >
                        <option value="INR (₹ Indian Rupee)">INR (₹ Indian Rupee)</option>
                        <option value="USD ($ US Dollar)">USD ($ US Dollar)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Land Measurement Unit</label>
                      <select
                        value={generalSettings.landUnit}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, landUnit: e.target.value })}
                      >
                        <option value="Acres (ac)">Acres (ac)</option>
                        <option value="Hectares (ha)">Hectares (ha)</option>
                        <option value="Guntas / Bigha">Guntas / Bigha</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Low Stock Warning Threshold</label>
                      <select
                        value={generalSettings.stockAlertThreshold}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, stockAlertThreshold: e.target.value })}
                      >
                        <option value="25%">Trigger when stock &lt; 25% of reorder level</option>
                        <option value="35%">Trigger when stock &lt; 35% of reorder level</option>
                        <option value="15%">Trigger when stock &lt; 15% of reorder level</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // DEFAULT FALLBACK
      default:
        return (
          <div className="module-inner">
            <div className="callout-banner">
              <div className="callout-icon">📁</div>
              <div>
                <h4>{moduleName} Module Workspace</h4>
                <p>Configured according to AgriMan system specifications.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="module-view-container">
      <div className="module-header-row">
        <div>
          <div className="eyebrow-tag">AGRIMAN • MODULE WORKSPACE</div>
          <h1 className="module-title">{moduleName}</h1>
          <p className="module-subtext">Manage, audit, and analyze {moduleName.toLowerCase()} data across all farm operations.</p>
        </div>
        <button
          type="button"
          className="btn-back-dashboard"
          onClick={() => onNavigate('Dashboard')}
        >
          ← Return to Dashboard
        </button>
      </div>

      {renderContent()}

      <AddIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
      />

      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
      />
    </div>
  );
}
