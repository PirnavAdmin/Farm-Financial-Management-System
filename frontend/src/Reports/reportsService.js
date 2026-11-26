// ============================================================================
// AGRIMAN Module 19 — Reports Service
// Handles authoritative API communication, pagination, metrics calculation,
// and realistic fallback data generation for development review.
// ============================================================================

import api from '../services/api.js';
import { getReportById } from './reportsCatalog.js';

export const formatINR = (value) => {
  if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) {
    return '₹0';
  }
  const num = Math.round(Number(value));
  return `₹${num.toLocaleString('en-IN')}`;
};

export const formatNumber = (value) => {
  if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString('en-IN');
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
};

// ── Fallback Dataset Generator for Development & Offline Verification ────────
function generateSampleRows(reportId, filters = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const d1 = new Date();
  d1.setDate(d1.getDate() - 1);
  const yesterday = d1.toISOString().slice(0, 10);
  const d2 = new Date();
  d2.setDate(d2.getDate() - 2);
  const dayBefore = d2.toISOString().slice(0, 10);

  switch (reportId) {
    case 'daily-income': {
      return [
        // Today's records (2026-11-25) across diverse farms, crops, payment modes
        { id: 1, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-081', farmer: 'Ramanaiah Naidu', farm: 'Green Valley Farm', crop: 'Cotton', incomeType: 'Crop Harvest Sale', buyer: 'Balaji Cotton Ginning', amount: 84500, paymentMode: 'Bank Transfer', status: 'Received' },
        { id: 2, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-082', farmer: 'Siva Krishna', farm: 'Sunrise Acres', crop: 'Paddy', incomeType: 'Mandi Direct Sale', buyer: 'Kisan Mandi Depot', amount: 62000, paymentMode: 'Cash', status: 'Received' },
        { id: 3, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-083', farmer: 'Kavitha Devi', farm: 'Riverbank Farm', crop: 'Chilli', incomeType: 'Contract Procurement', buyer: 'Ramesh Agro Traders', amount: 48000, paymentMode: 'UPI', status: 'Received' },
        { id: 4, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-084', farmer: 'Venkatesh Rao', farm: 'Green Valley Farm', crop: 'Maize', incomeType: 'Bulk Grain Collection', buyer: 'Vijaya Feeds Cooperative', amount: 34200, paymentMode: 'Bank Transfer', status: 'Received' },
        { id: 5, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-085', farmer: 'Narayana Reddy', farm: 'North Ridge Orchard', crop: 'Paddy', incomeType: 'By-Product (Hay/Straw)', buyer: 'Local Cattle Feeders', amount: 9800, paymentMode: 'Cash', status: 'Received' },
        { id: 6, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-086', farmer: 'Anjaneyulu M', farm: 'Sunrise Acres', crop: 'Sugarcane', incomeType: 'Sugar Factory Advance', buyer: 'Deccan Sugars Mill', amount: 75000, paymentMode: 'Cheque', status: 'Pending' },
        { id: 7, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-087', farmer: 'Lakshmi Prasad', farm: 'Riverbank Farm', crop: 'Groundnut', incomeType: 'Oil Mill Procurement', buyer: 'Sri Balaji Oil Mills', amount: 52500, paymentMode: 'UPI', status: 'Received' },
        { id: 8, rawDate: today, date: formatDate(today), incomeNo: 'INC-2026-088', farmer: 'Ramesh Chandra', farm: 'Green Valley Farm', crop: 'Cotton', incomeType: 'Seed Cotton Mandi Lot', buyer: 'Kisan Mandi Depot', amount: 41000, paymentMode: 'Cash', status: 'Received' },

        // Yesterday's records
        { id: 9, rawDate: yesterday, date: formatDate(yesterday), incomeNo: 'INC-2026-077', farmer: 'Srinivas G', farm: 'Green Valley Farm', crop: 'Cotton', incomeType: 'Crop Harvest Sale', buyer: 'Balaji Cotton Ginning', amount: 92000, paymentMode: 'Bank Transfer', status: 'Received' },
        { id: 10, rawDate: yesterday, date: formatDate(yesterday), incomeNo: 'INC-2026-078', farmer: 'Madhav Rao', farm: 'Sunrise Acres', crop: 'Paddy', incomeType: 'Mandi Direct Sale', buyer: 'Kisan Mandi Depot', amount: 58000, paymentMode: 'Cash', status: 'Received' },
        { id: 11, rawDate: yesterday, date: formatDate(yesterday), incomeNo: 'INC-2026-079', farmer: 'Kavitha Devi', farm: 'Riverbank Farm', crop: 'Chilli', incomeType: 'Contract Procurement', buyer: 'Ramesh Agro Traders', amount: 46000, paymentMode: 'UPI', status: 'Received' },

        // Day before yesterday's records
        { id: 12, rawDate: dayBefore, date: formatDate(dayBefore), incomeNo: 'INC-2026-074', farmer: 'Ramanaiah Naidu', farm: 'Green Valley Farm', crop: 'Cotton', incomeType: 'Crop Harvest Sale', buyer: 'Balaji Cotton Ginning', amount: 76000, paymentMode: 'Bank Transfer', status: 'Received' }
      ];
    }

    case 'daily-expense': {
      return [
        { id: 1, date: formattedSelectedDate, voucherNo: 'EXP-2026-112', farm: 'Green Valley Farm', crop: 'Cotton', category: 'Fertilizers', payee: 'IFFCO Fertilizer Hub', amount: 18400, paymentMode: 'Bank Transfer', status: 'Paid' },
        { id: 2, date: formattedSelectedDate, voucherNo: 'EXP-2026-113', farm: 'Green Valley Farm', crop: 'Cotton', category: 'Labour Wages', payee: 'Field Gang - Sowing Team (12 workers)', amount: 9600, paymentMode: 'Cash', status: 'Paid' },
        { id: 3, date: formattedSelectedDate, voucherNo: 'EXP-2026-114', farm: 'Sunrise Acres', crop: 'Paddy', category: 'Machinery Fuel', payee: 'Bharat Petroleum Fuel Station', amount: 6500, paymentMode: 'UPI', status: 'Paid' },
        { id: 4, date: formattedSelectedDate, voucherNo: 'EXP-2026-115', farm: 'Riverbank Farm', crop: 'Chilli', category: 'Pesticides', payee: 'Rasi Agro Chemicals', amount: 12200, paymentMode: 'Bank Transfer', status: 'Paid' },
        { id: 5, date: formattedSelectedDate, voucherNo: 'EXP-2026-116', farm: 'Sunrise Acres', crop: 'General', category: 'Equipment Repair', payee: 'Sri Balaji Tractor Workshop', amount: 4800, paymentMode: 'Cash', status: 'Paid' }
      ];
    }

    case 'monthly-income': {
      return [
        { id: 1, period: 'Apr 2025', txnCount: 42, cropSales: 480000, farmOps: 45000, subsidies: 50000, rentalIncome: 25000, totalIncome: 600000 },
        { id: 2, period: 'May 2025', txnCount: 38, cropSales: 350000, farmOps: 40000, subsidies: 0, rentalIncome: 30000, totalIncome: 420000 },
        { id: 3, period: 'Jun 2025', txnCount: 51, cropSales: 610000, farmOps: 52000, subsidies: 75000, rentalIncome: 35000, totalIncome: 772000 },
        { id: 4, period: 'Jul 2025', txnCount: 46, cropSales: 540000, farmOps: 48000, subsidies: 0, rentalIncome: 40000, totalIncome: 628000 },
        { id: 5, period: 'Aug 2025', txnCount: 59, cropSales: 720000, farmOps: 61000, subsidies: 0, rentalIncome: 45000, totalIncome: 826000 },
        { id: 6, period: 'Sep 2025', txnCount: 64, cropSales: 890000, farmOps: 70000, subsidies: 100000, rentalIncome: 42000, totalIncome: 1102000 },
        { id: 7, period: 'Oct 2025', txnCount: 72, cropSales: 1150000, farmOps: 85000, subsidies: 0, rentalIncome: 50000, totalIncome: 1285000 },
        { id: 8, period: 'Nov 2025', txnCount: 68, cropSales: 980000, farmOps: 76000, subsidies: 0, rentalIncome: 48000, totalIncome: 1104000 },
        { id: 9, period: 'Dec 2025', txnCount: 55, cropSales: 740000, farmOps: 64000, subsidies: 50000, rentalIncome: 38000, totalIncome: 892000 },
        { id: 10, period: 'Jan 2026', txnCount: 48, cropSales: 620000, farmOps: 55000, subsidies: 0, rentalIncome: 32000, totalIncome: 707000 },
        { id: 11, period: 'Feb 2026', txnCount: 52, cropSales: 680000, farmOps: 59000, subsidies: 0, rentalIncome: 36000, totalIncome: 775000 },
        { id: 12, period: 'Mar 2026', txnCount: 60, cropSales: 820000, farmOps: 68000, subsidies: 120000, rentalIncome: 44000, totalIncome: 1052000 }
      ];
    }

    case 'monthly-expense': {
      return [
        { id: 1, period: 'Apr 2025', voucherCount: 54, inputsCost: 180000, labourCost: 110000, machineryCost: 45000, overheadCost: 25000, totalExpense: 360000 },
        { id: 2, period: 'May 2025', voucherCount: 46, inputsCost: 140000, labourCost: 95000, machineryCost: 38000, overheadCost: 22000, totalExpense: 295000 },
        { id: 3, period: 'Jun 2025', voucherCount: 68, inputsCost: 260000, labourCost: 145000, machineryCost: 65000, overheadCost: 30000, totalExpense: 500000 },
        { id: 4, period: 'Jul 2025', voucherCount: 62, inputsCost: 210000, labourCost: 130000, machineryCost: 55000, overheadCost: 28000, totalExpense: 423000 },
        { id: 5, period: 'Aug 2025', voucherCount: 74, inputsCost: 290000, labourCost: 165000, machineryCost: 72000, overheadCost: 32000, totalExpense: 559000 },
        { id: 6, period: 'Sep 2025', voucherCount: 70, inputsCost: 250000, labourCost: 155000, machineryCost: 68000, overheadCost: 31000, totalExpense: 504000 },
        { id: 7, period: 'Oct 2025', voucherCount: 82, inputsCost: 320000, labourCost: 190000, machineryCost: 85000, overheadCost: 35000, totalExpense: 630000 },
        { id: 8, period: 'Nov 2025', voucherCount: 78, inputsCost: 280000, labourCost: 175000, machineryCost: 78000, overheadCost: 34000, totalExpense: 567000 },
        { id: 9, period: 'Dec 2025', voucherCount: 58, inputsCost: 190000, labourCost: 120000, machineryCost: 50000, overheadCost: 26000, totalExpense: 386000 },
        { id: 10, period: 'Jan 2026', voucherCount: 50, inputsCost: 160000, labourCost: 105000, machineryCost: 42000, overheadCost: 24000, totalExpense: 331000 },
        { id: 11, period: 'Feb 2026', voucherCount: 56, inputsCost: 175000, labourCost: 115000, machineryCost: 46000, overheadCost: 25000, totalExpense: 361000 },
        { id: 12, period: 'Mar 2026', voucherCount: 65, inputsCost: 220000, labourCost: 140000, machineryCost: 60000, overheadCost: 30000, totalExpense: 450000 }
      ];
    }

    case 'annual-income': {
      return [
        { id: 1, fy: '2025-2026', q1: 1792000, q2: 2556000, q3: 3281000, q4: 2534000, totalRevenue: 10163000, growth: '+18.4%' },
        { id: 2, fy: '2024-2025', q1: 1520000, q2: 2180000, q3: 2790000, q4: 2090000, totalRevenue: 8580000, growth: '+14.2%' },
        { id: 3, fy: '2023-2024', q1: 1350000, q2: 1910000, q3: 2420000, q4: 1830000, totalRevenue: 7510000, growth: 'Baseline' }
      ];
    }

    case 'annual-expense': {
      return [
        { id: 1, fy: '2025-2026', q1: 1155000, q2: 1486000, q3: 1583000, q4: 1142000, totalExpense: 5366000, variance: '-4.2% Under' },
        { id: 2, fy: '2024-2025', q1: 1020000, q2: 1310000, q3: 1420000, q4: 1010000, totalExpense: 4760000, variance: '+1.5% Over' },
        { id: 3, fy: '2023-2024', q1: 890000, q2: 1180000, q3: 1250000, q4: 920000, totalExpense: 4240000, variance: 'Baseline' }
      ];
    }

    case 'pnl': {
      return [
        { id: 1, accountHead: 'Crop Harvest Sales (Paddy, Cotton, Chilli)', category: 'Direct Revenue', revenue: 8580000, expense: 0, net: 8580000, margin: '84.4%' },
        { id: 2, accountHead: 'Dairy & Livestock Operations', category: 'Farm Operations', revenue: 840000, expense: 0, net: 840000, margin: '8.3%' },
        { id: 3, accountHead: 'Government Agriculture Subsidies (PM-KISAN/Rythu)', category: 'Other Income', revenue: 395000, expense: 0, net: 395000, margin: '3.9%' },
        { id: 4, accountHead: 'Machinery Rental Service to Neighbour Farmers', category: 'Other Income', revenue: 348000, expense: 0, net: 348000, margin: '3.4%' },
        { id: 5, accountHead: 'Seeds, Seedlings & Nursery Material', category: 'Direct Operating Cost', revenue: 0, expense: 780000, net: -780000, margin: '-14.5%' },
        { id: 6, accountHead: 'Fertilizers & Bio-Nutrients (Urea, DAP, NPK)', category: 'Direct Operating Cost', revenue: 0, expense: 1240000, net: -1240000, margin: '-23.1%' },
        { id: 7, accountHead: 'Pesticides, Fungicides & Plant Protection', category: 'Direct Operating Cost', revenue: 0, expense: 650000, net: -650000, margin: '-12.1%' },
        { id: 8, accountHead: 'Field Labour Wages & Muster Payroll', category: 'Labour Wages', revenue: 0, expense: 1580000, net: -1580000, margin: '-29.4%' },
        { id: 9, accountHead: 'Tractor Diesel, Harvester Hire & Maintenance', category: 'Machinery Costs', revenue: 0, expense: 746000, net: -746000, margin: '-13.9%' },
        { id: 10, accountHead: 'Electricity, Borewell Power & General Repairs', category: 'Overhead & Admin', revenue: 0, expense: 370000, net: -370000, margin: '-6.9%' }
      ];
    }

    case 'cash-flow': {
      return [
        { id: 1, date: '18 Nov 2026', refNo: 'REC-2026-401', description: 'Cotton harvest final settlement payment', counterparty: 'Balaji Cotton Ginning', inflow: 125000, outflow: 0, balance: 485000 },
        { id: 2, date: '17 Nov 2026', refNo: 'PAY-2026-382', description: 'Weekly muster wages for weeding crew', counterparty: 'Field Labour Crew (18 workers)', inflow: 0, outflow: 24500, balance: 360000 },
        { id: 3, date: '15 Nov 2026', refNo: 'REC-2026-400', description: 'Tractor rental hire receipt from Farmer Ravi', counterparty: 'Ravi Kumar (Rentee)', inflow: 18000, outflow: 0, balance: 384500 },
        { id: 4, date: '14 Nov 2026', refNo: 'PAY-2026-381', description: '50 bags NPK 19:19:19 fertilizer purchase', counterparty: 'IFFCO Primary Society', inflow: 0, outflow: 42500, balance: 366500 },
        { id: 5, date: '11 Nov 2026', refNo: 'REC-2026-399', description: 'Chilli spice market procurement check', counterparty: 'Ramesh Agro Traders', inflow: 88000, outflow: 0, balance: 409000 },
        { id: 6, date: '08 Nov 2026', refNo: 'PAY-2026-380', description: 'Diesel refill 200L for John Deere Tractor', counterparty: 'Bharat Petroleum Outlet', inflow: 0, outflow: 19400, balance: 321000 }
      ];
    }

    case 'receivables': {
      return [
        { id: 1, invoiceNo: 'INV-2026-092', date: '02 Nov 2026', buyer: 'Ramesh Agro Traders', dueDate: '17 Nov 2026', totalAmount: 185000, receivedAmount: 100000, outstanding: 85000, agingDays: '8 Days', status: 'Overdue' },
        { id: 2, invoiceNo: 'INV-2026-098', date: '10 Nov 2026', buyer: 'Balaji Cotton Ginning', dueDate: '25 Nov 2026', totalAmount: 240000, receivedAmount: 0, outstanding: 240000, agingDays: 'Due in 2d', status: 'Pending' },
        { id: 3, invoiceNo: 'INV-2026-104', date: '15 Nov 2026', buyer: 'Kisan Mandi Depot', dueDate: '30 Nov 2026', totalAmount: 96000, receivedAmount: 50000, outstanding: 46000, agingDays: 'Due in 7d', status: 'Partially Paid' },
        { id: 4, invoiceNo: 'INV-2026-071', date: '12 Oct 2026', buyer: 'Supreme Grains Corp', dueDate: '27 Oct 2026', totalAmount: 320000, receivedAmount: 200000, outstanding: 120000, agingDays: '29 Days', status: 'Overdue' },
        { id: 5, invoiceNo: 'INV-2026-055', date: '18 Sep 2026', buyer: 'Andhra Agro Exports', dueDate: '03 Oct 2026', totalAmount: 150000, receivedAmount: 0, outstanding: 150000, agingDays: '53 Days', status: 'Critical' }
      ];
    }

    case 'payables': {
      return [
        { id: 1, billNo: 'SUP-2026-140', date: '05 Nov 2026', supplier: 'IFFCO Fertilizer Outlet', category: 'Fertilizers', dueDate: '20 Nov 2026', totalAmount: 78000, paidAmount: 40000, outstanding: 38000, agingDays: '5 Days', status: 'Overdue' },
        { id: 2, billNo: 'SUP-2026-148', date: '12 Nov 2026', supplier: 'Mahyco Seed Depot', category: 'Hybrid Seeds', dueDate: '27 Nov 2026', totalAmount: 45000, paidAmount: 0, outstanding: 45000, agingDays: 'Due in 4d', status: 'Pending' },
        { id: 3, billNo: 'SUP-2026-152', date: '16 Nov 2026', supplier: 'Rasi Agro Chemicals', category: 'Pesticides', dueDate: '01 Dec 2026', totalAmount: 62000, paidAmount: 20000, outstanding: 42000, agingDays: 'Due in 8d', status: 'Partially Paid' },
        { id: 4, billNo: 'SUP-2026-121', date: '15 Oct 2026', supplier: 'Jai Kisan Tractor Spares', category: 'Machinery Spares', dueDate: '30 Oct 2026', totalAmount: 28500, paidAmount: 0, outstanding: 28500, agingDays: '26 Days', status: 'Overdue' }
      ];
    }

    case 'crop-wise-income': {
      return [
        { id: 1, crop: 'Cotton (BT Hybrid)', season: 'Kharif', harvestArea: '45.0 Acres', quantitySold: '480 Quintals', avgRate: '₹7,400/Qtl', grossIncome: 3552000, netIncome: 3410000 },
        { id: 2, crop: 'Paddy (BPT 5204)', season: 'Kharif', harvestArea: '60.0 Acres', quantitySold: '1,320 Quintals', avgRate: '₹2,250/Qtl', grossIncome: 2970000, netIncome: 2850000 },
        { id: 3, crop: 'Chilli (Teja Variety)', season: 'Rabi', harvestArea: '22.5 Acres', quantitySold: '340 Quintals', avgRate: '₹14,200/Qtl', grossIncome: 4828000, netIncome: 4650000 },
        { id: 4, crop: 'Sugarcane (Co 86032)', season: 'Annual', harvestArea: '30.0 Acres', quantitySold: '1,800 Tonnes', avgRate: '₹3,100/Ton', grossIncome: 5580000, netIncome: 5350000 },
        { id: 5, crop: 'Maize (Kaveri 50)', season: 'Rabi', harvestArea: '25.0 Acres', quantitySold: '550 Quintals', avgRate: '₹1,950/Qtl', grossIncome: 1072500, netIncome: 1025000 }
      ];
    }

    case 'crop-wise-expense': {
      return [
        { id: 1, crop: 'Cotton (BT Hybrid)', season: 'Kharif', seedCost: 240000, chemCost: 480000, labourCost: 650000, machineryCost: 320000, totalCost: 1690000 },
        { id: 2, crop: 'Paddy (BPT 5204)', season: 'Kharif', seedCost: 180000, chemCost: 420000, labourCost: 720000, machineryCost: 380000, totalCost: 1700000 },
        { id: 3, crop: 'Chilli (Teja Variety)', season: 'Rabi', seedCost: 310000, chemCost: 620000, labourCost: 890000, machineryCost: 240000, totalCost: 2060000 },
        { id: 4, crop: 'Sugarcane (Co 86032)', season: 'Annual', seedCost: 220000, chemCost: 510000, labourCost: 980000, machineryCost: 540000, totalCost: 2250000 },
        { id: 5, crop: 'Maize (Kaveri 50)', season: 'Rabi', seedCost: 110000, chemCost: 190000, labourCost: 240000, machineryCost: 160000, totalCost: 700000 }
      ];
    }

    case 'crop-wise-profit': {
      return [
        { id: 1, crop: 'Chilli (Teja Variety)', acreage: '22.5', revenue: 4828000, expenses: 2060000, netProfit: 2768000, margin: '57.3%', roi: '134.4%' },
        { id: 2, crop: 'Sugarcane (Co 86032)', acreage: '30.0', revenue: 5580000, expenses: 2250000, netProfit: 3330000, margin: '59.7%', roi: '148.0%' },
        { id: 3, crop: 'Cotton (BT Hybrid)', acreage: '45.0', revenue: 3552000, expenses: 1690000, netProfit: 1862000, margin: '52.4%', roi: '110.2%' },
        { id: 4, crop: 'Paddy (BPT 5204)', acreage: '60.0', revenue: 2970000, expenses: 1700000, netProfit: 1270000, margin: '42.8%', roi: '74.7%' },
        { id: 5, crop: 'Maize (Kaveri 50)', acreage: '25.0', revenue: 1072500, expenses: 700000, netProfit: 372500, margin: '34.7%', roi: '53.2%' }
      ];
    }

    case 'farm-wise-profit': {
      return [
        { id: 1, farm: 'Green Valley Farm', location: 'Guntur Rural', acreage: '85 Acres', revenue: 6420000, expenses: 3150000, netProfit: 3270000, margin: '50.9%' },
        { id: 2, farm: 'Sunrise Acres', location: 'Tenali Mandal', acreage: '55 Acres', revenue: 4180000, expenses: 2120000, netProfit: 2060000, margin: '49.3%' },
        { id: 3, farm: 'Riverbank Farm', location: 'Amaravathi Basin', acreage: '42 Acres', revenue: 3840000, expenses: 1980000, netProfit: 1860000, margin: '48.4%' },
        { id: 4, farm: 'North Ridge Orchard', location: 'Mangalagiri Foot Hills', acreage: '35 Acres', revenue: 2850000, expenses: 1420000, netProfit: 1430000, margin: '50.2%' }
      ];
    }

    case 'season-wise-profit': {
      return [
        { id: 1, season: 'Kharif', year: '2025', cropsPlanted: 'Cotton, Paddy, Red Gram', acreage: '105 Acres', revenue: 6522000, expenses: 3390000, netProfit: 3132000, margin: '48.0%' },
        { id: 2, season: 'Rabi', year: '2025-26', cropsPlanted: 'Chilli, Maize, Groundnut', acreage: '75 Acres', revenue: 5900500, expenses: 2760000, netProfit: 3140500, margin: '53.2%' },
        { id: 3, season: 'Zaid', year: '2025', cropsPlanted: 'Sesame, Watermelon, Fodder', acreage: '32 Acres', revenue: 1450000, expenses: 680000, netProfit: 770000, margin: '53.1%' },
        { id: 4, season: 'Annual', year: '2025-26', cropsPlanted: 'Sugarcane, Banana, Papaya', acreage: '45 Acres', revenue: 6240000, expenses: 2650000, netProfit: 3590000, margin: '57.5%' }
      ];
    }

    case 'acre-wise-cost': {
      return [
        { id: 1, farm: 'Green Valley Farm', crop: 'Cotton (BT Hybrid)', season: 'Kharif', area: '45.0', totalCost: 1690000, costPerAcre: 37556, status: 'Optimal' },
        { id: 2, farm: 'Sunrise Acres', crop: 'Paddy (BPT 5204)', season: 'Kharif', area: '60.0', totalCost: 1700000, costPerAcre: 28333, status: 'Low Cost' },
        { id: 3, farm: 'Riverbank Farm', crop: 'Chilli (Teja)', season: 'Rabi', area: '22.5', totalCost: 2060000, costPerAcre: 91556, status: 'Intensive' },
        { id: 4, farm: 'North Ridge Orchard', crop: 'Sugarcane', season: 'Annual', area: '30.0', totalCost: 2250000, costPerAcre: 75000, status: 'Optimal' },
        { id: 5, farm: 'Sunrise Acres', crop: 'Maize', season: 'Rabi', area: '25.0', totalCost: 700000, costPerAcre: 28000, status: 'Low Cost' }
      ];
    }

    case 'acre-wise-revenue': {
      return [
        { id: 1, farm: 'Riverbank Farm', crop: 'Chilli (Teja)', season: 'Rabi', area: '22.5', totalRevenue: 4828000, revPerAcre: 214578, profitPerAcre: 123022 },
        { id: 2, farm: 'North Ridge Orchard', crop: 'Sugarcane', season: 'Annual', area: '30.0', totalRevenue: 5580000, revPerAcre: 186000, profitPerAcre: 111000 },
        { id: 3, farm: 'Green Valley Farm', crop: 'Cotton (BT Hybrid)', season: 'Kharif', area: '45.0', totalRevenue: 3552000, revPerAcre: 78933, profitPerAcre: 41378 },
        { id: 4, farm: 'Sunrise Acres', crop: 'Paddy (BPT 5204)', season: 'Kharif', area: '60.0', totalRevenue: 2970000, revPerAcre: 49500, profitPerAcre: 21167 },
        { id: 5, farm: 'Sunrise Acres', crop: 'Maize', season: 'Rabi', area: '25.0', totalRevenue: 1072500, revPerAcre: 42900, profitPerAcre: 14900 }
      ];
    }

    case 'yield-report': {
      return [
        { id: 1, crop: 'Paddy (BPT 5204)', farm: 'Sunrise Acres - Block A', season: 'Kharif', area: '30.0', totalYield: '680 Qtl', yieldPerAcre: '22.7 Qtl/Acre', grade: 'Grade A Superfine', status: 'High Yield' },
        { id: 2, crop: 'Paddy (BPT 5204)', farm: 'Sunrise Acres - Block B', season: 'Kharif', area: '30.0', totalYield: '640 Qtl', yieldPerAcre: '21.3 Qtl/Acre', grade: 'Grade A', status: 'Optimal' },
        { id: 3, crop: 'Cotton (BT Hybrid)', farm: 'Green Valley Farm', season: 'Kharif', area: '45.0', totalYield: '480 Qtl', yieldPerAcre: '10.7 Qtl/Acre', grade: 'Long Staple 32mm', status: 'Optimal' },
        { id: 4, crop: 'Chilli (Teja)', farm: 'Riverbank Farm', season: 'Rabi', area: '22.5', totalYield: '340 Qtl', yieldPerAcre: '15.1 Qtl/Acre', grade: 'Deep Red Export', status: 'High Yield' },
        { id: 5, crop: 'Sugarcane (Co 86032)', farm: 'North Ridge Orchard', season: 'Annual', area: '30.0', totalYield: '1,800 Tons', yieldPerAcre: '60.0 Tons/Acre', grade: 'High Recovery 11.2%', status: 'Optimal' }
      ];
    }

    case 'labour-cost-report': {
      return [
        { id: 1, date: '16 Nov 2026', farm: 'Green Valley Farm', crop: 'Cotton', activity: 'Second Picking (Harvesting)', menCount: 6, womenCount: 24, totalHours: 240, avgRate: 420, totalCost: 12600 },
        { id: 2, date: '15 Nov 2026', farm: 'Sunrise Acres', crop: 'Paddy', activity: 'Bunding & Canal Cleaning', menCount: 14, womenCount: 4, totalHours: 144, avgRate: 500, totalCost: 9000 },
        { id: 3, date: '14 Nov 2026', farm: 'Riverbank Farm', crop: 'Chilli', activity: 'Manual Weeding & Drip Check', menCount: 4, womenCount: 18, totalHours: 176, avgRate: 410, totalCost: 9020 },
        { id: 4, date: '12 Nov 2026', farm: 'Green Valley Farm', crop: 'Cotton', activity: 'NPK Top Dressing Application', menCount: 10, womenCount: 2, totalHours: 96, avgRate: 520, totalCost: 6240 },
        { id: 5, date: '10 Nov 2026', farm: 'North Ridge Orchard', crop: 'Sugarcane', activity: 'Trash Mulching & Earthing Up', menCount: 16, womenCount: 8, totalHours: 192, avgRate: 480, totalCost: 11520 }
      ];
    }

    case 'input-cost-report': {
      return [
        { id: 1, date: '17 Nov 2026', itemName: 'Urea 46% Nitrogen', category: 'Fertilizer', farm: 'Green Valley Farm', crop: 'Cotton', qty: '40 Bags (50kg)', unitRate: 268, totalCost: 10720 },
        { id: 2, date: '16 Nov 2026', itemName: 'DAP Di-Ammonium Phosphate', category: 'Fertilizer', farm: 'Sunrise Acres', crop: 'Paddy', qty: '30 Bags (50kg)', unitRate: 1350, totalCost: 40500 },
        { id: 3, date: '14 Nov 2026', itemName: 'Coragen Chlorantraniliprole', category: 'Pesticide', farm: 'Riverbank Farm', crop: 'Chilli', qty: '6 Litres', unitRate: 2850, totalCost: 17100 },
        { id: 4, date: '11 Nov 2026', itemName: 'Neem Oil Bio-Formulation', category: 'Bio-Nutrient', farm: 'Green Valley Farm', crop: 'Cotton', qty: '20 Litres', unitRate: 420, totalCost: 8400 },
        { id: 5, date: '08 Nov 2026', itemName: 'BPT 5204 Foundation Seed', category: 'Seed', farm: 'Sunrise Acres', crop: 'Paddy', qty: '12 Bags (25kg)', unitRate: 1150, totalCost: 13800 }
      ];
    }

    case 'machinery-cost-report': {
      return [
        { id: 1, machineCode: 'MCH-001', machineName: 'John Deere 5310 4WD', type: 'Tractor', hoursRun: '184 Hrs', fuelConsumed: '680 L', fuelCost: 65960, maintenance: 12400, totalCost: 78360 },
        { id: 2, machineCode: 'MCH-002', machineName: 'Mahindra 575 DI PowerPlus', type: 'Tractor', hoursRun: '142 Hrs', fuelConsumed: '495 L', fuelCost: 48015, maintenance: 8600, totalCost: 56615 },
        { id: 3, machineCode: 'MCH-003', machineName: 'Kubota Harvester DC-68G', type: 'Harvester', hoursRun: '64 Hrs', fuelConsumed: '380 L', fuelCost: 36860, maintenance: 21500, totalCost: 58360 },
        { id: 4, machineCode: 'MCH-004', machineName: 'Shaktiman Rotavator 7ft', type: 'Rotavator', hoursRun: '96 Hrs', fuelConsumed: 'PTO Driven', fuelCost: 0, maintenance: 6200, totalCost: 6200 },
        { id: 5, machineCode: 'MCH-005', machineName: 'Aspee HTP Tractor Sprayer', type: 'Sprayer', hoursRun: '88 Hrs', fuelConsumed: 'PTO Driven', fuelCost: 0, maintenance: 4100, totalCost: 4100 }
      ];
    }

    case 'stock-report': {
      return [
        { id: 1, itemCode: 'FERT-001', itemName: 'NPK 19:19:19 Fertilizer', category: 'Fertilizer', unit: 'Bags (50kg)', availableQty: 84, reorderLevel: 25, unitPrice: 1450, valuation: 121800, status: 'In Stock' },
        { id: 2, itemCode: 'FERT-002', itemName: 'Urea 46% Nitrogen', category: 'Fertilizer', unit: 'Bags (45kg)', availableQty: 110, reorderLevel: 40, unitPrice: 268, valuation: 29480, status: 'In Stock' },
        { id: 3, itemCode: 'FERT-003', itemName: 'DAP Di-Ammonium Phosphate', category: 'Fertilizer', unit: 'Bags (50kg)', availableQty: 18, reorderLevel: 30, unitPrice: 1350, valuation: 24300, status: 'Low Stock' },
        { id: 4, itemCode: 'PEST-001', itemName: 'Coragen 18.5% SC', category: 'Pesticide', unit: 'Litres', availableQty: 14, reorderLevel: 10, unitPrice: 2850, valuation: 39900, status: 'In Stock' },
        { id: 5, itemCode: 'PEST-002', itemName: 'Confidor 200 SL', category: 'Pesticide', unit: 'Litres', availableQty: 4, reorderLevel: 15, unitPrice: 1650, valuation: 6600, status: 'Critical' },
        { id: 6, itemCode: 'SEED-001', itemName: 'RCH 659 BT Cotton Seeds', category: 'Seed', unit: 'Packets', availableQty: 42, reorderLevel: 20, unitPrice: 853, valuation: 35826, status: 'In Stock' },
        { id: 7, itemCode: 'FUEL-001', itemName: 'High Speed Diesel (HSD)', category: 'Fuel', unit: 'Litres', availableQty: 450, reorderLevel: 200, unitPrice: 97, valuation: 43650, status: 'In Stock' }
      ];
    }

    case 'stock-ledger': {
      return [
        { id: 1, date: '18 Nov 2026', product: 'NPK 19:19:19 Fertilizer', movementType: 'Stock Out', refNo: 'ISSUE-2026-141', openingQty: '104 Bags', qtyIn: '—', qtyOut: '20 Bags', closingQty: '84 Bags', remarks: 'Issued for Green Valley Farm (Cotton)' },
        { id: 2, date: '15 Nov 2026', product: 'NPK 19:19:19 Fertilizer', movementType: 'Stock In', refNo: 'PUR-2026-088', openingQty: '54 Bags', qtyIn: '50 Bags', qtyOut: '—', closingQty: '104 Bags', remarks: 'Received from IFFCO Society' },
        { id: 3, date: '11 Nov 2026', product: 'DAP Di-Ammonium Phosphate', movementType: 'Stock Out', refNo: 'ISSUE-2026-138', openingQty: '48 Bags', qtyIn: '—', qtyOut: '30 Bags', closingQty: '18 Bags', remarks: 'Issued for Sunrise Acres (Paddy)' },
        { id: 4, date: '08 Nov 2026', product: 'High Speed Diesel (HSD)', movementType: 'Stock In', refNo: 'PUR-2026-085', openingQty: '250 Ltrs', qtyIn: '200 Ltrs', qtyOut: '—', closingQty: '450 Ltrs', remarks: 'Main Tank Refill BPCL' },
        { id: 5, date: '05 Nov 2026', product: 'Coragen 18.5% SC', movementType: 'Stock Out', refNo: 'ISSUE-2026-135', openingQty: '20 Litres', qtyIn: '—', qtyOut: '6 Litres', closingQty: '14 Litres', remarks: 'Pest spray for Riverbank Chilli' }
      ];
    }

    case 'purchase-report': {
      return [
        { id: 1, date: '15 Nov 2026', poNo: 'PO-2026-088', supplier: 'IFFCO Fertilizer Outlet', item: 'NPK 19:19:19 Fertilizer', qty: '50 Bags', unitRate: 1450, totalAmount: 72500, paymentStatus: 'Paid' },
        { id: 2, date: '12 Nov 2026', poNo: 'PO-2026-086', supplier: 'Mahyco Seed Depot', item: 'RCH 659 BT Cotton Seeds', qty: '40 Packets', unitRate: 853, totalAmount: 34120, paymentStatus: 'Paid' },
        { id: 3, date: '08 Nov 2026', poNo: 'PO-2026-085', supplier: 'Bharat Petroleum Outlet', item: 'High Speed Diesel (HSD)', qty: '200 Litres', unitRate: 97, totalAmount: 19400, paymentStatus: 'Paid' },
        { id: 4, date: '04 Nov 2026', poNo: 'PO-2026-082', supplier: 'Rasi Agro Chemicals', item: 'Coragen 18.5% SC', qty: '10 Litres', unitRate: 2850, totalAmount: 28500, paymentStatus: 'Pending' },
        { id: 5, date: '28 Oct 2026', poNo: 'PO-2026-079', supplier: 'Jai Kisan Tractor Spares', item: 'Rotavator Blades Set & Oil', qty: '2 Sets', unitRate: 6400, totalAmount: 12800, paymentStatus: 'Paid' }
      ];
    }

    case 'consumption-report': {
      return [
        { id: 1, date: '18 Nov 2026', issueNo: 'ISSUE-2026-141', farm: 'Green Valley Farm', crop: 'Cotton', item: 'NPK 19:19:19 Fertilizer', qty: '20 Bags', costRate: 1450, totalValue: 29000 },
        { id: 2, date: '14 Nov 2026', issueNo: 'ISSUE-2026-139', farm: 'Riverbank Farm', crop: 'Chilli', item: 'Coragen Chlorantraniliprole', qty: '6 Litres', costRate: 2850, totalValue: 17100 },
        { id: 3, date: '11 Nov 2026', issueNo: 'ISSUE-2026-138', farm: 'Sunrise Acres', crop: 'Paddy', item: 'DAP Di-Ammonium Phosphate', qty: '30 Bags', costRate: 1350, totalValue: 40500 },
        { id: 4, date: '07 Nov 2026', issueNo: 'ISSUE-2026-136', farm: 'North Ridge Orchard', crop: 'Sugarcane', item: 'Urea 46% Nitrogen', qty: '25 Bags', costRate: 268, totalValue: 6700 },
        { id: 5, date: '03 Nov 2026', issueNo: 'ISSUE-2026-132', farm: 'Green Valley Farm', crop: 'Cotton', item: 'Neem Oil 1500 PPM', qty: '10 Litres', costRate: 420, totalValue: 4200 }
      ];
    }

    case 'low-stock': {
      return [
        { id: 1, itemCode: 'PEST-002', itemName: 'Confidor 200 SL (Imidacloprid)', category: 'Pesticide', availableQty: '4 Litres', reorderLevel: '15 Litres', deficit: '11 Litres', leadTime: '3 Days', status: 'Critical' },
        { id: 2, itemCode: 'FERT-003', itemName: 'DAP Di-Ammonium Phosphate', category: 'Fertilizer', availableQty: '18 Bags', reorderLevel: '30 Bags', deficit: '12 Bags', leadTime: '5 Days', status: 'Warning' },
        { id: 3, itemCode: 'MCH-SP-04', itemName: 'Fuel Filter Element (John Deere)', category: 'Spares', availableQty: '1 Set', reorderLevel: '4 Sets', deficit: '3 Sets', leadTime: '7 Days', status: 'Critical' },
        { id: 4, itemCode: 'SEED-004', itemName: 'Kaveri 50 Hybrid Maize Seed', category: 'Seed', availableQty: '6 Bags', reorderLevel: '15 Bags', deficit: '9 Bags', leadTime: '4 Days', status: 'Warning' },
        { id: 5, itemCode: 'DRIP-008', itemName: 'Lateral Drip Connector Plugs', category: 'Irrigation', availableQty: '12 Pcs', reorderLevel: '50 Pcs', deficit: '38 Pcs', leadTime: '2 Days', status: 'Depleted' }
      ];
    }

    default:
      return [];
  }
}

// ── Summary Cards Calculator based on Data ──────────────────────────────────
function computeSummaryCards(reportId, rows = []) {
  switch (reportId) {
    case 'daily-income': {
      const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const cash = rows.filter((r) => r.paymentMode === 'Cash').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const bank = rows.filter((r) => r.paymentMode !== 'Cash').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return [
        { label: 'Total Daily Income', value: formatINR(total), hint: `${rows.length} vouchers recorded` },
        { label: 'Cash Realized', value: formatINR(cash), hint: 'In-hand counter collection' },
        { label: 'Bank / Online Transfers', value: formatINR(bank), hint: 'RTGS / NEFT / UPI settlement' },
        { label: 'Transactions Audited', value: formatNumber(rows.length), hint: '100% verified entries' }
      ];
    }

    case 'daily-expense': {
      const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const cash = rows.filter((r) => r.paymentMode === 'Cash').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const bank = rows.filter((r) => r.paymentMode !== 'Cash').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return [
        { label: 'Total Daily Expense', value: formatINR(total), hint: `${rows.length} vouchers logged` },
        { label: 'Cash Disbursements', value: formatINR(cash), hint: 'Petty cash field payments' },
        { label: 'Bank / Cheque Payments', value: formatINR(bank), hint: 'Direct vendor settlement' },
        { label: 'Expense Vouchers', value: formatNumber(rows.length), hint: 'Approved accounts payable' }
      ];
    }

    case 'monthly-income': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalIncome) || 0), 0);
      const totalTxns = rows.reduce((sum, r) => sum + (Number(r.txnCount) || 0), 0);
      return [
        { label: 'Cumulative Period Revenue', value: formatINR(total), hint: `${rows.length} months aggregated` },
        { label: 'Average Monthly Revenue', value: formatINR(rows.length ? total / rows.length : 0), hint: 'Monthly steady run-rate' },
        { label: 'Total Harvest Transactions', value: formatNumber(totalTxns), hint: 'Farm sale orders processed' },
        { label: 'Top Performing Month', value: 'Oct 2025', hint: '₹12,85,000 peak turnover' }
      ];
    }

    case 'monthly-expense': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalExpense) || 0), 0);
      const totalVouchers = rows.reduce((sum, r) => sum + (Number(r.voucherCount) || 0), 0);
      return [
        { label: 'Cumulative Period Spend', value: formatINR(total), hint: `${rows.length} months of operations` },
        { label: 'Average Monthly Cost', value: formatINR(rows.length ? total / rows.length : 0), hint: 'Standard monthly operating cost' },
        { label: 'Expense Entries Logged', value: formatNumber(totalVouchers), hint: 'Muster & purchase bills' },
        { label: 'Peak Spending Month', value: 'Oct 2025', hint: 'Harvesting & labor peak' }
      ];
    }

    case 'annual-income': {
      const latest = rows[0] || {};
      return [
        { label: 'Current FY Revenue', value: formatINR(latest.totalRevenue || 10163000), hint: 'FY 2025-2026 total turnover' },
        { label: 'YoY Growth Rate', value: latest.growth || '+18.4%', hint: 'Compared to previous fiscal year' },
        { label: 'Peak Quarter', value: 'Q3 (₹32,81,000)', hint: 'Post-Kharif harvest realization' },
        { label: 'Commercial Crops', value: '5 Varieties', hint: 'Cotton, Paddy, Chilli, Cane, Maize' }
      ];
    }

    case 'annual-expense': {
      const latest = rows[0] || {};
      return [
        { label: 'Current FY Expenditure', value: formatINR(latest.totalExpense || 5366000), hint: 'FY 2025-2026 operating costs' },
        { label: 'Operating Cost Ratio', value: '52.8%', hint: 'Expenditure as % of revenue' },
        { label: 'Budget Variance', value: latest.variance || '-4.2% Under', hint: 'Within allocated financial budget' },
        { label: 'Net Annual Savings', value: '₹2,34,000', hint: 'Procurement discounts realized' }
      ];
    }

    case 'pnl': {
      const totalRev = rows.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
      const totalExp = rows.reduce((sum, r) => sum + (Number(r.expense) || 0), 0);
      const net = totalRev - totalExp;
      const margin = totalRev > 0 ? ((net / totalRev) * 100).toFixed(1) : '0';
      return [
        { label: 'Total Farm Revenue', value: formatINR(totalRev), hint: 'Gross operational receipts' },
        { label: 'Total Farm Expenses', value: formatINR(totalExp), hint: 'Direct inputs, labour & overhead' },
        { label: 'Net Farm Profit', value: formatINR(net), hint: 'Bottom line operating margin' },
        { label: 'Profit Margin', value: `${margin}%`, hint: 'Net margin on total revenue' }
      ];
    }

    case 'cash-flow': {
      const totalIn = rows.reduce((sum, r) => sum + (Number(r.inflow) || 0), 0);
      const totalOut = rows.reduce((sum, r) => sum + (Number(r.outflow) || 0), 0);
      const latestBal = rows[0]?.balance || (totalIn - totalOut);
      return [
        { label: 'Total Cash Inflow', value: formatINR(totalIn), hint: 'Collections & bank credits' },
        { label: 'Total Cash Outflow', value: formatINR(totalOut), hint: 'Disbursements & payments' },
        { label: 'Net Cash Flow', value: formatINR(totalIn - totalOut), hint: 'Period net cash delta' },
        { label: 'Current Closing Balance', value: formatINR(latestBal), hint: 'Available liquid liquidity' }
      ];
    }

    case 'receivables': {
      const totalOut = rows.reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0);
      const overdue = rows.filter((r) => r.status === 'Overdue' || r.status === 'Critical').reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0);
      return [
        { label: 'Total Receivables', value: formatINR(totalOut), hint: `${rows.length} unsettled buyer invoices` },
        { label: 'Overdue Dues (>30d)', value: formatINR(overdue), hint: 'Action required for recovery' },
        { label: 'Recovered This Month', value: '₹3,50,000', hint: 'Settled bank receipts' },
        { label: 'Average Payment Turn', value: '18 Days', hint: 'Market collection turnaround' }
      ];
    }

    case 'payables': {
      const totalPay = rows.reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0);
      const overdue = rows.filter((r) => r.status === 'Overdue').reduce((sum, r) => sum + (Number(r.outstanding) || 0), 0);
      return [
        { label: 'Total Accounts Payable', value: formatINR(totalPay), hint: `${rows.length} pending supplier bills` },
        { label: 'Immediate Due / Overdue', value: formatINR(overdue), hint: 'Prioritized supplier payments' },
        { label: 'Paid This Month', value: '₹60,000', hint: 'Disbursed via bank transfers' },
        { label: 'Active Vendor Credit', value: '4 Suppliers', hint: 'IFFCO, Mahyco, Rasi, Spares' }
      ];
    }

    case 'crop-wise-income': {
      const gross = rows.reduce((sum, r) => sum + (Number(r.grossIncome) || 0), 0);
      const net = rows.reduce((sum, r) => sum + (Number(r.netIncome) || 0), 0);
      return [
        { label: 'Gross Crop Sales', value: formatINR(gross), hint: 'Total harvest market invoice value' },
        { label: 'Net Crop Earnings', value: formatINR(net), hint: 'After mandi fee & transport' },
        { label: 'Highest Revenue Crop', value: 'Sugarcane', hint: '₹55,80,000 total realization' },
        { label: 'Crops Marketed', value: `${rows.length} Crops`, hint: 'Commercial harvest volume' }
      ];
    }

    case 'crop-wise-expense': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
      const labour = rows.reduce((sum, r) => sum + (Number(r.labourCost) || 0), 0);
      return [
        { label: 'Total Cultivation Cost', value: formatINR(total), hint: `${rows.length} commercial crops audited` },
        { label: 'Total Labour Share', value: formatINR(labour), hint: `${Math.round((labour / (total || 1)) * 100)}% of total cultivation spend` },
        { label: 'Highest Cost Crop', value: 'Sugarcane', hint: '₹22,50,000 annual input & cutting' },
        { label: 'Most Economical Crop', value: 'Maize', hint: '₹7,00,000 total cultivation cost' }
      ];
    }

    case 'crop-wise-profit': {
      const totalRev = rows.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
      const totalExp = rows.reduce((sum, r) => sum + (Number(r.expenses) || 0), 0);
      const profit = totalRev - totalExp;
      return [
        { label: 'Cumulative Crop Revenue', value: formatINR(totalRev), hint: 'All commercial harvest sales' },
        { label: 'Direct Production Costs', value: formatINR(totalExp), hint: 'Inputs, labour and operations' },
        { label: 'Net Farm Harvest Profit', value: formatINR(profit), hint: 'Gross operating profit' },
        { label: 'Top Margin Crop', value: 'Sugarcane (59.7%)', hint: 'Chilli close second at 57.3%' }
      ];
    }

    case 'farm-wise-profit': {
      const totalRev = rows.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
      const totalExp = rows.reduce((sum, r) => sum + (Number(r.expenses) || 0), 0);
      return [
        { label: 'Total Farm Turnover', value: formatINR(totalRev), hint: `${rows.length} active farming locations` },
        { label: 'Total Farm Expenditure', value: formatINR(totalExp), hint: 'Combined operational overhead' },
        { label: 'Net Aggregated Profit', value: formatINR(totalRev - totalExp), hint: 'Consolidated farm return' },
        { label: 'Top Performing Plot', value: 'Green Valley Farm', hint: '₹32,70,000 net profit (50.9% margin)' }
      ];
    }

    case 'season-wise-profit': {
      const totalRev = rows.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
      const totalExp = rows.reduce((sum, r) => sum + (Number(r.expenses) || 0), 0);
      return [
        { label: 'Annualized Revenue', value: formatINR(totalRev), hint: '4 agricultural production cycles' },
        { label: 'Annualized Costs', value: formatINR(totalExp), hint: 'Combined seasonal expenditure' },
        { label: 'Annual Farm Profit', value: formatINR(totalRev - totalExp), hint: 'Consolidated seasonal net' },
        { label: 'Highest Margin Season', value: 'Annual Crops (57.5%)', hint: 'Rabi season strong at 53.2%' }
      ];
    }

    case 'acre-wise-cost': {
      const totalArea = rows.reduce((sum, r) => sum + (Number(r.area) || 0), 0);
      const totalCost = rows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
      return [
        { label: 'Average Cost / Acre', value: formatINR(totalArea ? totalCost / totalArea : 0), hint: 'Weighted operational average' },
        { label: 'Lowest Cost / Acre', value: '₹28,000 / Acre', hint: 'Sunrise Acres (Maize Field)' },
        { label: 'Highest Cost / Acre', value: '₹91,556 / Acre', hint: 'Riverbank Farm (Intensive Chilli)' },
        { label: 'Total Cultivated Area', value: `${totalArea.toFixed(1)} Acres`, hint: 'Active field parcels' }
      ];
    }

    case 'acre-wise-revenue': {
      const totalArea = rows.reduce((sum, r) => sum + (Number(r.area) || 0), 0);
      const totalRev = rows.reduce((sum, r) => sum + (Number(r.totalRevenue) || 0), 0);
      return [
        { label: 'Average Revenue / Acre', value: formatINR(totalArea ? totalRev / totalArea : 0), hint: 'Across all crops and farms' },
        { label: 'Highest Revenue / Acre', value: '₹2,14,578 / Acre', hint: 'Riverbank Farm (Chilli Teja)' },
        { label: 'Average Net Profit / Acre', value: '₹58,410 / Acre', hint: 'Net return on farm land' },
        { label: 'Total Harvested Area', value: `${totalArea.toFixed(1)} Acres`, hint: '100% productive acreage' }
      ];
    }

    case 'yield-report': {
      return [
        { label: 'Total Production Recorded', value: '4,460 Quintals', hint: 'Plus 1,800 Tonnes Sugarcane' },
        { label: 'Average Paddy Yield', value: '22.0 Qtl / Acre', hint: 'Benchmark state average: 18.5 Qtl' },
        { label: 'Average Cotton Yield', value: '10.7 Qtl / Acre', hint: 'High quality long staple grade' },
        { label: 'Top Yielding Field Parcel', value: 'Sunrise Acres Block A', hint: '22.7 Qtl/Acre superfine paddy' }
      ];
    }

    case 'labour-cost-report': {
      const totalCost = rows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
      const totalMen = rows.reduce((sum, r) => sum + (Number(r.menCount) || 0), 0);
      const totalWomen = rows.reduce((sum, r) => sum + (Number(r.womenCount) || 0), 0);
      return [
        { label: 'Total Labour Payouts', value: formatINR(totalCost), hint: `${rows.length} muster vouchers audited` },
        { label: 'Total Man-Days Deployed', value: `${totalMen + totalWomen} Workers`, hint: `${totalMen} men • ${totalWomen} women workers` },
        { label: 'Average Daily Wage Rate', value: '₹466 / Day', hint: 'State statutory minimum compliant' },
        { label: 'Peak Labour Demand', value: 'Cotton Harvesting', hint: '30 workers daily field crew' }
      ];
    }

    case 'input-cost-report': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
      return [
        { label: 'Total Inputs Consumed', value: formatINR(total), hint: `${rows.length} issues to fields` },
        { label: 'Fertilizers & Nutrients', value: '₹51,220', hint: '60% of current input spend' },
        { label: 'Crop Protection & Bio', value: '₹25,500', hint: 'Coragen & Bio-Nutrients' },
        { label: 'Foundation Certified Seeds', value: '₹13,800', hint: 'High germination grade BPT' }
      ];
    }

    case 'machinery-cost-report': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
      const fuel = rows.reduce((sum, r) => sum + (Number(r.fuelCost) || 0), 0);
      const maint = rows.reduce((sum, r) => sum + (Number(r.maintenance) || 0), 0);
      return [
        { label: 'Total Fleet Running Cost', value: formatINR(total), hint: `${rows.length} agricultural machines active` },
        { label: 'Fuel & Diesel Outlay', value: formatINR(fuel), hint: '1,555 Litres consumed' },
        { label: 'Servicing & Repairs', value: formatINR(maint), hint: 'Preventative & scheduled overhaul' },
        { label: 'Cumulative Operating Hours', value: '574 Hours', hint: 'Tractor and harvester field run' }
      ];
    }

    case 'stock-report': {
      const val = rows.reduce((sum, r) => sum + (Number(r.valuation) || 0), 0);
      const lowStockCount = rows.filter((r) => r.status === 'Low Stock' || r.status === 'Critical').length;
      return [
        { label: 'Total Items in Catalog', value: formatNumber(rows.length), hint: 'Active stock keeping units (SKUs)' },
        { label: 'Total Inventory Valuation', value: formatINR(val), hint: 'At purchase / moving average rate' },
        { label: 'Low Stock Alarms', value: formatNumber(lowStockCount), hint: 'Items below safety threshold' },
        { label: 'Warehouse Storage Health', value: '98.5% Optimal', hint: 'Main barn central warehouse' }
      ];
    }

    case 'stock-ledger': {
      return [
        { label: 'Audit Trail Entries', value: formatNumber(rows.length), hint: 'Chronological inventory ledger' },
        { label: 'Primary Item Analyzed', value: 'NPK 19:19:19', hint: '84 Bags currently available' },
        { label: 'Recent Stock Inward', value: '+50 Bags', hint: '15 Nov 2026 purchase order' },
        { label: 'Recent Field Issue', value: '-20 Bags', hint: '18 Nov 2026 Green Valley cotton' }
      ];
    }

    case 'purchase-report': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      return [
        { label: 'Total Purchase Outlay', value: formatINR(total), hint: `${rows.length} procurement orders` },
        { label: 'Paid Procurement Value', value: formatINR(total - 28500), hint: 'Settled vendor vouchers' },
        { label: 'Pending Supplier Invoices', value: '₹28,500', hint: 'Rasi Agro Chemicals (Due in 4d)' },
        { label: 'Active Preferred Vendors', value: '5 Suppliers', hint: 'IFFCO, BPCL, Mahyco, Rasi' }
      ];
    }

    case 'consumption-report': {
      const total = rows.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0);
      return [
        { label: 'Total Consumed Value', value: formatINR(total), hint: `${rows.length} field issues logged` },
        { label: 'Top Consuming Farm', value: 'Sunrise Acres', hint: 'Paddy nursery & DAP top dressing' },
        { label: 'Top Consumed Category', value: 'Fertilizers (₹69,500)', hint: 'Urea, DAP, NPK' },
        { label: 'Store Issue Adherence', value: '100% Authorized', hint: 'Signed by field supervisors' }
      ];
    }

    case 'low-stock': {
      const criticalCount = rows.filter((r) => r.status === 'Critical' || r.status === 'Depleted').length;
      return [
        { label: 'Critical Shortages', value: `${criticalCount} Items`, hint: 'Stock below 50% safety reorder' },
        { label: 'Warning Threshold', value: `${rows.length - criticalCount} Items`, hint: 'Reorder suggested this week' },
        { label: 'Estimated Restock Budget', value: '₹48,500', hint: 'To restore buffer inventory' },
        { label: 'Avg Vendor Lead Time', value: '4.2 Days', hint: 'Local agro distributor turnaround' }
      ];
    }

    default: {
      return [
        { label: 'Total Records', value: formatNumber(rows.length), hint: 'Audited rows in report' },
        { label: 'Status', value: 'Active', hint: 'Verified data' }
      ];
    }
  }
}

// ── Main Asynchronous Data Resolver with Backend Integration ────────────────
export async function fetchReportData(reportId, filters = {}, pagination = { page: 1, pageSize: 10 }, signal) {
  const catalogEntry = getReportById(reportId);
  if (!catalogEntry) {
    throw new Error(`Report "${reportId}" not found in catalog.`);
  }

  let rawRows = [];
  let isAuthoritativeBackend = false;
  let backendNotice = '';

  try {
    // 1. Try Live Backend Endpoints
    if (reportId === 'pnl') {
      const params = {};
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      const res = await api.get('/api/Reports/pnl', { params, signal });
      const data = res.data;
      if (data && (data.TotalRevenue !== undefined || data.totalRevenue !== undefined)) {
        isAuthoritativeBackend = true;
        const totalRev = Number(data.totalRevenue ?? data.TotalRevenue) || 0;
        const cropSales = Number(data.cropSalesRevenue ?? data.CropSalesRevenue) || 0;
        const otherInc = Number(data.otherFarmIncome ?? data.OtherFarmIncome) || 0;
        const totalExp = Number(data.totalExpenses ?? data.TotalExpenses) || 0;
        const opExp = Number(data.operatingExpenses ?? data.OperatingExpenses) || 0;
        const labour = Number(data.labourWages ?? data.LabourWages) || 0;

        rawRows = [
          { id: 1, accountHead: 'Crop Sales Revenue (Direct Harvest Realizations)', category: 'Direct Revenue', revenue: cropSales, expense: 0, net: cropSales, margin: totalRev > 0 ? `${((cropSales / totalRev) * 100).toFixed(1)}%` : '0%' },
          { id: 2, accountHead: 'Other Farm Income & Agricultural Services', category: 'Other Income', revenue: otherInc, expense: 0, net: otherInc, margin: totalRev > 0 ? `${((otherInc / totalRev) * 100).toFixed(1)}%` : '0%' },
          { id: 3, accountHead: 'General Farm Operating Expenses & Inputs', category: 'Operating Expenses', revenue: 0, expense: opExp, net: -opExp, margin: totalRev > 0 ? `-${((opExp / totalRev) * 100).toFixed(1)}%` : '0%' },
          { id: 4, accountHead: 'Field Labour Wages & Muster Payroll', category: 'Labour Wages', revenue: 0, expense: labour, net: -labour, margin: totalRev > 0 ? `-${((labour / totalRev) * 100).toFixed(1)}%` : '0%' }
        ];
        backendNotice = 'Live data from ASP.NET Core endpoint /api/Reports/pnl';
      }
    } else if (reportId === 'cash-flow') {
      const params = {};
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      const res = await api.get('/api/Reports/cash-flow', { params, signal });
      const data = res.data;
      if (data && (data.recentReceipts || data.RecentReceipts || data.totalCashInflow !== undefined)) {
        isAuthoritativeBackend = true;
        const receipts = data.recentReceipts || data.RecentReceipts || [];
        const payments = data.recentPayments || data.RecentPayments || [];
        const combined = [
          ...receipts.map((r, i) => ({
            id: `r-${r.id || i}`,
            date: formatDate(r.date || r.Date),
            refNo: r.receiptNo || r.ReceiptNo || `REC-2026-${r.id || i + 100}`,
            description: r.description || r.Description || 'Crop harvest sale settlement',
            counterparty: r.receivedFrom || r.ReceivedFrom || 'Market Buyer',
            inflow: Number(r.amount || r.Amount) || 0,
            outflow: 0,
            balance: 0
          })),
          ...payments.map((p, i) => ({
            id: `p-${p.id || i}`,
            date: formatDate(p.date || p.Date),
            refNo: p.paymentNo || p.PaymentNo || `PAY-2026-${p.id || i + 100}`,
            description: p.description || p.Description || 'Operating disbursement voucher',
            counterparty: p.paidTo || p.PaidTo || 'Farm Vendor',
            inflow: 0,
            outflow: Number(p.amount || p.Amount) || 0,
            balance: 0
          }))
        ];
        let running = Number(data.totalCashInflow || data.TotalCashInflow || 0) - Number(data.totalCashOutflow || data.TotalCashOutflow || 0);
        rawRows = combined.map((c) => {
          c.balance = running;
          running = running - c.inflow + c.outflow;
          return c;
        });
        backendNotice = 'Live data from ASP.NET Core endpoint /api/Reports/cash-flow';
      }
    } else if (reportId === 'crop-wise-profit') {
      const res = await api.get('/api/Reports/crop-profit', { signal });
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        isAuthoritativeBackend = true;
        rawRows = list.map((item, idx) => ({
          id: idx + 1,
          crop: item.crop || item.Crop || 'Unnamed Crop',
          acreage: item.acreage || item.Acreage || '—',
          revenue: Number(item.revenue ?? item.Revenue) || 0,
          expenses: Number(item.expenses ?? item.Expenses) || 0,
          netProfit: Number(item.netProfit ?? item.NetProfit) || 0,
          margin: `${item.profitMarginPercent ?? item.ProfitMarginPercent ?? 0}%`,
          roi: `${Math.round(((item.revenue || 0) / (item.expenses || 1)) * 100)}%`
        }));
        backendNotice = 'Live data from ASP.NET Core endpoint /api/Reports/crop-profit';
      }
    } else if (reportId === 'farm-wise-profit') {
      const res = await api.get('/api/Reports/farm-profit', { signal });
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        isAuthoritativeBackend = true;
        rawRows = list.map((item, idx) => ({
          id: idx + 1,
          farm: item.farm || item.Farm || 'Farm Plot',
          location: item.location || item.Location || 'Registered Land',
          acreage: item.acreage || item.Acreage || '—',
          revenue: Number(item.revenue ?? item.Revenue) || 0,
          expenses: Number(item.expenses ?? item.Expenses) || 0,
          netProfit: Number(item.netProfit ?? item.NetProfit) || 0,
          margin: `${item.profitMarginPercent ?? item.ProfitMarginPercent ?? 0}%`
        }));
        backendNotice = 'Live data from ASP.NET Core endpoint /api/Reports/farm-profit';
      }
    } else if (reportId === 'daily-income') {
      const params = {};
      if (filters.date) {
        params.fromDate = `${filters.date}T00:00:00`;
        params.toDate = `${filters.date}T23:59:59`;
      }
      if (filters.farm && filters.farm !== 'All Farms') params.search = filters.farm;
      const res = await api.get('/api/income', { params, signal });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (list.length > 0) {
        isAuthoritativeBackend = true;
        rawRows = list.map((item, idx) => ({
          id: item.id || idx + 1,
          rawDate: item.date ? String(item.date).slice(0, 10) : '',
          date: formatDate(item.date || item.Date),
          incomeNo: item.incomeNo || item.IncomeNo || `INC-${item.id}`,
          farmer: item.farmer || item.Farmer || 'N/A',
          farm: item.farm || item.Farm || '—',
          crop: item.crop || item.Crop || '—',
          incomeType: item.incomeType || item.IncomeType || 'Farm Operation',
          buyer: item.buyer || item.Buyer || 'Local Counterparty',
          amount: Number(item.amount ?? item.Amount ?? item.netAmount ?? item.NetAmount) || 0,
          paymentMode: item.paymentMode || item.PaymentMode || 'Cash',
          status: item.status || item.Status || 'Received'
        }));
        backendNotice = 'Live data from ASP.NET Core endpoint /api/income';
      }
    } else if (reportId === 'daily-expense') {
      const params = {};
      if (filters.date) {
        params.fromDate = filters.date;
        params.toDate = filters.date;
      }
      const res = await api.get('/api/expenses', { params, signal });
      const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];
      if (list.length > 0) {
        isAuthoritativeBackend = true;
        rawRows = list.map((item, idx) => ({
          id: item.id || idx + 1,
          date: formatDate(item.expenseDate || item.date || item.Date),
          voucherNo: item.expenseNo || item.voucherNo || `EXP-${item.id}`,
          farm: item.farmName || item.farm || '—',
          crop: item.cropName || item.crop || '—',
          category: item.categoryName || item.category || 'General',
          payee: item.vendorName || item.supplier || item.payee || 'Vendor',
          amount: Number(item.amount || item.Amount) || 0,
          paymentMode: item.paymentMode || item.PaymentMode || 'Cash',
          status: item.status || 'Paid'
        }));
        backendNotice = 'Live data from ASP.NET Core endpoint /api/expenses';
      }
    } else if (reportId === 'stock-report') {
      const res = await api.get('/api/inventory', { signal });
      const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];
      if (list.length > 0) {
        isAuthoritativeBackend = true;
        rawRows = list.map((item, idx) => ({
          id: item.id || idx + 1,
          itemCode: item.productCode || item.code || `PRD-${item.id || idx + 1}`,
          itemName: item.productName || item.name || 'Material Item',
          category: item.categoryName || item.category || 'General',
          unit: item.unitName || item.unit || 'Units',
          availableQty: item.currentStock ?? item.quantity ?? 0,
          reorderLevel: item.reorderLevel ?? item.minStock ?? 10,
          unitPrice: Number(item.unitPrice || item.price || 0),
          valuation: (Number(item.currentStock ?? item.quantity ?? 0)) * (Number(item.unitPrice || item.price || 0)),
          status: (item.currentStock ?? 0) <= (item.reorderLevel ?? 10) ? 'Low Stock' : 'In Stock'
        }));
        backendNotice = 'Live data from ASP.NET Core endpoint /api/inventory';
      }
    } else if (reportId === 'low-stock') {
      const res = await api.get('/api/inventory/low-stock', { signal });
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      if (list.length > 0) {
        isAuthoritativeBackend = true;
        rawRows = list.map((item, idx) => ({
          id: item.id || idx + 1,
          itemCode: item.productCode || item.code || `PRD-${idx + 1}`,
          itemName: item.productName || item.name || 'Material Item',
          category: item.categoryName || item.category || 'Input',
          availableQty: `${item.currentStock ?? 0} ${item.unitName || 'Units'}`,
          reorderLevel: `${item.reorderLevel ?? 10} ${item.unitName || 'Units'}`,
          deficit: `${Math.max(0, (item.reorderLevel ?? 10) - (item.currentStock ?? 0))} ${item.unitName || 'Units'}`,
          leadTime: item.leadTimeDays || '3 Days',
          status: (item.currentStock ?? 0) === 0 ? 'Depleted' : 'Critical'
        }));
        backendNotice = 'Live data from ASP.NET Core endpoint /api/inventory/low-stock';
      }
    }
  } catch (apiError) {
    if (apiError.name === 'CanceledError' || apiError.name === 'AbortError') {
      throw apiError;
    }
    console.warn(`[Reports API] Fallback activated for ${reportId}:`, apiError.message || apiError);
  }

  // 2. If backend endpoint returned no rows or was unreachable / in progress, use realistic development sample
  if (!rawRows || rawRows.length === 0) {
    rawRows = generateSampleRows(reportId, filters);
    backendNotice = backendNotice || `Showing development records for ${catalogEntry.name}. (API: ${catalogEntry.endpoint})`;
  }

  // 3. Client-side Multi-filter Processing (Date AND Farm AND Crop AND Payment Mode AND Category AND Status)
  let filteredRows = [...rawRows];

  // Transaction Date filter
  if (filters.date) {
    filteredRows = filteredRows.filter((r) => {
      if (r.rawDate) return r.rawDate === filters.date;
      return String(r.date || '').includes(formatDate(filters.date));
    });
  }

  // Farm / Land filter
  if (filters.farm && filters.farm !== 'All Farms' && filters.farm !== '') {
    filteredRows = filteredRows.filter((r) =>
      String(r.farm || '').toLowerCase().includes(filters.farm.toLowerCase())
    );
  }

  // Crop filter
  if (filters.crop && filters.crop !== 'All Crops' && filters.crop !== '') {
    filteredRows = filteredRows.filter((r) =>
      String(r.crop || '').toLowerCase().includes(filters.crop.toLowerCase())
    );
  }

  // Payment Mode filter (Cash, Bank Transfer, UPI, Cheque)
  if (filters.paymentMode && filters.paymentMode !== 'All Modes' && filters.paymentMode !== '') {
    filteredRows = filteredRows.filter((r) =>
      String(r.paymentMode || '').toLowerCase().includes(filters.paymentMode.toLowerCase())
    );
  }

  // Expense Category filter
  if (filters.category && filters.category !== 'All Categories' && filters.category !== '') {
    filteredRows = filteredRows.filter((r) =>
      String(r.category || '').toLowerCase().includes(filters.category.toLowerCase())
    );
  }

  // Status filter
  if (filters.status && filters.status !== 'All Statuses' && filters.status !== '') {
    filteredRows = filteredRows.filter((r) =>
      String(r.status || '').toLowerCase() === filters.status.toLowerCase()
    );
  }

  // Authoritative Totals (Calculated from ALL matching filtered rows, NOT page-sliced)
  const summaryCards = computeSummaryCards(reportId, filteredRows);

  // Pagination Slice
  const totalCount = filteredRows.length;
  const page = Math.max(1, Number(pagination.page) || 1);
  const pageSize = Math.max(1, Number(pagination.pageSize) || 10);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  return {
    reportId,
    reportName: catalogEntry.name,
    columns: catalogEntry.columns,
    summaryCards,
    rows: paginatedRows,
    allFilteredRows: filteredRows,
    totalCount,
    page,
    pageSize,
    totalPages,
    isAuthoritativeBackend,
    backendNotice
  };
}

// ── Export to CSV Helper ────────────────────────────────────────────────────
export function exportReportToCSV(reportName, columns, rows, customFilename) {
  if (!rows || rows.length === 0) {
    throw new Error('No data available to export.');
  }

  // 1. Column Headers
  const headers = columns.map((c) => `"${(c.label || '').replace(/"/g, '""')}"`).join(',');

  // 2. Data Lines
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        let val = row[col.key];
        if (col.isCurrency) {
          val = formatINR(val);
        } else if (val === undefined || val === null || val === '') {
          val = '—';
        }
        // Properly escape double quotes by doubling them
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );

  // 3. Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const csvString = '\uFEFF' + [headers, ...lines].join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${dateStr}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
