import api from './api.js';

// ─── Default Sample Photos (SVG Data URIs) ──────────────────────────────────
export const SAMPLE_PHOTOS = {
  tractor: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%232e7d32"><circle cx="50" cy="50" r="48" fill="%23e8f5e9"/><path d="M25 65a12 12 0 1 0 24 0 12 12 0 1 0-24 0zm45 4a8 8 0 1 0 16 0 8 8 0 1 0-16 0zM35 55l15-25h20v25H35z" fill="%232e7d32"/></svg>',
  harvester: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23c2410c"><circle cx="50" cy="50" r="48" fill="%23fff7ed"/><rect x="25" y="35" width="40" height="30" rx="4" fill="%23ea580c"/><circle cx="35" cy="70" r="10" fill="%239a3412"/><circle cx="70" cy="70" r="8" fill="%239a3412"/></svg>',
  powerTiller: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%230284c7"><circle cx="50" cy="50" r="48" fill="%23f0f9ff"/><circle cx="40" cy="65" r="12" fill="%230284c7"/><path d="M40 65l30-30h10" stroke="%230369a1" stroke-width="6" stroke-linecap="round"/></svg>',
  sprayer: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%230d9488"><circle cx="50" cy="50" r="48" fill="%23f0fdfa"/><rect x="30" y="30" width="30" height="40" rx="6" fill="%230d9488"/><circle cx="65" cy="68" r="8" fill="%23115e59"/><path d="M60 40h20v15" stroke="%23115e59" stroke-width="4"/></svg>',
  receipt: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23475569"><circle cx="50" cy="50" r="48" fill="%23f8fafc"/><rect x="30" y="20" width="40" height="60" rx="3" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="3"/><path d="M38 35h24M38 45h24M38 55h16" stroke="%2364748b" stroke-width="3" stroke-linecap="round"/></svg>',
  rentalHandover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2316a34a"><circle cx="50" cy="50" r="48" fill="%23f0fdf4"/><path d="M30 45l15 15 25-25" stroke="%2316a34a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
};

// ─── Machine Types ──────────────────────────────────────────────────────────
export const DEFAULT_MACHINE_TYPES = [
  'Tractor',
  'Power Tiller',
  'Plough',
  'Cultivator',
  'Rotavator',
  'Harrow',
  'Seed Drill',
  'Planter',
  'Transplanter',
  'Fertilizer Spreader',
  'Sprayer',
  'Weeder',
  'Water Pump',
  'Thresher',
  'Harvester',
  'Combine Harvester',
  'Reaper',
  'Baler',
  'Trailer',
  'Grain Dryer',
  'Other'
];

export const FUEL_TYPES = [
  'Diesel',
  'Petrol',
  'Electric',
  'Battery / Electric',
  'PTO Driven',
  'CNG',
  'Solar',
  'Manual / None',
  'Other'
];

export const MACHINE_STATUSES = [
  'Available',
  'Rented/In Use',
  'Under Repair',
  'Retired'
];

export const USAGE_BASES = [
  { value: 'Hourly', label: 'Hourly basis' },
  { value: 'Daily', label: 'Daily basis' },
  { value: 'Acreage-based', label: 'Acreage-based' },
  { value: 'Fixed charge', label: 'Fixed charge' }
];

export const EXPENSE_TYPES = [
  'Fuel',
  'Repair',
  'Service',
  'Maintenance',
  'Other'
];

// Helper to normalize legacy machine status values
export function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'Available';
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'available') return 'Available';
  if (s === 'rented' || s === 'in use' || s === 'rented/in use' || s === 'active') return 'Available'; // default active to available unless rented
  if (s === 'under maintenance' || s === 'under repair' || s === 'maintenance' || s === 'repair') return 'Under Repair';
  if (s === 'retired' || s === 'inactive' || s === 'sold' || s === 'out of service') return 'Retired';
  return 'Available';
}

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
      status: 'Available',
      photos: [SAMPLE_PHOTOS.tractor],
      notes: '',
      modelNumber: '',
      manufacturer: '',
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

  const rawStatus = raw.status || raw.Status || 'Available';
  const status = normalizeStatus(rawStatus);

  const modelNumber = String(raw.modelNumber || raw.model_number || raw.ModelNumber || raw.model || '');
  const manufacturer = String(raw.manufacturer || raw.Manufacturer || raw.brand || '');
  const notes = String(raw.notes || raw.Notes || raw.description || '');

  // Photos array
  let photos = [];
  if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    photos = raw.photos;
  } else if (raw.photo) {
    photos = [raw.photo];
  } else if (raw.image) {
    photos = [raw.image];
  } else {
    // Default appropriate sample photo
    if (machineType.toLowerCase().includes('harvester')) photos = [SAMPLE_PHOTOS.harvester];
    else if (machineType.toLowerCase().includes('tiller')) photos = [SAMPLE_PHOTOS.powerTiller];
    else if (machineType.toLowerCase().includes('sprayer')) photos = [SAMPLE_PHOTOS.sprayer];
    else photos = [SAMPLE_PHOTOS.tractor];
  }

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
    photos,
    expenseCount,
    totalExpenses
  };
}

// ─── Normalization: Farmer Machinery Rental ─────────────────────────────────
export function normalizeRental(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    const id = index + 1;
    return {
      id,
      rentalCode: `RNT-${String(id).padStart(3, '0')}`,
      farmerId: 'FMR-001',
      farmerName: 'Farmer',
      farmerContact: '',
      landArea: 1,
      landUnit: 'Acres',
      machineryId: 1,
      machineCode: 'MCH-001',
      machineName: 'Mahindra 575 DI Tractor',
      machineType: 'Tractor',
      startDateTime: new Date().toISOString().slice(0, 16),
      endDateTime: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
      usageBasis: 'Hourly',
      hourlyDuration: 6,
      rate: 800,
      totalCharge: 4800,
      purpose: 'Ploughing',
      photos: [SAMPLE_PHOTOS.rentalHandover],
      notes: '',
      status: 'Active'
    };
  }

  const id = raw.id ?? raw.Id ?? index + 1;
  const rentalCode = raw.rentalCode || raw.RentalCode || `RNT-${String(id).padStart(3, '0')}`;
  const farmerId = String(raw.farmerId || raw.FarmerId || raw.farmerCode || 'FMR-001');
  const farmerName = String(raw.farmerName || raw.FarmerName || 'Farmer');
  const farmerContact = String(raw.farmerContact || raw.FarmerContact || raw.contactNumber || raw.mobile || '');
  const landArea = Number(raw.landArea ?? raw.LandArea ?? 1) || 0;
  const landUnit = String(raw.landUnit || raw.LandUnit || 'Acres');

  const machineryId = Number(raw.machineryId ?? raw.MachineryId ?? 1) || 1;
  const machineCode = String(raw.machineCode || raw.MachineCode || `MCH-${String(machineryId).padStart(3, '0')}`);
  const machineName = String(raw.machineName || raw.MachineName || 'Machine');
  const machineType = String(raw.machineType || raw.MachineType || 'Tractor');

  const startDateTime = raw.startDateTime || raw.StartDateTime || new Date().toISOString().slice(0, 16);
  const endDateTime = raw.endDateTime || raw.EndDateTime || new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16);

  const usageBasis = raw.usageBasis || raw.UsageBasis || 'Hourly';
  const hourlyDuration = Number(raw.hourlyDuration ?? raw.HourlyDuration ?? 0) || 0;
  const rate = Number(raw.rate ?? raw.Rate ?? 0) || 0;
  const totalCharge = Number(raw.totalCharge ?? raw.TotalCharge ?? (hourlyDuration * rate)) || 0;

  const purpose = String(raw.purpose || raw.Purpose || raw.reason || 'Field work');
  const notes = String(raw.notes || raw.Notes || raw.remarks || '');
  const status = raw.status || raw.Status || 'Active';

  let photos = [];
  if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    photos = raw.photos;
  } else if (raw.photo) {
    photos = [raw.photo];
  } else {
    photos = [SAMPLE_PHOTOS.rentalHandover];
  }

  return {
    ...raw,
    id,
    rentalCode,
    farmerId,
    farmerName,
    farmerContact,
    landArea,
    landUnit,
    machineryId,
    machineCode,
    machineName,
    machineType,
    startDateTime,
    endDateTime,
    usageBasis,
    hourlyDuration,
    rate,
    totalCharge,
    purpose,
    photos,
    notes,
    status
  };
}

// ─── Normalization: Machinery Expenses ──────────────────────────────────────
export function normalizeExpense(raw, index = 0) {
  if (!raw || typeof raw !== 'object') {
    const id = index + 1;
    return {
      id,
      expenseCode: `EXP-${String(id).padStart(3, '0')}`,
      machineryId: 1,
      machineCode: 'MCH-001',
      machineName: 'Mahindra 575 DI Tractor',
      expenseType: 'Fuel',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      quantity: null,
      unit: '',
      supplier: '',
      description: '',
      receiptPhoto: SAMPLE_PHOTOS.receipt,
      additionalPhotos: [],
      operator: '',
      remarks: '',
      notes: ''
    };
  }

  const id = raw.id ?? raw.Id ?? index + 1;
  const expenseCode = raw.expenseCode || raw.ExpenseCode || `EXP-${String(id).padStart(3, '0')}`;
  const machineryId = raw.machineryId ?? raw.MachineryId ?? 1;
  const machineCode = raw.machineCode || raw.MachineCode || (machineryId ? `MCH-${String(machineryId).padStart(3, '0')}` : '');
  const machineName = raw.machineName || raw.MachineName || raw.machine_name || 'Machine';
  
  // Standardize expense type: Fuel, Repair, Service, Maintenance, or Other
  let expenseType = raw.expenseType || raw.ExpenseType || raw.expense_type || 'Fuel';
  if (expenseType === 'Repair & Spare Parts') expenseType = 'Repair';
  if (expenseType === 'Operator Wages') expenseType = 'Other';
  if (expenseType === 'Insurance & Registration') expenseType = 'Other';

  const rawDate = raw.date || raw.Date || raw.expenseDate || new Date().toISOString().split('T')[0];
  const date = typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate;
  const amount = Number(raw.amount ?? raw.Amount ?? 0) || 0;

  const quantity = raw.quantity !== undefined && raw.quantity !== null && raw.quantity !== ''
    ? Number(raw.quantity)
    : null;
  const unit = String(raw.unit || raw.Unit || (expenseType === 'Fuel' ? 'Litres' : ''));

  const supplier = String(raw.supplier || raw.Supplier || raw.provider || raw.operator || '');
  const description = String(raw.description || raw.Description || raw.remarks || raw.Remarks || '');
  const notes = String(raw.notes || raw.Notes || '');
  const operator = String(raw.operator || raw.Operator || '');
  const remarks = String(raw.remarks || raw.Remarks || description);

  const receiptPhoto = raw.receiptPhoto || raw.receipt || raw.billPhoto || SAMPLE_PHOTOS.receipt;
  const additionalPhotos = Array.isArray(raw.additionalPhotos) ? raw.additionalPhotos : [];

  return {
    ...raw,
    id,
    expenseCode,
    machineryId,
    machineCode,
    machineName,
    expenseType,
    date,
    amount,
    quantity,
    unit,
    supplier,
    description,
    receiptPhoto,
    additionalPhotos,
    operator,
    remarks,
    notes
  };
}

// ─── Machine Code Natural Sorting Helpers ────────────────────────────────────
export function extractMachineCodeNumber(code, fallbackId = 0) {
  if (typeof code === 'number') return code;
  if (!code && fallbackId) return Number(fallbackId) || 0;
  const str = String(code || '').trim();
  const match = str.match(/\d+/g);
  if (match && match.length > 0) {
    const num = parseInt(match[match.length - 1], 10);
    if (!isNaN(num)) return num;
  }
  return Number(fallbackId) || 0;
}

export function compareMachineCodes(a, b, direction = 'asc') {
  const codeA = a?.machineCode || (a?.id ? `MCH-${String(a.id).padStart(3, '0')}` : '');
  const codeB = b?.machineCode || (b?.id ? `MCH-${String(b.id).padStart(3, '0')}` : '');

  const numA = extractMachineCodeNumber(codeA, a?.id);
  const numB = extractMachineCodeNumber(codeB, b?.id);

  let diff = 0;
  if (numA !== numB) {
    diff = numA - numB;
  } else {
    diff = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
  }

  if (diff === 0) {
    diff = (Number(a?.id) || 0) - (Number(b?.id) || 0);
  }

  return direction === 'desc' ? -diff : diff;
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
    status: 'Rented/In Use',
    photos: [SAMPLE_PHOTOS.tractor],
    modelNumber: '575 DI (45 HP)',
    manufacturer: 'Mahindra & Mahindra',
    notes: 'Primary heavy farm tractor for ploughing, rotavating, and trailer haulage',
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
    status: 'Available',
    photos: [SAMPLE_PHOTOS.powerTiller],
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
    machineType: 'Weeder',
    registrationNo: 'AP 16 PW 1042',
    purchaseDate: '2023-06-10',
    purchaseCost: 58000,
    currentValue: 48000,
    fuelType: 'Petrol',
    status: 'Available',
    photos: [SAMPLE_PHOTOS.powerTiller],
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
    status: 'Under Repair',
    photos: [SAMPLE_PHOTOS.sprayer],
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
    machineType: 'Combine Harvester',
    registrationNo: 'AP 07 HV 9901',
    purchaseDate: '2020-10-18',
    purchaseCost: 2450000,
    currentValue: 1780000,
    fuelType: 'Diesel',
    status: 'Available',
    photos: [SAMPLE_PHOTOS.harvester],
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
    status: 'Available',
    photos: [SAMPLE_PHOTOS.tractor],
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
    status: 'Retired',
    photos: [SAMPLE_PHOTOS.sprayer],
    modelNumber: '12V 12Ah Knapsack 16L',
    manufacturer: 'KisanKraft Machine Tools',
    notes: 'Auxiliary knapsack unit kept on standby in store room',
    expenseCount: 0,
    totalExpenses: 0
  }
];

export const SEED_RENTALS = [
  {
    id: 1,
    rentalCode: 'RNT-001',
    farmerId: 'FMR-001',
    farmerName: 'Ramesh Reddy',
    farmerContact: '9848022338',
    landArea: 4.5,
    landUnit: 'Acres',
    machineryId: 1,
    machineCode: 'MCH-001',
    machineName: 'Mahindra 575 DI Tractor',
    machineType: 'Tractor',
    startDateTime: '2026-11-23T08:00',
    endDateTime: '2026-11-23T17:00',
    usageBasis: 'Hourly',
    hourlyDuration: 9,
    rate: 850,
    totalCharge: 7650,
    purpose: 'Deep ploughing & rotavating for upcoming Rabi paddy parcel',
    photos: [SAMPLE_PHOTOS.rentalHandover],
    notes: 'Delivered with full tank diesel. Operator Venkat provided.',
    status: 'Active'
  },
  {
    id: 2,
    rentalCode: 'RNT-002',
    farmerId: 'FMR-002',
    farmerName: 'Suresh Patel',
    farmerContact: '9440188231',
    landArea: 6.0,
    landUnit: 'Acres',
    machineryId: 5,
    machineCode: 'MCH-005',
    machineName: 'Preet 987 Multi-Crop Combine Harvester',
    machineType: 'Combine Harvester',
    startDateTime: '2026-11-25T07:00',
    endDateTime: '2026-11-25T19:00',
    usageBasis: 'Acreage-based',
    hourlyDuration: 12,
    rate: 2200,
    totalCharge: 13200,
    purpose: 'Paddy grain harvesting and field straw chopping',
    photos: [SAMPLE_PHOTOS.rentalHandover],
    notes: 'Advance booking confirmed. Advance token ₹5,000 received.',
    status: 'Scheduled'
  },
  {
    id: 3,
    rentalCode: 'RNT-003',
    farmerId: 'FMR-003',
    farmerName: 'K. Venkat Rao',
    farmerContact: '9885544120',
    landArea: 2.5,
    landUnit: 'Acres',
    machineryId: 2,
    machineCode: 'MCH-002',
    machineName: 'VST Shakti 130 DI Power Tiller',
    machineType: 'Power Tiller',
    startDateTime: '2026-11-18T08:00',
    endDateTime: '2026-11-19T18:00',
    usageBasis: 'Daily',
    hourlyDuration: 20,
    rate: 1600,
    totalCharge: 3200,
    purpose: 'Wet field puddling and nursery plot tilling',
    photos: [SAMPLE_PHOTOS.rentalHandover],
    notes: '2-day rental completed. Machine returned clean and inspected.',
    status: 'Completed'
  },
  {
    id: 4,
    rentalCode: 'RNT-004',
    farmerId: 'FMR-004',
    farmerName: 'Anand Sharma',
    farmerContact: '9701234567',
    landArea: 1.5,
    landUnit: 'Acres',
    machineryId: 3,
    machineCode: 'MCH-003',
    machineName: 'Honda F300 Power Weeder',
    machineType: 'Weeder',
    startDateTime: '2026-11-15T09:00',
    endDateTime: '2026-11-15T15:00',
    usageBasis: 'Fixed charge',
    hourlyDuration: 6,
    rate: 1200,
    totalCharge: 1200,
    purpose: 'Chilli row weeding and soil aerating',
    photos: [SAMPLE_PHOTOS.rentalHandover],
    notes: 'Full payment settled via UPI on return.',
    status: 'Completed'
  }
];

export const SEED_EXPENSES = [
  {
    id: 1,
    expenseCode: 'EXP-001',
    machineryId: 1,
    machineCode: 'MCH-001',
    machineName: 'Mahindra 575 DI Tractor',
    expenseType: 'Fuel',
    date: '2026-11-12',
    amount: 3200,
    quantity: 35,
    unit: 'Litres',
    supplier: 'HPCL Fuel Station Vijayawada',
    description: '35L Diesel batch for field ploughing operation',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Ramesh Reddy',
    remarks: 'Invoice #HP-9921',
    notes: 'Paid via Farm Fuel Card'
  },
  {
    id: 2,
    expenseCode: 'EXP-002',
    machineryId: 1,
    machineCode: 'MCH-001',
    machineName: 'Mahindra 575 DI Tractor',
    expenseType: 'Service',
    date: '2026-11-05',
    amount: 2200,
    quantity: 1,
    unit: 'Kit',
    supplier: 'Srinivas Service Workshop',
    description: '150-hour scheduled service: Engine oil 15W40 and oil filter renewal',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Workshop Vijayawada',
    remarks: 'Next scheduled check at 300 hrs',
    notes: 'Replaced genuine Mahindra lube filter'
  },
  {
    id: 3,
    expenseCode: 'EXP-003',
    machineryId: 2,
    machineCode: 'MCH-002',
    machineName: 'VST Shakti 130 DI Power Tiller',
    expenseType: 'Fuel',
    date: '2026-11-10',
    amount: 1800,
    quantity: 20,
    unit: 'Litres',
    supplier: 'Indian Oil Petrol Pump',
    description: 'Diesel batch for puddling preparation',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Venkataiah',
    remarks: 'Cash bill #IOC-4412',
    notes: ''
  },
  {
    id: 4,
    expenseCode: 'EXP-004',
    machineryId: 3,
    machineCode: 'MCH-003',
    machineName: 'Honda F300 Power Weeder',
    expenseType: 'Fuel',
    date: '2026-11-15',
    amount: 650,
    quantity: 6,
    unit: 'Litres',
    supplier: 'Bharat Petroleum',
    description: '6L Petrol refill for chilli inter-row weed clearance',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Anji',
    remarks: 'Receipt attached',
    notes: ''
  },
  {
    id: 5,
    expenseCode: 'EXP-005',
    machineryId: 4,
    machineCode: 'MCH-004',
    machineName: 'Aspee HTP Tractor Mounted Sprayer',
    expenseType: 'Repair',
    date: '2026-11-14',
    amount: 3200,
    quantity: 1,
    unit: 'Valve Set',
    supplier: 'Sri Lakshmi Agri Spares',
    description: 'HTP triple-piston valve kit replacement and 50m hose overhaul',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Sri Lakshmi Spares',
    remarks: 'Warranty 6 months on replacement valves',
    notes: 'Machine currently in workshop testing'
  },
  {
    id: 6,
    expenseCode: 'EXP-006',
    machineryId: 5,
    machineCode: 'MCH-005',
    machineName: 'Preet 987 Multi-Crop Combine Harvester',
    expenseType: 'Fuel',
    date: '2026-11-02',
    amount: 8500,
    quantity: 92,
    unit: 'Litres',
    supplier: 'HPCL Highway Station',
    description: '92L High-speed diesel bulk refill for parcel harvesting',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Gurpreet Singh',
    remarks: 'Refuel voucher #8831',
    notes: ''
  },
  {
    id: 7,
    expenseCode: 'EXP-007',
    machineryId: 5,
    machineCode: 'MCH-005',
    machineName: 'Preet 987 Multi-Crop Combine Harvester',
    expenseType: 'Maintenance',
    date: '2026-11-03',
    amount: 6000,
    quantity: 1,
    unit: 'Service',
    supplier: 'Preet Authorized Service Hub',
    description: 'Cutter bar blade sharpening, elevator belt tensioning and hydraulic check',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Preet Service Eng.',
    remarks: 'Pre-season full checkup',
    notes: ''
  },
  {
    id: 8,
    expenseCode: 'EXP-008',
    machineryId: 6,
    machineCode: 'MCH-006',
    machineName: 'Shaktiman Semi Champion Rotavator',
    expenseType: 'Maintenance',
    date: '2026-10-28',
    amount: 1200,
    quantity: 3,
    unit: 'Litres',
    supplier: 'Workshop Vijayawada',
    description: 'Rotavator gearbox gear oil 90EP replacement and side gear check',
    receiptPhoto: SAMPLE_PHOTOS.receipt,
    additionalPhotos: [],
    operator: 'Mechanic Ramesh',
    remarks: 'Routine 6-month gear lube replacement',
    notes: ''
  }
];

export const SEED_LOOKUPS = {
  machineTypes: DEFAULT_MACHINE_TYPES,
  fuelTypes: FUEL_TYPES,
  statuses: MACHINE_STATUSES,
  usageBases: USAGE_BASES,
  expenseTypes: EXPENSE_TYPES
};

// ─── Storage Keys & Helpers ──────────────────────────────────────────────────
const STORAGE_KEY_MACHINERY = 'agriman_machinery_data';
const STORAGE_KEY_RENTALS = 'agriman_machinery_rentals';
const STORAGE_KEY_EXPENSES = 'agriman_machinery_expenses';
const STORAGE_KEY_CUSTOM_TYPES = 'agriman_machinery_custom_types';

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
  // 1. MACHINE TYPES & LOOKUPS
  // ─────────────────────────────────────────────────────────────────────────
  getMachineTypes: () => {
    const custom = readStorage(STORAGE_KEY_CUSTOM_TYPES, []);
    const merged = [...DEFAULT_MACHINE_TYPES];
    custom.forEach((t) => {
      if (t && !merged.includes(t)) {
        // Insert custom types before 'Other'
        const otherIdx = merged.indexOf('Other');
        if (otherIdx !== -1) merged.splice(otherIdx, 0, t);
        else merged.push(t);
      }
    });
    return merged;
  },

  addCustomMachineType: (newType) => {
    if (!newType || typeof newType !== 'string') return;
    const trimmed = newType.trim();
    if (!trimmed) return;
    const custom = readStorage(STORAGE_KEY_CUSTOM_TYPES, []);
    if (!custom.includes(trimmed) && !DEFAULT_MACHINE_TYPES.includes(trimmed)) {
      custom.push(trimmed);
      writeStorage(STORAGE_KEY_CUSTOM_TYPES, custom);
    }
  },

  getMachineryLookups: async () => {
    try {
      const res = await api.get('/api/Machinery/lookups');
      if (res.data) {
        return {
          machineTypes: machineryService.getMachineTypes(),
          fuelTypes: FUEL_TYPES,
          statuses: MACHINE_STATUSES,
          usageBases: USAGE_BASES,
          expenseTypes: EXPENSE_TYPES
        };
      }
    } catch {
      // offline fallback
    }
    return {
      machineTypes: machineryService.getMachineTypes(),
      fuelTypes: FUEL_TYPES,
      statuses: MACHINE_STATUSES,
      usageBases: USAGE_BASES,
      expenseTypes: EXPENSE_TYPES
    };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. MACHINERY FLEET CRUD
  // ─────────────────────────────────────────────────────────────────────────
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
        normalized.sort((a, b) => compareMachineCodes(a, b, 'asc'));
        if (!params.search && !params.machineType && !params.fuelType && !params.status) {
          writeStorage(STORAGE_KEY_MACHINERY, normalized);
        }
        return normalized;
      }
    } catch {
      // offline fallback
    }

    let list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map((item, idx) => normalizeMachine(item, idx));
    list.sort((a, b) => compareMachineCodes(a, b, 'asc'));

    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((m) =>
        (m.machineName || '').toLowerCase().includes(term) ||
        (m.registrationNo || '').toLowerCase().includes(term) ||
        (m.machineCode || '').toLowerCase().includes(term) ||
        (m.machineType || '').toLowerCase().includes(term)
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

  getMachineById: async (id) => {
    try {
      const res = await api.get(`/api/Machinery/${id}`);
      const data = res.data?.data || res.data;
      if (data && (data.id || data.Id)) return normalizeMachine(data);
    } catch {
      // offline fallback
    }
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    return list.find((m) => String(m.id) === String(id)) || null;
  },

  createMachine: async (machineData) => {
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const nextId = list.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
    const nextCode = machineryService.generateMachineCode(list);

    const payload = {
      machineName: (machineData.machineName || `Machine ${nextId}`).trim(),
      machineCode: (machineData.machineCode || nextCode).trim(),
      machineType: (machineData.machineType || 'Tractor').trim(),
      registrationNo: machineData.registrationNo ? machineData.registrationNo.trim().toUpperCase() : '',
      purchaseDate: machineData.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCost: Number(machineData.purchaseCost) || 0,
      currentValue: machineData.currentValue !== '' && machineData.currentValue !== undefined
        ? Number(machineData.currentValue)
        : Number(machineData.purchaseCost) || 0,
      fuelType: machineData.fuelType || 'Diesel',
      status: normalizeStatus(machineData.status || 'Available'),
      photos: Array.isArray(machineData.photos) && machineData.photos.length > 0 ? machineData.photos : [SAMPLE_PHOTOS.tractor],
      modelNumber: machineData.modelNumber ? machineData.modelNumber.trim() : '',
      manufacturer: machineData.manufacturer ? machineData.manufacturer.trim() : '',
      notes: machineData.notes ? machineData.notes.trim() : ''
    };

    let createdRecord = null;
    try {
      const res = await api.post('/api/Machinery', payload);
      if (res.data) createdRecord = normalizeMachine(res.data);
    } catch {
      // offline fallback
    }

    if (!createdRecord) {
      createdRecord = normalizeMachine({ ...payload, id: nextId }, nextId - 1);
    }

    const updated = [createdRecord, ...list.filter((m) => String(m.id) !== String(createdRecord.id))];
    writeStorage(STORAGE_KEY_MACHINERY, updated);

    // Save custom type if not exists
    machineryService.addCustomMachineType(payload.machineType);

    return createdRecord;
  },

  updateMachine: async (id, machineData) => {
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const existing = list.find((m) => String(m.id) === String(id));
    if (!existing) throw new Error('Machinery record not found');

    const payload = {
      machineName: (machineData.machineName ?? existing.machineName).trim(),
      machineCode: machineData.machineCode || existing.machineCode,
      machineType: (machineData.machineType ?? existing.machineType).trim(),
      registrationNo: machineData.registrationNo !== undefined
        ? (machineData.registrationNo ? machineData.registrationNo.trim().toUpperCase() : '')
        : existing.registrationNo,
      purchaseDate: machineData.purchaseDate || existing.purchaseDate,
      purchaseCost: machineData.purchaseCost !== undefined ? Number(machineData.purchaseCost) : existing.purchaseCost,
      currentValue: machineData.currentValue !== undefined ? Number(machineData.currentValue) : existing.currentValue,
      fuelType: machineData.fuelType ?? existing.fuelType,
      status: normalizeStatus(machineData.status ?? existing.status),
      photos: Array.isArray(machineData.photos) ? machineData.photos : existing.photos,
      modelNumber: machineData.modelNumber !== undefined ? machineData.modelNumber : existing.modelNumber,
      manufacturer: machineData.manufacturer !== undefined ? machineData.manufacturer : existing.manufacturer,
      notes: machineData.notes !== undefined ? machineData.notes : existing.notes
    };

    let updatedRecord = null;
    try {
      const res = await api.put(`/api/Machinery/${id}`, payload);
      if (res.data) updatedRecord = normalizeMachine(res.data);
    } catch {
      // offline fallback
    }

    if (!updatedRecord) {
      updatedRecord = normalizeMachine({ ...existing, ...payload, id: existing.id });
    }

    const updatedList = list.map((m) => (String(m.id) === String(id) ? updatedRecord : m));
    writeStorage(STORAGE_KEY_MACHINERY, updatedList);

    machineryService.addCustomMachineType(payload.machineType);
    return updatedRecord;
  },

  deleteMachine: async (id) => {
    try {
      await api.delete(`/api/Machinery/${id}`);
    } catch {
      // offline fallback
    }
    const list = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const filtered = list.filter((m) => String(m.id) !== String(id));
    writeStorage(STORAGE_KEY_MACHINERY, filtered);
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

  getMachinerySummary: async () => {
    const machines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const expenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const rentals = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);

    return {
      totalMachines: machines.length,
      availableMachines: machines.filter((m) => m.status === 'Available').length,
      rentedMachines: machines.filter((m) => m.status === 'Rented/In Use').length,
      underRepairMachines: machines.filter((m) => m.status === 'Under Repair').length,
      retiredMachines: machines.filter((m) => m.status === 'Retired').length,
      totalPurchaseCost: machines.reduce((sum, m) => sum + (Number(m.purchaseCost) || 0), 0),
      totalCurrentValue: machines.reduce((sum, m) => sum + (Number(m.currentValue) || 0), 0),
      totalExpenseRecords: expenses.length,
      totalExpenseAmount: expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
      totalRentalRecords: rentals.length,
      activeRentals: rentals.filter((r) => r.status === 'Active').length,
      totalRentalRevenue: rentals.reduce((sum, r) => sum + (Number(r.totalCharge) || 0), 0)
    };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. FARMER MACHINERY RENTALS CRUD & OVERLAP LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  getRentals: async (params = {}) => {
    let list = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);
    list.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((r) =>
        (r.farmerName || '').toLowerCase().includes(q) ||
        (r.farmerContact || '').toLowerCase().includes(q) ||
        (r.machineName || '').toLowerCase().includes(q) ||
        (r.rentalCode || '').toLowerCase().includes(q) ||
        (r.purpose || '').toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== 'All') {
      list = list.filter((r) => r.status === params.status);
    }
    if (params.machineryId && params.machineryId !== 'All') {
      list = list.filter((r) => String(r.machineryId) === String(params.machineryId));
    }
    return list;
  },

  getRentalById: async (id) => {
    const list = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);
    return list.find((r) => String(r.id) === String(id)) || null;
  },

  /**
   * CRITICAL REQUIREMENT:
   * Do not allow the same machine to be shown as available for overlapping rental dates.
   */
  checkMachineAvailability: (machineryId, startDateTime, endDateTime, excludeRentalId = null) => {
    if (!machineryId) {
      return { available: true };
    }

    const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const targetMachine = allMachines.find((m) => String(m.id) === String(machineryId));
    if (targetMachine) {
      if (targetMachine.status === 'Under Repair') {
        return {
          available: false,
          isMaintenance: true,
          message: `Machine [${targetMachine.machineCode}] is currently Under Repair and unavailable for rentals.`
        };
      }
      if (targetMachine.status === 'Retired') {
        return {
          available: false,
          isRetired: true,
          message: `Machine [${targetMachine.machineCode}] is Retired / Decommissioned and cannot be rented.`
        };
      }
    }

    if (!startDateTime || !endDateTime) {
      return { available: true };
    }

    const reqStart = new Date(startDateTime).getTime();
    const reqEnd = new Date(endDateTime).getTime();

    if (isNaN(reqStart) || isNaN(reqEnd)) return { available: true };
    if (reqEnd <= reqStart) {
      return {
        available: false,
        message: 'End date and time must be later than start date and time.'
      };
    }

    const allRentals = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);

    // Filter active or scheduled rentals for this machine
    const conflicting = allRentals.find((r) => {
      if (excludeRentalId && String(r.id) === String(excludeRentalId)) return false;
      if (r.status === 'Cancelled' || r.status === 'Completed') return false;
      if (String(r.machineryId) !== String(machineryId)) return false;

      const rStart = new Date(r.startDateTime).getTime();
      const rEnd = new Date(r.endDateTime).getTime();
      if (isNaN(rStart) || isNaN(rEnd)) return false;

      // Overlap math: [reqStart, reqEnd] overlaps with [rStart, rEnd] if reqStart < rEnd && reqEnd > rStart
      return reqStart < rEnd && reqEnd > rStart;
    });

    if (conflicting) {
      const formatDT = (str) => {
        try {
          return new Date(str).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return str;
        }
      };
      return {
        available: false,
        conflictingRental: conflicting,
        message: `Machine is already booked for ${conflicting.farmerName} (${conflicting.rentalCode}) from ${formatDT(conflicting.startDateTime)} to ${formatDT(conflicting.endDateTime)}.`
      };
    }

    return { available: true };
  },

  getMachineAvailabilityMap: (startDateTime, endDateTime, excludeRentalId = null) => {
    const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const map = {};
    allMachines.forEach((m) => {
      map[m.id] = machineryService.checkMachineAvailability(m.id, startDateTime, endDateTime, excludeRentalId);
    });
    return map;
  },

  /**
   * Dynamic duration and charge calculation based on usage basis
   */
  calculateRentalCharge: ({ usageBasis, startDateTime, endDateTime, hourlyDuration, landArea, rate }) => {
    const r = Number(rate) || 0;
    let durationHours = Number(hourlyDuration) || 0;

    if (startDateTime && endDateTime) {
      const startMs = new Date(startDateTime).getTime();
      const endMs = new Date(endDateTime).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        const diffHours = (endMs - startMs) / (1000 * 60 * 60);
        if (hourlyDuration === undefined || hourlyDuration === null || hourlyDuration === '') {
          durationHours = Math.round(diffHours * 10) / 10;
        }
      }
    }

    let calculatedTotal = 0;
    if (usageBasis === 'Hourly') {
      calculatedTotal = durationHours * r;
    } else if (usageBasis === 'Daily') {
      let days = 1;
      if (startDateTime && endDateTime) {
        const startMs = new Date(startDateTime).getTime();
        const endMs = new Date(endDateTime).getTime();
        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
          days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
        }
      }
      calculatedTotal = days * r;
    } else if (usageBasis === 'Acreage-based') {
      const area = Number(landArea) || 0;
      calculatedTotal = area * r;
    } else if (usageBasis === 'Fixed charge') {
      calculatedTotal = r;
    }

    return {
      hourlyDuration: durationHours,
      totalCharge: Math.round(calculatedTotal * 100) / 100
    };
  },

  createRental: async (rentalData) => {
    // 1. Check overlap validation before creating
    const check = machineryService.checkMachineAvailability(
      rentalData.machineryId,
      rentalData.startDateTime,
      rentalData.endDateTime
    );
    if (!check.available) {
      throw new Error(check.message);
    }

    const list = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);
    const nextId = list.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
    const nextCode = `RNT-${String(nextId).padStart(3, '0')}`;

    const created = normalizeRental({
      ...rentalData,
      id: nextId,
      rentalCode: rentalData.rentalCode || nextCode
    });

    const updatedList = [created, ...list];
    writeStorage(STORAGE_KEY_RENTALS, updatedList);

    // Sync machine status to "Rented/In Use" if rental is Active
    if (created.status === 'Active') {
      const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
      const mIdx = allMachines.findIndex((m) => String(m.id) === String(created.machineryId));
      if (mIdx !== -1) {
        allMachines[mIdx].status = 'Rented/In Use';
        writeStorage(STORAGE_KEY_MACHINERY, allMachines);
      }
    }

    return created;
  },

  updateRental: async (id, rentalData) => {
    // Check overlap validation excluding self
    const check = machineryService.checkMachineAvailability(
      rentalData.machineryId,
      rentalData.startDateTime,
      rentalData.endDateTime,
      id
    );
    if (!check.available) {
      throw new Error(check.message);
    }

    const list = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);
    const existing = list.find((r) => String(r.id) === String(id));
    if (!existing) throw new Error('Rental record not found');

    const updated = normalizeRental({
      ...existing,
      ...rentalData,
      id: existing.id
    });

    const updatedList = list.map((r) => (String(r.id) === String(id) ? updated : r));
    writeStorage(STORAGE_KEY_RENTALS, updatedList);

    // Update machine status if completed or active
    const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const mIdx = allMachines.findIndex((m) => String(m.id) === String(updated.machineryId));
    if (mIdx !== -1) {
      if (updated.status === 'Completed' || updated.status === 'Cancelled') {
        // Only reset if no other active rental exists for this machine
        const hasOtherActive = updatedList.some(
          (r) => String(r.machineryId) === String(updated.machineryId) && r.status === 'Active' && String(r.id) !== String(id)
        );
        if (!hasOtherActive) {
          allMachines[mIdx].status = 'Available';
          writeStorage(STORAGE_KEY_MACHINERY, allMachines);
        }
      } else if (updated.status === 'Active') {
        allMachines[mIdx].status = 'Rented/In Use';
        writeStorage(STORAGE_KEY_MACHINERY, allMachines);
      }
    }

    return updated;
  },

  deleteRental: async (id) => {
    const list = readStorage(STORAGE_KEY_RENTALS, SEED_RENTALS).map(normalizeRental);
    const target = list.find((r) => String(r.id) === String(id));
    const filtered = list.filter((r) => String(r.id) !== String(id));
    writeStorage(STORAGE_KEY_RENTALS, filtered);

    // If target was active, restore machine status
    if (target && target.status === 'Active') {
      const hasOther = filtered.some((r) => String(r.machineryId) === String(target.machineryId) && r.status === 'Active');
      if (!hasOther) {
        const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
        const mIdx = allMachines.findIndex((m) => String(m.id) === String(target.machineryId));
        if (mIdx !== -1 && allMachines[mIdx].status === 'Rented/In Use') {
          allMachines[mIdx].status = 'Available';
          writeStorage(STORAGE_KEY_MACHINERY, allMachines);
        }
      }
    }
    return true;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. MACHINERY EXPENSES CRUD
  // ─────────────────────────────────────────────────────────────────────────
  getAllExpenses: async (params = {}) => {
    try {
      const res = await api.get('/api/machinery-expenses', { params });
      const items = res.data?.items || res.data?.Items || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(items) && items.length > 0) {
        return {
          totalExpenseRecords: items.length,
          totalAmount: items.reduce((s, x) => s + (Number(x.amount) || 0), 0),
          items: items.map(normalizeExpense)
        };
      }
    } catch {
      // offline fallback
    }

    let list = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((e) =>
        (e.machineName || '').toLowerCase().includes(term) ||
        (e.expenseType || '').toLowerCase().includes(term) ||
        (e.supplier || '').toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term) ||
        (e.remarks || '').toLowerCase().includes(term) ||
        (e.expenseCode || '').toLowerCase().includes(term)
      );
    }
    if (params.expenseType && params.expenseType !== 'All') {
      list = list.filter((e) => e.expenseType === params.expenseType);
    }
    if (params.machineryId && params.machineryId !== 'All') {
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

  getExpenseById: async (id) => {
    const list = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    return list.find((e) => String(e.id) === String(id)) || null;
  },

  createExpense: async (expenseData) => {
    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const nextId = allExpenses.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
    const nextCode = `EXP-${String(nextId).padStart(3, '0')}`;

    const created = normalizeExpense({
      ...expenseData,
      id: nextId,
      expenseCode: expenseData.expenseCode || nextCode
    });

    const updatedList = [created, ...allExpenses];
    writeStorage(STORAGE_KEY_EXPENSES, updatedList);

    // Sync machine expense counter
    const allMachines = readStorage(STORAGE_KEY_MACHINERY, SEED_MACHINERY).map(normalizeMachine);
    const mIdx = allMachines.findIndex((m) => String(m.id) === String(created.machineryId));
    if (mIdx !== -1) {
      allMachines[mIdx].expenseCount = (allMachines[mIdx].expenseCount || 0) + 1;
      allMachines[mIdx].totalExpenses = (allMachines[mIdx].totalExpenses || 0) + created.amount;
      writeStorage(STORAGE_KEY_MACHINERY, allMachines);
    }

    return created;
  },

  updateExpense: async (id, expenseData) => {
    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const existing = allExpenses.find((e) => String(e.id) === String(id));
    if (!existing) throw new Error('Machinery expense record not found');

    const updated = normalizeExpense({
      ...existing,
      ...expenseData,
      id: existing.id
    });

    const updatedList = allExpenses.map((e) => (String(e.id) === String(id) ? updated : e));
    writeStorage(STORAGE_KEY_EXPENSES, updatedList);
    return updated;
  },

  deleteExpense: async (id) => {
    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const filtered = allExpenses.filter((e) => String(e.id) !== String(id));
    writeStorage(STORAGE_KEY_EXPENSES, filtered);
    return true;
  },

  getExpensesForMachine: async (machineryId) => {
    const allExpenses = readStorage(STORAGE_KEY_EXPENSES, SEED_EXPENSES).map(normalizeExpense);
    const filtered = allExpenses.filter((e) => String(e.machineryId) === String(machineryId));
    return {
      totalExpenseRecords: filtered.length,
      totalAmount: filtered.reduce((s, x) => s + (Number(x.amount) || 0), 0),
      items: filtered
    };
  },

  getExpenseTypes: async () => {
    return EXPENSE_TYPES;
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. FLEET ROI ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────
  getFleetRoi: async () => {
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
  }
};

export default machineryService;
