import api from '../../services/api'

const config = { baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || api.defaults.baseURL).replace(/\/+$/, '') }
const root = '/api/Loan'
const dateTime = (value) => value ? (value.includes('T') ? value : `${value.slice(0, 10)}T00:00:00`) : undefined

export const loanService = {
  async list(params) { return (await api.get(root, { ...config, params })).data },
  async summary() { return (await api.get(`${root}/summary`, config)).data },
  async payments(params) { return (await api.get(`${root}/payments`, { ...config, params })).data },
  async paymentSummary() { return (await api.get(`${root}/payment-summary`, config)).data },
  async detail(id) { return (await api.get(`${root}/${id}`, config)).data },
  async save(loan, id) {
    const body = {
      loanId: id ?? 0,
      loanNo: loan.loanNo,
      loanAccountNo: loan.loanAccountNo || loan.accountNo,
      bankLender: loan.bankName || loan.bankLender,
      loanType: loan.loanType,
      loanPurpose: loan.loanPurpose || loan.remarks,
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
      remarks: loan.remarks || '',
    }
    return id == null ? api.post(root, body, config) : api.put(`${root}/${id}`, body, config)
  },
  remove(id) { return api.delete(`${root}/${id}`, config) },
  recordPayment(loanId, payment) {
    const { id, loanNo: _loanNo, ...fields } = payment
    return api.post(`${root}/${loanId}/payments`, {
      ...fields,
      loanId,
      voucherNo: id || payment.voucherNo,
      paymentDate: dateTime(payment.paymentDate),
      principal: Number(payment.principal) || 0,
      interest: Number(payment.interest) || 0,
      penalty: Number(payment.penalty) || 0,
      totalPayment: Number(payment.totalPayment) || 0,
      installmentNumber: payment.installmentNumber ? Number(payment.installmentNumber) : undefined,
      paymentType: payment.paymentType || 'Regular EMI',
    }, config)
  },
  async disbursements(loanId) {
    return (await api.get(`${root}/${loanId}/disbursements`, config)).data
  },
  async recordDisbursement(loanId, disbursement) {
    return (await api.post(`${root}/${loanId}/disbursements`, {
      ...disbursement,
      disbursementDate: dateTime(disbursement.disbursementDate),
      disbursedAmount: Number(disbursement.disbursedAmount) || 0,
    }, config)).data
  },
  async schedule(loanId) {
    return (await api.get(`${root}/${loanId}/schedule`, config)).data
  },
  async recalculateSchedule(loanId) {
    return (await api.post(`${root}/${loanId}/recalculate-schedule`, {}, config)).data
  },
  async closeLoan(loanId, closureData) {
    return (await api.post(`${root}/${loanId}/close`, {
      ...closureData,
      closedDate: dateTime(closureData.closedDate),
      finalSettlementAmount: Number(closureData.finalSettlementAmount) || 0,
    }, config)).data
  },
  async report(reportType, params) {
    return (await api.get(`${root}/reports/${reportType}`, { ...config, params })).data
  },
  async uploadDocument(loanId, file, documentType) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType || 'Sanction Letter')
    return (await api.post(`${root}/${loanId}/documents`, formData, {
      ...config,
      headers: { ...api.defaults.headers, 'Content-Type': 'multipart/form-data' }
    })).data
  }
}
