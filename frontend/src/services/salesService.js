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
    const res = await api.get('/api/Sales?page=1&pageSize=500');
    const items = res.data?.items ?? res.data?.data ?? (Array.isArray(res.data) ? res.data : null);
    if (!Array.isArray(items)) throw new Error('The Sales API returned an unsupported response.');
    return items.map((sale) => ({
      ...sale,
      id: Number(sale.id),
      salesDate: String(sale.salesDate || '').slice(0, 10),
      quantity: Number(sale.quantity) || 0,
      rate: Number(sale.rate) || 0,
      grossAmount: Number(sale.grossAmount) || 0,
      commission: Number(sale.commission) || 0,
      transport: Number(sale.transport) || 0,
      netAmount: Number(sale.netAmount) || 0,
      paymentStatus: sale.paymentStatus || 'Pending',
      paidAmount: Number(sale.paidAmount) || 0,
      balanceAmount: Number(sale.balanceAmount) || 0,
    }));
  },

  createSale: async (saleData) => {
    const quantity = Math.max(0, Number(saleData.quantity) || 0);
    const rate = Math.max(0, Number(saleData.rate) || 0);
    const grossAmount = Math.round(quantity * rate * 100) / 100;
    const commission = Math.max(0, Number(saleData.commission) || 0);
    const transport = Math.max(0, Number(saleData.transport) || 0);
    const netAmount = Math.max(0, Math.round((grossAmount - commission - transport) * 100) / 100);

    const response = await api.post('/api/Sales', {
      salesNo: saleData.salesNo?.trim() || null,
      salesDate: saleData.salesDate || null,
      buyerId: saleData.buyerId ? Number(saleData.buyerId) : null,
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
    });
    return response.data;
  },

  updateSale: async (id, saleData) => {
    const quantity = Math.max(0, Number(saleData.quantity) || 0);
    const rate = Math.max(0, Number(saleData.rate) || 0);
    const grossAmount = Math.round(quantity * rate * 100) / 100;
    const commission = Math.max(0, Number(saleData.commission) || 0);
    const transport = Math.max(0, Number(saleData.transport) || 0);
    const netAmount = Math.max(0, Math.round((grossAmount - commission - transport) * 100) / 100);

    const response = await api.put(`/api/Sales/${Number(id)}`, {
      salesNo: saleData.salesNo,
      salesDate: saleData.salesDate,
      buyerId: saleData.buyerId ? Number(saleData.buyerId) : null,
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
    });
    return response.data;
  },

  deleteSale: async (id) => {
    await api.delete(`/api/Sales/${Number(id)}`);
    return true;
  },

  // ── B. BUYERS / CUSTOMERS (`buyers`) ───────────────────────────────────────
  getBuyers: async () => {
    const response = await api.get('/api/Buyers');
    const buyers = Array.isArray(response.data) ? response.data : response.data?.data;
    if (!Array.isArray(buyers)) throw new Error('The Buyers API returned an unsupported response.');
    return buyers.map((buyer) => ({
      ...buyer,
      id: Number(buyer.id),
      buyerCode: buyer.buyerCode || `BUY-${buyer.id}`,
      buyerName: buyer.buyerName || buyer.name || '',
      mobile: buyer.mobile || buyer.phone || '',
      openingBalance: Number(buyer.openingBalance) || 0,
      status: buyer.status || 'Active',
    }));
  },

  createBuyer: async (buyerData) => {
    const response = await api.post('/api/Buyers', {
      buyerCode: buyerData.buyerCode?.trim() || null,
      buyerName: buyerData.buyerName?.trim() || '',
      mobile: buyerData.mobile?.trim() || '',
      address: buyerData.address?.trim() || '',
      businessName: buyerData.businessName?.trim() || '',
      gstin: buyerData.gstin?.trim() || '',
      openingBalance: Math.max(0, Number(buyerData.openingBalance) || 0),
      status: buyerData.status || 'Active',
    });
    return response.data;
  },

  updateBuyer: async (id, buyerData) => {
    const response = await api.put(`/api/Buyers/${Number(id)}`, {
      buyerCode: buyerData.buyerCode?.trim() || null,
      buyerName: buyerData.buyerName?.trim() || '',
      mobile: buyerData.mobile?.trim() || '',
      address: buyerData.address || '',
      businessName: buyerData.businessName || '',
      gstin: buyerData.gstin || '',
      openingBalance: Math.max(0, Number(buyerData.openingBalance) || 0),
      status: buyerData.status || 'Active',
    });
    return response.data;
  },

  deleteBuyer: async (id) => {
    await api.delete(`/api/Buyers/${Number(id)}`);
    return true;
  },

  // ── C. SALES PAYMENTS & RECEIVABLES (`sales_payments`) ──────────────────────
  getPayments: async () => {
    const response = await api.get('/api/SalesPayments');
    const payments = Array.isArray(response.data) ? response.data : response.data?.data;
    if (!Array.isArray(payments)) throw new Error('The Sales Payments API returned an unsupported response.');
    return payments.map((payment) => ({
      ...payment,
      id: Number(payment.id),
      paymentDate: String(payment.paymentDate || '').slice(0, 10),
      paymentAmount: Number(payment.paymentAmount) || 0,
      paymentMode: payment.paymentMode || 'Bank',
      referenceNo: payment.referenceNo || '',
      remarks: payment.remarks || '',
    }));
  },

  recordPayment: async (paymentData) => {
    const response = await api.post('/api/SalesPayments', {
      paymentNo: paymentData.paymentNo?.trim() || null,
      paymentDate: paymentData.paymentDate || null,
      saleId: paymentData.saleId ? Number(paymentData.saleId) : null,
      buyerId: paymentData.buyerId ? Number(paymentData.buyerId) : null,
      buyer: paymentData.buyer?.trim() || null,
      salesNo: paymentData.salesNo?.trim() || null,
      paymentAmount: Number(paymentData.paymentAmount),
      paymentMode: paymentData.paymentMode || 'Bank',
      referenceNo: paymentData.referenceNo?.trim() || null,
      remarks: paymentData.remarks?.trim() || null,
    });
    return response.data;
  },

  // Direct Update / Save from the Receivables & Payment Screen
  updateReceivable: async (data) => {
    const response = await api.put(`/api/Sales/receivables/${encodeURIComponent(data.salesNo)}`, {
      buyer: data.buyer?.trim() || null,
      salesDate: data.salesDate || null,
      totalSalesAmount: Number(data.totalSalesAmount),
      amountReceived: Number(data.amountReceived),
      paymentStatus: data.paymentStatus || null,
      paymentMode: data.paymentMode || null,
      referenceNo: data.referenceNo?.trim() || null,
      remarks: data.remarks?.trim() || null,
    });
    return response.data;
  },

  deletePayment: async (paymentId) => {
    await api.delete(`/api/SalesPayments/${Number(paymentId)}`);
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
    const response = await api.get('/api/Farms');
    const farms = Array.isArray(response.data) ? response.data : response.data?.data || response.data?.items;
    if (!Array.isArray(farms)) throw new Error('The Farms API returned an unsupported response.');
    return [...new Set(farms.map((farm) => farm.farmName || farm.name).filter(Boolean))];
  },

  getCrops: async () => {
    const response = await api.get('/api/Crop');
    const crops = Array.isArray(response.data) ? response.data : response.data?.data || response.data?.items;
    if (!Array.isArray(crops)) throw new Error('The Crops API returned an unsupported response.');
    return [...new Set(crops.map((crop) => crop.cropName || crop.name).filter(Boolean))];
  }
};

export default salesService;
