import api from './api.js';

// Kept exported as empty arrays for backwards compatibility with any legacy imports
export const SEED_BUYERS = [];
export const SEED_SALES = [];
export const SEED_SALES_ITEMS = [];
export const SEED_SALES_PAYMENTS = [];

// ─── 2. FORMATTING & NORMALIZATION HELPERS ───────────────────────────────────
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
    payments: Array.isArray(s.payments ?? s.Payments) ? (s.payments ?? s.Payments).map(normalizePayment) : [],
    createdAt: s.createdAt ?? s.CreatedAt ?? new Date().toISOString(),
    updatedAt: s.updatedAt ?? s.UpdatedAt ?? null
  };
}

function normalizeBuyer(b) {
  return {
    id: b.id ?? b.Id,
    buyerCode: b.buyerCode ?? b.BuyerCode ?? `BUY-${b.id ?? b.Id ?? ''}`,
    buyerName: b.buyerName ?? b.BuyerName ?? b.name ?? '',
    mobile: b.mobile ?? b.Mobile ?? b.phone ?? '',
    address: b.address ?? b.Address ?? '',
    businessName: b.businessName ?? b.BusinessName ?? '',
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
    payments: Array.isArray(r.payments ?? r.Payments) ? (r.payments ?? r.Payments).map(normalizePayment) : []
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

// ─── 3. LIVE API SALES SERVICE IMPLEMENTATION ────────────────────────────────
export const salesService = {
  // ── A. SALES TRANSACTIONS (`Sales` & `SalesItems`) ─────────────────────────
  getSales: async () => {
    try {
      const res = await api.get('/api/Sales', { params: { pageSize: 500 } });
      const items = extractArray(res.data);
      if (!items) {
        throw new Error('Unexpected response format from /api/Sales.');
      }
      return items.map(normalizeSale);
    } catch (err) {
      throw toServiceError(err, 'Failed to load sales transactions from backend API.');
    }
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

    try {
      const res = await api.post('/api/Sales', payload);
      return normalizeSale(res.data?.data ?? res.data);
    } catch (err) {
      throw toServiceError(err, 'Failed to create sales record.');
    }
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

    try {
      const res = await api.put(`/api/Sales/${id}`, payload);
      return normalizeSale(res.data?.data ?? res.data);
    } catch (err) {
      throw toServiceError(err, 'Failed to update sales record.');
    }
  },

  deleteSale: async (id) => {
    try {
      await api.delete(`/api/Sales/${id}`);
      return true;
    } catch (err) {
      throw toServiceError(err, 'Failed to delete sales record.');
    }
  },

  // ── B. BUYERS / CUSTOMERS (`Buyers`) ───────────────────────────────────────
  getBuyers: async () => {
    try {
      const res = await api.get('/api/Buyers');
      const items = extractArray(res.data);
      if (!items) {
        throw new Error('Unexpected response format from /api/Buyers.');
      }
      return items.map(normalizeBuyer);
    } catch (err) {
      throw toServiceError(err, 'Failed to load buyers from backend API.');
    }
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

    try {
      const res = await api.post('/api/Buyers', payload);
      return normalizeBuyer(res.data?.data ?? res.data);
    } catch (err) {
      throw toServiceError(err, 'Failed to register buyer.');
    }
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

    try {
      const res = await api.put(`/api/Buyers/${id}`, payload);
      return normalizeBuyer(res.data?.data ?? res.data);
    } catch (err) {
      throw toServiceError(err, 'Failed to update buyer record.');
    }
  },

  deleteBuyer: async (id) => {
    try {
      await api.delete(`/api/Buyers/${id}`);
      return true;
    } catch (err) {
      throw toServiceError(err, 'Failed to delete buyer record.');
    }
  },

  // ── C. SALES PAYMENTS & RECEIVABLES (`SalesPayments`) ──────────────────────
  getPayments: async () => {
    try {
      const res = await api.get('/api/SalesPayments');
      const items = extractArray(res.data);
      if (!items) {
        throw new Error('Unexpected response format from /api/SalesPayments.');
      }
      return items.map(normalizePayment);
    } catch (err) {
      throw toServiceError(err, 'Failed to load sales payments from backend API.');
    }
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

    try {
      const res = await api.post('/api/SalesPayments', payload);
      const payment = normalizePayment(res.data?.data ?? res.data);
      return { payment };
    } catch (err) {
      throw toServiceError(err, 'Failed to record sales payment.');
    }
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

    try {
      const res = await api.put(`/api/Sales/receivables/${encodeURIComponent(data.salesNo.trim())}`, payload);
      return normalizeReceivable(res.data?.data ?? res.data);
    } catch (err) {
      throw toServiceError(err, 'Failed to update receivable and payment details.');
    }
  },

  deletePayment: async (paymentId) => {
    try {
      await api.delete(`/api/SalesPayments/${paymentId}`);
      return true;
    } catch (err) {
      throw toServiceError(err, 'Failed to delete payment voucher.');
    }
  },

  getReceivables: async () => {
    try {
      const res = await api.get('/api/Sales/receivables');
      const items = extractArray(res.data);
      if (!items) {
        throw new Error('Unexpected response format from /api/Sales/receivables.');
      }
      return items.map(normalizeReceivable);
    } catch (err) {
      throw toServiceError(err, 'Failed to load receivables from backend API.');
    }
  },

  // ── D. LOOKUPS: FARMS & CROPS ──────────────────────────────────────────────
  getFarms: async () => {
    try {
      const res = await api.get('/api/Farms');
      const list = extractArray(res.data);
      if (!list) throw new Error('Unexpected response format from /api/Farms.');
      return [...new Set(list.map((farm) => farm.farmName || farm.FarmName || farm.name).filter(Boolean))];
    } catch (err) {
      throw toServiceError(err, 'Failed to load farms from backend API.');
    }
  },

  getCrops: async () => {
    try {
      const res = await api.get('/api/Crop');
      const list = extractArray(res.data);
      if (!list) throw new Error('Unexpected response format from /api/Crop.');
      return [...new Set(list.map((crop) => crop.cropName || crop.CropName || crop.name).filter(Boolean))];
    } catch (err) {
      throw toServiceError(err, 'Failed to load crops from backend API.');
    }
  }
};

export default salesService;
