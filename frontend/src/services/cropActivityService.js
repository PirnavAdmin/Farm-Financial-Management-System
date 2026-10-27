import api from './api';

const SEED_ACTIVITIES = [
  {
    id: 1,
    activityCode: 'ACT-2025-01',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    season: 'Kharif 2025-26',
    activityType: 'Land Preparation',
    activityDate: '2025-06-08',
    labourWorkers: '4 Labourers',
    machinery: 'Mahindra 575 DI Tractor',
    materialsUsed: 'Farmyard Manure (4 Trolleys)',
    totalCost: '₹ 8,500',
    status: 'Completed',
    supervisor: 'Niranjan Reddy',
    notes: 'Deep summer ploughing and secondary rotavator levelling.'
  },
  {
    id: 2,
    activityCode: 'ACT-2025-02',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    season: 'Kharif 2025-26',
    activityType: 'Sowing / Planting',
    activityDate: '2025-06-15',
    labourWorkers: '6 Labourers',
    machinery: 'Pneumatic Seed Planter',
    materialsUsed: 'BT Cotton-2 Hybrid Seed Packets (10 Pkts)',
    totalCost: '₹ 12,400',
    status: 'Completed',
    supervisor: 'Niranjan Reddy',
    notes: 'Dibbling method with 90cm x 60cm plant spacing.'
  },
  {
    id: 3,
    activityCode: 'ACT-2025-03',
    farm: 'Farm 2 (Canal Belt)',
    crop: 'Paddy (Rice)',
    season: 'Kharif 2025-26',
    activityType: 'Nursery Raising & Sowing',
    activityDate: '2025-06-10',
    labourWorkers: '5 Labourers',
    machinery: 'Mini Tiller',
    materialsUsed: 'BPT 5204 Treated Foundation Seeds (50 Kg)',
    totalCost: '₹ 7,800',
    status: 'Completed',
    supervisor: 'K. Ramarao',
    notes: 'Raised wet nursery bed with organic bio-fertilizer slurry.'
  },
  {
    id: 4,
    activityCode: 'ACT-2025-04',
    farm: 'Farm 2 (Canal Belt)',
    crop: 'Paddy (Rice)',
    season: 'Kharif 2025-26',
    activityType: 'Transplantation',
    activityDate: '2025-07-02',
    labourWorkers: '12 Women Labourers',
    machinery: 'None (Manual Transplantation)',
    materialsUsed: 'Zinc Sulphate & DAP Starter Dose (100 Kg)',
    totalCost: '₹ 15,200',
    status: 'Completed',
    supervisor: 'K. Ramarao',
    notes: 'Line planting of 22-day old paddy seedlings.'
  },
  {
    id: 5,
    activityCode: 'ACT-2025-05',
    farm: 'Sunrise Farms (East Block)',
    crop: 'Chilli',
    season: 'Annual 2025',
    activityType: 'Drip & Mulching Setup',
    activityDate: '2025-07-28',
    labourWorkers: '4 Technicians',
    machinery: 'Bed Maker & Mulch Layer',
    materialsUsed: 'Silver-Black UV Mulch Film & Inline Drip Laterals',
    totalCost: '₹ 28,000',
    status: 'Completed',
    supervisor: 'V. Krishna Murthy',
    notes: 'Raised beds with 30 micron plastic mulch and dual drippers.'
  },
  {
    id: 6,
    activityCode: 'ACT-2025-06',
    farm: 'Sunrise Farms (East Block)',
    crop: 'Chilli',
    season: 'Annual 2025',
    activityType: 'Seedling Transplantation',
    activityDate: '2025-08-10',
    labourWorkers: '8 Labourers',
    machinery: 'Manual dibblers',
    materialsUsed: 'Teja Red Pro-tray Seedlings (24,000 plants)',
    totalCost: '₹ 32,500',
    status: 'Completed',
    supervisor: 'V. Krishna Murthy',
    notes: 'Evening transplantation followed by immediate drip irrigation.'
  },
  {
    id: 7,
    activityCode: 'ACT-2025-07',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    season: 'Kharif 2025-26',
    activityType: 'Weeding & Intercultivation',
    activityDate: '2025-07-18',
    labourWorkers: '6 Labourers',
    machinery: 'Mini Power Weeder (5 HP)',
    materialsUsed: 'None',
    totalCost: '₹ 6,200',
    status: 'Completed',
    supervisor: 'Niranjan Reddy',
    notes: 'First inter-row intercultural hoeing and root aeration.'
  },
  {
    id: 8,
    activityCode: 'ACT-2025-08',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    season: 'Kharif 2025-26',
    activityType: 'Fertilizer Application',
    activityDate: '2025-08-05',
    labourWorkers: '3 Labourers',
    machinery: 'Manual Broadcaster',
    materialsUsed: 'Urea (150 Kg) + MOP (75 Kg)',
    totalCost: '₹ 5,800',
    status: 'Completed',
    supervisor: 'Niranjan Reddy',
    notes: 'Split dose top dressing placed 10cm away from plant stems.'
  },
  {
    id: 9,
    activityCode: 'ACT-2025-09',
    farm: 'Farm 2 (Canal Belt)',
    crop: 'Paddy (Rice)',
    season: 'Kharif 2025-26',
    activityType: 'Plant Protection Spraying',
    activityDate: '2025-08-22',
    labourWorkers: '2 Operators',
    machinery: 'Battery Operated Knapsack Sprayer',
    materialsUsed: 'Cartap Hydrochloride 50% SP (Stem Borer control)',
    totalCost: '₹ 4,300',
    status: 'Completed',
    supervisor: 'K. Ramarao',
    notes: 'Preventive spray during early tillering stage.'
  },
  {
    id: 10,
    activityCode: 'ACT-2025-10',
    farm: 'Sunrise Farms (East Block)',
    crop: 'Chilli',
    season: 'Annual 2025',
    activityType: 'Fertigation & Nutrient Spray',
    activityDate: '2025-09-12',
    labourWorkers: '2 Technicians',
    machinery: 'Venturi Drip Injector',
    materialsUsed: '19-19-19 Water Soluble Fertilizer (25 Kg) + Micronutrients',
    totalCost: '₹ 6,400',
    status: 'In Progress',
    supervisor: 'V. Krishna Murthy',
    notes: 'Scheduled flowering booster fertigation through drip network.'
  },
  {
    id: 11,
    activityCode: 'ACT-2025-11',
    farm: 'Farm 1 (South Block)',
    crop: 'Cotton',
    season: 'Kharif 2025-26',
    activityType: 'Harvesting / First Picking',
    activityDate: '2025-10-15',
    labourWorkers: '10 Skilled Pickers',
    machinery: 'None (Manual Picking)',
    materialsUsed: 'Clean Cotton Picking Bags',
    totalCost: '₹ 14,000',
    status: 'In Progress',
    supervisor: 'Niranjan Reddy',
    notes: 'Selective picking of clean, fully burst bolls.'
  },
  {
    id: 12,
    activityCode: 'ACT-2025-12',
    farm: 'Farm 2 (Canal Belt)',
    crop: 'Paddy (Rice)',
    season: 'Kharif 2025-26',
    activityType: 'Harvesting & Threshing',
    activityDate: '2025-11-20',
    labourWorkers: '4 Operators',
    machinery: 'Kubota Combine Harvester',
    materialsUsed: 'Gunny Bags (120 Bags)',
    totalCost: '₹ 22,000',
    status: 'Scheduled',
    supervisor: 'K. Ramarao',
    notes: 'Scheduled combine harvest when grain moisture reaches ~18%.'
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
    console.warn(`[cropActivityService] Error reading ${key} from storage:`, e);
  }
  return Array.isArray(defaultData) ? defaultData : [];
}

function setStorage(key, data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`[cropActivityService] Error saving ${key} to storage:`, e);
  }
}

export const cropActivityService = {
  getActivities: async () => {
    const raw = getStorage('agriman_crop_activities', SEED_ACTIVITIES);
    return [...raw].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  },

  getActivityById: async (id) => {
    const list = getStorage('agriman_crop_activities', SEED_ACTIVITIES);
    return list.find(a => Number(a.id) === Number(id) || a.activityCode === id) || null;
  },

  createActivity: async (newAct) => {
    const list = getStorage('agriman_crop_activities', SEED_ACTIVITIES);
    const id = list.length ? Math.max(...list.map(a => Number(a.id) || 0)) + 1 : 1;
    const activityCode = newAct.activityCode || `ACT-${new Date().getFullYear()}-${String(id).padStart(2, '0')}`;
    const record = { ...newAct, id, activityCode, status: newAct.status || 'In Progress' };
    const updated = [...list.filter(v => v.id !== record.id), record];
    setStorage('agriman_crop_activities', updated);
    return record;
  },

  updateActivity: async (id, updatedAct) => {
    const list = getStorage('agriman_crop_activities', SEED_ACTIVITIES);
    const updated = list.map(a => (a.id === id ? { ...a, ...updatedAct } : a));
    setStorage('agriman_crop_activities', updated);
    return updatedAct;
  },

  deleteActivity: async (id) => {
    const list = getStorage('agriman_crop_activities', SEED_ACTIVITIES);
    const updated = list.filter(a => a.id !== id);
    setStorage('agriman_crop_activities', updated);
    return true;
  }
};

export default cropActivityService;
