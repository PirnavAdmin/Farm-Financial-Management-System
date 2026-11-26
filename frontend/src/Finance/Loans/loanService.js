import api from '../../services/api'

const root = '/api/Loan'

const dateTime = (value) => {
  if (!value) return undefined
  return value.includes('T') ? value : `${value.slice(0, 10)}T00:00:00`
}

export const loanService = {
  // 1. GET /api/Loan (list loans with search, status, loanType, bank query filters)
  async list(params) {
    const res = await api.get(root, { params })
    return res.data
  },

  // 2. GET /api/Loan/summary (KPI summary card figures)
  async summary() {
    const res = await api.get(`${root}/summary`)
    return res.data
  },

  // 3. GET /api/Loan/payments (list payment vouchers with search, loanNo, paymentMode filters)
  async payments(params) {
    const res = await api.get(`${root}/payments`, { params })
    return res.data
  },

  // 4. GET /api/Loan/payment-summary (payment summary totals)
  async paymentSummary() {
    const res = await api.get(`${root}/payment-summary`)
    return res.data
  },

  // 5. GET /api/Loan/{id} (loan details with installments, disbursements, payments, documents)
  async detail(id) {
    const res = await api.get(`${root}/${id}`)
    return res.data
  },

  // 6. POST /api/Loan & PUT /api/Loan/{id} (create or update loan)
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
      ? await api.post(root, body)
      : await api.put(`${root}/${id}`, body)
    return res.data
  },

  // 7. DELETE /api/Loan/{id} (delete loan)
  async remove(id) {
    const res = await api.delete(`${root}/${id}`)
    return res.data
  },

  // 8. POST /api/Loan/{loanId}/payments (record loan payment voucher)
  async recordPayment(loanId, payment) {
    const { id, loanNo: _loanNo, ...fields } = payment
    const res = await api.post(`${root}/${loanId}/payments`, {
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

  // 9. GET /api/Loan/{loanId}/disbursements (list loan tranches)
  async disbursements(loanId) {
    const res = await api.get(`${root}/${loanId}/disbursements`)
    return res.data
  },

  // 10. POST /api/Loan/{loanId}/disbursements (record additional tranche)
  async recordDisbursement(loanId, disbursement) {
    const res = await api.post(`${root}/${loanId}/disbursements`, {
      ...disbursement,
      disbursementDate: dateTime(disbursement.disbursementDate),
      disbursedAmount: Number(disbursement.disbursedAmount) || 0,
    })
    return res.data
  },

  // 11. GET /api/Loan/{loanId}/schedule (repayment schedule)
  async schedule(loanId) {
    const res = await api.get(`${root}/${loanId}/schedule`)
    return res.data
  },

  // 12. POST /api/Loan/{loanId}/recalculate-schedule (recalculate schedule)
  async recalculateSchedule(loanId) {
    const res = await api.post(`${root}/${loanId}/recalculate-schedule`, {})
    return res.data
  },

  // 13. POST /api/Loan/{loanId}/close (settle and close loan)
  async closeLoan(loanId, closureData) {
    const res = await api.post(`${root}/${loanId}/close`, {
      ...closureData,
      closedDate: dateTime(closureData.closedDate),
      finalSettlementAmount: Number(closureData.finalSettlementAmount) || 0,
    })
    return res.data
  },

  // 14. GET /api/Loan/reports/{reportType} (all 10 reports with filters)
  async report(reportType, params) {
    const res = await api.get(`${root}/reports/${reportType}`, { params })
    return res.data
  },

  // 15. POST /api/Loan/{loanId}/documents (upload loan documentation)
  async uploadDocument(loanId, file, documentType) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType || 'Sanction Letter')
    const res = await api.post(`${root}/${loanId}/documents`, formData)
    return res.data
  }
}

export default loanService
