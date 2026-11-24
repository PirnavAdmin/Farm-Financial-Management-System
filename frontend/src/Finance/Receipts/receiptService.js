import api from '../../services/api.js'
import { salesService } from '../../services/salesService.js'
import { farmerBankService } from '../../services/farmerBankService.js'

const STORE_KEY = 'agriman_receipt_records_v1'

// ─── Constants ────────────────────────────────────────────────────────────────

export const RECEIPT_PURPOSES = [
  'Paddy Sales Collection',
  'Maize Sales Collection',
  'Cotton Sales Collection',
  'Fruits & Vegetables Sales',
  'Dairy & Livestock Sales',
  'Agricultural By-product Sales',
  'Equipment Rental Income',
  'Agricultural Service Income',
  'Advance Customer Collection',
  'Outstanding Invoice Settlement',
  'Other Farm Income',
]

export const PAYER_TYPES = [
  'Wholesale Buyer / Trader',
  'Retail Customer',
  'Agricultural Cooperative / Mandi',
  'Food Processing Company',
  'Tenant Farmer',
  'Other Payer',
]

export const COLLECTION_MODES = [
  'Bank Transfer',
  'Cash',
  'UPI',
  'NEFT',
  'RTGS',
  'IMPS',
  'Cheque',
  'Demand Draft',
  'Other',
]

export const RECEIPT_STATUSES = [
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

export const INITIAL_RECEIPT_RECORDS = [
  {
    id: 3001,
    receiptNo: 'REC-2026-0194',
    receiptDate: '2026-10-22',
    purpose: 'Paddy Sales Collection',
    category: 'Crop Sales',
    payerType: 'Wholesale Buyer / Trader',
    payerName: 'Sri Lakshmi Traders',
    contactInfo: '+91 98480 22334',
    farm: 'North Field',
    fieldParcel: 'Plot A',
    crop: 'Paddy',
    season: 'Kharif (Monsoon)',
    refType: 'Sales Invoice',
    refNo: 'SAL-2026-0042',
    originalAmount: 175000,
    outstandingAmount: 0,
    amount: 175000,
    discount: 0,
    otherCharges: 0,
    finalAmount: 175000,
    collectionMode: 'Bank Transfer',
    bankAccount: 'HDFC Farm Account',
    transactionRef: 'UTR-091448123',
    chequeNo: '',
    chequeDate: '',
    remarks: 'Full settlement for 50 quintals Grade-A paddy produce',
    status: 'Completed',
    createdAt: '2026-10-22T11:00:00Z',
  },
  {
    id: 3002,
    receiptNo: 'REC-2026-0193',
    receiptDate: '2026-10-20',
    purpose: 'Dairy & Livestock Sales',
    category: 'Dairy & Livestock Income',
    payerType: 'Agricultural Cooperative / Mandi',
    payerName: 'Dairy Cooperative Society',
    contactInfo: '+91 94400 11223',
    farm: 'Main Dairy Shed',
    fieldParcel: '',
    crop: 'Cow Milk',
    season: 'Kharif (Monsoon)',
    refType: 'Income Record',
    refNo: 'INC-2026-0141',
    originalAmount: 34440,
    outstandingAmount: 0,
    amount: 34440,
    discount: 0,
    otherCharges: 0,
    finalAmount: 34440,
    collectionMode: 'UPI',
    bankAccount: 'Cash Account',
    transactionRef: 'UPI-984920-881',
    chequeNo: '',
    chequeDate: '',
    remarks: 'Fortnightly milk collection payment direct to bank UPI',
    status: 'Completed',
    createdAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 3003,
    receiptNo: 'REC-2026-0192',
    receiptDate: '2026-10-17',
    purpose: 'Cotton Sales Collection',
    category: 'Crop Sales',
    payerType: 'Food Processing Company',
    payerName: 'Kisan Cotton Mill Ltd',
    contactInfo: '+91 97001 88990',
    farm: 'South Orchard',
    fieldParcel: 'Block 2',
    crop: 'Cotton',
    season: 'Kharif (Monsoon)',
    refType: 'Sales Invoice',
    refNo: 'SAL-2026-0038',
    originalAmount: 120000,
    outstandingAmount: 35000,
    amount: 85000,
    discount: 0,
    otherCharges: 0,
    finalAmount: 85000,
    collectionMode: 'Bank Transfer',
    bankAccount: 'SBI Primary A/c',
    transactionRef: 'NEFT-SBIN2026101704',
    chequeNo: '',
    chequeDate: '',
    remarks: 'First installment payment against raw cotton bale consignment',
    status: 'Completed',
    createdAt: '2026-10-17T16:20:00Z',
  },
  {
    id: 3004,
    receiptNo: 'REC-2026-0191',
    receiptDate: '2026-10-12',
    purpose: 'Fruits & Vegetables Sales',
    category: 'Vegetables Sales',
    payerType: 'Retail Customer',
    payerName: 'Gramin Agro Mart',
    contactInfo: '+91 99887 66554',
    farm: 'East Meadow',
    fieldParcel: 'Plot C',
    crop: 'Tomatoes',
    season: 'Kharif (Monsoon)',
    refType: 'Sales Invoice',
    refNo: 'SAL-2026-0035',
    originalAmount: 22500,
    outstandingAmount: 0,
    amount: 22500,
    discount: 0,
    otherCharges: 0,
    finalAmount: 22500,
    collectionMode: 'Cash',
    bankAccount: 'Cash in Hand',
    transactionRef: 'CSH-REC-8841',
    chequeNo: '',
    chequeDate: '',
    remarks: 'Direct cash collection for freshly picked farm tomatoes',
    status: 'Completed',
    createdAt: '2026-10-12T09:40:00Z',
  },
  {
    id: 3005,
    receiptNo: 'REC-2026-0190',
    receiptDate: '2026-10-08',
    purpose: 'Equipment Rental Income',
    category: 'Farm Equipment Rental',
    payerType: 'Tenant Farmer',
    payerName: 'Ravi Verma',
    contactInfo: '+91 98492 55443',
    farm: 'North Field',
    fieldParcel: '',
    crop: '',
    season: 'Kharif (Monsoon)',
    refType: 'Income Record',
    refNo: 'INC-2026-0128',
    originalAmount: 15000,
    outstandingAmount: 15000,
    amount: 15000,
    discount: 0,
    otherCharges: 0,
    finalAmount: 15000,
    collectionMode: 'Cheque',
    bankAccount: 'HDFC Farm Account',
    transactionRef: '',
    chequeNo: 'CHQ-778120',
    chequeDate: '2026-10-25',
    remarks: 'Rotavator and Harvester 3-day rental fee — cheque clearance in process',
    status: 'Pending',
    createdAt: '2026-10-08T15:10:00Z',
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

function readLocalReceipts() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return INITIAL_RECEIPT_RECORDS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RECEIPT_RECORDS
  } catch {
    return INITIAL_RECEIPT_RECORDS
  }
}

function writeLocalReceipts(records) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(records))
  } catch (err) {
    console.warn('[Receipts Storage] Unable to persist records:', err)
  }
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

export function normalizeReceipt(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) {
    throw new Error('The Receipt record is invalid or has no ID.')
  }

  const amount = Number(raw.amount ?? raw.paymentAmount ?? raw.receivedAmount ?? 0)
  const discount = Number(raw.discount ?? 0)
  const otherCharges = Number(raw.otherCharges ?? 0)
  const finalAmount = Math.max(0, Math.round((amount - discount + otherCharges) * 100) / 100)

  const dateRaw = raw.receiptDate ?? raw.paymentDate ?? raw.date ?? raw.createdAt ?? ''
  const dateIso = dateRaw ? String(dateRaw).slice(0, 10) : localDate()

  const rawStatus = String(raw.status || 'Completed').trim()
  const status = ({
    completed: 'Completed',
    paid: 'Completed',
    received: 'Completed',
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
    receiptNo: raw.receiptNo ?? raw.paymentNo ?? `REC-${String(raw.id).padStart(4, '0')}`,
    receiptDate: dateIso,
    receiptDateDisplay: formatDate(dateIso),
    purpose: raw.purpose ?? (raw.salesNo || raw.saleId ? 'Paddy Sales Collection' : 'Crop Sales'),
    category: raw.category ?? raw.incomeCategory ?? 'Crop Sales',
    payerType: raw.payerType ?? (raw.buyerId || raw.buyer ? 'Wholesale Buyer / Trader' : 'Retail Customer'),
    payerName: raw.payerName ?? raw.buyer ?? raw.from ?? raw.customer ?? 'Customer / Buyer',
    contactInfo: raw.contactInfo ?? raw.mobile ?? '',
    farm: raw.farm ?? raw.farmName ?? '',
    fieldParcel: raw.fieldParcel ?? '',
    crop: raw.crop ?? raw.cropName ?? '',
    season: raw.season ?? '',
    refType: raw.refType ?? (raw.salesNo || raw.saleId ? 'Sales Invoice' : raw.incomeNo ? 'Income Record' : 'None'),
    refNo: raw.refNo ?? raw.salesNo ?? raw.referenceNo ?? '',
    originalAmount: Number(raw.originalAmount ?? amount),
    outstandingAmount: Number(raw.outstandingAmount ?? 0),
    amount,
    amountDisplay: formatCurrency(amount),
    discount,
    otherCharges,
    finalAmount,
    finalAmountDisplay: formatCurrency(finalAmount),
    collectionMode: raw.collectionMode ?? raw.paymentMode ?? 'Bank Transfer',
    bankAccount: raw.bankAccount ?? raw.bankOrCash ?? 'Main Farm Account',
    transactionRef: raw.transactionRef ?? raw.referenceNo ?? '',
    chequeNo: raw.chequeNo ?? '',
    chequeDate: raw.chequeDate ? String(raw.chequeDate).slice(0, 10) : '',
    remarks: raw.remarks ?? raw.notes ?? '',
    status,
    createdAt: raw.createdAt || dateIso,
  }
}

// ─── API & Data Services ─────────────────────────────────────────────────────

export async function listReceipts(filters = {}) {
  // 1. Read local master records
  let localList = readLocalReceipts().map(normalizeReceipt)

  // 2. Synchronize with live sales payments where available
  try {
    const liveSalesPayments = await salesService.getPayments().catch(() => [])
    if (Array.isArray(liveSalesPayments) && liveSalesPayments.length > 0) {
      const liveMapped = liveSalesPayments.map((sp) => ({
        id: 50000 + Number(sp.id || 0),
        receiptNo: sp.paymentNo || `REC-S-${sp.id}`,
        receiptDate: sp.paymentDate ? String(sp.paymentDate).slice(0, 10) : localDate(),
        purpose: 'Crop Sales Collection',
        category: 'Crop Sales',
        payerType: 'Wholesale Buyer / Trader',
        payerName: sp.buyer || 'Registered Buyer',
        contactInfo: '',
        farm: '',
        fieldParcel: '',
        crop: '',
        season: '',
        refType: 'Sales Invoice',
        refNo: sp.salesNo || '',
        originalAmount: Number(sp.paymentAmount || 0),
        outstandingAmount: Number(sp.remainingSaleBalance || 0),
        amount: Number(sp.paymentAmount || 0),
        discount: 0,
        otherCharges: 0,
        finalAmount: Number(sp.paymentAmount || 0),
        collectionMode: sp.paymentMode || 'Bank Transfer',
        bankAccount: 'HDFC Farm Account',
        transactionRef: sp.referenceNo || '',
        chequeNo: '',
        chequeDate: '',
        remarks: sp.remarks || 'Customer collection against sales invoice',
        status: 'Completed',
        createdAt: sp.createdAt || sp.paymentDate,
      })).map(normalizeReceipt)

      const existingCodes = new Set(localList.map((r) => r.receiptNo.toLowerCase()))
      const newLive = liveMapped.filter((r) => !existingCodes.has(r.receiptNo.toLowerCase()))
      localList = [...localList, ...newLive]
    }
  } catch (err) {
    console.warn('[Receipts API] Falling back to cached receipts:', err)
  }

  // Sort descending by date
  localList.sort((a, b) => b.receiptDate.localeCompare(a.receiptDate))

  // Apply filters
  let result = localList

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    result = result.filter((r) =>
      r.receiptNo.toLowerCase().includes(q) ||
      r.payerName.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.refNo.toLowerCase().includes(q) ||
      r.transactionRef.toLowerCase().includes(q) ||
      r.remarks.toLowerCase().includes(q)
    )
  }

  if (filters.status && filters.status !== 'All') {
    result = result.filter((r) => r.status === filters.status)
  }

  if (filters.startDate) {
    result = result.filter((r) => r.receiptDate >= filters.startDate)
  }

  if (filters.endDate) {
    result = result.filter((r) => r.receiptDate <= filters.endDate)
  }

  if (filters.purpose && filters.purpose !== 'All Purposes') {
    result = result.filter((r) => r.purpose === filters.purpose)
  }

  if (filters.payerType && filters.payerType !== 'All Payers') {
    result = result.filter((r) => r.payerType === filters.payerType)
  }

  if (filters.collectionMode && filters.collectionMode !== 'All Modes') {
    result = result.filter((r) => r.collectionMode === filters.collectionMode)
  }

  return result
}

export async function getNextReceiptNo() {
  const current = readLocalReceipts()
  const year = new Date().getFullYear()
  const prefix = `REC-${year}-`
  let maxNum = 194
  current.forEach((r) => {
    if (r.receiptNo && r.receiptNo.startsWith(prefix)) {
      const numPart = parseInt(r.receiptNo.replace(prefix, ''), 10)
      if (!Number.isNaN(numPart) && numPart > maxNum) maxNum = numPart
    }
  })
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`
}

export async function createReceipt(formValues) {
  const amount = parseDecimal(formValues.amount)
  if (amount <= 0) throw new Error('Receipt amount must be greater than zero.')
  if (!formValues.receiptDate) throw new Error('Receipt date is required.')
  if (!formValues.purpose?.trim()) throw new Error('Receipt purpose is required.')
  if (!formValues.payerName?.trim()) throw new Error('Customer / Payer name is required.')
  if (!formValues.collectionMode?.trim()) throw new Error('Collection method is required.')

  if (formValues.collectionMode === 'Cheque' && !formValues.chequeNo?.trim()) {
    throw new Error('Cheque number is required for Cheque payment mode.')
  }

  const nextCode = formValues.receiptNo?.trim() || (await getNextReceiptNo())
  const newId = Date.now()

  const discount = parseDecimal(formValues.discount)
  const otherCharges = parseDecimal(formValues.otherCharges)
  const finalAmount = Math.max(0, Math.round((amount - discount + otherCharges) * 100) / 100)

  const record = {
    id: newId,
    receiptNo: nextCode,
    receiptDate: formValues.receiptDate,
    purpose: formValues.purpose.trim(),
    category: formValues.category?.trim() || formValues.purpose.trim(),
    payerType: formValues.payerType || 'Wholesale Buyer / Trader',
    payerName: formValues.payerName.trim(),
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
    discount,
    otherCharges,
    finalAmount,
    collectionMode: formValues.collectionMode.trim(),
    bankAccount: formValues.bankAccount?.trim() || 'Main Farm Account',
    transactionRef: formValues.transactionRef?.trim() || '',
    chequeNo: formValues.chequeNo?.trim() || '',
    chequeDate: formValues.chequeDate || '',
    remarks: formValues.remarks?.trim() || '',
    status: formValues.status || 'Completed',
    createdAt: new Date().toISOString(),
  }

  // Persist locally
  const list = readLocalReceipts()
  list.unshift(record)
  writeLocalReceipts(list)

  // Side-effect: sync with live backend sales payment when linked to a sales invoice
  if (record.refType === 'Sales Invoice' && record.refNo) {
    salesService.recordPayment({
      paymentNo: record.receiptNo,
      paymentDate: record.receiptDate,
      buyer: record.payerName,
      salesNo: record.refNo,
      paymentAmount: record.finalAmount,
      paymentMode: record.collectionMode,
      referenceNo: record.transactionRef,
      remarks: record.remarks,
    }).catch(() => {})
  }

  return normalizeReceipt(record)
}

export async function updateReceipt(id, formValues) {
  const list = readLocalReceipts()
  const idx = list.findIndex((r) => String(r.id) === String(id))
  if (idx === -1) throw new Error(`Receipt with ID ${id} was not found.`)

  const amount = parseDecimal(formValues.amount)
  if (amount <= 0) throw new Error('Receipt amount must be greater than zero.')

  const discount = parseDecimal(formValues.discount)
  const otherCharges = parseDecimal(formValues.otherCharges)
  const finalAmount = Math.max(0, Math.round((amount - discount + otherCharges) * 100) / 100)

  const updated = {
    ...list[idx],
    receiptDate: formValues.receiptDate || list[idx].receiptDate,
    purpose: formValues.purpose?.trim() || list[idx].purpose,
    category: formValues.category?.trim() || list[idx].category,
    payerType: formValues.payerType || list[idx].payerType,
    payerName: formValues.payerName?.trim() || list[idx].payerName,
    contactInfo: formValues.contactInfo?.trim() ?? list[idx].contactInfo,
    farm: formValues.farm?.trim() ?? list[idx].farm,
    fieldParcel: formValues.fieldParcel?.trim() ?? list[idx].fieldParcel,
    crop: formValues.crop?.trim() ?? list[idx].crop,
    season: formValues.season?.trim() ?? list[idx].season,
    refType: formValues.refType ?? list[idx].refType,
    refNo: formValues.refNo?.trim() ?? list[idx].refNo,
    amount,
    discount,
    otherCharges,
    finalAmount,
    collectionMode: formValues.collectionMode?.trim() || list[idx].collectionMode,
    bankAccount: formValues.bankAccount?.trim() || list[idx].bankAccount,
    transactionRef: formValues.transactionRef?.trim() ?? list[idx].transactionRef,
    chequeNo: formValues.chequeNo?.trim() ?? list[idx].chequeNo,
    chequeDate: formValues.chequeDate ?? list[idx].chequeDate,
    remarks: formValues.remarks?.trim() ?? list[idx].remarks,
    status: formValues.status || list[idx].status,
    updatedAt: new Date().toISOString(),
  }

  list[idx] = updated
  writeLocalReceipts(list)
  return normalizeReceipt(updated)
}

export async function deleteReceipt(id) {
  const list = readLocalReceipts()
  const filtered = list.filter((r) => String(r.id) !== String(id))
  writeLocalReceipts(filtered)
  return { success: true }
}

export async function cancelReceipt(id, reason = 'Receipt cancelled or reversed') {
  return updateReceipt(id, {
    status: 'Cancelled',
    remarks: reason,
  })
}

// ─── Summary Calculation ──────────────────────────────────────────────────────

export function computeReceiptSummaryCards(records = [], externalReceivables = 0) {
  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  let totalCount = 0
  let totalReceived = 0
  let pendingAmount = 0
  let thisMonthAmount = 0

  records.forEach((r) => {
    const finalAmt = Number(r.finalAmount ?? r.amount ?? 0)

    // Total records count all non-cancelled receipts
    if (r.status !== 'Cancelled') {
      totalCount += 1
    }

    // Total Received strictly includes only Completed receipts
    if (r.status === 'Completed') {
      totalReceived += finalAmt
      if (r.receiptDate >= firstOfMonth) {
        thisMonthAmount += finalAmt
      }
    } else if (r.status === 'Pending' || r.status === 'Processing') {
      pendingAmount += finalAmt
    }
  })

  // Pending receivables includes pending collections plus any known uncollected invoice balance
  const totalPendingReceivables = Math.max(0, Math.round((pendingAmount + (Number(externalReceivables) || 0)) * 100) / 100)

  return {
    totalReceipts: totalCount,
    totalReceived: Math.round(totalReceived * 100) / 100,
    pendingReceivables: totalPendingReceivables,
    thisMonthAmount: Math.round(thisMonthAmount * 100) / 100,
  }
}

// ─── Reference Data Loaders ───────────────────────────────────────────────────

export async function listReceiptBuyers() {
  try {
    const buyers = await salesService.getBuyers()
    return Array.isArray(buyers)
      ? buyers.map((b) => ({
          id: b.id ?? b.buyerId,
          name: b.buyerName ?? b.name ?? '',
          mobile: b.mobile ?? '',
          outstanding: Number(b.receivableBalance || 0),
        })).filter((b) => b.name)
      : []
  } catch {
    return []
  }
}

export async function listReceiptBankAccounts() {
  try {
    const list = await farmerBankService.getBankAccounts()
    return Array.isArray(list)
      ? list.map((b) => ({
          id: b.id ?? b.bankAccountId,
          name: `${b.bankName || 'Bank'} - ${String(b.accountNumber || '').slice(-4)}`,
        }))
      : []
  } catch {
    return []
  }
}

export async function listReceiptFarms() {
  try {
    const res = await api.get('/api/Farms')
    const list = res.data?.data ?? res.data?.items ?? res.data ?? []
    return Array.isArray(list) ? list.map((f) => ({ id: f.id, name: f.name ?? f.farmName ?? '' })).filter((f) => f.name) : []
  } catch {
    return [
      { id: 1, name: 'North Field' },
      { id: 2, name: 'South Orchard' },
      { id: 3, name: 'East Meadow' },
      { id: 4, name: 'Main Dairy Shed' },
    ]
  }
}

export async function listReceiptCrops() {
  try {
    const res = await api.get('/api/Crop')
    const list = res.data?.data ?? res.data?.items ?? res.data ?? []
    return Array.isArray(list) ? list.map((c) => ({ id: c.id, name: c.name ?? c.cropName ?? '' })).filter((c) => c.name) : []
  } catch {
    return [
      { id: 1, name: 'Paddy' },
      { id: 2, name: 'Cotton' },
      { id: 3, name: 'Wheat' },
      { id: 4, name: 'Maize' },
      { id: 5, name: 'Tomatoes' },
      { id: 6, name: 'Cow Milk' },
    ]
  }
}

export async function listOutstandingSales() {
  try {
    const res = await api.get('/api/Sales?pageSize=100')
    const items = res.data?.data?.items ?? res.data?.items ?? res.data ?? []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export async function listOutstandingIncomes() {
  try {
    const res = await api.get('/api/Income')
    const items = res.data?.data ?? res.data ?? []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}
