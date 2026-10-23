import { useEffect, useMemo, useState } from 'react'
import './expense categories.css'

const storageKey = 'agriman-expense-categories'
const defaults = [
  { code: 'EXP-CAT-001', name: 'Seeds', group: 'Crop Inputs', description: 'Seeds and planting material.', status: 'Active' },
  { code: 'EXP-CAT-002', name: 'Fertilizers', group: 'Crop Inputs', description: 'Organic and chemical fertilizers.', status: 'Active' },
  { code: 'EXP-CAT-003', name: 'Pesticides', group: 'Crop Inputs', description: 'Pesticides and crop protection.', status: 'Active' },
  { code: 'EXP-CAT-004', name: 'Labour', group: 'Farm Operations', description: 'Wages and farm labour costs.', status: 'Active' },
  { code: 'EXP-CAT-005', name: 'Machinery', group: 'Farm Operations', description: 'Machinery hire and operating costs.', status: 'Active' },
  { code: 'EXP-CAT-006', name: 'Diesel', group: 'Farm Operations', description: 'Fuel for farm vehicles and equipment.', status: 'Active' },
  { code: 'EXP-CAT-007', name: 'Electricity', group: 'Utilities', description: 'Electricity used for farm operations.', status: 'Active' },
  { code: 'EXP-CAT-008', name: 'Water', group: 'Utilities', description: 'Water and irrigation charges.', status: 'Active' },
  { code: 'EXP-CAT-009', name: 'Transportation', group: 'Farm Operations', description: 'Transport of inputs and produce.', status: 'Active' },
  { code: 'EXP-CAT-010', name: 'Land Preparation', group: 'Crop Operations', description: 'Ploughing and field preparation.', status: 'Active' },
  { code: 'EXP-CAT-011', name: 'Harvesting', group: 'Crop Operations', description: 'Harvesting and post-harvest work.', status: 'Active' },
  { code: 'EXP-CAT-012', name: 'Rent', group: 'Farm Operations', description: 'Land and equipment rental costs.', status: 'Active' },
  { code: 'EXP-CAT-013', name: 'Repairs', group: 'Farm Operations', description: 'Repair costs for farm assets and equipment.', status: 'Active' },
  { code: 'EXP-CAT-014', name: 'Maintenance', group: 'Farm Operations', description: 'Routine maintenance costs for farm assets and equipment.', status: 'Active' },
  { code: 'EXP-CAT-015', name: 'Loan Interest', group: 'Finance', description: 'Interest paid on farm loans.', status: 'Active' },
  { code: 'EXP-CAT-016', name: 'Other Expenses', group: 'Other', description: 'Other farm-related expenditure.', status: 'Active' },
]
function loadCategories() {
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(saved) ? saved : defaults } catch { return defaults }
}
function CategoryModal({ values, editing, onClose, onSave }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="user-modal" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget).entries())) }}>
    <header className="modal-header"><div><span>MASTERS / EXPENSE CATEGORIES</span><h2>{editing ? 'Edit expense category' : 'Add expense category'}</h2><p>Define a category for classifying farm expenses.</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="modal-body"><div className="form-section"><div className="form-grid">
      <label>Category Code<input name="code" defaultValue={values.code || ''} placeholder="EXP-CAT-016" required /></label>
      <label>Category Name<input name="name" defaultValue={values.name || ''} placeholder="Enter category name" required /></label>
      <label>Group<select name="group" defaultValue={values.group || 'Farm Operations'}><option>Crop Inputs</option><option>Crop Operations</option><option>Farm Operations</option><option>Utilities</option><option>Finance</option><option>Other</option></select></label>
      <label>Status<select name="status" defaultValue={values.status || 'Active'}><option>Active</option><option>Inactive</option></select></label>
      <label className="field-wide">Description<input name="description" defaultValue={values.description || ''} placeholder="Describe this expense category" /></label>
    </div></div></div>
    <footer className="modal-footer"><span>Categories help organize farm expenses.</span><div><button type="button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">Save category</button></div></footer>
  </form></div>
}

export default function ExpenseCategories() {
  const [categories, setCategories] = useState(loadCategories)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(categories)) }, [categories])
  useEffect(() => { setPage(1) }, [query, status])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])
  const filtered = useMemo(() => categories.filter((item) => `${item.code} ${item.name} ${item.group} ${item.description}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || item.status === status)), [categories, query, status])
  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeCount = categories.filter((item) => item.status === 'Active').length
  function saveCategory(values) {
    setCategories((current) => modal.index === null ? [values, ...current] : current.map((item, index) => index === modal.index ? values : item))
    setModal(null)
    setToast(`Expense category ${modal.index === null ? 'added' : 'updated'}.`)
  }
  function deleteCategory(index) { setCategories((current) => current.filter((_, rowIndex) => rowIndex !== index)); setToast('Expense category deleted.') }

  return <div className="users-page expense-categories-page">
    <div className="users-title-row"><div><div className="users-eyebrow">MASTERS <span>/</span> EXPENSE CATEGORIES</div><h1>Expense Categories</h1><p>Organize farm expenses by category for accurate tracking and reports.</p></div><button className="users-add" type="button" onClick={() => setModal({ index: null, values: {} })}><span>＋</span> Add Category</button></div>
    <div className="users-stats"><article><span className="stat-symbol">▤</span><div><small>TOTAL CATEGORIES</small><strong>{categories.length}</strong><span className="stat-hint">Available for expenses</span></div><b className="stat-arrow">↗</b></article><article><span className="stat-symbol active-symbol">✓</span><div><small>ACTIVE CATEGORIES</small><strong>{activeCount}</strong><span className="stat-hint">Ready to use</span></div></article><article><span className="stat-symbol inactive-symbol">◷</span><div><small>INACTIVE CATEGORIES</small><strong>{categories.length - activeCount}</strong><span className="stat-hint">Not available for new entries</span></div></article></div>
    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label="Search expense categories" placeholder="Search by code, name, group or description..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div><select aria-label="Filter categories by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option><option>Active</option><option>Inactive</option></select><button className="reset-button" type="button" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table category-table"><thead><tr><th>CODE</th><th>CATEGORY NAME</th><th>GROUP</th><th>DESCRIPTION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{pageRows.map((item) => { const index = categories.indexOf(item); return <tr key={`${item.code}-${index}`}><td className="user-id">{item.code}</td><td><strong className="category-name">{item.name}</strong></td><td>{item.group}</td><td className="category-description">{item.description}</td><td><span className={`status-badge ${item.status === 'Active' ? 'active' : 'inactive'}`}>{item.status}</span></td><td><div className="user-actions"><button type="button" title="Edit" aria-label={`Edit ${item.name}`} onClick={() => setModal({ index, values: { ...item } })}>✎</button><button type="button" title="Delete" aria-label={`Delete ${item.name}`} onClick={() => deleteCategory(index)}>♲</button></div></td></tr> })}{pageRows.length === 0 && <tr><td colSpan="6"><div className="users-empty"><span>⌕</span><strong>No expense categories found</strong><p>Add a category or change your search.</p><button type="button" onClick={() => { setQuery(''); setStatus('All statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> categories</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>
    <div className="users-disclaimer">Expense master data <span>•</span> Categories are saved in this browser.</div>
    {modal && <CategoryModal values={modal.values} editing={modal.index !== null} onClose={() => setModal(null)} onSave={saveCategory} />}
    {toast && <div className="user-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}

