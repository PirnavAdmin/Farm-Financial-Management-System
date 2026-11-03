import api from './api';

// ─── Default Reference Seed Data ─────────────────────────────────────────────
const SEED_WORK_TYPES = [
  {
    id: 1,
    code: 'LWT-001',
    workTypeName: 'Land Preparation',
    defaultRate: 500,
    unit: 'Day',
    description: 'Ploughing, rotavator tilling, levelling, and bed preparation.',
    status: 'Active'
  },
  {
    id: 2,
    code: 'LWT-002',
    workTypeName: 'Planting',
    defaultRate: 450,
    unit: 'Day',
    description: 'Seed sowing, manual nursery transplanting, and row dibbling.',
    status: 'Active'
  },
  {
    id: 3,
    code: 'LWT-003',
    workTypeName: 'Weeding',
    defaultRate: 400,
    unit: 'Day',
    description: 'Manual inter-cultivation, root loosening, and unwanted weed clearing.',
    status: 'Active'
  },
  {
    id: 4,
    code: 'LWT-004',
    workTypeName: 'Spraying',
    defaultRate: 550,
    unit: 'Day',
    description: 'Foliar nutrition, organic biopesticide spray, and protective applications.',
    status: 'Active'
  },
  {
    id: 5,
    code: 'LWT-005',
    workTypeName: 'Harvesting',
    defaultRate: 500,
    unit: 'Day',
    description: 'Crop picking, manual harvesting, grading, and field bundle stacking.',
    status: 'Active'
  },
  {
    id: 6,
    code: 'LWT-006',
    workTypeName: 'Loading',
    defaultRate: 450,
    unit: 'Day',
    description: 'Loading harvested bags, crates, and bundles onto transport vehicles.',
    status: 'Active'
  },
  {
    id: 7,
    code: 'LWT-007',
    workTypeName: 'Unloading',
    defaultRate: 450,
    unit: 'Day',
    description: 'Unloading seeds, manure bags, chemical fertilizers, and farm supplies.',
    status: 'Active'
  }
];

const SEED_LABOURS = [
  {
    id: 1,
    labourCode: 'LBR-001',
    labourName: 'Mallaiah Goud',
    mobile: '9849123401',
    gender: 'Male',
    village: 'Kankipadu',
    dailyRate: 450,
    status: 'Active',
    photo: '',
    notes: 'Skilled in tractor rotavator operations and heavy land preparation'
  },
  {
    id: 2,
    labourCode: 'LBR-002',
    labourName: 'Lakshmi Devi',
    mobile: '9849123402',
    gender: 'Female',
    village: 'Penamaluru',
    dailyRate: 400,
    status: 'Active',
    photo: '',
    notes: 'Transplantation lead worker with high speed and nursery handling'
  },
  {
    id: 3,
    labourCode: 'LBR-003',
    labourName: 'Venkatesh Naidu',
    mobile: '9849123403',
    gender: 'Male',
    village: 'Tadikonda',
    dailyRate: 500,
    status: 'Active',
    photo: '',
    notes: 'Knapsack sprayer specialist with safety PPE compliance'
  },
  {
    id: 4,
    labourCode: 'LBR-004',
    labourName: 'Parvathamma B.',
    mobile: '9849123404',
    gender: 'Female',
    village: 'Kankipadu',
    dailyRate: 400,
    status: 'Active',
    photo: '',
    notes: 'Precision harvester for export-grade chilli and tomatoes'
  },
  {
    id: 5,
    labourCode: 'LBR-005',
    labourName: 'Ravi Shankar',
    mobile: '9849123405',
    gender: 'Male',
    village: 'Atmakur',
    dailyRate: 480,
    status: 'Active',
    photo: '',
    notes: 'Produce loading and transport logistics helper'
  },
  {
    id: 6,
    labourCode: 'LBR-006',
    labourName: 'Subba Rao',
    mobile: '9849123406',
    gender: 'Male',
    village: 'Parkal',
    dailyRate: 450,
    status: 'Inactive',
    photo: '',
    notes: 'Currently on seasonal family leave'
  }
];

const SEED_ATTENDANCE = [
  {
    id: 1,
    attendanceCode: 'ATT-001',
    date: '2026-10-25',
    labourId: 1,
    labourName: 'Mallaiah Goud',
    farmName: 'Farm 1 (South Block)',
    cropName: 'Paddy (Rice)',
    workType: 'Land Preparation',
    workBasis: 'Days',
    unitsWorked: 1.0,
    rate: 500,
    calculatedAmount: 500,
    amount: 500,
    notes: 'Rotavator ploughing across 2.5 acres'
  },
  {
    id: 2,
    attendanceCode: 'ATT-002',
    date: '2026-10-25',
    labourId: 2,
    labourName: 'Lakshmi Devi',
    farmName: 'Farm 1 (South Block)',
    cropName: 'Paddy (Rice)',
    workType: 'Planting',
    workBasis: 'Days',
    unitsWorked: 1.0,
    rate: 400,
    calculatedAmount: 400,
    amount: 400,
    notes: 'Wetland nursery transplanting'
  },
  {
    id: 3,
    attendanceCode: 'ATT-003',
    date: '2026-10-26',
    labourId: 3,
    labourName: 'Venkatesh Naidu',
    farmName: 'Farm 2 (East Canal Plot)',
    cropName: 'Cotton',
    workType: 'Spraying',
    workBasis: 'Days',
    unitsWorked: 1.0,
    rate: 550,
    calculatedAmount: 550,
    amount: 550,
    notes: 'Neem-based foliar spray on Cotton plot'
  },
  {
    id: 4,
    attendanceCode: 'ATT-004',
    date: '2026-10-26',
    labourId: 4,
    labourName: 'Parvathamma B.',
    farmName: 'Main Field',
    cropName: 'Chilli',
    workType: 'Weeding',
    workBasis: 'Days',
    unitsWorked: 1.0,
    rate: 400,
    calculatedAmount: 400,
    amount: 400,
    notes: 'Drip line weeding and ridge cleanup'
  },
  {
    id: 5,
    attendanceCode: 'ATT-005',
    date: '2026-10-27',
    labourId: 1,
    labourName: 'Mallaiah Goud',
    farmName: 'Farm 1 (South Block)',
    cropName: 'Tomato',
    workType: 'Loading',
    workBasis: 'Days',
    unitsWorked: 0.5,
    rate: 450,
    calculatedAmount: 225,
    amount: 225,
    notes: 'Half-day morning tomato crates loading'
  },
  {
    id: 6,
    attendanceCode: 'ATT-006',
    date: '2026-10-28',
    labourId: 5,
    labourName: 'Ravi Shankar',
    farmName: 'Hillside Plot',
    cropName: 'Sugarcane',
    workType: 'Harvesting',
    workBasis: 'Days',
    unitsWorked: 1.0,
    rate: 500,
    calculatedAmount: 500,
    amount: 500,
    notes: 'Cane harvesting & cart bundling'
  },
  {
    id: 7,
    attendanceCode: 'ATT-007',
    date: '2026-10-29',
    labourId: 2,
    labourName: 'Lakshmi Devi',
    farmName: 'Main Field',
    cropName: 'Chilli',
    workType: 'Weeding',
    workBasis: 'Days',
    unitsWorked: 1.0,
    rate: 400,
    calculatedAmount: 400,
    amount: 400,
    notes: 'Second weeding cycle'
  }
];

const SEED_PAYMENTS = [
  {
    id: 1,
    paymentCode: 'LPY-001',
    paymentDate: '2026-10-27',
    labourId: 1,
    labourName: 'Mallaiah Goud',
    amountPaid: 500,
    paymentMode: 'Cash',
    referenceNo: 'VOUCH-101',
    periodStart: '2026-10-25',
    periodEnd: '2026-10-25',
    notes: 'Settled land prep attendance'
  },
  {
    id: 2,
    paymentCode: 'LPY-002',
    paymentDate: '2026-10-27',
    labourId: 2,
    labourName: 'Lakshmi Devi',
    amountPaid: 400,
    paymentMode: 'UPI',
    referenceNo: 'UPI-984912-881',
    periodStart: '2026-10-25',
    periodEnd: '2026-10-25',
    notes: 'PhonePe direct transfer'
  },
  {
    id: 3,
    paymentCode: 'LPY-003',
    paymentDate: '2026-10-28',
    labourId: 3,
    labourName: 'Venkatesh Naidu',
    amountPaid: 350,
    paymentMode: 'Cash',
    referenceNo: 'VOUCH-102',
    periodStart: '2026-10-26',
    periodEnd: '2026-10-26',
    notes: 'Advance wage payment for spraying'
  }
];

// ─── Storage Helpers ──────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  LABOURS: 'agriman_labours_data',
  WORK_TYPES: 'agriman_labour_work_types',
  ATTENDANCE: 'agriman_labour_attendance',
  PAYMENTS: 'agriman_labour_payments'
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`[labourService] Error reading ${key}:`, e);
  }
  return fallback;
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[labourService] Error writing ${key}:`, e);
  }
}

// ─── Service Definition ───────────────────────────────────────────────────────
export const labourService = {
  // ── 1. Labour Master CRUD ────────────────────────
  getLabours: async () => {
    try {
      const res = await api.get('/api/Labours');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.LABOURS, data);
        return data;
      }
    } catch {
      // Backend not yet hosting /api/Labours or offline, use persistent store
    }
    return readStorage(STORAGE_KEYS.LABOURS, SEED_LABOURS);
  },

  getLabourById: async (id) => {
    try {
      const res = await api.get(`/api/Labours/${id}`);
      return res.data?.data || res.data;
    } catch {
      const list = readStorage(STORAGE_KEYS.LABOURS, SEED_LABOURS);
      return list.find((item) => String(item.id) === String(id)) || null;
    }
  },

  createLabour: async (labourData) => {
    const list = readStorage(STORAGE_KEYS.LABOURS, SEED_LABOURS);
    const nextId = list.reduce((max, l) => Math.max(max, Number(l.id) || 0), 0) + 1;
    const nextCode = `LBR-${String(nextId).padStart(3, '0')}`;

    const newLabour = {
      id: nextId,
      labourCode: labourData.labourCode || nextCode,
      labourName: labourData.labourName?.trim(),
      mobile: labourData.mobile?.trim(),
      gender: labourData.gender || 'Male',
      village: labourData.village?.trim(),
      dailyRate: Number(labourData.dailyRate) || 400,
      status: labourData.status || 'Active',
      photo: labourData.photo || '',
      notes: labourData.notes?.trim() || ''
    };

    try {
      await api.post('/api/Labours', newLabour);
    } catch {
      // Persist locally
    }

    const updated = [newLabour, ...list];
    writeStorage(STORAGE_KEYS.LABOURS, updated);
    return newLabour;
  },

  updateLabour: async (id, labourData) => {
    const list = readStorage(STORAGE_KEYS.LABOURS, SEED_LABOURS);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error('Labour record not found');

    const updatedLabour = {
      ...list[index],
      ...labourData,
      id: list[index].id,
      labourCode: list[index].labourCode,
      dailyRate: Number(labourData.dailyRate) || list[index].dailyRate,
      photo: labourData.photo !== undefined ? labourData.photo : (list[index].photo || '')
    };

    try {
      await api.put(`/api/Labours/${id}`, updatedLabour);
    } catch {
      // Persist locally
    }

    list[index] = updatedLabour;
    writeStorage(STORAGE_KEYS.LABOURS, list);
    return updatedLabour;
  },

  deleteLabour: async (id) => {
    try {
      await api.delete(`/api/Labours/${id}`);
    } catch {
      // Ignore API failure
    }
    const list = readStorage(STORAGE_KEYS.LABOURS, SEED_LABOURS);
    const updated = list.filter((item) => String(item.id) !== String(id));
    writeStorage(STORAGE_KEYS.LABOURS, updated);
    return { success: true };
  },

  toggleLabourStatus: async (id) => {
    const list = readStorage(STORAGE_KEYS.LABOURS, SEED_LABOURS);
    const item = list.find((l) => String(l.id) === String(id));
    if (!item) throw new Error('Labour record not found');
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    return await labourService.updateLabour(id, { ...item, status: newStatus });
  },

  // ── 2. Work Types CRUD ───────────────────────────
  getWorkTypes: async () => {
    try {
      const res = await api.get('/api/LabourWorkTypes');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.WORK_TYPES, data);
        return data;
      }
    } catch {
      // fallback
    }
    return readStorage(STORAGE_KEYS.WORK_TYPES, SEED_WORK_TYPES);
  },

  createWorkType: async (workTypeData) => {
    const list = readStorage(STORAGE_KEYS.WORK_TYPES, SEED_WORK_TYPES);
    const nextId = list.reduce((max, w) => Math.max(max, Number(w.id) || 0), 0) + 1;
    const nextCode = `LWT-${String(nextId).padStart(3, '0')}`;

    const newWorkType = {
      id: nextId,
      code: workTypeData.code || nextCode,
      workTypeName: workTypeData.workTypeName?.trim(),
      defaultRate: Number(workTypeData.defaultRate) || 450,
      unit: workTypeData.unit || 'Day',
      description: workTypeData.description?.trim() || '',
      status: workTypeData.status || 'Active'
    };

    try {
      await api.post('/api/LabourWorkTypes', newWorkType);
    } catch {
      // Local fallback
    }

    const updated = [...list, newWorkType];
    writeStorage(STORAGE_KEYS.WORK_TYPES, updated);
    return newWorkType;
  },

  updateWorkType: async (id, workTypeData) => {
    const list = readStorage(STORAGE_KEYS.WORK_TYPES, SEED_WORK_TYPES);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error('Work type not found');

    const updated = {
      ...list[index],
      ...workTypeData,
      id: list[index].id,
      code: list[index].code,
      defaultRate: Number(workTypeData.defaultRate) || list[index].defaultRate
    };

    try {
      await api.put(`/api/LabourWorkTypes/${id}`, updated);
    } catch {
      // Local fallback
    }

    list[index] = updated;
    writeStorage(STORAGE_KEYS.WORK_TYPES, list);
    return updated;
  },

  deleteWorkType: async (id) => {
    try {
      await api.delete(`/api/LabourWorkTypes/${id}`);
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEYS.WORK_TYPES, SEED_WORK_TYPES);
    const updated = list.filter((item) => String(item.id) !== String(id));
    writeStorage(STORAGE_KEYS.WORK_TYPES, updated);
    return { success: true };
  },

  toggleWorkTypeStatus: async (id) => {
    const list = readStorage(STORAGE_KEYS.WORK_TYPES, SEED_WORK_TYPES);
    const item = list.find((w) => String(w.id) === String(id));
    if (!item) throw new Error('Work type not found');
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    return await labourService.updateWorkType(id, { ...item, status: newStatus });
  },

  // ── 3. Labour Attendance CRUD ────────────────────
  getAttendance: async () => {
    try {
      const res = await api.get('/api/LabourAttendance');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.ATTENDANCE, data);
        return data;
      }
    } catch {
      // fallback
    }
    return readStorage(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
  },

  createAttendance: async (attendanceData) => {
    const list = readStorage(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    const nextId = list.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0) + 1;
    const nextCode = `ATT-${String(nextId).padStart(3, '0')}`;

    const units = Math.max(0, Number(attendanceData.unitsWorked) || 1);
    const rate = Math.max(0, Number(attendanceData.rate) || 0);
    const calculatedAmount = Math.round(units * rate * 100) / 100;
    const amount = attendanceData.amount !== undefined && attendanceData.amount !== ''
      ? Math.max(0, Number(attendanceData.amount))
      : calculatedAmount;

    const newRecord = {
      id: nextId,
      attendanceCode: attendanceData.attendanceCode || nextCode,
      date: attendanceData.date || new Date().toISOString().split('T')[0],
      labourId: Number(attendanceData.labourId),
      labourName: attendanceData.labourName || 'Unknown Labourer',
      farmName: attendanceData.farmName || 'Farm 1 (South Block)',
      cropName: attendanceData.cropName || 'General Farm Work',
      workType: attendanceData.workType || 'Field Operations',
      workBasis: attendanceData.workBasis || 'Days',
      unitsWorked: units,
      rate,
      calculatedAmount,
      amount,
      notes: attendanceData.notes?.trim() || ''
    };

    try {
      await api.post('/api/LabourAttendance', newRecord);
    } catch {
      // Local fallback
    }

    const updated = [newRecord, ...list];
    writeStorage(STORAGE_KEYS.ATTENDANCE, updated);
    return newRecord;
  },

  updateAttendance: async (id, attendanceData) => {
    const list = readStorage(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error('Attendance entry not found');

    const units = Math.max(0, Number(attendanceData.unitsWorked) || list[index].unitsWorked);
    const rate = Math.max(0, Number(attendanceData.rate) || list[index].rate);
    const calculatedAmount = Math.round(units * rate * 100) / 100;
    const amount = attendanceData.amount !== undefined && attendanceData.amount !== ''
      ? Math.max(0, Number(attendanceData.amount))
      : calculatedAmount;

    const updated = {
      ...list[index],
      ...attendanceData,
      id: list[index].id,
      attendanceCode: list[index].attendanceCode,
      unitsWorked: units,
      rate,
      calculatedAmount,
      amount
    };

    try {
      await api.put(`/api/LabourAttendance/${id}`, updated);
    } catch {
      // Local fallback
    }

    list[index] = updated;
    writeStorage(STORAGE_KEYS.ATTENDANCE, list);
    return updated;
  },

  deleteAttendance: async (id) => {
    try {
      await api.delete(`/api/LabourAttendance/${id}`);
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEYS.ATTENDANCE, SEED_ATTENDANCE);
    const updated = list.filter((item) => String(item.id) !== String(id));
    writeStorage(STORAGE_KEYS.ATTENDANCE, updated);
    return { success: true };
  },

  // ── 4. Labour Payments CRUD ──────────────────────
  getPayments: async () => {
    try {
      const res = await api.get('/api/LabourPayments');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.PAYMENTS, data);
        return data;
      }
    } catch {
      // fallback
    }
    return readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
  },

  createPayment: async (paymentData) => {
    const list = readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const nextId = list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    const nextCode = `LPY-${String(nextId).padStart(3, '0')}`;

    const amountPaid = Math.max(0, Number(paymentData.amountPaid) || 0);

    const newPayment = {
      id: nextId,
      paymentCode: paymentData.paymentCode || nextCode,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      labourId: Number(paymentData.labourId),
      labourName: paymentData.labourName || 'Unknown Labourer',
      amountPaid,
      paymentMode: paymentData.paymentMode || 'Cash',
      referenceNo: paymentData.referenceNo?.trim() || '',
      periodStart: paymentData.periodStart || '',
      periodEnd: paymentData.periodEnd || '',
      notes: paymentData.notes?.trim() || ''
    };

    try {
      await api.post('/api/LabourPayments', newPayment);
    } catch {
      // Local fallback
    }

    const updated = [newPayment, ...list];
    writeStorage(STORAGE_KEYS.PAYMENTS, updated);
    return newPayment;
  },

  updatePayment: async (id, paymentData) => {
    const list = readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error('Payment record not found');

    const updated = {
      ...list[index],
      ...paymentData,
      id: list[index].id,
      paymentCode: list[index].paymentCode,
      amountPaid: Math.max(0, Number(paymentData.amountPaid) || list[index].amountPaid)
    };

    try {
      await api.put(`/api/LabourPayments/${id}`, updated);
    } catch {
      // Local fallback
    }

    list[index] = updated;
    writeStorage(STORAGE_KEYS.PAYMENTS, list);
    return updated;
  },

  deletePayment: async (id) => {
    try {
      await api.delete(`/api/LabourPayments/${id}`);
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const updated = list.filter((item) => String(item.id) !== String(id));
    writeStorage(STORAGE_KEYS.PAYMENTS, updated);
    return { success: true };
  },

  // ── 5. Balances & Financial Calculations ─────────
  calculateLabourBalances: (labours = [], attendance = [], payments = []) => {
    return labours.map((labour) => {
      const labourId = String(labour.id);
      const workerAttendance = attendance.filter((a) => String(a.labourId) === labourId);
      const workerPayments = payments.filter((p) => String(p.labourId) === labourId);

      const totalDaysWorked = workerAttendance.reduce((sum, a) => sum + (Number(a.unitsWorked) || 0), 0);
      const totalEarned = workerAttendance.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const totalPaid = workerPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
      const outstandingBalance = Math.round((totalEarned - totalPaid) * 100) / 100;

      return {
        ...labour,
        attendanceCount: workerAttendance.length,
        totalDaysWorked,
        totalEarned,
        totalPaid,
        outstandingBalance,
        lastWorkedDate: workerAttendance.length > 0 ? workerAttendance[0].date : '—',
        lastPaidDate: workerPayments.length > 0 ? workerPayments[0].paymentDate : '—'
      };
    });
  },

  getSummaryMetrics: (labours = [], attendance = [], payments = []) => {
    const totalLabourers = labours.length;
    const activeLabourers = labours.filter((l) => l.status === 'Active').length;
    const totalDaysWorked = attendance.reduce((sum, a) => sum + (Number(a.unitsWorked) || 0), 0);
    const totalLabourCost = attendance.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalPaidAmount = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const totalOutstandingBalance = Math.round((totalLabourCost - totalPaidAmount) * 100) / 100;

    return {
      totalLabourers,
      activeLabourers,
      totalAttendanceEntries: attendance.length,
      totalDaysWorked,
      totalLabourCost,
      totalPaidAmount,
      totalOutstandingBalance
    };
  }
};

export default labourService;
