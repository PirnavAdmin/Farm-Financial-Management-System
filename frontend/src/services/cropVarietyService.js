import api from './api';

const SEED_VARIETIES = [
  { id: 1, code: 'VAR-001', cropName: 'Paddy (Rice)', varietyName: 'BPT 5204 (Samba Mahsuri)', durationDays: 145, season: 'Kharif', expectedYield: '25-30 Qtl/Acre', status: 'Active' },
  { id: 2, code: 'VAR-002', cropName: 'Cotton', varietyName: 'BT Cotton-2 (Bollgard II)', durationDays: 160, season: 'Kharif', expectedYield: '12-15 Qtl/Acre', status: 'Active' },
  { id: 3, code: 'VAR-003', cropName: 'Chilli', varietyName: 'Teja Red (G4 Hybrid)', durationDays: 150, season: 'Kharif-Rabi', expectedYield: '20-25 Qtl/Acre', status: 'Active' },
  { id: 4, code: 'VAR-004', cropName: 'Groundnut', varietyName: 'TAG-24 (Semi-Dwarf)', durationDays: 110, season: 'Kharif', expectedYield: '18-22 Qtl/Acre', status: 'Active' },
  { id: 5, code: 'VAR-005', cropName: 'Maize', varietyName: 'Pioneer 3396 Hybrid', durationDays: 105, season: 'Kharif', expectedYield: '35-40 Qtl/Acre', status: 'Active' },
  { id: 6, code: 'VAR-006', cropName: 'Tomato', varietyName: 'US 440 Determinate', durationDays: 90, season: 'Rabi', expectedYield: '250-300 Box/Acre', status: 'Active' },
  { id: 7, code: 'VAR-007', cropName: 'Sugarcane', varietyName: 'Co 86032 (Nayana)', durationDays: 360, season: 'Perennial', expectedYield: '45-50 Ton/Acre', status: 'Active' }
];

function getStorage(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(item => item && typeof item === 'object');
      }
    }
  } catch (e) {
    console.warn(`[cropVarietyService] Error reading ${key} from storage:`, e);
  }
  return Array.isArray(defaultData) ? defaultData : [];
}

function setStorage(key, data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`[cropVarietyService] Error saving ${key} to storage:`, e);
  }
}

export const cropVarietyService = {
  getVarieties: async (params = {}) => {
    try {
      const res = await api.get('/api/CropVarieties', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        setStorage('agriman_crop_varieties', data);
        return data;
      }
    } catch (err) {
      console.warn('[cropVarietyService] API getVarieties failed, using storage:', err);
    }
    const raw = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    return [...raw].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  },

  getVarietyById: async (id) => {
    try {
      const res = await api.get(`/api/CropVarieties/${id}`);
      if (res.data) return res.data?.data || res.data;
    } catch {
      // Fallback
    }
    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    return list.find(v => Number(v.id) === Number(id) || v.code === id) || null;
  },

  createVariety: async (newVar) => {
    let result = null;
    try {
      const res = await api.post('/api/CropVarieties', newVar);
      result = res.data?.data || res.data;
    } catch (err) {
      console.warn('[cropVarietyService] API createVariety failed, using storage:', err);
    }

    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    const id = result?.id || (list.length ? Math.max(...list.map(v => Number(v.id) || 0)) + 1 : 1);
    const code = result?.code || newVar.code || `VAR-${String(id).padStart(3, '0')}`;
    const record = result || { ...newVar, id, code, status: newVar.status || 'Active' };
    const updated = [...list.filter(v => v.id !== record.id), record];
    setStorage('agriman_crop_varieties', updated);
    return record;
  },

  updateVariety: async (id, updatedVar) => {
    let result = null;
    try {
      const res = await api.put(`/api/CropVarieties/${id}`, updatedVar);
      result = res.data?.data || res.data;
    } catch (err) {
      console.warn('[cropVarietyService] API updateVariety failed, using storage:', err);
    }

    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    const updated = list.map(v => (v.id === id ? { ...v, ...(result || updatedVar) } : v));
    setStorage('agriman_crop_varieties', updated);
    return result || updatedVar;
  },

  deleteVariety: async (id) => {
    try {
      await api.delete(`/api/CropVarieties/${id}`);
    } catch (err) {
      console.warn('[cropVarietyService] API deleteVariety failed, using storage:', err);
    }
    const list = getStorage('agriman_crop_varieties', SEED_VARIETIES);
    const updated = list.filter(v => v.id !== id);
    setStorage('agriman_crop_varieties', updated);
    return true;
  }
};

export default cropVarietyService;
