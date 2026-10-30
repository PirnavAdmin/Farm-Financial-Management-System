import { useMemo, useState } from 'react'
import { createIncome, deleteIncome, listIncome, updateIncome } from './incomeService.js'
import './income.css'

const incomeTypes = [
  'Crop Sales',
  'Milk Sales',
  'Animal Sales',
  'Government Subsidy',
  'Loan Received',
  'Rental Income',
  'Other Income',
]

const paymentModes = ['Bank Transfer', 'Cash', 'Cheque', 'UPI', 'Other']
const statuses = ['Received', 'Pending', 'Cancelled']
const pageSizes = [5, 10, 20]

const commonFarmers = ['Arjun Mehta', 'Priya Sharma', 'Ramesh Patel', 'Suresh Kumar', 'Rajesh Verma']
const commonFarms = ['North Field', 'Lake Farm', 'South Orchard', 'Green Valley Farm', 'East Meadow']
const commonCrops = ['Paddy', 'Wheat', 'Cotton', 'Cow Milk', 'Maize', 'Sugarcane', 'Tomatoes', 'Cattle']
const commonUnits = ['kg', 'quintal', 'tonne', 'litre', 'bag', 'head', 'hour', 'acre', 'subsidy', 'item']
const commonBankCash = ['HDFC Farm Account', 'SBI Agri Current Account', 'ICICI Commercial Account', 'Cash in Hand', 'Petty Cash']
const commonBuyers = [
  'Sri Lakshmi Traders',
  'Dairy Cooperative Society',
  'Vardhman Cotton Mill',
  'Dept of Agriculture',
  'Balram Farm Services',
  'Metro Cash & Carry',
  'Kisan Agro Mandi',
]

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function createEmptyForm(incomeNo = '') {
  return {
    incomeDate: localDate(),
    incomeNo,
    farmer: '',
    farm: '',
    crop: '',
    incomeType: 'Crop Sales',
    buyer: '',
    quantity: '1',
    unit: 'kg',
    rate: '',
    discount: '0',
    otherCharges: '0',
    paymentMode: 'Bank Transfer',
    bankCash: 'HDFC Farm Account',
    referenceNumber: '',
    remarks: '',
    status: 'Received',
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

function amounts(values) {
  const quantity = Number(values.quantity) || 0
  const rate = Number(values.rate) || 0
  const grossAmount = Math.round((quantity * rate + Number.EPSILON) * 100) / 100
  const discount = Number(values.discount) || 0
  const otherCharges = Number(values.otherCharges) || 0
  const netAmount = Math.round((grossAmount - discount + otherCharges + Number.EPSILON) * 100) / 100
  return { grossAmount, netAmount }
}

function validateForm(values) {
  const errors = {}
  const quantity = Number(values.quantity)
  const rate = Number(values.rate)
  const discount = Number(values.discount)
  const otherCharges = Number(values.otherCharges)
  const { grossAmount, netAmount } = amounts(values)

  if (!values.incomeDate) errors.incomeDate = 'Select the income date.'
  if (!values.incomeType) errors.incomeType = 'Select an income type.'
  if (!values.quantity || !Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = 'Enter a quantity greater than zero.'
  }
  if (!values.unit.trim()) errors.unit = 'Enter a unit of measurement.'
  if (values.rate === '' || !Number.isFinite(rate) || rate < 0) {
    errors.rate = 'Enter a valid rate.'
  }
  if (values.discount === '' || !Number.isFinite(discount) || discount < 0) {
    errors.discount = 'Enter a valid discount (0 or more).'
  }
  if (values.otherCharges === '' || !Number.isFinite(otherCharges) || otherCharges < 0) {
    errors.otherCharges = 'Enter valid other charges (0 or more).'
  }
  if (Number.isFinite(grossAmount) && discount > grossAmount) {
    errors.discount = 'Discount cannot exceed the gross amount.'
  }
  if (!Number.isFinite(grossAmount) || !Number.isFinite(netAmount) || grossAmount > 999999999999) {
    errors.rate = 'Calculated amount is too large.'
  }
  if (!values.paymentMode) errors.paymentMode = 'Select a payment mode.'
  if (!statuses.includes(values.status)) errors.status = 'Select a valid status.'

  return errors
}

function toFormValues(record) {
  return {
    incomeDate: record.incomeDate || localDate(),
    incomeNo: record.incomeNo || '',
    farmer: record.farmer || '',
    farm: record.farm || '',
    crop: record.crop || '',
    incomeType: record.incomeType || 'Crop Sales',
    buyer: record.buyer || '',
    quantity: String(record.quantity ?? 1),
    unit: record.unit || 'kg',
    rate: String(record.rate ?? ''),
    discount: String(record.discount ?? 0),
    otherCharges: String(record.otherCharges ?? 0),
    paymentMode: record.paymentMode || 'Bank Transfer',
    bankCash: record.bankCash || record['Bank/Cash'] || '',
    referenceNumber: record.referenceNumber || record.transactionReference || '',
    remarks: record.remarks || '',
    status: statuses.includes(record.status) ? record.status : 'Received',
  }
}

function toRecordValues(values) {
  const { grossAmount, netAmount } = amounts(values)
  return {
    incomeDate: values.incomeDate,
    incomeNo: values.incomeNo.trim(),
    farmer: values.farmer.trim(),
    farm: values.farm.trim(),
    crop: values.crop.trim(),
    incomeType: values.incomeType,
    buyer: values.buyer.trim(),
    quantity: Number(values.quantity),
    unit: values.unit.trim(),
    rate: Number(values.rate),
    grossAmount,
    discount: Number(values.discount),
    otherCharges: Number(values.otherCharges),
    netAmount,
    amount: netAmount,
    paymentMode: values.paymentMode,
    bankCash: values.bankCash.trim(),
    referenceNumber: values.referenceNumber.trim(),
    remarks: values.remarks.trim(),
    status: values.status,
  }
}

function monthToDateAmount(records) {
  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return records
    .filter((record) => record.status !== 'Cancelled' && record.incomeDate?.startsWith(currentYearMonth))
    .reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)
}

function getCategoryClass(type = '') {
  const lower = type.toLowerCase()
  if (lower.includes('crop')) return 'crop-sales'
  if (lower.includes('milk')) return 'milk-sales'
  if (lower.includes('animal')) return 'animal-sales'
  if (lower.includes('subsidy')) return 'subsidy'
  if (lower.includes('rental')) return 'rental'
  if (lower.includes('loan')) return 'loan'
  return 'other'
}

export default function Income() {
  const [initialLoad] = useState(() => {
    try {
      return { records: listIncome(), error: '' }
    } catch (loadError) {
      return { records: [], error: loadError.message || 'Income records could not be loaded.' }
    }
  })

  const [records, setRecords] = useState(initialLoad.records)
  const [screen, setScreen] = useState('list') // 'list' | 'add' | 'edit' | 'details'
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [formValues, setFormValues] = useState(createEmptyForm())
  const [formErrors, setFormErrors] = useState({})
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(initialLoad.error)

  const filteredRecords = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesSearch = !searchTerm || [
        record.incomeNo,
        record.farmer,
        record.farm,
        record.crop,
        record.buyer,
        record.remarks,
        record.referenceNumber,
      ].some((value) => String(value || '').toLowerCase().includes(searchTerm))

      return (
        matchesSearch &&
        (!dateFrom || record.incomeDate >= dateFrom) &&
        (!dateTo || record.incomeDate <= dateTo) &&
        (!typeFilter || record.incomeType === typeFilter) &&
        (!paymentFilter || record.paymentMode === paymentFilter) &&
        (!statusFilter || record.status === statusFilter)
      )
    })
  }, [records, search, dateFrom, dateTo, typeFilter, paymentFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const eligibleRecords = records.filter((record) => record.status !== 'Cancelled')
  const totalIncome = eligibleRecords.reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)
  const thisMonth = monthToDateAmount(records)
  const pendingRecords = records.filter((r) => r.status === 'Pending')
  const receivedRecords = records.filter((r) => r.status === 'Received')
  const cancelledRecords = records.filter((r) => r.status === 'Cancelled')

  const pendingIncome = pendingRecords.reduce((sum, r) => sum + Number(r.netAmount ?? r.amount ?? 0), 0)
  const receivedIncome = receivedRecords.reduce((sum, r) => sum + Number(r.netAmount ?? r.amount ?? 0), 0)

  function clearMessages() {
    setNotice('')
    setError('')
  }

  function refreshRecords() {
    clearMessages()
    try {
      setRecords(listIncome())
    } catch (loadError) {
      setError(loadError.message || 'Income records could not be loaded.')
    }
  }

  function openAdd() {
    clearMessages()
    setSelectedRecord(null)
    setFormValues(createEmptyForm())
    setFormErrors({})
    setScreen('add')
  }

  function openEdit(record) {
    clearMessages()
    setSelectedRecord(record)
    setFormValues(toFormValues(record))
    setFormErrors({})
    setScreen('edit')
  }

  function openDetails(record) {
    clearMessages()
    setSelectedRecord(record)
    setScreen('details')
  }

  function returnToList(message = '') {
    setScreen('list')
    setSelectedRecord(null)
    setPendingDelete(null)
    setFormErrors({})
    setError('')
    setNotice(message)
  }

  function updateField(event) {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
  }

  function submitForm(event) {
    event.preventDefault()
    clearMessages()
    const validationErrors = validateForm(formValues)
    setFormErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      if (screen === 'edit' && selectedRecord) {
        const updated = updateIncome(selectedRecord.id, toRecordValues(formValues))
        setRecords((current) => current.map((record) => (record.id === updated.id ? updated : record)))
        returnToList(`Income record ${updated.incomeNo} updated successfully.`)
      } else {
        const created = createIncome(toRecordValues(formValues))
        setRecords((current) => [created, ...current])
        returnToList(`Income record ${created.incomeNo} created successfully.`)
      }
    } catch (saveError) {
      setError(saveError.message || 'Income record could not be saved.')
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return
    try {
      deleteIncome(pendingDelete.id)
      setRecords((current) => current.filter((record) => record.id !== pendingDelete.id))
      returnToList(`Income record ${pendingDelete.incomeNo} deleted.`)
    } catch (deleteError) {
      setError(deleteError.message || 'Income record could not be deleted.')
      setPendingDelete(null)
    }
  }

  function resetFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setTypeFilter('')
    setPaymentFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const calculatedAmounts = amounts(formValues)
  const isForm = screen === 'add' || screen === 'edit'

  return (
    <div className="income-page">
      {screen === 'list' ? (
        <>
          {/* Header */}
          <header className="income-page-heading">
            <div>
              <div className="income-breadcrumb">
                <span>Finance</span>
                <span>/</span>
                <strong>Income Management</strong>
                <span className="income-breadcrumb-badge">
                  <i /> Live Workspace
                </span>
              </div>
              <h1>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#245a36' }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Income Management
              </h1>
              <p>
                Track harvest crop sales, dairy revenue, government subsidies, equipment rentals, and operational farm income.
              </p>
            </div>
            <div className="income-header-actions">
              <button className="income-primary-button" type="button" onClick={openAdd}>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span> Record Income
              </button>
            </div>
          </header>

          {/* Datalists for inputs */}
          <datalist id="common-farmers">
            {commonFarmers.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <datalist id="common-farms">
            {commonFarms.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <datalist id="common-crops">
            {commonCrops.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="common-units">
            {commonUnits.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <datalist id="common-buyers">
            {commonBuyers.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <datalist id="common-bank-cash">
            {commonBankCash.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          {/* KPI Summary Cards */}
          <section className="income-summary" aria-label="Income KPI summary">
            <article className="income-summary-card">
              <span className="income-summary-icon income-icon-total" aria-hidden="true">
                ₹
              </span>
              <div className="income-summary-info">
                <div className="income-summary-header">
                  <small>Total Revenue</small>
                  <span className="income-summary-pill total">Active Total</span>
                </div>
                <strong>{formatCurrency(totalIncome)}</strong>
                <span>{eligibleRecords.length} active {eligibleRecords.length === 1 ? 'entry' : 'entries'}</span>
              </div>
            </article>

            <article className="income-summary-card">
              <span className="income-summary-icon income-icon-month" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div className="income-summary-info">
                <div className="income-summary-header">
                  <small>This Month</small>
                  <span className="income-summary-pill month">Current Period</span>
                </div>
                <strong>{formatCurrency(thisMonth)}</strong>
                <span>October 2026 collections</span>
              </div>
            </article>

            <article className="income-summary-card">
              <span className="income-summary-icon income-icon-pending" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div className="income-summary-info">
                <div className="income-summary-header">
                  <small>Pending Collections</small>
                  <span className="income-summary-pill pending">Due Soon</span>
                </div>
                <strong>{formatCurrency(pendingIncome)}</strong>
                <span>{pendingRecords.length} awaiting settlement</span>
              </div>
            </article>

            <article className="income-summary-card">
              <span className="income-summary-icon income-icon-received" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <div className="income-summary-info">
                <div className="income-summary-header">
                  <small>Received & Settled</small>
                  <span className="income-summary-pill received">Cleared</span>
                </div>
                <strong>{formatCurrency(receivedIncome)}</strong>
                <span>{receivedRecords.length} settled payments</span>
              </div>
            </article>
          </section>

          {/* Quick Status Filter Tabs */}
          <div className="income-status-tabs" role="tablist">
            <button
              type="button"
              className={`income-tab-btn ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => { setStatusFilter(''); setPage(1) }}
            >
              All Records <span className="income-tab-count">{records.length}</span>
            </button>
            <button
              type="button"
              className={`income-tab-btn ${statusFilter === 'Received' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Received'); setPage(1) }}
            >
              Received <span className="income-tab-count">{receivedRecords.length}</span>
            </button>
            <button
              type="button"
              className={`income-tab-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Pending'); setPage(1) }}
            >
              Pending <span className="income-tab-count">{pendingRecords.length}</span>
            </button>
            <button
              type="button"
              className={`income-tab-btn ${statusFilter === 'Cancelled' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('Cancelled'); setPage(1) }}
            >
              Cancelled <span className="income-tab-count">{cancelledRecords.length}</span>
            </button>
          </div>

          {/* Main Content Panel */}
          <section className="income-panel">
            <div className="income-panel-heading">
              <div>
                <h2>Income Transactions</h2>
                <p>Audited ledger of all realized and pending income transactions.</p>
              </div>
              <span className="income-record-count">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                {filteredRecords.length} {filteredRecords.length === 1 ? 'record found' : 'records found'}
              </span>
            </div>

            {/* Toolbar */}
            <div className="income-toolbar">
              <label className="income-search">
                <span aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  aria-label="Search income records"
                  placeholder="Search by Income No, Farmer, Farm, Buyer, Crop..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                />
              </label>

              <div className="income-filter-field">
                <span>Date Range</span>
                <div className="income-date-range">
                  <input
                    aria-label="From date"
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => {
                      setDateFrom(event.target.value)
                      setPage(1)
                    }}
                  />
                  <span>to</span>
                  <input
                    aria-label="To date"
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => {
                      setDateTo(event.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>

              <label className="income-filter-field">
                <span>Income Type</span>
                <select
                  aria-label="Filter by income type"
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All Types</option>
                  {incomeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="income-filter-field">
                <span>Payment Mode</span>
                <select
                  aria-label="Filter by payment mode"
                  value={paymentFilter}
                  onChange={(event) => {
                    setPaymentFilter(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All Modes</option>
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>

              <button className="income-clear-button" type="button" onClick={resetFilters} title="Reset all filters">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Reset
              </button>
            </div>

            {notice && (
              <div className="income-notice" role="status">
                <span>✓ {notice}</span>
                <button type="button" className="income-clear-button" onClick={() => setNotice('')} style={{ height: '24px', padding: '0 6px' }}>
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="income-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={refreshRecords}>
                  Retry
                </button>
              </div>
            )}

            {/* Income Table */}
            <div className="income-table-wrap">
              <table className="income-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Income No</th>
                    <th>Farmer & Farm</th>
                    <th>Crop / Item</th>
                    <th>Income Type</th>
                    <th>Buyer</th>
                    <th className="income-number-cell">Amount</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th>
                      <span className="income-visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {error && records.length === 0 ? (
                    <tr>
                      <td className="income-empty-cell" colSpan="10">
                        Income records could not be loaded. Click Retry above.
                      </td>
                    </tr>
                  ) : pageRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10">
                        <div className="income-empty">
                          <span className="income-empty-icon" aria-hidden="true">
                            ₹
                          </span>
                          <strong>{records.length ? 'No transactions match filters' : 'No income records yet'}</strong>
                          <p>
                            {records.length
                              ? 'Try adjusting your search terms, date range, or clear active filters.'
                              : 'Start logging your farm income by adding your first transaction.'}
                          </p>
                          {records.length ? (
                            <button type="button" onClick={resetFilters}>
                              Clear all filters
                            </button>
                          ) : (
                            <button type="button" onClick={openAdd}>
                              ＋ Record First Income
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="income-nowrap">{formatDate(record.incomeDate)}</td>
                        <td>
                          <button
                            className="income-id-link"
                            type="button"
                            title="Click to view full details"
                            onClick={() => openDetails(record)}
                          >
                            {record.incomeNo || '—'}
                          </button>
                        </td>
                        <td>
                          <div className="income-farmer-cell">
                            <span className="income-farmer-name">{record.farmer || '—'}</span>
                            <span className="income-farm-name">{record.farm || 'General Farm'}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{record.crop || '—'}</span>
                        </td>
                        <td>
                          <span className={`income-type-tag ${getCategoryClass(record.incomeType)}`}>
                            {record.incomeType || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#475569' }}>{record.buyer || '—'}</span>
                        </td>
                        <td className="income-number-cell income-amount">
                          {formatCurrency(record.netAmount ?? record.amount)}
                        </td>
                        <td>
                          <span className="income-pay-mode">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                              <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            {record.paymentMode || '—'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={record.status} />
                        </td>
                        <td>
                          <div className="income-row-actions">
                            <button
                              type="button"
                              className="action-view"
                              aria-label={`View ${record.incomeNo}`}
                              title="View transaction details"
                              onClick={() => openDetails(record)}
                            >
                              <Icon name="view" />
                            </button>
                            <button
                              type="button"
                              className="action-edit"
                              aria-label={`Edit ${record.incomeNo}`}
                              title="Edit record"
                              onClick={() => openEdit(record)}
                            >
                              <Icon name="edit" />
                            </button>
                            <button
                              type="button"
                              className="action-delete"
                              aria-label={`Delete ${record.incomeNo}`}
                              title="Delete record"
                              onClick={() => setPendingDelete(record)}
                            >
                              <Icon name="delete" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <footer className="income-table-footer">
              <span>
                Showing{' '}
                <strong>
                  {filteredRecords.length ? (currentPage - 1) * pageSize + 1 : 0}–
                  {Math.min(currentPage * pageSize, filteredRecords.length)}
                </strong>{' '}
                of <strong>{filteredRecords.length}</strong> transactions
              </span>
              <div className="income-pagination">
                <label>
                  Rows per page{' '}
                  <select
                    aria-label="Rows per page"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                  >
                    {pageSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ‹
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  ›
                </button>
              </div>
            </footer>
          </section>
          <p className="income-storage-note">Records are saved locally in this browser workspace.</p>
        </>
      ) : isForm ? (
        /* Add / Edit Form Screen */
        <section className="income-form-screen">
          <button className="income-back-link" type="button" onClick={() => returnToList()}>
            ← Back to Income List
          </button>

          {/* Datalists */}
          <datalist id="common-farmers">
            {commonFarmers.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <datalist id="common-farms">
            {commonFarms.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <datalist id="common-crops">
            {commonCrops.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="common-units">
            {commonUnits.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <datalist id="common-buyers">
            {commonBuyers.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <datalist id="common-bank-cash">
            {commonBankCash.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          <header className="income-page-heading" style={{ marginBottom: '18px' }}>
            <div>
              <div className="income-breadcrumb">
                <span>Finance</span>
                <span>/</span>
                <span>Income Management</span>
                <span>/</span>
                <strong>{screen === 'edit' ? 'Edit Record' : 'New Transaction'}</strong>
              </div>
              <h1>{screen === 'edit' ? 'Edit Income Transaction' : 'Record New Farm Income'}</h1>
              <p>
                {screen === 'edit'
                  ? `Update financial values and details for ${selectedRecord?.incomeNo || 'this record'}.`
                  : 'Enter the sales or subsidy particulars. Net amount calculates automatically in real-time.'}
              </p>
            </div>
          </header>

          {error && (
            <div className="income-error" role="alert">
              {error}
            </div>
          )}

          <form className="income-form" noValidate onSubmit={submitForm}>
            {/* Step 1: Transaction details */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">1</span>
                <div>
                  <h2>Transaction & Origin Details</h2>
                  <p>Identify the date, income category, farmer, and destination farm parcel.</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Income Date" name="incomeDate" error={formErrors.incomeDate} required>
                  <input
                    id="incomeDate"
                    name="incomeDate"
                    type="date"
                    value={formValues.incomeDate}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.incomeDate)}
                  />
                </FormField>

                <FormField
                  label="Income No."
                  name="incomeNo"
                  hint={screen === 'edit' ? 'Unique identifier' : 'Auto-generated on save if blank'}
                >
                  <input
                    id="incomeNo"
                    name="incomeNo"
                    value={formValues.incomeNo}
                    onChange={updateField}
                    placeholder="e.g. INC-20261030-001"
                    readOnly={screen === 'edit'}
                  />
                </FormField>

                <FormField label="Income Type" name="incomeType" error={formErrors.incomeType} required>
                  <select
                    id="incomeType"
                    name="incomeType"
                    value={formValues.incomeType}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.incomeType)}
                  >
                    <option value="">Select income type</option>
                    {incomeTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Farmer" name="farmer" hint="Farmer or grower operator">
                  <input
                    id="farmer"
                    name="farmer"
                    list="common-farmers"
                    maxLength="120"
                    placeholder="Enter or pick farmer name"
                    value={formValues.farmer}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Farm" name="farm" hint="Farm parcel or orchard">
                  <input
                    id="farm"
                    name="farm"
                    list="common-farms"
                    maxLength="120"
                    placeholder="e.g. North Field, Lake Farm"
                    value={formValues.farm}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Crop / Produce" name="crop" hint="Harvest produce or commodity">
                  <input
                    id="crop"
                    name="crop"
                    list="common-crops"
                    maxLength="120"
                    placeholder="e.g. Paddy, Wheat, Cow Milk, Cotton"
                    value={formValues.crop}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Buyer / Payer" name="buyer" hint="Purchaser, cooperative, or agency">
                  <input
                    id="buyer"
                    name="buyer"
                    list="common-buyers"
                    maxLength="120"
                    placeholder="e.g. Sri Lakshmi Traders, Dairy Coop"
                    value={formValues.buyer}
                    onChange={updateField}
                  />
                </FormField>
              </div>
            </div>

            {/* Step 2: Pricing & Calculation */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">2</span>
                <div>
                  <h2>Pricing & Calculation Breakdown</h2>
                  <p>Specify quantity and rate. Gross and net amounts update automatically in real-time.</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Quantity" name="quantity" error={formErrors.quantity} required>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    inputMode="decimal"
                    placeholder="e.g. 1000"
                    value={formValues.quantity}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.quantity)}
                  />
                </FormField>

                <FormField label="Unit" name="unit" error={formErrors.unit} required>
                  <input
                    id="unit"
                    name="unit"
                    list="common-units"
                    maxLength="30"
                    placeholder="e.g. kg, quintal, tonne, litre"
                    value={formValues.unit}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.unit)}
                  />
                </FormField>

                <FormField label="Rate per Unit (₹)" name="rate" error={formErrors.rate} required>
                  <input
                    id="rate"
                    name="rate"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="Price per unit in ₹"
                    value={formValues.rate}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.rate)}
                  />
                </FormField>

                <FormField label="Discount (₹)" name="discount" error={formErrors.discount} required>
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="Discount deduction (default: 0)"
                    value={formValues.discount}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.discount)}
                  />
                </FormField>

                <FormField label="Other Charges (₹)" name="otherCharges" error={formErrors.otherCharges} required>
                  <input
                    id="otherCharges"
                    name="otherCharges"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="Freight, loading, or packing (default: 0)"
                    value={formValues.otherCharges}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.otherCharges)}
                  />
                </FormField>

                {/* Live Real-time Calculation Card */}
                <div className="income-calc-banner">
                  <div className="income-calc-item">
                    <span>Gross Amount</span>
                    <strong>{formatCurrency(calculatedAmounts.grossAmount)}</strong>
                    <small>Quantity × Rate</small>
                  </div>

                  <div className="income-calc-item">
                    <span>Adjustments</span>
                    <strong>- {formatCurrency(formValues.discount || 0)} + {formatCurrency(formValues.otherCharges || 0)}</strong>
                    <small>Discount &amp; other charges</small>
                  </div>

                  <div className="income-calc-item emphasis">
                    <span>Net Amount Payable</span>
                    <strong>{formatCurrency(calculatedAmounts.netAmount)}</strong>
                    <small>Auto: Gross − Discount + Charges</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Payment & Status */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">3</span>
                <div>
                  <h2>Settlement, Banking &amp; Remarks</h2>
                  <p>Choose the payment channel, destination account, reference number, and notes.</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Payment Mode" name="paymentMode" error={formErrors.paymentMode} required>
                  <select
                    id="paymentMode"
                    name="paymentMode"
                    value={formValues.paymentMode}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.paymentMode)}
                  >
                    <option value="">Select payment mode</option>
                    {paymentModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Bank / Cash Account"
                  name="bankCash"
                  hint="Account where funds are deposited"
                >
                  <input
                    id="bankCash"
                    name="bankCash"
                    list="common-bank-cash"
                    maxLength="100"
                    placeholder="e.g. HDFC Farm Account, Cash in Hand"
                    value={formValues.bankCash}
                    onChange={updateField}
                  />
                </FormField>

                <FormField
                  label="Reference / UTR Number"
                  name="referenceNumber"
                  hint="UTR, Cheque No, or UPI Transaction ID"
                >
                  <input
                    id="referenceNumber"
                    name="referenceNumber"
                    maxLength="100"
                    placeholder="e.g. TXN-884210, CHQ-551029"
                    value={formValues.referenceNumber}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Status" name="status" error={formErrors.status} required>
                  <select
                    id="status"
                    name="status"
                    value={formValues.status}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.status)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Transaction Remarks" name="remarks" full hint="Any additional context or settlement details">
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows="3"
                    maxLength="500"
                    placeholder="Enter additional remarks or transaction notes..."
                    value={formValues.remarks}
                    onChange={updateField}
                  />
                </FormField>
              </div>
            </div>

            {/* Form Footer */}
            <div className="income-form-footer">
              <span>
                <i>*</i> Required fields for financial integrity
              </span>
              <div>
                <button className="income-secondary-button" type="button" onClick={() => returnToList()}>
                  Cancel
                </button>
                <button className="income-primary-button" type="submit">
                  {screen === 'edit' ? 'Update Income Record' : 'Save Income Record'}
                </button>
              </div>
            </div>
          </form>
          <p className="income-storage-note">Records are saved locally in this browser workspace.</p>
        </section>
      ) : (
        /* Details View Screen */
        <section className="income-details-screen">
          <button className="income-back-link" type="button" onClick={() => returnToList()}>
            ← Back to Income List
          </button>
          {selectedRecord && (
            <>
              <header className="income-page-heading income-details-heading">
                <div>
                  <div className="income-breadcrumb">
                    <span>Finance</span>
                    <span>/</span>
                    <span>Income Management</span>
                    <span>/</span>
                    <strong>{selectedRecord.incomeNo}</strong>
                  </div>
                  <h1>Income Transaction Details</h1>
                  <p>Audit receipt and transaction particulars recorded for {selectedRecord.incomeNo}.</p>
                </div>
                <div className="income-detail-actions">
                  <button
                    className="income-secondary-button"
                    type="button"
                    onClick={() => openEdit(selectedRecord)}
                  >
                    <Icon name="edit" /> Edit Record
                  </button>
                  <button
                    className="income-danger-button"
                    type="button"
                    onClick={() => setPendingDelete(selectedRecord)}
                  >
                    <Icon name="delete" /> Delete
                  </button>
                </div>
              </header>

              {error && (
                <div className="income-error" role="alert">
                  {error}
                </div>
              )}

              {/* Net Income Banner */}
              <div className="income-detail-total">
                <div>
                  <span>Total Net Amount</span>
                  <strong>{formatCurrency(selectedRecord.netAmount ?? selectedRecord.amount)}</strong>
                </div>
                <StatusBadge status={selectedRecord.status} />
              </div>

              {/* Detail Card */}
              <section className="income-detail-card">
                <div className="income-detail-card-heading">
                  <div>
                    <span className={`income-type-tag ${getCategoryClass(selectedRecord.incomeType)}`}>
                      {selectedRecord.incomeType || 'Income'}
                    </span>
                    <h2>{selectedRecord.farmer || selectedRecord.buyer || 'Income Transaction'}</h2>
                  </div>
                  <span>{formatDate(selectedRecord.incomeDate)}</span>
                </div>

                <dl className="income-detail-grid">
                  <DetailItem label="Income Number" value={selectedRecord.incomeNo || '—'} />
                  <DetailItem label="Income Date" value={formatDate(selectedRecord.incomeDate)} />
                  <DetailItem label="Farmer" value={selectedRecord.farmer || '—'} />
                  <DetailItem label="Farm Parcel" value={selectedRecord.farm || '—'} />
                  <DetailItem label="Crop / Produce" value={selectedRecord.crop || '—'} />
                  <DetailItem label="Buyer / Payer" value={selectedRecord.buyer || '—'} />
                  <DetailItem
                    label="Quantity & Unit"
                    value={`${selectedRecord.quantity ?? '—'} ${selectedRecord.unit || ''}`.trim()}
                  />
                  <DetailItem
                    label="Rate per Unit"
                    value={selectedRecord.rate != null ? `₹ ${selectedRecord.rate}` : '—'}
                  />
                  <DetailItem
                    label="Gross Amount"
                    value={formatCurrency(selectedRecord.grossAmount ?? selectedRecord.amount)}
                  />
                  <DetailItem label="Discount Deducted" value={formatCurrency(selectedRecord.discount ?? 0)} />
                  <DetailItem
                    label="Other Charges"
                    value={formatCurrency(selectedRecord.otherCharges ?? 0)}
                  />
                  <DetailItem
                    label="Net Realized Amount"
                    value={formatCurrency(selectedRecord.netAmount ?? selectedRecord.amount)}
                  />
                  <DetailItem label="Payment Mode" value={selectedRecord.paymentMode || '—'} />
                  <DetailItem
                    label="Bank / Cash Account"
                    value={selectedRecord.bankCash || selectedRecord['Bank/Cash'] || '—'}
                  />
                  <DetailItem
                    label="Reference / UTR Number"
                    value={selectedRecord.referenceNumber || selectedRecord.transactionReference || '—'}
                  />
                  <DetailItem label="Settlement Status" value={selectedRecord.status || 'Received'} />
                  <DetailItem label="Remarks & Notes" value={selectedRecord.remarks || 'No notes provided.'} full />
                </dl>
              </section>
              <p className="income-storage-note">Records are saved locally in this browser workspace.</p>
            </>
          )}
        </section>
      )}

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div
          className="income-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingDelete(null)
          }}
        >
          <div
            className="income-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="income-delete-title"
            aria-describedby="income-delete-description"
          >
            <span className="income-delete-icon">
              <Icon name="delete" />
            </span>
            <h2 id="income-delete-title">Delete Income Record?</h2>
            <p id="income-delete-description">
              This action will permanently delete record <strong>{pendingDelete.incomeNo || 'this entry'}</strong> with amount{' '}
              <strong>{formatCurrency(pendingDelete.netAmount ?? pendingDelete.amount)}</strong> from your income ledger.
            </p>
            {error && (
              <div className="income-error" role="alert">
                {error}
              </div>
            )}
            <div>
              <button
                className="income-secondary-button"
                type="button"
                onClick={() => {
                  setPendingDelete(null)
                  setError('')
                }}
              >
                Cancel
              </button>
              <button className="income-danger-button" type="button" onClick={confirmDelete}>
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const style = status === 'Received' ? 'received' : status === 'Cancelled' ? 'cancelled' : 'pending'
  return (
    <span className={`income-status is-${style}`}>
      <i />
      {status || 'Pending'}
    </span>
  )
}

function Icon({ name }) {
  const paths = {
    view: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
    delete: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function FormField({ label, name, error, hint, required = false, full = false, children }) {
  return (
    <div className={`income-field${full ? ' income-field-full' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <small className="income-field-hint">{hint}</small>}
      {error && (
        <span className="income-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={`income-detail-item${full ? ' income-detail-item-full' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
