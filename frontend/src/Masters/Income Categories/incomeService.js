const STORAGE_KEY = 'agriman-income-records'

function readRecords() {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored === null) return []

  let records
  try {
    records = JSON.parse(stored)
  } catch {
    throw new Error('Saved income data could not be read. Clear the damaged income data before continuing.')
  }

  if (!Array.isArray(records) || records.some((record) => (
    !record ||
    typeof record !== 'object' ||
    typeof record.id !== 'string' ||
    typeof record.incomeDate !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    !Number.isFinite(Number(record.amount))
  ))) {
    throw new Error('Saved income data has an invalid format. Clear the damaged income data before continuing.')
  }

  return records
}

function writeRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    throw new Error(`Income data could not be saved on this device: ${error.message}`)
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function listIncome() {
  return readRecords().sort((left, right) => right.incomeDate.localeCompare(left.incomeDate) || right.createdAt.localeCompare(left.createdAt))
}

export function createIncome(values) {
  const records = readRecords()
  const id = createId()
  const incomeNo = `INC-${values.incomeDate.replaceAll('-', '')}-${id.slice(-6).toUpperCase()}`
  const now = new Date().toISOString()
  const record = { ...values, id, incomeNo, createdAt: now, updatedAt: now }

  writeRecords([record, ...records])
  return record
}

export function updateIncome(id, values) {
  const records = readRecords()
  const existing = records.find((record) => record.id === id)

  if (!existing) throw new Error('This income record no longer exists. Refresh the list and try again.')

  const updated = { ...existing, ...values, updatedAt: new Date().toISOString() }
  writeRecords(records.map((record) => record.id === id ? updated : record))
  return updated
}

export function deleteIncome(id) {
  const records = readRecords()
  const existing = records.find((record) => record.id === id)

  if (!existing) throw new Error('This income record no longer exists. Refresh the list and try again.')

  writeRecords(records.filter((record) => record.id !== id))
}
