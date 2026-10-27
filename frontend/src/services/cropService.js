import api from './api';
import cropCategoryService from './cropCategoryService';
import cropVarietyService from './cropVarietyService';
import cropSeasonService from './cropSeasonService';
import cropActivityService from './cropActivityService';

// Fallback seed crops in case of offline/network failure
const SEED_CROPS = [
  {
    id: 1,
    cropCode: 'CRP-001',
    cropName: 'Paddy (Rice)',
    cropType: 'Cereal',
    cropCategory: 'Cereal',
    defaultUnit: 'Quintals',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 5.0,
    plantingDate: '2026-06-01T00:00:00',
    expectedHarvestDate: '2026-11-01T00:00:00',
    description: 'Major cereal grain crop cultivated in wetlands and canal belts.'
  },
  {
    id: 2,
    cropCode: 'CRP-002',
    cropName: 'Tomato',
    cropType: 'Vegetable',
    cropCategory: 'Vegetable',
    defaultUnit: 'Acres',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 2.0,
    plantingDate: '2026-08-01T00:00:00',
    expectedHarvestDate: '2026-11-15T00:00:00',
    description: 'Commercial vegetable crop with intensive drip irrigation.'
  },
  {
    id: 3,
    cropCode: 'CRP-003',
    cropName: 'Chilli',
    cropType: 'Vegetable',
    cropCategory: 'Vegetable',
    defaultUnit: 'Acres',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 3.0,
    plantingDate: '2026-07-01T00:00:00',
    expectedHarvestDate: '2026-12-01T00:00:00',
    description: 'High value spice crop with domestic and export demand.'
  },
  {
    id: 4,
    cropCode: 'CRP-004',
    cropName: 'Maize',
    cropType: 'Cereal',
    cropCategory: 'Cereal',
    defaultUnit: 'Acres',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 2.5,
    plantingDate: '2026-10-22T00:00:00',
    expectedHarvestDate: '2027-02-22T00:00:00',
    description: 'Versatile grain and fodder crop with short harvest cycle.'
  },
  {
    id: 1005,
    cropCode: 'CRP-005',
    cropName: 'Cotton',
    cropType: 'Commercial',
    cropCategory: 'Cereal',
    defaultUnit: 'Quintals',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 10.0,
    plantingDate: '2026-06-15T00:00:00',
    expectedHarvestDate: '2026-11-20T00:00:00',
    description: 'Commercial fibre cash crop grown in black cotton soil.'
  },
  {
    id: 1006,
    cropCode: 'CRP-006',
    cropName: 'Groundnut',
    cropType: 'Oilseed',
    cropCategory: 'Cereal',
    defaultUnit: 'Quintals',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 6.0,
    plantingDate: '2026-09-20T00:00:00',
    expectedHarvestDate: '2027-01-05T00:00:00',
    description: 'Major oilseed legume crop suitable for sandy loam soils.'
  },
  {
    id: 1007,
    cropCode: 'CRP-007',
    cropName: 'Sugarcane',
    cropType: 'Commercial',
    cropCategory: 'Cereal',
    defaultUnit: 'Tonnes',
    status: 'Active',
    farm: 'Sample Farm',
    farmId: 1,
    cultivatedArea: 5.0,
    plantingDate: '2026-03-12T00:00:00',
    expectedHarvestDate: '2027-02-15T00:00:00',
    description: 'High biomass industrial crop supplying sugar mills.'
  }
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
    console.warn(`[cropService] Error reading ${key} from storage:`, e);
  }
  return Array.isArray(defaultData) ? defaultData : [];
}

function setStorage(key, data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`[cropService] Error saving ${key} to storage:`, e);
  }
}

// ─── Crop Master Service ───────────────────────────────────────────────────
export const cropService = {
  // 1. CROPS (Crop Master APIs)
  // GET /api/Crop — retrieve crops
  getCrops: async () => {
    try {
      const response = await api.get('/api/Crop');
      const list = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : null);
      if (Array.isArray(list)) {
        const mapped = list.map(c => ({
          id: c.cropId || c.id,
          cropId: c.cropId || c.id,
          cropCode: c.cropCode || `CRP-${String(c.cropId || c.id).padStart(3, '0')}`,
          cropName: c.cropName || c.name,
          cropType: c.cropType || 'Cereal',
          cropCategory: c.cropCategory?.categoryName || c.categoryName || c.cropCategory || 'Cereal',
          cropCategoryId: c.cropCategoryId || c.cropCategory?.cropCategoryId || 1,
          defaultUnit: c.defaultUnit || 'Quintals',
          status: c.status || 'Active',
          farmId: c.farmId || 1,
          farm: c.farm?.farmName || c.farm || 'Sample Farm',
          cultivatedArea: c.cultivatedArea !== undefined ? c.cultivatedArea : 0,
          plantingDate: c.plantingDate || '',
          expectedHarvestDate: c.expectedHarvestDate || '',
          description: c.description || ''
        }));
        mapped.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
        setStorage('agriman_crops_master', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[cropService] Backend /api/Crop unavailable, using fallback cache:', err.friendlyMessage || err.message);
    }
    const raw = getStorage('agriman_crops_master', SEED_CROPS);
    return [...raw].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  },

  // GET /api/Crop/{id} — retrieve a crop by ID
  getCropById: async (id) => {
    try {
      const response = await api.get(`/api/Crop/${id}`);
      const c = response.data;
      if (c) {
        return {
          id: c.cropId || c.id,
          cropId: c.cropId || c.id,
          cropCode: c.cropCode || `CRP-${String(c.cropId || c.id).padStart(3, '0')}`,
          cropName: c.cropName || c.name,
          cropType: c.cropType || 'Cereal',
          cropCategory: c.cropCategory?.categoryName || c.categoryName || 'Cereal',
          cropCategoryId: c.cropCategoryId || c.cropCategory?.cropCategoryId || 1,
          defaultUnit: c.defaultUnit || 'Quintals',
          status: c.status || 'Active',
          farmId: c.farmId || 1,
          farm: c.farm?.farmName || c.farm || 'Sample Farm',
          cultivatedArea: c.cultivatedArea !== undefined ? c.cultivatedArea : 0,
          plantingDate: c.plantingDate || '',
          expectedHarvestDate: c.expectedHarvestDate || '',
          description: c.description || ''
        };
      }
    } catch (err) {
      console.warn(`[cropService] Backend /api/Crop/${id} unavailable:`, err.friendlyMessage || err.message);
    }
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    return crops.find(c => Number(c.id) === Number(id) || c.cropCode === id) || null;
  },

  // POST /api/Crop — create a crop
  createCrop: async (newCrop) => {
    const payload = {
      cropName: newCrop.cropName?.trim(),
      cropType: newCrop.cropType || 'Cereal',
      cropCategoryId: Number(newCrop.cropCategoryId) || 1,
      defaultUnit: newCrop.defaultUnit || 'Quintals',
      farmId: Number(newCrop.farmId) || 1,
      cultivatedArea: parseFloat(newCrop.cultivatedArea) || 5.0,
      status: newCrop.status || 'Active',
      plantingDate: newCrop.plantingDate ? new Date(newCrop.plantingDate).toISOString() : new Date().toISOString(),
      expectedHarvestDate: newCrop.expectedHarvestDate ? new Date(newCrop.expectedHarvestDate).toISOString() : null
    };

    const response = await api.post('/api/Crop', payload);
    const res = response.data;
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const id = res?.cropId || res?.id || (crops.length ? Math.max(...crops.map(c => Number(c.id) || 0)) + 1 : 1);
    const record = {
      id,
      cropId: id,
      cropCode: `CRP-${String(id).padStart(3, '0')}`,
      cropName: res?.cropName || payload.cropName,
      cropType: res?.cropType || payload.cropType,
      cropCategory: res?.cropCategory?.categoryName || newCrop.cropCategory || 'Cereal',
      cropCategoryId: res?.cropCategoryId || payload.cropCategoryId,
      defaultUnit: res?.defaultUnit || payload.defaultUnit,
      status: res?.status || payload.status,
      farmId: res?.farmId || payload.farmId,
      farm: res?.farm?.farmName || newCrop.farm || 'Sample Farm',
      cultivatedArea: res?.cultivatedArea !== undefined ? res.cultivatedArea : payload.cultivatedArea,
      plantingDate: res?.plantingDate || payload.plantingDate,
      expectedHarvestDate: res?.expectedHarvestDate || payload.expectedHarvestDate,
      description: newCrop.description || ''
    };
    const updated = [...crops.filter(c => c.id !== record.id), record];
    setStorage('agriman_crops_master', updated);
    return record;
  },

  // PUT /api/Crop/{id} — update a crop
  updateCrop: async (id, updatedCrop) => {
    const payload = {
      cropId: Number(id),
      cropName: updatedCrop.cropName?.trim(),
      cropType: updatedCrop.cropType || 'Cereal',
      cropCategoryId: Number(updatedCrop.cropCategoryId) || 1,
      defaultUnit: updatedCrop.defaultUnit || 'Quintals',
      farmId: Number(updatedCrop.farmId) || 1,
      cultivatedArea: parseFloat(updatedCrop.cultivatedArea) || 5.0,
      status: updatedCrop.status || 'Active',
      plantingDate: updatedCrop.plantingDate ? new Date(updatedCrop.plantingDate).toISOString() : new Date().toISOString(),
      expectedHarvestDate: updatedCrop.expectedHarvestDate ? new Date(updatedCrop.expectedHarvestDate).toISOString() : null
    };

    await api.put(`/api/Crop/${id}`, payload);
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const updated = crops.map(c => (Number(c.id) === Number(id) ? { ...c, ...updatedCrop } : c));
    setStorage('agriman_crops_master', updated);
    return updatedCrop;
  },

  // DELETE /api/Crop/{id} — delete a crop
  deleteCrop: async (id) => {
    await api.delete(`/api/Crop/${id}`);
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const updated = crops.filter(c => Number(c.id) !== Number(id));
    setStorage('agriman_crops_master', updated);
    return true;
  },

  // PATCH /api/Crop/{id}/status — update crop status
  patchCropStatus: async (id, nextStatus) => {
    await api.patch(`/api/Crop/${id}/status`, JSON.stringify(nextStatus), {
      headers: { 'Content-Type': 'application/json' }
    });
    const crops = getStorage('agriman_crops_master', SEED_CROPS);
    const updated = crops.map(c => (Number(c.id) === Number(id) ? { ...c, status: nextStatus } : c));
    setStorage('agriman_crops_master', updated);
    return true;
  },

  // 2. CROP CATEGORIES (Delegated to cropCategoryService)
  getCategories: cropCategoryService.getCategories,
  getCategoryById: cropCategoryService.getCategoryById,
  createCategory: cropCategoryService.createCategory,
  updateCategory: cropCategoryService.updateCategory,
  deleteCategory: cropCategoryService.deleteCategory,

  // 3. CROP VARIETIES (Delegated to cropVarietyService)
  getVarieties: cropVarietyService.getVarieties,
  getVarietyById: cropVarietyService.getVarietyById,
  createVariety: cropVarietyService.createVariety,
  updateVariety: cropVarietyService.updateVariety,
  deleteVariety: cropVarietyService.deleteVariety,

  // 4. CROP SEASONS (Delegated to cropSeasonService)
  getSeasons: cropSeasonService.getSeasons,
  getSeasonById: cropSeasonService.getSeasonById,
  createSeason: cropSeasonService.createSeason,
  updateSeason: cropSeasonService.updateSeason,
  deleteSeason: cropSeasonService.deleteSeason,

  // 5. CROP ACTIVITIES (Delegated to cropActivityService)
  getActivities: cropActivityService.getActivities,
  getActivityById: cropActivityService.getActivityById,
  createActivity: cropActivityService.createActivity,
  updateActivity: cropActivityService.updateActivity,
  deleteActivity: cropActivityService.deleteActivity
};

export default cropService;
