import api from '../../services/api';

const STORAGE_KEYS = {
  ACCOUNTS_META: 'agriman-finance-bank-accounts-meta-v2',
  TRANSACTIONS: 'agriman-finance-bank-transactions-v2',
  RECONCILIATIONS: 'agriman-finance-bank-reconciliations-v2',
};

// Seed accounts with realistic agricultural details
export const SEED_ACCOUNTS = [
  {
    id: 1,
    farmerId: 1,
    accountHolderName: 'Ramesh Kumar (FARM-001)',
    accountName: 'AGRIMAN Main Operational Account',
    bankName: 'HDFC Bank',
    accountNumber: '50100428912456',
    ifsc: 'HDFC0001042',
    branch: 'Vijayawada Rural',
    branchAddress: 'Main Road, Benz Circle, Vijayawada, AP - 520010',
    accountType: 'Current Account',
    openingBalance: 200000,
    openingBalanceDate: '2026-04-01',
    minimumBalance: 10000,
    status: 'Active',
    remarks: 'Primary operational bank account for sales receipts and supplier settlements',
  },
  {
    id: 2,
    farmerId: 1,
    accountHolderName: 'Ramesh Kumar (FARM-001)',
    accountName: 'KCC & Subsidized Agriculture Credit Account',
    bankName: 'State Bank of India',
    accountNumber: '31980045217891',
    ifsc: 'SBIN0004521',
    branch: 'Agri Commercial Branch, Guntur',
    branchAddress: 'Kisan Bhawan Road, Guntur, AP - 522002',
    accountType: 'Agricultural Business Account',
    openingBalance: 150000,
    openingBalanceDate: '2026-04-01',
    minimumBalance: 5000,
    status: 'Active',
    remarks: 'Dedicated account for Kisan Credit Card loan inflows and seasonal crop disbursements',
  },
  {
    id: 3,
    farmerId: 1,
    accountHolderName: 'Ramesh Kumar (FARM-001)',
    accountName: 'Farm Cash & Vault Reserve',
    bankName: 'Cash Account',
    accountNumber: 'CASH-VAULT-001',
    ifsc: 'CASH0000001',
    branch: 'Main Farm Office',
    branchAddress: 'Central Agriman Farmhouse, Plot 4A, Vijayawada',
    accountType: 'Cash Account',
    openingBalance: 35000,
    openingBalanceDate: '2026-04-01',
    minimumBalance: 0,
    status: 'Active',
    remarks: 'Physical petty cash for daily labor wages and local spot purchases',
  },
  {
    id: 4,
    farmerId: 1,
    accountHolderName: 'Ramesh Kumar (FARM-001)',
    accountName: 'District Co-op Reserve Savings',
    bankName: 'District Cooperative Central Bank (DCCB)',
    accountNumber: '1004589230112',
    ifsc: 'DCCB0000412',
    branch: 'Tenali Branch',
    branchAddress: 'Bazaar Street, Tenali, AP - 522201',
    accountType: 'Savings Account',
    openingBalance: 75000,
    openingBalanceDate: '2026-04-01',
    minimumBalance: 2000,
    status: 'Active',
    remarks: 'Emergency reserve savings with local cooperative',
  },
];

// Seed transactions reflecting agricultural operations
export const SEED_TRANSACTIONS = [
  {
    id: 'TXN-2026-001',
    accountId: 1,
    accountNumber: '50100428912456',
    bankName: 'HDFC Bank',
    date: '2026-04-01',
    referenceNo: 'INIT-OP-BAL',
    description: 'Initial Opening Balance Carryforward',
    type: 'Direct Deposit',
    category: 'Opening Balance',
    credit: 200000,
    debit: 0,
    linkedRef: 'OB-2026',
    status: 'Reconciled',
    reconciled: true,
  },
  {
    id: 'TXN-2026-002',
    accountId: 2,
    accountNumber: '31980045217891',
    bankName: 'State Bank of India',
    date: '2026-04-01',
    referenceNo: 'INIT-OP-BAL',
    description: 'KCC Account Opening Sanction Inflow',
    type: 'Direct Deposit',
    category: 'Opening Balance',
    credit: 150000,
    debit: 0,
    linkedRef: 'OB-2026',
    status: 'Reconciled',
    reconciled: true,
  },
  {
    id: 'TXN-2026-003',
    accountId: 3,
    accountNumber: 'CASH-VAULT-001',
    bankName: 'Cash Account',
    date: '2026-04-01',
    referenceNo: 'INIT-OP-BAL',
    description: 'Petty Cash Opening Vault Balance',
    type: 'Direct Deposit',
    category: 'Opening Balance',
    credit: 35000,
    debit: 0,
    linkedRef: 'OB-2026',
    status: 'Reconciled',
    reconciled: true,
  },
  {
    id: 'TXN-2026-004',
    accountId: 1,
    accountNumber: '50100428912456',
    bankName: 'HDFC Bank',
    date: '2026-05-15',
    referenceNo: 'REC-2026-042',
    description: 'Paddy Harvest Collection from Sri Lakshmi Traders',
    type: 'Customer Receipt',
    category: 'Crop Sales',
    credit: 380000,
    debit: 0,
    linkedRef: 'SALES-2026-088',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-005',
    accountId: 1,
    accountNumber: '50100428912456',
    bankName: 'HDFC Bank',
    date: '2026-06-10',
    referenceNo: 'PMT-2026-015',
    description: 'Bulk Urea & Complex Fertilizer Payment to Coromandel',
    type: 'Supplier Payment',
    category: 'Fertilizers & Chemicals',
    credit: 0,
    debit: 125000,
    linkedRef: 'EXP-2026-034',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-006',
    accountId: 2,
    accountNumber: '31980045217891',
    bankName: 'State Bank of India',
    date: '2026-07-02',
    referenceNo: 'DSB-2026-001',
    description: 'Kisan Credit Card Loan 1st Tranche Release',
    type: 'Loan Disbursement',
    category: 'Financing',
    credit: 250000,
    debit: 0,
    linkedRef: 'LOAN-2026-001',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-007',
    accountId: 1,
    accountNumber: '50100428912456',
    bankName: 'HDFC Bank',
    date: '2026-08-20',
    referenceNo: 'TRF-2026-001',
    description: 'Cash replenishment from HDFC Bank to Farm Cash Vault',
    type: 'Internal Transfer Out',
    category: 'Internal Transfer',
    credit: 0,
    debit: 50000,
    linkedRef: 'TRF-2026-001',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-008',
    accountId: 3,
    accountNumber: 'CASH-VAULT-001',
    bankName: 'Cash Account',
    date: '2026-08-20',
    referenceNo: 'TRF-2026-001',
    description: 'Cash received from HDFC Bank ATM replenishment',
    type: 'Internal Transfer In',
    category: 'Internal Transfer',
    credit: 50000,
    debit: 0,
    linkedRef: 'TRF-2026-001',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-009',
    accountId: 3,
    accountNumber: 'CASH-VAULT-001',
    bankName: 'Cash Account',
    date: '2026-09-05',
    referenceNo: 'PMT-2026-072',
    description: 'Transplanting & Weeding Seasonal Labor Wages (Cash)',
    type: 'Expense Settlement',
    category: 'Labor Wages',
    credit: 0,
    debit: 32000,
    linkedRef: 'EXP-2026-081',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-010',
    accountId: 2,
    accountNumber: '31980045217891',
    bankName: 'State Bank of India',
    date: '2026-10-15',
    referenceNo: 'PMT-2026-095',
    description: 'KCC Half-Yearly Interest Repayment',
    type: 'Loan Repayment',
    category: 'Loan EMI / Interest',
    credit: 0,
    debit: 18500,
    linkedRef: 'LOAN-2026-001',
    status: 'Completed',
    reconciled: true,
  },
  {
    id: 'TXN-2026-011',
    accountId: 1,
    accountNumber: '50100428912456',
    bankName: 'HDFC Bank',
    date: '2026-11-10',
    referenceNo: 'DEP-2026-004',
    description: 'Solar Drip Irrigation State Government Subsidy Inflow',
    type: 'Direct Deposit',
    category: 'Government Subsidy',
    credit: 75000,
    debit: 0,
    linkedRef: 'SUB-2026-90',
    status: 'Completed',
    reconciled: false,
  },
];

// Helper: Read / Write Local Storage
function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function setStoredJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[bankAccountService] Unable to persist ${key}:`, err);
  }
}

// ── Service Definition ────────────────────────────────────────────────────────

export const bankAccountService = {
  /**
   * Fetch all bank accounts strictly from backend /api/BankAccounts.
   */
  async getBankAccounts(params = {}) {
    const res = await api.get('/api/BankAccounts', { params });
    const rows = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    return rows.map((apiAcc) => ({
      id: apiAcc.id,
      farmerId: apiAcc.farmerId ?? null,
      accountHolderName: apiAcc.accountHolderName || apiAcc.accountName || '',
      accountName: apiAcc.accountName || `${apiAcc.bankName || 'Bank'} Account`,
      bankName: apiAcc.bankName || '',
      accountNumber: String(apiAcc.accountNumber || '').trim(),
      ifsc: String(apiAcc.ifsc || '').toUpperCase(),
      branch: apiAcc.branch || '',
      branchAddress: apiAcc.branchAddress || '',
      accountType: apiAcc.accountType || 'Current Account',
      openingBalance: Number(apiAcc.openingBalance) || 0,
      currentBalance: Number(apiAcc.currentBalance ?? apiAcc.openingBalance) || 0,
      openingBalanceDate: apiAcc.openingBalanceDate || '',
      minimumBalance: Number(apiAcc.minimumBalance) || 0,
      status: apiAcc.status || 'Active',
      remarks: apiAcc.remarks || '',
    }));
  },

  /**
   * Fetch single bank account by ID from backend /api/BankAccounts/{id}
   */
  async getBankAccountById(id) {
    const res = await api.get(`/api/BankAccounts/${encodeURIComponent(id)}`);
    return res.data?.data || res.data || null;
  },

  /**
   * Create a new bank account via POST /api/BankAccounts.
   */
  async createBankAccount(data) {
    const bankName = String(data.bankName || '').trim();
    const accountNumber = String(data.accountNumber || '').trim();
    if (!bankName) throw new Error('Bank name is required.');
    if (!accountNumber) throw new Error('Account number is required.');

    const payload = {
      accountName: data.accountName || `${bankName} Account`,
      accountHolderName: data.accountHolderName || '',
      bankName,
      accountNumber,
      ifsc: String(data.ifsc || '').trim().toUpperCase(),
      branch: data.branch || '',
      branchAddress: data.branchAddress || '',
      accountType: data.accountType || 'Current Account',
      openingBalance: Number(data.openingBalance) || 0,
      currentBalance: Number(data.openingBalance) || 0,
      minimumBalance: Number(data.minimumBalance) || 0,
      status: data.status || 'Active',
      remarks: data.remarks || '',
    };

    const res = await api.post('/api/BankAccounts', payload);
    return res.data?.data || res.data;
  },

  /**
   * Update existing bank account via PUT /api/BankAccounts/{id}.
   */
  async updateBankAccount(id, data) {
    const bankName = String(data.bankName || '').trim();
    const accountNumber = String(data.accountNumber || '').trim();
    const payload = {
      id: Number(id),
      accountName: data.accountName || `${bankName} Account`,
      accountHolderName: data.accountHolderName || '',
      bankName,
      accountNumber,
      ifsc: String(data.ifsc || '').trim().toUpperCase(),
      branch: data.branch || '',
      branchAddress: data.branchAddress || '',
      accountType: data.accountType || 'Current Account',
      openingBalance: Number(data.openingBalance) || 0,
      currentBalance: Number(data.currentBalance ?? data.openingBalance) || 0,
      minimumBalance: Number(data.minimumBalance) || 0,
      status: data.status || 'Active',
      remarks: data.remarks || '',
    };

    const res = await api.put(`/api/BankAccounts/${encodeURIComponent(id)}`, payload);
    return res.data?.data || res.data;
  },

  /**
   * Delete bank account via DELETE /api/BankAccounts/{id}.
   */
  async deleteBankAccount(id) {
    await api.delete(`/api/BankAccounts/${encodeURIComponent(id)}`);
    return true;
  },

  /**
   * Fetch registered Farmers from /api/Farmers
   */
  async getFarmers() {
    const res = await api.get('/api/Farmers');
    return Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
  },

  // ── Transactions Ledger (Backend endpoints not yet implemented in BankAccountsController) ──

  getTransactions() {
    return [];
  },

  recordDeposit() {
    throw new Error('Backend endpoint missing: POST /api/BankAccounts/{id}/transactions (Deposit) is not yet implemented on the server.');
  },

  recordWithdrawal() {
    throw new Error('Backend endpoint missing: POST /api/BankAccounts/{id}/transactions (Withdrawal) is not yet implemented on the server.');
  },

  recordTransfer() {
    throw new Error('Backend endpoint missing: POST /api/BankAccounts/transfers is not yet implemented on the server.');
  },

  reconcileTransaction() {
    throw new Error('Backend endpoint missing: PATCH /api/BankAccounts/transactions/{id}/reconcile is not yet implemented on the server.');
  },

  saveReconciliation() {
    throw new Error('Backend endpoint missing: POST /api/BankAccounts/{id}/reconcile is not yet implemented on the server.');
  },

  getReconciliations() {
    return [];
  },

  // ── Backend-Authoritative Balance & Summary Mappers ─────────────────────────

  computeRunningBalances(transactions) {
    return Array.isArray(transactions) ? transactions : [];
  },

  computeAccountBalances(accounts) {
    return (Array.isArray(accounts) ? accounts : []).map((acc) => ({
      ...acc,
      openingBalance: Number(acc.openingBalance) || 0,
      totalCredits: Number(acc.totalCredits) || 0,
      totalDebits: Number(acc.totalDebits) || 0,
      currentBalance: Number(acc.currentBalance ?? acc.openingBalance) || 0,
    }));
  },

  computeSummaryKpis(accountsWithBalances) {
    const list = Array.isArray(accountsWithBalances) ? accountsWithBalances : [];
    const activeAccounts = list.filter((a) => a.status === 'Active');
    const totalAvailableBalance = activeAccounts.reduce(
      (sum, a) => sum + (Number(a.currentBalance) || 0),
      0
    );
    return {
      totalAccounts: list.length,
      activeAccountsCount: activeAccounts.length,
      totalAvailableBalance,
      totalMoneyReceived: 0,
      totalMoneyPaid: 0,
    };
  },

  // ── Formatting Utilities ────────────────────────────────────────────────────

  maskAccountNumber(accountNo, isRevealed = false) {
    if (!accountNo) return '—';
    const s = String(accountNo).trim();
    if (isRevealed || s.startsWith('CASH') || s.length <= 4) return s;
    const last4 = s.slice(-4);
    const maskedLength = Math.max(0, s.length - 4);
    const bullets = '•'.repeat(Math.min(8, maskedLength));
    return `${bullets} ${last4}`;
  },

  formatCurrency(val) {
    const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(n)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(n);
  },

  formatDate(val) {
    if (!val) return '';
    const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const [, year, month, day] = m;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
    }
    return val;
  },

  parseAmount(val) {
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const clean = String(val ?? '').replace(/[^\d.-]/g, '');
    const n = parseFloat(clean);
    return Number.isFinite(n) ? n : 0;
  },
};

export default bankAccountService;
