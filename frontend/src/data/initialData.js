// Comprehensive Initial Data for AGRIMAN Farm Financial Management System
// Structured according to PDF specifications (Modules 1 - 22)

export const initialFarmers = [
  {
    id: 'FARMER-001',
    code: 'FMR-101',
    name: 'Shyam Reddy',
    fatherName: 'Venkat Reddy',
    mobile: '+91 98480 12345',
    altMobile: '+91 98480 54321',
    email: 'shyam.reddy@agriman.in',
    aadhaar: '4589 1234 5678',
    address: 'Plot 45, Rythu Bazar Road',
    village: 'Narsapur',
    mandal: 'Siddipet',
    district: 'Siddipet',
    state: 'Telangana',
    pinCode: '502103',
    bankName: 'State Bank of India',
    accountNumber: '30489214782',
    ifsc: 'SBIN0020145',
    totalLand: '35 Acres',
    status: 'Active'
  },
  {
    id: 'FARMER-002',
    code: 'FMR-102',
    name: 'Rajesh Patel',
    fatherName: 'Govind Patel',
    mobile: '+91 98250 87654',
    altMobile: '+91 98250 11223',
    email: 'rajesh.patel@agriman.in',
    aadhaar: '8912 3456 7890',
    address: 'Near Canal Chowk',
    village: 'Anandpur',
    mandal: 'Bodhan',
    district: 'Nizamabad',
    state: 'Telangana',
    pinCode: '503185',
    bankName: 'Andhra Bank / Union Bank',
    accountNumber: '11209348571',
    ifsc: 'UBIN0541234',
    totalLand: '17 Acres',
    status: 'Active'
  }
];

export const initialFarms = [
  {
    id: 'FARM-001',
    farmerId: 'FARMER-001',
    farmerName: 'Shyam Reddy',
    farmName: 'Farm 1 (South Block)',
    surveyNumber: '123/A',
    landArea: 20,
    areaUnit: 'Acres',
    landType: 'Wetland (Irrigated)',
    ownershipType: 'Owned',
    village: 'Narsapur',
    mandal: 'Siddipet',
    district: 'Siddipet',
    irrigationType: 'Borewell & Drip',
    soilType: 'Black Cotton Soil',
    status: 'Active'
  },
  {
    id: 'FARM-002',
    farmerId: 'FARMER-001',
    farmerName: 'Shyam Reddy',
    farmName: 'Farm 2 (Canal Belt)',
    surveyNumber: '125/B',
    landArea: 15,
    areaUnit: 'Acres',
    landType: 'Dryland with Canal access',
    ownershipType: 'Owned',
    village: 'Narsapur',
    mandal: 'Siddipet',
    district: 'Siddipet',
    irrigationType: 'Canal & Sprinkler',
    soilType: 'Red Loamy Soil',
    status: 'Active'
  },
  {
    id: 'FARM-003',
    farmerId: 'FARMER-002',
    farmerName: 'Rajesh Patel',
    farmName: 'Sunrise Farms (East Block)',
    surveyNumber: '88/2C',
    landArea: 12,
    areaUnit: 'Acres',
    landType: 'Garden Land',
    ownershipType: 'Leased',
    village: 'Anandpur',
    mandal: 'Bodhan',
    district: 'Nizamabad',
    irrigationType: 'Borewell & Drip',
    soilType: 'Alluvial Soil',
    status: 'Active'
  },
  {
    id: 'FARM-004',
    farmerId: 'FARMER-002',
    farmerName: 'Rajesh Patel',
    farmName: 'Krishna Delta Parcel',
    surveyNumber: '42/1',
    landArea: 5,
    areaUnit: 'Acres',
    landType: 'Wetland',
    ownershipType: 'Owned',
    village: 'Anandpur',
    mandal: 'Bodhan',
    district: 'Nizamabad',
    irrigationType: 'River Lift Irrigation',
    soilType: 'Clay Loam',
    status: 'Active'
  }
];

export const initialCrops = [
  { id: 'CROP-001', name: 'Cotton', type: 'Commercial', category: 'Fibre Crop', defaultUnit: 'Quintal', status: 'Active', varieties: ['BT Cotton-2', 'Brahma Gold'] },
  { id: 'CROP-002', name: 'Paddy', type: 'Food Grain', category: 'Cereal', defaultUnit: 'Bags (75kg)', status: 'Active', varieties: ['BPT 5204 (Samba)', 'MTU 1010'] },
  { id: 'CROP-003', name: 'Chilli', type: 'Cash Crop', category: 'Spices', defaultUnit: 'Quintal', status: 'Active', varieties: ['Guntur Sannam', 'Teja Red'] },
  { id: 'CROP-004', name: 'Groundnut', type: 'Oilseed', category: 'Legume', defaultUnit: 'Bags (40kg)', status: 'Active', varieties: ['KADIRI-6', 'TAG-24'] },
  { id: 'CROP-005', name: 'Maize', type: 'Food Grain', category: 'Cereal', defaultUnit: 'Quintal', status: 'Active', varieties: ['Pioneer 3396', 'NK 6240'] },
  { id: 'CROP-006', name: 'Tomato', type: 'Horticulture', category: 'Vegetable', defaultUnit: 'Boxes (25kg)', status: 'Active', varieties: ['Arka Rakshak', 'US 440'] },
  { id: 'CROP-007', name: 'Sugarcane', type: 'Commercial', category: 'Sugar Crop', defaultUnit: 'Tonnes', status: 'Active', varieties: ['Co 86032', 'Co 0238'] }
];

export const initialCropSeasons = [
  {
    id: 'CS-2025-01',
    farmId: 'FARM-001',
    farmName: 'Farm 1 (South Block)',
    cropId: 'CROP-001',
    cropName: 'Cotton',
    variety: 'BT Cotton-2',
    season: 'Kharif 2025-26',
    sowingDate: '2025-06-15',
    expectedHarvestDate: '2025-11-20',
    actualHarvestDate: '2025-11-18',
    area: 10,
    areaUnit: 'Acres',
    expectedYield: '120 Quintals',
    actualYield: '118 Quintals',
    expectedRevenue: 850000,
    totalExpenses: 256000,
    netProfit: 594000,
    status: 'Harvested / Completed'
  },
  {
    id: 'CS-2025-02',
    farmId: 'FARM-002',
    farmName: 'Farm 2 (Canal Belt)',
    cropId: 'CROP-002',
    cropName: 'Paddy',
    variety: 'BPT 5204 (Samba)',
    season: 'Kharif 2025-26',
    sowingDate: '2025-07-02',
    expectedHarvestDate: '2025-11-28',
    actualHarvestDate: null,
    area: 12,
    areaUnit: 'Acres',
    expectedYield: '360 Bags',
    actualYield: null,
    expectedRevenue: 220000,
    totalExpenses: 140000,
    netProfit: 80000,
    status: 'In Progress (Grain Filling)'
  },
  {
    id: 'CS-2025-03',
    farmId: 'FARM-003',
    farmName: 'Sunrise Farms (East Block)',
    cropId: 'CROP-003',
    cropName: 'Chilli',
    variety: 'Teja Red',
    season: 'Annual 2025',
    sowingDate: '2025-08-10',
    expectedHarvestDate: '2026-01-15',
    actualHarvestDate: null,
    area: 8,
    areaUnit: 'Acres',
    expectedYield: '90 Quintals',
    actualYield: null,
    expectedRevenue: 180000,
    totalExpenses: 110000,
    netProfit: 70000,
    status: 'In Progress (Flowering)'
  },
  {
    id: 'CS-2025-04',
    farmId: 'FARM-002',
    farmName: 'Farm 2 (Canal Belt)',
    cropId: 'CROP-005',
    cropName: 'Maize',
    variety: 'Pioneer 3396',
    season: 'Kharif 2025',
    sowingDate: '2025-06-25',
    expectedHarvestDate: '2025-10-15',
    actualHarvestDate: '2025-10-14',
    area: 3,
    areaUnit: 'Acres',
    expectedYield: '65 Quintals',
    actualYield: '62 Quintals',
    expectedRevenue: 90000,
    totalExpenses: 55000,
    netProfit: 35000,
    status: 'Harvested / Completed'
  },
  {
    id: 'CS-2025-05',
    farmId: 'FARM-004',
    farmName: 'Krishna Delta Parcel',
    cropId: 'CROP-006',
    cropName: 'Tomato',
    variety: 'US 440',
    season: 'Rabi 2025',
    sowingDate: '2025-09-05',
    expectedHarvestDate: '2025-12-10',
    actualHarvestDate: null,
    area: 5,
    areaUnit: 'Acres',
    expectedYield: '1200 Boxes',
    actualYield: null,
    expectedRevenue: 140000,
    totalExpenses: 95000,
    netProfit: 45000,
    status: 'In Progress (Fruit Setting)'
  },
  {
    id: 'CS-2025-06',
    farmId: 'FARM-001',
    farmName: 'Farm 1 (South Block)',
    cropId: 'CROP-004',
    cropName: 'Groundnut',
    variety: 'TAG-24',
    season: 'Rabi 2025',
    sowingDate: '2025-09-20',
    expectedHarvestDate: '2026-01-05',
    actualHarvestDate: null,
    area: 6,
    areaUnit: 'Acres',
    expectedYield: '140 Bags',
    actualYield: null,
    expectedRevenue: 110000,
    totalExpenses: 65000,
    netProfit: 45000,
    status: 'In Progress (Vegetative)'
  },
  {
    id: 'CS-2025-07',
    farmId: 'FARM-004',
    farmName: 'Krishna Delta Parcel',
    cropId: 'CROP-007',
    cropName: 'Sugarcane',
    variety: 'Co 86032',
    season: 'Annual 2025-26',
    sowingDate: '2025-03-12',
    expectedHarvestDate: '2026-02-15',
    actualHarvestDate: null,
    area: 5,
    areaUnit: 'Acres',
    expectedYield: '250 Tonnes',
    actualYield: null,
    expectedRevenue: 310000,
    totalExpenses: 110000,
    netProfit: 200000,
    status: 'In Progress (Tillering)'
  }
];

// Exact breakdown for Crop-wise Profit matching PDF Section 18
export const initialCropProfitSummary = [
  {
    crop: 'Cotton',
    acres: 10,
    income: 850000,
    expense: 256000,
    netProfit: 594000,
    costPerAcre: 25600,
    incomePerAcre: 85000,
    profitPerAcre: 59400,
    roi: 232.0,
    breakdown: {
      seeds: 25000,
      fertilizer: 45000,
      pesticides: 38000,
      labour: 85000,
      diesel: 25000,
      machinery: 20000,
      transport: 18000
    }
  },
  {
    crop: 'Paddy',
    acres: 12,
    income: 220000,
    expense: 140000,
    netProfit: 80000,
    costPerAcre: 11666,
    incomePerAcre: 18333,
    profitPerAcre: 6667,
    roi: 57.1,
    breakdown: {
      seeds: 14000,
      fertilizer: 32000,
      pesticides: 18000,
      labour: 42000,
      diesel: 12000,
      machinery: 14000,
      transport: 8000
    }
  },
  {
    crop: 'Chilli',
    acres: 8,
    income: 180000,
    expense: 110000,
    netProfit: 70000,
    costPerAcre: 13750,
    incomePerAcre: 22500,
    profitPerAcre: 8750,
    roi: 63.6,
    breakdown: {
      seeds: 18000,
      fertilizer: 24000,
      pesticides: 22000,
      labour: 30000,
      diesel: 6000,
      machinery: 5000,
      transport: 5000
    }
  },
  {
    crop: 'Groundnut',
    acres: 6,
    income: 110000,
    expense: 65000,
    netProfit: 45000,
    costPerAcre: 10833,
    incomePerAcre: 18333,
    profitPerAcre: 7500,
    roi: 69.2,
    breakdown: {
      seeds: 12000,
      fertilizer: 15000,
      pesticides: 8000,
      labour: 18000,
      diesel: 4000,
      machinery: 4000,
      transport: 4000
    }
  },
  {
    crop: 'Maize',
    acres: 3,
    income: 90000,
    expense: 55000,
    netProfit: 35000,
    costPerAcre: 18333,
    incomePerAcre: 30000,
    profitPerAcre: 11667,
    roi: 63.6,
    breakdown: {
      seeds: 6000,
      fertilizer: 12000,
      pesticides: 7000,
      labour: 15000,
      diesel: 6000,
      machinery: 5000,
      transport: 4000
    }
  },
  {
    crop: 'Tomato',
    acres: 5,
    income: 140000,
    expense: 95000,
    netProfit: 45000,
    costPerAcre: 19000,
    incomePerAcre: 28000,
    profitPerAcre: 9000,
    roi: 47.4,
    breakdown: {
      seeds: 11000,
      fertilizer: 22000,
      pesticides: 16000,
      labour: 26000,
      diesel: 8000,
      machinery: 7000,
      transport: 5000
    }
  },
  {
    crop: 'Sugarcane',
    acres: 5,
    income: 310000,
    expense: 110000,
    netProfit: 200000,
    costPerAcre: 22000,
    incomePerAcre: 62000,
    profitPerAcre: 40000,
    roi: 181.8,
    breakdown: {
      seeds: 28000,
      fertilizer: 34000,
      pesticides: 12000,
      labour: 20000,
      diesel: 8000,
      machinery: 5000,
      transport: 3000
    }
  }
];

export const initialMonthlyCashflow = [
  { month: 'Jun', income: 60000, expense: 120000, profit: -60000 },
  { month: 'Jul', income: 80000, expense: 145000, profit: -65000 },
  { month: 'Aug', income: 110000, expense: 130000, profit: -20000 },
  { month: 'Sep', income: 240000, expense: 115000, profit: 125000 },
  { month: 'Oct', income: 410000, expense: 120000, profit: 290000 },
  { month: 'Nov', income: 350000, expense: 150000, profit: 200000 }
];

export const initialRecentTransactions = [
  {
    id: 'TX-1001',
    date: '2025-10-14',
    type: 'Income',
    category: 'Crop Sales (Cotton)',
    party: 'APMC Market Yard Siddipet',
    farm: 'Farm 1 (South Block)',
    amount: 175000,
    mode: 'Bank Transfer (NEFT)',
    refNo: 'NEFT/CMS/20251014/8912',
    status: 'Completed'
  },
  {
    id: 'TX-1002',
    date: '2025-10-12',
    type: 'Expense',
    category: 'Fertilizer Purchase',
    party: 'Kisan Agro Traders',
    farm: 'Farm 2 (Canal Belt)',
    amount: 24500,
    mode: 'UPI',
    refNo: 'UPI/783921894101',
    status: 'Completed'
  },
  {
    id: 'TX-1003',
    date: '2025-10-10',
    type: 'Expense',
    category: 'Labour Wages',
    party: 'Weeding Crew (Venkat & Team)',
    farm: 'Sunrise Farms',
    amount: 14200,
    mode: 'Cash',
    refNo: 'VCHR-2025-884',
    status: 'Completed'
  },
  {
    id: 'TX-1004',
    date: '2025-10-08',
    type: 'Income',
    category: 'Government Subsidy',
    party: 'Rythu Bandhu DBT Scheme',
    farm: 'All Farms',
    amount: 120000,
    mode: 'Direct Credit',
    refNo: 'DBT-GOVT-TS-98124',
    status: 'Completed'
  },
  {
    id: 'TX-1005',
    date: '2025-10-05',
    type: 'Expense',
    category: 'Diesel & Machinery',
    party: 'Sri Sai Indian Oil Fuel Station',
    farm: 'Farm 1 & 2',
    amount: 16800,
    mode: 'Debit Card',
    refNo: 'POS/IOCL/66412',
    status: 'Completed'
  },
  {
    id: 'TX-1006',
    date: '2025-10-02',
    type: 'Income',
    category: 'Milk & Dairy Sales',
    party: 'Vijaya Dairy Federation',
    farm: 'Farm 1 Dairy Unit',
    amount: 32500,
    mode: 'Bank Transfer',
    refNo: 'FED/MKT/10042',
    status: 'Completed'
  }
];

export const initialUpcomingPayments = [
  {
    id: 'PAY-201',
    dueDate: '2025-10-20',
    party: 'State Bank of India (SBI)',
    type: 'Tractor Loan EMI',
    amount: 18500,
    mode: 'Auto-Debit ECS',
    status: 'Pending',
    priority: 'High'
  },
  {
    id: 'PAY-202',
    dueDate: '2025-10-24',
    party: 'Kisan Agro Chemicals',
    type: 'Supplier Payable (Pesticides)',
    amount: 34200,
    mode: 'NEFT / RTGS',
    status: 'Pending',
    priority: 'Medium'
  },
  {
    id: 'PAY-203',
    dueDate: '2025-10-28',
    party: 'Harvesting Machinery Contractors',
    type: 'Equipment Hire Charges',
    amount: 22000,
    mode: 'Cheque / Transfer',
    status: 'Pending',
    priority: 'Medium'
  },
  {
    id: 'PAY-204',
    dueDate: '2025-11-02',
    party: 'Farm Labour Gang Weekly Payout',
    type: 'Labour Wages',
    amount: 10300,
    mode: 'Cash / UPI',
    status: 'Scheduled',
    priority: 'Low'
  }
];

export const initialLowStockItems = [
  {
    id: 'PRD-101',
    productName: 'DAP 18:46:00 (Di-Ammonium Phosphate)',
    category: 'Fertilizers',
    currentStock: 8,
    reorderLevel: 25,
    unit: 'Bags (50kg)',
    supplier: 'IFFCO Kendra',
    unitCost: 1350,
    status: 'Critical Alert'
  },
  {
    id: 'PRD-102',
    productName: 'Monocrotophos 36% SL Pesticide',
    category: 'Pesticides',
    currentStock: 4,
    reorderLevel: 15,
    unit: 'Litres',
    supplier: 'Syngenta Agro Center',
    unitCost: 650,
    status: 'Low Stock'
  },
  {
    id: 'PRD-103',
    productName: 'Hybrid Cotton Seeds BT-2 (Brahma)',
    category: 'Seeds',
    currentStock: 6,
    reorderLevel: 20,
    unit: 'Packets (450g)',
    supplier: 'Rasi Seeds Depot',
    unitCost: 850,
    status: 'Reorder Soon'
  },
  {
    id: 'PRD-104',
    productName: 'Drip Lateral 16mm Inline Pipes',
    category: 'Spare Parts / Consumables',
    currentStock: 2,
    reorderLevel: 10,
    unit: 'Rolls (100m)',
    supplier: 'Jain Irrigation Systems',
    unitCost: 1950,
    status: 'Low Stock'
  }
];

export const initialSuppliers = [
  {
    id: 'SUP-01',
    code: 'SUP-101',
    name: 'Kisan Agro Traders & Chemicals',
    mobile: '+91 94401 22334',
    address: 'Near Agriculture Market, Siddipet',
    gstin: '36ABCDE1234F1Z5',
    bankDetails: 'HDFC Bank - 50100239120, HDFC000189',
    openingBalance: 45000,
    outstandingDue: 34200,
    status: 'Active'
  },
  {
    id: 'SUP-02',
    code: 'SUP-102',
    name: 'IFFCO Farmers Service Centre',
    mobile: '+91 94405 66778',
    address: 'State Highway Road, Nizamabad',
    gstin: '36IFFCO9981A1Z9',
    bankDetails: 'SBI - 11092837465, SBIN000045',
    openingBalance: 12000,
    outstandingDue: 18500,
    status: 'Active'
  },
  {
    id: 'SUP-03',
    code: 'SUP-103',
    name: 'Sri Laxmi Machinery Spares & Fuels',
    mobile: '+91 98492 55441',
    address: 'Industrial Estate, Medak',
    gstin: '36SLXMS8832L1Z2',
    bankDetails: 'Canara Bank - 2244101928, CNRB000112',
    openingBalance: 8000,
    outstandingDue: 32300,
    status: 'Active'
  }
];

export const initialBuyers = [
  {
    id: 'BUY-01',
    code: 'BUY-201',
    name: 'Siddipet APMC Cotton & Grain Mandi',
    businessName: 'APMC Regulatory Market Committee',
    mobile: '+91 98481 99001',
    address: 'Market Yard Complex, Siddipet',
    gstin: '36GOVAPMC1010A1',
    openingBalance: 180000,
    outstandingReceivable: 95000,
    status: 'Active'
  },
  {
    id: 'BUY-02',
    code: 'BUY-202',
    name: 'ITC Agri Business Division (e-Choupal)',
    businessName: 'ITC Limited Commodities',
    mobile: '+91 98220 44556',
    address: 'Hyderabad Road Logistics Park',
    gstin: '36AAACI1111C1Z4',
    openingBalance: 65000,
    outstandingReceivable: 50000,
    status: 'Active'
  }
];

export const initialLabour = [
  { id: 'LAB-01', name: 'Ramesh Naidu', mobile: '+91 99120 44551', gender: 'Male', village: 'Narsapur', dailyRate: 500, skill: 'Tractor Driver & Spraying', status: 'Active' },
  { id: 'LAB-02', name: 'Lakshmi Devi', mobile: '+91 99120 44552', gender: 'Female', village: 'Narsapur', dailyRate: 400, skill: 'Cotton Picking & Weeding', status: 'Active' },
  { id: 'LAB-03', name: 'Venkat Rao', mobile: '+91 99120 44553', gender: 'Male', village: 'Anandpur', dailyRate: 480, skill: 'Land Preparation & Sowing', status: 'Active' },
  { id: 'LAB-04', name: 'Anitha Bai', mobile: '+91 99120 44554', gender: 'Female', village: 'Anandpur', dailyRate: 400, skill: 'Harvesting & Grading', status: 'Active' }
];

export const initialMachinery = [
  {
    id: 'MCH-01',
    machineName: 'Mahindra 575 DI Tractor (45 HP)',
    machineType: 'Tractor',
    registrationNo: 'TS 10 AB 4590',
    purchaseDate: '2023-04-10',
    purchaseCost: 720000,
    currentValue: 610000,
    fuelType: 'Diesel',
    status: 'Operational'
  },
  {
    id: 'MCH-02',
    machineName: 'VST Shakti 130 DI Power Tiller',
    machineType: 'Power Tiller',
    registrationNo: 'TS 10 T 1120',
    purchaseDate: '2022-11-15',
    purchaseCost: 195000,
    currentValue: 140000,
    fuelType: 'Diesel',
    status: 'Operational'
  },
  {
    id: 'MCH-03',
    machineName: 'Aspee HTP Tractor Mounted Sprayer',
    machineType: 'Sprayer',
    registrationNo: 'N/A (Implements)',
    purchaseDate: '2024-01-20',
    purchaseCost: 65000,
    currentValue: 55000,
    fuelType: 'PTO Driven',
    status: 'Operational'
  }
];

export const initialLoans = [
  {
    id: 'LN-01',
    loanNo: 'KCC-SBI-98402',
    bankLender: 'State Bank of India',
    loanType: 'Kisan Credit Card (Crop Loan)',
    sanctionAmount: 300000,
    interestRate: 7.0,
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    emi: 0,
    outstandingAmount: 210000,
    purpose: 'Crop Production & Fertilizers',
    status: 'Active'
  },
  {
    id: 'LN-02',
    loanNo: 'TR-HDFC-55102',
    bankLender: 'HDFC Bank Agri Finance',
    loanType: 'Tractor Hypothecation Loan',
    sanctionAmount: 500000,
    interestRate: 8.5,
    startDate: '2023-04-15',
    endDate: '2028-04-15',
    emi: 18500,
    outstandingAmount: 340000,
    purpose: 'Mahindra Tractor Purchase',
    status: 'Active'
  }
];

export const initialNotifications = [
  { id: 1, title: 'Low Stock Alert', message: 'DAP 18:46:00 is down to 8 Bags (Threshold: 25 Bags). Reorder immediately.', time: '10 mins ago', type: 'warning', read: false },
  { id: 2, title: 'Upcoming Loan EMI', message: 'Tractor Loan EMI of ₹18,500 due on 20th Oct 2025 at SBI.', time: '1 hour ago', type: 'info', read: false },
  { id: 3, title: 'Harvest Recorded', message: 'Cotton harvest completed on Farm 1 (South Block). 118 Quintals logged.', time: 'Yesterday', type: 'success', read: true },
  { id: 4, title: 'Outstanding Receivables', message: 'APMC Market Yard balance ₹95,000 pending beyond 15 days.', time: '2 days ago', type: 'warning', read: true }
];
