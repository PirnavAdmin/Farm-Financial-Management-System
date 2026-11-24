import TableActionMenu from '../../TableActionMenu';
import { useEffect, useMemo, useState } from 'react'
import './income categories.css'
import {
  listIncomeCategories,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory
} from '../../Finance/Income/incomeService.js'

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
    <footer className="ic-dialog-foot"><span>Manage category classification for income records.</span><div><button type="button" className="ic-cancel" onClick={onClose}>Cancel</button><button className="ic-save" type="submit">Save category</button></div></footer>
  </form></div>
}

export default function IncomeCategories() {
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = () => {
    setLoading(true)
    listIncomeCategories().then((rows) => { setCategories(rows) })
      .catch((err) => { setError(err.friendlyMessage || err.message) })
      .finally(() => { setLoading(false) })
  }

  useEffect(() => {
    loadData()
  }, [])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])
  const filtered = useMemo(() => categories.filter((item) => `${item.code || '—'} ${item.name} ${item.source || '—'} ${item.description || '—'}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || item.status === status)), [categories, query, status])
  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeCount = categories.filter((item) => item.status === 'Active').length

  async function saveCategory(values) {
    try {
      if (dialog && dialog.index !== null) {
        await updateIncomeCategory(dialog.values.id, values)
        setToast('Category updated successfully.')
      } else {
        await createIncomeCategory(values)
        setToast('Category created successfully.')
      }
      setDialog(null)
      loadData()
    } catch (err) {
      setToast(`Error saving category: ${err.message}`)
    }
  }

  async function deleteCategory(index) {
    const cat = categories[index]
    if (!cat?.id) return
    try {
      await deleteIncomeCategory(cat.id)
      setToast('Category deleted.')
      loadData()
    } catch (err) {
      setToast(`Error deleting category: ${err.message}`)
    }
  }

  return <main className="ic-page">
    <header className="ic-page-head"><div><div className="ic-eyebrow">MASTERS <span>/</span> INCOME CATEGORIES</div><h1>Income Categories</h1><p>Organize crop, livestock, subsidy, and other farm income.</p></div><button className="ic-primary" type="button" onClick={() => setDialog({ index: null, values: {} })}><span>＋</span> Add Category</button></header>
    <section className="ic-stats"><article><span className="ic-stat-icon">▤</span><div><small>TOTAL CATEGORIES</small><strong>{categories.length}</strong><span>Available for income records</span></div></article><article><span className="ic-stat-icon ic-green">✓</span><div><small>ACTIVE CATEGORIES</small><strong>{categories.some((item) => item.status) ? activeCount : '—'}</strong><span>Ready to use</span></div></article><article><span className="ic-stat-icon ic-muted">◷</span><div><small>INACTIVE CATEGORIES</small><strong>{categories.some((item) => item.status) ? categories.filter((item) => item.status === 'Inactive').length : '—'}</strong><span>Hidden from new records</span></div></article></section>
    <section className="ic-panel"><div className="ic-toolbar"><label className="ic-search"><span>⌕</span><input aria-label="Search income categories" placeholder="Search by code, name, source or description..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label><select aria-label="Filter categories by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option><option>Active</option><option>Inactive</option></select><button className="ic-reset" type="button" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>↻ Reset Filters</button></div>
      <div className="ic-table-wrap"><table className="ic-table"><thead><tr><th>CODE</th><th>CATEGORY NAME</th><th>INCOME SOURCE</th><th>DESCRIPTION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{pageRows.map((item) => { const index = categories.indexOf(item); return <tr key={`${item.code || '—'}-${index}`}><td className="ic-code">{item.code || '—'}</td><td><strong>{item.name}</strong></td><td>{item.source || '—'}</td><td className="ic-description">{item.description || '—'}</td><td><span className={`ic-status ${item.status?.toLowerCase()}`}>{item.status || '—'}</span></td><td><div className="ic-actions"><TableActionMenu items={[{ label: 'Edit Category', icon: 'edit', onClick: () => setDialog({ index, values: { ...item } }) }, { label: 'Delete Category', icon: 'delete', danger: true, onClick: () => deleteCategory(index) }]} /></div></td></tr> })}{pageRows.length === 0 && <tr><td colSpan="6"><div className="ic-empty"><span>⌕</span><strong>{loading ? 'Loading categories...' : error ? 'Unable to load categories' : 'No income categories found'}</strong><p>{error || 'Adjust the search filters.'}</p><button type="button" onClick={() => { setQuery(''); setStatus('All statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <footer className="ic-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> categories</span><div className="ic-pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></footer>
    </section>
    <div className="ic-note" role="status">{error || (loading ? 'Loading income categories...' : 'Income categories synchronized with backend API.')}</div>
    {dialog && <CategoryDialog values={dialog.values} editing={dialog.index !== null} onClose={() => setDialog(null)} onSave={saveCategory} />}
    {toast && <div className="ic-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </main>
}
