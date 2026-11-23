import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'

const requests = []
let nextHandler = null

globalThis.__salesTestApi = Object.fromEntries(
  ['get', 'post', 'put', 'delete'].map((method) => [
    method,
    async (...args) => {
      requests.push({ method, args })
      if (nextHandler) {
        const fn = nextHandler
        nextHandler = null
        return fn(method, args)
      }
      return { data: [] }
    }
  ])
)

const source = (await readFile(new URL('../src/services/salesService.js', import.meta.url), 'utf8'))
  .replace("import api from './api.js';", 'const api = globalThis.__salesTestApi;')
const { salesService } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('getSales, getBuyers, getPayments return empty arrays without falling back to local seed data', async () => {
  nextHandler = () => ({ data: { items: [], totalCount: 0, page: 1, pageSize: 500 } })
  const sales = await salesService.getSales()
  assert.deepEqual(sales, [])
  assert.equal(requests.at(-1).method, 'get')
  assert.equal(requests.at(-1).args[0], '/api/Sales')

  nextHandler = () => ({ data: [] })
  const buyers = await salesService.getBuyers()
  assert.deepEqual(buyers, [])
  assert.equal(requests.at(-1).args[0], '/api/Buyers')

  nextHandler = () => ({ data: [] })
  const payments = await salesService.getPayments()
  assert.deepEqual(payments, [])
  assert.equal(requests.at(-1).args[0], '/api/SalesPayments')
})

test('createSale and updateSale send clean backend DTOs and preserve server IDs', async () => {
  nextHandler = () => ({
    data: {
      id: 12,
      salesNo: 'SAL-2026-012',
      salesDate: '2026-11-23T00:00:00',
      buyer: 'Sri Lakshmi Traders',
      farm: 'Sunrise Valley Farm',
      crop: 'Paddy (Rice)',
      quantity: 50,
      unit: 'Quintals',
      rate: 2200,
      grossAmount: 110000,
      commission: 1000,
      transport: 2000,
      netAmount: 107000,
      paymentStatus: 'Pending'
    }
  })

  const created = await salesService.createSale({
    salesNo: 'SAL-2026-012',
    salesDate: '2026-11-23',
    buyer: 'Sri Lakshmi Traders',
    farm: 'Sunrise Valley Farm',
    crop: 'Paddy (Rice)',
    quantity: '50',
    unit: 'Quintals',
    rate: '2200',
    commission: '1000',
    transport: '2000',
    paymentStatus: 'Pending'
  })

  assert.equal(created.id, 12)
  assert.equal(created.netAmount, 107000)
  assert.equal(requests.at(-1).method, 'post')
  assert.equal(requests.at(-1).args[0], '/api/Sales')
  assert.equal(requests.at(-1).args[1].quantity, 50)
  assert.ok(!('id' in requests.at(-1).args[1]))

  nextHandler = () => ({ data: { ...created, commission: 500, netAmount: 107500 } })
  const updated = await salesService.updateSale(12, { ...created, commission: 500 })
  assert.equal(updated.netAmount, 107500)
  assert.equal(requests.at(-1).method, 'put')
  assert.equal(requests.at(-1).args[0], '/api/Sales/12')
})

test('updateReceivable syncs directly with PUT /api/Sales/receivables/{salesNo}', async () => {
  nextHandler = () => ({
    data: {
      id: 1,
      salesNo: 'SAL-2026-001',
      salesDate: '2026-10-25T00:00:00',
      buyer: 'Sri Lakshmi Traders',
      totalSalesAmount: 220000,
      amountReceived: 150000,
      outstandingAmount: 70000,
      paymentStatus: 'Partially Paid'
    }
  })

  const result = await salesService.updateReceivable({
    salesNo: 'SAL-2026-001',
    salesDate: '2026-10-25',
    buyer: 'Sri Lakshmi Traders',
    totalSalesAmount: '220000',
    amountReceived: '150000',
    paymentStatus: 'Partially Paid',
    paymentMode: 'UPI',
    referenceNo: 'UPI-123',
    remarks: 'Partial settlement'
  })

  assert.equal(requests.at(-1).method, 'put')
  assert.equal(requests.at(-1).args[0], '/api/Sales/receivables/SAL-2026-001')
  assert.equal(requests.at(-1).args[1].amountReceived, 150000)
  assert.equal(requests.at(-1).args[1].paymentMode, 'UPI')
  assert.equal(result.outstandingAmount, 70000)
})

test('API failures propagate real errors instead of silently writing fake localStorage data', async () => {
  nextHandler = () => {
    const err = new Error('Request failed')
    err.friendlyMessage = 'Buyer code BUY-001 already exists.'
    err.statusCode = 400
    throw err
  }

  await assert.rejects(
    () => salesService.createBuyer({ buyerCode: 'BUY-001', buyerName: 'Test', mobile: '9999999999' }),
    /Buyer code BUY-001 already exists\./
  )
})
