// Comprehensive Dashboard Data matching PDF Section 3 (Pic 1 & Pic 3)

export const dashboardWidgets = [
  {
    id: 'total-income',
    label: 'Total Income',
    value: '₹ 12,50,000',
    numeric: 1250000,
    subtext: 'Realized & accrued season inflow',
    icon: '↗',
    color: '#15803d',
    bgColor: '#f0fdf4',
    isPrimary: true
  },
  {
    id: 'total-expenditure',
    label: 'Total Expenditure',
    value: '₹ 7,80,000',
    numeric: 780000,
    subtext: 'Inputs, labour & operational costs',
    icon: '↘',
    color: '#b45309',
    bgColor: '#fffbeb',
    isPrimary: true
  },
  {
    id: 'net-profit',
    label: 'Net Profit',
    value: '₹ 4,70,000',
    numeric: 470000,
    subtext: 'Net operational surplus (+37.6%)',
    icon: '★',
    color: '#059669',
    bgColor: '#ecfdf5',
    isPrimary: true
  },
  {
    id: 'total-farm-area',
    label: 'Total Farm Area',
    value: '42 Acres',
    numeric: 42,
    subtext: 'Across 4 active land parcels',
    icon: '▤',
    color: '#2d6a4f',
    bgColor: '#f4fbf6'
  },
  {
    id: 'active-crops',
    label: 'Active Crops',
    value: '8 Crops',
    numeric: 8,
    subtext: 'Cotton, Paddy, Chilli, Maize, etc.',
    icon: '🌱',
    color: '#0d9488',
    bgColor: '#f0fdfa'
  },
  {
    id: 'total-sales',
    label: 'Total Sales',
    value: '₹ 10,80,000',
    numeric: 1080000,
    subtext: 'Grain, cotton & horticulture sales',
    icon: '▱',
    color: '#4f46e5',
    bgColor: '#eef2ff'
  },
  {
    id: 'total-purchases',
    label: 'Total Purchases',
    value: '₹ 3,40,000',
    numeric: 340000,
    subtext: 'Bulk seeds, fertilizers & chemicals',
    icon: '▣',
    color: '#7c3aed',
    bgColor: '#f5f3ff'
  },
  {
    id: 'outstanding-receivables',
    label: 'Outstanding Receivables',
    value: '₹ 1,45,000',
    numeric: 145000,
    subtext: 'Pending from APMC mandi & traders',
    icon: '⏳',
    color: '#0284c7',
    bgColor: '#f0f9ff'
  },
  {
    id: 'outstanding-payables',
    label: 'Outstanding Payables',
    value: '₹ 95,000',
    numeric: 95000,
    subtext: 'Due to agro-dealers & equipment rentals',
    icon: '⚠',
    color: '#e11d48',
    bgColor: '#fff1f2'
  },
  {
    id: 'labour-cost',
    label: 'Labour Cost',
    value: '₹ 1,85,000',
    numeric: 185000,
    subtext: 'Sowing, weeding & harvesting labour',
    icon: '👥',
    color: '#ea580c',
    bgColor: '#fff7ed'
  },
  {
    id: 'input-cost',
    label: 'Input Cost',
    value: '₹ 2,95,000',
    numeric: 295000,
    subtext: 'Hybrid seeds, Urea, DAP & bio-fertilizers',
    icon: '🧪',
    color: '#9333ea',
    bgColor: '#faf5ff'
  },
  {
    id: 'machinery-cost',
    label: 'Machinery Cost',
    value: '₹ 1,60,000',
    numeric: 160000,
    subtext: 'Tractor diesel, rotavator & harvester hire',
    icon: '🚜',
    color: '#2563eb',
    bgColor: '#eff6ff'
  }
];

export const cropProfitChartData = [
  { crop: 'Cotton', income: 380000, expense: 150000, netProfit: 230000, acres: 10 },
  { crop: 'Paddy', income: 260000, expense: 110000, netProfit: 150000, acres: 12 },
  { crop: 'Chilli', income: 240000, expense: 90000, netProfit: 150000, acres: 8 },
  { crop: 'Groundnut', income: 150000, expense: 70000, netProfit: 80000, acres: 6 },
  { crop: 'Maize', income: 120000, expense: 60000, netProfit: 60000, acres: 5 },
  { crop: 'Tomato', income: 160000, expense: 75000, netProfit: 85000, acres: 5 },
  { crop: 'Sugarcane', income: 310000, expense: 110000, netProfit: 200000, acres: 5 },
  { crop: 'Meghana', income: 140000, expense: 55000, netProfit: 85000, acres: 4 }
];

export const monthlyCashflowData = [
  { month: 'Jun', income: 45000, expense: 95000 },
  { month: 'Jul', income: 65000, expense: 125000 },
  { month: 'Aug', income: 80000, expense: 110000 },
  { month: 'Sep', income: 120000, expense: 90000 },
  { month: 'Oct', income: 290000, expense: 85000 },
  { month: 'Nov', income: 340000, expense: 105000 },
  { month: 'Dec', income: 180000, expense: 75000 },
  { month: 'Jan', income: 135000, expense: 50000 },
  { month: 'Feb', income: 210000, expense: 55000 },
  { month: 'Mar', income: 160000, expense: 45000 }
];

export const activeCropsTable = [
  {
    id: 1,
    crop: 'Cotton',
    variety: 'BT Cotton-2',
    farm: 'Farm 1 (South Block)',
    area: '10 Acres',
    sowing: '2025-06-15',
    harvest: '2025-11-20',
    expRevenue: '₹ 3,80,000',
    status: 'In Progress'
  },
  {
    id: 2,
    crop: 'Paddy',
    variety: 'BPT 5204 (Samba)',
    farm: 'Farm 2 (Canal Belt)',
    area: '12 Acres',
    sowing: '2025-07-02',
    harvest: '2025-11-28',
    expRevenue: '₹ 2,60,000',
    status: 'In Progress'
  },
  {
    id: 3,
    crop: 'Chilli',
    variety: 'Teja Red',
    farm: 'Sunrise Farms (East Block)',
    area: '8 Acres',
    sowing: '2025-08-10',
    harvest: '2026-01-15',
    expRevenue: '₹ 2,40,000',
    status: 'In Progress'
  },
  {
    id: 4,
    crop: 'Groundnut',
    variety: 'TAG-24',
    farm: 'Farm 1 (South Block)',
    area: '6 Acres',
    sowing: '2025-09-20',
    harvest: '2026-01-05',
    expRevenue: '₹ 1,50,000',
    status: 'In Progress'
  },
  {
    id: 5,
    crop: 'Maize',
    variety: 'Pioneer 3396',
    farm: 'Farm 2 (Canal Belt)',
    area: '5 Acres',
    sowing: '2025-06-25',
    harvest: '2025-10-15',
    expRevenue: '₹ 1,20,000',
    status: 'Harvested'
  },
  {
    id: 6,
    crop: 'Tomato',
    variety: 'US 440',
    farm: 'Krishna Delta Parcel',
    area: '5 Acres',
    sowing: '2025-09-05',
    harvest: '2025-12-10',
    expRevenue: '₹ 1,60,000',
    status: 'In Progress'
  },
  {
    id: 7,
    crop: 'Sugarcane',
    variety: 'Co 86032',
    farm: 'Krishna Delta Parcel',
    area: '5 Acres',
    sowing: '2025-03-12',
    harvest: '2026-02-15',
    expRevenue: '₹ 3,10,000',
    status: 'In Progress'
  },
  {
    id: 8,
    crop: 'Meghana',
    variety: 'Hybrid Standard',
    farm: 'Farm 1 (South Block)',
    area: '4 Acres',
    sowing: '2025-10-01',
    harvest: '2026-02-28',
    expRevenue: '₹ 1,40,000',
    status: 'Registered'
  }
];

export const upcomingPaymentsList = [
  {
    id: 'pay-1',
    payee: 'Rythu Seva Kendra',
    purpose: 'DAP & Complex Fertilizers (Batch #84)',
    category: 'Fertilizers & Chemicals',
    dueDate: '2026-10-20',
    day: '20',
    month: 'Oct',
    amount: '₹ 45,000',
    status: 'Due Soon'
  },
  {
    id: 'pay-2',
    payee: 'State Bank of India',
    purpose: 'Tractor Agricultural Loan EMI #14',
    category: 'Loan EMI',
    dueDate: '2026-10-25',
    day: '25',
    month: 'Oct',
    amount: '₹ 18,500',
    status: 'Due Soon'
  },
  {
    id: 'pay-3',
    payee: 'Harvesting Machinery Contractors',
    purpose: 'Combine Harvester Rental for Paddy',
    category: 'Machinery Hire',
    dueDate: '2026-11-02',
    day: '02',
    month: 'Nov',
    amount: '₹ 32,000',
    status: 'Upcoming'
  },
  {
    id: 'pay-4',
    payee: 'Farm Labour Collective',
    purpose: 'Fortnightly Cotton Weeding Wages',
    category: 'Labour Wages',
    dueDate: '2026-11-05',
    day: '05',
    month: 'Nov',
    amount: '₹ 24,000',
    status: 'Upcoming'
  }
];

export const recentTransactionsList = [
  {
    id: 'tx-1',
    voucher: 'TX-1001',
    date: '2026-10-14',
    title: 'Cotton Sales Lot #1',
    party: 'APMC Market Yard Siddipet',
    type: 'Income',
    amount: '₹ 1,75,000',
    mode: 'Bank Transfer (NEFT)',
    status: 'Completed'
  },
  {
    id: 'tx-2',
    voucher: 'TX-1002',
    date: '2026-10-12',
    title: 'Diesel for Tractor & Pumpset',
    party: 'Bharat Petroleum Outlet',
    type: 'Expense',
    amount: '₹ 14,200',
    mode: 'UPI',
    status: 'Completed'
  },
  {
    id: 'tx-3',
    voucher: 'TX-1003',
    date: '2026-10-10',
    title: 'Tomato Harvest Wholesale Dispatch',
    party: 'Hyderabad Wholesale Sabzi Mandi',
    type: 'Income',
    amount: '₹ 68,500',
    mode: 'Direct Account Credit',
    status: 'Completed'
  },
  {
    id: 'tx-4',
    voucher: 'TX-1004',
    date: '2026-10-08',
    title: 'Rythu Bandhu Government Agri Subsidy',
    party: 'Telangana Agriculture Dept',
    type: 'Income',
    amount: '₹ 1,20,000',
    mode: 'Direct Benefit Transfer (DBT)',
    status: 'Completed'
  },
  {
    id: 'tx-5',
    voucher: 'TX-1005',
    date: '2026-10-05',
    title: 'Pesticides & Spraying Equipment',
    party: 'Kisan Agro Centre',
    type: 'Expense',
    amount: '₹ 22,800',
    mode: 'Cheque',
    status: 'Completed'
  }
];

export const lowStockItemsList = [
  {
    id: 'stk-1',
    item: 'DAP Fertilizer (50kg)',
    category: 'Fertilizers',
    currentQty: '4 Bags',
    minStock: '20 Bags',
    status: 'Critical Low',
    level: 'critical'
  },
  {
    id: 'stk-2',
    item: 'Chlorpyrifos 20% EC (1L)',
    category: 'Crop Protection',
    currentQty: '2 Bottles',
    minStock: '10 Bottles',
    status: 'Low Stock',
    level: 'warning'
  },
  {
    id: 'stk-3',
    item: 'BT Cotton-2 Hybrid Seeds (450g)',
    category: 'Seeds',
    currentQty: '6 Packets',
    minStock: '25 Packets',
    status: 'Low Stock',
    level: 'warning'
  },
  {
    id: 'stk-4',
    item: 'Drip Lateral Filters 2-inch',
    category: 'Irrigation Parts',
    currentQty: '1 Unit',
    minStock: '4 Units',
    status: 'Critical Low',
    level: 'critical'
  }
];
