import api from './api.js';

// ─── Normalization Helpers ───────────────────────────────────────────────────
export function normalizeMachine(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    const id = index + 1;
    return {
      id,
      machineCode: `MCH-${String(id).padStart(3, '0')}`,
      machineName: `Machine ${id}`,
      machineType: 'Tractor',
      registrationNo: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
      currentValue: 0,
      fuelType: 'Diesel',
      status: 'Active',
      modelNumber: '',
      manufacturer: '',
      notes: '',
      expenseCount: 0,
      totalExpenses: 0
    };
  }

  const id = raw.id ?? raw.Id ?? index + 1;

  const machineName =
    raw.machineName ||
    raw.machine_name ||
    raw.MachineName ||
    raw.name ||
    raw.Name ||
    `Machine ${id}`;

  const machineCode =
    raw.machineCode ||
    raw.machine_code ||
    raw.MachineCode ||
    raw.code ||
    raw.Code ||
    `MCH-${String(id).padStart(3, '0')}`;

  const machineType =
    raw.machineType ||
    raw.machine_type ||
    raw.MachineType ||
    raw.type ||
    raw.Type ||
    'Tractor';

  const registrationNo = String(
    raw.registrationNo ||
    raw.registration_no ||
    raw.RegistrationNo ||
    raw.regNo ||
    raw.reg_no ||
    ''
  ).toUpperCase();

  const purchaseDate =
    raw.purchaseDate ||
    raw.purchase_date ||
    raw.PurchaseDate ||
    raw.date ||
    new Date().toISOString().split('T')[0];

  const purchaseCost = Number(
    raw.purchaseCost !== undefined
      ? raw.purchaseCost
      : raw.purchase_cost !== undefined
      ? raw.purchase_cost
      : raw.PurchaseCost !== undefined
      ? raw.PurchaseCost
      : 0
  ) || 0;

  const currentValue = Number(
    raw.currentValue !== undefined
      ? raw.currentValue
      : raw.current_value !== undefined
      ? raw.current_value
      : raw.CurrentValue !== undefined
      ? raw.CurrentValue
      : purchaseCost
  ) || 0;

  const fuelType =
    raw.fuelType ||
    raw.fuel_type ||
    raw.FuelType ||
    'Diesel';

  const status =
    raw.status ||
    raw.Status ||
    (raw.isActive === false ? 'Inactive' : 'Active');

  const modelNumber = String(raw.modelNumber || raw.model_number || raw.ModelNumber || raw.model || '');
  const manufacturer = String(raw.manufacturer || raw.Manufacturer || raw.brand || '');
  const notes = String(raw.notes || raw.Notes || raw.description || '');

  const expenseCount = Number(raw.expenseCount ?? raw.ExpenseCount ?? 0) || 0;
  const totalExpenses = Number(raw.totalExpenses ?? raw.TotalExpenses ?? 0) || 0;

  return {
    ...raw,
    id,
    machineCode,
    machineName,
    machineType,
    registrationNo,
    purchaseDate: typeof purchaseDate === 'string' ? purchaseDate.split('T')[0] : purchaseDate,
    purchaseCost,
    currentValue,
    fuelType,
    status,
    modelNumber,
    manufacturer,
    notes,
    expenseCount,
    totalExpenses
  };
}

export function normalizeExpense(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    const id = index + 1;
    return {
      id,
      machineryId: null,
      machineName: 'General Farm Machinery',
      expenseType: 'Fuel',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      operator: '',
      remarks: ''
    };
  }

  const id = raw.id ?? raw.Id ?? index + 1;
  const machineryId = raw.machineryId ?? raw.MachineryId ?? null;
  const machineName = raw.machineName || raw.MachineName || raw.machine_name || 'Machine';
  const expenseType = raw.expenseType || raw.ExpenseType || raw.expense_type || 'Fuel';
  const rawDate = raw.date || raw.Date || raw.expenseDate || new Date().toISOString().split('T')[0];
  const date = typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate;
  const amount = Number(raw.amount ?? raw.Amount ?? 0) || 0;
  const operator = String(raw.operator || raw.Operator || '');
  const remarks = String(raw.remarks || raw.Remarks || raw.notes || '');

  return {
    ...raw,
    id,
    machineryId,
    machineName,
    expenseType,
    date,
    amount,
    operator,
    remarks
  };
}

// ─── Default Realistic Seed Data ─────────────────────────────────────────────
export const SEED_MACHINERY = [
  {
    id: 1,
    machineCode: 'MCH-001',
    machineName: 'Mahindra 575 DI Tractor',
    machineType: 'Tractor',
    registrationNo: 'AP 16 CZ 4521',
    purchaseDate: '2022-04-15',
    purchaseCost: 750000,
    currentValue: 610000,
    fuelType: 'Diesel',
    status: 'Active',
    modelNumber: '575 DI (45 HP)',
    manufacturer: 'Mahindra & Mahindra',
    notes: 'Primary farm tractor for ploughing, rotavating, and trailer haulage',
    expenseCount: 2,
    totalExpenses: 5400
  },
  {
    id: 2,
    machineCode: 'MCH-002',
    machineName: 'VST Shakti 130 DI Power Tiller',
    machineType: 'Power Tiller',
    registrationNo: 'AP 16 TL 8812',
    purchaseDate: '2023-01-20',
    purchaseCost: 225000,
    currentValue: 195000,
    fuelType: 'Diesel',
    status: 'Active',
    modelNumber: '130 DI (13 HP)',
    manufacturer: 'VST Tillers Tractors Ltd',
    notes: 'Used for wet paddy puddle preparation and secondary tilling',
    expenseCount: 1,
    totalExpenses: 1800
  },
  {
    id: 3,
    machineCode: 'MCH-003',
    machineName: 'Honda F300 Power Weeder',
    machineType: 'Power Weeder',
    registrationNo: 'AP 16 PW 1042',
    purchaseDate: '2023-06-10',
    purchaseCost: 58000,
    currentValue: 48000,
    fuelType: 'Petrol',
    status: 'Active',
    modelNumber: 'F300 4-Stroke OHV',
    manufacturer: 'Honda India Power Products',
    notes: 'Inter-row de-weeding in Chilli, Cotton and vegetable parcels',
    expenseCount: 1,
    totalExpenses: 650
  },
  {
    id: 4,
    machineCode: 'MCH-004',
    machineName: 'Aspee HTP Tractor Mounted Sprayer',
    machineType: 'Sprayer',
    registrationNo: 'AP 16 SP 3390',
    purchaseDate: '2021-11-05',
    purchaseCost: 115000,
    currentValue: 85000,
    fuelType: 'PTO Driven',
    status: 'Under Maintenance',
    modelNumber: 'HTP 50 Bar Triple Piston',
    manufacturer: 'Aspee Group',
    notes: 'Scheduled for pressure regulator valve replacement and filter renewal',
    expenseCount: 1,
    totalExpenses: 3200
  },
  {
    id: 5,
    machineCode: 'MCH-005',
    machineName: 'Preet 987 Multi-Crop Combine Harvester',
    machineType: 'Harvester',
    registrationNo: 'AP 07 HV 9901',
    purchaseDate: '2020-10-18',
    purchaseCost: 2450000,
    currentValue: 1780000,
    fuelType: 'Diesel',
    status: 'Active',
    modelNumber: 'Preet 987 Deluxe (101 HP)',
    manufacturer: 'Preet Agro Industries',
    notes: 'Paddy and wheat harvesting with 14-foot cutter bar',
    expenseCount: 2,
    totalExpenses: 14500
  },
  {
    id: 6,
    machineCode: 'MCH-006',
    machineName: 'Shaktiman Semi Champion Rotavator',
    machineType: 'Rotavator',
    registrationNo: 'AP 16 RT 2245',
    purchaseDate: '2022-08-25',
    purchaseCost: 135000,
    currentValue: 110000,
    fuelType: 'PTO Driven',
    status: 'Active',
    modelNumber: 'Semi Champion 48-Blade (6ft)',
    manufacturer: 'Shaktiman (Tirth Agro)',
    notes: 'Secondary tillage implement with multi-speed gearbox',
    expenseCount: 1,
    totalExpenses: 1200
  },
  {
    id: 7,
    machineCode: 'MCH-007',
    machineName: 'KisanKraft KK-BPS-500 Battery Sprayer',
    machineType: 'Sprayer',
    registrationNo: 'AP 16 BS 7712',
    purchaseDate: '2024-02-14',
    purchaseCost: 6500,
    currentValue: 5800,
    fuelType: 'Battery / Electric',
    status: 'Inactive',
    modelNumber: '12V 12Ah Knapsack 16L',
    manufacturer: 'KisanKraft Machine Tools',
    notes: 'Auxiliary knapsack unit kept on standby in store room',
    expenseCount: 0,
    totalExpenses: 0
  }
];

export const SEED_EXPENSES = [
  {
    id: 1,
    machineryId: 1,
    machineName: 'Mahindra 575 DI Tractor',
    expenseType: 'Fuel',
    date: '2026-11-12',
    amount: 3200,
    operator: 'Ramesh Reddy',
    remarks: '40L Diesel refill for paddy field ploughing'
  },
  {
    id: 2,
    machineryId: 1,
    machineName: 'Mahindra 575 DI Tractor',
    expenseType: 'Maintenance',
    date: '2026-11-05',
    amount: 2200,
    operator: 'Srinivas Service Workshop',
    remarks: 'Engine oil and dual oil filters renewal'
  },
  {
    id: 3,
    machineryId: 2,
    machineName: 'VST Shakti 130 DI Power Tiller',
    expenseType: 'Fuel',
    date: '2026-11-10',
    amount: 1800,
    operator: 'Venkataiah',
    remarks: 'Diesel batch for puddling preparation'
  },
  {
    id: 4,
    machineryId: 3,
    machineName: 'Honda F300 Power Weeder',
    expenseType: 'Fuel',
    date: '2026-11-15',
    amount: 650,
    operator: 'Anji',
    remarks: '6L Petrol refill for chilli inter-row weed clearance'
  },
  {
    id: 5,
    machineryId: 4,
    machineName: 'Aspee HTP Tractor Mounted Sprayer',
    expenseType: 'Repair & Spare Parts',
    date: '2026-11-14',
    amount: 3200,
    operator: 'Sri Lakshmi Agri Spares',
    remarks: 'HTP triple-piston valve kit replacement and 50m hose overhaul'
  },
  {
    id: 6,
    machineryId: 5,
    machineName: 'Preet 987 Multi-Crop Combine Harvester',
    expenseType: 'Fuel',
    date: '2026-11-02',
    amount: 8500,
    operator: 'Gurpreet Singh',
    remarks: '100L High-speed diesel for parcel harvesting'
  },
  {
    id: 7,
    machineryId: 5,
    machineName: 'Preet 987 Multi-Crop Combine Harvester',
    expenseType: 'Operator Wages',
    date: '2026-11-03',
    amount: 6000,
    operator: 'Gurpreet Singh',
    remarks: 'Harvesting operator wages for 3-day paddy cutting'
  },
  {
    id: 8,
    machineryId: 6,
    machineName: 'Shaktiman Semi Champion Rotavator',
    expenseType: 'Maintenance',
    date: '2026-10-28',
    amount: 1200,
    operator: 'Workshop Vijayawada',
    remarks: 'Rotavator gearbox gear oil 90EP replacement'
  }
];

export const SEED_EXPENSE_TYPES = [
  { id: 1, code: 'FUEL', name: 'Fuel', description: 'Diesel, petrol, electric charging, and lubricants for farm machinery', isActive: true },
  { id: 2, code: 'MAINTENANCE', name: 'Maintenance', description: 'Scheduled servicing, oil change, filter replacement, and routine checks', isActive: true },
  { id: 3, code: 'REPAIR', name: 'Repair & Spare Parts', description: 'Breakdown repairs, spare parts, tyres, and workshop labour', isActive: true },
  { id: 4, code: 'OPERATOR_WAGES', name: 'Operator Wages', description: 'Driver and machinery operator daily or monthly wages', isActive: true },
  { id: 5, code: 'INSURANCE', name: 'Insurance & Registration', description: 'Machinery insurance premiums, permits, and registration renewals', isActive: true },
  { id: 6, code: 'OTHER', name: 'Other', description: 'Miscellaneous machinery operating and handling expenses', isActive: true }
];

export const SEED_LOOKUPS = {
  machineTypes: [
    'Tractor',
    'Harvester',
    'Rotavator',
    'Cultivator',
    'Plough',
    'Seeder',
    'Sprayer',
    'Thresher',
    'Water Pump',
    'Trailer',
    'Power Tiller',
    'Power Weeder',
    'Other'
  ],
  fuelTypes: [
    'Diesel',
    'Petrol',
    'Electric',
    'Battery / Electric',
    'PTO Driven',
    'CNG',
    'Hybrid',
    'None'
  ],
  statuses: [
    'Active',
    'Under Maintenance',
    'Idle',
    'Inactive',
    'Out of Service',
    'Sold'
  ],
  expenseTypes: SEED_EXPENSE_TYPES
};

// ─── Storage Helpers ────────────────────────────────────────────────────────
const STORAGE_KEY_MACHINERY = 'agriman_machinery_data';
const STORAGE_KEY_EXPENSES = 'agriman_machinery_expenses';

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`[machineryService] Error reading ${key}:`, e);
  }
  return fallback;
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[machineryService] Error writing ${key}:`, e);
  }
}

// ─── Machinery & Equipment Service ──────────────────────────────────────────
export const machineryService = {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. MACHINERY CRUD ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/Machinery
   * Query parameters supported: search, machineType, fuelType, status
   */
  getMachinery: async (params = {}) => {
    try {
      const queryParams = {};
      if (params.search) queryParams.search = params.search;
      if (params.machineType && params.machineType !== 'All') queryParams.machineType = params.machineType;
      if (params.fuelType && params.fuelType !== 'All') queryParams.fuelType = params.fuelType;
      if (params.status && params.status !== 'All') queryParams.status = params.status;

      const res = await api.get('/api/Machinery', { params: queryParams });
      const rawData =
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.Items)
          ? res.data.Items
          : Array.isArray(res.data?.data)
          ? res.data.data
          : null;

      if (Array.isArray(rawData) && rawData.length > 0) {
        const normalized = rawData.map((item, idx) => normalizeMachine(item, idx));
        // Cache full list if no filters applied
        if (!params.search && !params.machineType && !params.fuelType && !params.status) {
          writeStorage(STORAGE_KEY_MACHINERY, normalized);
        }
        return normalized;
      }
    } catch (err) {
      console.warn('[machineryService] GET /api/Machinery failed or offline, using fallback:', err.message);
    }

    // Local persistent storage fallback
    let list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map((item, idx) => normalizeMachine(item, idx));
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((m) =>
        (m.machineName || '').toLowerCase().includes(term) ||
        (m.registrationNo || '').toLowerCase().includes(term) ||
        (m.machineCode || '').toLowerCase().includes(term)
      );
    }
    if (params.machineType && params.machineType !== 'All') {
      list = list.filter((m) => m.machineType === params.machineType);
    }
    if (params.fuelType && params.fuelType !== 'All') {
      list = list.filter((m) => m.fuelType === params.fuelType);
    }
    if (params.status && params.status !== 'All') {
      list = list.filter((m) => m.status === params.status);
    }
    return list;
  },

  /**
   * GET /api/Machinery/{id}
   */
  getMachineById: async (id) => {
    try {
      const res = await api.get(`/api/Machinery/${id}`);
      const data = res.data?.data || res.data;
      if (data && (data.id || data.Id)) return normalizeMachine(data);
    } catch (err) {
      console.warn(`[machineryService] GET /api/Machinery/${id} failed, using local store:`, err.message);
    }
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    return list.find((m) => String(m.id) === String(id)) || null;
  },

  /**
   * POST /api/Machinery
   */
  createMachine: async (machineData) => {
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const nextId = list.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
    const nextCode = machineryService.generateMachineCode(list);

    const payload = {
      machineName: (machineData.machineName || `Machine ${nextId}`).trim(),
      machineCode: (machineData.machineCode || nextCode).trim(),
      machineType: (machineData.machineType || 'Tractor').trim(),
      registrationNo: machineData.registrationNo ? machineData.registrationNo.trim().toUpperCase() : null,
      purchaseDate: machineData.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCost: Number(machineData.purchaseCost) || 0,
      currentValue: machineData.currentValue !== '' && machineData.currentValue !== undefined
        ? Number(machineData.currentValue)
        : Number(machineData.purchaseCost) || 0,
      fuelType: machineData.fuelType || 'Diesel',
      status: machineData.status || 'Active',
      modelNumber: machineData.modelNumber ? machineData.modelNumber.trim() : null,
      manufacturer: machineData.manufacturer ? machineData.manufacturer.trim() : null,
      notes: machineData.notes ? machineData.notes.trim() : null
    };

    let createdRecord = null;
    try {
      const res = await api.post('/api/Machinery', payload);
      if (res.data) {
        createdRecord = normalizeMachine(res.data);
      }
    } catch (err) {
      console.warn('[machineryService] POST /api/Machinery failed, saving locally:', err.message);
    }

    if (!createdRecord) {
      createdRecord = normalizeMachine({
        ...payload,
        id: nextId
      }, nextId - 1);
    }

    const updated = [createdRecord, ...list.filter((m) => String(m.id) !== String(createdRecord.id))];
    writeStorage(STORAGE_KEY_MACHINERY, updated);
    return createdRecord;
  },

  /**
   * PUT /api/Machinery/{id}
   */
  updateMachine: async (id, machineData) => {
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const existing = list.find((m) => String(m.id) === String(id));
    if (!existing) throw new Error('Machinery record not found');

    const payload = {
      machineName: (machineData.machineName ?? existing.machineName).trim(),
      machineCode: machineData.machineCode || existing.machineCode,
      machineType: (machineData.machineType ?? existing.machineType).trim(),
      registrationNo: machineData.registrationNo !== undefined
        ? (machineData.registrationNo ? machineData.registrationNo.trim().toUpperCase() : null)
        : existing.registrationNo,
      purchaseDate: machineData.purchaseDate || existing.purchaseDate,
      purchaseCost: machineData.purchaseCost !== undefined ? Number(machineData.purchaseCost) : existing.purchaseCost,
      currentValue: machineData.currentValue !== undefined ? Number(machineData.currentValue) : existing.currentValue,
      fuelType: machineData.fuelType ?? existing.fuelType,
      status: machineData.status ?? existing.status,
      modelNumber: machineData.modelNumber !== undefined ? (machineData.modelNumber ? machineData.modelNumber.trim() : null) : existing.modelNumber,
      manufacturer: machineData.manufacturer !== undefined ? (machineData.manufacturer ? machineData.manufacturer.trim() : null) : existing.manufacturer,
      notes: machineData.notes !== undefined ? (machineData.notes ? machineData.notes.trim() : null) : existing.notes
    };

    let updatedRecord = null;
    try {
      const res = await api.put(`/api/Machinery/${id}`, payload);
      if (res.data) {
        updatedRecord = normalizeMachine(res.data);
      }
    } catch (err) {
      console.warn(`[machineryService] PUT /api/Machinery/${id} failed, updating locally:`, err.message);
    }

    if (!updatedRecord) {
      updatedRecord = normalizeMachine({
        ...existing,
        ...payload,
        id: existing.id
      });
    }

    const updatedList = list.map((m) => (String(m.id) === String(id) ? updatedRecord : m));
    writeStorage(STORAGE_KEY_MACHINERY, updatedList);
    return updatedRecord;
  },

  /**
   * DELETE /api/Machinery/{id}
   */
  deleteMachine: async (id) => {
    try {
      await api.delete(`/api/Machinery/${id}`);
    } catch (err) {
      console.warn(`[machineryService] DELETE /api/Machinery/${id} failed, deleting locally:`, err.message);
    }

    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const filtered = list.filter((m) => String(m.id) !== String(id));
    writeStorage(STORAGE_KEY_MACHINERY, filtered);
    return true;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. MACHINERY SUMMARY & LOOKUPS ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/Machinery/summary
   */
  getMachinerySummary: async () => {
    try {
      const res = await api.get('/api/Machinery/summary');
      if (res.data) {
        const d = res.data;
        return {
          totalMachines: d.totalMachines ?? d.TotalMachines ?? 0,
          activeMachines: d.activeMachines ?? d.ActiveMachines ?? 0,
          underMaintenanceMachines: d.underMaintenanceMachines ?? d.UnderMaintenanceMachines ?? 0,
          inactiveMachines: d.inactiveMachines ?? d.InactiveMachines ?? 0,
          totalPurchaseCost: Number(d.totalPurchaseCost ?? d.TotalPurchaseCost ?? 0),
          totalCurrentValue: Number(d.totalCurrentValue ?? d.TotalCurrentValue ?? 0),
          totalExpenseRecords: d.totalExpenseRecords ?? d.TotalExpenseRecords ?? 0,
          totalExpenseAmount: Number(d.totalExpenseAmount ?? d.TotalExpenseAmount ?? 0),
          expenseTypesCount: d.expenseTypesCount ?? d.ExpenseTypesCount ?? 6
        };
      }
    } catch (err) {
      console.warn('[machineryService] GET /api/Machinery/summary failed, computing locally:', err.message);
    }

    // Local compute fallback
    const machines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const expenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    return {
      totalMachines: machines.length,
      activeMachines: machines.filter((m) => m.status === 'Active').length,
      underMaintenanceMachines: machines.filter((m) => m.status === 'Under Maintenance').length,
      inactiveMachines: machines.filter((m) => m.status !== 'Active' && m.status !== 'Under Maintenance').length,
      totalPurchaseCost: machines.reduce((sum, m) => sum + (Number(m.purchaseCost) || 0), 0),
      totalCurrentValue: machines.reduce((sum, m) => sum + (Number(m.currentValue) || 0), 0),
      totalExpenseRecords: expenses.length,
      totalExpenseAmount: expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
      expenseTypesCount: 6
    };
  },

  /**
   * GET /api/Machinery/lookups
   */
  getMachineryLookups: async () => {
    try {
      const res = await api.get('/api/Machinery/lookups');
      if (res.data) {
        const d = res.data;
        return {
          machineTypes: d.machineTypes || d.MachineTypes || SEED_LOOKUPS.machineTypes,
          fuelTypes: d.fuelTypes || d.FuelTypes || SEED_LOOKUPS.fuelTypes,
          statuses: d.statuses || d.Statuses || SEED_LOOKUPS.statuses,
          expenseTypes: d.expenseTypes || d.ExpenseTypes || SEED_LOOKUPS.expenseTypes
        };
      }
    } catch (err) {
      console.warn('[machineryService] GET /api/Machinery/lookups failed, using seed lookups:', err.message);
    }
    return SEED_LOOKUPS;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. MACHINERY SPECIFIC EXPENSES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/Machinery/{machineryId}/expenses
   */
  getExpensesForMachine: async (machineryId) => {
    try {
      const res = await api.get(`/api/Machinery/${machineryId}/expenses`);
      const items = res.data?.items || res.data?.Items || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(items)) {
        return {
          totalExpenseRecords: res.data?.totalExpenseRecords ?? items.length,
          totalAmount: res.data?.totalAmount ?? items.reduce((s, x) => s + (Number(x.amount) || 0), 0),
          items: items.map(normalizeExpense)
        };
      }
    } catch (err) {
      console.warn(`[machineryService] GET /api/Machinery/${machineryId}/expenses failed:`, err.message);
    }

    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const filtered = allExpenses.filter((e) => String(e.machineryId) === String(machineryId));
    return {
      totalExpenseRecords: filtered.length,
      totalAmount: filtered.reduce((s, x) => s + (Number(x.amount) || 0), 0),
      items: filtered
    };
  },

  /**
   * POST /api/Machinery/{machineryId}/expenses
   */
  addExpenseForMachine: async (machineryId, expenseData) => {
    const payload = {
      machineryId: Number(machineryId),
      machineName: expenseData.machineName?.trim(),
      expenseType: (expenseData.expenseType || 'Fuel').trim(),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      amount: Number(expenseData.amount) || 0,
      operator: expenseData.operator ? expenseData.operator.trim() : null,
      remarks: expenseData.remarks ? expenseData.remarks.trim() : null
    };

    let created = null;
    try {
      const res = await api.post(`/api/Machinery/${machineryId}/expenses`, payload);
      if (res.data) {
        created = normalizeExpense(res.data);
      }
    } catch (err) {
      console.warn(`[machineryService] POST /api/Machinery/${machineryId}/expenses failed, saving locally:`, err.message);
    }

    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const nextId = allExpenses.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;

    if (!created) {
      created = normalizeExpense({
        ...payload,
        id: nextId
      });
    }

    const updatedExpenses = [created, ...allExpenses];
    writeStorage(STORAGE_KEY_EXPENSES, updatedExpenses);

    // Sync expense count on machine in local storage
    const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const machineIndex = allMachines.findIndex((m) => String(m.id) === String(machineryId));
    if (machineIndex !== -1) {
      allMachines[machineIndex].expenseCount = (allMachines[machineIndex].expenseCount || 0) + 1;
      allMachines[machineIndex].totalExpenses = (allMachines[machineIndex].totalExpenses || 0) + created.amount;
      writeStorage(STORAGE_KEY_MACHINERY, allMachines);
    }

    return created;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. MACHINERY ROI ANALYTICS ENDPOINT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/Machinery/roi
   */
  getFleetRoi: async () => {
    try {
      const res = await api.get('/api/Machinery/roi');
      const items = res.data?.data || (Array.isArray(res.data) ? res.data : null);
      if (Array.isArray(items) && items.length > 0) {
        return items.map((r) => ({
          id: r.id ?? r.Id,
          machineCode: r.machineCode || r.MachineCode || `MCH-${r.id || 1}`,
          machineName: r.machineName || r.MachineName || 'Machine',
          machineType: r.machineType || r.MachineType || 'Tractor',
          purchaseCost: Number(r.purchaseCost ?? r.PurchaseCost ?? 0),
          currentValue: Number(r.currentValue ?? r.CurrentValue ?? 0),
          status: r.status || r.Status || 'Active',
          totalMaintenanceCost: Number(r.totalMaintenanceCost ?? r.TotalMaintenanceCost ?? 0),
          expenseCount: Number(r.expenseCount ?? r.ExpenseCount ?? 0),
          maintenanceToCostRatio: Number(r.maintenanceToCostRatio ?? r.MaintenanceToCostRatio ?? 0),
          estimatedNetValue: Number(r.estimatedNetValue ?? r.EstimatedNetValue ?? 0)
        }));
      }
    } catch (err) {
      console.warn('[machineryService] GET /api/Machinery/roi failed, computing locally:', err.message);
    }

    // Local compute fallback
    const machines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const expenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);

    return machines.map((m) => {
      const machineExpenses = expenses.filter((e) => String(e.machineryId) === String(m.id));
      const totalMaint = machineExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const ratio = m.purchaseCost > 0 ? Math.round((totalMaint / m.purchaseCost) * 10000) / 100 : 0;
      const netVal = Math.max(0, m.currentValue - totalMaint);
      return {
        id: m.id,
        machineCode: m.machineCode,
        machineName: m.machineName,
        machineType: m.machineType,
        purchaseCost: m.purchaseCost,
        currentValue: m.currentValue,
        status: m.status,
        totalMaintenanceCost: totalMaint,
        expenseCount: machineExpenses.length,
        maintenanceToCostRatio: ratio,
        estimatedNetValue: netVal
      };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. GENERAL MACHINERY EXPENSES ENDPOINTS (/api/machinery-expenses)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/machinery-expenses
   * Query params: search, expenseType, machineryId, fromDate, toDate
   */
  getAllExpenses: async (params = {}) => {
    try {
      const queryParams = {};
      if (params.search) queryParams.search = params.search;
      if (params.expenseType && params.expenseType !== 'All') queryParams.expenseType = params.expenseType;
      if (params.machineryId) queryParams.machineryId = params.machineryId;
      if (params.fromDate) queryParams.fromDate = params.fromDate;
      if (params.toDate) queryParams.toDate = params.toDate;

      const res = await api.get('/api/machinery-expenses', { params: queryParams });
      const items = res.data?.items || res.data?.Items || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(items)) {
        const normalized = items.map(normalizeExpense);
        if (!params.search && !params.expenseType && !params.machineryId && !params.fromDate && !params.toDate) {
          writeStorage(STORAGE_KEY_EXPENSES, normalized);
        }
        return {
          totalExpenseRecords: res.data?.totalExpenseRecords ?? items.length,
          totalAmount: res.data?.totalAmount ?? items.reduce((s, x) => s + (Number(x.amount) || 0), 0),
          items: normalized
        };
      }
    } catch (err) {
      console.warn('[machineryService] GET /api/machinery-expenses failed, using local store:', err.message);
    }

    let list = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((e) =>
        (e.machineName || '').toLowerCase().includes(term) ||
        (e.expenseType || '').toLowerCase().includes(term) ||
        (e.operator || '').toLowerCase().includes(term) ||
        (e.remarks || '').toLowerCase().includes(term)
      );
    }
    if (params.expenseType && params.expenseType !== 'All') {
      list = list.filter((e) => e.expenseType === params.expenseType);
    }
    if (params.machineryId) {
      list = list.filter((e) => String(e.machineryId) === String(params.machineryId));
    }
    if (params.fromDate) {
      list = list.filter((e) => e.date >= params.fromDate);
    }
    if (params.toDate) {
      list = list.filter((e) => e.date <= params.toDate);
    }

    return {
      totalExpenseRecords: list.length,
      totalAmount: list.reduce((s, x) => s + (Number(x.amount) || 0), 0),
      items: list
    };
  },

  /**
   * GET /api/machinery-expenses/types
   */
  getExpenseTypes: async () => {
    try {
      const res = await api.get('/api/machinery-expenses/types');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[machineryService] GET /api/machinery-expenses/types failed, using seed types:', err.message);
    }
    return SEED_EXPENSE_TYPES;
  },

  /**
   * GET /api/machinery-expenses/{id}
   */
  getExpenseById: async (id) => {
    try {
      const res = await api.get(`/api/machinery-expenses/${id}`);
      const data = res.data?.data || res.data;
      if (data && (data.id || data.Id)) return normalizeExpense(data);
    } catch (err) {
      console.warn(`[machineryService] GET /api/machinery-expenses/${id} failed:`, err.message);
    }
    const list = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    return list.find((e) => String(e.id) === String(id)) || null;
  },

  /**
   * POST /api/machinery-expenses
   */
  createExpense: async (expenseData) => {
    const payload = {
      machineryId: expenseData.machineryId ? Number(expenseData.machineryId) : null,
      machineName: expenseData.machineName?.trim(),
      expenseType: (expenseData.expenseType || 'Fuel').trim(),
      date: expenseData.date || new Date().toISOString().split('T')[0],
      amount: Number(expenseData.amount) || 0,
      operator: expenseData.operator ? expenseData.operator.trim() : null,
      remarks: expenseData.remarks ? expenseData.remarks.trim() : null
    };

    let created = null;
    try {
      const res = await api.post('/api/machinery-expenses', payload);
      if (res.data) {
        created = normalizeExpense(res.data);
      }
    } catch (err) {
      console.warn('[machineryService] POST /api/machinery-expenses failed, saving locally:', err.message);
    }

    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const nextId = allExpenses.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;

    if (!created) {
      created = normalizeExpense({
        ...payload,
        id: nextId
      });
    }

    const updatedList = [created, ...allExpenses];
    writeStorage(STORAGE_KEY_EXPENSES, updatedList);
    return created;
  },

  /**
   * PUT /api/machinery-expenses/{id}
   */
  updateExpense: async (id, expenseData) => {
    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const existing = allExpenses.find((e) => String(e.id) === String(id));
    if (!existing) throw new Error('Machinery expense record not found');

    const payload = {
      machineryId: expenseData.machineryId !== undefined ? (expenseData.machineryId ? Number(expenseData.machineryId) : null) : existing.machineryId,
      machineName: (expenseData.machineName ?? existing.machineName).trim(),
      expenseType: (expenseData.expenseType ?? existing.expenseType).trim(),
      date: expenseData.date || existing.date,
      amount: expenseData.amount !== undefined ? Number(expenseData.amount) : existing.amount,
      operator: expenseData.operator !== undefined ? (expenseData.operator ? expenseData.operator.trim() : null) : existing.operator,
      remarks: expenseData.remarks !== undefined ? (expenseData.remarks ? expenseData.remarks.trim() : null) : existing.remarks
    };

    let updated = null;
    try {
      const res = await api.put(`/api/machinery-expenses/${id}`, payload);
      if (res.data) {
        updated = normalizeExpense(res.data);
      }
    } catch (err) {
      console.warn(`[machineryService] PUT /api/machinery-expenses/${id} failed, updating locally:`, err.message);
    }

    if (!updated) {
      updated = normalizeExpense({
        ...existing,
        ...payload,
        id: existing.id
      });
    }

    const updatedList = allExpenses.map((e) => (String(e.id) === String(id) ? updated : e));
    writeStorage(STORAGE_KEY_EXPENSES, updatedList);
    return updated;
  },

  /**
   * DELETE /api/machinery-expenses/{id}
   */
  deleteExpense: async (id) => {
    try {
      await api.delete(`/api/machinery-expenses/${id}`);
    } catch (err) {
      console.warn(`[machineryService] DELETE /api/machinery-expenses/${id} failed:`, err.message);
    }

    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const filtered = allExpenses.filter((e) => String(e.id) !== String(id));
    writeStorage(STORAGE_KEY_EXPENSES, filtered);
    return true;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. UTILITY FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────

  generateMachineCode: (existingList = []) => {
    let maxNum = 0;
    existingList.forEach((m) => {
      const match = (m?.machineCode || '').match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `MCH-${String(maxNum + 1).padStart(3, '0')}`;
  },

  computeMachineryMetrics: (machines = []) => {
    const total = machines.length;
    const active = machines.filter((m) => m.status === 'Active').length;
    const maintenance = machines.filter((m) => m.status === 'Under Maintenance').length;
    const inactive = machines.filter((m) => m.status !== 'Active' && m.status !== 'Under Maintenance').length;

    const totalPurchaseCost = machines.reduce((sum, m) => sum + (Number(m.purchaseCost) || 0), 0);
    const totalCurrentValue = machines.reduce((sum, m) => sum + (Number(m.currentValue) || 0), 0);

    return {
      total,
      active,
      maintenance,
      inactive,
      totalPurchaseCost,
      totalCurrentValue
    };
  }
};

export default machineryService;
