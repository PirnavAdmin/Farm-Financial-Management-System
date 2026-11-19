import api from './api.js';

// ─── 1. SEED DATA FOR THE 4 SPECIFIED TABLES ──────────────────────────────
// Tables: 1. buyers, 2. sales, 3. sales_items, 4. sales_payments

export const SEED_BUYERS = [
  {
    id: 1,
    buyerCode: 'BUY-001',
    buyerName: 'Sri Lakshmi Traders',
    mobile: '9876543210',
    address: 'Main Market Yard, Vijayawada, Andhra Pradesh',
    businessName: 'Sri Lakshmi Agri Traders',
    gstin: '37ABCDE1234F1Z5',
    openingBalance: 25000,
    status: 'Active',
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 2,
    buyerCode: 'BUY-002',
    buyerName: 'Dairy Cooperative Society',
    mobile: '9876512340',
    address: 'Milk Chilling Centre, Guntur, Andhra Pradesh',
    businessName: 'Guntur Milk Producers Union',
    gstin: '37FGHIJ5678K1Z2',
    openingBalance: 0,
    status: 'Active',
    createdAt: '2026-10-16T10:30:00Z'
  },
  {
    id: 3,
    buyerCode: 'BUY-003',
    buyerName: 'Hyderabad Wholesale Mandi',
    mobile: '9849011223',
    address: 'Bowenpally Market Yard, Secunderabad, Telangana',
    businessName: 'Telangana Agro Mandi Pvt Ltd',
    gstin: '36AAACT9876Q1Z9',
    openingBalance: 15000,
    status: 'Active',
    createdAt: '2026-10-18T11:15:00Z'
  },
  {
    id: 4,
    buyerCode: 'BUY-004',
    buyerName: 'Kisan Export & Trading Co',
    mobile: '9988776655',
    address: 'APMC Market Complex, Kurnool, Andhra Pradesh',
    businessName: 'Kisan Export Commercial Ventures',
    gstin: '37KLMNO4321P1Z4',
    openingBalance: 0,
    status: 'Active',
    createdAt: '2026-10-20T14:00:00Z'
  },
  {
    id: 5,
    buyerCode: 'BUY-005',
    buyerName: 'Annapurna Rice Millers',
    mobile: '9848022334',
    address: 'Industrial Estate, Miryalaguda, Telangana',
    businessName: 'Annapurna Grain Processors Ltd',
    gstin: '36PQRS7890R1Z8',
    openingBalance: 50000,
    status: 'Active',
    createdAt: '2026-10-22T16:45:00Z'
  }
];

export const SEED_SALES = [
  {
    id: 1,
    salesNo: 'SAL-2026-001',
    salesDate: '2026-10-25',
    buyer: 'Sri Lakshmi Traders',
    farm: 'Sunrise Valley Farm',
    crop: 'Paddy (Rice)',
    quantity: 100,
    unit: 'Quintals',
    rate: 2250,
    grossAmount: 225000,
    commission: 2000,
    transport: 3000,
    netAmount: 220000,
    paymentStatus: 'Paid',
    createdAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 2,
    salesNo: 'SAL-2026-002',
    salesDate: '2026-11-05',
    buyer: 'Hyderabad Wholesale Mandi',
    farm: 'Green Hills Orchard',
    crop: 'Organic Tomatoes',
    quantity: 2500,
    unit: 'kg',
    rate: 32,
    grossAmount: 80000,
    commission: 1600,
    transport: 2400,
    netAmount: 76000,
    paymentStatus: 'Partially Paid',
    createdAt: '2026-11-05T11:30:00Z'
  },
  {
    id: 3,
    salesNo: 'SAL-2026-003',
    salesDate: '2026-11-10',
    buyer: 'Annapurna Rice Millers',
    farm: 'North Field Farm',
    crop: 'Maize',
    quantity: 80,
    unit: 'Quintals',
    rate: 2150,
    grossAmount: 172000,
    commission: 2000,
    transport: 3500,
    netAmount: 166500,
    paymentStatus: 'Pending',
    createdAt: '2026-11-10T14:15:00Z'
  },
  {
    id: 4,
    salesNo: 'SAL-2026-004',
    salesDate: '2026-11-12',
    buyer: 'Dairy Cooperative Society',
    farm: 'East Lake Farm',
    crop: 'Chilli',
    quantity: 45,
    unit: 'Quintals',
    rate: 16500,
    grossAmount: 742500,
    commission: 7500,
    transport: 6000,
    netAmount: 729000,
    paymentStatus: 'Partially Paid',
    createdAt: '2026-11-12T15:20:00Z'
  },
  {
    id: 5,
    salesNo: 'SAL-2026-005',
    salesDate: '2026-11-15',
    buyer: 'Kisan Export & Trading Co',
    farm: 'Sunrise Valley Farm',
    crop: 'Cotton',
    quantity: 60,
    unit: 'Quintals',
    rate: 7200,
    grossAmount: 432000,
    commission: 4500,
    transport: 4000,
    netAmount: 423500,
    paymentStatus: 'Paid',
    createdAt: '2026-11-15T09:45:00Z'
  }
];

export const SEED_SALES_ITEMS = [
  { id: 1, saleId: 1, salesNo: 'SAL-2026-001', crop: 'Paddy (Rice)', quantity: 100, unit: 'Quintals', rate: 2250, amount: 225000 },
  { id: 2, saleId: 2, salesNo: 'SAL-2026-002', crop: 'Organic Tomatoes', quantity: 2500, unit: 'kg', rate: 32, amount: 80000 },
  { id: 3, saleId: 3, salesNo: 'SAL-2026-003', crop: 'Maize', quantity: 80, unit: 'Quintals', rate: 2150, amount: 172000 },
  { id: 4, saleId: 4, salesNo: 'SAL-2026-004', crop: 'Chilli', quantity: 45, unit: 'Quintals', rate: 16500, amount: 742500 },
  { id: 5, saleId: 5, salesNo: 'SAL-2026-005', crop: 'Cotton', quantity: 60, unit: 'Quintals', rate: 7200, amount: 432000 }
];

export const SEED_SALES_PAYMENTS = [
  {
    id: 1,
    paymentNo: 'SPAY-2026-001',
    paymentDate: '2026-10-25',
    buyer: 'Sri Lakshmi Traders',
    salesNo: 'SAL-2026-001',
    paymentAmount: 220000,
    paymentMode: 'Bank',
    referenceNo: 'UTR-HDFC-99238472',
    remarks: 'Full settlement for Paddy harvest sales',
    createdAt: '2026-10-25T11:00:00Z'
  },
  {
    id: 2,
    paymentNo: 'SPAY-2026-002',
    paymentDate: '2026-11-07',
    buyer: 'Hyderabad Wholesale Mandi',
    salesNo: 'SAL-2026-002',
    paymentAmount: 40000,
    paymentMode: 'UPI',
    referenceNo: 'UPI-HYD-88291024',
    remarks: 'Advance received via UPI for tomato shipment',
    createdAt: '2026-11-07T14:20:00Z'
  },
  {
    id: 3,
    paymentNo: 'SPAY-2026-003',
    paymentDate: '2026-11-14',
    buyer: 'Dairy Cooperative Society',
    salesNo: 'SAL-2026-004',
    paymentAmount: 350000,
    paymentMode: 'Bank',
    referenceNo: 'NEFT-SBI-44019283',
    remarks: 'First installment for Chilli crop sale',
    createdAt: '2026-11-14T10:15:00Z'
  },
  {
    id: 4,
    paymentNo: 'SPAY-2026-004',
    paymentDate: '2026-11-17',
    buyer: 'Kisan Export & Trading Co',
    salesNo: 'SAL-2026-005',
    paymentAmount: 423500,
    paymentMode: 'Bank',
    referenceNo: 'RTGS-CAN-55829104',
    remarks: 'Full clearance for cotton lot',
    createdAt: '2026-11-17T16:30:00Z'
  }
];

export const FALLBACK_FARMS = [
  'Sunrise Valley Farm',
  'Green Hills Orchard',
  'North Field Farm',
  'East Lake Farm',
  'Central Plantation'
];

export const FALLBACK_CROPS = [
  'Paddy (Rice)',
  'Organic Tomatoes',
  'Maize',
  'Chilli',
  'Cotton',
  'Wheat',
  'Sugarcane',
  'Groundnut',
  'Turmeric'
];

// ─── 2. LOCAL PERSISTENT STORAGE MANAGEMENT ─────────────────────────────────
const STORAGE_KEYS = {
  SALES: 'agriman_sales_transactions',
  ITEMS: 'agriman_sales_items',
  PAYMENTS: 'agriman_sales_payments',
  BUYERS: 'agriman_sales_buyers'
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`[salesService] Error reading storage ${key}:`, e);
  }
  return fallback;
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[salesService] Error writing storage ${key}:`, e);
  }
}

// ─── 3. FORMATTING HELPERS ───────────────────────────────────────────────────
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatDate(val) {
  if (!val) return '—';
  const clean = String(val).slice(0, 10);
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${day} ${monthName} ${year}`;
  }
  return val;
}

// Helper to determine payment status from amounts
export function computePaymentStatus(netAmount, paidAmount) {
  const net = Number(netAmount) || 0;
  const paid = Number(paidAmount) || 0;
  if (paid <= 0) return 'Pending';
  if (paid >= net - 0.01) return 'Paid';
  return 'Partially Paid';
}

// ─── 4. COMPLETE SALES SERVICE IMPLEMENTATION ────────────────────────────────
export const salesService = {
  // ── A. SALES TRANSACTIONS (`sales` & `sales_items`) ────────────────────────
  getSales: async () => {
    let sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    try {
      const res = await api.get('/api/Sales?pageSize=100');
      const items = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : null);
      if (Array.isArray(items) && items.length > 0) {
        sales = items.map((s) => ({
          id: s.id,
          salesNo: s.salesNo,
          salesDate: (s.salesDate || '').slice(0, 10),
          buyer: s.buyer,
          farm: s.farm,
          crop: s.crop,
          quantity: Number(s.quantity) || 0,
          unit: s.unit || 'Quintals',
          rate: Number(s.rate) || 0,
          grossAmount: Number(s.grossAmount) || 0,
          commission: Number(s.commission) || 0,
          transport: Number(s.transport) || 0,
          netAmount: Number(s.netAmount) || 0,
          paymentStatus: s.paymentStatus || 'Pending',
          createdAt: s.createdAt || new Date().toISOString()
        }));
        writeStorage(STORAGE_KEYS.SALES, sales);
      }
    } catch (e) {
      console.warn('[salesService] Live /api/Sales unavailable, using synced local storage.');
    }
    return sales;
  },

  createSale: async (saleData) => {
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    const items = readStorage(STORAGE_KEYS.ITEMS, SEED_SALES_ITEMS);

    const year = new Date().getFullYear();
    let salesNo = saleData.salesNo?.trim();
    if (!salesNo) {
      const existingNos = sales
        .map((s) => s.salesNo)
        .filter((no) => no && no.startsWith(`SAL-${year}-`))
        .map((no) => parseInt(no.replace(`SAL-${year}-`, ''), 10))
        .filter((n) => !isNaN(n));
      const nextSeq = existingNos.length > 0 ? Math.max(...existingNos) + 1 : sales.length + 1;
      salesNo = `SAL-${year}-${String(nextSeq).padStart(3, '0')}`;
    }

    const quantity = Math.max(0, Number(saleData.quantity) || 0);
    const rate = Math.max(0, Number(saleData.rate) || 0);
    const grossAmount = Math.round(quantity * rate * 100) / 100;
    const commission = Math.max(0, Number(saleData.commission) || 0);
    const transport = Math.max(0, Number(saleData.transport) || 0);
    const netAmount = Math.max(0, Math.round((grossAmount - commission - transport) * 100) / 100);

    const newSale = {
      id: Date.now(),
      salesNo,
      salesDate: saleData.salesDate || new Date().toISOString().slice(0, 10),
      buyer: saleData.buyer?.trim() || '',
      farm: saleData.farm?.trim() || '',
      crop: saleData.crop?.trim() || '',
      quantity,
      unit: saleData.unit || 'Quintals',
      rate,
      grossAmount,
      commission,
      transport,
      netAmount,
      paymentStatus: saleData.paymentStatus || 'Pending',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await api.post('/api/Sales', {
        salesNo: newSale.salesNo,
        salesDate: newSale.salesDate,
        buyer: newSale.buyer,
        farm: newSale.farm,
        crop: newSale.crop,
        quantity: newSale.quantity,
        unit: newSale.unit,
        rate: newSale.rate,
        grossAmount: newSale.grossAmount,
        commission: newSale.commission,
        transport: newSale.transport,
        netAmount: newSale.netAmount,
        paymentStatus: newSale.paymentStatus
      });
      if (res.data?.id) newSale.id = res.data.id;
    } catch (e) {
      console.warn('[salesService] Live /api/Sales POST failed, saving to local storage.');
    }

    sales.unshift(newSale);
    writeStorage(STORAGE_KEYS.SALES, sales);

    const newItem = {
      id: Date.now(),
      saleId: newSale.id,
      salesNo: newSale.salesNo,
      crop: newSale.crop,
      quantity: newSale.quantity,
      unit: newSale.unit,
      rate: newSale.rate,
      amount: newSale.grossAmount
    };
    items.unshift(newItem);
    writeStorage(STORAGE_KEYS.ITEMS, items);

    return newSale;
  },

  updateSale: async (id, saleData) => {
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    const items = readStorage(STORAGE_KEYS.ITEMS, SEED_SALES_ITEMS);
    const payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);

    const index = sales.findIndex((s) => s.id === id || s.salesNo === saleData.salesNo);
    if (index === -1) throw new Error('Sales record not found.');

    const quantity = Math.max(0, Number(saleData.quantity) || 0);
    const rate = Math.max(0, Number(saleData.rate) || 0);
    const grossAmount = Math.round(quantity * rate * 100) / 100;
    const commission = Math.max(0, Number(saleData.commission) || 0);
    const transport = Math.max(0, Number(saleData.transport) || 0);
    const netAmount = Math.max(0, Math.round((grossAmount - commission - transport) * 100) / 100);

    const totalPaid = payments
      .filter((p) => p.salesNo === sales[index].salesNo)
      .reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

    const paymentStatus = computePaymentStatus(netAmount, totalPaid);

    const updatedSale = {
      ...sales[index],
      salesDate: saleData.salesDate || sales[index].salesDate,
      buyer: saleData.buyer?.trim() || sales[index].buyer,
      farm: saleData.farm?.trim() || sales[index].farm,
      crop: saleData.crop?.trim() || sales[index].crop,
      quantity,
      unit: saleData.unit || sales[index].unit,
      rate,
      grossAmount,
      commission,
      transport,
      netAmount,
      paymentStatus: saleData.paymentStatus || paymentStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      await api.put(`/api/Sales/${id}`, updatedSale);
    } catch (e) {
      console.warn('[salesService] Live /api/Sales PUT failed, updating local storage.');
    }

    sales[index] = updatedSale;
    writeStorage(STORAGE_KEYS.SALES, sales);

    const itemIndex = items.findIndex((i) => i.salesNo === updatedSale.salesNo);
    if (itemIndex !== -1) {
      items[itemIndex] = {
        ...items[itemIndex],
        crop: updatedSale.crop,
        quantity: updatedSale.quantity,
        unit: updatedSale.unit,
        rate: updatedSale.rate,
        amount: updatedSale.grossAmount
      };
      writeStorage(STORAGE_KEYS.ITEMS, items);
    }

    return updatedSale;
  },

  deleteSale: async (id, salesNo) => {
    let sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    let items = readStorage(STORAGE_KEYS.ITEMS, SEED_SALES_ITEMS);
    let payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);

    try {
      await api.delete(`/api/Sales/${id}`);
    } catch (e) {
      console.warn('[salesService] Live /api/Sales DELETE failed, deleting from local storage.');
    }

    sales = sales.filter((s) => s.id !== id && s.salesNo !== salesNo);
    items = items.filter((i) => i.salesNo !== salesNo);
    payments = payments.filter((p) => p.salesNo !== salesNo);

    writeStorage(STORAGE_KEYS.SALES, sales);
    writeStorage(STORAGE_KEYS.ITEMS, items);
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);

    return true;
  },

  // ── B. BUYERS / CUSTOMERS (`buyers`) ───────────────────────────────────────
  getBuyers: async () => {
    let buyers = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    try {
      const res = await api.get('/api/Buyers');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        buyers = data.map((b) => ({
          id: b.id,
          buyerCode: b.buyerCode || `BUY-${b.id}`,
          buyerName: b.buyerName || b.name,
          mobile: b.mobile || b.phone || '',
          address: b.address || '',
          businessName: b.businessName || '',
          gstin: b.gstin || '',
          openingBalance: Number(b.openingBalance) || 0,
          status: b.status || 'Active',
          createdAt: b.createdAt || new Date().toISOString()
        }));
        writeStorage(STORAGE_KEYS.BUYERS, buyers);
      }
    } catch (e) {
      // Backend /api/Buyers not deployed on host yet
    }
    return buyers;
  },

  createBuyer: async (buyerData) => {
    const buyers = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);

    let buyerCode = buyerData.buyerCode?.trim();
    if (!buyerCode) {
      const codes = buyers
        .map((b) => b.buyerCode)
        .filter((c) => c && c.startsWith('BUY-'))
        .map((c) => parseInt(c.replace('BUY-', ''), 10))
        .filter((n) => !isNaN(n));
      const nextSeq = codes.length > 0 ? Math.max(...codes) + 1 : buyers.length + 1;
      buyerCode = `BUY-${String(nextSeq).padStart(3, '0')}`;
    }

    if (buyers.some((b) => b.buyerCode.toLowerCase() === buyerCode.toLowerCase())) {
      throw new Error(`Buyer Code '${buyerCode}' already exists.`);
    }

    const newBuyer = {
      id: Date.now(),
      buyerCode,
      buyerName: buyerData.buyerName?.trim() || '',
      mobile: buyerData.mobile?.trim() || '',
      address: buyerData.address?.trim() || '',
      businessName: buyerData.businessName?.trim() || '',
      gstin: buyerData.gstin?.trim() || '',
      openingBalance: Math.max(0, Number(buyerData.openingBalance) || 0),
      status: buyerData.status || 'Active',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await api.post('/api/Buyers', newBuyer);
      if (res.data?.id) newBuyer.id = res.data.id;
    } catch (e) {
      console.warn('[salesService] Live /api/Buyers POST failed, saving to local storage.');
    }

    buyers.unshift(newBuyer);
    writeStorage(STORAGE_KEYS.BUYERS, buyers);
    return newBuyer;
  },

  updateBuyer: async (id, buyerData) => {
    const buyers = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    const index = buyers.findIndex((b) => b.id === id || b.buyerCode === buyerData.buyerCode);
    if (index === -1) throw new Error('Buyer record not found.');

    const updated = {
      ...buyers[index],
      buyerName: buyerData.buyerName?.trim() || buyers[index].buyerName,
      mobile: buyerData.mobile?.trim() || buyers[index].mobile,
      address: buyerData.address !== undefined ? buyerData.address : buyers[index].address,
      businessName: buyerData.businessName !== undefined ? buyerData.businessName : buyers[index].businessName,
      gstin: buyerData.gstin !== undefined ? buyerData.gstin : buyers[index].gstin,
      openingBalance: Number(buyerData.openingBalance) || 0,
      status: buyerData.status || buyers[index].status,
      updatedAt: new Date().toISOString()
    };

    try {
      await api.put(`/api/Buyers/${id}`, updated);
    } catch (e) {
      console.warn('[salesService] Live /api/Buyers PUT failed, updating local storage.');
    }

    buyers[index] = updated;
    writeStorage(STORAGE_KEYS.BUYERS, buyers);
    return updated;
  },

  deleteBuyer: async (id) => {
    let buyers = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    try {
      await api.delete(`/api/Buyers/${id}`);
    } catch (e) {
      console.warn('[salesService] Live /api/Buyers DELETE failed, deleting from local storage.');
    }
    buyers = buyers.filter((b) => b.id !== id);
    writeStorage(STORAGE_KEYS.BUYERS, buyers);
    return true;
  },

  // ── C. SALES PAYMENTS & RECEIVABLES (`sales_payments`) ──────────────────────
  getPayments: async () => {
    let payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);
    try {
      const res = await api.get('/api/SalesPayments');
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        payments = data.map((p) => ({
          id: p.id,
          paymentNo: p.paymentNo,
          paymentDate: (p.paymentDate || '').slice(0, 10),
          buyer: p.buyer,
          salesNo: p.salesNo,
          paymentAmount: Number(p.paymentAmount) || 0,
          paymentMode: p.paymentMode || 'Bank',
          referenceNo: p.referenceNo || '',
          remarks: p.remarks || '',
          createdAt: p.createdAt || new Date().toISOString()
        }));
        writeStorage(STORAGE_KEYS.PAYMENTS, payments);
      }
    } catch (e) {
      // Backend /api/SalesPayments not deployed on host yet
    }
    return payments;
  },

  recordPayment: async (paymentData) => {
    const payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);

    const sale = sales.find((s) => s.salesNo === paymentData.salesNo);
    if (!sale) throw new Error(`Referenced sale #${paymentData.salesNo} does not exist.`);

    const alreadyPaid = payments
      .filter((p) => p.salesNo === sale.salesNo)
      .reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

    const outstanding = Math.max(0, Math.round((sale.netAmount - alreadyPaid) * 100) / 100);
    const amount = Number(paymentData.paymentAmount) || 0;

    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    if (amount > outstanding + 0.01) {
      throw new Error(`Payment amount (₹${amount.toLocaleString('en-IN')}) cannot exceed outstanding amount (₹${outstanding.toLocaleString('en-IN')}).`);
    }

    const year = new Date().getFullYear();
    let paymentNo = paymentData.paymentNo?.trim();
    if (!paymentNo) {
      const existingNos = payments
        .map((p) => p.paymentNo)
        .filter((no) => no && no.startsWith(`SPAY-${year}-`))
        .map((no) => parseInt(no.replace(`SPAY-${year}-`, ''), 10))
        .filter((n) => !isNaN(n));
      const nextSeq = existingNos.length > 0 ? Math.max(...existingNos) + 1 : payments.length + 1;
      paymentNo = `SPAY-${year}-${String(nextSeq).padStart(3, '0')}`;
    }

    const newPayment = {
      id: Date.now(),
      paymentNo,
      paymentDate: paymentData.paymentDate || new Date().toISOString().slice(0, 10),
      buyer: sale.buyer,
      salesNo: sale.salesNo,
      paymentAmount: amount,
      paymentMode: paymentData.paymentMode || 'Bank',
      referenceNo: paymentData.referenceNo?.trim() || '',
      remarks: paymentData.remarks?.trim() || '',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await api.post('/api/SalesPayments', newPayment);
      if (res.data?.id) newPayment.id = res.data.id;
    } catch (e) {
      console.warn('[salesService] Live /api/SalesPayments POST failed, saving to local storage.');
    }

    payments.unshift(newPayment);
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);

    const newTotalPaid = alreadyPaid + amount;
    const newStatus = computePaymentStatus(sale.netAmount, newTotalPaid);
    sale.paymentStatus = newStatus;
    writeStorage(STORAGE_KEYS.SALES, sales);

    try {
      await api.put(`/api/Sales/${sale.id}`, { ...sale, paymentStatus: newStatus });
    } catch (e) {
      // ignore
    }

    return { payment: newPayment, updatedSale: sale };
  },

  // Direct Update / Save from the Receivables & Payment Screen
  updateReceivable: async (data) => {
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    const payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);

    const saleIndex = sales.findIndex((s) => s.salesNo === data.salesNo);
    const totalAmount = Number(data.totalSalesAmount) >= 0 ? Number(data.totalSalesAmount) : (sales[saleIndex]?.netAmount || 0);
    const amountReceived = Math.max(0, Number(data.amountReceived) || 0);
    const outstandingAmount = Math.max(0, Math.round((totalAmount - amountReceived) * 100) / 100);
    const status = data.paymentStatus || computePaymentStatus(totalAmount, amountReceived);

    if (saleIndex !== -1) {
      sales[saleIndex] = {
        ...sales[saleIndex],
        buyer: data.buyer?.trim() || sales[saleIndex].buyer,
        salesDate: data.salesDate || sales[saleIndex].salesDate,
        netAmount: totalAmount,
        grossAmount: Math.max(totalAmount, sales[saleIndex].grossAmount || totalAmount),
        paymentStatus: status,
        updatedAt: new Date().toISOString()
      };
      writeStorage(STORAGE_KEYS.SALES, sales);

      try {
        await api.put(`/api/Sales/${sales[saleIndex].id}`, sales[saleIndex]);
      } catch (e) {
        // ignore
      }
    }

    // Update or insert matching payment voucher
    const existingPay = payments.find((p) => p.salesNo === data.salesNo);
    if (existingPay) {
      existingPay.paymentAmount = amountReceived;
      existingPay.paymentDate = data.salesDate || existingPay.paymentDate;
      existingPay.buyer = data.buyer || existingPay.buyer;
      if (data.paymentMode) existingPay.paymentMode = data.paymentMode;
      if (data.referenceNo) existingPay.referenceNo = data.referenceNo;
      if (data.remarks) existingPay.remarks = data.remarks;
    } else if (amountReceived > 0) {
      const year = new Date().getFullYear();
      payments.unshift({
        id: Date.now(),
        paymentNo: `SPAY-${year}-${String(payments.length + 1).padStart(3, '0')}`,
        paymentDate: data.salesDate || new Date().toISOString().slice(0, 10),
        buyer: data.buyer || '',
        salesNo: data.salesNo,
        paymentAmount: amountReceived,
        paymentMode: data.paymentMode || 'Bank',
        referenceNo: data.referenceNo || '',
        remarks: data.remarks || `Payment recorded for ${data.salesNo}`,
        createdAt: new Date().toISOString()
      });
    }
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);

    return { totalAmount, amountReceived, outstandingAmount, status };
  },

  deletePayment: async (paymentId) => {
    let payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);

    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return false;

    try {
      await api.delete(`/api/SalesPayments/${paymentId}`);
    } catch (e) {
      console.warn('[salesService] Live /api/SalesPayments DELETE failed, deleting from local storage.');
    }

    payments = payments.filter((p) => p.id !== paymentId);
    writeStorage(STORAGE_KEYS.PAYMENTS, payments);

    const sale = sales.find((s) => s.salesNo === payment.salesNo);
    if (sale) {
      const remainingPaid = payments
        .filter((p) => p.salesNo === sale.salesNo)
        .reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
      sale.paymentStatus = computePaymentStatus(sale.netAmount, remainingPaid);
      writeStorage(STORAGE_KEYS.SALES, sales);
    }

    return true;
  },

  // Receivables list combined from Sales & Payments
  getReceivables: async () => {
    const sales = await salesService.getSales();
    const payments = await salesService.getPayments();

    return sales.map((sale) => {
      const relatedPayments = payments.filter((p) => p.salesNo === sale.salesNo);
      const rawReceived = relatedPayments.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
      // Ensure amount received does not exceed total net amount if paid
      const amountReceived = sale.paymentStatus === 'Paid' ? sale.netAmount : Math.min(sale.netAmount, rawReceived);
      const outstandingAmount = Math.max(0, Math.round((sale.netAmount - amountReceived) * 100) / 100);
      const status = sale.paymentStatus || computePaymentStatus(sale.netAmount, amountReceived);

      return {
        id: sale.id,
        salesNo: sale.salesNo,
        salesDate: sale.salesDate,
        buyer: sale.buyer,
        farm: sale.farm,
        crop: sale.crop,
        totalSalesAmount: sale.netAmount,
        grossAmount: sale.grossAmount,
        amountReceived,
        outstandingAmount,
        paymentStatus: status,
        payments: relatedPayments
      };
    });
  },

  // ── D. LOOKUPS: FARMS & CROPS ──────────────────────────────────────────────
  getFarms: async () => {
    try {
      const res = await api.get('/api/Farms');
      const list = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.items;
      if (Array.isArray(list) && list.length > 0) {
        const names = list.map((f) => f.farmName || f.name).filter(Boolean);
        if (names.length > 0) return [...new Set(names)];
      }
    } catch (e) {
      // fallback
    }
    return FALLBACK_FARMS;
  },

  getCrops: async () => {
    try {
      const res = await api.get('/api/Crop');
      const list = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.items;
      if (Array.isArray(list) && list.length > 0) {
        const names = list.map((c) => c.cropName || c.name).filter(Boolean);
        if (names.length > 0) return [...new Set(names)];
      }
    } catch (e) {
      // fallback
    }
    return FALLBACK_CROPS;
  }
};

export default salesService;
