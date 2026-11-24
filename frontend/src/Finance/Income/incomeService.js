import api from '../../services/api.js'

export const STANDARD_AGRICULTURAL_CATEGORIES = [
  'Crop Sales',
  'Fruits and Vegetables Sales',
  'Dairy and Livestock Income',
  'Agricultural By-product Sales',
  'Government Subsidies and Grants',
  'Insurance Claims',
  'Farm Equipment Rental',
  'Agricultural Services',
  'Other Income',
]

function config() {
  return { baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || api.defaults.baseURL).replace(/\/+$/, '') }
}

function unwrap(value) {
  if (value?.success === false) throw new Error(value.message || 'The Income API rejected the request.')
  return value?.data ?? value
}

function list(value, label) {
  const data = unwrap(value)
  const rows = Array.isArray(data) ? data : data?.items
  if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== 'object')) throw new Error(`The ${label} API returned an unsupported list response.`)
  return rows
}

function todayLocalDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseRemarksMetadata(remarks = '') {
  if (!remarks || typeof remarks !== 'string') {
    return { cleanRemarks: '', meta: {} }
  }
  const match = remarks.match(/\[Meta:\s*(.*?)\]/)
  if (!match) {
    return { cleanRemarks: remarks, meta: {} }
  }
  const metaStr = match[1]
  const cleanRemarks = remarks.replace(/\[Meta:\s*.*?\]/, '').replace(/\|\s*$/, '').trim()
  const meta = {}
  metaStr.split(';').forEach(part => {
    const [k, ...v] = part.split('=')
    if (k && v.length) {
      meta[k.trim()] = v.join('=').trim()
    }
  })
  return { cleanRemarks, meta }
}

export function serializeRemarksWithMetadata(remarks = '', meta = {}) {
  const clean = (remarks || '').replace(/\[Meta:\s*.*?\]/, '').replace(/\|\s*$/, '').trim()
  const metaParts = Object.entries(meta)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
  if (metaParts.length === 0) return clean
  return `${clean ? clean + ' | ' : ''}[Meta: ${metaParts.join('; ')}]`
}

export function normalizeIncome(row) {
  if (!row || typeof row !== 'object' || row.id == null) throw new Error('The Income API returned an invalid record.')
  const apiStatus = row.status ?? ''
  const rawStatusLower = apiStatus.toLowerCase()
  let status = ({ paid: 'Received', received: 'Received', pending: 'Pending', cancelled: 'Cancelled', canceled: 'Cancelled', 'partially paid': 'Partially Paid', overdue: 'Overdue' })[rawStatusLower] || apiStatus || 'Pending'

  const netAmount = Number(row.netAmount ?? row.amount ?? 0)
  const grossAmount = Number(row.grossAmount ?? netAmount)
  const discount = Number(row.discount ?? 0)
  const otherCharges = Number(row.otherCharges ?? 0)

  // Parse custom metadata from remarks
  const rawRemarks = row.remarks || ''
  const { cleanRemarks, meta } = parseRemarksMetadata(rawRemarks)

  const season = meta.Season || row.season || ''
  const incomeSource = meta.Src || row.incomeSource || row.source || 'Harvest Produce'
  const paymentTerms = meta.Terms || row.paymentTerms || 'Immediate'
  const expectedCollectionDate = meta.Due || (row.expectedCollectionDate ? row.expectedCollectionDate.slice(0, 10) : '')
  const invoiceNo = meta.Inv || row.invoiceNo || ''
  const fieldParcel = meta.Parcel || row.fieldParcel || ''

  // Collection calculations
  let amountReceived
  if (meta.Rcvd != null && !isNaN(Number(meta.Rcvd))) {
    amountReceived = Number(meta.Rcvd)
  } else if (status === 'Received' || rawStatusLower === 'paid') {
    amountReceived = netAmount
  } else if (status === 'Pending') {
    amountReceived = 0
  } else {
    amountReceived = Number(row.amountReceived ?? (status === 'Partially Paid' ? Math.round(netAmount * 0.5 * 100) / 100 : netAmount))
  }

  // Ensure amount received is within 0 and netAmount
  amountReceived = Math.min(netAmount, Math.max(0, amountReceived))
  const pendingAmount = Math.max(0, Math.round((netAmount - amountReceived + Number.EPSILON) * 100) / 100)

  // Determine intelligent collection status
  let collectionStatus = status
  if (status !== 'Cancelled') {
    if (pendingAmount <= 0) {
      collectionStatus = 'Received'
    } else if (amountReceived > 0 && pendingAmount > 0) {
      collectionStatus = 'Partially Paid'
    } else if (expectedCollectionDate && expectedCollectionDate < todayLocalDate()) {
      collectionStatus = 'Overdue'
    } else {
      collectionStatus = 'Pending'
    }
  }

  return {
    ...row,
    originalIncomeDate: row.incomeDate ?? row.date ?? '',
    incomeDate: (row.incomeDate ?? row.date ?? '').slice(0, 10),
    bankCash: row.bankOrCash ?? '',
    grossAmount,
    discount,
    otherCharges,
    netAmount,
    amount: netAmount,
    amountReceived,
    pendingAmount,
    status: collectionStatus,
    collectionStatus,
    apiStatus,
    remarks: cleanRemarks,
    rawRemarks,
    season,
    incomeSource,
    paymentTerms,
    expectedCollectionDate,
    invoiceNo,
    fieldParcel,
  }
}

export async function listIncome(params) {
  const response = await api.get('/api/Income', { ...config(), params })
  return list(response.data, 'Income').map(normalizeIncome).sort((a, b) => b.incomeDate.localeCompare(a.incomeDate))
}

export async function getIncomeById(id) {
  const response = await api.get(`/api/Income/${encodeURIComponent(id)}`, config())
  return normalizeIncome(unwrap(response.data))
}

export async function listIncomeCategories() {
  const response = await api.get('/api/Income/categories', config())
  const loaded = list(response.data, 'Income categories').map((row) => {
    if (row.id == null || typeof row.name !== 'string') throw new Error('The category API must supply an ID and name for each category.')
    return { ...row, code: row.code ?? '', source: row.source ?? '', description: row.description ?? '', status: row.status ?? '' }
  })

  // Ensure all 9 standard agricultural categories are present
  const existingNames = new Set(loaded.map((c) => c.name))
  const fallback = STANDARD_AGRICULTURAL_CATEGORIES
    .filter((cat) => !existingNames.has(cat))
    .map((cat, idx) => ({
      id: 1000 + idx,
      name: cat,
      code: `CAT-${idx + 1}`,
      source: 'Standard',
      description: `Standard agricultural category: ${cat}`,
      status: 'Active',
      isStandard: true,
    }))

  return [...loaded, ...fallback]
}

export async function listIncomeFarmers() {
  const response = await api.get('/api/Farmers')
  return list(response.data, 'Farmers').map((row) => ({ id: row.farmerId ?? row.id, name: row.farmerName ?? row.name ?? '' })).filter((row) => row.id != null && row.name)
}

export async function listIncomeFarms() {
  try {
    const response = await api.get('/api/Farms')
    return list(response.data, 'Farms').map((row) => ({ id: row.farmId ?? row.id, name: row.farmName ?? row.name ?? '' })).filter((row) => row.name)
  } catch {
    return []
  }
}

export async function listIncomeCrops() {
  try {
    const response = await api.get('/api/Crop')
    return list(response.data, 'Crops').map((row) => ({ id: row.cropId ?? row.id, name: row.cropName ?? row.name ?? '' })).filter((row) => row.name)
  } catch {
    return []
  }
}

export function buildIncomePayload(values, categories, farmers, existing = null) {
  // Resolve category
  let category = categories.find((item) => item.name === values.incomeType && (existing?.incomeType !== values.incomeType || existing.categoryId == null || String(item.id) === String(existing.categoryId)))
  if (!category && categories.length > 0) {
    category = categories.find((item) => item.name === values.incomeType) || categories[0]
  }
  if (!category) throw new Error('Select an income type provided by the category API.')

  // Resolve farmer
  let farmerId = null
  const farmerText = values.farmer?.trim() || ''
  if (farmerText) {
    if (existing?.farmer === farmerText && existing.farmerId != null) farmerId = existing.farmerId
    else {
      const matches = farmers.filter((farmer) => `${farmer.name} (#${farmer.id})` === farmerText || String(farmer.id) === farmerText || farmer.name === farmerText)
      if (matches.length > 1) throw new Error('Choose a farmer from the API list. Use the name with its ID if names repeat.')
      if (matches.length === 1) farmerId = matches[0].id
    }
  }

  if (values.incomeNo && values.incomeNo !== existing?.incomeNo) throw new Error('Income numbers are generated by the backend and cannot be assigned here.')

  const quantity = Number(values.quantity)
  const rate = Number(values.rate)
  const discount = Number(values.discount || 0)
  const otherCharges = Number(values.otherCharges || 0)

  if (![quantity, rate, discount, otherCharges].every(Number.isFinite) || quantity <= 0 || rate < 0 || discount < 0 || otherCharges < 0 || discount > quantity * rate) {
    throw new Error('Enter valid quantity, rate, discount, and charges.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.incomeDate) || Number.isNaN(Date.parse(values.incomeDate))) {
    throw new Error('Enter a valid income date.')
  }

  if (!values.paymentMode || !values.status || !values.unit?.trim()) {
    throw new Error('Payment mode, status, and unit are required.')
  }

  // Preserve backend status when untouched
  const status = existing?.status === values.status ? existing.apiStatus : values.status
  const incomeDate = existing?.incomeDate === values.incomeDate && existing.originalIncomeDate ? existing.originalIncomeDate : `${values.incomeDate}T00:00:00`

  const grossAmount = Math.round((quantity * rate + Number.EPSILON) * 100) / 100
  const netAmount = Math.round((grossAmount - discount + otherCharges + Number.EPSILON) * 100) / 100
  const amountReceived = values.amountReceived !== undefined && values.amountReceived !== '' ? Number(values.amountReceived) : (status === 'Received' ? netAmount : 0)
  const pendingAmount = Math.max(0, Math.round((netAmount - amountReceived + Number.EPSILON) * 100) / 100)

  // Encode rich metadata into remarks
  const finalRemarks = serializeRemarksWithMetadata(values.remarks, {
    Season: values.season,
    Terms: values.paymentTerms,
    Due: values.expectedCollectionDate,
    Rcvd: amountReceived,
    Pend: pendingAmount,
    Src: values.incomeSource,
    Inv: values.invoiceNo,
    Parcel: values.fieldParcel,
  })

  // Ensure categoryId passed to backend is valid (if category was virtual standard category, use existing or 1)
  const apiCategoryId = typeof category.id === 'number' && category.id < 1000 ? category.id : (existing?.categoryId || 1)

  return {
    incomeDate,
    categoryId: apiCategoryId,
    farmerId,
    farm: values.farm || null,
    crop: values.crop || null,
    buyer: values.buyer || null,
    quantity,
    unit: values.unit,
    rate,
    discount,
    otherCharges,
    paymentMode: values.paymentMode,
    bankOrCash: values.bankCash || null,
    referenceNumber: values.referenceNumber || null,
    remarks: finalRemarks || null,
    status,
  }
}

export async function createIncome(values, categories, farmers) {
  const response = await api.post('/api/Income', buildIncomePayload(values, categories, farmers), config())
  return unwrap(response.data)
}

export async function updateIncome(id, values, categories, farmers, existing) {
  const response = await api.put(`/api/Income/${encodeURIComponent(id)}`, buildIncomePayload(values, categories, farmers, existing), config())
  return unwrap(response.data)
}

export async function deleteIncome(id) {
  const response = await api.delete(`/api/Income/${encodeURIComponent(id)}`, config())
  return unwrap(response.data)
}

export async function createIncomeCategory(values) {
  const payload = {
    code: values.code,
    name: values.name,
    source: values.source,
    description: values.description,
    status: values.status || 'Active',
    isActive: values.status !== 'Inactive'
  }
  const response = await api.post('/api/Income/categories', payload, config())
  return unwrap(response.data)
}

export async function updateIncomeCategory(id, values) {
  const payload = {
    id,
    code: values.code,
    name: values.name,
    source: values.source,
    description: values.description,
    status: values.status || 'Active',
    isActive: values.status !== 'Inactive'
  }
  const response = await api.put(`/api/Income/categories/${encodeURIComponent(id)}`, payload, config())
  return unwrap(response.data)
}

export async function deleteIncomeCategory(id) {
  const response = await api.delete(`/api/Income/categories/${encodeURIComponent(id)}`, config())
  return unwrap(response.data)
}
