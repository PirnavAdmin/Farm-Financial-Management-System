import { useEffect, useMemo, useState } from 'react'
import './expenses.css'

const moduleName = 'Expenses'
const fields = ["Expense Date","Expense No","Farmer","Farm","Crop","Expense Category","Supplier","Description","Amount","Payment Mode","Reference No","Remarks"]
const initialRows = [["22 Oct 2026","EXP-2026-0098","Arjun Mehta","North Field","Paddy","Fertilizers","GreenGrow Supplies","Urea and potash","₹18,500","Bank","UTR-09133","Season input cost"],["18 Oct 2026","EXP-2026-0097","Priya Sharma","Lake Farm","Cotton","Labour","Village Labour Group","Weeding labour","₹8,400","Cash","","Field work"]]
const loanPaymentFields = []
const loanPaymentRows = []
const description = 'Track seed, fertilizer, pesticide, labour, machinery, and other farm expenses.'
const storeKey = `agriman-finance-${moduleName.toLowerCase().replace(/\s+/g, '-')}`
const recordsSeed = initialRows.map((values) => Object.fromEntries(fields.map((field, index) => [field, values[index] || ''])))
const loanPaymentSeed = loanPaymentRows.map((values) => Object.fromEntries(loanPaymentFields.map((field, index) => [field, values[index] || ''])))

function readRecords(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return Array.isArray(saved) ? saved : fallback
  } catch {
    return fallback
  }
}

function FinanceField({ field, value = '' }) {
  const lower = field.toLowerCase()
  const options = field === 'Payment Mode' || field === 'Bank/Cash'
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
  const dateValue = /^\d{1,2} [A-Za-z]{3} \d{4}$/.test(value)
    ? (() => { const [day, month, year] = value.split(' '); const monthNumber = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month) + 1; return `${year}-${String(monthNumber).padStart(2, '0')}-${day.padStart(2, '0')}` })()
    : value
  return <input name={field} type={lower.includes('date') ? 'date' : 'text'} defaultValue={dateValue} placeholder={`Enter ${field.toLowerCase()}`} />
}

function RecordModal({ currentFields, values, editing, onClose, onSave }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="user-modal" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget).entries())) }}>
    <header className="modal-header"><div><span>FINANCE / {moduleName.toUpperCase()}</span><h2>{editing ? `Edit ${moduleName} record` : `Add ${moduleName} record`}</h2><p>Enter the transaction details below.</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="modal-body"><div className="form-section"><div className="form-grid">{currentFields.map((field) => <label className={['Description', 'Remarks'].includes(field) ? 'field-wide' : ''} key={field}>{field}<FinanceField field={field} value={values[field] || ''} /></label>)}</div></div></div>
    <footer className="modal-footer"><span>Fields follow the Finance requirements.</span><div><button type="button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">Save record</button></div></footer>
  </form></div>
}

export default function Expenses() {
  const supportsLoanPayments = moduleName === 'Loans'
  const [view, setView] = useState('records')
  const [recordsByView, setRecordsByView] = useState(() => ({
    records: readRecords(`${storeKey}-records`, recordsSeed),
    payments: supportsLoanPayments ? readRecords(`${storeKey}-payments`, loanPaymentSeed) : [],
  }))
  const currentFields = supportsLoanPayments && view === 'payments' ? loanPaymentFields : fields
  const records = recordsByView[view]
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(`${storeKey}-records`, JSON.stringify(recordsByView.records))
    if (supportsLoanPayments) localStorage.setItem(`${storeKey}-payments`, JSON.stringify(recordsByView.payments))
  }, [recordsByView, supportsLoanPayments])
  useEffect(() => { setPage(1) }, [query, status, view])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])

  const filtered = useMemo(() => records.filter((record) => {
    const matchText = Object.values(record).join(' ').toLowerCase().includes(query.toLowerCase())
    const recordStatus = record.Status
    return matchText && (status === 'All statuses' || recordStatus === status)
  }), [records, query, status])
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function saveRecord(values) {
    setRecordsByView((current) => ({ ...current, [view]: modal.index === null ? [values, ...current[view]] : current[view].map((record, index) => index === modal.index ? values : record) }))
    setModal(null)
    setToast(`${moduleName} record ${modal.index === null ? 'added' : 'updated'}.`)
  }
  function deleteRecord(index) {
    setRecordsByView((current) => ({ ...current, [view]: current[view].filter((_, rowIndex) => rowIndex !== index) }))
    setToast(`${moduleName} record deleted.`)
  }

  return <div className="users-page finance-screen">
    <div className="users-title-row"><div><div className="users-eyebrow">FINANCE <span>/</span> {moduleName.toUpperCase()}</div><h1>{moduleName}</h1><p>{description}</p></div><button className="users-add" type="button" onClick={() => setModal({ index: null, values: Object.fromEntries(currentFields.map((field) => [field, ''])) })}><span>＋</span> Add {supportsLoanPayments && view === 'payments' ? 'Loan Payment' : moduleName === 'Bank Accounts' ? 'Bank Account' : moduleName === 'Income' ? 'Income' : moduleName.slice(0, -1)}</button></div>

    {supportsLoanPayments && <div className="finance-view-switch"><button className={view === 'records' ? 'selected' : ''} type="button" onClick={() => setView('records')}>Loans</button><button className={view === 'payments' ? 'selected' : ''} type="button" onClick={() => setView('payments')}>Loan Payments</button></div>}

    <div className="users-stats"><article><span className="stat-symbol">₹</span><div><small>TOTAL RECORDS</small><strong>{records.length}</strong><span className="stat-hint">In this workspace</span></div><b className="stat-arrow">↗</b></article><article><span className="stat-symbol active-symbol">✓</span><div><small>ROWS ON PAGE</small><strong>{pageRows.length}</strong><span className="stat-hint">Currently displayed</span></div></article><article><span className="stat-symbol inactive-symbol">◷</span><div><small>MATCHING FILTERS</small><strong>{filtered.length}</strong><span className="stat-hint">Search results</span></div></article></div>

    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label={`Search ${moduleName}`} placeholder={`Search ${moduleName.toLowerCase()}...`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div>{currentFields.includes('Status') && <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option>{[...new Set(records.map((record) => record.Status).filter(Boolean))].map((value) => <option key={value}>{value}</option>)}</select>}<button className="reset-button" type="button" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table"><thead><tr>{currentFields.map((field) => <th key={field}>{field.toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{pageRows.map((record) => { const index = records.indexOf(record); return <tr key={`${moduleName}-${view}-${index}`}>{currentFields.map((field, fieldIndex) => <td className={fieldIndex === 0 ? 'user-id' : ''} key={field}>{field === 'Status' ? <span className={`status-badge ${['Active', 'Paid', 'Received', 'Closed'].includes(record[field]) ? 'active' : 'inactive'}`}>{record[field]}</span> : record[field] || '—'}</td>)}<td><div className="user-actions"><button type="button" title="Edit" aria-label={`Edit ${moduleName} record`} onClick={() => setModal({ index, values: { ...record } })}>✎</button><button type="button" title="Delete" aria-label={`Delete ${moduleName} record`} onClick={() => deleteRecord(index)}>♲</button></div></td></tr> })}{pageRows.length === 0 && <tr><td colSpan={currentFields.length + 1}><div className="users-empty"><span>⌕</span><strong>No {moduleName.toLowerCase()} records found</strong><p>Add a record or change your search.</p><button type="button" onClick={() => { setQuery(''); setStatus('All statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>

    <div className="users-disclaimer">Demo workspace <span>•</span> Finance records are saved in this browser.</div>
    {modal && <RecordModal currentFields={currentFields} values={modal.values} editing={modal.index !== null} onClose={() => setModal(null)} onSave={saveRecord} />}
    {toast && <div className="user-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}




