import api from '../../services/api.js'
import { supplierService } from '../../services/supplierService.js'
import { labourService } from '../../services/labourService.js'
import { farmerBankService } from '../../services/farmerBankService.js'

const STORE_KEY = 'agriman_payment_records_v1'

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAYMENT_PURPOSES = [
  'Supplier Payment',
  'Labour Wages',
  'Harvesting & Field Labour',
  'Machinery & Equipment Rental',
  'Equipment Maintenance & Repairs',
  'Fuel & Electricity',
  'Irrigation & Water Charges',
  'Transportation & Logistics',
  'Loan Repayment (Principal & Interest)',
  'Operational Expense',
  'Advance Payment',
  'Other Payment',
]

export const PAYEE_TYPES = [
  'Supplier / Vendor',
  'Employee / Labourer',
  'Financial Institution / Bank',
  'Service Provider',
  'Contractor',
  'Other Payee',
]

export const PAYMENT_MODES = [
  'Bank Transfer',
  'Cash',
  'UPI',
  'NEFT',
  'RTGS',
  'IMPS',
  'Cheque',
  'Debit / Credit Card',
  'Other',
]

export const PAYMENT_STATUSES = [
  'Completed',
  'Pending',
  'Processing',
  'Failed',
  'Cancelled',
]

export const SEASONS = [
  'Kharif (Monsoon)',
  'Rabi (Winter)',
  'Zaid (Summer)',
  'Annual / Perennial',
  'Off-Season Greenhouse',
]

// ─── Initial Seed Records ─────────────────────────────────────────────────────

export const INITIAL_PAYMENT_RECORDS = [
  {
    id: 1001,
    paymentNo: 'PAY-2026-0316',
    paymentDate: '2026-10-22',
    purpose: 'Supplier Payment',
    category: 'Fertilizers',
    payeeType: 'Supplier / Vendor',
    payeeName: 'GreenGrow Supplies',
    contactInfo: '+91 98490 12345',
    farm: 'North Field',
    fieldParcel: 'Plot A',
    crop: 'Paddy',
    season: 'Kharif (Monsoon)',
    refType: 'Expense',
    refNo: 'EXP-2026-0098',
    originalAmount: 18500,
    outstandingAmount: 0,
    amount: 18500,
    additionalCharges: 0,
    discount: 0,
    totalAmount: 18500,
    paymentMode: 'Bank Transfer',
    bankAccount: 'HDFC Farm Account',
    transactionRef: 'UTR-091334812',
    chequeNo: '',
    chequeDate: '',
    remarks: 'Fertilizer bulk purchase settlement',
    status: 'Completed',
    createdAt: '2026-10-22T10:30:00Z',
  },
  {
    id: 1002,
    paymentNo: 'PAY-2026-0315',
    paymentDate: '2026-10-21',
    purpose: 'Labour Wages',
    category: 'Labour Wages',
    payeeType: 'Employee / Labourer',
    payeeName: 'Village Labour Group',
    contactInfo: '+91 94401 56789',
    farm: 'South Orchard',
    fieldParcel: 'Block 2',
    crop: 'Cotton',
    season: 'Kharif (Monsoon)',
    refType: 'Expense',
    refNo: 'EXP-2026-0097',
    originalAmount: 8400,
    outstandingAmount: 0,
    amount: 8400,
    additionalCharges: 0,
    discount: 0,
    totalAmount: 8400,
    paymentMode: 'Cash',
    bankAccount: 'Cash in Hand',
    transactionRef: 'VOUCH-1021',
    chequeNo: '',
    chequeDate: '',
    remarks: 'Weeding and intercultural operations',
    status: 'Completed',
    createdAt: '2026-10-21T16:00:00Z',
  },
  {
    id: 1003,
    paymentNo: 'PAY-2026-0314',
    paymentDate: '2026-10-18',
    purpose: 'Machinery & Equipment Rental',
    category: 'Machinery Rental',
    payeeType: 'Service Provider',
    payeeName: 'Kisan Tractor Rentals',
    contactInfo: '+91 97000 33445',
    farm: 'East Meadow',
    fieldParcel: 'Plot C',
    crop: 'Maize',
    season: 'Kharif (Monsoon)',
    refType: 'Expense',
    refNo: 'EXP-2026-0091',
    originalAmount: 12000,
    outstandingAmount: 4000,
    amount: 8000,
    additionalCharges: 0,
    discount: 0,
    totalAmount: 8000,
    paymentMode: 'UPI',
    bankAccount: 'SBI Primary A/c',
    transactionRef: 'UPI-984912-993',
    chequeNo: '',
    chequeDate: '',
    remarks: '50% advance for deep ploughing and harrowing',
    status: 'Completed',
    createdAt: '2026-10-18T11:15:00Z',
  },
  {
    id: 1004,
    paymentNo: 'PAY-2026-0313',
    paymentDate: '2026-10-15',
    purpose: 'Loan Repayment (Principal & Interest)',
    category: 'Financial Payments',
    payeeType: 'Financial Institution / Bank',
    payeeName: 'State Bank of India (Agri Branch)',
    contactInfo: '08452-224411',
    farm: 'General Farm',
    fieldParcel: '',
    crop: '',
    season: 'Kharif (Monsoon)',
    refType: 'Loan',
    refNo: 'LN-2026-001',
    originalAmount: 15000,
    outstandingAmount: 0,
    amount: 15000,
    additionalCharges: 0,
    discount: 0,
    totalAmount: 15000,
    paymentMode: 'Bank Transfer',
    bankAccount: 'SBI Primary A/c',
    transactionRef: 'NEFT-SBIN2026101501',
    chequeNo: '',
    chequeDate: '',
    remarks: 'Monthly EMI installment for Crop Loan',
    status: 'Completed',
    createdAt: '2026-10-15T09:45:00Z',
  },
  {
    id: 1005,
    paymentNo: 'PAY-2026-0312',
    paymentDate: '2026-10-10',
    purpose: 'Fuel & Electricity',
    category: 'Fuel',
    payeeType: 'Service Provider',
    payeeName: 'HPCL Fuel Station',
    contactInfo: '',
    farm: 'Lake Farm',
    fieldParcel: 'Pump House',
    crop: '',
    season: 'Kharif (Monsoon)',
    refType: 'None',
    refNo: 'INV-HPCL-8812',
    originalAmount: 4500,
    outstandingAmount: 4500,
    amount: 4500,
    additionalCharges: 0,
    discount: 0,
    totalAmount: 4500,
    paymentMode: 'Cheque',
    bankAccount: 'HDFC Farm Account',
    transactionRef: '',
    chequeNo: 'CHQ-882190',
    chequeDate: '2026-10-28',
    remarks: 'Diesel purchase for irrigation generators — cheque clearance pending',
    status: 'Pending',
    createdAt: '2026-10-10T14:20:00Z',
  },
]

// ─── Format & Date Helpers ───────────────────────────────────────────────────

export function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`
    }
  }
  return String(val)
}

export function parseDecimal(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// ─── Local Storage Store ─────────────────────────────────────────────────────

function readLocalPayments() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return INITIAL_PAYMENT_RECORDS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PAYMENT_RECORDS
  } catch {
    return INITIAL_PAYMENT_RECORDS
  }
}

function writeLocalPayments(records) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(records))
  } catch (err) {
    console.warn('[Payments Storage] Unable to persist records:', err)
  }
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

export function normalizePayment(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) {
    throw new Error('The Payment record is invalid or has no ID.')
  }

  const amount = Number(raw.amount ?? raw.amountPaid ?? 0)
  const additionalCharges = Number(raw.additionalCharges ?? 0)
  const discount = Number(raw.discount ?? 0)
  const totalAmount = Math.max(0, Math.round((amount + additionalCharges - discount) * 100) / 100)

  const dateRaw = raw.paymentDate ?? raw.date ?? raw.createdAt ?? ''
  const dateIso = dateRaw ? String(dateRaw).slice(0, 10) : localDate()

  const rawStatus = String(raw.status || 'Completed').trim()
  const status = ({
    completed: 'Completed',
    paid: 'Completed',
    success: 'Completed',
    pending: 'Pending',
    processing: 'Processing',
    failed: 'Failed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
  })[rawStatus.toLowerCase()] || rawStatus || 'Completed'

  return {
    ...raw,
    id: raw.id,
    paymentNo: raw.paymentNo ?? raw.paymentCode ?? `PAY-${String(raw.id).padStart(4, '0')}`,
    paymentDate: dateIso,
    paymentDateDisplay: formatDate(dateIso),
    purpose: raw.purpose ?? (raw.supplierId || raw.supplierName ? 'Supplier Payment' : raw.labourId || raw.labourName ? 'Labour Wages' : 'Operational Expense'),
    category: raw.category ?? raw.expenseCategory ?? 'General Outflow',
    payeeType: raw.payeeType ?? (raw.supplierId || raw.supplierName ? 'Supplier / Vendor' : raw.labourId || raw.labourName ? 'Employee / Labourer' : 'Other Payee'),
    payeeName: raw.payeeName ?? raw.supplierName ?? raw.labourName ?? raw.party ?? 'Payee',
    contactInfo: raw.contactInfo ?? raw.mobile ?? '',
    farm: raw.farm ?? raw.farmName ?? '',
    fieldParcel: raw.fieldParcel ?? '',
    crop: raw.crop ?? raw.cropName ?? '',
    season: raw.season ?? '',
    refType: raw.refType ?? (raw.loanId ? 'Loan' : raw.expenseId ? 'Expense' : 'None'),
    refNo: raw.refNo ?? raw.referenceNo ?? '',
    originalAmount: Number(raw.originalAmount ?? amount),
    outstandingAmount: Number(raw.outstandingAmount ?? 0),
    amount,
    amountDisplay: formatCurrency(amount),
    additionalCharges,
    discount,
    totalAmount,
    totalAmountDisplay: formatCurrency(totalAmount),
    paymentMode: raw.paymentMode ?? 'Bank Transfer',
    bankAccount: raw.bankAccount ?? raw.bankOrCash ?? 'Main Account',
    transactionRef: raw.transactionRef ?? raw.referenceNo ?? '',
    chequeNo: raw.chequeNo ?? '',
    chequeDate: raw.chequeDate ? String(raw.chequeDate).slice(0, 10) : '',
    remarks: raw.remarks ?? raw.notes ?? '',
    status,
    createdAt: raw.createdAt || dateIso,
  }
}

// ─── API & Data Services ─────────────────────────────────────────────────────

export async function listPayments(filters = {}) {
  // 1. Load local master ledger
  let localList = readLocalPayments().map(normalizePayment)

  // 2. Try fetching live supplier payments and labour payments to synchronize
  try {
    const [supplierRes, labourRes] = await Promise.all([
      supplierService.getPayments().catch(() => []),
      labourService.getPayments().catch(() => []),
    ])

    const supplierPayments = (Array.isArray(supplierRes) ? supplierRes : []).map((sp) => ({
      id: 20000 + Number(sp.id || 0),
      paymentNo: sp.paymentCode || `SPY-${sp.id}`,
      paymentDate: sp.paymentDate ? String(sp.paymentDate).slice(0, 10) : localDate(),
      purpose: 'Supplier Payment',
      category: 'Agricultural Inputs / Supplies',
      payeeType: 'Supplier / Vendor',
      payeeName: sp.supplierName || 'Registered Supplier',
      contactInfo: '',
      farm: '',
      fieldParcel: '',
      crop: '',
      season: '',
      refType: 'Invoice',
      refNo: sp.referenceNo || '',
      originalAmount: Number(sp.amountPaid || 0),
      outstandingAmount: 0,
      amount: Number(sp.amountPaid || 0),
      additionalCharges: 0,
      discount: 0,
      totalAmount: Number(sp.amountPaid || 0),
      paymentMode: sp.paymentMode || 'Bank Transfer',
      bankAccount: sp.bankAccount || 'Operational Bank Account',
      transactionRef: sp.referenceNo || '',
      chequeNo: '',
      chequeDate: '',
      remarks: sp.notes || 'Supplier settlement payment',
      status: 'Completed',
      createdAt: sp.createdAt || sp.paymentDate,
    })).map(normalizePayment)

    const labourPayments = (Array.isArray(labourRes) ? labourRes : []).map((lp) => ({
      id: 30000 + Number(lp.id || 0),
      paymentNo: lp.paymentCode || `LPY-${lp.id}`,
      paymentDate: lp.paymentDate ? String(lp.paymentDate).slice(0, 10) : localDate(),
      purpose: 'Labour Wages',
      category: 'Labour Wages',
      payeeType: 'Employee / Labourer',
      payeeName: lp.labourName || `Labourer #${lp.labourId}`,
      contactInfo: '',
      farm: '',
      fieldParcel: '',
      crop: '',
      season: '',
      refType: 'Expense',
      refNo: lp.referenceNo || '',
      originalAmount: Number(lp.amountPaid || 0),
      outstandingAmount: 0,
      amount: Number(lp.amountPaid || 0),
      additionalCharges: 0,
      discount: 0,
      totalAmount: Number(lp.amountPaid || 0),
      paymentMode: lp.paymentMode || 'Cash',
      bankAccount: lp.bankAccount || 'Cash in Hand',
      transactionRef: lp.referenceNo || '',
      chequeNo: '',
      chequeDate: '',
      remarks: lp.notes || 'Worker wage disbursement',
      status: 'Completed',
      createdAt: lp.createdAt || lp.paymentDate,
    })).map(normalizePayment)

    // Merge without duplicating existing payment codes
    const existingCodes = new Set(localList.map((p) => p.paymentNo.toLowerCase()))
    const newSupplier = supplierPayments.filter((p) => !existingCodes.has(p.paymentNo.toLowerCase()))
    const newLabour = labourPayments.filter((p) => !existingCodes.has(p.paymentNo.toLowerCase()))

    localList = [...localList, ...newSupplier, ...newLabour]
  } catch (err) {
    console.warn('[Payments API] Using cached ledger:', err)
  }

  // Sort descending by date
  localList.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))

  // Apply filters
  let result = localList

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter((p) =>
      p.paymentNo.toLowerCase().includes(q) ||
      p.payeeName.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.refNo.toLowerCase().includes(q) ||
      p.transactionRef.toLowerCase().includes(q) ||
      p.remarks.toLowerCase().includes(q)
    )
  }

  if (filters.status && filters.status !== 'All') {
    result = result.filter((p) => p.status === filters.status)
  }

  if (filters.startDate) {
    result = result.filter((p) => p.paymentDate >= filters.startDate)
  }

  if (filters.endDate) {
    result = result.filter((p) => p.paymentDate <= filters.endDate)
  }

  if (filters.purpose && filters.purpose !== 'All Purposes') {
    result = result.filter((p) => p.purpose === filters.purpose)
  }

  if (filters.payeeType && filters.payeeType !== 'All Payees') {
    result = result.filter((p) => p.payeeType === filters.payeeType)
  }

  if (filters.paymentMode && filters.paymentMode !== 'All Modes') {
    result = result.filter((p) => p.paymentMode === filters.paymentMode)
  }

  return result
}

export async function getNextPaymentNo() {
  const current = readLocalPayments()
  const year = new Date().getFullYear()
  const prefix = `PAY-${year}-`
  let maxNum = 316
  current.forEach((p) => {
    if (p.paymentNo && p.paymentNo.startsWith(prefix)) {
      const numPart = parseInt(p.paymentNo.replace(prefix, ''), 10)
      if (!Number.isNaN(numPart) && numPart > maxNum) maxNum = numPart
    }
  })
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`
}

export async function createPayment(formValues) {
  const amount = parseDecimal(formValues.amount)
  if (amount <= 0) throw new Error('Payment amount must be greater than zero.')
  if (!formValues.paymentDate) throw new Error('Payment date is required.')
  if (!formValues.purpose?.trim()) throw new Error('Payment purpose is required.')
  if (!formValues.payeeName?.trim()) throw new Error('Payee name is required.')
  if (!formValues.paymentMode?.trim()) throw new Error('Payment method is required.')

  const nextCode = formValues.paymentNo?.trim() || (await getNextPaymentNo())
  const newId = Date.now()

  const additionalCharges = parseDecimal(formValues.additionalCharges)
  const discount = parseDecimal(formValues.discount)
  const totalAmount = Math.max(0, Math.round((amount + additionalCharges - discount) * 100) / 100)

  const record = {
    id: newId,
    paymentNo: nextCode,
    paymentDate: formValues.paymentDate,
    purpose: formValues.purpose.trim(),
    category: formValues.category?.trim() || formValues.purpose.trim(),
    payeeType: formValues.payeeType || 'Supplier / Vendor',
    payeeName: formValues.payeeName.trim(),
    contactInfo: formValues.contactInfo?.trim() || '',
    farm: formValues.farm?.trim() || '',
    fieldParcel: formValues.fieldParcel?.trim() || '',
    crop: formValues.crop?.trim() || '',
    season: formValues.season?.trim() || '',
    refType: formValues.refType || 'None',
    refNo: formValues.refNo?.trim() || '',
    originalAmount: parseDecimal(formValues.originalAmount) || amount,
    outstandingAmount: Math.max(0, parseDecimal(formValues.outstandingAmount)),
    amount,
    additionalCharges,
    discount,
    totalAmount,
    paymentMode: formValues.paymentMode.trim(),
    bankAccount: formValues.bankAccount?.trim() || 'Main Operational Account',
    transactionRef: formValues.transactionRef?.trim() || '',
    chequeNo: formValues.chequeNo?.trim() || '',
    chequeDate: formValues.chequeDate || '',
    remarks: formValues.remarks?.trim() || '',
    status: formValues.status || 'Completed',
    createdAt: new Date().toISOString(),
  }

  // Persist locally
  const list = readLocalPayments()
  list.unshift(record)
  writeLocalPayments(list)

  // Side-effect: sync with live backend controllers when available
  if (record.payeeType === 'Supplier / Vendor') {
    supplierService.createPayment({
      paymentCode: record.paymentNo,
      paymentDate: record.paymentDate,
      supplierId: formValues.supplierId || 1,
      supplierName: record.payeeName,
      amountPaid: record.totalAmount,
      paymentMode: record.paymentMode,
      referenceNo: record.transactionRef,
      bankAccount: record.bankAccount,
      notes: record.remarks,
    }).catch(() => {})
  } else if (record.payeeType === 'Employee / Labourer') {
    labourService.createPayment({
      paymentCode: record.paymentNo,
      paymentDate: record.paymentDate,
      labourId: formValues.labourId || 1,
      labourName: record.payeeName,
      amountPaid: record.totalAmount,
      paymentMode: record.paymentMode,
      referenceNo: record.transactionRef,
      notes: record.remarks,
    }).catch(() => {})
  }

  return normalizePayment(record)
}

export async function updatePayment(id, formValues) {
  const list = readLocalPayments()
  const idx = list.findIndex((p) => String(p.id) === String(id))
  if (idx === -1) throw new Error(`Payment with ID ${id} was not found.`)

  const amount = parseDecimal(formValues.amount)
  if (amount <= 0) throw new Error('Payment amount must be greater than zero.')

  const additionalCharges = parseDecimal(formValues.additionalCharges)
  const discount = parseDecimal(formValues.discount)
  const totalAmount = Math.max(0, Math.round((amount + additionalCharges - discount) * 100) / 100)

  const updated = {
    ...list[idx],
    paymentDate: formValues.paymentDate || list[idx].paymentDate,
    purpose: formValues.purpose?.trim() || list[idx].purpose,
    category: formValues.category?.trim() || list[idx].category,
    payeeType: formValues.payeeType || list[idx].payeeType,
    payeeName: formValues.payeeName?.trim() || list[idx].payeeName,
    contactInfo: formValues.contactInfo?.trim() ?? list[idx].contactInfo,
    farm: formValues.farm?.trim() ?? list[idx].farm,
    fieldParcel: formValues.fieldParcel?.trim() ?? list[idx].fieldParcel,
    crop: formValues.crop?.trim() ?? list[idx].crop,
    season: formValues.season?.trim() ?? list[idx].season,
    refType: formValues.refType ?? list[idx].refType,
    refNo: formValues.refNo?.trim() ?? list[idx].refNo,
    amount,
    additionalCharges,
    discount,
    totalAmount,
    paymentMode: formValues.paymentMode?.trim() || list[idx].paymentMode,
    bankAccount: formValues.bankAccount?.trim() || list[idx].bankAccount,
    transactionRef: formValues.transactionRef?.trim() ?? list[idx].transactionRef,
    chequeNo: formValues.chequeNo?.trim() ?? list[idx].chequeNo,
    chequeDate: formValues.chequeDate ?? list[idx].chequeDate,
    remarks: formValues.remarks?.trim() ?? list[idx].remarks,
    status: formValues.status || list[idx].status,
    updatedAt: new Date().toISOString(),
  }

  list[idx] = updated
  writeLocalPayments(list)
  return normalizePayment(updated)
}

export async function deletePayment(id) {
  const list = readLocalPayments()
  const filtered = list.filter((p) => String(p.id) !== String(id))
  writeLocalPayments(filtered)
  return { success: true }
}

export async function cancelPayment(id, reason = 'User requested cancellation') {
  return updatePayment(id, {
    status: 'Cancelled',
    remarks: reason,
  })
}

// ─── Reference Data Loaders ───────────────────────────────────────────────────

export async function listPaymentSuppliers() {
  try {
    const list = await supplierService.getSuppliers()
    return Array.isArray(list)
      ? list.map((s) => ({ id: s.id ?? s.supplierId, name: s.supplierName ?? s.name ?? '', mobile: s.mobile ?? '' })).filter((s) => s.name)
      : []
  } catch {
    return []
  }
}

export async function listPaymentLabours() {
  try {
    const list = await labourService.getLabours()
    return Array.isArray(list)
      ? list.map((l) => ({ id: l.id, name: l.name ?? l.labourName ?? '', mobile: l.mobile ?? l.phone ?? '' })).filter((l) => l.name)
      : []
  } catch {
    return []
  }
}

export async function listPaymentBankAccounts() {
  try {
    const accounts = await farmerBankService.getBankAccounts()
    return Array.isArray(accounts)
      ? accounts.map((a) => ({ id: a.id, name: `${a.bankName} (${a.accountNumber ? '...' + String(a.accountNumber).slice(-4) : 'Account'})` }))
      : [
          { id: 1, name: 'HDFC Farm Operational A/c' },
          { id: 2, name: 'SBI Primary Agri A/c' },
          { id: 3, name: 'Cash in Hand Account' },
        ]
  } catch {
    return [
      { id: 1, name: 'HDFC Farm Operational A/c' },
      { id: 2, name: 'SBI Primary Agri A/c' },
      { id: 3, name: 'Cash in Hand Account' },
    ]
  }
}

export async function listPaymentFarms() {
  try {
    const res = await api.get('/api/Farms')
    const data = res.data?.data ?? res.data ?? []
    return Array.isArray(data) ? data.map((f) => ({ id: f.id ?? f.farmId, name: f.name ?? f.farmName ?? '' })).filter((f) => f.name) : []
  } catch {
    return [
      { id: 1, name: 'North Field' },
      { id: 2, name: 'South Orchard' },
      { id: 3, name: 'Lake Farm' },
      { id: 4, name: 'East Meadow' },
    ]
  }
}

export async function listPaymentCrops() {
  try {
    const res = await api.get('/api/Crop')
    const data = res.data?.data ?? res.data ?? []
    return Array.isArray(data) ? data.map((c) => ({ id: c.id ?? c.cropId, name: c.name ?? c.cropName ?? '' })).filter((c) => c.name) : []
  } catch {
    return [
      { id: 1, name: 'Paddy' },
      { id: 2, name: 'Cotton' },
      { id: 3, name: 'Wheat' },
      { id: 4, name: 'Maize' },
      { id: 5, name: 'Chilli' },
      { id: 6, name: 'Tomatoes' },
    ]
  }
}

export async function listOutstandingExpenses() {
  try {
    const res = await api.get('/api/expenses?pageSize=100')
    const items = res.data?.data ?? res.data?.items ?? []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

// ─── Summary Calculation ──────────────────────────────────────────────────────

export function computePaymentSummaryCards(records = []) {
  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  let totalCount = 0
  let totalPayments = 0
  let successfulAmount = 0
  let pendingAmount = 0
  let thisMonthAmount = 0

  records.forEach((p) => {
    const amount = Number(p.totalAmount ?? p.amount ?? 0)

    // Total expenses count all recorded payments except cancelled
    if (p.status !== 'Cancelled') {
      totalCount += 1
      totalPayments += amount
    }

    // Successfully paid amount strictly includes only Completed transactions
    if (p.status === 'Completed') {
      successfulAmount += amount
      if (p.paymentDate >= firstOfMonth) {
        thisMonthAmount += amount
      }
    } else if (p.status === 'Pending' || p.status === 'Processing') {
      pendingAmount += amount
    }
  })

  return {
    totalRecords: totalCount,
    totalPayments: Math.round(totalPayments * 100) / 100,
    successfulAmount: Math.round(successfulAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    thisMonthAmount: Math.round(thisMonthAmount * 100) / 100,
  }
}
