import api from './api.js';

// ─── Default Reference Seed Data ─────────────────────────────────────────────
export const SEED_SUPPLIERS = [
  {
    id: 1,
    supplierCode: 'SUP-001',
    supplierName: 'National Seeds Corporation',
    supplierType: 'Seeds',
    mobile: '9849123410',
    email: 'contact@nationalseeds.gov.in',
    address: 'Plot 45, Industrial Estate, Autonagar',
    city: 'Vijayawada',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    pinCode: '520007',
    gstin: '37AABCN1234F1Z8',
    bankName: 'State Bank of India',
    accountNumber: '39876543210',
    ifscCode: 'SBIN0001234',
    branchName: 'Autonagar Branch',
    openingBalance: 15000,
    status: 'Active',
    notes: 'Government certified foundation and breeder seeds distributor'
  },
  {
    id: 2,
    supplierCode: 'SUP-002',
    supplierName: 'IFFCO Agro Supplies',
    supplierType: 'Fertilizers',
    mobile: '9849123411',
    email: 'supplies@iffco.in',
    address: 'NH-16 Bypass Road, Tadepalli',
    city: 'Tadepalli',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pinCode: '522501',
    gstin: '37AAACI2014K1Z3',
    bankName: 'HDFC Bank',
    accountNumber: '50200088192341',
    ifscCode: 'HDFC0000412',
    branchName: 'Tadepalli',
    openingBalance: 24500,
    status: 'Active',
    notes: 'Primary cooperative supplier for chemical fertilizers and urea'
  },
  {
    id: 3,
    supplierCode: 'SUP-003',
    supplierName: 'Coromandel Agro Chemicals',
    supplierType: 'Fertilizers',
    mobile: '9849123412',
    email: 'orders@coromandel.biz',
    address: 'Fertilizer City, Coromandel Gate',
    city: 'Visakhapatnam',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    pinCode: '530014',
    gstin: '37AAACC4451D1ZP',
    bankName: 'ICICI Bank',
    accountNumber: '004205011982',
    ifscCode: 'ICIC0000042',
    branchName: 'Vizag Port',
    openingBalance: 0,
    status: 'Active',
    notes: 'Phosphatic fertilizers, complex DAP, and water soluble nutrients'
  },
  {
    id: 4,
    supplierCode: 'SUP-004',
    supplierName: 'Bayer CropScience',
    supplierType: 'Pesticides',
    mobile: '9849123413',
    email: 'care@bayercropscience.com',
    address: 'Bayer House, Central Park, BKC',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    pinCode: '400051',
    gstin: '27AAACB2188E1ZT',
    bankName: 'Citibank India',
    accountNumber: '0341882901',
    ifscCode: 'CITI0000002',
    branchName: 'BKC Mumbai',
    openingBalance: 32000,
    status: 'Active',
    notes: 'Crop protection products, fungicides, insecticides and herbicides'
  },
  {
    id: 5,
    supplierCode: 'SUP-005',
    supplierName: 'Rasi Seeds Pvt Ltd',
    supplierType: 'Seeds',
    mobile: '9849123414',
    email: 'sales@rasiseeds.com',
    address: '174 Sathyamangalam Road',
    city: 'Erode',
    district: 'Erode',
    state: 'Tamil Nadu',
    pinCode: '638003',
    gstin: '33AAACR7812G1ZA',
    bankName: 'Canara Bank',
    accountNumber: '1209101034567',
    ifscCode: 'CNRB0001209',
    branchName: 'Erode Main',
    openingBalance: 8400,
    status: 'Active',
    notes: 'Cotton Bt-II and hybrid vegetable seed specialists'
  },
  {
    id: 6,
    supplierCode: 'SUP-006',
    supplierName: 'Mahindra Spares Depot',
    supplierType: 'Farm Machinery',
    mobile: '9849123415',
    email: 'service@mahindraspares.in',
    address: 'Plot 12, Auto Nagar Service Road',
    city: 'Guntur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pinCode: '522001',
    gstin: '37AAACM3910L1Z4',
    bankName: 'State Bank of India',
    accountNumber: '31298456123',
    ifscCode: 'SBIN0000843',
    branchName: 'Guntur Bazaar',
    openingBalance: 18200,
    status: 'Active',
    notes: 'OEM genuine spare parts for tractors, tillers, and rotavators'
  },
  {
    id: 7,
    supplierCode: 'SUP-007',
    supplierName: 'Jain Irrigation Systems',
    supplierType: 'Irrigation & Equipment',
    mobile: '9849123416',
    email: 'agri@jains.com',
    address: 'Jain Plastic Park, NH-6',
    city: 'Jalgaon',
    district: 'Jalgaon',
    state: 'Maharashtra',
    pinCode: '425001',
    gstin: '27AAACJ0192Q1ZV',
    bankName: 'Bank of Baroda',
    accountNumber: '04870200001234',
    ifscCode: 'BARB0JALGAO',
    branchName: 'Jalgaon Main',
    openingBalance: 0,
    status: 'Active',
    notes: 'Drip lines, micro-sprinklers, filters, and fertigation systems'
  },
  {
    id: 8,
    supplierCode: 'SUP-008',
    supplierName: 'MaxCrop Agri Solutions',
    supplierType: 'Bio-Inputs & Nutrients',
    mobile: '9849123417',
    email: 'hello@maxcrop.org',
    address: 'Phase 3, Industrial Area, Patancheru',
    city: 'Hyderabad',
    district: 'Sangareddy',
    state: 'Telangana',
    pinCode: '502319',
    gstin: '36AAACM8912P1ZN',
    bankName: 'Axis Bank',
    accountNumber: '918020054321890',
    ifscCode: 'UTIB0000341',
    branchName: 'Patancheru',
    openingBalance: 5000,
    status: 'Active',
    notes: 'Bio-fertilizers, organic manure, and micronutrient mixes'
  },
  {
    id: 9,
    supplierCode: 'SUP-009',
    supplierName: 'GreenGrow Agro Inputs',
    supplierType: 'Fertilizers',
    mobile: '9849123418',
    email: 'greengrow@agriinputs.com',
    address: 'Mandi Yard, Opp. Market Committee',
    city: 'Tenali',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pinCode: '522201',
    gstin: '37AAACG1829B1Z2',
    bankName: 'Union Bank of India',
    accountNumber: '342102010045678',
    ifscCode: 'UBIN0534218',
    branchName: 'Tenali Market',
    openingBalance: 12000,
    status: 'Inactive',
    notes: 'Seasonal dealer currently inactive pending license renewal'
  }
];

export const SEED_TRANSACTIONS = [
  {
    id: 1,
    transactionCode: 'STX-001',
    transactionDate: '2026-10-15',
    supplierId: 1,
    supplierName: 'National Seeds Corporation',
    transactionType: 'Purchase',
    referenceNo: 'INV-NSC-4421',
    category: 'Seeds',
    itemsSummary: 'Paddy Seeds (BPT 5204 Samba Masuri) - 25 Bags @ ₹850',
    amount: 21250,
    paidAmount: 21250,
    balanceAmount: 0,
    paymentStatus: 'Paid',
    notes: 'Kharif season seed stock delivery verified'
  },
  {
    id: 2,
    transactionCode: 'STX-002',
    transactionDate: '2026-10-18',
    supplierId: 2,
    supplierName: 'IFFCO Agro Supplies',
    transactionType: 'Purchase',
    referenceNo: 'INV-IFFCO-891',
    category: 'Fertilizers',
    itemsSummary: 'Urea Granular Fertilizer (45kg) - 50 Bags @ ₹270',
    amount: 13500,
    paidAmount: 13500,
    balanceAmount: 0,
    paymentStatus: 'Paid',
    notes: 'Delivered directly to Farm 1 storage godown'
  },
  {
    id: 3,
    transactionCode: 'STX-003',
    transactionDate: '2026-10-22',
    supplierId: 3,
    supplierName: 'Coromandel Agro Chemicals',
    transactionType: 'Purchase',
    referenceNo: 'INV-CORO-312',
    category: 'Fertilizers',
    itemsSummary: 'DAP Complex (50kg) - 30 Bags @ ₹1,350',
    amount: 40500,
    paidAmount: 25000,
    balanceAmount: 15500,
    paymentStatus: 'Partially Paid',
    notes: 'Partial payment released, balance due upon final field application'
  },
  {
    id: 4,
    transactionCode: 'STX-004',
    transactionDate: '2026-10-25',
    supplierId: 4,
    supplierName: 'Bayer CropScience',
    transactionType: 'Purchase',
    referenceNo: 'INV-BAY-902',
    category: 'Pesticides',
    itemsSummary: 'Fipronil & Imidacloprid Insecticides - 20 Litres',
    amount: 28400,
    paidAmount: 0,
    balanceAmount: 28400,
    paymentStatus: 'Pending',
    notes: 'Pest protection spray stock for Chilli and Cotton'
  },
  {
    id: 5,
    transactionCode: 'STX-005',
    transactionDate: '2026-10-27',
    supplierId: 6,
    supplierName: 'Mahindra Spares Depot',
    transactionType: 'Purchase',
    referenceNo: 'INV-MSD-119',
    category: 'Farm Machinery',
    itemsSummary: 'Rotavator Heavy-Duty Blades set & Fuel Filter kit',
    amount: 18200,
    paidAmount: 0,
    balanceAmount: 18200,
    paymentStatus: 'Pending',
    notes: 'Maintenance parts for 45HP tractor'
  },
  {
    id: 6,
    transactionCode: 'STX-006',
    transactionDate: '2026-10-29',
    supplierId: 5,
    supplierName: 'Rasi Seeds Pvt Ltd',
    transactionType: 'Purchase',
    referenceNo: 'INV-RASI-502',
    category: 'Seeds',
    itemsSummary: 'Cotton Bt-II Hybrid Packets - 30 Pkts @ ₹920',
    amount: 27600,
    paidAmount: 27600,
    balanceAmount: 0,
    paymentStatus: 'Paid',
    notes: 'Certified seed packets for Block B'
  }
];

export const SEED_PAYMENTS = [
  {
    id: 1,
    paymentCode: 'SPY-001',
    paymentDate: '2026-10-16',
    supplierId: 1,
    supplierName: 'National Seeds Corporation',
    amountPaid: 21250,
    paymentMode: 'Bank Transfer',
    referenceNo: 'UTR-SBI-99238472',
    bankAccount: 'SBI Farm Operational A/C - 8812',
    notes: 'Full settlement for invoice INV-NSC-4421'
  },
  {
    id: 2,
    paymentCode: 'SPY-002',
    paymentDate: '2026-10-20',
    supplierId: 2,
    supplierName: 'IFFCO Agro Supplies',
    amountPaid: 13500,
    paymentMode: 'UPI',
    referenceNo: 'UPI-984912-332',
    bankAccount: 'SBI Farm Operational A/C - 8812',
    notes: 'Settlement for invoice INV-IFFCO-891 via UPI'
  },
  {
    id: 3,
    paymentCode: 'SPY-003',
    paymentDate: '2026-10-24',
    supplierId: 3,
    supplierName: 'Coromandel Agro Chemicals',
    amountPaid: 25000,
    paymentMode: 'Bank Transfer',
    referenceNo: 'UTR-HDFC-88123049',
    bankAccount: 'HDFC Agri Business A/C - 4102',
    notes: 'Part payment for DAP shipment INV-CORO-312'
  },
  {
    id: 4,
    paymentCode: 'SPY-004',
    paymentDate: '2026-10-30',
    supplierId: 5,
    supplierName: 'Rasi Seeds Pvt Ltd',
    amountPaid: 27600,
    paymentMode: 'Bank Transfer',
    referenceNo: 'UTR-CAN-77182901',
    bankAccount: 'SBI Farm Operational A/C - 8812',
    notes: 'Full payment for cotton seed delivery INV-RASI-502'
  }
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  SUPPLIERS: 'agriman_suppliers_data',
  TRANSACTIONS: 'agriman_supplier_transactions',
  PAYMENTS: 'agriman_supplier_payments'
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`[supplierService] Error reading ${key}:`, e);
  }
  return fallback;
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[supplierService] Error writing ${key}:`, e);
  }
}

// ─── Service API Definition ───────────────────────────────────────────────────
export const supplierService = {
  // ── 1. Suppliers Master Table (`suppliers`) ──────────
  getSuppliers: async () => {
    try {
      const res = await api.get('/api/Suppliers');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.SUPPLIERS, data);
        return data;
      }
    } catch {
      // Backend not yet hosting /api/Suppliers or offline, use persistent local store
    }
    return readStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
  },

  getSupplierById: async (id) => {
    try {
      const res = await api.get(`/api/Suppliers/${id}`);
      const data = res.data?.data || res.data;
      if (data && data.id) return data;
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    return list.find((s) => String(s.id) === String(id)) || null;
  },

  createSupplier: async (supplierData) => {
    const list = readStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    const nextId = list.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0) + 1;
    const nextCode = supplierService.generateSupplierCode(list);

    const newSupplier = {
      id: nextId,
      supplierCode: supplierData.supplierCode?.trim() || nextCode,
      supplierName: supplierData.supplierName?.trim() || '',
      supplierType: supplierData.supplierType?.trim() || supplierData.supplier?.trim() || 'General',
      mobile: supplierData.mobile?.trim() || '',
      email: supplierData.email?.trim() || '',
      address: supplierData.address?.trim() || '',
      city: supplierData.city?.trim() || '',
      district: supplierData.district?.trim() || '',
      state: supplierData.state?.trim() || 'Andhra Pradesh',
      pinCode: supplierData.pinCode?.trim() || '',
      gstin: (supplierData.gstin?.trim() || '').toUpperCase(),
      bankName: supplierData.bankName?.trim() || '',
      accountNumber: supplierData.accountNumber?.trim() || '',
      ifscCode: (supplierData.ifscCode?.trim() || '').toUpperCase(),
      branchName: supplierData.branchName?.trim() || '',
      openingBalance: Number(supplierData.openingBalance) || 0,
      status: supplierData.status || 'Active',
      notes: supplierData.notes?.trim() || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      await api.post('/api/Suppliers', newSupplier);
    } catch {
      // Persisted in local store
    }

    const updated = [newSupplier, ...list];
    writeStorage(STORAGE_KEYS.SUPPLIERS, updated);
    return newSupplier;
  },

  updateSupplier: async (id, supplierData) => {
    const list = readStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    const index = list.findIndex((s) => String(s.id) === String(id));
    if (index === -1) throw new Error('Supplier record not found');

    const updatedSupplier = {
      ...list[index],
      ...supplierData,
      id: list[index].id,
      supplierCode: supplierData.supplierCode || list[index].supplierCode,
      supplierType: supplierData.supplierType || supplierData.supplier || list[index].supplierType,
      openingBalance: supplierData.openingBalance !== undefined ? Number(supplierData.openingBalance) : list[index].openingBalance,
      gstin: (supplierData.gstin !== undefined ? supplierData.gstin : list[index].gstin || '').toUpperCase(),
      ifscCode: (supplierData.ifscCode !== undefined ? supplierData.ifscCode : list[index].ifscCode || '').toUpperCase()
    };

    try {
      await api.put(`/api/Suppliers/${id}`, updatedSupplier);
    } catch {
      // Persisted in local store
    }

    const updatedList = [...list];
    updatedList[index] = updatedSupplier;
    writeStorage(STORAGE_KEYS.SUPPLIERS, updatedList);
    return updatedSupplier;
  },

  deleteSupplier: async (id) => {
    try {
      await api.delete(`/api/Suppliers/${id}`);
    } catch {
      // Persisted in local store
    }

    const list = readStorage(STORAGE_KEYS.SUPPLIERS, SEED_SUPPLIERS);
    const filtered = list.filter((s) => String(s.id) !== String(id));
    writeStorage(STORAGE_KEYS.SUPPLIERS, filtered);
    return true;
  },

  generateSupplierCode: (existingList = []) => {
    let maxNum = 0;
    existingList.forEach((s) => {
      const match = (s.supplierCode || '').match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `SUP-${String(maxNum + 1).padStart(3, '0')}`;
  },

  // ── 2. Supplier Transactions Table (`supplier_transactions`) ──
  getTransactions: async (supplierId = null) => {
    try {
      const url = supplierId ? `/api/SupplierTransactions?supplierId=${supplierId}` : '/api/SupplierTransactions';
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.TRANSACTIONS, data);
        return data;
      }
    } catch {
      // Local fallback
    }

    const allTransactions = readStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (supplierId) {
      return allTransactions.filter((t) => String(t.supplierId) === String(supplierId));
    }
    return allTransactions;
  },

  createTransaction: async (txData) => {
    const list = readStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const nextId = list.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1;
    const nextCode = supplierService.generateTransactionCode(list);

    const amount = Number(txData.amount) || 0;
    const paidAmount = Number(txData.paidAmount) || 0;
    const balanceAmount = Math.max(0, amount - paidAmount);

    let paymentStatus = txData.paymentStatus || 'Pending';
    if (paidAmount >= amount && amount > 0) {
      paymentStatus = 'Paid';
    } else if (paidAmount > 0 && paidAmount < amount) {
      paymentStatus = 'Partially Paid';
    }

    const newTx = {
      id: nextId,
      transactionCode: txData.transactionCode || nextCode,
      transactionDate: txData.transactionDate || new Date().toISOString().split('T')[0],
      supplierId: Number(txData.supplierId),
      supplierName: txData.supplierName || '',
      transactionType: txData.transactionType || 'Purchase',
      referenceNo: txData.referenceNo?.trim() || '',
      category: txData.category?.trim() || 'General',
      itemsSummary: txData.itemsSummary?.trim() || '',
      amount,
      paidAmount,
      balanceAmount,
      paymentStatus,
      notes: txData.notes?.trim() || ''
    };

    try {
      await api.post('/api/SupplierTransactions', newTx);
    } catch {
      // Local fallback
    }

    const updated = [newTx, ...list];
    writeStorage(STORAGE_KEYS.TRANSACTIONS, updated);
    return newTx;
  },

  deleteTransaction: async (id) => {
    try {
      await api.delete(`/api/SupplierTransactions/${id}`);
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const filtered = list.filter((t) => String(t.id) !== String(id));
    writeStorage(STORAGE_KEYS.TRANSACTIONS, filtered);
    return true;
  },

  generateTransactionCode: (existingList = []) => {
    let maxNum = 0;
    existingList.forEach((t) => {
      const match = (t.transactionCode || '').match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `STX-${String(maxNum + 1).padStart(3, '0')}`;
  },

  // ── 3. Supplier Payments Table (`supplier_payments`) ──
  getPayments: async (supplierId = null) => {
    try {
      const url = supplierId ? `/api/SupplierPayments?supplierId=${supplierId}` : '/api/SupplierPayments';
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        writeStorage(STORAGE_KEYS.PAYMENTS, data);
        return data;
      }
    } catch {
      // Local fallback
    }

    const allPayments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    if (supplierId) {
      return allPayments.filter((p) => String(p.supplierId) === String(supplierId));
    }
    return allPayments;
  },

  createPayment: async (paymentData) => {
    const list = readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const nextId = list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    const nextCode = supplierService.generatePaymentCode(list);

    const newPayment = {
      id: nextId,
      paymentCode: paymentData.paymentCode || nextCode,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      supplierId: Number(paymentData.supplierId),
      supplierName: paymentData.supplierName || '',
      amountPaid: Number(paymentData.amountPaid) || 0,
      paymentMode: paymentData.paymentMode || 'Bank Transfer',
      referenceNo: paymentData.referenceNo?.trim() || '',
      bankAccount: paymentData.bankAccount?.trim() || 'Main Operational Account',
      notes: paymentData.notes?.trim() || ''
    };

    try {
      await api.post('/api/SupplierPayments', newPayment);
    } catch {
      // Local fallback
    }

    const updated = [newPayment, ...list];
    writeStorage(STORAGE_KEYS.PAYMENTS, updated);
    return newPayment;
  },

  deletePayment: async (id) => {
    try {
      await api.delete(`/api/SupplierPayments/${id}`);
    } catch {
      // Local fallback
    }
    const list = readStorage(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
    const filtered = list.filter((p) => String(p.id) !== String(id));
    writeStorage(STORAGE_KEYS.PAYMENTS, filtered);
    return true;
  },

  generatePaymentCode: (existingList = []) => {
    let maxNum = 0;
    existingList.forEach((p) => {
      const match = (p.paymentCode || '').match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `SPY-${String(maxNum + 1).padStart(3, '0')}`;
  },

  // ── 4. Financial Calculation & Statement Helpers ───
  computeSupplierFinancials: (supplier, allTransactions = [], allPayments = []) => {
    const sId = String(supplier.id);
    const supplierTxs = allTransactions.filter((t) => String(t.supplierId) === sId);
    const supplierPymts = allPayments.filter((p) => String(p.supplierId) === sId);

    const openingBalance = Number(supplier.openingBalance) || 0;
    const totalPurchases = supplierTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPayments = supplierPymts.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const outstandingBalance = openingBalance + totalPurchases - totalPayments;

    return {
      openingBalance,
      totalPurchases,
      totalPayments,
      outstandingBalance: Math.max(0, outstandingBalance),
      netBalance: outstandingBalance,
      transactionCount: supplierTxs.length,
      paymentCount: supplierPymts.length
    };
  },

  getSupplierStatement: (supplierId, allSuppliers = [], allTransactions = [], allPayments = []) => {
    const supplier = allSuppliers.find((s) => String(s.id) === String(supplierId));
    if (!supplier) return null;

    const sId = String(supplierId);
    const sTransactions = allTransactions.filter((t) => String(t.supplierId) === sId);
    const sPayments = allPayments.filter((p) => String(p.supplierId) === sId);

    // Merge transactions and payments chronologically
    const ledgerEntries = [
      ...sTransactions.map((t) => ({
        id: `tx-${t.id}`,
        date: t.transactionDate,
        type: 'Bill / Purchase',
        ref: t.referenceNo || t.transactionCode,
        description: t.itemsSummary || `${t.category} purchase invoice`,
        debit: Number(t.amount) || 0,
        credit: 0
      })),
      ...sPayments.map((p) => ({
        id: `py-${p.id}`,
        date: p.paymentDate,
        type: `Payment (${p.paymentMode})`,
        ref: p.referenceNo || p.paymentCode,
        description: p.notes || `Paid via ${p.paymentMode}`,
        debit: 0,
        credit: Number(p.amountPaid) || 0
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = Number(supplier.openingBalance) || 0;
    const entriesWithBalance = ledgerEntries.map((e) => {
      runningBalance = runningBalance + e.debit - e.credit;
      return {
        ...e,
        balance: runningBalance
      };
    });

    const totalDebit = sTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalCredit = sPayments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
    const netDue = (Number(supplier.openingBalance) || 0) + totalDebit - totalCredit;

    return {
      supplier,
      openingBalance: Number(supplier.openingBalance) || 0,
      entries: entriesWithBalance,
      totalDebit,
      totalCredit,
      netDue
    };
  }
};

export default supplierService;
