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
    incomeType: '',
    buyer: '',
    quantity: '1',
    unit: '',
    rate: '',
    discount: '0',
    otherCharges: '0',
    paymentMode: '',
    transactionReference: '',
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
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
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
  if (!values.quantity || !Number.isFinite(quantity) || quantity <= 0) errors.quantity = 'Enter a quantity greater than zero.'
  if (!values.unit.trim()) errors.unit = 'Enter a unit.'
  if (values.rate === '' || !Number.isFinite(rate) || rate < 0) errors.rate = 'Enter a valid rate.'
  if (values.discount === '' || !Number.isFinite(discount) || discount < 0) errors.discount = 'Enter a valid discount.'
  if (values.otherCharges === '' || !Number.isFinite(otherCharges) || otherCharges < 0) errors.otherCharges = 'Enter valid other charges.'
  if (Number.isFinite(grossAmount) && discount > grossAmount) errors.discount = 'Discount cannot exceed the gross amount.'
  if (!Number.isFinite(grossAmount) || !Number.isFinite(netAmount) || grossAmount > 999999999999 || netAmount > 999999999999) {
    errors.rate = 'The calculated amount is too large.'
  }
  if (!values.paymentMode) errors.paymentMode = 'Select a payment mode.'
  if (!statuses.includes(values.status)) errors.status = 'Select a valid status.'
  return errors
}

function toFormValues(record) {
  return {
    incomeDate: record.incomeDate || '',
    incomeNo: record.incomeNo || '',
    farmer: record.farmer || '',
    farm: record.farm || '',
    crop: record.crop || '',
    incomeType: record.incomeType || record.category || '',
    buyer: record.buyer || record.source || '',
    quantity: String(record.quantity ?? 1),
    unit: record.unit || 'item',
    rate: String(record.rate ?? record.unitPrice ?? record.amount ?? ''),
    discount: String(record.discount ?? 0),
    otherCharges: String(record.otherCharges ?? 0),
    paymentMode: record.paymentMode || record.paymentMethod || '',
    transactionReference: record.transactionReference || record.reference || '',
    remarks: record.remarks || record.notes || '',
    status: statuses.includes(record.status) ? record.status : 'Received',
  }
}

function toRecordValues(values) {
  const { grossAmount, netAmount } = amounts(values)
  return {
    incomeDate: values.incomeDate,
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
    transactionReference: values.transactionReference.trim(),
    remarks: values.remarks.trim(),
    status: values.status,
  }
}

function monthToDateAmount(records) {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return records
    .filter((record) => record.status !== 'Cancelled' && record.incomeDate?.startsWith(month))
    .reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)
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
  const [screen, setScreen] = useState('list')
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
        record.buyer || record.source,
      ].some((value) => String(value || '').toLowerCase().includes(searchTerm))
      return matchesSearch &&
        (!dateFrom || record.incomeDate >= dateFrom) &&
        (!dateTo || record.incomeDate <= dateTo) &&
        (!typeFilter || (record.incomeType || record.category) === typeFilter) &&
        (!paymentFilter || (record.paymentMode || record.paymentMethod) === paymentFilter) &&
        (!statusFilter || record.status === statusFilter)
    })
  }, [records, search, dateFrom, dateTo, typeFilter, paymentFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const eligibleRecords = records.filter((record) => record.status !== 'Cancelled')
  const totalIncome = eligibleRecords.reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)
  const thisMonth = monthToDateAmount(records)
  const pendingIncome = records.filter((record) => record.status === 'Pending')
    .reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)
  const receivedIncome = records.filter((record) => record.status === 'Received')
    .reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)

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
    if (Object.keys(validationErrors).length) return

    try {
      if (screen === 'edit' && selectedRecord) {
        const updated = updateIncome(selectedRecord.id, toRecordValues(formValues))
        setRecords((current) => current.map((record) => record.id === updated.id ? updated : record))
        returnToList('Income record updated in this browser.')
      } else {
        const created = createIncome(toRecordValues(formValues))
        setRecords((current) => [created, ...current])
        returnToList('Income record saved in this browser.')
      }
    } catch (saveError) {
      setError(saveError.message || 'Income could not be saved.')
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return
    try {
      deleteIncome(pendingDelete.id)
      setRecords((current) => current.filter((record) => record.id !== pendingDelete.id))
      returnToList('Income record deleted from this browser.')
    } catch (deleteError) {
      setError(deleteError.message || 'Income could not be deleted.')
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
          <header className="income-page-heading">
            <div>
              <div className="income-breadcrumb">Workspace <span>/</span> Finance <span>/</span> <strong>Income Management</strong></div>
              <h1>Income Management</h1>
              <p>Track, manage, and analyze income across your farm operations.</p>
            </div>
            <button className="income-primary-button" type="button" onClick={openAdd}><span aria-hidden="true">＋</span> Add Income</button>
          </header>

          <section className="income-summary" aria-label="Income summary">
            <SummaryCard icon="₹" label="Total Income" value={formatCurrency(totalIncome)} hint={`${eligibleRecords.length} active ${eligibleRecords.length === 1 ? 'record' : 'records'}`} />
            <SummaryCard icon="◷" tone="month" label="This Month" value={formatCurrency(thisMonth)} hint="Current calendar month" />
            <SummaryCard icon="◷" tone="pending" label="Pending Income" value={formatCurrency(pendingIncome)} hint={`${records.filter((record) => record.status === 'Pending').length} awaiting payment`} />
            <SummaryCard icon="✓" tone="received" label="Received Income" value={formatCurrency(receivedIncome)} hint={`${records.filter((record) => record.status === 'Received').length} received records`} />
          </section>

          <section className="income-panel">
            <div className="income-panel-heading">
              <div><h2>Income records</h2><p>Review and manage your farm income transactions.</p></div>
              <span className="income-record-count">{filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}</span>
            </div>
            <div className="income-toolbar">
              <label className="income-search">
                <span aria-hidden="true">⌕</span>
                <input aria-label="Search by income number, farmer or buyer" placeholder="Search income no., farmer or buyer..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
              </label>
              <div className="income-filter-field"><span>Date range</span><div className="income-date-range">
                <input aria-label="Filter from date" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => { setDateFrom(event.target.value); setPage(1) }} />
                <span>to</span>
                <input aria-label="Filter to date" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1) }} />
              </div></div>
              <label className="income-filter-field"><span>Income type</span><select aria-label="Filter by income type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(1) }}><option value="">All types</option>{incomeTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="income-filter-field"><span>Payment mode</span><select aria-label="Filter by payment mode" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1) }}><option value="">All modes</option>{paymentModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              <label className="income-filter-field"><span>Status</span><select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
              <button className="income-clear-button" type="button" onClick={resetFilters}>Clear filters</button>
            </div>

            {notice && <div className="income-notice" role="status">{notice}</div>}
            {error && <div className="income-error" role="alert"><span>{error}</span><button type="button" onClick={refreshRecords}>Retry</button></div>}

            <div className="income-table-wrap">
              <table className="income-table">
                <thead><tr>
                  <th>Date</th><th>Income No.</th><th>Farmer</th><th>Farm</th><th>Crop</th>
                  <th>Income Type</th><th>Buyer</th><th className="income-number-cell">Amount</th>
                  <th>Payment Mode</th><th>Status</th><th><span className="income-visually-hidden">Actions</span></th>
                </tr></thead>
                <tbody>
                  {error && records.length === 0 ? (
                    <tr><td className="income-empty-cell" colSpan="11">Income data could not be loaded. Use Retry to try again.</td></tr>
                  ) : pageRecords.length === 0 ? (
                    <tr><td colSpan="11"><div className="income-empty">
                      <span aria-hidden="true">₹</span>
                      <strong>{records.length ? 'No income matches these filters' : 'No income records yet'}</strong>
                      <p>{records.length ? 'Adjust your search or clear filters to see more records.' : 'Add your first record to start tracking farm income.'}</p>
                      {records.length ? <button type="button" onClick={resetFilters}>Clear filters</button> : <button type="button" onClick={openAdd}>＋ Add Income</button>}
                    </div></td></tr>
                  ) : pageRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="income-nowrap">{formatDate(record.incomeDate)}</td>
                      <td><button className="income-id-link" type="button" onClick={() => openDetails(record)}>{record.incomeNo || '—'}</button></td>
                      <td>{record.farmer || '—'}</td>
                      <td>{record.farm || '—'}</td>
                      <td>{record.crop || '—'}</td>
                      <td><span className="income-type-tag">{record.incomeType || record.category || '—'}</span></td>
                      <td>{record.buyer || record.source || '—'}</td>
                      <td className="income-number-cell income-amount">{formatCurrency(record.netAmount ?? record.amount)}</td>
                      <td>{record.paymentMode || record.paymentMethod || '—'}</td>
                      <td><StatusBadge status={record.status} /></td>
                      <td><div className="income-row-actions">
                        <button type="button" aria-label={`View ${record.incomeNo || 'income record'}`} title="View details" onClick={() => openDetails(record)}><Icon name="view" /></button>
                        <button type="button" aria-label={`Edit ${record.incomeNo || 'income record'}`} title="Edit income" onClick={() => openEdit(record)}><Icon name="edit" /></button>
                        <button type="button" aria-label={`Delete ${record.incomeNo || 'income record'}`} title="Delete income" onClick={() => setPendingDelete(record)}><Icon name="delete" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="income-table-footer">
              <span>Showing <strong>{filteredRecords.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> of <strong>{filteredRecords.length}</strong></span>
              <div className="income-pagination">
                <label>Rows per page <select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>{pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
                <button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>
                <span>Page {currentPage} of {pageCount}</span>
                <button type="button" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>›</button>
              </div>
            </footer>
            <p className="income-storage-note">Records are saved only in this browser and are not synced to a server.</p>
          </section>
        </>
      ) : isForm ? (
        <section className="income-form-screen">
          <button className="income-back-link" type="button" onClick={() => returnToList()}>← Back to Income</button>
          <header className="income-form-heading">
            <div>
              <div className="income-breadcrumb">Workspace <span>/</span> Finance <span>/</span> Income Management <span>/</span> <strong>{screen === 'edit' ? 'Edit' : 'New'}</strong></div>
              <h1>{screen === 'edit' ? 'Edit Income' : 'Add Income'}</h1>
              <p>{screen === 'edit' ? `Update the details for ${selectedRecord?.incomeNo || 'this record'}.` : 'Enter the details for an income transaction.'}</p>
            </div>
          </header>
          {error && <div className="income-error" role="alert">{error}</div>}
          <form className="income-form" noValidate onSubmit={submitForm}>
            <FormSection title="Transaction details" description="Identify the income and the farm operation it relates to.">
              <FormField label="Income Date" name="incomeDate" error={formErrors.incomeDate} required><input id="incomeDate" name="incomeDate" type="date" value={formValues.incomeDate} onChange={updateField} aria-invalid={Boolean(formErrors.incomeDate)} /></FormField>
              <FormField label="Income Number" name="incomeNo" hint="Generated automatically when saved."><input id="incomeNo" name="incomeNo" value={selectedRecord?.incomeNo || 'Generated on save'} readOnly /></FormField>
              <FormField label="Income Type" name="incomeType" error={formErrors.incomeType} required><select id="incomeType" name="incomeType" value={formValues.incomeType} onChange={updateField} aria-invalid={Boolean(formErrors.incomeType)}><option value="">Select income type</option>{incomeTypes.map((type) => <option key={type}>{type}</option>)}</select></FormField>
              <FormField label="Farmer" name="farmer" hint="Enter the farmer name."><input id="farmer" name="farmer" maxLength="120" placeholder="Farmer name" value={formValues.farmer} onChange={updateField} /></FormField>
              <FormField label="Farm" name="farm" hint="Enter the farm name."><input id="farm" name="farm" maxLength="120" placeholder="Farm name" value={formValues.farm} onChange={updateField} /></FormField>
              <FormField label="Crop" name="crop"><input id="crop" name="crop" maxLength="120" placeholder="Crop or produce" value={formValues.crop} onChange={updateField} /></FormField>
              <FormField label="Buyer" name="buyer"><input id="buyer" name="buyer" maxLength="120" placeholder="Buyer or payer" value={formValues.buyer} onChange={updateField} /></FormField>
            </FormSection>

            <FormSection title="Income calculation" description="Gross and net values update automatically as you enter amounts.">
              <FormField label="Quantity" name="quantity" error={formErrors.quantity} required><input id="quantity" name="quantity" type="number" min="0.01" step="any" inputMode="decimal" value={formValues.quantity} onChange={updateField} aria-invalid={Boolean(formErrors.quantity)} /></FormField>
              <FormField label="Unit" name="unit" error={formErrors.unit} required><input id="unit" name="unit" maxLength="30" placeholder="kg, litre, head, item…" value={formValues.unit} onChange={updateField} aria-invalid={Boolean(formErrors.unit)} /></FormField>
              <FormField label="Rate (₹)" name="rate" error={formErrors.rate} required><input id="rate" name="rate" type="number" min="0" step="any" inputMode="decimal" value={formValues.rate} onChange={updateField} aria-invalid={Boolean(formErrors.rate)} /></FormField>
              <AmountReadout label="Gross Amount" value={calculatedAmounts.grossAmount} hint="Quantity × rate" />
              <FormField label="Discount (₹)" name="discount" error={formErrors.discount} required><input id="discount" name="discount" type="number" min="0" step="any" inputMode="decimal" value={formValues.discount} onChange={updateField} aria-invalid={Boolean(formErrors.discount)} /></FormField>
              <FormField label="Other Charges (₹)" name="otherCharges" error={formErrors.otherCharges} required><input id="otherCharges" name="otherCharges" type="number" min="0" step="any" inputMode="decimal" value={formValues.otherCharges} onChange={updateField} aria-invalid={Boolean(formErrors.otherCharges)} /></FormField>
              <AmountReadout label="Net Amount" value={calculatedAmounts.netAmount} hint="Gross − discount + other charges" emphasis />
            </FormSection>

            <FormSection title="Payment and notes" description="Record payment status and any supporting transaction information.">
              <FormField label="Payment Mode" name="paymentMode" error={formErrors.paymentMode} required><select id="paymentMode" name="paymentMode" value={formValues.paymentMode} onChange={updateField} aria-invalid={Boolean(formErrors.paymentMode)}><option value="">Select payment mode</option>{paymentModes.map((mode) => <option key={mode}>{mode}</option>)}</select></FormField>
              <FormField label="Status" name="status" error={formErrors.status} required><select id="status" name="status" value={formValues.status} onChange={updateField} aria-invalid={Boolean(formErrors.status)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></FormField>
              <FormField label="Transaction Reference" name="transactionReference"><input id="transactionReference" name="transactionReference" maxLength="100" placeholder="Transaction or receipt number" value={formValues.transactionReference} onChange={updateField} /></FormField>
              <FormField label="Remarks" name="remarks" full><textarea id="remarks" name="remarks" rows="3" maxLength="500" placeholder="Additional notes (optional)" value={formValues.remarks} onChange={updateField} /></FormField>
            </FormSection>
            <div className="income-form-footer">
              <span><i>*</i> Required fields</span>
              <div><button className="income-secondary-button" type="button" onClick={() => returnToList()}>Cancel</button><button className="income-primary-button" type="submit">{screen === 'edit' ? 'Save Changes' : 'Save Income'}</button></div>
            </div>
          </form>
          <p className="income-storage-note">This record will be saved in this browser only. No server API is configured for income.</p>
        </section>
      ) : (
        <section className="income-details-screen">
          <button className="income-back-link" type="button" onClick={() => returnToList()}>← Back to Income</button>
          {selectedRecord && <>
            <header className="income-details-heading">
              <div><div className="income-breadcrumb">Workspace <span>/</span> Finance <span>/</span> Income Management <span>/</span> <strong>Details</strong></div><h1>Income details</h1><p>{selectedRecord.incomeNo}</p></div>
              <div className="income-detail-actions"><button className="income-secondary-button" type="button" onClick={() => openEdit(selectedRecord)}><Icon name="edit" /> Edit</button><button className="income-danger-button" type="button" onClick={() => setPendingDelete(selectedRecord)}><Icon name="delete" /> Delete</button></div>
            </header>
            {error && <div className="income-error" role="alert">{error}</div>}
            <div className="income-detail-total">
              <div><span>Net income</span><strong>{formatCurrency(selectedRecord.netAmount ?? selectedRecord.amount)}</strong></div>
              <StatusBadge status={selectedRecord.status} />
            </div>
            <section className="income-detail-card">
              <div className="income-detail-card-heading"><div><span className="income-type-tag">{selectedRecord.incomeType || selectedRecord.category || 'Income'}</span><h2>{selectedRecord.farmer || selectedRecord.buyer || selectedRecord.source || 'Income transaction'}</h2></div><span>{formatDate(selectedRecord.incomeDate)}</span></div>
              <dl className="income-detail-grid">
                <DetailItem label="Income Number" value={selectedRecord.incomeNo || '—'} />
                <DetailItem label="Income Date" value={formatDate(selectedRecord.incomeDate)} />
                <DetailItem label="Farmer" value={selectedRecord.farmer || '—'} />
                <DetailItem label="Farm" value={selectedRecord.farm || '—'} />
                <DetailItem label="Crop" value={selectedRecord.crop || '—'} />
                <DetailItem label="Buyer" value={selectedRecord.buyer || selectedRecord.source || '—'} />
                <DetailItem label="Quantity" value={`${selectedRecord.quantity ?? '—'} ${selectedRecord.unit || ''}`.trim()} />
                <DetailItem label="Rate" value={formatCurrency(selectedRecord.rate ?? selectedRecord.unitPrice)} />
                <DetailItem label="Gross Amount" value={formatCurrency(selectedRecord.grossAmount ?? selectedRecord.amount)} />
                <DetailItem label="Discount" value={formatCurrency(selectedRecord.discount)} />
                <DetailItem label="Other Charges" value={formatCurrency(selectedRecord.otherCharges)} />
                <DetailItem label="Net Amount" value={formatCurrency(selectedRecord.netAmount ?? selectedRecord.amount)} />
                <DetailItem label="Payment Mode" value={selectedRecord.paymentMode || selectedRecord.paymentMethod || '—'} />
                <DetailItem label="Transaction Reference" value={selectedRecord.transactionReference || selectedRecord.reference || '—'} />
                <DetailItem label="Remarks" value={selectedRecord.remarks || selectedRecord.notes || '—'} full />
              </dl>
            </section>
            <p className="income-storage-note">This record is stored in this browser only.</p>
          </>}
        </section>
      )}

      {pendingDelete && <div className="income-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null) }}>
        <div className="income-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="income-delete-title" aria-describedby="income-delete-description">
          <span className="income-delete-icon"><Icon name="delete" /></span>
          <h2 id="income-delete-title">Delete this income record?</h2>
          <p id="income-delete-description">This permanently removes <strong>{pendingDelete.incomeNo || 'this record'}</strong> from this browser.</p>
          {error && <div className="income-error" role="alert">{error}</div>}
          <div><button className="income-secondary-button" type="button" onClick={() => { setPendingDelete(null); setError('') }}>Cancel</button><button className="income-danger-button" type="button" onClick={confirmDelete}>Delete record</button></div>
        </div>
      </div>}
    </div>
  )
}

function SummaryCard({ icon, label, value, hint, tone = '' }) {
  return <article className="income-summary-card">
    <span className={`income-summary-icon ${tone ? `income-icon-${tone}` : ''}`} aria-hidden="true">{icon}</span>
    <div><small>{label}</small><strong>{value}</strong><span>{hint}</span></div>
  </article>
}

function StatusBadge({ status }) {
  const style = status === 'Received' ? 'received' : status === 'Cancelled' ? 'cancelled' : 'pending'
  return <span className={`income-status is-${style}`}><i />{status || 'Pending'}</span>
}

function Icon({ name }) {
  const paths = {
    view: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4M11 8v6M8 11h6" /></>,
    edit: <><path d="m14 5 5 5M4 20l4.5-1 10.2-10.2a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" /></>,
    delete: <><path d="M4 7h14M9 7V4h5v3M7 7l1 13h7l1-13M10 10v7M13 10v7" /></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function FormSection({ title, description, children }) {
  return <section className="income-form-section">
    <div className="income-section-heading"><h2>{title}</h2><p>{description}</p></div>
    <div className="income-form-grid">{children}</div>
  </section>
}

function FormField({ label, name, error, hint, required = false, full = false, children }) {
  return <div className={`income-field${full ? ' income-field-full' : ''}`}>
    <label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children}
    {hint && <small className="income-field-hint">{hint}</small>}
    {error && <span className="income-field-error" role="alert">{error}</span>}
  </div>
}

function AmountReadout({ label, value, hint, emphasis = false }) {
  return <div className={`income-calculated-amount${emphasis ? ' is-emphasis' : ''}`} aria-live="polite">
    <span>{label}</span><strong>{formatCurrency(value)}</strong><small>{hint}</small>
  </div>
}

function DetailItem({ label, value, full = false }) {
  return <div className={`income-detail-item${full ? ' income-detail-item-full' : ''}`}><dt>{label}</dt><dd>{value}</dd></div>
}
