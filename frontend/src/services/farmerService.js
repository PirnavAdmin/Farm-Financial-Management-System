import api from './api';

export const farmerService = {
  getFarmers: async () => {
    const response = await api.get('/api/Farmers');
    const farmers = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : null;

    if (!farmers || farmers.some((farmer) => !farmer || typeof farmer !== 'object' || Array.isArray(farmer))) {
      throw new Error('The Farmers API returned an unsupported response. Expected a farmer list or an object with a data list.');
    }

    return farmers;
  },

  getFarmerById: async (id) => {
    const response = await api.get(`/api/Farmers/${id}`);
    return response.data?.data || response.data;
  },

  createFarmer: async (data) => {
    const payload = {
      farmerCode: data.farmerCode?.trim() || data.code?.trim(),
      farmerName: data.farmerName?.trim() || data.name?.trim(),
      fatherOrHusbandName: data.fatherOrHusbandName?.trim() || data.fatherName?.trim() || null,
      mobile: data.mobile?.trim(),
      alternateMobile: data.alternateMobile?.trim() || data.altMobile?.trim() || null,
      email: data.email?.trim() || null,
      aadhaarNo: data.aadhaarNo?.trim() || (data.aadhaar ? data.aadhaar.replace(/\s/g, '') : null),
      totalLand: data.totalLand !== undefined && data.totalLand !== '' ? Number(data.totalLand) : 0,
      status: data.status || 'Active'
    };

    const response = await api.post('/api/Farmers', payload);
    return response.data?.data || response.data;
  },

  updateFarmer: async (id, data) => {
    const payload = {
      farmerCode: data.farmerCode?.trim() || data.code?.trim(),
      farmerName: data.farmerName?.trim() || data.name?.trim(),
      fatherOrHusbandName: data.fatherOrHusbandName?.trim() || data.fatherName?.trim() || null,
      mobile: data.mobile?.trim(),
      alternateMobile: data.alternateMobile?.trim() || data.altMobile?.trim() || null,
      email: data.email?.trim() || null,
      aadhaarNo: data.aadhaarNo?.trim() || (data.aadhaar ? data.aadhaar.replace(/\s/g, '') : null),
      totalLand: data.totalLand !== undefined && data.totalLand !== '' ? Number(data.totalLand) : 0,
      status: data.status || 'Active'
    };

    const response = await api.put(`/api/Farmers/${id}`, payload);
    return response.data?.data || response.data;
  },

  deleteFarmer: async (id) => {
    const response = await api.delete(`/api/Farmers/${id}`);
    return response.data;
  },

  generateFarmerCode: (existingFarmers = []) => {
    let maxNum = 0;
    existingFarmers.forEach((f) => {
      const code = f.farmerCode || f.code || '';
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `FRM-${String(nextNum).padStart(3, '0')}`;
  }
};

export default farmerService;
