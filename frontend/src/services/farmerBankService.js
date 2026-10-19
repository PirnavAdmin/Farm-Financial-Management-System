import api from './api';

/**
 * Service to communicate with ASP.NET Core FarmerBankAccounts Web API:
 * - GET    /api/FarmerBankAccounts
 * - POST   /api/FarmerBankAccounts
 * - GET    /api/FarmerBankAccounts/{id}
 * - PUT    /api/FarmerBankAccounts/{id}
 * - DELETE /api/FarmerBankAccounts/{id}
 */
export const farmerBankService = {
  /**
   * GET /api/FarmerBankAccounts - Fetch all farmer bank accounts
   */
  getBankAccounts: async () => {
    const response = await api.get('/api/FarmerBankAccounts');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  },

  /**
   * GET /api/FarmerBankAccounts/{id} - Fetch bank account by ID
   */
  getBankAccountById: async (id) => {
    const response = await api.get(`/api/FarmerBankAccounts/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * POST /api/FarmerBankAccounts - Create a new bank account for a farmer
   * Schema: CreateFarmerBankAccountDto
   * { farmerId, bankName, accountNumber, ifsc }
   */
  createBankAccount: async (data) => {
    const payload = {
      farmerId: Number(data.farmerId),
      bankName: data.bankName?.trim() || '',
      accountNumber: String(data.accountNumber || data.accountNo || '').trim(),
      ifsc: (data.ifsc?.trim() || '').toUpperCase()
    };

    const response = await api.post('/api/FarmerBankAccounts', payload);
    return response.data?.data || response.data;
  },

  /**
   * PUT /api/FarmerBankAccounts/{id} - Update existing bank account
   */
  updateBankAccount: async (id, data) => {
    const payload = {
      farmerId: Number(data.farmerId),
      bankName: data.bankName?.trim() || '',
      accountNumber: String(data.accountNumber || data.accountNo || '').trim(),
      ifsc: (data.ifsc?.trim() || '').toUpperCase()
    };

    const response = await api.put(`/api/FarmerBankAccounts/${id}`, payload);
    return response.data?.data || response.data;
  },

  /**
   * DELETE /api/FarmerBankAccounts/{id} - Delete bank account
   */
  deleteBankAccount: async (id) => {
    const response = await api.delete(`/api/FarmerBankAccounts/${id}`);
    return response.data;
  }
};

export default farmerBankService;
