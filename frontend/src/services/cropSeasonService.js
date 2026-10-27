import api from './api';

const SEED_SEASONS = [
  {
    id: 'CS-2025-01',
    seasonCode: 'CS-2025-01',
    farm: 'Farm 1 (South Block)',
    farmName: 'Farm 1 (South Block)',
    crop: 'Cotton',
    cropName: 'Cotton',
    variety: 'BT Cotton-2',
    varietyName: 'BT Cotton-2',
    season: 'Kharif 2025-26',
    sowingDate: '2025-06-15',
    expectedHarvestDate: '2025-11-20',
    actualHarvestDate: '2025-11-18',
    area: '10 Acres',
    expectedYield: '120 Quintals',
    expectedRevenue: '₹ 8,50,000',
    status: 'Harvested'
  },
  {
    id: 'CS-2025-02',
    seasonCode: 'CS-2025-02',
    farm: 'Farm 2 (Canal Belt)',
    farmName: 'Farm 2 (Canal Belt)',
    crop: 'Paddy (Rice)',
    cropName: 'Paddy (Rice)',
    variety: 'BPT 5204 (Samba)',
    varietyName: 'BPT 5204 (Samba)',
    season: 'Kharif 2025-26',
    sowingDate: '2025-07-02',
    expectedHarvestDate: '2025-11-28',
    actualHarvestDate: '',
    area: '12 Acres',
    expectedYield: '360 Bags',
    expectedRevenue: '₹ 2,20,000',
    status: 'In Progress'
  },
  {
    id: 'CS-2025-03',
    seasonCode: 'CS-2025-03',
    farm: 'Sunrise Farms (East Block)',
    farmName: 'Sunrise Farms (East Block)',
    crop: 'Chilli',
    cropName: 'Chilli',
    variety: 'Teja Red',
    varietyName: 'Teja Red',
    season: 'Annual 2025',
    sowingDate: '2025-08-10',
    expectedHarvestDate: '2026-01-15',
    actualHarvestDate: '',
    area: '8 Acres',
    expectedYield: '90 Quintals',
    expectedRevenue: '₹ 1,80,000',
    status: 'In Progress'
  },
  {
    id: 'CS-2025-04',
    seasonCode: 'CS-2025-04',
    farm: 'Farm 2 (Canal Belt)',
    farmName: 'Farm 2 (Canal Belt)',
    crop: 'Maize',
    cropName: 'Maize',
    variety: 'Pioneer 3396',
    varietyName: 'Pioneer 3396',
    season: 'Kharif 2025',
    sowingDate: '2025-06-25',
    expectedHarvestDate: '2025-10-15',
    actualHarvestDate: '2025-10-14',
    area: '3 Acres',
    expectedYield: '65 Quintals',
    expectedRevenue: '₹ 90,000',
    status: 'Harvested'
  },
  {
    id: 'CS-2025-05',
    seasonCode: 'CS-2025-05',
    farm: 'Krishna Delta Parcel',
    farmName: 'Krishna Delta Parcel',
    crop: 'Tomato',
    cropName: 'Tomato',
    variety: 'US 440',
    varietyName: 'US 440',
    season: 'Rabi 2025',
    sowingDate: '2025-09-05',
    expectedHarvestDate: '2025-12-10',
    actualHarvestDate: '',
    area: '5 Acres',
    expectedYield: '1200 Boxes',
    expectedRevenue: '₹ 1,40,000',
    status: 'In Progress'
  },
  {
    id: 'CS-2025-06',
    seasonCode: 'CS-2025-06',
    farm: 'Farm 1 (South Block)',
    farmName: 'Farm 1 (South Block)',
    crop: 'Groundnut',
    cropName: 'Groundnut',
    variety: 'TAG-24',
    varietyName: 'TAG-24',
    season: 'Rabi 2025',
    sowingDate: '2025-09-20',
    expectedHarvestDate: '2026-01-05',
    actualHarvestDate: '',
    area: '6 Acres',
    expectedYield: '140 Bags',
    expectedRevenue: '₹ 1,10,000',
    status: 'In Progress'
  },
  {
    id: 'CS-2025-07',
    seasonCode: 'CS-2025-07',
    farm: 'Krishna Delta Parcel',
    farmName: 'Krishna Delta Parcel',
    crop: 'Sugarcane',
    cropName: 'Sugarcane',
    variety: 'Co 86032',
    varietyName: 'Co 86032',
    season: 'Annual 2025-26',
    sowingDate: '2025-03-12',
    expectedHarvestDate: '2026-02-15',
    actualHarvestDate: '',
    area: '5 Acres',
    expectedYield: '250 Tonnes',
    expectedRevenue: '₹ 3,10,000',
    status: 'In Progress'
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
    console.warn(`[cropSeasonService] Error reading ${key} from storage:`, e);
  }
  return Array.isArray(defaultData) ? defaultData : [];
}

function setStorage(key, data) {
  try {
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.warn(`[cropSeasonService] Error saving ${key} to storage:`, e);
  }
}

export const cropSeasonService = {
  getSeasons: async () => {
    const raw = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const normalized = raw.map((s, idx) => {
      const idVal = s.id || idx + 1;
      const seasonCode = s.seasonCode || s.code || (typeof idVal === 'string' && idVal.startsWith('CS-') ? idVal : `CS-2025-${String(idVal).padStart(2, '0')}`);
      const farm = s.farm || s.farmName || s.parcel || 'Farm 1 (South Block)';
      const crop = s.crop || s.cropName || 'Cotton';
      const variety = s.variety || s.varietyName || 'Standard';
      return {
        ...s,
        id: s.id || seasonCode,
        seasonCode,
        farm,
        farmName: s.farmName || farm,
        crop,
        cropName: s.cropName || crop,
        variety,
        varietyName: s.varietyName || variety,
      };
    });
    const getSeasonNumeric = (s) => {
      const code = String(s.seasonCode || s.code || s.id || '');
      const digits = code.replace(/[^\d]/g, '');
      return Number(digits) || 0;
    };
    normalized.sort((a, b) => getSeasonNumeric(a) - getSeasonNumeric(b));
    setStorage('agriman_crop_seasons', normalized);
    return normalized;
  },

  getSeasonById: async (id) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    return list.find(s => s.id === id || s.seasonCode === id) || null;
  },

  createSeason: async (newSeason) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const seqNums = list.map(s => {
      const parts = String(s.seasonCode || s.id || '').split('-');
      const lastPart = parts[parts.length - 1];
      return Number(lastPart) || 0;
    });
    const nextSeq = seqNums.length ? Math.max(...seqNums) + 1 : 1;
    const seasonCode = newSeason.seasonCode || `CS-${new Date().getFullYear()}-${String(nextSeq).padStart(2, '0')}`;
    const farmVal = newSeason.farm || newSeason.farmName || 'Farm 1 (South Block)';
    const cropVal = newSeason.crop || newSeason.cropName || 'Cotton';
    const record = {
      ...newSeason,
      id: seasonCode,
      seasonCode,
      farm: farmVal,
      farmName: farmVal,
      crop: cropVal,
      cropName: cropVal,
      status: newSeason.status || 'In Progress'
    };
    const updated = [...list.filter(s => s.id !== record.id && s.seasonCode !== record.seasonCode), record];
    setStorage('agriman_crop_seasons', updated);
    return record;
  },

  updateSeason: async (id, updatedSeason) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const farmVal = updatedSeason.farm || updatedSeason.farmName;
    const cropVal = updatedSeason.crop || updatedSeason.cropName;
    const updated = list.map(s => {
      if (s.id === id || s.seasonCode === id) {
        return {
          ...s,
          ...updatedSeason,
          farm: farmVal || s.farm,
          farmName: farmVal || s.farmName || s.farm,
          crop: cropVal || s.crop,
          cropName: cropVal || s.cropName || s.crop,
        };
      }
      return s;
    });
    setStorage('agriman_crop_seasons', updated);
    return updatedSeason;
  },

  deleteSeason: async (id) => {
    const list = getStorage('agriman_crop_seasons', SEED_SEASONS);
    const updated = list.filter(s => s.id !== id && s.seasonCode !== id);
    setStorage('agriman_crop_seasons', updated);
    return true;
  }
};

export default cropSeasonService;
