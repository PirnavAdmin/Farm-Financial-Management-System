// frontend/tests/payment-api.test.mjs
// Run with: node --test frontend/tests/payment-api.test.mjs

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ─── Pure utility functions mirroring paymentService.js ───────────────────────

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

function normalizePayment(raw) {
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

function computePaymentSummaryCards(records = []) {
  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  let totalCount = 0
  let totalPayments = 0
  let successfulAmount = 0
  let pendingAmount = 0
  let thisMonthAmount = 0

  records.forEach((p) => {
    const amount = Number(p.totalAmount ?? p.amount ?? 0)

    if (p.status !== 'Cancelled') {
      totalCount += 1
      totalPayments += amount
    }

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

function validatePaymentPayload(form) {
  const amount = parseDecimal(form.amount)
  if (amount <= 0) throw new Error('Payment amount must be greater than zero.')
  if (!form.paymentDate) throw new Error('Payment date is required.')
  if (!form.purpose?.trim()) throw new Error('Payment purpose is required.')
  if (!form.payeeName?.trim()) throw new Error('Payee name is required.')
  if (!form.paymentMode?.trim()) throw new Error('Payment method is required.')
  if (form.paymentMode === 'Cheque' && !form.chequeNo?.trim()) {
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

describe('AGRIMAN Payments Module Unit Tests', () => {

  describe('1. Normalization & Decimal Accuracy', () => {
    it('normalizes basic payment with auto-calculated total amount', () => {
      const raw = {
        id: 101,
        paymentNo: 'PAY-2026-0001',
        paymentDate: '2026-10-15',
        amount: 5000,
        additionalCharges: 150,
        discount: 50,
        payeeName: 'Agro Seeds Ltd',
        purpose: 'Supplier Payment',
        status: 'completed',
      }
      const res = normalizePayment(raw)
      assert.equal(res.id, 101)
      assert.equal(res.paymentNo, 'PAY-2026-0001')
      assert.equal(res.amount, 5000)
      assert.equal(res.additionalCharges, 150)
      assert.equal(res.discount, 50)
      assert.equal(res.totalAmount, 5100) // 5000 + 150 - 50
      assert.equal(res.status, 'Completed')
    })

    it('handles legacy supplier payment shape (amountPaid, paymentCode)', () => {
      const raw = {
        id: 205,
        paymentCode: 'SPY-205',
        date: '2026-09-20',
        amountPaid: 12500,
        supplierName: 'Fertilizers Depot',
        status: 'paid',
      }
      const res = normalizePayment(raw)
      assert.equal(res.paymentNo, 'SPY-205')
      assert.equal(res.paymentDate, '2026-09-20')
      assert.equal(res.amount, 12500)
      assert.equal(res.totalAmount, 12500)
      assert.equal(res.payeeName, 'Fertilizers Depot')
      assert.equal(res.payeeType, 'Supplier / Vendor')
      assert.equal(res.status, 'Completed')
    })

    it('handles labour payment shape (labourId, labourName)', () => {
      const raw = {
        id: 305,
        labourId: 12,
        labourName: 'Ramesh Kumar',
        amount: 4500,
        status: 'pending',
      }
      const res = normalizePayment(raw)
      assert.equal(res.payeeType, 'Employee / Labourer')
      assert.equal(res.payeeName, 'Ramesh Kumar')
      assert.equal(res.purpose, 'Labour Wages')
      assert.equal(res.status, 'Pending')
    })

    it('rejects invalid or non-object records', () => {
      assert.throws(() => normalizePayment(null), /invalid or has no ID/)
      assert.throws(() => normalizePayment({}), /invalid or has no ID/)
      assert.throws(() => normalizePayment('invalid'), /invalid or has no ID/)
    })

    it('clamps negative total to 0 when discount exceeds amount', () => {
      const raw = { id: 102, amount: 200, discount: 500 }
      const res = normalizePayment(raw)
      assert.equal(res.totalAmount, 0)
    })
  })

  describe('2. Summary Cards Computation', () => {
    const mockPayments = [
      { id: 1, totalAmount: 10000, status: 'Completed', paymentDate: '2026-11-10' },
      { id: 2, totalAmount: 5000, status: 'Completed', paymentDate: '2026-10-15' },
      { id: 3, totalAmount: 3000, status: 'Pending', paymentDate: '2026-11-20' },
      { id: 4, totalAmount: 2000, status: 'Processing', paymentDate: '2026-11-22' },
      { id: 5, totalAmount: 8000, status: 'Cancelled', paymentDate: '2026-11-05' },
    ]

    it('strictly separates Completed and Pending disbursements', () => {
      const summary = computePaymentSummaryCards(mockPayments)
      // totalRecords excludes Cancelled: 4 records
      assert.equal(summary.totalRecords, 4)
      // totalPayments excludes Cancelled: 10000 + 5000 + 3000 + 2000 = 20000
      assert.equal(summary.totalPayments, 20000)
      // successfulAmount includes only Completed: 10000 + 5000 = 15000
      assert.equal(summary.successfulAmount, 15000)
      // pendingAmount includes Pending & Processing: 3000 + 2000 = 5000
      assert.equal(summary.pendingAmount, 5000)
    })

    it('excludes cancelled transactions from total payments and successful outflows', () => {
      const summary = computePaymentSummaryCards([
        { id: 1, totalAmount: 5000, status: 'Cancelled' },
        { id: 2, totalAmount: 5000, status: 'Failed' },
      ])
      assert.equal(summary.totalRecords, 1) // only Failed is counted in recorded attempts
      assert.equal(summary.successfulAmount, 0)
      assert.equal(summary.pendingAmount, 0)
    })

    it('handles empty payments list gracefully', () => {
      const summary = computePaymentSummaryCards([])
      assert.deepEqual(summary, {
        totalRecords: 0,
        totalPayments: 0,
        successfulAmount: 0,
        pendingAmount: 0,
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
      const res = formatCurrency(18500)
      assert.ok(res.includes('18,500'), `Expected 18,500 in: ${res}`)
    })

    it('parses formatted strings to clean decimals', () => {
      assert.equal(parseDecimal('₹ 18,500.50'), 18500.5)
      assert.equal(parseDecimal('12000'), 12000)
      assert.equal(parseDecimal(''), 0)
      assert.equal(parseDecimal(null), 0)
      assert.equal(parseDecimal('abc'), 0)
    })
  })

  describe('5. Form & Payload Validation', () => {
    it('validates a complete valid payment payload', () => {
      const valid = {
        paymentNo: 'PAY-2026-0099',
        paymentDate: '2026-11-20',
        purpose: 'Supplier Payment',
        payeeName: 'Kisan Fert Chem',
        amount: '8500',
        paymentMode: 'Bank Transfer',
      }
      assert.equal(validatePaymentPayload(valid), true)
    })

    it('throws error when amount is <= 0', () => {
      const invalid = {
        paymentDate: '2026-11-20',
        purpose: 'Supplier Payment',
        payeeName: 'Vendor',
        amount: '0',
        paymentMode: 'Cash',
      }
      assert.throws(() => validatePaymentPayload(invalid), /amount must be greater than zero/)
    })

    it('throws error when cheque number is missing for Cheque mode', () => {
      const invalid = {
        paymentDate: '2026-11-20',
        purpose: 'Supplier Payment',
        payeeName: 'Vendor',
        amount: '5000',
        paymentMode: 'Cheque',
        chequeNo: '',
      }
      assert.throws(() => validatePaymentPayload(invalid), /Cheque number is required/)
    })
  })

  describe('6. Indian Rupee Number to Words Converter for Voucher', () => {
    it('converts exact amounts to words', () => {
      assert.equal(numberToWordsINR(18500), 'Eighteen Thousand Five Hundred Rupees Only')
      assert.equal(numberToWordsINR(500), 'Five Hundred Rupees Only')
      assert.equal(numberToWordsINR(125000), 'One Lakh Twenty Five Thousand Rupees Only')
      assert.equal(numberToWordsINR(0), 'Zero Rupees Only')
    })
  })

})
