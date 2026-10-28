import api from './api'
import {
  addLocalMovement,
  addLocalPurchase,
  deleteLocalPurchase,
  getLocalCrops,
  getLocalFarms,
  getLocalInventory,
  getLocalRecords,
  setLocalRecords,
  updateLocalPurchase
} from '../Inventory/localInventoryStore.js'

const routes = {
  'Stock In': 'StockIn',
  'Stock Out': 'StockOut',
  'Stock Adjustment': 'StockAdjustment',
  'Stock Ledger': 'StockLedger',
  Purchases: 'Purchases'
}

const options = (timeout = 2500) => {
  const token = localStorage.getItem('agriman_access_token') || sessionStorage.getItem('agriman_access_token')
  const baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_INVENTORY_API_URL || api.defaults.baseURL)
  return {
    baseURL,
    timeout,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }
}

export function unwrapList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  const candidate = value?.data?.items ?? value?.data ?? value?.items
  if (Array.isArray(candidate)) return candidate

  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value.stockMovementId !== undefined || value.inventoryId !== undefined || value.purchaseId !== undefined) {
      return [value]
    }
    if (value.data && typeof value.data === 'object') {
      if (Array.isArray(value.data)) return value.data
      if (value.data.stockMovementId !== undefined || value.data.inventoryId !== undefined || value.data.purchaseId !== undefined) {
        return [value.data]
      }
    }
  }
  return []
}

function extractCrop(description, cropList = []) {
  if (!description) return ''
  const tagMatch = description.match(/\[Crop:\s*([^\]]+)\]/i)
  if (tagMatch) return tagMatch[1].trim()
  const lower = description.toLowerCase()
  for (const c of cropList) {
    const rawName = (c.cropName || '').toLowerCase()
    if (!rawName) continue
    if (lower.includes(rawName)) return c.cropName
    const tokens = rawName.split(/[\s()/]+/).filter((t) => t.length > 2)
    for (const t of tokens) {
      if (lower.includes(t)) return c.cropName
    }
  }
  return ''
}

function extractTag(description, tagName) {
  if (!description) return ''
  const match = description.match(new RegExp(`\\[${tagName}:\\s*([^\\]]+)\\]`, 'i'))
  return match ? match[1].trim() : ''
}

export async function loadInventory(screen) {
  let isBackendWorking = false
  let backendRecords = []
  let inventory = []
  let crops = []

  try {
    const [response, inventoryResponse, cropResponse] = await Promise.all([
      api.get(`/api/${routes[screen]}`, options(2500)),
      api.get('/api/Inventory', options(2500)).catch(() => ({ data: [] })),
      api.get('/api/Crop', options(2500)).catch(() => ({ data: [] }))
    ])

    const unwrapped = unwrapList(response.data)
    if (Array.isArray(unwrapped) && unwrapped.length > 0) {
      backendRecords = unwrapped
      inventory = unwrapList(inventoryResponse.data)
      crops = unwrapList(cropResponse.data)
      isBackendWorking = true
    }
  } catch (err) {
    // API offline, tunnel closed, or 404/502/ERR_NGROK_3200
    isBackendWorking = false
  }

  // If live backend responded with records, map and return them
  if (isBackendWorking && backendRecords.length > 0) {
    const farmMap = new Map()
    crops.forEach((c) => {
      if (c.farm && c.farm.farmId) {
        farmMap.set(c.farm.farmId, c.farm.farmName || `Farm #${c.farm.farmId}`)
      } else if (c.farmId) {
        farmMap.set(c.farmId, c.farmName || `Farm #${c.farmId}`)
      }
    })
    if (farmMap.size === 0) farmMap.set(1, 'Sample Farm')
    const farms = Array.from(farmMap.entries()).map(([farmId, farmName]) => ({ farmId, farmName }))

    const records = backendRecords.map((row) => {
      const item = inventory.find((entry) => entry.inventoryId === row.inventoryId)
      const type = row.movementType
      const detectedCrop = extractCrop(row.description, crops) || row.cropName || ''
      const detectedFarm = row.farmName || (row.farmId ? (farmMap.get(row.farmId) || `Farm #${row.farmId}`) : '')
      const detectedDiscount = (row.discount !== undefined && row.discount !== null && row.discount !== '') ? row.discount : extractTag(row.description, 'Discount')
      const detectedTax = (row.tax !== undefined && row.tax !== null && row.tax !== '') ? row.tax : extractTag(row.description, 'Tax')

      return {
        'Transaction No': row.stockMovementId,
        'Adjustment No': row.stockMovementId,
        Date: row.movementDate?.slice(0, 10) ?? '',
        Product: row.itemName ?? item?.itemName ?? '',
        Category: row.category ?? item?.category ?? 'General',
        Quantity: Math.abs(row.quantity ?? 0),
        Unit: row.unit ?? item?.unit ?? '',
        'Source / Supplier': row.supplierName ?? item?.supplier ?? '',
        'Reference No': row.referenceNumber ?? '',
        Remarks: row.description ?? '',
        Reason: row.description ?? '',
        'Adjustment Type': row.newQuantity < row.previousQuantity ? 'Decrease' : 'Increase',
        'Transaction Type': ({ StockIn: 'Stock In', StockOut: 'Stock Out', Adjustment: 'Adjustment' })[type] ?? type ?? '',
        'Stock In': type === 'StockIn' ? row.quantity : 0,
        'Stock Out': type === 'StockOut' ? row.quantity : 0,
        Balance: row.newQuantity ?? '',
        'Purchase No': row.purchaseId,
        'Purchase Date': row.purchaseDate?.slice(0, 10) ?? '',
        Supplier: row.supplierName ?? item?.supplier ?? '',
        Farm: detectedFarm || '\u2014',
        Crop: detectedCrop || '\u2014',
        Rate: row.unitPrice !== undefined && row.unitPrice !== null ? row.unitPrice : '',
        Discount: detectedDiscount || '\u2014',
        Tax: detectedTax || '\u2014',
        Total: row.totalAmount !== undefined && row.totalAmount !== null ? row.totalAmount : '',
        'Payment Status': row.status === 'Completed' ? 'Paid' : (row.status || 'Pending'),
        Status: row.status || 'Pending',
        _raw: row,
      }
    })

    // Cache to local store
    setLocalRecords(screen, records)

    return { records, inventory, farms, crops, isLocalFallback: false }
  }

  // Fallback to local development data source
  try {
    const localRecords = getLocalRecords(screen)
    const localInventory = getLocalInventory()
    const localFarms = getLocalFarms()
    const localCrops = getLocalCrops()

    return {
      records: localRecords,
      inventory: localInventory,
      farms: localFarms,
      crops: localCrops,
      isLocalFallback: true
    }
  } catch (err) {
    throw new Error(`Failed to load local data: ${err.message}`)
  }
}

export async function createPurchase(values, inventory, farms, crops) {
  const item = inventory.find((entry) => String(entry.inventoryId) === values.Product || entry.itemName === values.Product) || {}
  const quantity = Number(values.Quantity)
  const unitPrice = Number(values.Rate)
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error('Enter a positive quantity and a valid non-negative rate.')
  }
  if (!values['Purchase Date'] || Number.isNaN(Date.parse(values['Purchase Date']))) {
    throw new Error('Enter a valid purchase date.')
  }

  let farmId = null
  if (values.Farm && values.Farm !== '\u2014' && values.Farm !== '-') {
    const matchedFarm = farms.find((f) => String(f.farmId) === values.Farm || f.farmName === values.Farm)
    farmId = matchedFarm ? matchedFarm.farmId : (Number(values.Farm) || null)
  }

  const descriptionParts = []
  if (values.Crop && values.Crop !== '\u2014' && values.Crop !== '-') {
    descriptionParts.push(`[Crop: ${values.Crop}]`)
  }
  if (values.Discount && values.Discount !== '\u2014' && values.Discount !== '-') {
    descriptionParts.push(`[Discount: ${values.Discount}]`)
  }
  if (values.Tax && values.Tax !== '\u2014' && values.Tax !== '-') {
    descriptionParts.push(`[Tax: ${values.Tax}]`)
  }
  const cleanRemarks = (values.Remarks || values.Description || '').replace(/\[(Crop|Discount|Tax):[^\]]+\]/gi, '').trim()
  if (cleanRemarks) descriptionParts.push(cleanRemarks)
  const description = descriptionParts.join(' ') || null

  const status = values['Payment Status'] === 'Paid' ? 'Completed' : (values['Payment Status'] || 'Pending')

  const payload = {
    itemName: item.itemName || values.Product,
    inventoryId: item.inventoryId || null,
    unit: item.unit || values.Unit || 'Unit',
    supplierName: values.Supplier || null,
    farmId,
    quantity,
    unitPrice,
    totalAmount: quantity * unitPrice,
    purchaseDate: `${values['Purchase Date']}T00:00:00`,
    status,
    description,
  }

  try {
    const res = await api.post('/api/Purchases', payload, options(3000))
    return res.data
  } catch (err) {
    // Save to local development data source
    return addLocalPurchase(values, farms, crops, inventory)
  }
}

export async function updatePurchase(purchaseId, values, inventory, farms, crops, rawRecord) {
  const item = inventory.find((entry) => String(entry.inventoryId) === values.Product || entry.itemName === values.Product) || {}
  const quantity = Number(values.Quantity)
  const unitPrice = Number(values.Rate)
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new Error('Enter a positive quantity and a valid non-negative rate.')
  }
  if (!values['Purchase Date'] || Number.isNaN(Date.parse(values['Purchase Date']))) {
    throw new Error('Enter a valid purchase date.')
  }

  let farmId = null
  if (values.Farm && values.Farm !== '\u2014' && values.Farm !== '-') {
    const matchedFarm = farms.find((f) => String(f.farmId) === values.Farm || f.farmName === values.Farm)
    farmId = matchedFarm ? matchedFarm.farmId : (Number(values.Farm) || null)
  }

  const descriptionParts = []
  if (values.Crop && values.Crop !== '\u2014' && values.Crop !== '-') {
    descriptionParts.push(`[Crop: ${values.Crop}]`)
  }
  if (values.Discount && values.Discount !== '\u2014' && values.Discount !== '-') {
    descriptionParts.push(`[Discount: ${values.Discount}]`)
  }
  if (values.Tax && values.Tax !== '\u2014' && values.Tax !== '-') {
    descriptionParts.push(`[Tax: ${values.Tax}]`)
  }
  const cleanRemarks = (values.Remarks || values.Description || rawRecord?.description || '').replace(/\[(Crop|Discount|Tax):[^\]]+\]/gi, '').trim()
  if (cleanRemarks) descriptionParts.push(cleanRemarks)
  const description = descriptionParts.join(' ') || null

  const status = values['Payment Status'] === 'Paid' ? 'Completed' : (values['Payment Status'] || 'Pending')
  const purchaseDate = values['Purchase Date'].includes('T') ? values['Purchase Date'] : `${values['Purchase Date']}T00:00:00`

  const payload = {
    purchaseId: Number(purchaseId),
    itemName: item.itemName || values.Product || rawRecord?.itemName || 'Product',
    supplierName: values.Supplier || rawRecord?.supplierName || null,
    farmId,
    inventoryId: item.inventoryId || rawRecord?.inventoryId || null,
    quantity,
    receivedQuantity: rawRecord?.receivedQuantity ?? quantity,
    unit: item.unit || values.Unit || rawRecord?.unit || 'Unit',
    unitPrice,
    totalAmount: quantity * unitPrice,
    purchaseDate,
    status,
    description,
    createdAt: rawRecord?.createdAt || new Date().toISOString()
  }

  try {
    await api.put(`/api/Purchases/${purchaseId}`, payload, options(3000))
  } catch (err) {
    // Update local development store
    updateLocalPurchase(purchaseId, values)
  }
}

export async function deletePurchase(purchaseId) {
  try {
    await api.delete(`/api/Purchases/${purchaseId}`, options(3000))
  } catch (err) {
    // Delete from local development store
    deleteLocalPurchase(purchaseId)
  }
}

export function buildMovement(screen, values, inventory) {
  const matches = inventory.filter((item) => String(item.inventoryId) === values.Product || item.itemName === values.Product)
  if (matches.length !== 1) throw new Error('Select a product from inventory. Products with the same name must be selected by their inventory ID.')
  const item = matches[0]
  const quantity = Number(values.Quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be greater than zero.')
  if (!values.Date || Number.isNaN(Date.parse(values.Date))) throw new Error('Enter a valid transaction date.')
  if (screen === 'Stock Out' && quantity > item.quantity) throw new Error('Quantity exceeds the available stock.')
  const unsupported = ['Category', 'Issued To', 'Farm / Warehouse', 'Purpose', 'Approved By']
  const entered = unsupported.filter((field) => values[field]?.trim())
  if (entered.length) throw new Error(`The API cannot save these fields yet: ${entered.join(', ')}.`)
  if (values.Unit && values.Unit.toLowerCase() !== item.unit?.toLowerCase()) throw new Error(`This product uses ${item.unit}. Unit conversion is not supported by the API.`)
  if (screen === 'Stock In' && values['Source / Supplier'] && values['Source / Supplier'] !== item.supplier) throw new Error('The stock API cannot save a different supplier for this transaction.')
  return {
    inventoryId: item.inventoryId,
    movementType: screen === 'Stock In' ? 'StockIn' : 'StockOut',
    quantity,
    movementDate: `${values.Date}T00:00:00`,
    referenceNumber: values['Reference No'] || null,
    description: values.Remarks || null,
    createdBy: localStorage.getItem('agriman_user_name') || sessionStorage.getItem('agriman_user_name') || null,
  }
}

export async function createMovement(screen, values, inventory) {
  if (screen === 'Stock Ledger') throw new Error('The ledger is generated by stock movements. A ledger creation API is not available.')
  if (screen === 'Stock Adjustment') throw new Error('Adjustment creation needs backend confirmation: does quantity mean a signed change or the final stock count?')
  try {
    await api.post(`/api/${routes[screen]}`, buildMovement(screen, values, inventory), options(3000))
  } catch (err) {
    addLocalMovement(screen, values)
  }
}
