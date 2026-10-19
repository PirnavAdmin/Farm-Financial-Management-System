import api from './api';

/**
 * Service to communicate with ASP.NET Core FarmerAddresses Web API:
 * - GET    /api/FarmerAddresses
 * - POST   /api/FarmerAddresses
 * - GET    /api/FarmerAddresses/{id}
 * - PUT    /api/FarmerAddresses/{id}
 * - DELETE /api/FarmerAddresses/{id}
 */
export const farmerAddressService = {
  /**
   * GET /api/FarmerAddresses - Fetch all farmer addresses
   */
  getAddresses: async () => {
    const response = await api.get('/api/FarmerAddresses');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  },

  /**
   * GET /api/FarmerAddresses/{id} - Fetch address by ID
   */
  getAddressById: async (id) => {
    const response = await api.get(`/api/FarmerAddresses/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * POST /api/FarmerAddresses - Create a new address for a farmer
   * Schema: CreateFarmerAddressDto
   * { farmerId, address, village, mandal, district, state, pinCode }
   */
  createAddress: async (data) => {
    const payload = {
      farmerId: Number(data.farmerId),
      address: data.address?.trim() || null,
      village: data.village?.trim() || '',
      mandal: data.mandal?.trim() || '',
      district: data.district?.trim() || '',
      state: data.state?.trim() || '',
      pinCode: String(data.pinCode || data.pin || '').trim()
    };

    const response = await api.post('/api/FarmerAddresses', payload);
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/FarmerAddresses/{id} - Update an existing farmer address
   */
  updateAddress: async (id, data) => {
    const payload = {
      farmerId: Number(data.farmerId),
      address: data.address?.trim() || null,
      village: data.village?.trim() || '',
      mandal: data.mandal?.trim() || '',
      district: data.district?.trim() || '',
      state: data.state?.trim() || '',
      pinCode: String(data.pinCode || data.pin || '').trim()
    };

    const response = await api.put(`/api/FarmerAddresses/${id}`, payload);
    return response.data?.data || response.data;
  },

  /**
   * DELETE /api/FarmerAddresses/{id} - Delete an address record
   */
  deleteAddress: async (id) => {
    const response = await api.delete(`/api/FarmerAddresses/${id}`);
    return response.data;
  }
};

export default farmerAddressService;
