// frontend/tests/receipt-api.test.mjs
// Run with: node --test frontend/tests/receipt-api.test.mjs

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ─── Pure utility functions mirroring receiptService.js ───────────────────────

function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

function formatDate(val) {
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

function parseDecimal(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function normalizeReceipt(raw) {
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

function computeReceiptSummaryCards(records = [], externalReceivables = 0) {
  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  let totalCount = 0
  let totalReceived = 0
  let pendingAmount = 0
  let thisMonthAmount = 0

  records.forEach((r) => {
    const finalAmt = Number(r.finalAmount ?? r.amount ?? 0)

    if (r.status !== 'Cancelled') {
      totalCount += 1
    }

    if (r.status === 'Completed') {
      totalReceived += finalAmt
      if (r.receiptDate >= firstOfMonth) {
        thisMonthAmount += finalAmt
      }
    } else if (r.status === 'Pending' || r.status === 'Processing') {
      pendingAmount += finalAmt
    }
  })

  const totalPendingReceivables = Math.max(0, Math.round((pendingAmount + (Number(externalReceivables) || 0)) * 100) / 100)

  return {
    totalReceipts: totalCount,
    totalReceived: Math.round(totalReceived * 100) / 100,
    pendingReceivables: totalPendingReceivables,
    thisMonthAmount: Math.round(thisMonthAmount * 100) / 100,
  }
}

function validateReceiptPayload(form) {
  const amount = parseDecimal(form.amount)
  if (amount <= 0) throw new Error('Receipt amount must be greater than zero.')
  if (!form.receiptDate) throw new Error('Receipt date is required.')
  if (!form.purpose?.trim()) throw new Error('Receipt purpose is required.')
  if (!form.payerName?.trim()) throw new Error('Customer / Payer name is required.')
  if (!form.collectionMode?.trim()) throw new Error('Collection method is required.')
  if (form.collectionMode === 'Cheque' && !form.chequeNo?.trim()) {
    throw new Error('Cheque number is required for Cheque payment mode.')
  }
  return true
}

function numberToWordsINR(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0))
  if (num === 0) return 'Zero Rupees Only'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertBelowThousand(n) {
    let str = ''
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      str += ones[n] + ' '
    }
    return str.trim()
  }

  let words = ''
  const crore = Math.floor(num / 10000000)
  let rem = num % 10000000

  const lakh = Math.floor(rem / 100000)
  rem = rem % 100000

  const thousand = Math.floor(rem / 1000)
  rem = rem % 1000

  if (crore > 0) words += convertBelowThousand(crore) + ' Crore '
  if (lakh > 0) words += convertBelowThousand(lakh) + ' Lakh '
  if (thousand > 0) words += convertBelowThousand(thousand) + ' Thousand '
  if (rem > 0) words += convertBelowThousand(rem) + ' '

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ')
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AGRIMAN Receipts Module Unit Tests', () => {

  describe('1. Normalization & Decimal Accuracy', () => {
    it('normalizes basic receipt with auto-calculated final amount', () => {
      const raw = {
        id: 201,
        receiptNo: 'REC-2026-0001',
        receiptDate: '2026-10-15',
        amount: 50000,
        discount: 1000,
        otherCharges: 250,
        payerName: 'Sri Lakshmi Traders',
        purpose: 'Paddy Sales Collection',
        status: 'completed',
      }
      const res = normalizeReceipt(raw)
      assert.equal(res.id, 201)
      assert.equal(res.receiptNo, 'REC-2026-0001')
      assert.equal(res.amount, 50000)
      assert.equal(res.discount, 1000)
      assert.equal(res.otherCharges, 250)
      assert.equal(res.finalAmount, 49250) // 50000 - 1000 + 250
      assert.equal(res.status, 'Completed')
    })

    it('handles sales payment shape (paymentAmount, paymentNo, buyer, salesNo)', () => {
      const raw = {
        id: 505,
        paymentNo: 'REC-S-505',
        paymentDate: '2026-09-25',
        paymentAmount: 85000,
        buyer: 'Kisan Cotton Mill',
        salesNo: 'SAL-2026-0038',
        status: 'paid',
      }
      const res = normalizeReceipt(raw)
      assert.equal(res.receiptNo, 'REC-S-505')
      assert.equal(res.receiptDate, '2026-09-25')
      assert.equal(res.amount, 85000)
      assert.equal(res.finalAmount, 85000)
      assert.equal(res.payerName, 'Kisan Cotton Mill')
      assert.equal(res.payerType, 'Wholesale Buyer / Trader')
      assert.equal(res.refType, 'Sales Invoice')
      assert.equal(res.refNo, 'SAL-2026-0038')
      assert.equal(res.status, 'Completed')
    })

    it('handles legacy customer collection shape with default fallback mappings', () => {
      const raw = {
        id: 605,
        from: 'Ravi Verma',
        amount: 15000,
        status: 'pending',
      }
      const res = normalizeReceipt(raw)
      assert.equal(res.payerName, 'Ravi Verma')
      assert.equal(res.amount, 15000)
      assert.equal(res.status, 'Pending')
    })

    it('rejects invalid or non-object records', () => {
      assert.throws(() => normalizeReceipt(null), /invalid or has no ID/)
      assert.throws(() => normalizeReceipt({}), /invalid or has no ID/)
      assert.throws(() => normalizeReceipt('invalid'), /invalid or has no ID/)
    })

    it('clamps negative final amount to 0 when discount exceeds base amount', () => {
      const raw = { id: 202, amount: 500, discount: 1000 }
      const res = normalizeReceipt(raw)
      assert.equal(res.finalAmount, 0)
    })
  })

  describe('2. Summary Cards Computation', () => {
    const mockReceipts = [
      { id: 1, finalAmount: 100000, status: 'Completed', receiptDate: '2026-11-10' },
      { id: 2, finalAmount: 50000, status: 'Completed', receiptDate: '2026-10-15' },
      { id: 3, finalAmount: 25000, status: 'Pending', receiptDate: '2026-11-20' },
      { id: 4, finalAmount: 15000, status: 'Processing', receiptDate: '2026-11-22' },
      { id: 5, finalAmount: 40000, status: 'Cancelled', receiptDate: '2026-11-05' },
    ]

    it('strictly separates Completed and Pending collections', () => {
      const summary = computeReceiptSummaryCards(mockReceipts, 10000)
      // totalReceipts excludes Cancelled: 4 records
      assert.equal(summary.totalReceipts, 4)
      // totalReceived strictly includes Completed only: 100000 + 50000 = 150000
      assert.equal(summary.totalReceived, 150000)
      // pendingReceivables includes Pending (25000) + Processing (15000) + externalReceivables (10000) = 50000
      assert.equal(summary.pendingReceivables, 50000)
    })

    it('excludes cancelled transactions from total receipts and received money', () => {
      const summary = computeReceiptSummaryCards([
        { id: 1, finalAmount: 50000, status: 'Cancelled' },
        { id: 2, finalAmount: 20000, status: 'Failed' },
      ])
      assert.equal(summary.totalReceipts, 1) // only Failed is an attempted receipt
      assert.equal(summary.totalReceived, 0)
      assert.equal(summary.pendingReceivables, 0)
    })

    it('handles empty receipts list gracefully', () => {
      const summary = computeReceiptSummaryCards([], 0)
      assert.deepEqual(summary, {
        totalReceipts: 0,
        totalReceived: 0,
        pendingReceivables: 0,
        thisMonthAmount: 0,
      })
    })
  })

  describe('3. Date Format Conversions', () => {
    it('converts ISO YYYY-MM-DD to display DD/MM/YYYY', () => {
      assert.equal(isoToDisplayDate('2026-10-22'), '22/10/2026')
      assert.equal(isoToDisplayDate('2026-01-05'), '05/01/2026')
      assert.equal(isoToDisplayDate(''), '')
      assert.equal(isoToDisplayDate(null), '')
    })

    it('converts display DD/MM/YYYY to ISO YYYY-MM-DD', () => {
      assert.equal(displayDateToIso('22/10/2026'), '2026-10-22')
      assert.equal(displayDateToIso('5/1/2026'), '2026-01-05')
      assert.equal(displayDateToIso('15-08-2026'), '2026-08-15')
    })

    it('rejects invalid display dates', () => {
      assert.equal(displayDateToIso('32/01/2026'), null)
      assert.equal(displayDateToIso('15/13/2026'), null)
      assert.equal(displayDateToIso('invalid'), null)
      assert.equal(displayDateToIso(''), '')
    })
  })

  describe('4. Currency & Decimal Helpers', () => {
    it('formats numbers as INR currency', () => {
      const res = formatCurrency(175000)
      assert.ok(res.includes('1,75,000'), `Expected 1,75,000 in: ${res}`)
    })

    it('parses formatted strings to clean decimals', () => {
      assert.equal(parseDecimal('₹ 1,75,000.50'), 175000.5)
      assert.equal(parseDecimal('34440'), 34440)
      assert.equal(parseDecimal(''), 0)
      assert.equal(parseDecimal(null), 0)
      assert.equal(parseDecimal('abc'), 0)
    })
  })

  describe('5. Form & Payload Validation', () => {
    it('validates a complete valid receipt payload', () => {
      const valid = {
        receiptNo: 'REC-2026-0099',
        receiptDate: '2026-11-20',
        purpose: 'Paddy Sales Collection',
        payerName: 'Sri Lakshmi Traders',
        amount: '175000',
        collectionMode: 'Bank Transfer',
      }
      assert.equal(validateReceiptPayload(valid), true)
    })

    it('throws error when amount is <= 0', () => {
      const invalid = {
        receiptDate: '2026-11-20',
        purpose: 'Crop Sales',
        payerName: 'Buyer',
        amount: '0',
        collectionMode: 'Cash',
      }
      assert.throws(() => validateReceiptPayload(invalid), /amount must be greater than zero/)
    })

    it('throws error when cheque number is missing for Cheque mode', () => {
      const invalid = {
        receiptDate: '2026-11-20',
        purpose: 'Crop Sales',
        payerName: 'Buyer',
        amount: '15000',
        collectionMode: 'Cheque',
        chequeNo: '',
      }
      assert.throws(() => validateReceiptPayload(invalid), /Cheque number is required/)
    })
  })

  describe('6. Indian Rupee Number to Words Converter for Voucher', () => {
    it('converts exact amounts to words', () => {
      assert.equal(numberToWordsINR(175000), 'One Lakh Seventy Five Thousand Rupees Only')
      assert.equal(numberToWordsINR(34440), 'Thirty Four Thousand Four Hundred Forty Rupees Only')
      assert.equal(numberToWordsINR(500), 'Five Hundred Rupees Only')
      assert.equal(numberToWordsINR(0), 'Zero Rupees Only')
    })
  })

})
