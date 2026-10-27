import api from './api';

const SEED_CATEGORIES = [
  { id: 1, cropCategoryId: 1, code: 'CAT-01', name: 'Cereal', categoryName: 'Cereal', description: 'Grain crops such as rice, wheat, and maize', status: 'Active' },
  { id: 2, cropCategoryId: 2, code: 'CAT-02', name: 'Vegetable', categoryName: 'Vegetable', description: 'Vegetable crops such as tomato and chilli', status: 'Active' }
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
    console.warn(`[cropCategoryService] Error reading ${key} from storage:`, e);
  }
  return Array.isArray(defaultData) ? defaultData : [];
}

function setStorage(key, data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`[cropCategoryService] Error saving ${key} to storage:`, e);
  }
}

export const cropCategoryService = {
  // GET /api/CropCategory — retrieve crop categories
  getCategories: async () => {
    try {
      const response = await api.get('/api/CropCategory');
      const list = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : null);
      if (Array.isArray(list)) {
        const mapped = list.map(cat => ({
          id: cat.cropCategoryId || cat.id,
          cropCategoryId: cat.cropCategoryId || cat.id,
          code: `CAT-${String(cat.cropCategoryId || cat.id).padStart(2, '0')}`,
          name: cat.categoryName || cat.name,
          categoryName: cat.categoryName || cat.name,
          description: cat.description || '',
          status: cat.status || 'Active'
        }));
        setStorage('agriman_crop_categories', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('[cropCategoryService] Backend /api/CropCategory unavailable, using local cache:', err.message);
    }
    return getStorage('agriman_crop_categories', SEED_CATEGORIES);
  },

  // GET /api/CropCategory/{id} — retrieve a category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/api/CropCategory/${id}`);
      const cat = response.data;
      if (cat) {
        return {
          id: cat.cropCategoryId || cat.id,
          cropCategoryId: cat.cropCategoryId || cat.id,
          code: `CAT-${String(cat.cropCategoryId || cat.id).padStart(2, '0')}`,
          name: cat.categoryName || cat.name,
          categoryName: cat.categoryName || cat.name,
          description: cat.description || '',
          status: cat.status || 'Active'
        };
      }
    } catch (err) {
      console.warn(`[cropCategoryService] Backend /api/CropCategory/${id} unavailable:`, err.message);
    }
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    return list.find(c => Number(c.id) === Number(id) || c.code === id) || null;
  },

  // POST /api/CropCategory — create a crop category
  createCategory: async (newCat) => {
    const payload = {
      categoryName: (newCat.name || newCat.categoryName)?.trim(),
      description: (newCat.description || '')?.trim() || null,
      status: newCat.status || 'Active'
    };
    const response = await api.post('/api/CropCategory', payload);
    const res = response.data;
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    const id = res?.cropCategoryId || res?.id || (list.length ? Math.max(...list.map(c => Number(c.id) || 0)) + 1 : 1);
    const record = {
      id,
      cropCategoryId: id,
      code: `CAT-${String(id).padStart(2, '0')}`,
      name: res?.categoryName || payload.categoryName,
      categoryName: res?.categoryName || payload.categoryName,
      description: res?.description || payload.description || '',
      status: res?.status || payload.status
    };
    const updated = [...list.filter(c => c.id !== record.id), record];
    setStorage('agriman_crop_categories', updated);
    return record;
  },

  // PUT /api/CropCategory/{id} — update a category
  updateCategory: async (id, updatedCat) => {
    const payload = {
      cropCategoryId: Number(id),
      categoryName: (updatedCat.name || updatedCat.categoryName)?.trim(),
      description: (updatedCat.description || '')?.trim() || null,
      status: updatedCat.status || 'Active'
    };
    await api.put(`/api/CropCategory/${id}`, payload);
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    const updated = list.map(c => (Number(c.id) === Number(id) ? { ...c, ...updatedCat } : c));
    setStorage('agriman_crop_categories', updated);
    return updatedCat;
  },

  // DELETE /api/CropCategory/{id} — delete a category
  deleteCategory: async (id) => {
    await api.delete(`/api/CropCategory/${id}`);
    const list = getStorage('agriman_crop_categories', SEED_CATEGORIES);
    const updated = list.filter(c => Number(c.id) !== Number(id));
    setStorage('agriman_crop_categories', updated);
    return true;
  }
};

export default cropCategoryService;
