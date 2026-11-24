// frontend/tests/loan-api.test.mjs
// Run with: node --test frontend/tests/loan-api.test.mjs

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ─── Pure utility functions mirroring loans.jsx & loanService.js ─────────────

function parseAmount(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  const clean = String(val ?? '').replace(/[^\d.-]/g, '')
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : 0
}

function parseRate(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  const clean = String(val ?? '').replace(/[^\d.]/g, '')
  const n = parseFloat(clean)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(n)) return String(val ?? '')
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(val) {
  if (!val) return ''
  const dateOnly = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`
  }
  return val
}

function computeEmiClient(principal, ratePercent, tenureMonths, frequency = 'Monthly') {
  const P = parseAmount(principal)
  const R = parseRate(ratePercent)
  const N = tenureMonths !== undefined && tenureMonths !== null && tenureMonths !== '' ? parseInt(tenureMonths, 10) : 12
  if (P <= 0 || !Number.isFinite(N) || N <= 0) return 0
  if (R <= 0) return Math.round(P / N)

  const periodsPerYear = frequency === 'Quarterly' ? 4 : frequency === 'Half-Yearly' ? 2 : frequency === 'Yearly' ? 1 : 12
  const totalPeriods = frequency === 'Quarterly' ? Math.ceil(N / 3) : frequency === 'Half-Yearly' ? Math.ceil(N / 6) : frequency === 'Yearly' ? Math.ceil(N / 12) : N
  const r = R / (100 * periodsPerYear)

  const factor = Math.pow(1 + r, totalPeriods)
  const emi = (P * r * factor) / (factor - 1)
  return Math.round(emi)
}

function normalizeLoan(raw) {
  if (!raw || typeof raw !== 'object' || (raw.loanId == null && raw.id == null)) {
    throw new Error('Invalid loan object')
  }
  const id = raw.loanId ?? raw.id
  return {
    ...raw,
    id,
    loanId: id,
    bankName: raw.bankLender || raw.bankName || '',
    sanctionAmount: Number(raw.sanctionAmount) || 0,
    disbursedAmount: Number(raw.disbursedAmount) || Number(raw.sanctionAmount) || 0,
    outstandingAmount: Number(raw.outstandingAmount !== undefined ? raw.outstandingAmount : (raw.outstandingPrincipal ?? raw.sanctionAmount)) || 0,
    outstandingPrincipal: Number(raw.outstandingPrincipal !== undefined ? raw.outstandingPrincipal : (raw.outstandingAmount ?? raw.sanctionAmount)) || 0,
    emi: Number(raw.emi || raw.emiAmount) || 0,
    startDate: raw.startDate?.slice(0, 10) || '',
    endDate: raw.endDate?.slice(0, 10) || '',
    nextEmiDueDate: raw.nextEmiDueDate?.slice(0, 10) || '',
  }
}

function normalizePayment(raw) {
  return {
    ...raw,
    id: raw.voucherNo || String(raw.paymentId || raw.id),
    paymentDate: raw.paymentDate?.slice(0, 10) || '',
    principal: Number(raw.principal) || 0,
    interest: Number(raw.interest) || 0,
    penalty: Number(raw.penalty) || 0,
    totalPayment: Number(raw.totalPayment) || 0,
  }
}

// ─── Mock API and loanService simulation ──────────────────────────────────────

const requests = []
const mockApi = {
  get: async (url, config) => {
    requests.push({ method: 'GET', url, config })
    return { data: { success: true } }
  },
  post: async (url, data, config) => {
    requests.push({ method: 'POST', url, data, config })
    return { data: { success: true, ...data } }
  },
  put: async (url, data, config) => {
    requests.push({ method: 'PUT', url, data, config })
    return { data: { success: true, ...data } }
  },
  delete: async (url, config) => {
    requests.push({ method: 'DELETE', url, config })
    return { data: { success: true } }
  },
}

const root = '/api/Loan'
const dateTime = (value) => {
  if (!value) return undefined
  return value.includes('T') ? value : `${value.slice(0, 10)}T00:00:00`
}

const loanService = {
  async list(params) {
    const res = await mockApi.get(root, { params })
    return res.data
  },
  async summary() {
    const res = await mockApi.get(`${root}/summary`)
    return res.data
  },
  async payments(params) {
    const res = await mockApi.get(`${root}/payments`, { params })
    return res.data
  },
  async paymentSummary() {
    const res = await mockApi.get(`${root}/payment-summary`)
    return res.data
  },
  async detail(id) {
    const res = await mockApi.get(`${root}/${id}`)
    return res.data
  },
  async save(loan, id) {
    const body = {
      loanId: id ?? 0,
      loanNo: loan.loanNo,
      loanAccountNo: loan.loanAccountNo || loan.accountNo || undefined,
      bankLender: loan.bankName || loan.bankLender,
      loanType: loan.loanType,
      loanPurpose: loan.loanPurpose || loan.remarks || undefined,
      sanctionAmount: Number(loan.sanctionAmount) || 0,
      disbursedAmount: loan.disbursedAmount !== undefined && loan.disbursedAmount !== '' ? Number(loan.disbursedAmount) : undefined,
      outstandingAmount: loan.outstandingAmount !== undefined && loan.outstandingAmount !== '' ? Number(loan.outstandingAmount) : undefined,
      interestRate: Number(loan.interestRate) || 0,
      interestType: loan.interestType || 'Fixed',
      tenureMonths: Number(loan.tenureMonths) || 12,
      repaymentFrequency: loan.repaymentFrequency || 'Monthly',
      emi: loan.emi ? Number(loan.emi) : undefined,
      startDate: dateTime(loan.startDate),
      endDate: loan.endDate ? dateTime(loan.endDate) : undefined,
      processingFees: Number(loan.processingFees) || 0,
      status: loan.status || 'Active',
      remarks: loan.remarks || undefined,
    }
    const res = id == null
      ? await mockApi.post(root, body)
      : await mockApi.put(`${root}/${id}`, body)
    return res.data
  },
  async remove(id) {
    const res = await mockApi.delete(`${root}/${id}`)
    return res.data
  },
  async recordPayment(loanId, payment) {
    const { id, loanNo: _loanNo, ...fields } = payment
    const res = await mockApi.post(`${root}/${loanId}/payments`, {
      ...fields,
      voucherNo: payment.voucherNo || id || undefined,
      paymentDate: dateTime(payment.paymentDate),
      principal: Number(payment.principal) || 0,
      interest: Number(payment.interest) || 0,
      penalty: Number(payment.penalty) || 0,
      totalPayment: Number(payment.totalPayment) || 0,
      installmentNumber: payment.installmentNumber ? Number(payment.installmentNumber) : undefined,
      paymentType: payment.paymentType || 'Regular EMI',
    })
    return res.data
  },
  async disbursements(loanId) {
    const res = await mockApi.get(`${root}/${loanId}/disbursements`)
    return res.data
  },
  async recordDisbursement(loanId, disbursement) {
    const res = await mockApi.post(`${root}/${loanId}/disbursements`, {
      ...disbursement,
      disbursementDate: dateTime(disbursement.disbursementDate),
      disbursedAmount: Number(disbursement.disbursedAmount) || 0,
    })
    return res.data
  },
  async schedule(loanId) {
    const res = await mockApi.get(`${root}/${loanId}/schedule`)
    return res.data
  },
  async recalculateSchedule(loanId) {
    const res = await mockApi.post(`${root}/${loanId}/recalculate-schedule`, {})
    return res.data
  },
  async closeLoan(loanId, closureData) {
    const res = await mockApi.post(`${root}/${loanId}/close`, {
      ...closureData,
      closedDate: dateTime(closureData.closedDate),
      finalSettlementAmount: Number(closureData.finalSettlementAmount) || 0,
    })
    return res.data
  },
  async report(reportType, params) {
    const res = await mockApi.get(`${root}/reports/${reportType}`, { params })
    return res.data
  },
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

describe('Loan Module: Pure Calculation & Utility Tests', () => {
  it('correctly parses amounts and rates from diverse inputs', () => {
    assert.equal(parseAmount('5,00,000'), 500000)
    assert.equal(parseAmount('₹ 1,50,000.50'), 150000.5)
    assert.equal(parseAmount(75000), 75000)
    assert.equal(parseAmount(null), 0)
    assert.equal(parseAmount(''), 0)

    assert.equal(parseRate('7.5%'), 7.5)
    assert.equal(parseRate('11.25'), 11.25)
    assert.equal(parseRate(8), 8)
    assert.equal(parseRate(undefined), 0)
  })

  it('formats dates cleanly in Indian day-month-year display', () => {
    assert.equal(formatDate('2026-11-24T10:00:00'), '24 Nov 2026')
    assert.equal(formatDate('2026-03-05'), '05 Mar 2026')
    assert.equal(formatDate(''), '')
  })

  it('formats currency with INR symbol and no decimals by default', () => {
    const formatted = formatCurrency(500000)
    assert.ok(formatted.includes('5,00,000'))
  })

  it('computes EMI accurately across Monthly, Quarterly, and 0% rate scenarios', () => {
    // 0% Interest (e.g. state subsidy scheme)
    const zeroRateEmi = computeEmiClient(120000, 0, 12, 'Monthly')
    assert.equal(zeroRateEmi, 10000)

    // Standard 5,00,000 loan at 7% p.a. for 12 months Monthly
    // Monthly rate = 7% / 12 = 0.0058333. Factor = (1+r)^12 = 1.07229
    // Expected EMI is approx 43,264
    const monthlyEmi = computeEmiClient(500000, 7, 12, 'Monthly')
    assert.ok(monthlyEmi > 43000 && monthlyEmi < 43500)

    // Quarterly frequency for 12 months (4 installments)
    const quarterlyEmi = computeEmiClient(500000, 7, 12, 'Quarterly')
    assert.ok(quarterlyEmi > 125000 && quarterlyEmi < 135000)

    // Edge cases: 0 principal or 0 tenure
    assert.equal(computeEmiClient(0, 7, 12), 0)
    assert.equal(computeEmiClient(500000, 7, 0), 0)
  })
})

describe('Loan Module: Normalization Tests', () => {
  it('normalizes raw loan DTOs into consistent frontend model', () => {
    const raw = {
      loanId: 101,
      loanNo: 'LOAN-2026-001',
      bankLender: 'District Cooperative Central Bank (DCCB)',
      loanType: 'Crop Loan (KCC)',
      sanctionAmount: '300000',
      disbursedAmount: '300000',
      outstandingPrincipal: '250000',
      interestRate: 7,
      startDate: '2026-04-01T00:00:00',
      status: 'Active',
    }
    const norm = normalizeLoan(raw)
    assert.equal(norm.id, 101)
    assert.equal(norm.loanId, 101)
    assert.equal(norm.bankName, 'District Cooperative Central Bank (DCCB)')
    assert.equal(norm.sanctionAmount, 300000)
    assert.equal(norm.outstandingAmount, 250000)
    assert.equal(norm.startDate, '2026-04-01')
  })

  it('normalizes payment DTOs correctly', () => {
    const raw = {
      voucherNo: 'PMT-2026-042',
      loanNo: 'LOAN-2026-001',
      paymentDate: '2026-11-20T14:30:00',
      principal: '25000',
      interest: '1750',
      penalty: '0',
      totalPayment: '26750',
      paymentMode: 'Bank Transfer / NEFT / RTGS',
    }
    const norm = normalizePayment(raw)
    assert.equal(norm.id, 'PMT-2026-042')
    assert.equal(norm.paymentDate, '2026-11-20')
    assert.equal(norm.principal, 25000)
    assert.equal(norm.interest, 1750)
    assert.equal(norm.totalPayment, 26750)
  })
})

describe('Loan Module: API Integration & Service Contract Tests', () => {
  it('calls POST /api/Loan with correctly formatted DTO on new loan creation', async () => {
    requests.length = 0
    const loanPayload = {
      loanNo: 'LOAN-2026-005',
      bankName: 'State Bank of India (Agri Branch)',
      loanType: 'Tractor / Equipment Loan',
      loanPurpose: 'Purchase of 45HP 4WD Tractor',
      sanctionAmount: 650000,
      disbursedAmount: 650000,
      interestRate: 8.5,
      interestType: 'Fixed',
      tenureMonths: 60,
      repaymentFrequency: 'Monthly',
      startDate: '2026-11-01',
      status: 'Active',
      remarks: 'Primary hypothecation on tractor asset',
    }

    await loanService.save(loanPayload)
    assert.equal(requests.length, 1)
    const req = requests[0]
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/api/Loan')
    assert.equal(req.data.loanId, 0)
    assert.equal(req.data.bankLender, 'State Bank of India (Agri Branch)')
    assert.equal(req.data.startDate, '2026-11-01T00:00:00')
    assert.equal(req.data.sanctionAmount, 650000)
  })

  it('calls PUT /api/Loan/{id} with loanId on existing loan update', async () => {
    requests.length = 0
    const loanPayload = {
      loanNo: 'LOAN-2026-005',
      bankName: 'State Bank of India (Agri Branch)',
      loanType: 'Tractor / Equipment Loan',
      sanctionAmount: 650000,
      interestRate: 8.5,
      tenureMonths: 60,
      startDate: '2026-11-01',
      status: 'Active',
    }

    await loanService.save(loanPayload, 42)
    assert.equal(requests.length, 1)
    const req = requests[0]
    assert.equal(req.method, 'PUT')
    assert.equal(req.url, '/api/Loan/42')
    assert.equal(req.data.loanId, 42)
  })

  it('calls DELETE /api/Loan/{id} on loan removal', async () => {
    requests.length = 0
    await loanService.remove(42)
    assert.equal(requests.length, 1)
    assert.equal(requests[0].method, 'DELETE')
    assert.equal(requests[0].url, '/api/Loan/42')
  })

  it('records payment voucher via POST /api/Loan/{loanId}/payments with clean DTO', async () => {
    requests.length = 0
    const pmt = {
      id: 'VCH-2026-088',
      voucherNo: 'VCH-2026-088',
      loanNo: 'LOAN-2026-001',
      paymentDate: '2026-11-24',
      principal: 20000,
      interest: 1500,
      penalty: 0,
      totalPayment: 21500,
      paymentMode: 'UPI',
      referenceNo: 'UPI987654321',
      remarks: 'EMI installment payment',
    }

    await loanService.recordPayment(101, pmt)
    assert.equal(requests.length, 1)
    const req = requests[0]
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/api/Loan/101/payments')
    assert.equal(req.data.voucherNo, 'VCH-2026-088')
    assert.equal(req.data.paymentDate, '2026-11-24T00:00:00')
    assert.equal(req.data.principal, 20000)
    assert.equal(req.data.totalPayment, 21500)
  })

  it('records additional disbursement tranche via POST /api/Loan/{loanId}/disbursements', async () => {
    requests.length = 0
    const tranche = {
      disbursementNo: 'DSB-2026-002',
      disbursementDate: '2026-11-24',
      disbursedAmount: 150000,
      bankAccount: 'HDFC Bank - 50100234567890',
      referenceNo: 'RTGS-TRF-992211',
      remarks: 'Second tranche release for irrigation pipe installation',
    }

    await loanService.recordDisbursement(101, tranche)
    assert.equal(requests.length, 1)
    const req = requests[0]
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/api/Loan/101/disbursements')
    assert.equal(req.data.disbursedAmount, 150000)
    assert.equal(req.data.disbursementDate, '2026-11-24T00:00:00')
  })

  it('settles and closes loan via POST /api/Loan/{loanId}/close', async () => {
    requests.length = 0
    const closureData = {
      closedDate: '2026-11-24',
      finalSettlementAmount: 85000,
      closureReason: 'Preclosure via crop harvest proceeds',
      nocReceived: true,
      remarks: 'Full & final settlement receipt issued by bank',
    }

    await loanService.closeLoan(101, closureData)
    assert.equal(requests.length, 1)
    const req = requests[0]
    assert.equal(req.method, 'POST')
    assert.equal(req.url, '/api/Loan/101/close')
    assert.equal(req.data.finalSettlementAmount, 85000)
    assert.equal(req.data.closedDate, '2026-11-24T00:00:00')
    assert.equal(req.data.nocReceived, true)
  })

  it('triggers schedule recalculation via POST /api/Loan/{loanId}/recalculate-schedule', async () => {
    requests.length = 0
    await loanService.recalculateSchedule(101)
    assert.equal(requests.length, 1)
    assert.equal(requests[0].method, 'POST')
    assert.equal(requests[0].url, '/api/Loan/101/recalculate-schedule')
  })

  it('fetches read endpoints correctly', async () => {
    requests.length = 0
    await loanService.list({ status: 'Active' })
    await loanService.summary()
    await loanService.payments({ paymentMode: 'UPI' })
    await loanService.paymentSummary()
    await loanService.detail(101)
    await loanService.disbursements(101)
    await loanService.schedule(101)
    await loanService.report('statement', { loanId: 101 })

    assert.equal(requests.length, 8)
    assert.equal(requests[0].url, '/api/Loan')
    assert.deepEqual(requests[0].config.params, { status: 'Active' })
    assert.equal(requests[1].url, '/api/Loan/summary')
    assert.equal(requests[2].url, '/api/Loan/payments')
    assert.equal(requests[3].url, '/api/Loan/payment-summary')
    assert.equal(requests[4].url, '/api/Loan/101')
    assert.equal(requests[5].url, '/api/Loan/101/disbursements')
    assert.equal(requests[6].url, '/api/Loan/101/schedule')
    assert.equal(requests[7].url, '/api/Loan/reports/statement')
  })
})

describe('Loan Module: Summary & KPI Aggregate Calculations', () => {
  it('correctly aggregates portfolio metrics when backend summary is null', () => {
    const loans = [
      { sanctionAmount: 500000, disbursedAmount: 500000, outstandingPrincipal: 350000, status: 'Active' },
      { sanctionAmount: 300000, disbursedAmount: 300000, outstandingPrincipal: 100000, status: 'Active' },
      { sanctionAmount: 200000, disbursedAmount: 200000, outstandingPrincipal: 0, status: 'Closed' },
    ]

    const totalSanctioned = loans.reduce((acc, l) => acc + (l.sanctionAmount || 0), 0)
    const totalDisbursed = loans.reduce((acc, l) => acc + (l.disbursedAmount || 0), 0)
    const totalOutstanding = loans.reduce((acc, l) => acc + (l.outstandingPrincipal || 0), 0)
    const activeLoansCount = loans.filter(l => l.status === 'Active').length
    const totalLoansCount = loans.length

    assert.equal(totalSanctioned, 1000000)
    assert.equal(totalDisbursed, 1000000)
    assert.equal(totalOutstanding, 450000)
    assert.equal(activeLoansCount, 2)
    assert.equal(totalLoansCount, 3)

    const payments = [
      { principal: 150000, interest: 25000, penalty: 0, totalPayment: 175000 },
      { principal: 200000, interest: 15000, penalty: 500, totalPayment: 215500 },
    ]

    const totalAmountPaid = payments.reduce((acc, p) => acc + (p.totalPayment || 0), 0)
    const totalPrincipalPaid = payments.reduce((acc, p) => acc + (p.principal || 0), 0)
    const totalInterestPaid = payments.reduce((acc, p) => acc + (p.interest + p.penalty || 0), 0)
    const totalRepaidPct = (totalPrincipalPaid / totalSanctioned) * 100

    assert.equal(totalAmountPaid, 390500)
    assert.equal(totalPrincipalPaid, 350000)
    assert.equal(totalInterestPaid, 40500)
    assert.equal(totalRepaidPct, 35.0)
  })
})
