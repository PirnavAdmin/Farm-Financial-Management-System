import api from './api.js';

// ─── Predefined Product Categories (Agricultural Inputs) ──────────────────────
export const SEED_PRODUCT_CATEGORIES = [
  { id: 1, name: 'Seeds', description: 'Agricultural seeds, saplings, and planting materials', isActive: true },
  { id: 2, name: 'Fertilizers', description: 'Organic, chemical, and bio-fertilizers', isActive: true },
  { id: 3, name: 'Pesticides', description: 'Insecticides, fungicides, and weedicides for crop protection', isActive: true },
  { id: 4, name: 'Sprayer chemicals', description: 'Foliar sprays, micronutrients, adjuvants, and wetting agents', isActive: true },
  { id: 5, name: 'Spare parts', description: 'Tractor implements, motor, pump, and farm equipment spares', isActive: true },
  { id: 6, name: 'Other consumables', description: 'Tarpaulins, drip lateral pipes, nursery bags, twine, and farm tools', isActive: true }
];

// ─── Predefined Units of Measurement ──────────────────────────────────────────
export const SEED_UNITS = [
  { id: 1, name: 'Kilograms', shortCode: 'kg', isActive: true },
  { id: 2, name: 'Grams', shortCode: 'g', isActive: true },
  { id: 3, name: 'Litres', shortCode: 'L', isActive: true },
  { id: 4, name: 'Millilitres', shortCode: 'ml', isActive: true },
  { id: 5, name: 'Bags', shortCode: 'bag', isActive: true },
  { id: 6, name: 'Packets', shortCode: 'pkt', isActive: true },
  { id: 7, name: 'Bottles', shortCode: 'btl', isActive: true },
  { id: 8, name: 'Pieces / Numbers', shortCode: 'nos', isActive: true }
];

// ─── Realistic Seed Products Covering All 6 Categories ────────────────────────
export const SEED_PRODUCTS = [
  // 1. Seeds
  {
    id: 1,
    code: 'PRD-001',
    name: 'Paddy Seeds (BPT 5204 - Samba Mahsuri)',
    categoryId: 1,
    categoryName: 'Seeds',
    unitId: 5,
    unitName: 'Bags',
    unitShortCode: 'bag',
    standardCost: 1450.00,
    reorderLevel: 20,
    description: 'High-yielding premium fine-grain paddy seed variety with 135-140 days duration and pest tolerance.',
    status: 'Active',
    isActive: true
  },
  {
    id: 2,
    code: 'PRD-002',
    name: 'Maize Hybrid Seeds (NK 6240)',
    categoryId: 1,
    categoryName: 'Seeds',
    unitId: 6,
    unitName: 'Packets',
    unitShortCode: 'pkt',
    standardCost: 850.00,
    reorderLevel: 15,
    description: 'Drought-tolerant high-yielding yellow corn hybrid seed with strong stalk strength and uniform cob filling.',
    status: 'Active',
    isActive: true
  },
  {
    id: 3,
    code: 'PRD-003',
    name: 'Cotton Bt Seeds (Bollgard II)',
    categoryId: 1,
    categoryName: 'Seeds',
    unitId: 6,
    unitName: 'Packets',
    unitShortCode: 'pkt',
    standardCost: 864.00,
    reorderLevel: 25,
    description: 'Certified genetically enhanced pest-resistant hybrid cotton seeds (450g seed + 120g non-Bt refuge).',
    status: 'Active',
    isActive: true
  },
  {
    id: 4,
    code: 'PRD-004',
    name: 'Sunflower Hybrid Seeds (KBSH-44)',
    categoryId: 1,
    categoryName: 'Seeds',
    unitId: 6,
    unitName: 'Packets',
    unitShortCode: 'pkt',
    standardCost: 720.00,
    reorderLevel: 10,
    description: 'High oil-content (40-42%) sunflower hybrid with high seed-setting percentage across soil conditions.',
    status: 'Active',
    isActive: true
  },

  // 2. Fertilizers
  {
    id: 5,
    code: 'PRD-005',
    name: 'Urea 46% Nitrogen (Neem Coated)',
    categoryId: 2,
    categoryName: 'Fertilizers',
    unitId: 5,
    unitName: 'Bags',
    unitShortCode: 'bag',
    standardCost: 266.50,
    reorderLevel: 50,
    description: 'Slow-release neem coated granular nitrogenous fertilizer in 45kg bag for vegetative crop nutrition.',
    status: 'Active',
    isActive: true
  },
  {
    id: 6,
    code: 'PRD-006',
    name: 'Di-Ammonium Phosphate (DAP 18:46:0)',
    categoryId: 2,
    categoryName: 'Fertilizers',
    unitId: 5,
    unitName: 'Bags',
    unitShortCode: 'bag',
    standardCost: 1350.00,
    reorderLevel: 30,
    description: 'High-analysis complex fertilizer providing both nitrogen and phosphorus for strong early root establishment.',
    status: 'Active',
    isActive: true
  },
  {
    id: 7,
    code: 'PRD-007',
    name: 'Muriate of Potash (MOP 60% K2O)',
    categoryId: 2,
    categoryName: 'Fertilizers',
    unitId: 5,
    unitName: 'Bags',
    unitShortCode: 'bag',
    standardCost: 1700.00,
    reorderLevel: 20,
    description: 'Potassium fertilizer essential for crop grain filling, pest resistance, and drought tolerance (50kg bag).',
    status: 'Active',
    isActive: true
  },
  {
    id: 8,
    code: 'PRD-008',
    name: 'Zinc Sulphate Monohydrate (33% Zn)',
    categoryId: 2,
    categoryName: 'Fertilizers',
    unitId: 1,
    unitName: 'Kilograms',
    unitShortCode: 'kg',
    standardCost: 85.00,
    reorderLevel: 25,
    description: 'Essential micronutrient to cure Khaira disease in paddy and prevent zinc chlorosis in cereals.',
    status: 'Active',
    isActive: true
  },

  // 3. Pesticides
  {
    id: 9,
    code: 'PRD-009',
    name: 'Chlorpyrifos 20% EC',
    categoryId: 3,
    categoryName: 'Pesticides',
    unitId: 3,
    unitName: 'Litres',
    unitShortCode: 'L',
    standardCost: 480.00,
    reorderLevel: 10,
    description: 'Broad-spectrum contact and stomach insecticide for soil termites, stem borers, and leaf folders.',
    status: 'Active',
    isActive: true
  },
  {
    id: 10,
    code: 'PRD-010',
    name: 'Imidacloprid 17.8% SL',
    categoryId: 3,
    categoryName: 'Pesticides',
    unitId: 7,
    unitName: 'Bottles',
    unitShortCode: 'btl',
    standardCost: 320.00,
    reorderLevel: 15,
    description: 'Systemic neonicotinoid insecticide for piercing and sucking pests such as aphids, jassids, and thrips (250ml).',
    status: 'Active',
    isActive: true
  },
  {
    id: 11,
    code: 'PRD-011',
    name: 'Mancozeb 75% WP (Contact Fungicide)',
    categoryId: 3,
    categoryName: 'Pesticides',
    unitId: 1,
    unitName: 'Kilograms',
    unitShortCode: 'kg',
    standardCost: 380.00,
    reorderLevel: 12,
    description: 'Protective broad-spectrum dithiocarbamate fungicide for early blight, late blight, and downy mildew control.',
    status: 'Active',
    isActive: true
  },

  // 4. Sprayer chemicals
  {
    id: 12,
    code: 'PRD-012',
    name: 'Chelated Micronutrient Foliar Spray',
    categoryId: 4,
    categoryName: 'Sprayer chemicals',
    unitId: 3,
    unitName: 'Litres',
    unitShortCode: 'L',
    standardCost: 350.00,
    reorderLevel: 10,
    description: 'Liquid multi-micronutrient spray formula (Zn, Fe, Mn, Cu, B, Mo) for rapid crop foliage absorption.',
    status: 'Active',
    isActive: true
  },
  {
    id: 13,
    code: 'PRD-013',
    name: 'Spreader & Non-Ionic Wetting Agent',
    categoryId: 4,
    categoryName: 'Sprayer chemicals',
    unitId: 7,
    unitName: 'Bottles',
    unitShortCode: 'btl',
    standardCost: 220.00,
    reorderLevel: 15,
    description: 'Agricultural silicone spray adjuvant providing uniform canopy coverage and rain-fastness (500ml).',
    status: 'Active',
    isActive: true
  },

  // 5. Spare parts
  {
    id: 14,
    code: 'PRD-014',
    name: 'Tractor MB Plough Share Point',
    categoryId: 5,
    categoryName: 'Spare parts',
    unitId: 8,
    unitName: 'Pieces / Numbers',
    unitShortCode: 'nos',
    standardCost: 650.00,
    reorderLevel: 8,
    description: 'Forged high-carbon hardened steel reversible bar point for disc and mouldboard tractor ploughs.',
    status: 'Active',
    isActive: true
  },
  {
    id: 15,
    code: 'PRD-015',
    name: 'Sprayer Brass Nozzle Kit (Triple Hole)',
    categoryId: 5,
    categoryName: 'Spare parts',
    unitId: 8,
    unitName: 'Pieces / Numbers',
    unitShortCode: 'nos',
    standardCost: 280.00,
    reorderLevel: 10,
    description: 'High-pressure misting brass nozzle assembly kit compatible with knapsack and tractor-mounted sprayers.',
    status: 'Active',
    isActive: true
  },

  // 6. Other consumables
  {
    id: 16,
    code: 'PRD-016',
    name: 'HDPE Tarpaulin Sheet (24 x 18 ft)',
    categoryId: 6,
    categoryName: 'Other consumables',
    unitId: 8,
    unitName: 'Pieces / Numbers',
    unitShortCode: 'nos',
    standardCost: 1850.00,
    reorderLevel: 5,
    description: '100% waterproof heavy-duty 250 GSM laminated polyethylene sheet with reinforced aluminum eyelets.',
    status: 'Active',
    isActive: true
  },
  {
    id: 17,
    code: 'PRD-017',
    name: 'Drip Irrigation Lateral Pipe (16mm, 400m)',
    categoryId: 6,
    categoryName: 'Other consumables',
    unitId: 8,
    unitName: 'Pieces / Numbers',
    unitShortCode: 'nos',
    standardCost: 2400.00,
    reorderLevel: 4,
    description: 'Class-2 virgin polymer UV-stabilized inline drip tube roll with 40cm dripper spacing for horticultural crops.',
    status: 'Active',
    isActive: true
  },
  {
    id: 18,
    code: 'PRD-018',
    name: 'Poly Nursery Grow Bags (10x12 inch)',
    categoryId: 6,
    categoryName: 'Other consumables',
    unitId: 6,
    unitName: 'Packets',
    unitShortCode: 'pkt',
    standardCost: 180.00,
    reorderLevel: 8,
    description: 'UV-treated perforated black polyethylene seedling bags for horticulture and tree sapling propagation (100 pcs/pkt).',
    status: 'Inactive',
    isActive: false
  }
];

// ─── Storage Helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY_PRODUCTS = 'agriman_products_catalog';
const STORAGE_KEY_CATEGORIES = 'agriman_product_categories';
const STORAGE_KEY_UNITS = 'agriman_units_catalog';

function getStorage(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((item) => item && typeof item === 'object');
      }
    }
  } catch (e) {
    console.warn(`[productService] Error reading ${key} from storage:`, e);
  }
  return Array.isArray(defaultData) ? defaultData : [];
}

function setStorage(key, data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`[productService] Error saving ${key} to storage:`, e);
  }
}

// ─── Normalizer ───────────────────────────────────────────────────────────────
export function normalizeProduct(raw, index = 0, categories = SEED_PRODUCT_CATEGORIES, units = SEED_UNITS) {
  if (!raw || typeof raw !== 'object') {
    const id = index + 1;
    return {
      id,
      code: `PRD-${String(id).padStart(3, '0')}`,
      name: `Product ${id}`,
      categoryId: 1,
      categoryName: 'Seeds',
      unitId: 5,
      unitName: 'Bags',
      unitShortCode: 'bag',
      standardCost: 0,
      reorderLevel: 0,
      description: '',
      status: 'Active',
      isActive: true
    };
  }

  const id = raw.id || raw.productId || raw.Id || index + 1;
  const code = String(raw.code || raw.productCode || raw.Code || `PRD-${String(id).padStart(3, '0')}`).trim();
  const name = String(raw.name || raw.productName || raw.Name || `Product ${id}`).trim();

  // Category resolution
  let categoryId = Number(raw.categoryId || raw.CategoryId || raw.category?.id || 1);
  let categoryName = String(raw.categoryName || raw.category?.name || raw.category || '');
  if (!categoryName && categories.length > 0) {
    const foundCat = categories.find((c) => c.id === categoryId);
    if (foundCat) categoryName = foundCat.name;
    else categoryName = 'Seeds';
  } else if (!categoryName) {
    categoryName = 'Seeds';
  }

  // Unit resolution
  let unitId = Number(raw.unitId || raw.UnitId || raw.units?.id || raw.unit?.id || 5);
  let unitName = String(raw.unitName || raw.units?.name || raw.unit?.name || raw.unit || '');
  let unitShortCode = String(raw.unitShortCode || raw.units?.shortCode || raw.unit?.shortCode || '');
  if (!unitName && units.length > 0) {
    const foundUnit = units.find((u) => u.id === unitId);
    if (foundUnit) {
      unitName = foundUnit.name;
      unitShortCode = foundUnit.shortCode;
    } else {
      unitName = 'Bags';
      unitShortCode = 'bag';
    }
  } else if (!unitName) {
    unitName = 'Bags';
    unitShortCode = 'bag';
  }

  const standardCost = Number(raw.standardCost ?? raw.StandardCost ?? raw.cost ?? 0) || 0;
  const reorderLevel = Number(raw.reorderLevel ?? raw.ReorderLevel ?? raw.minimumStockLevel ?? 0) || 0;
  const description = String(raw.description || raw.Description || raw.notes || raw.remarks || '').trim();

  // Status resolution
  let isActive = true;
  if (raw.isActive !== undefined) isActive = Boolean(raw.isActive);
  else if (raw.IsActive !== undefined) isActive = Boolean(raw.IsActive);
  else if (raw.status !== undefined) isActive = raw.status === 'Active';

  const status = isActive ? 'Active' : 'Inactive';

  return {
    id,
    code,
    name,
    categoryId,
    categoryName,
    unitId,
    unitName,
    unitShortCode,
    standardCost,
    reorderLevel,
    description,
    status,
    isActive
  };
}

export function generateProductCode(productsList = []) {
  let maxNum = 0;
  for (const p of productsList) {
    const m = (p.code || '').match(/PRD-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `PRD-${String(maxNum + 1).padStart(3, '0')}`;
}

// ─── Product Service Implementation ───────────────────────────────────────────
export const productService = {
  // 1. Get Categories
  getCategories: async () => {
    try {
      const response = await api.get('/api/Products/categories');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        setStorage(STORAGE_KEY_CATEGORIES, data);
        return data;
      }
    } catch {
      // Backend offline or fallback
    }
    return getStorage(STORAGE_KEY_CATEGORIES, SEED_PRODUCT_CATEGORIES);
  },

  // 2. Get Units
  getUnits: async () => {
    try {
      const response = await api.get('/api/Products/units');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        setStorage(STORAGE_KEY_UNITS, data);
        return data;
      }
    } catch {
      // Backend offline or fallback
    }
    return getStorage(STORAGE_KEY_UNITS, SEED_UNITS);
  },

  // 3. Get Products List with Optional Category and Search Filters
  getProducts: async ({ categoryId, search, status } = {}) => {
    const categories = await productService.getCategories();
    const units = await productService.getUnits();
    let backendRecords = null;

    try {
      const params = {};
      if (categoryId && categoryId !== 'All') params.categoryId = categoryId;
      if (search && search.trim()) params.search = search.trim();

      const response = await api.get('/api/Products', { params, timeout: 3500 });
      const rawList = Array.isArray(response.data) ? response.data : response.data?.data;
      if (Array.isArray(rawList)) {
        backendRecords = rawList.map((item, idx) => normalizeProduct(item, idx, categories, units));
      }
    } catch {
      // Backend offline or endpoint returned error; gracefully use local cache
    }

    let records;
    if (backendRecords && backendRecords.length > 0) {
      records = backendRecords;
      setStorage(STORAGE_KEY_PRODUCTS, records);
    } else {
      records = getStorage(STORAGE_KEY_PRODUCTS, SEED_PRODUCTS).map((item, idx) =>
        normalizeProduct(item, idx, categories, units)
      );
      // Ensure seed records exist if empty
      if (records.length === 0) {
        records = SEED_PRODUCTS;
        setStorage(STORAGE_KEY_PRODUCTS, records);
      }
    }

    // Apply in-memory filters if needed
    let result = records;
    if (categoryId && categoryId !== 'All') {
      result = result.filter(
        (p) => String(p.categoryId) === String(categoryId) || p.categoryName?.toLowerCase() === String(categoryId).toLowerCase()
      );
    }
    if (status && status !== 'All') {
      result = result.filter((p) => p.status?.toLowerCase() === status.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    return result;
  },

  // 4. Get Single Product by ID
  getProductById: async (id) => {
    try {
      const response = await api.get(`/api/Products/${id}`);
      if (response.data) {
        const categories = await productService.getCategories();
        const units = await productService.getUnits();
        return normalizeProduct(response.data, 0, categories, units);
      }
    } catch {
      // Fallback to local storage
    }
    const list = getStorage(STORAGE_KEY_PRODUCTS, SEED_PRODUCTS);
    return list.find((p) => String(p.id) === String(id)) || null;
  },

  // 5. Create Product
  createProduct: async (productData) => {
    const categories = await productService.getCategories();
    const units = await productService.getUnits();
    const existingList = getStorage(STORAGE_KEY_PRODUCTS, SEED_PRODUCTS);

    const trimmedCode = (productData.code || generateProductCode(existingList)).trim();
    const trimmedName = (productData.name || '').trim();

    if (!trimmedCode) throw new Error('Product code is required.');
    if (!trimmedName || trimmedName.length < 2) throw new Error('Product name is required (min 2 characters).');

    // Duplicate check
    const isDuplicate = existingList.some(
      (p) => p.code?.trim().toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`A product with code "${trimmedCode}" already exists. Please choose a unique code.`);
    }

    const categoryId = Number(productData.categoryId) || 1;
    const unitId = Number(productData.unitId) || 5;
    const catObj = categories.find((c) => c.id === categoryId) || categories[0];
    const unitObj = units.find((u) => u.id === unitId) || units[0];

    const payload = {
      code: trimmedCode,
      name: trimmedName,
      categoryId,
      unitId,
      reorderLevel: Number(productData.reorderLevel) || 0,
      standardCost: Number(productData.standardCost) || 0,
      initialStock: 0,
      storageLocation: 'Main Warehouse'
    };

    let created = null;
    try {
      const response = await api.post('/api/Products', payload);
      if (response.data) {
        created = normalizeProduct(
          { ...response.data, description: productData.description || '' },
          0,
          categories,
          units
        );
      }
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // If network fails, proceed with local persistence
    }

    if (!created) {
      const nextId = Math.max(0, ...existingList.map((p) => Number(p.id) || 0)) + 1;
      created = {
        id: nextId,
        code: trimmedCode,
        name: trimmedName,
        categoryId,
        categoryName: catObj?.name || 'Seeds',
        unitId,
        unitName: unitObj?.name || 'Bags',
        unitShortCode: unitObj?.shortCode || 'bag',
        standardCost: Number(productData.standardCost) || 0,
        reorderLevel: Number(productData.reorderLevel) || 0,
        description: (productData.description || '').trim(),
        status: productData.status || 'Active',
        isActive: productData.status !== 'Inactive'
      };
    } else {
      created.description = (productData.description || '').trim();
      created.status = productData.status || 'Active';
      created.isActive = productData.status !== 'Inactive';
    }

    const updatedList = [created, ...existingList];
    setStorage(STORAGE_KEY_PRODUCTS, updatedList);
    return created;
  },

  // 6. Update Product
  updateProduct: async (id, productData) => {
    const categories = await productService.getCategories();
    const units = await productService.getUnits();
    const existingList = getStorage(STORAGE_KEY_PRODUCTS, SEED_PRODUCTS);

    const trimmedCode = (productData.code || '').trim();
    const trimmedName = (productData.name || '').trim();

    if (!trimmedName || trimmedName.length < 2) throw new Error('Product name is required (min 2 characters).');

    // Duplicate code check across other products
    if (trimmedCode) {
      const isDuplicate = existingList.some(
        (p) => String(p.id) !== String(id) && p.code?.trim().toLowerCase() === trimmedCode.toLowerCase()
      );
      if (isDuplicate) {
        throw new Error(`A product with code "${trimmedCode}" already exists. Please choose a unique code.`);
      }
    }

    const categoryId = Number(productData.categoryId) || 1;
    const unitId = Number(productData.unitId) || 5;
    const catObj = categories.find((c) => c.id === categoryId) || categories[0];
    const unitObj = units.find((u) => u.id === unitId) || units[0];

    const isActive = productData.status !== 'Inactive';

    const payload = {
      code: trimmedCode,
      name: trimmedName,
      categoryId,
      unitId,
      reorderLevel: Number(productData.reorderLevel) || 0,
      standardCost: Number(productData.standardCost) || 0,
      isActive
    };

    let updated = null;
    try {
      const response = await api.put(`/api/Products/${id}`, payload);
      if (response.data) {
        updated = normalizeProduct(
          { ...response.data, description: productData.description || '' },
          0,
          categories,
          units
        );
      }
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // If network fails, update local cache
    }

    if (!updated) {
      const existing = existingList.find((p) => String(p.id) === String(id));
      updated = {
        ...(existing || {}),
        id: Number(id),
        code: trimmedCode || existing?.code || `PRD-${id}`,
        name: trimmedName,
        categoryId,
        categoryName: catObj?.name || existing?.categoryName || 'Seeds',
        unitId,
        unitName: unitObj?.name || existing?.unitName || 'Bags',
        unitShortCode: unitObj?.shortCode || existing?.unitShortCode || 'bag',
        standardCost: Number(productData.standardCost) || 0,
        reorderLevel: Number(productData.reorderLevel) || 0,
        description: (productData.description ?? existing?.description ?? '').trim(),
        status: isActive ? 'Active' : 'Inactive',
        isActive
      };
    } else {
      updated.description = (productData.description || '').trim();
      updated.status = isActive ? 'Active' : 'Inactive';
      updated.isActive = isActive;
    }

    const updatedList = existingList.map((p) => (String(p.id) === String(id) ? updated : p));
    setStorage(STORAGE_KEY_PRODUCTS, updatedList);
    return updated;
  },

  // 7. Delete / Safe Deactivate Product
  deleteProduct: async (id, { forceDeactivate = false } = {}) => {
    const existingList = getStorage(STORAGE_KEY_PRODUCTS, SEED_PRODUCTS);
    const target = existingList.find((p) => String(p.id) === String(id));

    let isDeactivated = forceDeactivate;
    let message = 'Product deleted successfully.';

    try {
      const response = await api.delete(`/api/Products/${id}`);
      if (response.data?.deactivated) {
        isDeactivated = true;
        message = response.data.message || 'Product has been safely deactivated to protect record history.';
      }
    } catch {
      // Local fallback: if requested or safe deactivation
    }

    let updatedList;
    if (isDeactivated || target?.status === 'Active') {
      // Safe deactivation
      updatedList = existingList.map((p) =>
        String(p.id) === String(id) ? { ...p, status: 'Inactive', isActive: false } : p
      );
      message = 'Product safely deactivated. Existing records and references are preserved.';
    } else {
      // Hard delete from active catalog
      updatedList = existingList.filter((p) => String(p.id) !== String(id));
    }

    setStorage(STORAGE_KEY_PRODUCTS, updatedList);
    return { success: true, message, deactivated: isDeactivated };
  }
};

export default productService;
