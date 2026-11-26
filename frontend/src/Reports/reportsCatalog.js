// ============================================================================
// AGRIMAN Module 19 — Reports Catalog
// Authoritative catalog for all 26 reports across 3 categories
// ============================================================================

export const REPORT_CATEGORIES = [
  {
    id: 'financial',
    label: 'Financial Reports',
    iconName: 'IndianRupee',
    description: 'Accounting statements, daily transactions, receivables, payables, and profitability.'
  },
  {
    id: 'agriculture',
    label: 'Agriculture Reports',
    iconName: 'Sprout',
    description: 'Crop economics, farm yields, acre-wise metrics, labour, and machinery utilization.'
  },
  {
    id: 'inventory',
    label: 'Inventory Reports',
    iconName: 'Package',
    description: 'Warehouse stock balances, valuation, ledger history, inputs consumption, and low-stock alerts.'
  }
];

export const REPORTS_CATALOG = [
  // ── 1. Financial Reports (10) ─────────────────────────────────────────────
  {
    id: 'daily-income',
    route: 'daily-income',
    name: 'Daily Income Report',
    category: 'financial',
    iconName: 'TrendingUp',
    description: 'Audit day-by-day farm earnings, crop sales, and operational receipts with payment mode breakdown.',
    endpoint: '/api/Reports/financial/daily-income',
    fallbackReason: 'Connected to live /api/Reports/financial/daily-income and /api/income. Filtered by selected date.',
    defaultFilters: {
      date: new Date().toISOString().slice(0, 10),
      farm: 'All Farms',
      crop: 'All Crops',
      paymentMode: 'All Modes'
    },
    filterConfig: [
      { key: 'date', label: 'Transaction Date', type: 'date' },
      { key: 'farm', label: 'Farm / Land', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm', 'North Ridge Orchard'] },
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize', 'Groundnut'] },
      { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['All Modes', 'Cash', 'Bank Transfer', 'UPI', 'Cheque'] }
    ],
    columns: [
      { key: 'date', label: 'DATE', align: 'center', width: '110px' },
      { key: 'incomeNo', label: 'INCOME NO', align: 'center', width: '130px' },
      { key: 'farmer', label: 'FARMER', align: 'left' },
      { key: 'farm', label: 'FARM', align: 'left' },
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'incomeType', label: 'INCOME TYPE', align: 'left' },
      { key: 'buyer', label: 'BUYER / SOURCE', align: 'left' },
      { key: 'amount', label: 'AMOUNT (₹)', align: 'center', isCurrency: true, width: '130px' },
      { key: 'paymentMode', label: 'PAYMENT MODE', align: 'center', width: '130px' },
      { key: 'status', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },
  {
    id: 'daily-expense',
    route: 'daily-expense',
    name: 'Daily Expense Report',
    category: 'financial',
    iconName: 'TrendingDown',
    description: 'Day-by-day cash outlays, operational vouchers, field purchases, and supplier disbursements.',
    endpoint: '/api/expenses',
    fallbackReason: 'Connected to live /api/expenses. Filtered by selected date.',
    defaultFilters: {
      date: new Date().toISOString().slice(0, 10),
      farm: '',
      category: '',
      paymentMode: ''
    },
    filterConfig: [
      { key: 'date', label: 'Expense Date', type: 'date' },
      { key: 'farm', label: 'Farm / Land', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm', 'North Ridge Orchard'] },
      { key: 'category', label: 'Expense Category', type: 'select', options: ['All Categories', 'Seeds', 'Fertilizers', 'Pesticides', 'Labour Wages', 'Machinery Fuel', 'Equipment Repair', 'Irrigation'] },
      { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['All Modes', 'Cash', 'Bank Transfer', 'UPI', 'Cheque'] }
    ],
    columns: [
      { key: 'date', label: 'DATE', align: 'center', width: '110px' },
      { key: 'voucherNo', label: 'VOUCHER NO', align: 'center', width: '130px' },
      { key: 'farm', label: 'FARM', align: 'left' },
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'category', label: 'CATEGORY', align: 'left' },
      { key: 'payee', label: 'PAID TO / VENDOR', align: 'left' },
      { key: 'amount', label: 'AMOUNT (₹)', align: 'center', isCurrency: true, width: '130px' },
      { key: 'paymentMode', label: 'PAYMENT MODE', align: 'center', width: '130px' },
      { key: 'status', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },
  {
    id: 'monthly-income',
    route: 'monthly-income',
    name: 'Monthly Income Report',
    category: 'financial',
    iconName: 'CalendarDays',
    description: 'Month-wise revenue stream aggregations, crop harvest realizations, and seasonal earnings trend.',
    endpoint: '/api/income',
    fallbackReason: 'Aggregated from /api/income by calendar month.',
    defaultFilters: {
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      year: String(new Date().getFullYear()),
      farm: ''
    },
    filterConfig: [
      { key: 'month', label: 'Month', type: 'select', options: ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June', '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'] },
      { key: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024'] },
      { key: 'farm', label: 'Farm / Land', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] }
    ],
    columns: [
      { key: 'period', label: 'MONTH / YEAR', align: 'center', width: '140px' },
      { key: 'txnCount', label: 'VOUCHERS', align: 'center', width: '100px' },
      { key: 'cropSales', label: 'CROP SALES (₹)', align: 'center', isCurrency: true },
      { key: 'farmOps', label: 'FARM OPS (₹)', align: 'center', isCurrency: true },
      { key: 'subsidies', label: 'SUBSIDIES (₹)', align: 'center', isCurrency: true },
      { key: 'rentalIncome', label: 'RENTAL (₹)', align: 'center', isCurrency: true },
      { key: 'totalIncome', label: 'NET INCOME (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'monthly-expense',
    route: 'monthly-expense',
    name: 'Monthly Expense Report',
    category: 'financial',
    iconName: 'CalendarDays',
    description: 'Monthly operational cost burn, input purchases, machinery maintenance, and labour wage ledger.',
    endpoint: '/api/expenses',
    fallbackReason: 'Aggregated from /api/expenses by calendar month.',
    defaultFilters: {
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      year: String(new Date().getFullYear()),
      farm: ''
    },
    filterConfig: [
      { key: 'month', label: 'Month', type: 'select', options: ['01 - January', '02 - February', '03 - March', '04 - April', '05 - May', '06 - June', '07 - July', '08 - August', '09 - September', '10 - October', '11 - November', '12 - December'] },
      { key: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024'] },
      { key: 'farm', label: 'Farm / Land', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] }
    ],
    columns: [
      { key: 'period', label: 'MONTH / YEAR', align: 'center', width: '140px' },
      { key: 'voucherCount', label: 'VOUCHERS', align: 'center', width: '100px' },
      { key: 'inputsCost', label: 'SEEDS & INPUTS (₹)', align: 'center', isCurrency: true },
      { key: 'labourCost', label: 'LABOUR WAGES (₹)', align: 'center', isCurrency: true },
      { key: 'machineryCost', label: 'MACHINERY & FUEL (₹)', align: 'center', isCurrency: true },
      { key: 'overheadCost', label: 'OVERHEAD & POWER (₹)', align: 'center', isCurrency: true },
      { key: 'totalExpense', label: 'TOTAL EXPENSE (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'annual-income',
    route: 'annual-income',
    name: 'Annual Income Report',
    category: 'financial',
    iconName: 'CalendarRange',
    description: 'Quarterly and annual consolidated farm turnover, year-on-year revenue growth, and yield monetization.',
    endpoint: '/api/income',
    fallbackReason: 'Aggregated quarterly revenue from farm financial records.',
    defaultFilters: {
      financialYear: '2025-2026',
      farm: ''
    },
    filterConfig: [
      { key: 'financialYear', label: 'Financial Year', type: 'select', options: ['2025-2026', '2024-2025', '2023-2024'] },
      { key: 'farm', label: 'Farm / Land', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] }
    ],
    columns: [
      { key: 'fy', label: 'FINANCIAL YEAR', align: 'center', width: '140px' },
      { key: 'q1', label: 'Q1 (APR–JUN) (₹)', align: 'center', isCurrency: true },
      { key: 'q2', label: 'Q2 (JUL–SEP) (₹)', align: 'center', isCurrency: true },
      { key: 'q3', label: 'Q3 (OCT–DEC) (₹)', align: 'center', isCurrency: true },
      { key: 'q4', label: 'Q4 (JAN–MAR) (₹)', align: 'center', isCurrency: true },
      { key: 'totalRevenue', label: 'ANNUAL REVENUE (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'growth', label: 'YOY GROWTH', align: 'center', width: '110px' }
    ]
  },
  {
    id: 'annual-expense',
    route: 'annual-expense',
    name: 'Annual Expense Report',
    category: 'financial',
    iconName: 'CalendarRange',
    description: 'Multi-quarter farm expenditure trends, budget allocation variance, and seasonal cost distribution.',
    endpoint: '/api/expenses',
    fallbackReason: 'Aggregated quarterly expenses from farm financial records.',
    defaultFilters: {
      financialYear: '2025-2026',
      farm: ''
    },
    filterConfig: [
      { key: 'financialYear', label: 'Financial Year', type: 'select', options: ['2025-2026', '2024-2025', '2023-2024'] },
      { key: 'farm', label: 'Farm / Land', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] }
    ],
    columns: [
      { key: 'fy', label: 'FINANCIAL YEAR', align: 'center', width: '140px' },
      { key: 'q1', label: 'Q1 (APR–JUN) (₹)', align: 'center', isCurrency: true },
      { key: 'q2', label: 'Q2 (JUL–SEP) (₹)', align: 'center', isCurrency: true },
      { key: 'q3', label: 'Q3 (OCT–DEC) (₹)', align: 'center', isCurrency: true },
      { key: 'q4', label: 'Q4 (JAN–MAR) (₹)', align: 'center', isCurrency: true },
      { key: 'totalExpense', label: 'ANNUAL EXPENSE (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'variance', label: 'BUDGET VARIANCE', align: 'center', width: '130px' }
    ]
  },
  {
    id: 'pnl',
    route: 'pnl',
    name: 'Profit & Loss',
    category: 'financial',
    iconName: 'ChartNoAxesCombined',
    description: 'Authoritative farm profitability statement balancing total operational revenue against total expenses.',
    endpoint: '/api/Reports/pnl',
    fallbackReason: 'Live backend endpoint /api/Reports/pnl verified with revenue, expenses, and margins.',
    defaultFilters: {
      fromDate: '',
      toDate: '',
      farm: ''
    },
    filterConfig: [
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' },
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] }
    ],
    columns: [
      { key: 'accountHead', label: 'ACCOUNT HEAD / REVENUE STREAM', align: 'left' },
      { key: 'category', label: 'CATEGORY', align: 'left' },
      { key: 'revenue', label: 'REVENUE (₹)', align: 'center', isCurrency: true },
      { key: 'expense', label: 'EXPENSE (₹)', align: 'center', isCurrency: true },
      { key: 'net', label: 'NET PROFIT / LOSS (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'margin', label: 'SHARE / MARGIN', align: 'center', width: '120px' }
    ]
  },
  {
    id: 'cash-flow',
    route: 'cash-flow',
    name: 'Cash Flow',
    category: 'financial',
    iconName: 'ArrowLeftRight',
    description: 'Track liquid receipts and disbursements, monitor bank/cash liquidity, and opening/closing balances.',
    endpoint: '/api/Reports/cash-flow',
    fallbackReason: 'Live backend endpoint /api/Reports/cash-flow verified with inflow, outflow, and net liquidity.',
    defaultFilters: {
      fromDate: '',
      toDate: '',
      account: ''
    },
    filterConfig: [
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' },
      { key: 'account', label: 'Account', type: 'select', options: ['All Accounts', 'SBI Agriculture Current A/c', 'HDFC Primary Farm A/c', 'Petty Cash Register'] }
    ],
    columns: [
      { key: 'date', label: 'DATE', align: 'center', width: '110px' },
      { key: 'refNo', label: 'REF / VOUCHER', align: 'center', width: '130px' },
      { key: 'description', label: 'PARTICULARS / DESCRIPTION', align: 'left' },
      { key: 'counterparty', label: 'PAYEE / PAYER', align: 'left' },
      { key: 'inflow', label: 'CASH INFLOW (₹)', align: 'center', isCurrency: true },
      { key: 'outflow', label: 'CASH OUTFLOW (₹)', align: 'center', isCurrency: true },
      { key: 'balance', label: 'RUNNING BALANCE (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'receivables',
    route: 'receivables',
    name: 'Receivables',
    category: 'financial',
    iconName: 'ArrowDownToLine',
    description: 'Monitor pending customer payments, crop buyer dues, invoice aging buckets, and collection status.',
    endpoint: '/api/sales',
    fallbackReason: 'Computed from unpaid sales invoices and buyer transaction ledgers.',
    defaultFilters: {
      buyer: '',
      status: 'Pending',
      aging: ''
    },
    filterConfig: [
      { key: 'buyer', label: 'Buyer / Customer', type: 'select', options: ['All Buyers', 'Ramesh Agro Traders', 'Balaji Cotton Ginning', 'Kisan Mandi Depot', 'Supreme Grains Corp'] },
      { key: 'status', label: 'Payment Status', type: 'select', options: ['All Statuses', 'Pending', 'Partially Paid', 'Overdue'] },
      { key: 'aging', label: 'Aging Bucket', type: 'select', options: ['All Aging', '< 30 Days', '30–60 Days', '61–90 Days', '> 90 Days'] }
    ],
    columns: [
      { key: 'invoiceNo', label: 'INVOICE NO', align: 'center', width: '130px' },
      { key: 'date', label: 'INVOICE DATE', align: 'center', width: '110px' },
      { key: 'buyer', label: 'BUYER / TRADER', align: 'left' },
      { key: 'dueDate', label: 'DUE DATE', align: 'center', width: '110px' },
      { key: 'totalAmount', label: 'INVOICE (₹)', align: 'center', isCurrency: true },
      { key: 'receivedAmount', label: 'RECEIVED (₹)', align: 'center', isCurrency: true },
      { key: 'outstanding', label: 'OUTSTANDING (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'agingDays', label: 'AGING', align: 'center', width: '90px' },
      { key: 'status', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },
  {
    id: 'payables',
    route: 'payables',
    name: 'Payables',
    category: 'financial',
    iconName: 'ArrowUpFromLine',
    description: 'Outstanding vendor liabilities, fertilizer & seed supplier invoices, workshop bills, and due dates.',
    endpoint: '/api/purchases',
    fallbackReason: 'Computed from pending purchase orders and supplier bills.',
    defaultFilters: {
      supplier: '',
      status: 'Pending',
      aging: ''
    },
    filterConfig: [
      { key: 'supplier', label: 'Supplier / Vendor', type: 'select', options: ['All Suppliers', 'IFFCO Fertilizer Outlet', 'Mahyco Seed Depot', 'Rasi Agro Chemicals', 'Jai Kisan Tractor Spares'] },
      { key: 'status', label: 'Bill Status', type: 'select', options: ['All Statuses', 'Pending', 'Partially Paid', 'Overdue'] },
      { key: 'aging', label: 'Aging Bucket', type: 'select', options: ['All Aging', '< 15 Days', '15–30 Days', '31–60 Days', '> 60 Days'] }
    ],
    columns: [
      { key: 'billNo', label: 'BILL NO', align: 'center', width: '130px' },
      { key: 'date', label: 'BILL DATE', align: 'center', width: '110px' },
      { key: 'supplier', label: 'SUPPLIER / VENDOR', align: 'left' },
      { key: 'category', label: 'SUPPLY CATEGORY', align: 'left' },
      { key: 'dueDate', label: 'DUE DATE', align: 'center', width: '110px' },
      { key: 'totalAmount', label: 'BILL AMOUNT (₹)', align: 'center', isCurrency: true },
      { key: 'paidAmount', label: 'PAID (₹)', align: 'center', isCurrency: true },
      { key: 'outstanding', label: 'PAYABLE (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'agingDays', label: 'AGING', align: 'center', width: '90px' },
      { key: 'status', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },

  // ── 2. Agriculture Reports (11) ───────────────────────────────────────────
  {
    id: 'crop-wise-income',
    route: 'crop-wise-income',
    name: 'Crop-wise Income',
    category: 'agriculture',
    iconName: 'Sprout',
    description: 'Detailed earnings breakdown per agricultural crop, yield marketed volume, and average sale realizations.',
    endpoint: '/api/sales',
    fallbackReason: 'Grouped crop income from sales and market receipts.',
    defaultFilters: {
      crop: '',
      season: '',
      year: '2026'
    },
    filterConfig: [
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize', 'Groundnut'] },
      { key: 'season', label: 'Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid', 'Annual'] },
      { key: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024'] }
    ],
    columns: [
      { key: 'crop', label: 'CROP NAME', align: 'left' },
      { key: 'season', label: 'SEASON', align: 'center', width: '110px' },
      { key: 'harvestArea', label: 'HARVEST AREA', align: 'center', width: '120px' },
      { key: 'quantitySold', label: 'QUANTITY SOLD', align: 'center', width: '130px' },
      { key: 'avgRate', label: 'AVG PRICE (₹/UNIT)', align: 'center', width: '140px' },
      { key: 'grossIncome', label: 'GROSS INCOME (₹)', align: 'center', isCurrency: true },
      { key: 'netIncome', label: 'NET INCOME (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'crop-wise-expense',
    route: 'crop-wise-expense',
    name: 'Crop-wise Expense',
    category: 'agriculture',
    iconName: 'Sprout',
    description: 'Analyze input costs, labour wages, spray treatments, and machine hire charges segregated by crop.',
    endpoint: '/api/expenses',
    fallbackReason: 'Grouped crop expenses from farm activities and expense vouchers.',
    defaultFilters: {
      crop: '',
      season: '',
      farm: ''
    },
    filterConfig: [
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize', 'Groundnut'] },
      { key: 'season', label: 'Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid', 'Annual'] },
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] }
    ],
    columns: [
      { key: 'crop', label: 'CROP NAME', align: 'left' },
      { key: 'season', label: 'SEASON', align: 'center', width: '110px' },
      { key: 'seedCost', label: 'SEEDS & NURSERY (₹)', align: 'center', isCurrency: true },
      { key: 'chemCost', label: 'FERT & PEST (₹)', align: 'center', isCurrency: true },
      { key: 'labourCost', label: 'LABOUR WAGES (₹)', align: 'center', isCurrency: true },
      { key: 'machineryCost', label: 'MACHINERY (₹)', align: 'center', isCurrency: true },
      { key: 'totalCost', label: 'TOTAL COST (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'crop-wise-profit',
    route: 'crop-wise-profit',
    name: 'Crop-wise Profit',
    category: 'agriculture',
    iconName: 'Wheat',
    description: 'Compare revenue, input expenditures, and net return on investment (ROI) across every cultivated crop.',
    endpoint: '/api/Reports/crop-profit',
    fallbackReason: 'Live backend endpoint /api/Reports/crop-profit verified.',
    defaultFilters: {
      crop: '',
      season: ''
    },
    filterConfig: [
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize', 'Groundnut'] },
      { key: 'season', label: 'Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid', 'Annual'] }
    ],
    columns: [
      { key: 'crop', label: 'CROP NAME', align: 'left' },
      { key: 'acreage', label: 'ACREAGE (ACRES)', align: 'center', width: '130px' },
      { key: 'revenue', label: 'REVENUE (₹)', align: 'center', isCurrency: true },
      { key: 'expenses', label: 'EXPENSES (₹)', align: 'center', isCurrency: true },
      { key: 'netProfit', label: 'NET PROFIT (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'margin', label: 'PROFIT MARGIN %', align: 'center', width: '130px' },
      { key: 'roi', label: 'EST. ROI %', align: 'center', width: '110px' }
    ]
  },
  {
    id: 'farm-wise-profit',
    route: 'farm-wise-profit',
    name: 'Farm-wise Profit',
    category: 'agriculture',
    iconName: 'MapPin',
    description: 'Unit economics and land parcel profitability comparing yields, revenues, and operating costs per farm plot.',
    endpoint: '/api/Reports/farm-profit',
    fallbackReason: 'Live backend endpoint /api/Reports/farm-profit verified.',
    defaultFilters: {
      farm: '',
      year: '2026'
    },
    filterConfig: [
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm', 'North Ridge Orchard'] },
      { key: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024'] }
    ],
    columns: [
      { key: 'farm', label: 'FARM NAME', align: 'left' },
      { key: 'location', label: 'LOCATION', align: 'left' },
      { key: 'acreage', label: 'TOTAL AREA', align: 'center', width: '110px' },
      { key: 'revenue', label: 'REVENUE (₹)', align: 'center', isCurrency: true },
      { key: 'expenses', label: 'EXPENSES (₹)', align: 'center', isCurrency: true },
      { key: 'netProfit', label: 'NET PROFIT (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'margin', label: 'PROFIT MARGIN %', align: 'center', width: '130px' }
    ]
  },
  {
    id: 'season-wise-profit',
    route: 'season-wise-profit',
    name: 'Season-wise Profit',
    category: 'agriculture',
    iconName: 'CalendarRange',
    description: 'Financial performance across Kharif, Rabi, and Zaid seasons to optimize crop rotation scheduling.',
    endpoint: '/api/Reports/pnl',
    fallbackReason: 'Computed across seasonal production cycles.',
    defaultFilters: {
      season: 'All Seasons',
      year: '2026'
    },
    filterConfig: [
      { key: 'season', label: 'Crop Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid', 'Annual'] },
      { key: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024'] }
    ],
    columns: [
      { key: 'season', label: 'SEASON', align: 'center', width: '110px' },
      { key: 'year', label: 'YEAR', align: 'center', width: '90px' },
      { key: 'cropsPlanted', label: 'CROPS CULTIVATED', align: 'left' },
      { key: 'acreage', label: 'PLANTED AREA', align: 'center', width: '120px' },
      { key: 'revenue', label: 'REVENUE (₹)', align: 'center', isCurrency: true },
      { key: 'expenses', label: 'EXPENSE (₹)', align: 'center', isCurrency: true },
      { key: 'netProfit', label: 'NET PROFIT (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'margin', label: 'MARGIN %', align: 'center', width: '110px' }
    ]
  },
  {
    id: 'acre-wise-cost',
    route: 'acre-wise-cost',
    name: 'Acre-wise Cost',
    category: 'agriculture',
    iconName: 'Ruler',
    description: 'Normalized input and operational expenditure per acre to pinpoint field inefficiencies and high-cost areas.',
    endpoint: '/api/expenses',
    fallbackReason: 'Computed per-acre cultivation expenses from land area and expense logs.',
    defaultFilters: {
      farm: '',
      crop: '',
      season: ''
    },
    filterConfig: [
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] },
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize'] },
      { key: 'season', label: 'Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid'] }
    ],
    columns: [
      { key: 'farm', label: 'FARM / PLOT', align: 'left' },
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'season', label: 'SEASON', align: 'center', width: '100px' },
      { key: 'area', label: 'AREA (ACRES)', align: 'center', width: '110px' },
      { key: 'totalCost', label: 'TOTAL COST (₹)', align: 'center', isCurrency: true },
      { key: 'costPerAcre', label: 'COST / ACRE (₹/ACRE)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'status', label: 'BENCHMARK', align: 'center', isBadge: true, width: '120px' }
    ]
  },
  {
    id: 'acre-wise-revenue',
    route: 'acre-wise-revenue',
    name: 'Acre-wise Revenue',
    category: 'agriculture',
    iconName: 'Ruler',
    description: 'Gross and net returns realized per acre of land, identifying the highest-yielding commercial acreage.',
    endpoint: '/api/sales',
    fallbackReason: 'Computed per-acre gross and net revenues from crop sales and acreage.',
    defaultFilters: {
      farm: '',
      crop: '',
      season: ''
    },
    filterConfig: [
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] },
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize'] },
      { key: 'season', label: 'Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid'] }
    ],
    columns: [
      { key: 'farm', label: 'FARM / PLOT', align: 'left' },
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'season', label: 'SEASON', align: 'center', width: '100px' },
      { key: 'area', label: 'AREA (ACRES)', align: 'center', width: '110px' },
      { key: 'totalRevenue', label: 'TOTAL REVENUE (₹)', align: 'center', isCurrency: true },
      { key: 'revPerAcre', label: 'REVENUE / ACRE (₹/ACRE)', align: 'center', isCurrency: true },
      { key: 'profitPerAcre', label: 'PROFIT / ACRE (₹/ACRE)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'yield-report',
    route: 'yield-report',
    name: 'Yield Report',
    category: 'agriculture',
    iconName: 'Wheat',
    description: 'Harvested volume tracking, productivity benchmarks per acre (Quintals/Acre), and produce quality grading.',
    endpoint: '/api/crops',
    fallbackReason: 'Agronomic harvest telemetry and yield productivity statistics.',
    defaultFilters: {
      crop: '',
      farm: '',
      season: '',
      year: '2026'
    },
    filterConfig: [
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane', 'Maize'] },
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] },
      { key: 'season', label: 'Season', type: 'select', options: ['All Seasons', 'Kharif', 'Rabi', 'Zaid'] },
      { key: 'year', label: 'Year', type: 'select', options: ['2026', '2025', '2024'] }
    ],
    columns: [
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'farm', label: 'FARM / PLOT', align: 'left' },
      { key: 'season', label: 'SEASON', align: 'center', width: '100px' },
      { key: 'area', label: 'AREA (ACRES)', align: 'center', width: '110px' },
      { key: 'totalYield', label: 'HARVEST (QTL)', align: 'center', width: '130px' },
      { key: 'yieldPerAcre', label: 'YIELD / ACRE (QTL/ACRE)', align: 'center', width: '160px', isHighlight: true },
      { key: 'grade', label: 'QUALITY GRADE', align: 'center', width: '120px' },
      { key: 'status', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },
  {
    id: 'labour-cost-report',
    route: 'labour-cost-report',
    name: 'Labour Cost Report',
    category: 'agriculture',
    iconName: 'Users',
    description: 'Workforce expenditures, man-days, gender wage parity, and operational activity allocation breakdown.',
    endpoint: '/api/labour',
    fallbackReason: 'Aggregated labour attendance and field activity muster logs.',
    defaultFilters: {
      farm: '',
      crop: '',
      activity: '',
      fromDate: '',
      toDate: ''
    },
    filterConfig: [
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] },
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane'] },
      { key: 'activity', label: 'Activity', type: 'select', options: ['All Activities', 'Sowing / Planting', 'Weeding', 'Spraying', 'Harvesting', 'Irrigation'] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    columns: [
      { key: 'date', label: 'DATE', align: 'center', width: '110px' },
      { key: 'farm', label: 'FARM', align: 'left' },
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'activity', label: 'FIELD ACTIVITY', align: 'left' },
      { key: 'menCount', label: 'MEN', align: 'center', width: '70px' },
      { key: 'womenCount', label: 'WOMEN', align: 'center', width: '70px' },
      { key: 'totalHours', label: 'HOURS', align: 'center', width: '80px' },
      { key: 'avgRate', label: 'AVG WAGE (₹)', align: 'center', isCurrency: true, width: '110px' },
      { key: 'totalCost', label: 'TOTAL WAGES (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'input-cost-report',
    route: 'input-cost-report',
    name: 'Input Cost Report',
    category: 'agriculture',
    iconName: 'Package',
    description: 'Field consumption cost of fertilizers, seeds, fungicides, bio-stimulants, and crop protection chemicals.',
    endpoint: '/api/inventory/stock-out',
    fallbackReason: 'Direct input issue logs and consumption transactions from store.',
    defaultFilters: {
      category: '',
      farm: '',
      crop: '',
      fromDate: '',
      toDate: ''
    },
    filterConfig: [
      { key: 'category', label: 'Input Category', type: 'select', options: ['All Categories', 'Fertilizer', 'Pesticide', 'Seed', 'Bio-Nutrient'] },
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] },
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane'] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    columns: [
      { key: 'date', label: 'DATE', align: 'center', width: '110px' },
      { key: 'itemName', label: 'INPUT / ITEM NAME', align: 'left' },
      { key: 'category', label: 'CATEGORY', align: 'left' },
      { key: 'farm', label: 'FARM', align: 'left' },
      { key: 'crop', label: 'CROP', align: 'left' },
      { key: 'qty', label: 'QUANTITY', align: 'center', width: '110px' },
      { key: 'unitRate', label: 'UNIT RATE (₹)', align: 'center', isCurrency: true, width: '120px' },
      { key: 'totalCost', label: 'TOTAL COST (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'machinery-cost-report',
    route: 'machinery-cost-report',
    name: 'Machinery Cost Report',
    category: 'agriculture',
    iconName: 'Tractor',
    description: 'Equipment diesel consumption, servicing bills, operator charges, and operational hour utilization.',
    endpoint: '/api/Machinery/expenses',
    fallbackReason: 'Direct telemetry from Machinery & Equipment module expense registers.',
    defaultFilters: {
      machineType: '',
      fromDate: '',
      toDate: ''
    },
    filterConfig: [
      { key: 'machineType', label: 'Machine Type', type: 'select', options: ['All Types', 'Tractor', 'Power Tiller', 'Sprayer', 'Harvester', 'Rotavator'] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    columns: [
      { key: 'machineCode', label: 'CODE', align: 'center', width: '100px' },
      { key: 'machineName', label: 'MACHINE NAME', align: 'left' },
      { key: 'type', label: 'TYPE', align: 'center', width: '110px' },
      { key: 'hoursRun', label: 'HOURS OPERATED', align: 'center', width: '130px' },
      { key: 'fuelConsumed', label: 'DIESEL (LTRS)', align: 'center', width: '120px' },
      { key: 'fuelCost', label: 'FUEL COST (₹)', align: 'center', isCurrency: true },
      { key: 'maintenance', label: 'MAINTENANCE (₹)', align: 'center', isCurrency: true },
      { key: 'totalCost', label: 'TOTAL COST (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },

  // ── 3. Inventory Reports (5) ──────────────────────────────────────────────
  {
    id: 'stock-report',
    route: 'stock-report',
    name: 'Stock Report',
    category: 'inventory',
    iconName: 'Boxes',
    description: 'Warehouse item balances, reorder thresholds, inventory valuation, and on-hand supply visibility.',
    endpoint: '/api/inventory',
    fallbackReason: 'Live backend endpoint /api/inventory with stock balances and valuation.',
    defaultFilters: {
      category: '',
      status: ''
    },
    filterConfig: [
      { key: 'category', label: 'Product Category', type: 'select', options: ['All Categories', 'Fertilizer', 'Pesticide', 'Seed', 'Equipment Spares', 'Fuel'] },
      { key: 'status', label: 'Stock Status', type: 'select', options: ['All Statuses', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'] }
    ],
    columns: [
      { key: 'itemCode', label: 'ITEM CODE', align: 'center', width: '110px' },
      { key: 'itemName', label: 'PRODUCT / MATERIAL', align: 'left' },
      { key: 'category', label: 'CATEGORY', align: 'left' },
      { key: 'unit', label: 'UNIT', align: 'center', width: '90px' },
      { key: 'availableQty', label: 'ON-HAND QTY', align: 'center', width: '120px' },
      { key: 'reorderLevel', label: 'MIN LEVEL', align: 'center', width: '100px' },
      { key: 'unitPrice', label: 'UNIT RATE (₹)', align: 'center', isCurrency: true, width: '120px' },
      { key: 'valuation', label: 'VALUATION (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'status', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },
  {
    id: 'stock-ledger',
    route: 'stock-ledger',
    name: 'Stock Ledger',
    category: 'inventory',
    iconName: 'ClipboardList',
    description: 'Audit complete historical material movements with chronological opening, stock in, stock out, and balance.',
    endpoint: '/api/inventory/ledger',
    fallbackReason: 'Live backend endpoint /api/inventory/ledger tracking FIFO/batch stock movements.',
    defaultFilters: {
      product: '',
      movementType: '',
      fromDate: '',
      toDate: ''
    },
    filterConfig: [
      { key: 'product', label: 'Product', type: 'select', options: ['All Products', 'NPK 19:19:19 Fertilizer', 'Urea 46% Nitrogen', 'BT Cotton Hybrid Seeds', 'Neem Oil 1500 PPM', 'DAP Di-Ammonium Phosphate'] },
      { key: 'movementType', label: 'Movement Type', type: 'select', options: ['All Movements', 'Stock In (Purchase)', 'Stock Out (Field Issue)', 'Stock Adjustment', 'Transfer'] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    columns: [
      { key: 'date', label: 'DATE', align: 'center', width: '110px' },
      { key: 'product', label: 'MATERIAL NAME', align: 'left' },
      { key: 'movementType', label: 'TYPE', align: 'center', width: '110px' },
      { key: 'refNo', label: 'REFERENCE', align: 'center', width: '130px' },
      { key: 'openingQty', label: 'OPENING', align: 'center', width: '100px' },
      { key: 'qtyIn', label: 'STOCK IN', align: 'center', width: '100px' },
      { key: 'qtyOut', label: 'STOCK OUT', align: 'center', width: '100px' },
      { key: 'closingQty', label: 'CLOSING BALANCE', align: 'center', width: '130px', isHighlight: true },
      { key: 'remarks', label: 'REMARKS / STORE', align: 'left' }
    ]
  },
  {
    id: 'purchase-report',
    route: 'purchase-report',
    name: 'Purchase Report',
    category: 'inventory',
    iconName: 'ShoppingCart',
    description: 'Procurement bills audit, vendor deliveries, purchase quantities, and inward item unit prices.',
    endpoint: '/api/purchases',
    fallbackReason: 'Connected to live /api/purchases and inventory inward vouchers.',
    defaultFilters: {
      supplier: '',
      category: '',
      fromDate: '',
      toDate: ''
    },
    filterConfig: [
      { key: 'supplier', label: 'Supplier / Vendor', type: 'select', options: ['All Suppliers', 'IFFCO Fertilizer Outlet', 'Mahyco Seed Depot', 'Rasi Agro Chemicals', 'Jai Kisan Tractor Spares'] },
      { key: 'category', label: 'Category', type: 'select', options: ['All Categories', 'Fertilizer', 'Pesticide', 'Seed', 'Machinery Spares'] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    columns: [
      { key: 'date', label: 'PURCHASE DATE', align: 'center', width: '120px' },
      { key: 'poNo', label: 'PO / BILL NO', align: 'center', width: '130px' },
      { key: 'supplier', label: 'SUPPLIER NAME', align: 'left' },
      { key: 'item', label: 'ITEM PURCHASED', align: 'left' },
      { key: 'qty', label: 'QUANTITY', align: 'center', width: '110px' },
      { key: 'unitRate', label: 'UNIT RATE (₹)', align: 'center', isCurrency: true, width: '120px' },
      { key: 'totalAmount', label: 'TOTAL AMOUNT (₹)', align: 'center', isCurrency: true, isHighlight: true },
      { key: 'paymentStatus', label: 'STATUS', align: 'center', isBadge: true, width: '110px' }
    ]
  },
  {
    id: 'consumption-report',
    route: 'consumption-report',
    name: 'Consumption Report',
    category: 'inventory',
    iconName: 'PackageMinus',
    description: 'Warehouse issues to fields, crop nutrient applications, and chemical dose utilization logs.',
    endpoint: '/api/inventory/stock-out',
    fallbackReason: 'Direct outward goods issue notes and farm plot application vouchers.',
    defaultFilters: {
      farm: '',
      crop: '',
      category: '',
      fromDate: '',
      toDate: ''
    },
    filterConfig: [
      { key: 'farm', label: 'Farm', type: 'select', options: ['All Farms', 'Green Valley Farm', 'Sunrise Acres', 'Riverbank Farm'] },
      { key: 'crop', label: 'Crop', type: 'select', options: ['All Crops', 'Cotton', 'Paddy', 'Chilli', 'Sugarcane'] },
      { key: 'category', label: 'Category', type: 'select', options: ['All Categories', 'Fertilizer', 'Pesticide', 'Seed', 'Bio-Nutrient'] },
      { key: 'fromDate', label: 'From Date', type: 'date' },
      { key: 'toDate', label: 'To Date', type: 'date' }
    ],
    columns: [
      { key: 'date', label: 'ISSUE DATE', align: 'center', width: '110px' },
      { key: 'issueNo', label: 'ISSUE NO', align: 'center', width: '120px' },
      { key: 'farm', label: 'DESTINATION FARM', align: 'left' },
      { key: 'crop', label: 'TARGET CROP', align: 'left' },
      { key: 'item', label: 'MATERIAL ISSUED', align: 'left' },
      { key: 'qty', label: 'QUANTITY', align: 'center', width: '110px' },
      { key: 'costRate', label: 'COST RATE (₹)', align: 'center', isCurrency: true, width: '120px' },
      { key: 'totalValue', label: 'TOTAL VALUE (₹)', align: 'center', isCurrency: true, isHighlight: true }
    ]
  },
  {
    id: 'low-stock',
    route: 'low-stock',
    name: 'Low Stock Report',
    category: 'inventory',
    iconName: 'TriangleAlert',
    description: 'Immediate replenishment alarms for raw materials, fertilizers, and spares reaching critical minimums.',
    endpoint: '/api/inventory/low-stock',
    fallbackReason: 'Live backend endpoint /api/inventory/low-stock tracking reorder safety thresholds.',
    defaultFilters: {
      category: '',
      severity: ''
    },
    filterConfig: [
      { key: 'category', label: 'Category', type: 'select', options: ['All Categories', 'Fertilizer', 'Pesticide', 'Seed', 'Spares'] },
      { key: 'severity', label: 'Stock Urgency', type: 'select', options: ['All Urgencies', 'Critical (< 50% min)', 'Warning (Below Min)', 'Depleted (Zero)'] }
    ],
    columns: [
      { key: 'itemCode', label: 'ITEM CODE', align: 'center', width: '110px' },
      { key: 'itemName', label: 'PRODUCT / MATERIAL', align: 'left' },
      { key: 'category', label: 'CATEGORY', align: 'left' },
      { key: 'availableQty', label: 'CURRENT STOCK', align: 'center', width: '130px' },
      { key: 'reorderLevel', label: 'MIN REORDER', align: 'center', width: '120px' },
      { key: 'deficit', label: 'DEFICIT QTY', align: 'center', width: '120px' },
      { key: 'leadTime', label: 'LEAD TIME (DAYS)', align: 'center', width: '140px' },
      { key: 'status', label: 'URGENCY', align: 'center', isBadge: true, width: '110px' }
    ]
  }
];

export const getReportById = (idOrRoute) => {
  if (!idOrRoute) return null;
  const normalized = String(idOrRoute).toLowerCase().trim().replace(/^reports[\/:]?/, '');
  return REPORTS_CATALOG.find((r) => r.id === normalized || r.route === normalized || r.name.toLowerCase() === normalized) || null;
};
