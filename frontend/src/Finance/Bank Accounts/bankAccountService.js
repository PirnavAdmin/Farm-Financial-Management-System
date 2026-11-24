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
   * Fetch all bank accounts from backend /api/FarmerBankAccounts,
   * merged with local agricultural metadata (branch, opening balance, status, etc.).
   */
  async getBankAccounts() {
    let apiAccounts = [];
    try {
      const res = await api.get('/api/FarmerBankAccounts');
      if (Array.isArray(res.data)) {
        apiAccounts = res.data;
      } else if (Array.isArray(res.data?.data)) {
        apiAccounts = res.data.data;
      }
    } catch (err) {
      console.warn('[bankAccountService] /api/FarmerBankAccounts unavailable or errored, using stored records:', err?.message);
    }

    // Load local extended metadata
    const metaList = getStoredJson(STORAGE_KEYS.ACCOUNTS_META, SEED_ACCOUNTS);
    const metaMap = new Map();
    metaList.forEach((m) => {
      if (m.accountNumber) metaMap.set(String(m.accountNumber).trim(), m);
      if (m.id) metaMap.set(`ID-${m.id}`, m);
    });

    // If API returned data, merge with metadata
    if (apiAccounts.length > 0) {
      const merged = apiAccounts.map((apiAcc) => {
        const accNo = String(apiAcc.accountNumber || '').trim();
        const meta = metaMap.get(accNo) || metaMap.get(`ID-${apiAcc.id}`) || {};

        return {
          id: apiAcc.id,
          farmerId: apiAcc.farmerId,
          accountHolderName: meta.accountHolderName || `Farmer #${apiAcc.farmerId}`,
          accountName: meta.accountName || `${apiAcc.bankName} Operational Account`,
          bankName: apiAcc.bankName || meta.bankName || 'Bank',
          accountNumber: accNo,
          ifsc: (apiAcc.ifsc || meta.ifsc || '').toUpperCase(),
          branch: meta.branch || 'Main Branch',
          branchAddress: meta.branchAddress || '',
          accountType: meta.accountType || 'Current Account',
          openingBalance: Number(meta.openingBalance) || 0,
          openingBalanceDate: meta.openingBalanceDate || '2026-04-01',
          minimumBalance: Number(meta.minimumBalance) || 0,
          status: meta.status || 'Active',
          remarks: meta.remarks || '',
        };
      });

      // Keep any purely local accounts (e.g. Cash Account) that don't belong to FarmerBankAccounts API
      metaList.forEach((localAcc) => {
        const exists = merged.some((m) => String(m.accountNumber).trim() === String(localAcc.accountNumber).trim());
        if (!exists) {
          merged.push(localAcc);
        }
      });

      return merged;
    }

    // Fallback to stored meta list
    return metaList;
  },

  /**
   * Fetch single bank account by ID
   */
  async getBankAccountById(id) {
    const list = await this.getBankAccounts();
    return list.find((a) => a.id === Number(id) || String(a.accountNumber) === String(id)) || null;
  },

  /**
   * Create a new bank account.
   * Sends { farmerId, bankName, accountNumber, ifsc } to POST /api/FarmerBankAccounts,
   * then caches extended metadata.
   */
  async createBankAccount(data) {
    const farmerId = Number(data.farmerId) || 1;
    const bankName = String(data.bankName || '').trim();
    const accountNumber = String(data.accountNumber || '').trim();
    const ifsc = String(data.ifsc || '').trim().toUpperCase();

    let createdId = Date.now();
    try {
      const res = await api.post('/api/FarmerBankAccounts', {
        farmerId,
        bankName,
        accountNumber,
        ifsc,
      });
      const returned = res.data?.data || res.data;
      if (returned?.id) createdId = returned.id;
    } catch (err) {
      console.warn('[bankAccountService] POST /api/FarmerBankAccounts failed or offline, saving locally:', err?.message);
    }

    const newAccount = {
      id: createdId,
      farmerId,
      accountHolderName: data.accountHolderName || `Farmer #${farmerId}`,
      accountName: data.accountName || `${bankName} Account`,
      bankName,
      accountNumber,
      ifsc,
      branch: data.branch || '',
      branchAddress: data.branchAddress || '',
      accountType: data.accountType || 'Current Account',
      openingBalance: Number(data.openingBalance) || 0,
      openingBalanceDate: data.openingBalanceDate || new Date().toISOString().slice(0, 10),
      minimumBalance: Number(data.minimumBalance) || 0,
      status: data.status || 'Active',
      remarks: data.remarks || '',
    };

    const metaList = getStoredJson(STORAGE_KEYS.ACCOUNTS_META, SEED_ACCOUNTS);
    metaList.unshift(newAccount);
    setStoredJson(STORAGE_KEYS.ACCOUNTS_META, metaList);

    // If opening balance > 0, automatically record an initial credit transaction
    if (newAccount.openingBalance > 0) {
      const transactions = getStoredJson(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
      transactions.unshift({
        id: `TXN-${Date.now()}-OB`,
        accountId: newAccount.id,
        accountNumber: newAccount.accountNumber,
        bankName: newAccount.bankName,
        date: newAccount.openingBalanceDate,
        referenceNo: 'INIT-OP-BAL',
        description: `Opening Balance for ${newAccount.accountName}`,
        type: 'Direct Deposit',
        category: 'Opening Balance',
        credit: newAccount.openingBalance,
        debit: 0,
        linkedRef: `ACC-${newAccount.id}`,
        status: 'Reconciled',
        reconciled: true,
      });
      setStoredJson(STORAGE_KEYS.TRANSACTIONS, transactions);
    }

    return newAccount;
  },

  /**
   * Update existing bank account.
   */
  async updateBankAccount(id, data) {
    const farmerId = Number(data.farmerId) || 1;
    const bankName = String(data.bankName || '').trim();
    const accountNumber = String(data.accountNumber || '').trim();
    const ifsc = String(data.ifsc || '').trim().toUpperCase();

    try {
      await api.put(`/api/FarmerBankAccounts/${id}`, {
        farmerId,
        bankName,
        accountNumber,
        ifsc,
      });
    } catch (err) {
      console.warn(`[bankAccountService] PUT /api/FarmerBankAccounts/${id} failed or offline, updating locally:`, err?.message);
    }

    const metaList = getStoredJson(STORAGE_KEYS.ACCOUNTS_META, SEED_ACCOUNTS);
    const updatedList = metaList.map((a) => {
      if (a.id === Number(id) || String(a.accountNumber) === accountNumber) {
        return {
          ...a,
          ...data,
          id: Number(id),
          farmerId,
          bankName,
          accountNumber,
          ifsc,
          openingBalance: Number(data.openingBalance !== undefined ? data.openingBalance : a.openingBalance) || 0,
          minimumBalance: Number(data.minimumBalance !== undefined ? data.minimumBalance : a.minimumBalance) || 0,
        };
      }
      return a;
    });

    setStoredJson(STORAGE_KEYS.ACCOUNTS_META, updatedList);
    return updatedList.find((a) => a.id === Number(id));
  },

  /**
   * Delete bank account.
   */
  async deleteBankAccount(id) {
    try {
      await api.delete(`/api/FarmerBankAccounts/${id}`);
    } catch (err) {
      console.warn(`[bankAccountService] DELETE /api/FarmerBankAccounts/${id} failed or offline:`, err?.message);
    }

    const metaList = getStoredJson(STORAGE_KEYS.ACCOUNTS_META, SEED_ACCOUNTS);
    const filtered = metaList.filter((a) => a.id !== Number(id) && String(a.id) !== String(id));
    setStoredJson(STORAGE_KEYS.ACCOUNTS_META, filtered);
    return true;
  },

  /**
   * Fetch registered Farmers for dropdown linking
   */
  async getFarmers() {
    try {
      const res = await api.get('/api/Farmers');
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      if (data.length > 0) return data;
    } catch (err) {
      console.warn('[bankAccountService] /api/Farmers failed or offline:', err?.message);
    }
    return [
      { id: 1, farmerCode: 'FARM-001', farmerName: 'Ramesh Kumar', mobile: '9848012345' },
      { id: 2, farmerCode: 'FARM-002', farmerName: 'Suresh Reddy', mobile: '9848023456' },
    ];
  },

  // ── Transactions Ledger ─────────────────────────────────────────────────────

  /**
   * Get all transactions, optionally filtered by accountId
   */
  getTransactions(accountId = null) {
    const list = getStoredJson(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (!accountId || accountId === 'All') return list;
    return list.filter((t) => t.accountId === Number(accountId) || String(t.accountId) === String(accountId));
  },

  /**
   * Record a Direct Deposit (Money In)
   */
  recordDeposit(deposit) {
    const amount = Number(deposit.amount) || 0;
    if (amount <= 0) throw new Error('Deposit amount must be greater than ₹0');

    const transactions = getStoredJson(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const newTxn = {
      id: `DEP-${Date.now()}`,
      accountId: Number(deposit.accountId),
      accountNumber: deposit.accountNumber,
      bankName: deposit.bankName,
      date: deposit.depositDate || new Date().toISOString().slice(0, 10),
      referenceNo: deposit.referenceNo || `DEP-${Date.now().toString().slice(-4)}`,
      description: deposit.description || 'Direct Farm Deposit',
      type: 'Direct Deposit',
      category: deposit.category || 'Direct Deposit',
      credit: amount,
      debit: 0,
      linkedRef: deposit.linkedRef || 'MANUAL-ENTRY',
      status: 'Completed',
      reconciled: false,
      remarks: deposit.remarks || '',
    };

    transactions.unshift(newTxn);
    setStoredJson(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTxn;
  },

  /**
   * Record a Direct Withdrawal (Money Out)
   */
  recordWithdrawal(withdrawal) {
    const amount = Number(withdrawal.amount) || 0;
    if (amount <= 0) throw new Error('Withdrawal amount must be greater than ₹0');

    const transactions = getStoredJson(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const newTxn = {
      id: `WTH-${Date.now()}`,
      accountId: Number(withdrawal.accountId),
      accountNumber: withdrawal.accountNumber,
      bankName: withdrawal.bankName,
      date: withdrawal.withdrawalDate || new Date().toISOString().slice(0, 10),
      referenceNo: withdrawal.referenceNo || `WTH-${Date.now().toString().slice(-4)}`,
      description: withdrawal.description || 'Direct Farm Cash Withdrawal',
      type: 'Direct Withdrawal',
      category: withdrawal.category || 'Cash Withdrawal',
      credit: 0,
      debit: amount,
      linkedRef: withdrawal.linkedRef || 'MANUAL-ENTRY',
      status: 'Completed',
      reconciled: false,
      remarks: withdrawal.remarks || '',
    };

    transactions.unshift(newTxn);
    setStoredJson(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTxn;
  },

  /**
   * Record an Internal Transfer between two bank accounts.
   * Atomically records:
   * 1. Outgoing Debit on Source Account
   * 2. Incoming Credit on Destination Account
   * Both share a common transferReference. Cash neutral overall.
   */
  recordTransfer(transfer) {
    const amount = Number(transfer.amount) || 0;
    if (amount <= 0) throw new Error('Transfer amount must be greater than ₹0');
    if (transfer.fromAccountId === transfer.toAccountId) {
      throw new Error('Source and destination accounts must be different');
    }

    const transferRef = transfer.referenceNo || `TRF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const date = transfer.transferDate || new Date().toISOString().slice(0, 10);
    const transactions = getStoredJson(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);

    // 1. Debit Source Account
    const debitTxn = {
      id: `TXN-${Date.now()}-OUT`,
      accountId: Number(transfer.fromAccountId),
      accountNumber: transfer.fromAccountNumber,
      bankName: transfer.fromBankName,
      date,
      referenceNo: transferRef,
      description: `Transfer to ${transfer.toBankName} (${transfer.toAccountName}): ${transfer.description || 'Internal transfer'}`,
      type: 'Internal Transfer Out',
      category: 'Internal Transfer',
      credit: 0,
      debit: amount,
      linkedRef: transferRef,
      status: 'Completed',
      reconciled: false,
    };

    // 2. Credit Destination Account
    const creditTxn = {
      id: `TXN-${Date.now() + 1}-IN`,
      accountId: Number(transfer.toAccountId),
      accountNumber: transfer.toAccountNumber,
      bankName: transfer.toBankName,
      date,
      referenceNo: transferRef,
      description: `Transfer from ${transfer.fromBankName} (${transfer.fromAccountName}): ${transfer.description || 'Internal transfer'}`,
      type: 'Internal Transfer In',
      category: 'Internal Transfer',
      credit: amount,
      debit: 0,
      linkedRef: transferRef,
      status: 'Completed',
      reconciled: false,
    };

    transactions.unshift(debitTxn, creditTxn);
    setStoredJson(STORAGE_KEYS.TRANSACTIONS, transactions);
    return { transferRef, debitTxn, creditTxn };
  },

  /**
   * Update reconciliation status for a transaction
   */
  reconcileTransaction(transactionId, reconciled = true) {
    const transactions = getStoredJson(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const updated = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          reconciled,
          status: reconciled ? 'Reconciled' : 'Completed',
          reconciledDate: reconciled ? new Date().toISOString().slice(0, 10) : null,
        };
      }
      return t;
    });
    setStoredJson(STORAGE_KEYS.TRANSACTIONS, updated);
    return updated.find((t) => t.id === transactionId);
  },

  /**
   * Save a Bank Reconciliation statement session
   */
  saveReconciliation(recon) {
    const recons = getStoredJson(STORAGE_KEYS.RECONCILIATIONS, []);
    const newRecon = {
      id: `REC-STMT-${Date.now()}`,
      accountId: Number(recon.accountId),
      accountNumber: recon.accountNumber,
      statementDate: recon.statementDate,
      statementOpeningBalance: Number(recon.statementOpeningBalance) || 0,
      statementClosingBalance: Number(recon.statementClosingBalance) || 0,
      reconciledBalance: Number(recon.reconciledBalance) || 0,
      differenceAmount: Number(recon.differenceAmount) || 0,
      matchedCount: Number(recon.matchedCount) || 0,
      unmatchedCount: Number(recon.unmatchedCount) || 0,
      status: Math.abs(Number(recon.differenceAmount) || 0) < 0.01 ? 'Balanced / Reconciled' : 'Discrepancy Found',
      remarks: recon.remarks || '',
      createdAt: new Date().toISOString(),
    };
    recons.unshift(newRecon);
    setStoredJson(STORAGE_KEYS.RECONCILIATIONS, recons);
    return newRecon;
  },

  /**
   * Get past reconciliations for an account
   */
  getReconciliations(accountId = null) {
    const list = getStoredJson(STORAGE_KEYS.RECONCILIATIONS, []);
    if (!accountId || accountId === 'All') return list;
    return list.filter((r) => r.accountId === Number(accountId));
  },

  // ── Calculation Engines ─────────────────────────────────────────────────────

  /**
   * Compute Running Balances for a chronological list of transactions
   */
  computeRunningBalances(transactions, openingBalance = 0) {
    // Sort oldest to newest for cumulative calculation
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = Number(openingBalance) || 0;

    const computed = sorted.map((t) => {
      // Exclude cancelled transactions from balance
      if (t.status === 'Cancelled') {
        return { ...t, runningBalance: running };
      }
      const credit = Number(t.credit) || 0;
      const debit = Number(t.debit) || 0;
      running = running + credit - debit;
      return {
        ...t,
        runningBalance: running,
      };
    });

    // Return in reverse chronological order (newest first for display)
    return computed.reverse();
  },

  /**
   * Compute actual balance for each account:
   * Current Balance = Opening Balance + Eligible Credits - Eligible Debits
   */
  computeAccountBalances(accounts, transactions) {
    return accounts.map((acc) => {
      const accTxns = transactions.filter(
        (t) => (t.accountId === acc.id || String(t.accountNumber) === String(acc.accountNumber)) && t.status !== 'Cancelled'
      );

      const totalCredits = accTxns.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
      const totalDebits = accTxns.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
      const openingBalance = Number(acc.openingBalance) || 0;
      const currentBalance = openingBalance + totalCredits - totalDebits;

      return {
        ...acc,
        openingBalance,
        totalCredits,
        totalDebits,
        currentBalance,
      };
    });
  },

  /**
   * Compute portfolio-wide summary KPIs:
   * 1. Total Bank Accounts (active / total)
   * 2. Total Available Balance (sum of active accounts)
   * 3. Total Money Received (total credits across eligible accounts)
   * 4. Total Money Paid (total debits across eligible accounts)
   */
  computeSummaryKpis(accountsWithBalances, transactions) {
    const totalAccounts = accountsWithBalances.length;
    const activeAccounts = accountsWithBalances.filter((a) => a.status === 'Active');
    const activeAccountsCount = activeAccounts.length;

    const totalAvailableBalance = activeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

    // Sum credits and debits from completed/reconciled transactions of active accounts
    const activeAccountIds = new Set(activeAccounts.map((a) => a.id));
    const eligibleTxns = transactions.filter(
      (t) => activeAccountIds.has(t.accountId) && t.status !== 'Cancelled'
    );

    const totalMoneyReceived = eligibleTxns.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    const totalMoneyPaid = eligibleTxns.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);

    return {
      totalAccounts,
      activeAccountsCount,
      totalAvailableBalance,
      totalMoneyReceived,
      totalMoneyPaid,
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
