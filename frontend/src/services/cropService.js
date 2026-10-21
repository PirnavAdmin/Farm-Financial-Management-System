import api from './api';

// Initial Mock Seed Data matching requirements:
// Crops: Paddy, Cotton, Chilli, Groundnut, Maize, Tomato, Sugarcane
const SEED_CROPS = [
  {
    id: 1,
    cropCode: 'CRP-001',
    cropName: 'Paddy',
    cropType: 'Kharif / Food Grain',
    cropCategory: 'Cereals',
    defaultUnit: 'Quintals',
    status: 'Active',
    description: 'Major cereal grain crop cultivated in wetlands and canal belts.'
  },
  {
    id: 2,
    cropCode: 'CRP-002',
    cropName: 'Cotton',
    cropType: 'Kharif / Cash Crop',
    cropCategory: 'Fibre Crops',
    defaultUnit: 'Quintals',
    status: 'Active',
    description: 'Commercial fibre cash crop grown in black cotton soil.'
  },
  {
    id: 3,
    cropCode: 'CRP-003',
    cropName: 'Chilli',
    cropType: 'Kharif-Rabi / Spices',
    cropCategory: 'Spices',
    defaultUnit: 'Bags',
    status: 'Active',
    description: 'High value spice crop with domestic and export demand.'
  },
  {
    id: 4,
    cropCode: 'CRP-004',
    cropName: 'Groundnut',
    cropType: 'Kharif-Rabi / Oilseeds',
    cropCategory: 'Oilseeds',
    defaultUnit: 'Quintals',
    status: 'Active',
    description: 'Major oilseed legume crop suitable for sandy loam soils.'
  },
  {
    id: 5,
    cropCode: 'CRP-005',
    cropName: 'Maize',
    cropType: 'Kharif / Food Grain',
    cropCategory: 'Cereals',
    defaultUnit: 'Quintals',
    status: 'Active',
    description: 'Versatile grain and fodder crop with short harvest cycle.'
  },
  {
    id: 6,
    cropCode: 'CRP-006',
    cropName: 'Tomato',
    cropType: 'Rabi / Horticulture',
    cropCategory: 'Vegetables',
    defaultUnit: 'Boxes',
    status: 'Active',
    description: 'Commercial vegetable crop with intensive drip irrigation.'
  },
  {
    id: 7,
    cropCode: 'CRP-007',
    cropName: 'Sugarcane',
    cropType: 'Perennial / Commercial',
    cropCategory: 'Commercial',
    defaultUnit: 'Tonnes',
    status: 'Active',
    description: 'High biomass industrial crop supplying sugar mills.'
  }
];

const SEED_CATEGORIES = [
  { id: 1, code: 'CAT-01', name: 'Cereals', description: 'Staple grain crops like Paddy, Maize, Wheat', status: 'Active' },
  { id: 2, code: 'CAT-02', name: 'Fibre Crops', description: 'Commercial fibre and lint crops like Cotton', status: 'Active' },
  { id: 3, code: 'CAT-03', name: 'Spices', description: 'Condiments and spices like Chilli and Turmeric', status: 'Active' },
  { id: 4, code: 'CAT-04', name: 'Oilseeds', description: 'Oil yielding crops like Groundnut and Sunflower', status: 'Active' },
  { id: 5, code: 'CAT-05', name: 'Vegetables', description: 'Commercial horticulture crops like Tomato', status: 'Active' },
  { id: 6, code: 'CAT-06', name: 'Commercial', description: 'Industrial and cash crops like Sugarcane', status: 'Active' }
];

const SEED_VARIETIES = [
  { id: 1, code: 'VAR-001', cropName: 'Paddy', varietyName: 'BPT 5204 (Samba Mahsuri)', durationDays: 145, season: 'Kharif', expectedYield: '25-30 Qtl/Acre', status: 'Active' },
  { id: 2, code: 'VAR-002', cropName: 'Cotton', varietyName: 'BT Cotton-2 (Bollgard II)', durationDays: 160, season: 'Kharif', expectedYield: '12-15 Qtl/Acre', status: 'Active' },
  { id: 3, code: 'VAR-003', cropName: 'Chilli', varietyName: 'Teja Red (G4 Hybrid)', durationDays: 150, season: 'Kharif-Rabi', expectedYield: '20-25 Qtl/Acre', status: 'Active' },
  { id: 4, code: 'VAR-004', cropName: 'Groundnut', varietyName: 'TAG-24 (Semi-Dwarf)', durationDays: 110, season: 'Kharif', expectedYield: '18-22 Qtl/Acre', status: 'Active' },
  { id: 5, code: 'VAR-005', cropName: 'Maize', varietyName: 'Pioneer 3396 Hybrid', durationDays: 105, season: 'Kharif', expectedYield: '35-40 Qtl/Acre', status: 'Active' },
  { id: 6, code: 'VAR-006', cropName: 'Tomato', varietyName: 'US 440 Determinate', durationDays: 90, season: 'Rabi', expectedYield: '250-300 Box/Acre', status: 'Active' },
  { id: 7, code: 'VAR-007', cropName: 'Sugarcane', varietyName: 'Co 86032 (Nayana)', durationDays: 360, season: 'Perennial', expectedYield: '45-50 Ton/Acre', status: 'Active' }
];

const SEED_SEASONS = [
  {
    id: 1,
    seasonCode: 'CS-2025-01',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    variety: 'BT Cotton-2 (Bollgard II)',
    season: 'Kharif 2025-26',
    sowingDate: '2025-06-15',
    expectedHarvestDate: '2025-11-20',
    actualHarvestDate: '2025-11-24',
    area: '10 Acres',
    expectedYield: '140 Quintals',
    expectedRevenue: '₹ 3,80,000',
    status: 'Harvested'
  },
  {
    id: 2,
    seasonCode: 'CS-2025-02',
    farm: 'Farm 2 (Canal Belt)',
    crop: 'Paddy',
    variety: 'BPT 5204 (Samba Mahsuri)',
    season: 'Kharif 2025-26',
    sowingDate: '2025-07-02',
    expectedHarvestDate: '2025-11-28',
    actualHarvestDate: '',
    area: '12 Acres',
    expectedYield: '320 Quintals',
    expectedRevenue: '₹ 2,60,000',
    status: 'In Progress'
  },
  {
    id: 3,
    seasonCode: 'CS-2025-03',
    farm: 'Sunrise Farms (East Block)',
    crop: 'Chilli',
    variety: 'Teja Red (G4 Hybrid)',
    season: 'Kharif-Rabi 2025-26',
    sowingDate: '2025-08-10',
    expectedHarvestDate: '2026-01-15',
    actualHarvestDate: '',
    area: '8 Acres',
    expectedYield: '180 Bags',
    expectedRevenue: '₹ 2,40,000',
    status: 'In Progress'
  },
  {
    id: 4,
    seasonCode: 'CS-2025-04',
    farm: 'Farm 1 (South Block)',
    crop: 'Groundnut',
    variety: 'TAG-24 (Semi-Dwarf)',
    season: 'Rabi 2025-26',
    sowingDate: '2025-09-20',
    expectedHarvestDate: '2026-01-05',
    actualHarvestDate: '',
    area: '6 Acres',
    expectedYield: '120 Quintals',
    expectedRevenue: '₹ 1,50,000',
    status: 'In Progress'
  },
  {
    id: 5,
    seasonCode: 'CS-2025-05',
    farm: 'Farm 2 (Canal Belt)',
    crop: 'Maize',
    variety: 'Pioneer 3396 Hybrid',
    season: 'Kharif 2025-26',
    sowingDate: '2025-06-25',
    expectedHarvestDate: '2025-10-15',
    actualHarvestDate: '2025-10-18',
    area: '5 Acres',
    expectedYield: '190 Quintals',
    expectedRevenue: '₹ 1,20,000',
    status: 'Harvested'
  },
  {
    id: 6,
    seasonCode: 'CS-2025-06',
    farm: 'Krishna Delta Parcel',
    crop: 'Tomato',
    variety: 'US 440 Determinate',
    season: 'Rabi 2025-26',
    sowingDate: '2025-09-05',
    expectedHarvestDate: '2025-12-10',
    actualHarvestDate: '',
    area: '5 Acres',
    expectedYield: '1400 Boxes',
    expectedRevenue: '₹ 1,60,000',
    status: 'In Progress'
  },
  {
    id: 7,
    seasonCode: 'CS-2025-07',
    farm: 'Krishna Delta Parcel',
    crop: 'Sugarcane',
    variety: 'Co 86032 (Nayana)',
    season: 'Annual 2025-26',
    sowingDate: '2025-03-12',
    expectedHarvestDate: '2026-02-15',
    actualHarvestDate: '',
    area: '5 Acres',
    expectedYield: '220 Tonnes',
    expectedRevenue: '₹ 3,10,000',
    status: 'In Progress'
  }
];

// Helper to load/save localStorage
function getStorage(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[cropService] Error reading ${key} from storage:`, e);
  }
  return defaultData;
}

function setStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[cropService] Error saving ${key} to storage:`, e);
  }
}

// ─── Crop Master Service ───────────────────────────────────────────────────
export const cropService = {
  // 1. CROPS (Crop Master)
  getCrops: async () => {
    try {
      const response = await api.get('/api/Crops');
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.data)) return response.data.data;
    } catch {
      // Backend not yet available -> use localStorage
    }
    return getStorage('agriman_crops_master', SEED_CROPS);
  },

  createCrop: async (newCrop) => {
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const id = crops.length ? Math.max(...crops.map(c => Number(c.id) || 0)) + 1 : 1;
    const cropCode = newCrop.cropCode || `CRP-${String(id).padStart(3, '0')}`;
    const record = {
      ...newCrop,
      id,
      cropCode,
      status: newCrop.status || 'Active'
    };
    try {
      await api.post('/api/Crops', record);
    } catch {
      // Offline fallback
    }
    const updated = [record, ...crops];
    setStorage('agriman_crops_master', updated);
    return record;
  },

  updateCrop: async (id, updatedCrop) => {
    try {
      await api.put(`/api/Crops/${id}`, updatedCrop);
    } catch {
      // Offline fallback
    }
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const updated = crops.map(c => (c.id === id ? { ...c, ...updatedCrop } : c));
    setStorage('agriman_crops_master', updated);
    return updatedCrop;
  },

  deleteCrop: async (id) => {
    try {
      await api.delete(`/api/Crops/${id}`);
    } catch {
      // Offline fallback
    }
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const updated = crops.filter(c => c.id !== id);
    setStorage('agriman_crops_master', updated);
    return true;
  },

  // 2. CROP CATEGORIES
  getCategories: async () => {
    try {
      const response = await api.get('/api/CropCategories');
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.data)) return response.data.data;
    } catch {}
    return getStorage('agriman_crop_categories', SEED_CATEGORIES);
  },

  createCategory: async (newCat) => {
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    const id = list.length ? Math.max(...list.map(c => Number(c.id) || 0)) + 1 : 1;
    const code = newCat.code || `CAT-${String(id).padStart(2, '0')}`;
    const record = { ...newCat, id, code, status: newCat.status || 'Active' };
    const updated = [...list, record];
    setStorage('agriman_crop_categories', updated);
    return record;
  },

  updateCategory: async (id, updatedCat) => {
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    const updated = list.map(c => (c.id === id ? { ...c, ...updatedCat } : c));
    setStorage('agriman_crop_categories', updated);
    return updatedCat;
  },

  deleteCategory: async (id) => {
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    const updated = list.filter(c => c.id !== id);
    setStorage('agriman_crop_categories', updated);
    return true;
  },

  // 3. CROP VARIETIES
  getVarieties: async () => {
    try {
      const response = await api.get('/api/CropVarieties');
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.data)) return response.data.data;
    } catch {}
    return getStorage('agriman_crop_varieties', SEED_VARIETIES);
  },

  createVariety: async (newVar) => {
    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    const id = list.length ? Math.max(...list.map(v => Number(v.id) || 0)) + 1 : 1;
    const code = newVar.code || `VAR-${String(id).padStart(3, '0')}`;
    const record = { ...newVar, id, code, status: newVar.status || 'Active' };
    const updated = [record, ...list];
    setStorage('agriman_crop_varieties', updated);
    return record;
  },

  updateVariety: async (id, updatedVar) => {
    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    const updated = list.map(v => (v.id === id ? { ...v, ...updatedVar } : v));
    setStorage('agriman_crop_varieties', updated);
    return updatedVar;
  },

  deleteVariety: async (id) => {
    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    const updated = list.filter(v => v.id !== id);
    setStorage('agriman_crop_varieties', updated);
    return true;
  },

  // 4. CROP SEASONS
  getSeasons: async () => {
    try {
      const response = await api.get('/api/CropSeasons');
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data?.data)) return response.data.data;
    } catch {}
    return getStorage('agriman_crop_seasons', SEED_SEASONS);
  },

  createSeason: async (newSeason) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const id = list.length ? Math.max(...list.map(s => Number(s.id) || 0)) + 1 : 1;
    const seasonCode = newSeason.seasonCode || `CS-${new Date().getFullYear()}-${String(id).padStart(2, '0')}`;
    const record = { ...newSeason, id, seasonCode, status: newSeason.status || 'In Progress' };
    const updated = [record, ...list];
    setStorage('agriman_crop_seasons', updated);
    return record;
  },

  updateSeason: async (id, updatedSeason) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const updated = list.map(s => (s.id === id ? { ...s, ...updatedSeason } : s));
    setStorage('agriman_crop_seasons', updated);
    return updatedSeason;
  },

  deleteSeason: async (id) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const updated = list.filter(s => s.id !== id);
    setStorage('agriman_crop_seasons', updated);
    return true;
  }
};

export default cropService;
