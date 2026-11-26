import api from '../../services/api.js'
import { supplierService } from '../../services/supplierService.js'

const ROOT = '/api/expenses'
const CAT_ROOT = '/api/expense-categories'

// ─── Helpers ────────────────────────────────────────────────────────────────

function cfg() {
  return { baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || api.defaults.baseURL || '').replace(/\/+$/, '') }
}

function unwrap(value) {
  if (value?.success === false) throw new Error(value.message || 'The Expense API rejected the request.')
  return value?.data ?? value
}

function list(value, label) {
  const data = unwrap(value)
  const rows = Array.isArray(data) ? data : (data?.data ?? data?.items ?? data?.records ?? data?.results ?? [])
  if (!Array.isArray(rows)) throw new Error(`The ${label} API returned an unsupported response.`)
  return rows
}

export function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isoDateTime(dateStr) {
  if (!dateStr) return null
  const m = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? `${m[1]}T00:00:00` : null
}

export function isoToDisplayDate(isoStr) {
  if (!isoStr) return ''
  const m = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

export function displayDateToIso(displayStr) {
  if (!displayStr) return ''
  const m = String(displayStr).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!m) return null
  const day = m[1].padStart(2, '0')
  const month = m[2].padStart(2, '0')
  const year = m[3]
  const dNum = parseInt(day, 10)
  const mNum = parseInt(month, 10)
  const yNum = parseInt(year, 10)
  if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31 || yNum < 1900 || yNum > 2100) return null
  return `${year}-${month}-${day}`
}

export function formatCurrency(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(n)) return String(val ?? '')
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

export function formatDate(val) {
  if (!val) return ''
  const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    if (!Number.isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`
  }
  return String(val)
}

export function parseDecimal(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// ─── Standard categories (fallback when API returns empty) ───────────────────

export const STANDARD_EXPENSE_CATEGORIES = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Herbicides',
  'Fungicides',
  'Organic Manure',
  'Labour Wages',
  'Harvesting',
  'Land Preparation',
  'Irrigation',
  'Field Maintenance',
  'Tractor Rental',
  'Machinery Rental',
  'Equipment Maintenance',
  'Machinery Repairs',
  'Fuel',
  'Electricity',
  'Water Charges',
  'Transportation',
  'Storage and Warehousing',
  'Packaging',
  'Insurance',
  'Administrative Expenses',
  'Other Miscellaneous Expenses',
]

export const PAYMENT_MODES = [
  'Cash',
  'Bank Transfer',
  'Cheque',
  'UPI',
  'NEFT / RTGS',
  'Auto Debit / ECS',
  'Other',
]

export const SEASONS = [
  'Kharif (Monsoon)',
  'Rabi (Winter)',
  'Zaid (Summer)',
  'Annual / Perennial',
  'Off-Season Greenhouse',
]

// ─── Normalize raw API list/detail record ────────────────────────────────────

export function normalizeExpense(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) throw new Error('The Expense API returned an invalid record.')

  const amount = Number(raw.amount ?? raw.totalAmount ?? 0)

  // Compute amountPaid from payments[] if present, else infer from status
  let amountPaid = 0
  if (Array.isArray(raw.payments) && raw.payments.length > 0) {
    amountPaid = raw.payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
  } else {
    const rawStatus = (raw.status ?? '').toLowerCase()
    if (rawStatus === 'paid') amountPaid = amount
    else if (rawStatus === 'partially paid') amountPaid = Math.round(amount * 0.5 * 100) / 100
    else amountPaid = 0
  }
  amountPaid = Math.min(amount, Math.max(0, Math.round(amountPaid * 100) / 100))
  const pendingAmount = Math.max(0, Math.round((amount - amountPaid) * 100) / 100)

  // Derive status
  let status = raw.status ?? ''
  if (pendingAmount <= 0) status = 'Paid'
  else if (amountPaid > 0) status = 'Partially Paid'
  else {
    const dueDate = raw.dueDate ? raw.dueDate.slice(0, 10) : null
    if (dueDate && dueDate < localDate()) status = 'Overdue'
    else status = 'Pending'
  }
  if ((raw.status ?? '').toLowerCase() === 'cancelled') status = 'Cancelled'

  const expenseDateRaw = raw.expenseDate ?? raw.date ?? ''
  const expenseDateIso = expenseDateRaw ? expenseDateRaw.slice(0, 10) : ''

  let expenseSubcategory = raw.expenseSubcategory || ''
  let cleanRemarks = raw.remarks ?? ''
  if (raw.remarks) {
    const subMatch = raw.remarks.match(/\[Subcategory:\s*(.*?)\]/)
    if (subMatch) {
      expenseSubcategory = subMatch[1]
      cleanRemarks = cleanRemarks.replace(/\[Subcategory:\s*.*?\]/, '').trim()
    }
  }

  return {
    ...raw,
    id: raw.id,
    expenseNo: raw.expenseNo ?? raw.voucherNo ?? '',
    expenseDateRaw,
    expenseDate: expenseDateIso,
    expenseDateDisplay: formatDate(expenseDateIso),
    expenseCategory: raw.expenseCategory ?? raw.expenseCategoryName ?? raw.categoryName ?? '',
    expenseSubcategory,
    categoryId: raw.categoryId ?? null,
    supplier: typeof raw.supplier === 'object' ? (raw.supplier?.supplierName ?? raw.supplier?.name ?? '') : (raw.supplier ?? ''),
    farmer: typeof raw.farmer === 'object' ? (raw.farmer?.name ?? '') : (raw.farmer ?? ''),
    farm: typeof raw.farm === 'object' ? (raw.farm?.farmName ?? raw.farm?.name ?? '') : (raw.farm ?? ''),
    crop: typeof raw.crop === 'object' ? (raw.crop?.cropName ?? raw.crop?.name ?? '') : (raw.crop ?? ''),
    description: raw.description ?? raw.particulars ?? '',
    amount,
    amountDisplay: raw.formattedAmount ?? formatCurrency(amount),
    amountPaid,
    amountPaidDisplay: formatCurrency(amountPaid),
    pendingAmount,
    pendingAmountDisplay: formatCurrency(pendingAmount),
    status,
    paymentMode: raw.paymentMode ?? raw.paymentMethod ?? '',
    referenceNo: raw.referenceNo ?? raw.referenceNumber ?? '',
    remarks: cleanRemarks,
    rawRemarks: raw.remarks ?? '',
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    items: Array.isArray(raw.items) ? raw.items : [],
  }
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function listExpenses(params = {}) {
  const response = await api.get(ROOT, { ...cfg(), params })
  return unwrap(response.data)
}

export async function getExpenseSummary(params = {}) {
  const response = await api.get(`${ROOT}/summary`, { ...cfg(), params })
  return unwrap(response.data)
}

export async function getExpenseById(id) {
  const response = await api.get(`${ROOT}/${encodeURIComponent(id)}`, cfg())
  const raw = unwrap(response.data)
  return normalizeExpense(raw.expense ?? raw.item ?? raw)
}

export async function getNextExpenseNo() {
  const response = await api.get(`${ROOT}/next-number`, cfg())
  const data = unwrap(response.data)
  return data?.nextExpenseNo ?? data?.nextNumber ?? data?.number ?? ''
}

export async function createExpense(payload) {
  const response = await api.post(ROOT, payload, cfg())
  return unwrap(response.data)
}

export async function updateExpense(id, payload) {
  const response = await api.put(`${ROOT}/${encodeURIComponent(id)}`, payload, cfg())
  return unwrap(response.data)
}

export async function deleteExpense(id) {
  const response = await api.delete(`${ROOT}/${encodeURIComponent(id)}`, cfg())
  return unwrap(response.data)
}

export async function listExpenseCategories() {
  try {
    const response = await api.get(CAT_ROOT, cfg())
    const rows = list(response.data, 'Expense categories')
    const loaded = rows
      .filter((r) => r?.isActive !== false)
      .map((r) => ({ id: r.id ?? null, name: r.name ?? r.categoryName ?? '', code: r.code ?? '', description: r.description ?? '', expenseCount: r.expenseCount ?? 0 }))
      .filter((r) => r.name)

    // Merge with standard fallback for categories not in DB
    const existingNames = new Set(loaded.map((c) => c.name))
    const fallback = STANDARD_EXPENSE_CATEGORIES
      .filter((name) => !existingNames.has(name))
      .map((name, idx) => ({ id: null, name, code: '', description: `Standard agricultural expense: ${name}`, isStandard: true, expenseCount: 0 }))

    return [...loaded, ...fallback]
  } catch {
    return STANDARD_EXPENSE_CATEGORIES.map((name) => ({ id: null, name, code: '', description: '', isStandard: true, expenseCount: 0 }))
  }
}

export async function listExpenseFarmers() {
  try {
    const response = await api.get('/api/Farmers', cfg())
    return list(response.data, 'Farmers')
      .map((r) => ({ id: r.farmerId ?? r.id, name: r.farmerName ?? r.name ?? '' }))
      .filter((r) => r.name)
  } catch {
    return []
  }
}

export async function listExpenseFarms() {
  try {
    const response = await api.get('/api/Farms', cfg())
    return list(response.data, 'Farms')
      .map((r) => ({ id: r.farmId ?? r.id, name: r.farmName ?? r.name ?? '' }))
      .filter((r) => r.name)
  } catch {
    return []
  }
}

export async function listExpenseCrops() {
  try {
    const response = await api.get('/api/Crop', cfg())
    return list(response.data, 'Crops')
      .map((r) => ({ id: r.cropId ?? r.id, name: r.cropName ?? r.name ?? '' }))
      .filter((r) => r.name)
  } catch {
    return []
  }
}

export async function listExpenseSuppliers() {
  try {
    const suppliers = await supplierService.getSuppliers()
    return Array.isArray(suppliers)
      ? suppliers.map((s) => ({ id: s.id ?? s.supplierId, name: s.supplierName ?? s.name ?? '' })).filter((s) => s.name)
      : []
  } catch {
    return []
  }
}

// ─── Build API payload ───────────────────────────────────────────────────────

export function buildExpensePayload(formValues, categories = []) {
  const amount = parseDecimal(formValues.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid expense amount greater than zero.')

  const expenseCategory = (formValues.expenseCategory ?? '').trim()
  if (!expenseCategory) throw new Error('Expense category is required.')

  const description = (formValues.description ?? '').trim()
  if (!description) throw new Error('Description is required.')

  // Resolve category ID if available
  const catObj = categories.find((c) => c.name === expenseCategory)
  const categoryId = catObj?.id ?? formValues.categoryId ?? null

  // Required string fields — backend requires non-null strings
  const farmer = (formValues.farmer ?? '').trim() || ''
  const farm = (formValues.farm ?? '').trim() || ''
  const crop = (formValues.crop ?? '').trim() || ''
  const supplier = (formValues.supplier ?? '').trim() || 'Direct Purchase'

  const expenseDate = isoDateTime(formValues.expenseDate || localDate())

  let remarks = (formValues.remarks ?? '').trim()
  if (formValues.expenseSubcategory?.trim()) {
    remarks = remarks
      ? `[Subcategory: ${formValues.expenseSubcategory.trim()}] ${remarks}`
      : `[Subcategory: ${formValues.expenseSubcategory.trim()}]`
  }

  const payload = {
    expenseDate,
    expenseCategory,
    categoryId: categoryId || undefined,
    farmer,
    farm,
    crop,
    supplier,
    description,
    amount,
    paymentMode: (formValues.paymentMode ?? '').trim() || undefined,
    referenceNo: (formValues.referenceNo ?? '').trim() || undefined,
    remarks: remarks || undefined,
    status: formValues.status || 'Pending',
  }

  // Remove undefined keys
  Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k] })

  return payload
}

// ─── Summary computation helpers ─────────────────────────────────────────────

export function computeSummaryCards(allMetrics, paidMetrics, thisMonthMetrics) {
  const totalExpenses = Number(allMetrics?.totalAmount ?? allMetrics?.metrics?.totalAmount ?? 0)
  const paidExpenses = Number(paidMetrics?.totalAmount ?? paidMetrics?.metrics?.totalAmount ?? 0)
  const thisMonth = Number(thisMonthMetrics?.totalAmount ?? thisMonthMetrics?.metrics?.totalAmount ?? 0)
  const pendingPayables = Math.max(0, totalExpenses - paidExpenses)
  return { totalExpenses, paidExpenses, pendingPayables, thisMonth }
}
