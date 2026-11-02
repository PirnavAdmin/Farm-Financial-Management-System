import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildReport } from '../src/Reports/Income Report/reportData.js'

// Replace only the Vite environment and HTTP dependency; exercise the real service.
const requests = []
let response
let failure
const api = { defaults: { baseURL: 'https://example.test' } }
for (const method of ['get', 'post', 'put', 'delete']) {
  api[method] = async (...args) => {
    requests.push({ method, args })
    if (failure) throw failure
    return { data: response }
  }
}
globalThis.__incomeTestApi = api
const source = (await readFile(new URL('../src/Finance/Income/incomeService.js', import.meta.url), 'utf8'))
  .replace("import api from '../../services/api.js'", 'const api = globalThis.__incomeTestApi')
  .replaceAll('import.meta.env', '({ DEV: true })')
const service = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const categories = [{ id: 7, name: 'Other Income' }]
const farmers = [{ id: 19, name: 'Example Farmer' }]
const values = {
  incomeDate: '2026-10-30', incomeNo: '', incomeType: 'Other Income',
  farmer: 'Example Farmer (#19)', farm: 'Example Farm', crop: 'Paddy', buyer: 'Buyer',
  quantity: 100, unit: 'kg', rate: 30, discount: 100, otherCharges: 50,
  paymentMode: 'Cash', bankCash: 'Cash account', referenceNumber: 'REF', remarks: 'Note', status: 'Received',
}

test('list maps actual API date, amount, and Paid status without inventing edit details', async () => {
  response = [{ id: 1, date: '2026-10-29T10:10:00', amount: 2950, status: 'Paid' }]
  const [record] = await service.listIncome()
  assert.equal(record.incomeDate, '2026-10-29')
  assert.equal(record.netAmount, 2950)
  assert.equal(record.status, 'Received')
  assert.equal(record.quantity, undefined)
  assert.equal(requests.at(-1).args[0], '/api/Income')
})

test('payload resolves actual category/farmer IDs and sends only supported request fields', () => {
  const body = service.buildIncomePayload(values, categories, farmers)
  assert.equal(body.categoryId, 7)
  assert.equal(body.farmerId, 19)
  assert.equal(body.bankOrCash, 'Cash account')
  assert.equal(body.incomeDate, '2026-10-30T00:00:00')
  assert.equal(body.quantity * body.rate - body.discount + body.otherCharges, 2950)
  for (const key of ['incomeNo', 'farmer', 'incomeType', 'grossAmount', 'netAmount', 'bankCash']) assert.ok(!(key in body))
})

test('editing preserves backend Paid status, farmer ID, and time of day', () => {
  const existing = service.normalizeIncome({ id: 1, incomeDate: '2026-10-30T10:10:00', farmer: 'Example Farmer', farmerId: 19, categoryId: 7, incomeType: 'Other Income', status: 'Paid' })
  const body = service.buildIncomePayload({ ...values, farmer: 'Example Farmer' }, categories, [], existing)
  assert.equal(body.status, 'Paid')
  assert.equal(body.farmerId, 19)
  assert.equal(body.incomeDate, '2026-10-30T10:10:00')
})

test('ambiguous farmers, unknown categories, and negative amounts cannot be submitted', () => {
  assert.throws(() => service.buildIncomePayload({ ...values, farmer: 'Example Farmer' }, categories, [...farmers, { id: 20, name: 'Example Farmer' }]), /Choose a farmer/)
  assert.throws(() => service.buildIncomePayload(values, [], farmers), /income type/)
  assert.throws(() => service.buildIncomePayload({ ...values, rate: -1 }, categories, farmers), /valid quantity/)
})

test('detail, create, update, and delete use the supplied API routes; empty write responses are accepted', async () => {
  response = { id: 1, incomeDate: '2026-10-30T10:10:00', bankOrCash: 'Cash', status: 'Paid' }
  const detail = await service.getIncomeById(1)
  assert.equal(detail.bankCash, 'Cash')
  assert.equal(requests.at(-1).args[0], '/api/Income/1')
  response = ''
  await service.createIncome(values, categories, farmers)
  assert.equal(requests.at(-1).method, 'post')
  await service.updateIncome(1, values, categories, farmers, null)
  assert.equal(requests.at(-1).method, 'put')
  assert.equal(requests.at(-1).args[0], '/api/Income/1')
  await service.deleteIncome(1)
  assert.equal(requests.at(-1).method, 'delete')
})

test('read failures and invalid response shapes propagate without demo fallback', async () => {
  failure = new Error('Unauthorized')
  await assert.rejects(service.listIncome(), /Unauthorized/)
  failure = null
  response = { unexpected: [] }
  await assert.rejects(service.listIncome(), /unsupported list/)
  response = { success: false, message: 'Not allowed' }
  await assert.rejects(service.deleteIncome(1), /Not allowed/)
})

test('category lookup does not fabricate missing master metadata', async () => {
  response = [{ id: 1, name: 'Crop Sales' }]
  const [category] = await service.listIncomeCategories()
  assert.equal(category.id, 1)
  assert.equal(category.status, '')
  assert.equal(category.code, '')
})

test('report retains pending entries, excludes cancelled entries, and totals only received income', () => {
  const report = buildReport([
    { incomeNo: 'A', status: 'Received', netAmount: 2950 },
    { incomeNo: 'B', status: 'Pending', netAmount: 100 },
    { incomeNo: 'C', status: 'Cancelled', netAmount: 200 },
  ])
  assert.equal(report.totalIncome, 2950)
  assert.deepEqual(report.rows.map((row) => row['Income No']), ['A', 'B'])
  assert.equal(buildReport([]).totalIncome, 0)
})
