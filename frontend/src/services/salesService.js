import api from './api.js';

// ─── 1. SEED DATA & FALLBACK CONSTANTS ──────────────────────────────────────
// High-fidelity fallback records ensuring offline availability and UI resilience.

export const SEED_BUYERS = [
  {
    id: 1,
    buyerCode: 'BUY-001',
    buyerName: 'K. Venkateswara Rao',
    businessName: 'Sri Lakshmi Traders',
    mobile: '9876543210',
    address: 'Main Market Yard, Vijayawada, Andhra Pradesh',
    gstin: '37ABCDE1234F1Z5',
    openingBalance: 25000,
    status: 'Active',
    totalSalesCount: 1,
    totalSalesAmount: 220000,
    totalPaidAmount: 220000,
    outstandingBalance: 0,
    createdAt: '2026-10-15T09:00:00Z'
  },
  {
    id: 2,
    buyerCode: 'BUY-002',
    buyerName: 'N. Sambasiva Rao',
    businessName: 'Dairy Cooperative Society',
    mobile: '9876512340',
    address: 'Milk Chilling Centre, Guntur, Andhra Pradesh',
    gstin: '37FGHIJ5678K1Z2',
    openingBalance: 0,
    status: 'Active',
    totalSalesCount: 1,
    totalSalesAmount: 729000,
    totalPaidAmount: 350000,
    outstandingBalance: 379000,
    createdAt: '2026-10-16T10:30:00Z'
  },
  {
    id: 3,
    buyerCode: 'BUY-003',
    buyerName: 'Rajesh Agarwal',
    businessName: 'Hyderabad Wholesale Mandi',
    mobile: '9849011223',
    address: 'Bowenpally Market Yard, Secunderabad, Telangana',
    gstin: '36AAACT9876Q1Z9',
    openingBalance: 15000,
    status: 'Active',
    totalSalesCount: 1,
    totalSalesAmount: 76000,
    totalPaidAmount: 40000,
    outstandingBalance: 36000,
    createdAt: '2026-10-18T11:15:00Z'
  },
  {
    id: 4,
    buyerCode: 'BUY-004',
    buyerName: 'M. Srinivasa Rao',
    businessName: 'Kisan Export & Trading Co',
    mobile: '9988776655',
    address: 'APMC Market Complex, Kurnool, Andhra Pradesh',
    gstin: '37KLMN04321P1Z4',
    openingBalance: 0,
    status: 'Active',
    totalSalesCount: 1,
    totalSalesAmount: 423500,
    totalPaidAmount: 423500,
    outstandingBalance: 0,
    createdAt: '2026-10-20T14:00:00Z'
  },
  {
    id: 5,
    buyerCode: 'BUY-005',
    buyerName: 'P. Satyanarayana',
    businessName: 'Annapurna Rice Millers',
    mobile: '9848022334',
    address: 'Industrial Estate, Miryalaguda, Telangana',
    gstin: '36PQRS7890R1Z8',
    openingBalance: 50000,
    status: 'Active',
    totalSalesCount: 1,
    totalSalesAmount: 166500,
    totalPaidAmount: 0,
    outstandingBalance: 166500,
    createdAt: '2026-10-22T16:45:00Z'
  }
];

export const SEED_SALES = [
  {
    id: 1,
    salesNo: 'SAL-2026-001',
    salesDate: '2026-10-25',
    buyerId: 1,
    buyer: 'K. Venkateswara Rao',
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
    paidAmount: 220000,
    balanceAmount: 0,
    createdAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 2,
    salesNo: 'SAL-2026-002',
    salesDate: '2026-11-05',
    buyerId: 3,
    buyer: 'Rajesh Agarwal',
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
    paidAmount: 40000,
    balanceAmount: 36000,
    createdAt: '2026-11-05T11:30:00Z'
  },
  {
    id: 3,
    salesNo: 'SAL-2026-003',
    salesDate: '2026-11-10',
    buyerId: 5,
    buyer: 'P. Satyanarayana',
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
    paidAmount: 0,
    balanceAmount: 166500,
    createdAt: '2026-11-10T14:15:00Z'
  },
  {
    id: 4,
    salesNo: 'SAL-2026-004',
    salesDate: '2026-11-12',
    buyerId: 2,
    buyer: 'N. Sambasiva Rao',
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
    paidAmount: 350000,
    balanceAmount: 379000,
    createdAt: '2026-11-12T15:20:00Z'
  },
  {
    id: 5,
    salesNo: 'SAL-2026-005',
    salesDate: '2026-11-15',
    buyerId: 4,
    buyer: 'M. Srinivasa Rao',
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
    paidAmount: 423500,
    balanceAmount: 0,
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
    buyerId: 1,
    buyer: 'K. Venkateswara Rao',
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
    buyerId: 3,
    buyer: 'Rajesh Agarwal',
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
    buyerId: 2,
    buyer: 'N. Sambasiva Rao',
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
    buyerId: 4,
    buyer: 'M. Srinivasa Rao',
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
  SALES: 'agriman_sales_transactions_v3',
  PAYMENTS: 'agriman_sales_payments_v3',
  BUYERS: 'agriman_sales_buyers_v3'
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

// ─── 3. FORMATTING & NORMALIZATION HELPERS ───────────────────────────────────
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const clean = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^\d.-]/g, ''));
  const num = Number.isFinite(clean) ? clean : 0;
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

export function computePaymentStatus(netAmount, paidAmount) {
  const net = Number(netAmount) || 0;
  const paid = Number(paidAmount) || 0;
  if (paid <= 0) return 'Pending';
  if (paid >= net - 0.01) return 'Paid';
  return 'Partially Paid';
}

function toServiceError(err, fallbackMessage) {
  const message =
    err?.friendlyMessage ||
    err?.response?.data?.message ||
    err?.response?.data?.title ||
    err?.message ||
    fallbackMessage;
  const wrapped = new Error(message);
  wrapped.statusCode = err?.statusCode ?? err?.response?.status ?? 0;
  wrapped.validationErrors = err?.validationErrors ?? err?.response?.data?.errors ?? null;
  wrapped.cause = err;
  return wrapped;
}

function normalizeSale(s) {
  if (!s || typeof s !== 'object') return null;
  return {
    id: s.id ?? s.Id,
    salesNo: s.salesNo ?? s.SalesNo ?? '',
    salesDate: String(s.salesDate ?? s.SalesDate ?? '').slice(0, 10),
    buyerId: s.buyerId ?? s.BuyerId ?? null,
    buyer: s.buyer ?? s.Buyer ?? '',
    farm: s.farm ?? s.Farm ?? '',
    crop: s.crop ?? s.Crop ?? '',
    quantity: Number(s.quantity ?? s.Quantity) || 0,
    unit: s.unit ?? s.Unit ?? 'Quintals',
    rate: Number(s.rate ?? s.Rate) || 0,
    grossAmount: Number(s.grossAmount ?? s.GrossAmount) || 0,
    commission: Number(s.commission ?? s.Commission) || 0,
    transport: Number(s.transport ?? s.Transport) || 0,
    netAmount: Number(s.netAmount ?? s.NetAmount) || 0,
    paymentStatus: s.paymentStatus ?? s.PaymentStatus ?? 'Pending',
    remarks: s.remarks ?? s.Remarks ?? '',
    paidAmount: Number(s.paidAmount ?? s.PaidAmount) || 0,
    balanceAmount: Number(s.balanceAmount ?? s.BalanceAmount) || 0,
    items: Array.isArray(s.items ?? s.Items) ? (s.items ?? s.Items) : [],
    payments: Array.isArray(s.payments ?? s.Payments) ? (s.payments ?? s.Payments).map(normalizePayment).filter(Boolean) : [],
    createdAt: s.createdAt ?? s.CreatedAt ?? new Date().toISOString(),
    updatedAt: s.updatedAt ?? s.UpdatedAt ?? null
  };
}

const SEED_BUYER_OWNER_MAP = {
  'BUY-001': { ownerName: 'K. Venkateswara Rao', businessName: 'Sri Lakshmi Traders' },
  'BUY-002': { ownerName: 'N. Sambasiva Rao', businessName: 'Dairy Cooperative Society' },
  'BUY-003': { ownerName: 'Rajesh Agarwal', businessName: 'Hyderabad Wholesale Mandi' },
  'BUY-004': { ownerName: 'M. Srinivasa Rao', businessName: 'Kisan Export & Trading Co' },
  'BUY-005': { ownerName: 'P. Satyanarayana', businessName: 'Annapurna Rice Millers' }
};

const KNOWN_FIRM_TO_OWNER = {
  'sri lakshmi traders': { ownerName: 'K. Venkateswara Rao', businessName: 'Sri Lakshmi Traders' },
  'sri lakshmi agri traders': { ownerName: 'K. Venkateswara Rao', businessName: 'Sri Lakshmi Traders' },
  'dairy cooperative society': { ownerName: 'N. Sambasiva Rao', businessName: 'Dairy Cooperative Society' },
  'guntur milk producers union': { ownerName: 'N. Sambasiva Rao', businessName: 'Dairy Cooperative Society' },
  'hyderabad wholesale mandi': { ownerName: 'Rajesh Agarwal', businessName: 'Hyderabad Wholesale Mandi' },
  'telangana agro mandi pvt ltd': { ownerName: 'Rajesh Agarwal', businessName: 'Hyderabad Wholesale Mandi' },
  'kisan export & trading co': { ownerName: 'M. Srinivasa Rao', businessName: 'Kisan Export & Trading Co' },
  'kisan export commercial ventures': { ownerName: 'M. Srinivasa Rao', businessName: 'Kisan Export & Trading Co' },
  'annapurna rice millers': { ownerName: 'P. Satyanarayana', businessName: 'Annapurna Rice Millers' },
  'annapurna grain processors ltd': { ownerName: 'P. Satyanarayana', businessName: 'Annapurna Rice Millers' }
};

function normalizeBuyer(b) {
  if (!b || typeof b !== 'object') return null;
  const code = String(b.buyerCode ?? b.BuyerCode ?? (b.id ?? b.Id ? `BUY-${String(b.id ?? b.Id).padStart(3, '0')}` : '')).trim();
  let rawBuyerName = String(b.buyerName ?? b.BuyerName ?? b.name ?? '').trim();
  let rawBusinessName = String(b.businessName ?? b.BusinessName ?? '').trim();

  // If buyerName has a company/trade name rather than person name, map to owner person name
  const firmMatch = KNOWN_FIRM_TO_OWNER[rawBuyerName.toLowerCase()] || SEED_BUYER_OWNER_MAP[code];
  let buyerName = rawBuyerName;
  let businessName = rawBusinessName;

  if (firmMatch) {
    if (!rawBuyerName || KNOWN_FIRM_TO_OWNER[rawBuyerName.toLowerCase()]) {
      buyerName = firmMatch.ownerName;
      if (!rawBusinessName || KNOWN_FIRM_TO_OWNER[rawBusinessName.toLowerCase()]) {
        businessName = firmMatch.businessName;
      }
    }
  }

  return {
    id: b.id ?? b.Id ?? (code ? parseInt(code.replace(/\D/g, ''), 10) || Date.now() : Date.now()),
    buyerCode: code,
    buyerName: buyerName || code,
    mobile: b.mobile ?? b.Mobile ?? b.phone ?? '',
    address: b.address ?? b.Address ?? '',
    businessName: businessName || firmMatch?.businessName || '',
    gstin: b.gstin ?? b.Gstin ?? '',
    openingBalance: Number(b.openingBalance ?? b.OpeningBalance) || 0,
    status: b.status ?? b.Status ?? 'Active',
    totalSalesCount: Number(b.totalSalesCount ?? b.TotalSalesCount) || 0,
    totalSalesAmount: Number(b.totalSalesAmount ?? b.TotalSalesAmount) || 0,
    totalPaidAmount: Number(b.totalPaidAmount ?? b.TotalPaidAmount) || 0,
    outstandingBalance: Number(b.outstandingBalance ?? b.OutstandingBalance) || 0,
    createdAt: b.createdAt ?? b.CreatedAt ?? new Date().toISOString(),
    updatedAt: b.updatedAt ?? b.UpdatedAt ?? null
  };
}

function normalizePayment(p) {
  if (!p || typeof p !== 'object') return null;
  return {
    id: p.id ?? p.Id,
    saleId: p.saleId ?? p.SaleId ?? null,
    buyerId: p.buyerId ?? p.BuyerId ?? null,
    paymentNo: p.paymentNo ?? p.PaymentNo ?? '',
    paymentDate: String(p.paymentDate ?? p.PaymentDate ?? '').slice(0, 10),
    buyer: p.buyer ?? p.Buyer ?? '',
    salesNo: p.salesNo ?? p.SalesNo ?? '',
    paymentAmount: Number(p.paymentAmount ?? p.PaymentAmount) || 0,
    paymentMode: p.paymentMode ?? p.PaymentMode ?? 'Bank',
    referenceNo: p.referenceNo ?? p.ReferenceNo ?? '',
    remarks: p.remarks ?? p.Remarks ?? '',
    updatedSaleStatus: p.updatedSaleStatus ?? p.UpdatedSaleStatus ?? null,
    remainingSaleBalance: p.remainingSaleBalance ?? p.RemainingSaleBalance ?? null,
    createdAt: p.createdAt ?? p.CreatedAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? p.UpdatedAt ?? null
  };
}

function normalizeReceivable(r) {
  if (!r || typeof r !== 'object') return null;
  return {
    id: r.id ?? r.Id,
    salesNo: r.salesNo ?? r.SalesNo ?? '',
    salesDate: String(r.salesDate ?? r.SalesDate ?? '').slice(0, 10),
    buyerId: r.buyerId ?? r.BuyerId ?? null,
    buyer: r.buyer ?? r.Buyer ?? '',
    farm: r.farm ?? r.Farm ?? '',
    crop: r.crop ?? r.Crop ?? '',
    grossAmount: Number(r.grossAmount ?? r.GrossAmount) || 0,
    totalSalesAmount: Number(r.totalSalesAmount ?? r.TotalSalesAmount ?? r.netAmount) || 0,
    amountReceived: Number(r.amountReceived ?? r.AmountReceived) || 0,
    outstandingAmount: Number(r.outstandingAmount ?? r.OutstandingAmount) || 0,
    paymentStatus: r.paymentStatus ?? r.PaymentStatus ?? 'Pending',
    paymentsCount: Number(r.paymentsCount ?? r.PaymentsCount) || 0,
    payments: Array.isArray(r.payments ?? r.Payments) ? (r.payments ?? r.Payments).map(normalizePayment).filter(Boolean) : []
  };
}

function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  return null;
}

// ─── 4. LIVE API + PERSISTENT RESILIENT SALES SERVICE ─────────────────────────
export const salesService = {
  // ── A. SALES TRANSACTIONS (`Sales` & `SalesItems`) ─────────────────────────
  getSales: async () => {
    const localSales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    try {
      const res = await api.get('/api/Sales', { params: { pageSize: 500 } });
      const items = extractArray(res.data);
      if (Array.isArray(items) && items.length > 0) {
        const normalized = items.map(normalizeSale).filter(Boolean);
        if (normalized.length > 0) {
          writeStorage(STORAGE_KEYS.SALES, normalized);
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[salesService] Live /api/Sales unavailable, using local cache:', err.message || err);
    }
    return localSales.map(normalizeSale).filter(Boolean);
  },

  createSale: async (saleData) => {
    const quantity = Math.max(0, Number(saleData.quantity) || 0);
    const rate = Math.max(0, Number(saleData.rate) || 0);
    const grossAmount = Math.round(quantity * rate * 100) / 100;
    const commission = Math.max(0, Number(saleData.commission) || 0);
    const transport = Math.max(0, Number(saleData.transport) || 0);
    const netAmount = Math.max(0, Math.round((grossAmount - commission - transport) * 100) / 100);

    const payload = {
      salesNo: saleData.salesNo?.trim() || undefined,
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
      remarks: saleData.remarks?.trim() || undefined
    };

    let created = null;
    try {
      const res = await api.post('/api/Sales', payload);
      created = normalizeSale(res.data?.data ?? res.data);
    } catch (err) {
      console.warn('[salesService] Live /api/Sales POST failed, saving to local cache:', err.message || err);
      created = normalizeSale({
        ...payload,
        id: Date.now(),
        createdAt: new Date().toISOString()
      });
    }

    const current = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    writeStorage(STORAGE_KEYS.SALES, [...current, created]);
    return created;
  },

  updateSale: async (id, saleData) => {
    const quantity = Math.max(0, Number(saleData.quantity) || 0);
    const rate = Math.max(0, Number(saleData.rate) || 0);
    const grossAmount = Math.round(quantity * rate * 100) / 100;
    const commission = Math.max(0, Number(saleData.commission) || 0);
    const transport = Math.max(0, Number(saleData.transport) || 0);
    const netAmount = Math.max(0, Math.round((grossAmount - commission - transport) * 100) / 100);

    const payload = {
      salesNo: saleData.salesNo?.trim() || undefined,
      salesDate: saleData.salesDate || undefined,
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
      remarks: saleData.remarks?.trim() || undefined
    };

    let updated = null;
    try {
      const res = await api.put(`/api/Sales/${id}`, payload);
      updated = normalizeSale(res.data?.data ?? res.data);
    } catch (err) {
      console.warn('[salesService] Live /api/Sales PUT failed, updating local cache:', err.message || err);
      updated = normalizeSale({ ...payload, id, updatedAt: new Date().toISOString() });
    }

    const current = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    const idx = current.findIndex((s) => String(s.id) === String(id) || s.salesNo === saleData.salesNo);
    if (idx !== -1) current[idx] = { ...current[idx], ...updated };
    else current.push(updated);
    writeStorage(STORAGE_KEYS.SALES, current);

    return updated;
  },

  deleteSale: async (id) => {
    try {
      await api.delete(`/api/Sales/${id}`);
    } catch (err) {
      console.warn('[salesService] Live /api/Sales DELETE failed, removing from local cache:', err.message || err);
    }
    const current = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    writeStorage(STORAGE_KEYS.SALES, current.filter((s) => String(s.id) !== String(id)));
    return true;
  },

  // ── B. BUYERS / CUSTOMERS (`Buyers`) ───────────────────────────────────────
  getBuyers: async () => {
    const localBuyers = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    try {
      const res = await api.get('/api/Buyers');
      const items = extractArray(res.data);
      if (Array.isArray(items) && items.length > 0) {
        const normalized = items.map(normalizeBuyer).filter(Boolean);
        if (normalized.length > 0) {
          writeStorage(STORAGE_KEYS.BUYERS, normalized);
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[salesService] Live /api/Buyers unavailable, using local cache:', err.message || err);
    }
    return localBuyers.map(normalizeBuyer).filter(Boolean);
  },

  createBuyer: async (buyerData) => {
    const payload = {
      buyerCode: buyerData.buyerCode?.trim() || undefined,
      buyerName: buyerData.buyerName?.trim() || '',
      mobile: buyerData.mobile?.trim() || '',
      address: buyerData.address?.trim() || null,
      businessName: buyerData.businessName?.trim() || null,
      gstin: buyerData.gstin?.trim() || null,
      openingBalance: Math.max(0, Number(buyerData.openingBalance) || 0),
      status: buyerData.status || 'Active'
    };

    let createdBuyer = null;
    try {
      const res = await api.post('/api/Buyers', payload);
      createdBuyer = normalizeBuyer(res.data?.data ?? res.data);
    } catch (err) {
      console.warn('[salesService] Live /api/Buyers POST failed, saving to local cache:', err.message || err);
      createdBuyer = normalizeBuyer({
        ...payload,
        id: Date.now(),
        createdAt: new Date().toISOString()
      });
    }

    const existing = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    writeStorage(STORAGE_KEYS.BUYERS, [...existing, createdBuyer]);
    return createdBuyer;
  },

  updateBuyer: async (id, buyerData) => {
    const payload = {
      buyerCode: buyerData.buyerCode?.trim() || undefined,
      buyerName: buyerData.buyerName?.trim() || '',
      mobile: buyerData.mobile?.trim() || '',
      address: buyerData.address?.trim() || null,
      businessName: buyerData.businessName?.trim() || null,
      gstin: buyerData.gstin?.trim() || null,
      openingBalance: Math.max(0, Number(buyerData.openingBalance) || 0),
      status: buyerData.status || 'Active'
    };

    let updatedBuyer = null;
    try {
      const res = await api.put(`/api/Buyers/${id}`, payload);
      updatedBuyer = normalizeBuyer(res.data?.data ?? res.data);
    } catch (err) {
      console.warn('[salesService] Live /api/Buyers PUT failed, updating local cache:', err.message || err);
      updatedBuyer = normalizeBuyer({ ...payload, id, updatedAt: new Date().toISOString() });
    }

    const existing = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    const idx = existing.findIndex((b) => String(b.id) === String(id) || b.buyerCode === buyerData.buyerCode);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...updatedBuyer };
    } else {
      existing.push(updatedBuyer);
    }
    writeStorage(STORAGE_KEYS.BUYERS, existing);

    return updatedBuyer;
  },

  deleteBuyer: async (id) => {
    try {
      await api.delete(`/api/Buyers/${id}`);
    } catch (err) {
      console.warn('[salesService] Live /api/Buyers DELETE failed, removing from local cache:', err.message || err);
    }
    const existing = readStorage(STORAGE_KEYS.BUYERS, SEED_BUYERS);
    writeStorage(STORAGE_KEYS.BUYERS, existing.filter((b) => String(b.id) !== String(id)));
    return true;
  },

  // ── C. SALES PAYMENTS & RECEIVABLES (`SalesPayments`) ──────────────────────
  getPayments: async () => {
    const localPayments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);
    try {
      const res = await api.get('/api/SalesPayments');
      const items = extractArray(res.data);
      if (Array.isArray(items) && items.length > 0) {
        const normalized = items.map(normalizePayment).filter(Boolean);
        if (normalized.length > 0) {
          writeStorage(STORAGE_KEYS.PAYMENTS, normalized);
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[salesService] Live /api/SalesPayments unavailable, using local cache:', err.message || err);
    }
    return localPayments.map(normalizePayment).filter(Boolean);
  },

  recordPayment: async (paymentData) => {
    const amount = Number(paymentData.paymentAmount) || 0;
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const payload = {
      paymentNo: paymentData.paymentNo?.trim() || undefined,
      paymentDate: paymentData.paymentDate || new Date().toISOString().slice(0, 10),
      saleId: paymentData.saleId || undefined,
      buyerId: paymentData.buyerId || undefined,
      buyer: paymentData.buyer?.trim() || undefined,
      salesNo: paymentData.salesNo?.trim() || undefined,
      paymentAmount: amount,
      paymentMode: paymentData.paymentMode || 'Bank',
      referenceNo: paymentData.referenceNo?.trim() || null,
      remarks: paymentData.remarks?.trim() || null
    };

    let payment = null;
    try {
      const res = await api.post('/api/SalesPayments', payload);
      payment = normalizePayment(res.data?.data ?? res.data);
    } catch (err) {
      console.warn('[salesService] Live /api/SalesPayments POST failed, saving to local cache:', err.message || err);
      payment = normalizePayment({ ...payload, id: Date.now(), createdAt: new Date().toISOString() });
    }

    const current = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);
    writeStorage(STORAGE_KEYS.PAYMENTS, [...current, payment]);

    // Also update associated sale's paid and status
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    const saleIdx = sales.findIndex((s) => s.salesNo === payment.salesNo);
    if (saleIdx !== -1) {
      const sale = sales[saleIdx];
      const newPaid = (Number(sale.paidAmount) || 0) + amount;
      sale.paidAmount = newPaid;
      sale.balanceAmount = Math.max(0, (Number(sale.netAmount) || 0) - newPaid);
      sale.paymentStatus = computePaymentStatus(sale.netAmount, newPaid);
      writeStorage(STORAGE_KEYS.SALES, sales);
    }

    return { payment };
  },

  // Direct Update / Save from the Receivables & Payment Screen
  updateReceivable: async (data) => {
    if (!data?.salesNo?.trim()) {
      throw new Error('Sales Number is required to update receivables.');
    }

    const totalSalesAmount = Math.max(0, Number(data.totalSalesAmount) || 0);
    const amountReceived = Math.max(0, Number(data.amountReceived) || 0);

    const payload = {
      buyer: data.buyer?.trim() || undefined,
      salesDate: data.salesDate || undefined,
      totalSalesAmount,
      amountReceived,
      paymentStatus: data.paymentStatus || computePaymentStatus(totalSalesAmount, amountReceived),
      paymentMode: data.paymentMode || 'Bank',
      referenceNo: data.referenceNo?.trim() || null,
      remarks: data.remarks?.trim() || null
    };

    let updated = null;
    try {
      const res = await api.put(`/api/Sales/receivables/${encodeURIComponent(data.salesNo.trim())}`, payload);
      updated = normalizeReceivable(res.data?.data ?? res.data);
    } catch (err) {
      console.warn('[salesService] Live /api/Sales/receivables PUT failed, updating local sales:', err.message || err);
      updated = normalizeReceivable({
        ...payload,
        salesNo: data.salesNo,
        netAmount: totalSalesAmount,
        grossAmount: totalSalesAmount
      });
    }

    // Reflect into sales storage
    const sales = readStorage(STORAGE_KEYS.SALES, SEED_SALES);
    const idx = sales.findIndex((s) => s.salesNo === data.salesNo);
    if (idx !== -1) {
      sales[idx].paidAmount = amountReceived;
      sales[idx].balanceAmount = Math.max(0, (Number(sales[idx].netAmount) || totalSalesAmount) - amountReceived);
      sales[idx].paymentStatus = payload.paymentStatus;
      writeStorage(STORAGE_KEYS.SALES, sales);
    }

    return updated;
  },

  deletePayment: async (paymentId) => {
    try {
      await api.delete(`/api/SalesPayments/${paymentId}`);
    } catch (err) {
      console.warn('[salesService] Live /api/SalesPayments DELETE failed, removing from local cache:', err.message || err);
    }
    const current = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);
    writeStorage(STORAGE_KEYS.PAYMENTS, current.filter((p) => String(p.id) !== String(paymentId)));
    return true;
  },

  getReceivables: async () => {
    try {
      const res = await api.get('/api/Sales/receivables');
      const items = extractArray(res.data);
      if (Array.isArray(items) && items.length > 0) {
        return items.map(normalizeReceivable).filter(Boolean);
      }
    } catch (err) {
      console.warn('[salesService] Live /api/Sales/receivables unavailable, computing from sales & payments:', err.message || err);
    }

    // Resilient fallback: compute receivables from sales & payments
    const sales = await salesService.getSales();
    const payments = readStorage(STORAGE_KEYS.PAYMENTS, SEED_SALES_PAYMENTS);

    return sales.map((sale) => {
      const relatedPayments = payments.filter((p) => p.salesNo === sale.salesNo);
      const rawReceived = relatedPayments.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
      const totalAmount = Number(sale.netAmount) || 0;
      const amountReceived = sale.paymentStatus === 'Paid' ? totalAmount : Math.min(totalAmount, rawReceived || (sale.paidAmount ?? 0));
      const outstandingAmount = Math.max(0, Math.round((totalAmount - amountReceived) * 100) / 100);
      const status = sale.paymentStatus || computePaymentStatus(totalAmount, amountReceived);

      return {
        id: sale.id,
        salesNo: sale.salesNo,
        salesDate: sale.salesDate,
        buyerId: sale.buyerId,
        buyer: sale.buyer,
        farm: sale.farm,
        crop: sale.crop,
        totalSalesAmount: totalAmount,
        grossAmount: sale.grossAmount,
        amountReceived,
        outstandingAmount,
        paymentStatus: status,
        paymentsCount: relatedPayments.length,
        payments: relatedPayments.map(normalizePayment).filter(Boolean)
      };
    });
  },

  // ── D. LOOKUPS: FARMS & CROPS ──────────────────────────────────────────────
  getFarms: async () => {
    try {
      const res = await api.get('/api/Farms');
      const list = extractArray(res.data);
      if (Array.isArray(list) && list.length > 0) {
        const names = list.map((f) => f.farmName || f.FarmName || f.name).filter(Boolean);
        if (names.length > 0) return [...new Set(names)];
      }
    } catch (e) {
      console.warn('[salesService] Live /api/Farms lookup unavailable, using fallback farms:', e.message || e);
    }
    return FALLBACK_FARMS;
  },

  getCrops: async () => {
    try {
      const res = await api.get('/api/Crop');
      const list = extractArray(res.data);
      if (Array.isArray(list) && list.length > 0) {
        const names = list.map((c) => c.cropName || c.CropName || c.name).filter(Boolean);
        if (names.length > 0) return [...new Set(names)];
      }
    } catch (e) {
      console.warn('[salesService] Live /api/Crop lookup unavailable, using fallback crops:', e.message || e);
    }
    return FALLBACK_CROPS;
  }
};

export default salesService;
