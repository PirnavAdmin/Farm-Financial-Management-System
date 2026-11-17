import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'

const requests = []
globalThis.__loanTestApi = Object.fromEntries(['get', 'post', 'put', 'delete'].map((method) => [method, async (...args) => {
  requests.push({ method, args })
  return { data: [] }
}]))
const source = (await readFile(new URL('../src/Finance/Loans/loanService.js', import.meta.url), 'utf8'))
  .replace("import api from '../../services/api'", 'const api = globalThis.__loanTestApi')
  .replaceAll('import.meta.env', '({ DEV: true })')
const { loanService } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('loan writes map the form to the Swagger schema and address the database ID', async () => {
  const loan = { loanNo: 'LN-TEST', bankName: 'Bank', loanType: 'Crop Loan', sanctionAmount: 5000,
    interestRate: 7, startDate: '2026-11-13', endDate: '2027-11-13', emi: 500, outstandingAmount: 4500, status: 'Active', remarks: 'unsupported' }
  await loanService.save(loan)
  assert.equal(requests.at(-1).method, 'post')
  assert.equal(requests.at(-1).args[0], '/api/Loan')
  const body = requests.at(-1).args[1]
  assert.equal(body.bankLender, 'Bank')
  assert.equal(body.startDate, '2026-11-13T00:00:00')
  assert.ok(!('bankName' in body) && !('remarks' in body))
  await loanService.save(loan, 42)
  assert.equal(requests.at(-1).method, 'put')
  assert.equal(requests.at(-1).args[0], '/api/Loan/42')
  assert.equal(requests.at(-1).args[1].loanId, 42)
  await loanService.remove(42)
  assert.equal(requests.at(-1).args[0], '/api/Loan/42')
})

test('repayments use the payment route, voucher number and linked loan ID', async () => {
  await loanService.recordPayment(42, { id: 'VCH-TEST', loanNo: 'LN-TEST', paymentDate: '2026-11-13', principal: 500, interest: 50, penalty: 0, totalPayment: 550, paymentMode: 'Cash' })
  const { method, args } = requests.at(-1)
  assert.equal(method, 'post')
  assert.equal(args[0], '/api/Loan/42/payments')
  assert.equal(args[1].voucherNo, 'VCH-TEST')
  assert.equal(args[1].loanId, 42)
  assert.equal(args[1].paymentDate, '2026-11-13T00:00:00')
  assert.ok(!('id' in args[1]) && !('loanNo' in args[1]))
})

test('lists, summaries and detail use the verified read endpoints', async () => {
  for (const [method, path, id] of [['list', '', undefined], ['summary', '/summary'], ['payments', '/payments'], ['paymentSummary', '/payment-summary'], ['detail', '/42', 42]]) {
    await loanService[method](id)
    assert.equal(requests.at(-1).args[0], `/api/Loan${path}`)
    assert.equal(requests.at(-1).args[1].baseURL, '')
  }
})
