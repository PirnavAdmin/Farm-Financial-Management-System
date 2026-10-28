/**
 * Agricultural Inventory Mock & Local Development Data Source
 * Realistic agricultural sample records for offline development & demonstrations.
 */

export const DEFAULT_INVENTORY_PRODUCTS = [
  {
    inventoryId: 1,
    itemName: 'Rice Seeds (BPT 5204)',
    category: 'Seeds',
    quantity: 100,
    unit: 'Bag',
    minimumStockLevel: 20,
    supplier: 'ABC Seeds Supplier'
  },
  {
    inventoryId: 2,
    itemName: 'Fertilizer (DAP)',
    category: 'Fertilizers',
    quantity: 50,
    unit: 'Bag',
    minimumStockLevel: 15,
    supplier: 'Green Agro Supplies'
  },
  {
    inventoryId: 3,
    itemName: 'Pesticide (Monocrotophos)',
    category: 'Crop Protection',
    quantity: 40,
    unit: 'Litre',
    minimumStockLevel: 10,
    supplier: 'Farm Care Supplier'
  },
  {
    inventoryId: 4,
    itemName: 'Urea Fertilizer (45kg)',
    category: 'Fertilizers',
    quantity: 120,
    unit: 'Bag',
    minimumStockLevel: 25,
    supplier: 'GreenGrow Supplies'
  },
  {
    inventoryId: 5,
    itemName: 'Cotton Seeds (Bt-II)',
    category: 'Seeds',
    quantity: 35,
    unit: 'Bag',
    minimumStockLevel: 10,
    supplier: 'National Seeds Corp'
  },
  {
    inventoryId: 6,
    itemName: 'NPK 19-19-19 Complex',
    category: 'Fertilizers',
    quantity: 60,
    unit: 'Bag',
    minimumStockLevel: 15,
    supplier: 'Coromandel Agro'
  }
]

export const DEFAULT_FARMS = [
  { farmId: 1, farmName: 'Sample Farm (Main Block)', location: 'Visakhapatnam', farmArea: 10, areaUnit: 'Acres' },
  { farmId: 2, farmName: 'Green Valley Farm', location: 'Anakapalli', farmArea: 15, areaUnit: 'Acres' },
  { farmId: 3, farmName: 'Sunrise Agro Estate', location: 'Vizianagaram', farmArea: 25, areaUnit: 'Acres' }
]

export const DEFAULT_CROPS = [
  { cropId: 1, cropName: 'Paddy (Rice)', cropType: 'Cereal', farmId: 1 },
  { cropId: 2, cropName: 'Tomato', cropType: 'Vegetable', farmId: 1 },
  { cropId: 3, cropName: 'Chilli', cropType: 'Vegetable', farmId: 2 },
  { cropId: 4, cropName: 'Maize', cropType: 'Cereal', farmId: 2 },
  { cropId: 1005, cropName: 'Cotton', cropType: 'Commercial', farmId: 3 },
  { cropId: 1006, cropName: 'Groundnut', cropType: 'Oilseed', farmId: 3 },
  { cropId: 1007, cropName: 'Sugarcane', cropType: 'Commercial', farmId: 1 }
]

export const DEFAULT_PURCHASES = [
  {
    'Purchase No': '4',
    'Purchase Date': '2026-10-26',
    Supplier: 'GreenGrow Supplies',
    Farm: 'Sample Farm (Main Block)',
    Crop: 'Paddy (Rice)',
    Product: 'Urea Fertilizer (45kg)',
    Quantity: 10,
    Rate: 1500,
    Discount: '—',
    Tax: '5%',
    Total: 15000,
    'Payment Status': 'Paid',
    Remarks: '[Crop: Paddy (Rice)] Fertilizer purchase for paddy crop',
    _raw: {
      purchaseId: 4,
      itemName: 'Urea Fertilizer (45kg)',
      supplierName: 'GreenGrow Supplies',
      farmId: 1,
      inventoryId: 4,
      quantity: 10,
      receivedQuantity: 10,
      unit: 'Bag',
      unitPrice: 1500,
      totalAmount: 15000,
      purchaseDate: '2026-10-26T00:00:00',
      status: 'Completed',
      description: '[Crop: Paddy (Rice)] Fertilizer purchase for paddy crop'
    }
  },
  {
    'Purchase No': '3',
    'Purchase Date': '2026-10-18',
    Supplier: 'Farm Care Supplier',
    Farm: 'Sample Farm (Main Block)',
    Crop: 'Tomato',
    Product: 'Pesticide (Monocrotophos)',
    Quantity: 20,
    Rate: 250,
    Discount: '5%',
    Tax: '18%',
    Total: 5000,
    'Payment Status': 'Paid',
    Remarks: '[Crop: Tomato] Purchase of crop protection pesticide',
    _raw: {
      purchaseId: 3,
      itemName: 'Pesticide (Monocrotophos)',
      supplierName: 'Farm Care Supplier',
      farmId: 1,
      inventoryId: 3,
      quantity: 20,
      receivedQuantity: 20,
      unit: 'Litre',
      unitPrice: 250,
      totalAmount: 5000,
      purchaseDate: '2026-10-18T00:00:00',
      status: 'Completed',
      description: '[Crop: Tomato] Purchase of crop protection pesticide'
    }
  },
  {
    'Purchase No': '2',
    'Purchase Date': '2026-10-10',
    Supplier: 'Green Agro Supplies',
    Farm: 'Green Valley Farm',
    Crop: 'Maize',
    Product: 'Fertilizer (DAP)',
    Quantity: 50,
    Rate: 1350,
    Discount: '1000',
    Tax: '5%',
    Total: 67500,
    'Payment Status': 'Pending',
    Remarks: '[Crop: Maize] DAP fertilizer for upcoming rabi season',
    _raw: {
      purchaseId: 2,
      itemName: 'Fertilizer (DAP)',
      supplierName: 'Green Agro Supplies',
      farmId: 2,
      inventoryId: 2,
      quantity: 50,
      receivedQuantity: 0,
      unit: 'Bag',
      unitPrice: 1350,
      totalAmount: 67500,
      purchaseDate: '2026-10-10T00:00:00',
      status: 'Pending',
      description: '[Crop: Maize] DAP fertilizer for upcoming rabi season'
    }
  },
  {
    'Purchase No': '1',
    'Purchase Date': '2026-10-02',
    Supplier: 'ABC Seeds Supplier',
    Farm: 'Sample Farm (Main Block)',
    Crop: 'Paddy (Rice)',
    Product: 'Rice Seeds (BPT 5204)',
    Quantity: 100,
    Rate: 50,
    Discount: '—',
    Tax: '—',
    Total: 5000,
    'Payment Status': 'Paid',
    Remarks: '[Crop: Paddy (Rice)] Foundation seeds procurement for Kharif nursery',
    _raw: {
      purchaseId: 1,
      itemName: 'Rice Seeds (BPT 5204)',
      supplierName: 'ABC Seeds Supplier',
      farmId: 1,
      inventoryId: 1,
      quantity: 100,
      receivedQuantity: 100,
      unit: 'Bag',
      unitPrice: 50,
      totalAmount: 5000,
      purchaseDate: '2026-10-02T00:00:00',
      status: 'Completed',
      description: '[Crop: Paddy (Rice)] Foundation seeds procurement for Kharif nursery'
    }
  },
  {
    'Purchase No': '5',
    'Purchase Date': '2026-10-24',
    Supplier: 'National Seeds Corp',
    Farm: 'Sunrise Agro Estate',
    Crop: 'Cotton',
    Product: 'Cotton Seeds (Bt-II)',
    Quantity: 35,
    Rate: 850,
    Discount: '500',
    Tax: '—',
    Total: 29750,
    'Payment Status': 'Part Paid',
    Remarks: '[Crop: Cotton] High-germination hybrid Bt cotton seeds',
    _raw: {
      purchaseId: 5,
      itemName: 'Cotton Seeds (Bt-II)',
      supplierName: 'National Seeds Corp',
      farmId: 3,
      inventoryId: 5,
      quantity: 35,
      receivedQuantity: 0,
      unit: 'Bag',
      unitPrice: 850,
      totalAmount: 29750,
      purchaseDate: '2026-10-24T00:00:00',
      status: 'Part Paid',
      description: '[Crop: Cotton] High-germination hybrid Bt cotton seeds'
    }
  }
]

export const DEFAULT_STOCK_IN = [
  {
    'Transaction No': 'STK-IN-001',
    Date: '2026-10-26',
    Product: 'Urea Fertilizer (45kg)',
    Category: 'Fertilizers',
    Quantity: 10,
    Unit: 'Bag',
    'Source / Supplier': 'GreenGrow Supplies',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    'Reference No': 'PUR-0004',
    Remarks: 'Inward shipment verified and stacked in warehouse',
    _raw: { stockMovementId: 'STK-IN-001', movementType: 'StockIn' }
  },
  {
    'Transaction No': 'STK-IN-002',
    Date: '2026-10-18',
    Product: 'Pesticide (Monocrotophos)',
    Category: 'Crop Protection',
    Quantity: 20,
    Unit: 'Litre',
    'Source / Supplier': 'Farm Care Supplier',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    'Reference No': 'PUR-0003',
    Remarks: 'Stock received in good condition in chemical room',
    _raw: { stockMovementId: 'STK-IN-002', movementType: 'StockIn' }
  },
  {
    'Transaction No': 'STK-IN-003',
    Date: '2026-10-10',
    Product: 'Fertilizer (DAP)',
    Category: 'Fertilizers',
    Quantity: 50,
    Unit: 'Bag',
    'Source / Supplier': 'Green Agro Supplies',
    'Farm / Warehouse': 'Green Valley Farm',
    'Reference No': 'PUR-0002',
    Remarks: 'Bulk pre-season DAP procurement arrived',
    _raw: { stockMovementId: 'STK-IN-003', movementType: 'StockIn' }
  },
  {
    'Transaction No': 'STK-IN-004',
    Date: '2026-10-02',
    Product: 'Rice Seeds (BPT 5204)',
    Category: 'Seeds',
    Quantity: 100,
    Unit: 'Bag',
    'Source / Supplier': 'ABC Seeds Supplier',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    'Reference No': 'PUR-0001',
    Remarks: 'Certified foundation seeds batch received',
    _raw: { stockMovementId: 'STK-IN-004', movementType: 'StockIn' }
  }
]

export const DEFAULT_STOCK_OUT = [
  {
    'Transaction No': 'STK-OUT-001',
    Date: '2026-10-27',
    Product: 'Urea Fertilizer (45kg)',
    Category: 'Fertilizers',
    Quantity: 4,
    Unit: 'Bag',
    'Issued To': 'Ramu (Field Supervisor)',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    Purpose: 'Basal fertilizer dressing for Plot B',
    'Reference No': 'REQ-201',
    Remarks: 'Dispatched to North field paddy nursery',
    _raw: { stockMovementId: 'STK-OUT-001', movementType: 'StockOut' }
  },
  {
    'Transaction No': 'STK-OUT-002',
    Date: '2026-10-20',
    Product: 'Pesticide (Monocrotophos)',
    Category: 'Crop Protection',
    Quantity: 5,
    Unit: 'Litre',
    'Issued To': 'Suresh (Sprayer Lead)',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    Purpose: 'Tomato crop protection spray',
    'Reference No': 'REQ-202',
    Remarks: 'Preventive shoot borer spray applied',
    _raw: { stockMovementId: 'STK-OUT-002', movementType: 'StockOut' }
  },
  {
    'Transaction No': 'STK-OUT-003',
    Date: '2026-10-15',
    Product: 'Fertilizer (DAP)',
    Category: 'Fertilizers',
    Quantity: 10,
    Unit: 'Bag',
    'Issued To': 'Govind (Field Officer)',
    'Farm / Warehouse': 'Green Valley Farm',
    Purpose: 'Land preparation basal application',
    'Reference No': 'REQ-203',
    Remarks: 'Applied to Maize block pre-planting',
    _raw: { stockMovementId: 'STK-OUT-003', movementType: 'StockOut' }
  }
]

export const DEFAULT_STOCK_ADJUSTMENT = [
  {
    'Adjustment No': 'ADJ-001',
    Date: '2026-10-25',
    Product: 'Fertilizer (DAP)',
    'Adjustment Type': 'Decrease',
    Quantity: 2,
    Unit: 'Bag',
    Reason: 'Bag damage during warehouse handling',
    'Farm / Warehouse': 'Green Valley Farm',
    'Approved By': 'Farm Manager',
    'Reference No': 'AUD-901',
    _raw: { stockMovementId: 'ADJ-001', movementType: 'Adjustment' }
  },
  {
    'Adjustment No': 'ADJ-002',
    Date: '2026-10-22',
    Product: 'Urea Fertilizer (45kg)',
    'Adjustment Type': 'Increase',
    Quantity: 5,
    Unit: 'Bag',
    Reason: 'Physical audit surplus reconciliation',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    'Approved By': 'Senior Auditor',
    'Reference No': 'AUD-902',
    _raw: { stockMovementId: 'ADJ-002', movementType: 'Adjustment' }
  },
  {
    'Adjustment No': 'ADJ-003',
    Date: '2026-10-12',
    Product: 'Pesticide (Monocrotophos)',
    'Adjustment Type': 'Decrease',
    Quantity: 1,
    Unit: 'Litre',
    Reason: 'Container seal leakage write-off',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    'Approved By': 'Inventory Officer',
    'Reference No': 'AUD-903',
    _raw: { stockMovementId: 'ADJ-003', movementType: 'Adjustment' }
  }
]

export const DEFAULT_STOCK_LEDGER = [
  {
    Date: '2026-10-27',
    'Transaction Type': 'Stock Out',
    'Reference No': 'REQ-201',
    Product: 'Urea Fertilizer (45kg)',
    'Stock In': 0,
    'Stock Out': 4,
    Balance: 116,
    Unit: 'Bag',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    Remarks: 'Field issuance to Plot B'
  },
  {
    Date: '2026-10-26',
    'Transaction Type': 'Stock In',
    'Reference No': 'PUR-0004',
    Product: 'Urea Fertilizer (45kg)',
    'Stock In': 10,
    'Stock Out': 0,
    Balance: 120,
    Unit: 'Bag',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    Remarks: 'Inward from GreenGrow Supplies'
  },
  {
    Date: '2026-10-25',
    'Transaction Type': 'Adjustment',
    'Reference No': 'AUD-901',
    Product: 'Fertilizer (DAP)',
    'Stock In': 0,
    'Stock Out': 2,
    Balance: 48,
    Unit: 'Bag',
    'Farm / Warehouse': 'Green Valley Farm',
    Remarks: 'Warehouse damage deduction'
  },
  {
    Date: '2026-10-20',
    'Transaction Type': 'Stock Out',
    'Reference No': 'REQ-202',
    Product: 'Pesticide (Monocrotophos)',
    'Stock In': 0,
    'Stock Out': 5,
    Balance: 35,
    Unit: 'Litre',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    Remarks: 'Field spraying issuance'
  },
  {
    Date: '2026-10-18',
    'Transaction Type': 'Stock In',
    'Reference No': 'PUR-0003',
    Product: 'Pesticide (Monocrotophos)',
    'Stock In': 20,
    'Stock Out': 0,
    Balance: 40,
    Unit: 'Litre',
    'Farm / Warehouse': 'Sample Farm (Main Block)',
    Remarks: 'Inward from Farm Care Supplier'
  },
  {
    Date: '2026-10-10',
    'Transaction Type': 'Stock In',
    'Reference No': 'PUR-0002',
    Product: 'Fertilizer (DAP)',
    'Stock In': 50,
    'Stock Out': 0,
    Balance: 50,
    Unit: 'Bag',
    'Farm / Warehouse': 'Green Valley Farm',
    Remarks: 'Inward from Green Agro Supplies'
  }
]
