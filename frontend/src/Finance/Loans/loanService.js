import api from '../../services/api'

const config = { baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_LOAN_API_URL || import.meta.env.VITE_DASHBOARD_API_URL || 'https://lesser-chomp-stomp.ngrok-free.dev').replace(/\/+$/, '') }
const root = '/api/Loan'
const dateTime = (value) => `${value.slice(0, 10)}T00:00:00`

export const loanService = {
  async list() { return (await api.get(root, config)).data },
  async summary() { return (await api.get(`${root}/summary`, config)).data },
  async payments() { return (await api.get(`${root}/payments`, config)).data },
  async paymentSummary() { return (await api.get(`${root}/payment-summary`, config)).data },
  async detail(id) { return (await api.get(`${root}/${id}`, config)).data },
  async save(loan, id) {
    const body = {
      loanId: id ?? 0, loanNo: loan.loanNo, bankLender: loan.bankName,
      loanType: loan.loanType, sanctionAmount: loan.sanctionAmount,
      interestRate: loan.interestRate, startDate: dateTime(loan.startDate),
      endDate: dateTime(loan.endDate), emi: loan.emi,
      outstandingAmount: loan.outstandingAmount, status: loan.status,
    }
    return id == null ? api.post(root, body, config) : api.put(`${root}/${id}`, body, config)
  },
  remove(id) { return api.delete(`${root}/${id}`, config) },
  recordPayment(loanId, payment) {
    const { id, loanNo: _loanNo, ...fields } = payment
    return api.post(`${root}/${loanId}/payments`, {
      ...fields, loanId, voucherNo: id, paymentDate: dateTime(payment.paymentDate),
    }, config)
  },
}
