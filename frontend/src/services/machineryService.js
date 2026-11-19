import api from './api.js';

// ─── Normalization Helper ───────────────────────────────────────────────────
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
      notes: ''
    };
  }

  const machineName =
    raw.machineName ||
    raw.machine_name ||
    raw.MachineName ||
    raw.name ||
    raw.Name ||
    `Machine ${raw.id || index + 1}`;

  const machineCode =
    raw.machineCode ||
    raw.machine_code ||
    raw.MachineCode ||
    raw.code ||
    raw.Code ||
    `MCH-${String(raw.id || index + 1).padStart(3, '0')}`;

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

  return {
    ...raw,
    id: raw.id ?? raw.Id ?? index + 1,
    machineCode,
    machineName,
    machineType,
    registrationNo,
    purchaseDate,
    purchaseCost,
    currentValue,
    fuelType,
    status,
    modelNumber,
    manufacturer,
    notes
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
    notes: 'Primary farm tractor for ploughing, rotavating, and trailer haulage'
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
    notes: 'Used for wet paddy puddle preparation and secondary tilling'
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
    notes: 'Inter-row de-weeding in Chilli, Cotton and vegetable parcels'
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
    notes: 'Scheduled for pressure regulator valve replacement and filter renewal'
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
    notes: 'Paddy and wheat harvesting with 14-foot cutter bar'
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
    notes: 'Secondary tillage implement with multi-speed gearbox'
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
    notes: 'Auxiliary knapsack unit kept on standby in store room'
  }
];

// ─── Storage Helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = 'agriman_machinery_data';

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

// ─── Machinery Service ───────────────────────────────────────────────────────
export const machineryService = {
  getMachinery: async () => {
    try {
      const res = await api.get('/api/Machinery');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : null;

      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map((item, idx) => normalizeMachine(item, idx));
        writeStorage(STORAGE_KEY, normalized);
        return normalized;
      }
    } catch {
      // Backend route offline or not implemented yet, fallback to persistent local store
    }
    const rawList = readStorage(STORAGE_KEY, SEED_MACHINERY);
    return rawList.map((item, idx) => normalizeMachine(item, idx));
  },

  getMachineById: async (id) => {
    try {
      const res = await api.get(`/api/Machinery/${id}`);
      const data = res.data?.data || res.data;
      if (data && (data.id || data.Id)) return normalizeMachine(data);
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEY, SEED_MACHINERY).map(normalizeMachine);
    return list.find((m) => String(m.id) === String(id)) || null;
  },

  createMachine: async (machineData) => {
    const list = readStorage(STORAGE_KEY, SEED_MACHINERY).map(normalizeMachine);
    const nextId = list.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
    const nextCode = machineryService.generateMachineCode(list);

    const newMachine = normalizeMachine({
      ...machineData,
      id: nextId,
      machineCode: machineData.machineCode?.trim() || nextCode,
      machineName: machineData.machineName?.trim() || `Machine ${nextId}`,
      purchaseCost: Number(machineData.purchaseCost) || 0,
      currentValue: machineData.currentValue !== '' && machineData.currentValue !== undefined
        ? Number(machineData.currentValue)
        : Number(machineData.purchaseCost) || 0
    }, nextId - 1);

    try {
      await api.post('/api/Machinery', newMachine);
    } catch {
      // Persisted in local store
    }

    const updated = [newMachine, ...list];
    writeStorage(STORAGE_KEY, updated);
    return newMachine;
  },

  updateMachine: async (id, machineData) => {
    const list = readStorage(STORAGE_KEY, SEED_MACHINERY).map(normalizeMachine);
    const index = list.findIndex((m) => String(m.id) === String(id));
    if (index === -1) throw new Error('Machinery record not found');

    const updatedMachine = normalizeMachine({
      ...list[index],
      ...machineData,
      id: list[index].id,
      machineCode: machineData.machineCode || list[index].machineCode,
      purchaseCost: machineData.purchaseCost !== undefined ? Number(machineData.purchaseCost) : list[index].purchaseCost,
      currentValue: machineData.currentValue !== undefined ? Number(machineData.currentValue) : list[index].currentValue,
      registrationNo: (machineData.registrationNo !== undefined ? machineData.registrationNo : list[index].registrationNo || '').toUpperCase()
    }, index);

    try {
      await api.put(`/api/Machinery/${id}`, updatedMachine);
    } catch {
      // Persisted in local store
    }

    const updatedList = [...list];
    updatedList[index] = updatedMachine;
    writeStorage(STORAGE_KEY, updatedList);
    return updatedMachine;
  },

  deleteMachine: async (id) => {
    try {
      await api.delete(`/api/Machinery/${id}`);
    } catch {
      // Persisted in local store
    }

    const list = readStorage(STORAGE_KEY, SEED_MACHINERY).map(normalizeMachine);
    const filtered = list.filter((m) => String(m.id) !== String(id));
    writeStorage(STORAGE_KEY, filtered);
    return true;
  },

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
    const inactive = machines.filter((m) => m.status === 'Inactive').length;

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
