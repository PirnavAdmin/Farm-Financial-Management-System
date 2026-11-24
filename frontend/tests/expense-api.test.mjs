// frontend/tests/expense-api.test.mjs
// Run with: node --test frontend/tests/expense-api.test.mjs

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ─── Inline copies of pure utility functions from expenseService.js ─────────
// (Cannot import ESM with import.meta in Node --test without a bundler, so we
//  replicate the pure logic here and verify its behaviour.)

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoDateTime(dateStr) {
  if (!dateStr) return null
  const m = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? `${m[1]}T00:00:00` : null
}

function isoToDisplayDate(isoStr) {
  if (!isoStr) return ''
  const m = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

function displayDateToIso(displayStr) {
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

function formatCurrency(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(n)) return String(val ?? '')
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

function parseDecimal(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function normalizeExpense(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null) throw new Error('The Expense API returned an invalid record.')
  const amount = Number(raw.amount ?? raw.totalAmount ?? 0)
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
  let status = raw.status ?? ''
  if (pendingAmount <= 0) status = 'Paid'
  else if (amountPaid > 0) status = 'Partially Paid'
  else status = 'Pending'
  if ((raw.status ?? '').toLowerCase() === 'cancelled') status = 'Cancelled'

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
    amount,
    amountPaid,
    pendingAmount,
    status,
    expenseCategory: raw.expenseCategory ?? raw.expenseCategoryName ?? '',
    expenseSubcategory,
    supplier: typeof raw.supplier === 'object' ? (raw.supplier?.supplierName ?? '') : (raw.supplier ?? ''),
    description: raw.description ?? '',
    remarks: cleanRemarks,
  }
}

function buildExpensePayload(formValues, categories = []) {
  const amount = parseDecimal(formValues.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid expense amount greater than zero.')
  const expenseCategory = (formValues.expenseCategory ?? '').trim()
  if (!expenseCategory) throw new Error('Expense category is required.')
  const description = (formValues.description ?? '').trim()
  if (!description) throw new Error('Description is required.')
  const catObj = categories.find((c) => c.name === expenseCategory)
  const categoryId = catObj?.id ?? formValues.categoryId ?? null
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
  Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k] })
  return payload
}

function computeSummaryCards(allMetrics, paidMetrics, thisMonthMetrics) {
  const totalExpenses = Number(allMetrics?.totalAmount ?? allMetrics?.metrics?.totalAmount ?? 0)
  const paidExpenses = Number(paidMetrics?.totalAmount ?? paidMetrics?.metrics?.totalAmount ?? 0)
  const thisMonth = Number(thisMonthMetrics?.totalAmount ?? thisMonthMetrics?.metrics?.totalAmount ?? 0)
  const pendingPayables = Math.max(0, totalExpenses - paidExpenses)
  return { totalExpenses, paidExpenses, pendingPayables, thisMonth }
}

// ─── Test Cases ───────────────────────────────────────────────────────────────

describe('normalizeExpense', () => {
  it('maps id, amount, and status correctly from API response', () => {
    const raw = { id: 42, amount: 5000, status: 'Paid' }
    const result = normalizeExpense(raw)
    assert.equal(result.id, 42)
    assert.equal(result.amount, 5000)
    assert.equal(result.status, 'Paid')
    assert.equal(result.amountPaid, 5000)
    assert.equal(result.pendingAmount, 0)
  })

  it('computes amountPaid and pendingAmount from payments[]', () => {
    const raw = {
      id: 10,
      amount: 10000,
      status: 'Partially Paid',
      payments: [
        { id: 1, amount: 3000, paymentMode: 'Cash', status: 'Completed' },
        { id: 2, amount: 2000, paymentMode: 'UPI', status: 'Completed' },
      ],
    }
    const result = normalizeExpense(raw)
    assert.equal(result.amountPaid, 5000)
    assert.equal(result.pendingAmount, 5000)
    assert.equal(result.status, 'Partially Paid')
  })

  it('derives Pending status when amountPaid is 0', () => {
    const raw = { id: 5, amount: 2000, status: 'Pending' }
    const result = normalizeExpense(raw)
    assert.equal(result.status, 'Pending')
    assert.equal(result.amountPaid, 0)
    assert.equal(result.pendingAmount, 2000)
  })

  it('preserves Cancelled status regardless of amounts', () => {
    const raw = { id: 7, amount: 1500, status: 'Cancelled', payments: [] }
    const result = normalizeExpense(raw)
    assert.equal(result.status, 'Cancelled')
  })

  it('throws for invalid records (missing id)', () => {
    assert.throws(() => normalizeExpense({ amount: 100 }), /invalid record/)
    assert.throws(() => normalizeExpense(null), /invalid record/)
  })

  it('handles object-type supplier field gracefully', () => {
    const raw = { id: 20, amount: 500, supplier: { supplierName: 'AgroChem Ltd' } }
    const result = normalizeExpense(raw)
    assert.equal(result.supplier, 'AgroChem Ltd')
  })

  it('extracts expenseSubcategory from remarks metadata', () => {
    const raw = { id: 25, amount: 1500, remarks: '[Subcategory: Hybrid Seeds] High yield variety' }
    const result = normalizeExpense(raw)
    assert.equal(result.expenseSubcategory, 'Hybrid Seeds')
    assert.equal(result.remarks, 'High yield variety')
  })
})

describe('buildExpensePayload', () => {
  const categories = [
    { id: 1, name: 'Seeds' },
    { id: 2, name: 'Fertilizers' },
  ]

  it('sends only backend-accepted fields (no amountPaid, no pendingAmount)', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      description: 'Wheat seeds',
      amount: 5000,
      status: 'Paid',
    }, categories)
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'amountPaid'), 'Must not have amountPaid')
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'pendingAmount'), 'Must not have pendingAmount')
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'id'), 'Must not have id')
  })

  it('resolves category ID when categories array provided', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Fertilizers',
      description: 'NPK 20-20-0',
      amount: 3500,
    }, categories)
    assert.equal(payload.categoryId, 2)
    assert.equal(payload.expenseCategory, 'Fertilizers')
  })

  it('defaults supplier to Direct Purchase when empty', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      description: 'Paddy seeds purchase',
      amount: 1200,
      supplier: '',
    }, categories)
    assert.equal(payload.supplier, 'Direct Purchase')
  })

  it('validates amount must be greater than zero', () => {
    assert.throws(() => buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      description: 'Test',
      amount: 0,
    }, categories), /greater than zero/)

    assert.throws(() => buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      description: 'Test',
      amount: -100,
    }, categories), /greater than zero/)
  })

  it('validates required fields: category and description', () => {
    assert.throws(() => buildExpensePayload({ amount: 500, description: 'Test' }, categories), /category/)
    assert.throws(() => buildExpensePayload({ amount: 500, expenseCategory: 'Seeds' }, categories), /Description/)
  })

  it('formats expenseDate as ISO datetime string', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-11-15',
      expenseCategory: 'Seeds',
      description: 'Wheat seeds',
      amount: 2000,
    }, categories)
    assert.equal(payload.expenseDate, '2026-11-15T00:00:00')
  })

  it('defaults status to Pending when not provided', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      description: 'Test purchase',
      amount: 800,
    }, categories)
    assert.equal(payload.status, 'Pending')
  })

  it('embeds expenseSubcategory cleanly into remarks', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      expenseSubcategory: 'Certified Seeds',
      description: 'Paddy Seeds',
      amount: 1500,
      remarks: 'Batch 2026',
    }, categories)
    assert.ok(payload.remarks.includes('[Subcategory: Certified Seeds]'))
    assert.ok(payload.remarks.includes('Batch 2026'))
  })

  it('removes undefined keys from payload', () => {
    const payload = buildExpensePayload({
      expenseDate: '2026-06-01',
      expenseCategory: 'Seeds',
      description: 'Test',
      amount: 1000,
      paymentMode: '',
      referenceNo: '',
      remarks: '',
    }, categories)
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'paymentMode'))
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'referenceNo'))
    assert.ok(!Object.prototype.hasOwnProperty.call(payload, 'remarks'))
  })
})

describe('computeSummaryCards', () => {
  it('computes pendingPayables as totalExpenses minus paidExpenses', () => {
    const result = computeSummaryCards(
      { totalAmount: 100000 },
      { totalAmount: 60000 },
      { totalAmount: 15000 }
    )
    assert.equal(result.totalExpenses, 100000)
    assert.equal(result.paidExpenses, 60000)
    assert.equal(result.pendingPayables, 40000)
    assert.equal(result.thisMonth, 15000)
  })

  it('handles null metric responses gracefully', () => {
    const result = computeSummaryCards(null, null, null)
    assert.equal(result.totalExpenses, 0)
    assert.equal(result.paidExpenses, 0)
    assert.equal(result.pendingPayables, 0)
    assert.equal(result.thisMonth, 0)
  })

  it('reads from nested metrics object', () => {
    const result = computeSummaryCards(
      { metrics: { totalAmount: 50000 } },
      { metrics: { totalAmount: 30000 } },
      { metrics: { totalAmount: 8000 } }
    )
    assert.equal(result.totalExpenses, 50000)
    assert.equal(result.pendingPayables, 20000)
  })

  it('pendingPayables is never negative', () => {
    const result = computeSummaryCards(
      { totalAmount: 50000 },
      { totalAmount: 70000 }, // paid more than total (edge case)
      null
    )
    assert.equal(result.pendingPayables, 0)
  })
})

describe('isoDateTime', () => {
  it('converts YYYY-MM-DD to ISO datetime', () => {
    assert.equal(isoDateTime('2026-06-15'), '2026-06-15T00:00:00')
  })

  it('returns null for empty input', () => {
    assert.equal(isoDateTime(''), null)
    assert.equal(isoDateTime(null), null)
  })

  it('handles full ISO strings by extracting date part', () => {
    assert.equal(isoDateTime('2026-06-15T10:30:00'), '2026-06-15T00:00:00')
  })
})

describe('formatCurrency', () => {
  it('formats Indian Rupee correctly', () => {
    const result = formatCurrency(5000)
    assert.ok(result.includes('5,000') || result.includes('5000'), `Expected currency format, got: ${result}`)
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    assert.ok(result.includes('0'), `Expected zero, got: ${result}`)
  })

  it('handles non-numeric gracefully', () => {
    const result = formatCurrency('invalid')
    // 'invalid' has no digits so parseDecimal → 0
    assert.ok(typeof result === 'string')
  })
})

describe('isoToDisplayDate (dd/mm/yyyy convention)', () => {
  it('formats ISO YYYY-MM-DD to dd/mm/yyyy', () => {
    assert.equal(isoToDisplayDate('2026-11-24'), '24/11/2026')
    assert.equal(isoToDisplayDate('2026-05-09'), '09/05/2026')
  })

  it('returns empty string for empty or null input', () => {
    assert.equal(isoToDisplayDate(''), '')
    assert.equal(isoToDisplayDate(null), '')
    assert.equal(isoToDisplayDate(undefined), '')
  })

  it('extracts date part from full ISO timestamp', () => {
    assert.equal(isoToDisplayDate('2026-11-24T10:30:00Z'), '24/11/2026')
  })
})

describe('displayDateToIso (dd/mm/yyyy to YYYY-MM-DD)', () => {
  it('converts dd/mm/yyyy to YYYY-MM-DD', () => {
    assert.equal(displayDateToIso('24/11/2026'), '2026-11-24')
    assert.equal(displayDateToIso('09/05/2026'), '2026-05-09')
  })

  it('handles single-digit day and month with padStart', () => {
    assert.equal(displayDateToIso('5/6/2026'), '2026-06-05')
    assert.equal(displayDateToIso('9/11/2026'), '2026-11-09')
  })

  it('supports dash-separated dd-mm-yyyy', () => {
    assert.equal(displayDateToIso('24-11-2026'), '2026-11-24')
  })

  it('returns null for invalid date strings', () => {
    assert.equal(displayDateToIso('invalid'), null)
    assert.equal(displayDateToIso('32/01/2026'), null) // invalid day
    assert.equal(displayDateToIso('15/13/2026'), null) // invalid month
    assert.equal(displayDateToIso(''), '')
    assert.equal(displayDateToIso(null), '')
  })
})
