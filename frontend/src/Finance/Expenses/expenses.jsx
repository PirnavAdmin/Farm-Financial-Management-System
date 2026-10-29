import { useEffect, useMemo, useRef, useState } from 'react'
import api, { BUSINESS_API_BASE_URL } from '../../services/api'
import './expenses.css'

const moduleName = 'Expenses'
const fields = ["Expense Date","Expense No","Farmer","Farm","Crop","Expense Category","Supplier","Description","Amount","Payment Mode","Reference No","Remarks"]
const loanPaymentFields = []
const loanPaymentRows = []
const description = 'Track seed, fertilizer, pesticide, labour, machinery, and other farm expenses.'
const loanPaymentSeed = loanPaymentRows.map((values) => Object.fromEntries(loanPaymentFields.map((field, index) => [field, values[index] || ''])))

const unwrap = (response) => response?.data?.data ?? response?.data ?? response
const rowsFrom = (value) => Array.isArray(value) ? value : value?.items || value?.records || value?.expenses || value?.results || value?.data || []
const pick = (value, ...keys) => keys.map((key) => value?.[key]).find((item) => item !== undefined && item !== null)
const formatDate = (value) => {
  if (!value) return ''
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}
const dateForApi = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  if (parsed.getFullYear() !== Number(year) || parsed.getMonth() !== Number(month) - 1 || parsed.getDate() !== Number(day)) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`
}
const formatAmount = (value) => { const amount = Number(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(amount) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount) : String(value ?? '') }
function mapExpense(item) {
  const value = (key, ...aliases) => pick(item, key, ...aliases)
  const category = value('expenseCategory', 'expenseCategoryName', 'categoryName', 'category')
  const name = (input, ...keys) => typeof input === 'object' ? pick(input, ...keys) || '' : input || ''
  return { ...item, _id: value('id', 'expenseId'), 'Expense Date': formatDate(value('expenseDate', 'date')), 'Expense No': value('expenseNo', 'voucherNo', 'number') || '', Farmer: name(value('farmerName', 'farmer'), 'name', 'fullName'), Farm: name(value('farmName', 'farm'), 'name', 'farmName'), Crop: name(value('cropName', 'crop'), 'name', 'cropName'), 'Expense Category': name(category, 'name', 'categoryName', 'expenseCategoryName'), Supplier: name(value('supplierName', 'supplier'), 'name', 'supplierName'), Description: value('description', 'particulars') || '', Amount: formatAmount(value('amount', 'totalAmount')), 'Payment Mode': value('paymentMode', 'paymentMethod') || '', 'Reference No': value('referenceNo', 'referenceNumber') || '', Remarks: value('remarks', 'notes') || '' }
}
function expensePayload(values) {
  const amount = Number(String(values.Amount ?? '').replace(/[^\d.-]/g, ''))
  const farmer = values.Farmer?.trim(), farm = values.Farm?.trim(), crop = values.Crop?.trim(), category = values['Expense Category'], supplier = values.Supplier?.trim()
  return { expenseDate: dateForApi(values['Expense Date']), expenseNo: values['Expense No']?.trim(), farmer, farmerName: farmer, farm, farmName: farm, crop, cropName: crop, expenseCategory: category, category, categoryName: category, supplier, supplierName: supplier, description: values.Description?.trim(), amount: Number.isFinite(amount) ? amount : 0, paymentMode: values['Payment Mode'], referenceNo: values['Reference No']?.trim(), remarks: values.Remarks?.trim() }
}
async function expenseRequest(url, method = 'GET', data) { const response = await api.request({ baseURL: BUSINESS_API_BASE_URL, url, method, data }); const result = unwrap(response); if (result?.success === false) throw new Error(result.message || 'The expense request failed.'); return result }

function FinanceField({ field, value = '', categories = [] }) {
  const lower = field.toLowerCase()
  const dateTextRef = useRef(null)
  const datePickerRef = useRef(null)
  const options = field === 'Expense Category'
    ? categories
    : field === 'Payment Mode' || field === 'Bank/Cash'
    ? ['Cash', 'Bank', 'UPI', 'Other']
    : field === 'Unit'
      ? ['kg', 'quintal', 'tonne', 'litre', 'bag', 'piece']
      : field === 'Status'
        ? ['Pending', 'Part Paid', 'Paid', 'Received', 'Active', 'Closed']
        : field === 'Loan Type'
          ? ['Crop Loan', 'Equipment Loan', 'Term Loan', 'Other']
          : field === 'Account Type'
            ? ['Current', 'Savings', 'Cash']
            : null
  if (options) return <select name={field} defaultValue={value || options[0]}>{options.map((option) => <option key={option}>{option}</option>)}</select>
  if (lower.includes('date')) return <div className="date-field-control">
    <input ref={dateTextRef} name={field} type="text" inputMode="numeric" pattern="\\d{2}/\\d{2}/\\d{4}" defaultValue={value} placeholder="dd/mm/yyyy" />
    <button type="button" className="date-picker-button" aria-label="Choose date" onClick={() => { const picker = datePickerRef.current; if (!picker) return; picker.value = dateForApi(dateTextRef.current?.value)?.slice(0, 10) || ''; if (picker.showPicker) picker.showPicker(); else picker.click() }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v3M17 2v3M4 9h16M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Z" /></svg>
    </button>
    <input ref={datePickerRef} className="date-picker-native" type="date" tabIndex={-1} aria-hidden="true" defaultValue={dateForApi(value)?.slice(0, 10) || ''} onChange={(event) => { if (dateTextRef.current) dateTextRef.current.value = formatDate(event.target.value) }} />
  </div>
  const inputValue = field === 'Amount' ? String(value).replace(/[^\d.-]/g, '') : value
  return <input name={field} type={field === 'Amount' ? 'number' : 'text'} min={field === 'Amount' ? '0' : undefined} step={field === 'Amount' ? '0.01' : undefined} defaultValue={inputValue} placeholder={`Enter ${field.toLowerCase()}`} />
}

function RecordModal({ currentFields, values, editing, categories = [], onClose, onSave }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="user-modal" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget).entries())) }}>
    <header className="modal-header"><div><span>FINANCE / {moduleName.toUpperCase()}</span><h2>{editing ? `Edit ${moduleName} record` : `Add ${moduleName} record`}</h2><p>Enter the transaction details below.</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="modal-body"><div className="form-section"><div className="form-grid">{currentFields.map((field) => <label className={['Description', 'Remarks'].includes(field) ? 'field-wide' : ''} key={field}>{field}<FinanceField field={field} value={values[field] || ''} categories={categories} /></label>)}</div></div></div>
    <footer className="modal-footer"><span>Fields follow the Finance requirements.</span><div><button type="button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">Save record</button></div></footer>
  </form></div>
}

export default function Expenses() {
  const supportsLoanPayments = moduleName === 'Loans'
  const [view, setView] = useState('records')
  const [recordsByView, setRecordsByView] = useState({ records: [], payments: supportsLoanPayments ? loanPaymentSeed : [] })
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const currentFields = supportsLoanPayments && view === 'payments' ? loanPaymentFields : fields
  const records = recordsByView[view]
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  async function loadExpenses() {
    setLoading(true); setLoadError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '5' })
      if (query.trim()) params.set('search', query.trim())
      const [list, metrics] = await Promise.all([expenseRequest(`/api/expenses?${params}`), expenseRequest('/api/expenses/summary').catch(() => null)])
      const rows = rowsFrom(list)
      setRecordsByView((current) => ({ ...current, records: rows.map(mapExpense) }))
      const count = Number(pick(list, 'totalCount', 'totalRecords', 'total') ?? rows.length) || 0
      setTotalCount(count)
      setTotalPages(Math.max(1, Number(pick(list, 'totalPages', 'pageCount')) || Math.ceil(count / 5) || 1))
      setSummary(metrics || pick(list, 'summary', 'statistics', 'metrics') || null)
    } catch (error) {
      setRecordsByView((current) => ({ ...current, records: [] })); setTotalCount(0)
      setLoadError(error.friendlyMessage || error.message || 'Unable to load expenses from the API.')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadExpenses() }, [page, query])
  useEffect(() => {
    expenseRequest('/api/expense-categories').then((result) => {
      const list = rowsFrom(result).filter((item) => item?.status?.toLowerCase() !== 'inactive').map((item) => typeof item === 'string' ? item : item.name || item.categoryName).filter(Boolean)
      setCategories(list)
    }).catch(() => {})
  }, [])
  useEffect(() => { setPage(1) }, [query, status, view])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])

  const filtered = useMemo(() => records.filter((record) => {
    const matchText = Object.values(record).join(' ').toLowerCase().includes(query.toLowerCase())
    const recordStatus = record.Status
    return matchText && (status === 'All statuses' || recordStatus === status)
  }), [records, query, status])
  const pageSize = 5
  const pageCount = Math.max(totalPages, 1)
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.length <= pageSize ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  async function saveRecord(values) {
    const editing = modal.index !== null, existing = editing ? records[modal.index] : null
    try {
      if (editing && !existing?._id) throw new Error('This expense record has no API ID and cannot be updated.')
      if (!editing && !values['Expense No']) {
        const next = await expenseRequest('/api/expenses/next-number')
        values['Expense No'] = pick(next, 'expenseNo', 'nextNumber', 'number') || ''
      }
      await expenseRequest(editing ? `/api/expenses/${existing._id}` : '/api/expenses', editing ? 'PUT' : 'POST', expensePayload(values))
      setModal(null); setToast(`Expense record ${editing ? 'updated' : 'added'}.`); await loadExpenses()
    } catch (error) { setToast(error.friendlyMessage || error.message || 'Unable to save the expense record.') }
  }
  async function editRecord(index) {
    const record = records[index]
    try { const result = await expenseRequest(`/api/expenses/${record._id}`); const detail = mapExpense(result.expense || result.item || result); setModal({ index, values: detail }) }
    catch (error) { setToast(error.friendlyMessage || error.message || 'Unable to load expense details.') }
  }
  async function deleteRecord(index) {
    const record = records[index]
    try { await expenseRequest(`/api/expenses/${record._id}`, 'DELETE'); setToast('Expense record deleted.'); await loadExpenses() }
    catch (error) { setToast(error.friendlyMessage || error.message || 'Unable to delete the expense record.') }
  }
  async function addRecord() {
    const values = Object.fromEntries(currentFields.map((field) => [field, '']))
    try { const next = await expenseRequest('/api/expenses/next-number'); values['Expense No'] = pick(next, 'expenseNo', 'nextNumber', 'number') || '' } catch { /* Save can still ask the API to generate the number. */ }
    setModal({ index: null, values })
  }

  return <div className="users-page finance-screen">
    <div className="users-title-row"><div><div className="users-eyebrow">FINANCE <span>/</span> {moduleName.toUpperCase()}</div><h1>{moduleName}</h1><p>{description}</p></div><button className="users-add" type="button" onClick={addRecord}><span>＋</span> Add {supportsLoanPayments && view === 'payments' ? 'Loan Payment' : moduleName === 'Bank Accounts' ? 'Bank Account' : moduleName === 'Income' ? 'Income' : moduleName.slice(0, -1)}</button></div>

    {supportsLoanPayments && <div className="finance-view-switch"><button className={view === 'records' ? 'selected' : ''} type="button" onClick={() => setView('records')}>Loans</button><button className={view === 'payments' ? 'selected' : ''} type="button" onClick={() => setView('payments')}>Loan Payments</button></div>}

    {loadError && <div className="auth-message auth-error" role="alert">{loadError}</div>}
    <div className="users-stats"><article><span className="stat-symbol">₹</span><div><small>TOTAL RECORDS</small><strong>{pick(summary, 'totalRecords', 'totalCount', 'totalExpenses') ?? totalCount}</strong><span className="stat-hint">In this workspace</span></div><b className="stat-arrow">↗</b></article><article><span className="stat-symbol active-symbol">✓</span><div><small>ROWS ON PAGE</small><strong>{pageRows.length}</strong><span className="stat-hint">Currently displayed</span></div></article><article><span className="stat-symbol inactive-symbol">◷</span><div><small>MATCHING FILTERS</small><strong>{pick(summary, 'matchingFilters', 'matchingCount', 'filteredCount') ?? totalCount}</strong><span className="stat-hint">Search results</span></div></article></div>

    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label={`Search ${moduleName}`} placeholder={`Search ${moduleName.toLowerCase()}...`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div>{currentFields.includes('Status') && <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option>{[...new Set(records.map((record) => record.Status).filter(Boolean))].map((value) => <option key={value}>{value}</option>)}</select>}<button className="reset-button" type="button" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table"><thead><tr>{currentFields.map((field) => <th key={field}>{field.toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{loading ? <tr><td colSpan={currentFields.length + 1}><div className="users-empty"><strong>Loading expenses…</strong></div></td></tr> : pageRows.map((record) => { const index = records.indexOf(record); return <tr key={record._id ?? `${moduleName}-${view}-${index}`}>{currentFields.map((field, fieldIndex) => <td className={fieldIndex === 0 ? 'user-id' : ''} key={field}>{field === 'Status' ? <span className={`status-badge ${['Active', 'Paid', 'Received', 'Closed'].includes(record[field]) ? 'active' : 'inactive'}`}>{record[field]}</span> : record[field] || '—'}</td>)}<td><div className="user-actions"><button type="button" title="Edit" aria-label={`Edit ${moduleName} record`} onClick={() => editRecord(index)}>✎</button><button type="button" title="Delete" aria-label={`Delete ${moduleName} record`} onClick={() => deleteRecord(index)}>♲</button></div></td></tr> })}{!loading && pageRows.length === 0 && <tr><td colSpan={currentFields.length + 1}><div className="users-empty"><span>⌕</span><strong>No {moduleName.toLowerCase()} records found</strong><p>{loadError || 'Add a record or change your search.'}</p><button type="button" onClick={() => { setQuery(''); setStatus('All statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{totalCount ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> records</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>

    <div className="users-disclaimer">Expense records <span>•</span> Managed by the AGRIMAN API.</div>
    {modal && <RecordModal currentFields={currentFields} values={modal.values} editing={modal.index !== null} categories={categories} onClose={() => setModal(null)} onSave={saveRecord} />}
    {toast && <div className="user-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}




