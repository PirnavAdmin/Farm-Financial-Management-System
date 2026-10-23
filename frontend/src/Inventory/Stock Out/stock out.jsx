import { useEffect, useMemo, useState } from 'react'
import './stock out.css'

const screenName = 'Stock Out'
const fields = ["Transaction No","Date","Product","Category","Quantity","Unit","Issued To","Farm / Warehouse","Purpose","Reference No","Remarks"]
const initialRows = [["SOUT-2026-0094","22 Oct 2026","Urea Fertilizer","Fertilizers","2","bag","Paddy Field Team","North Field","Paddy field application","JOB-2026-113","Issued for crop use"],["SOUT-2026-0093","21 Oct 2026","Paddy Seeds","Seeds","25","kg","Arjun Mehta","North Field","Paddy sowing","JOB-2026-109","Issued to farm"]]
const description = 'Record products issued for farm operations, crop use, or other consumption.'
const storeKey = `agriman-inventory-${screenName.toLowerCase().replace(/\s+/g, '-')}`
const recordsSeed = initialRows.map((values) => Object.fromEntries(fields.map((field, index) => [field, values[index] || ''])))

function readRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey))
    return Array.isArray(saved) ? saved : recordsSeed
  } catch {
    return recordsSeed
  }
}

function InventoryField({ field, value = '' }) {
  const options = field === 'Payment Status' ? ['Pending', 'Part Paid', 'Paid', 'Overdue']
    : field === 'Payment Mode' ? ['Cash', 'Bank', 'UPI', 'Other']
      : field === 'Unit' ? ['kg', 'quintal', 'tonne', 'litre', 'bag', 'piece', 'litre']
        : field === 'Adjustment Type' ? ['Increase', 'Decrease'] : null
  if (options) return <select name={field} defaultValue={value || options[0]}>{options.map((option) => <option key={option}>{option}</option>)}</select>
  const dateValue = /^\d{1,2} [A-Za-z]{3} \d{4}$/.test(value)
    ? (() => { const [day, month, year] = value.split(' '); const monthNumber = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month) + 1; return `${year}-${String(monthNumber).padStart(2, '0')}-${day.padStart(2, '0')}` })()
    : value
  return <input name={field} type={field.toLowerCase().includes('date') ? 'date' : 'text'} defaultValue={dateValue} placeholder={`Enter ${field.toLowerCase()}`} />
}

function InventoryModal({ values, editing, onClose, onSave }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="user-modal" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget).entries())) }}>
    <header className="modal-header"><div><span>INVENTORY / {screenName.toUpperCase()}</span><h2>{editing ? `Edit ${screenName} record` : `Add ${screenName} record`}</h2><p>Enter the inventory transaction details.</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="modal-body"><div className="form-section"><div className="form-grid">{fields.map((field) => <label className={['Description', 'Remarks', 'Reason'].includes(field) ? 'field-wide' : ''} key={field}>{field}<InventoryField field={field} value={values[field] || ''} /></label>)}</div></div></div>
    <footer className="modal-footer"><span>Fields follow the inventory requirements.</span><div><button type="button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">Save record</button></div></footer>
  </form></div>
}

export default function StockOut() {
  const [records, setRecords] = useState(readRecords)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState('All payment statuses')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem(storeKey, JSON.stringify(records)) }, [records])
  useEffect(() => { setPage(1) }, [query, paymentStatus])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])

  const filtered = useMemo(() => records.filter((record) => {
    const matchesText = Object.values(record).join(' ').toLowerCase().includes(query.toLowerCase())
    return matchesText && (paymentStatus === 'All payment statuses' || record['Payment Status'] === paymentStatus)
  }), [records, query, paymentStatus])
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function saveRecord(values) {
    setRecords((current) => modal.index === null ? [values, ...current] : current.map((record, index) => index === modal.index ? values : record))
    setModal(null)
    setToast(`${screenName} record ${modal.index === null ? 'added' : 'updated'}.`)
  }
  function deleteRecord(index) {
    setRecords((current) => current.filter((_, rowIndex) => rowIndex !== index))
    setToast(`${screenName} record deleted.`)
  }

  return <div className="users-page inventory-screen">
    <div className="users-title-row"><div><div className="users-eyebrow">INVENTORY <span>/</span> {screenName.toUpperCase()}</div><h1>{screenName}</h1><p>{description}</p></div><button className="users-add" type="button" onClick={() => setModal({ index: null, values: Object.fromEntries(fields.map((field) => [field, ''])) })}><span>＋</span> Add {screenName === 'Purchases' ? 'Purchase' : screenName === 'Stock In' ? 'Stock In' : screenName === 'Stock Out' ? 'Stock Out' : screenName === 'Stock Adjustment' ? 'Adjustment' : 'Ledger Entry'}</button></div>
    <div className="users-stats"><article><span className="stat-symbol">▤</span><div><small>TOTAL RECORDS</small><strong>{records.length}</strong><span className="stat-hint">In this workspace</span></div><b className="stat-arrow">↗</b></article><article><span className="stat-symbol active-symbol">✓</span><div><small>ROWS ON PAGE</small><strong>{pageRows.length}</strong><span className="stat-hint">Currently displayed</span></div></article><article><span className="stat-symbol inactive-symbol">⌕</span><div><small>MATCHING FILTERS</small><strong>{filtered.length}</strong><span className="stat-hint">Search results</span></div></article></div>
    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label={`Search ${screenName}`} placeholder={`Search ${screenName.toLowerCase()}...`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div>{fields.includes('Payment Status') && <select aria-label="Filter by payment status" value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value); setPage(1) }}><option>All payment statuses</option>{[...new Set(records.map((record) => record['Payment Status']).filter(Boolean))].map((value) => <option key={value}>{value}</option>)}</select>}<button className="reset-button" type="button" onClick={() => { setQuery(''); setPaymentStatus('All payment statuses'); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table"><thead><tr>{fields.map((field) => <th key={field}>{field.toUpperCase()}</th>)}<th>ACTIONS</th></tr></thead><tbody>{pageRows.map((record) => { const index = records.indexOf(record); return <tr key={`${screenName}-${index}`}>{fields.map((field, fieldIndex) => <td className={fieldIndex === 0 ? 'user-id' : ''} key={field}>{field === 'Payment Status' ? <span className={`status-badge ${record[field] === 'Paid' ? 'active' : 'inactive'}`}>{record[field]}</span> : record[field] || '—'}</td>)}<td><div className="user-actions"><button type="button" title="Edit" aria-label={`Edit ${screenName} record`} onClick={() => setModal({ index, values: { ...record } })}>✎</button><button type="button" title="Delete" aria-label={`Delete ${screenName} record`} onClick={() => deleteRecord(index)}>♲</button></div></td></tr> })}{pageRows.length === 0 && <tr><td colSpan={fields.length + 1}><div className="users-empty"><span>⌕</span><strong>No {screenName.toLowerCase()} records found</strong><p>Add a record or change your search.</p><button type="button" onClick={() => { setQuery(''); setPaymentStatus('All payment statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>
    <div className="users-disclaimer">Demo workspace <span>•</span> Inventory records are saved in this browser.</div>
    {modal && <InventoryModal values={modal.values} editing={modal.index !== null} onClose={() => setModal(null)} onSave={saveRecord} />}
    {toast && <div className="user-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}

