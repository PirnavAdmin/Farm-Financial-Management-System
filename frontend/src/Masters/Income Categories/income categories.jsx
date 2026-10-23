import { useEffect, useMemo, useState } from 'react'
import './income categories.css'

const storageKey = 'agriman-income-categories'
const defaults = [
  { code: 'INC-CAT-001', name: 'Crop Sales', source: 'Agricultural Sales', description: 'Income from sale of crops and produce.', status: 'Active' },
  { code: 'INC-CAT-002', name: 'Milk Sales', source: 'Animal Products', description: 'Income from milk and dairy products.', status: 'Active' },
  { code: 'INC-CAT-003', name: 'Animal Sales', source: 'Livestock', description: 'Income from sale of farm animals.', status: 'Active' },
  { code: 'INC-CAT-004', name: 'Government Subsidy', source: 'Subsidy', description: 'Government grants and agricultural subsidies.', status: 'Active' },
  { code: 'INC-CAT-005', name: 'Loan Received', source: 'Finance', description: 'Loan disbursements received by the farm.', status: 'Active' },
  { code: 'INC-CAT-006', name: 'Rental Income', source: 'Rental', description: 'Income from renting farm property or equipment.', status: 'Active' },
  { code: 'INC-CAT-007', name: 'Other Income', source: 'Other', description: 'Other farm-related income.', status: 'Active' },
]
function loadCategories() {
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(saved) ? saved : defaults } catch { return defaults }
}
function CategoryDialog({ values, editing, onClose, onSave }) {
  return <div className="ic-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="ic-dialog" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget).entries())) }}>
    <header className="ic-dialog-head"><div><span>MASTERS / INCOME CATEGORIES</span><h2>{editing ? 'Edit income category' : 'Add income category'}</h2><p>Classify a source of income for farm records.</p></div><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="ic-dialog-body"><div className="ic-form-grid">
      <label>Category Code<input name="code" defaultValue={values.code || ''} placeholder="INC-CAT-008" required /></label>
      <label>Category Name<input name="name" defaultValue={values.name || ''} placeholder="Enter category name" required /></label>
      <label>Income Source<input name="source" defaultValue={values.source || ''} placeholder="Example: Crop sales" /></label>
      <label>Status<select name="status" defaultValue={values.status || 'Active'}><option>Active</option><option>Inactive</option></select></label>
      <label className="ic-wide">Description<input name="description" defaultValue={values.description || ''} placeholder="Describe this income category" /></label>
    </div></div>
    <footer className="ic-dialog-foot"><span>Categories are used to classify income transactions.</span><div><button type="button" className="ic-cancel" onClick={onClose}>Cancel</button><button className="ic-save" type="submit">Save category</button></div></footer>
  </form></div>
}

export default function IncomeCategories() {
  const [categories, setCategories] = useState(loadCategories)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(categories)) }, [categories])
  useEffect(() => { setPage(1) }, [query, status])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])
  const filtered = useMemo(() => categories.filter((item) => `${item.code} ${item.name} ${item.source} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || item.status === status)), [categories, query, status])
  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeCount = categories.filter((item) => item.status === 'Active').length
  function saveCategory(values) {
    setCategories((current) => dialog.index === null ? [values, ...current] : current.map((item, index) => index === dialog.index ? values : item))
    setDialog(null)
    setToast(`Income category ${dialog.index === null ? 'added' : 'updated'}.`)
  }
  function deleteCategory(index) { setCategories((current) => current.filter((_, rowIndex) => rowIndex !== index)); setToast('Income category deleted.') }

  return <main className="ic-page">
    <header className="ic-page-head"><div><div className="ic-eyebrow">MASTERS <span>/</span> INCOME CATEGORIES</div><h1>Income Categories</h1><p>Organize crop, livestock, subsidy, and other farm income.</p></div><button className="ic-primary" type="button" onClick={() => setDialog({ index: null, values: {} })}><span>＋</span> Add Category</button></header>
    <section className="ic-stats"><article><span className="ic-stat-icon">▤</span><div><small>TOTAL CATEGORIES</small><strong>{categories.length}</strong><span>Available for income records</span></div></article><article><span className="ic-stat-icon ic-green">✓</span><div><small>ACTIVE CATEGORIES</small><strong>{activeCount}</strong><span>Ready to use</span></div></article><article><span className="ic-stat-icon ic-muted">◷</span><div><small>INACTIVE CATEGORIES</small><strong>{categories.length - activeCount}</strong><span>Hidden from new records</span></div></article></section>
    <section className="ic-panel"><div className="ic-toolbar"><label className="ic-search"><span>⌕</span><input aria-label="Search income categories" placeholder="Search by code, name, source or description..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label><select aria-label="Filter categories by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option><option>Active</option><option>Inactive</option></select><button className="ic-reset" type="button" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>↻ Reset Filters</button></div>
      <div className="ic-table-wrap"><table className="ic-table"><thead><tr><th>CODE</th><th>CATEGORY NAME</th><th>INCOME SOURCE</th><th>DESCRIPTION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{pageRows.map((item) => { const index = categories.indexOf(item); return <tr key={`${item.code}-${index}`}><td className="ic-code">{item.code}</td><td><strong>{item.name}</strong></td><td>{item.source}</td><td className="ic-description">{item.description}</td><td><span className={`ic-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td><div className="ic-actions"><button type="button" title="Edit" aria-label={`Edit ${item.name}`} onClick={() => setDialog({ index, values: { ...item } })}>✎</button><button type="button" title="Delete" aria-label={`Delete ${item.name}`} onClick={() => deleteCategory(index)}>♲</button></div></td></tr> })}{pageRows.length === 0 && <tr><td colSpan="6"><div className="ic-empty"><span>⌕</span><strong>No income categories found</strong><p>Add a category or adjust the search filters.</p><button type="button" onClick={() => { setQuery(''); setStatus('All statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <footer className="ic-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> categories</span><div className="ic-pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></footer>
    </section>
    <div className="ic-note">Income master data <span>•</span> Categories are saved in this browser.</div>
    {dialog && <CategoryDialog values={dialog.values} editing={dialog.index !== null} onClose={() => setDialog(null)} onSave={saveCategory} />}
    {toast && <div className="ic-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </main>
}
