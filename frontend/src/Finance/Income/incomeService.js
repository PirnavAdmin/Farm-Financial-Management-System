const STORAGE_KEY = 'agriman-finance-income-records'

const initialSeedRecords = [
  {
    id: 'inc-seed-001',
    incomeNo: 'INC-20261022-001',
    incomeDate: '2026-10-22',
    farmer: 'Arjun Mehta',
    farm: 'North Field',
    crop: 'Paddy',
    incomeType: 'Crop Sales',
    buyer: 'Sri Lakshmi Traders',
    quantity: 12500,
    unit: 'kg',
    rate: 28,
    grossAmount: 350000,
    discount: 0,
    otherCharges: 2000,
    netAmount: 352000,
    amount: 352000,
    paymentMode: 'Bank Transfer',
    bankCash: 'HDFC Farm Account',
    referenceNumber: 'TXN-884210',
    remarks: 'Paddy crop harvest sale settlement',
    status: 'Received',
    createdAt: '2026-10-22T10:30:00.000Z',
    updatedAt: '2026-10-22T10:30:00.000Z',
  },
  {
    id: 'inc-seed-002',
    incomeNo: 'INC-20261020-002',
    incomeDate: '2026-10-20',
    farmer: 'Priya Sharma',
    farm: 'Lake Farm',
    crop: 'Cow Milk',
    incomeType: 'Milk Sales',
    buyer: 'Dairy Cooperative Society',
    quantity: 820,
    unit: 'litre',
    rate: 42,
    grossAmount: 34440,
    discount: 0,
    otherCharges: 0,
    netAmount: 34440,
    amount: 34440,
    paymentMode: 'UPI',
    bankCash: 'SBI Agri Current Account',
    referenceNumber: 'UPI-294188',
    remarks: 'Bi-weekly milk collection payout',
    status: 'Received',
    createdAt: '2026-10-20T08:15:00.000Z',
    updatedAt: '2026-10-20T08:15:00.000Z',
  },
  {
    id: 'inc-seed-003',
    incomeNo: 'INC-20261018-003',
    incomeDate: '2026-10-18',
    farmer: 'Ramesh Patel',
    farm: 'South Orchard',
    crop: 'Cotton',
    incomeType: 'Crop Sales',
    buyer: 'Vardhman Cotton Mill',
    quantity: 4200,
    unit: 'kg',
    rate: 72,
    grossAmount: 302400,
    discount: 2400,
    otherCharges: 1500,
    netAmount: 301500,
    amount: 301500,
    paymentMode: 'Bank Transfer',
    bankCash: 'HDFC Farm Account',
    referenceNumber: 'NEFT-771209',
    remarks: 'Grade-A Shankar cotton lot sale',
    status: 'Received',
    createdAt: '2026-10-18T14:45:00.000Z',
    updatedAt: '2026-10-18T14:45:00.000Z',
  },
  {
    id: 'inc-seed-004',
    incomeNo: 'INC-20261015-004',
    incomeDate: '2026-10-15',
    farmer: 'Suresh Kumar',
    farm: 'Green Valley Farm',
    crop: 'Drip Irrigation',
    incomeType: 'Government Subsidy',
    buyer: 'Dept of Agriculture',
    quantity: 1,
    unit: 'subsidy',
    rate: 50000,
    grossAmount: 50000,
    discount: 0,
    otherCharges: 0,
    netAmount: 50000,
    amount: 50000,
    paymentMode: 'Bank Transfer',
    bankCash: 'SBI Agri Current Account',
    referenceNumber: 'DBT-PMKSY-9021',
    remarks: 'Micro-irrigation capital subsidy DBT credit',
    status: 'Received',
    createdAt: '2026-10-15T11:20:00.000Z',
    updatedAt: '2026-10-15T11:20:00.000Z',
  },
  {
    id: 'inc-seed-005',
    incomeNo: 'INC-20261012-005',
    incomeDate: '2026-10-12',
    farmer: 'Rajesh Verma',
    farm: 'East Meadow',
    crop: 'Tractor / Equipment',
    incomeType: 'Rental Income',
    buyer: 'Balram Farm Services',
    quantity: 25,
    unit: 'hour',
    rate: 1800,
    grossAmount: 45000,
    discount: 1000,
    otherCharges: 0,
    netAmount: 44000,
    amount: 44000,
    paymentMode: 'Cash',
    bankCash: 'Cash in Hand',
    referenceNumber: 'RCPT-4402',
    remarks: 'Tractor and rotavator rental service',
    status: 'Received',
    createdAt: '2026-10-12T16:00:00.000Z',
    updatedAt: '2026-10-12T16:00:00.000Z',
  },
  {
    id: 'inc-seed-006',
    incomeNo: 'INC-20261025-006',
    incomeDate: '2026-10-25',
    farmer: 'Arjun Mehta',
    farm: 'North Field',
    crop: 'Basmati Rice',
    incomeType: 'Crop Sales',
    buyer: 'Metro Cash & Carry',
    quantity: 6000,
    unit: 'kg',
    rate: 65,
    grossAmount: 390000,
    discount: 5000,
    otherCharges: 3000,
    netAmount: 388000,
    amount: 388000,
    paymentMode: 'Cheque',
    bankCash: 'HDFC Farm Account',
    referenceNumber: 'CHQ-551029',
    remarks: 'Payment due on presentation of invoice',
    status: 'Pending',
    createdAt: '2026-10-25T09:10:00.000Z',
    updatedAt: '2026-10-25T09:10:00.000Z',
  },
]

function readRecords() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) {
    // Seed initial records for a rich initial experience
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeedRecords))
    } catch {
      // ignore storage write errors
    }
    return initialSeedRecords
  }

  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return initialSeedRecords
  } catch {
    return initialSeedRecords
  }
}

function writeRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    throw new Error(`Income data could not be saved to local storage: ${error.message}`)
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function listIncome() {
  return readRecords().sort((a, b) => {
    const dateComp = (b.incomeDate || '').localeCompare(a.incomeDate || '')
    if (dateComp !== 0) return dateComp
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
}

export function getIncomeById(id) {
  const records = readRecords()
  return records.find((item) => item.id === id) || null
}

export function createIncome(values) {
  const records = readRecords()
  const id = createId()
  const dateStr = (values.incomeDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '')
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const incomeNo = values.incomeNo && values.incomeNo.trim() !== ''
    ? values.incomeNo.trim()
    : `INC-${dateStr}-${randomSuffix}`

  const now = new Date().toISOString()
  const record = {
    ...values,
    id,
    incomeNo,
    amount: values.netAmount ?? values.amount,
    createdAt: now,
    updatedAt: now,
  }

  writeRecords([record, ...records])
  return record
}

export function updateIncome(id, values) {
  const records = readRecords()
  const existingIndex = records.findIndex((item) => item.id === id)
  if (existingIndex === -1) {
    throw new Error('This income record no longer exists. Refresh the page and try again.')
  }

  const existing = records[existingIndex]
  const updated = {
    ...existing,
    ...values,
    id,
    incomeNo: existing.incomeNo || values.incomeNo,
    amount: values.netAmount ?? values.amount,
    updatedAt: new Date().toISOString(),
  }

  const newRecords = [...records]
  newRecords[existingIndex] = updated
  writeRecords(newRecords)
  return updated
}

export function deleteIncome(id) {
  const records = readRecords()
  const existing = records.find((item) => item.id === id)
  if (!existing) {
    throw new Error('This income record no longer exists. Refresh the page and try again.')
  }

  const filtered = records.filter((item) => item.id !== id)
  writeRecords(filtered)
}
