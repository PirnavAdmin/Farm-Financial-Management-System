import {
  DEFAULT_CROPS,
  DEFAULT_FARMS,
  DEFAULT_INVENTORY_PRODUCTS,
  DEFAULT_PURCHASES,
  DEFAULT_STOCK_ADJUSTMENT,
  DEFAULT_STOCK_IN,
  DEFAULT_STOCK_LEDGER,
  DEFAULT_STOCK_OUT
} from './mockInventoryData.js'

const STORAGE_KEYS = {
  Purchases: 'agriman_local_purchases_v2',
  'Stock In': 'agriman_local_stock_in_v2',
  'Stock Out': 'agriman_local_stock_out_v2',
  'Stock Adjustment': 'agriman_local_stock_adjustment_v2',
  'Stock Ledger': 'agriman_local_stock_ledger_v2',
  Inventory: 'agriman_local_inventory_products_v2',
  Farms: 'agriman_local_farms_v2',
  Crops: 'agriman_local_crops_v2'
}

const DEFAULT_MAP = {
  Purchases: DEFAULT_PURCHASES,
  'Stock In': DEFAULT_STOCK_IN,
  'Stock Out': DEFAULT_STOCK_OUT,
  'Stock Adjustment': DEFAULT_STOCK_ADJUSTMENT,
  'Stock Ledger': DEFAULT_STOCK_LEDGER,
  Inventory: DEFAULT_INVENTORY_PRODUCTS,
  Farms: DEFAULT_FARMS,
  Crops: DEFAULT_CROPS
}

let memoryStore = {}

function safeGet(key, fallback) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    }
  } catch (err) {
    console.warn(`[LocalStore] Failed reading ${key}:`, err)
  }
  if (memoryStore[key] && Array.isArray(memoryStore[key]) && memoryStore[key].length > 0) {
    return memoryStore[key]
  }
  return fallback
}

function safeSet(key, value) {
  memoryStore[key] = value
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  } catch (err) {
    console.warn(`[LocalStore] Failed writing ${key}:`, err)
  }
}

export function getLocalRecords(screen) {
  const key = STORAGE_KEYS[screen]
  const defaults = DEFAULT_MAP[screen] || []
  if (!key) return defaults
  const current = safeGet(key, null)
  if (!current) {
    safeSet(key, defaults)
    return defaults
  }
  return current
}

export function setLocalRecords(screen, records) {
  const key = STORAGE_KEYS[screen]
  if (key) safeSet(key, records)
}

export function getLocalInventory() {
  return safeGet(STORAGE_KEYS.Inventory, DEFAULT_INVENTORY_PRODUCTS)
}

export function getLocalFarms() {
  return safeGet(STORAGE_KEYS.Farms, DEFAULT_FARMS)
}

export function getLocalCrops() {
  return safeGet(STORAGE_KEYS.Crops, DEFAULT_CROPS)
}

export function addLocalPurchase(values, farms, crops, inventory) {
  const current = getLocalRecords('Purchases')
  const nextId = String(
    current.reduce((max, item) => Math.max(max, Number(item['Purchase No'] || item._raw?.purchaseId || 0)), 0) + 1
  )

  const newRecord = {
    'Purchase No': nextId,
    'Purchase Date': values['Purchase Date'] || new Date().toISOString().slice(0, 10),
    Supplier: values.Supplier || '',
    Farm: values.Farm || 'Sample Farm (Main Block)',
    Crop: values.Crop || 'Paddy (Rice)',
    Product: values.Product || '',
    Quantity: Number(values.Quantity) || 0,
    Rate: Number(values.Rate) || 0,
    Discount: values.Discount || '—',
    Tax: values.Tax || '—',
    Total: Number(values.Total) || (Number(values.Quantity) || 0) * (Number(values.Rate) || 0),
    'Payment Status': values['Payment Status'] || 'Pending',
    Remarks: values.Remarks || values.Description || '',
    _raw: {
      purchaseId: Number(nextId),
      itemName: values.Product,
      supplierName: values.Supplier,
      farmId: 1,
      quantity: Number(values.Quantity) || 0,
      unitPrice: Number(values.Rate) || 0,
      totalAmount: Number(values.Total) || 0,
      purchaseDate: `${values['Purchase Date'] || new Date().toISOString().slice(0, 10)}T00:00:00`,
      status: values['Payment Status'] === 'Paid' ? 'Completed' : (values['Payment Status'] || 'Pending'),
      description: values.Remarks || values.Description || ''
    }
  }

  const updated = [newRecord, ...current]
  setLocalRecords('Purchases', updated)
  return newRecord
}

export function updateLocalPurchase(purchaseId, values) {
  const current = getLocalRecords('Purchases')
  const strId = String(purchaseId)

  const updated = current.map((rec) => {
    const recId = String(rec['Purchase No'] || rec._raw?.purchaseId)
    if (recId !== strId) return rec

    return {
      ...rec,
      'Purchase Date': values['Purchase Date'] || rec['Purchase Date'],
      Supplier: values.Supplier !== undefined ? values.Supplier : rec.Supplier,
      Farm: values.Farm !== undefined ? values.Farm : rec.Farm,
      Crop: values.Crop !== undefined ? values.Crop : rec.Crop,
      Product: values.Product !== undefined ? values.Product : rec.Product,
      Quantity: values.Quantity !== undefined ? Number(values.Quantity) : rec.Quantity,
      Rate: values.Rate !== undefined ? Number(values.Rate) : rec.Rate,
      Discount: values.Discount !== undefined ? values.Discount : rec.Discount,
      Tax: values.Tax !== undefined ? values.Tax : rec.Tax,
      Total: values.Total !== undefined ? Number(values.Total) : rec.Total,
      'Payment Status': values['Payment Status'] || rec['Payment Status'],
      Remarks: values.Remarks !== undefined ? values.Remarks : rec.Remarks,
      _raw: {
        ...(rec._raw || {}),
        purchaseId: Number(purchaseId),
        itemName: values.Product || rec.Product,
        supplierName: values.Supplier || rec.Supplier,
        quantity: Number(values.Quantity) || rec.Quantity,
        unitPrice: Number(values.Rate) || rec.Rate,
        totalAmount: Number(values.Total) || rec.Total,
        purchaseDate: `${values['Purchase Date'] || rec['Purchase Date']}T00:00:00`,
        status: values['Payment Status'] === 'Paid' ? 'Completed' : (values['Payment Status'] || 'Pending'),
        description: values.Remarks || values.Description || rec.Remarks
      }
    }
  })

  setLocalRecords('Purchases', updated)
  return updated
}

export function deleteLocalPurchase(purchaseId) {
  const current = getLocalRecords('Purchases')
  const strId = String(purchaseId)
  const updated = current.filter((rec) => String(rec['Purchase No'] || rec._raw?.purchaseId) !== strId)
  setLocalRecords('Purchases', updated)
  return updated
}

export function addLocalMovement(screen, values) {
  const current = getLocalRecords(screen)
  const prefix = screen === 'Stock In' ? 'STK-IN' : screen === 'Stock Out' ? 'STK-OUT' : 'ADJ'
  const nextNo = `${prefix}-${String(current.length + 1).padStart(3, '0')}`

  const newRecord = {
    'Transaction No': nextNo,
    'Adjustment No': nextNo,
    Date: values.Date || new Date().toISOString().slice(0, 10),
    Product: values.Product || '',
    Category: values.Category || 'General',
    Quantity: Number(values.Quantity) || 0,
    Unit: values.Unit || 'Unit',
    'Source / Supplier': values['Source / Supplier'] || '',
    'Farm / Warehouse': values['Farm / Warehouse'] || 'Sample Farm (Main Block)',
    'Reference No': values['Reference No'] || '',
    'Issued To': values['Issued To'] || '',
    Purpose: values.Purpose || '',
    Reason: values.Reason || '',
    'Adjustment Type': values['Adjustment Type'] || 'Increase',
    'Approved By': values['Approved By'] || 'Admin',
    Remarks: values.Remarks || '',
    _raw: { stockMovementId: nextNo }
  }

  const updated = [newRecord, ...current]
  setLocalRecords(screen, updated)
  return newRecord
}
