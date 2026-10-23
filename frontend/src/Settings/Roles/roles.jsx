import { useEffect, useMemo, useState } from 'react'
import './roles.css'

const storageKey = 'agriman-settings-roles'
const defaults = [
  { name: 'Administrator', description: 'Full access to system settings and records.', users: '1', permissions: 'All modules', status: 'Active' },
  { name: 'Farm Manager', description: 'Manage farm operations and financial records.', users: '3', permissions: 'Dashboard, Masters, Agriculture, Finance, Inventory, Sales, Reports', status: 'Active' },
  { name: 'Accountant', description: 'Manage transactions and financial reports.', users: '2', permissions: 'Dashboard, Finance, Sales, Reports', status: 'Active' },
  { name: 'Field Supervisor', description: 'Manage assigned farms and crop activities.', users: '3', permissions: 'Dashboard, Agriculture, Inventory', status: 'Active' },
]
function loadRoles() {
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(saved) ? saved : defaults } catch { return defaults }
}

function RoleModal({ values, editing, onClose, onSave }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="user-modal" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget).entries())) }}>
    <header className="modal-header"><div><span>SETTINGS / ROLES</span><h2>{editing ? 'Edit role' : 'Add role'}</h2><p>Set the role details and module permissions.</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="modal-body"><div className="form-section"><div className="form-grid">
      <label>Role Name<input name="name" defaultValue={values.name || ''} required /></label>
      <label>Status<select name="status" defaultValue={values.status || 'Active'}><option>Active</option><option>Inactive</option></select></label>
      <label className="field-wide">Description<input name="description" defaultValue={values.description || ''} /></label>
      <label className="field-wide">Permissions<input name="permissions" defaultValue={values.permissions || ''} placeholder="Example: Dashboard, Finance, Reports" /></label>
      <label>User Count<input name="users" type="number" min="0" defaultValue={values.users || '0'} /></label>
    </div></div></div>
    <footer className="modal-footer"><span>Role permissions can be updated at any time.</span><div><button type="button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">Save role</button></div></footer>
  </form></div>
}

export default function Roles() {
  const [roles, setRoles] = useState(loadRoles)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(roles)) }, [roles])
  useEffect(() => { setPage(1) }, [query, status])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])
  const filtered = useMemo(() => roles.filter((role) => `${role.name} ${role.description} ${role.permissions}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || role.status === status)), [roles, query, status])
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeCount = roles.filter((role) => role.status === 'Active').length
  function saveRole(values) {
    setRoles((current) => modal.index === null ? [values, ...current] : current.map((role, index) => index === modal.index ? values : role))
    setModal(null)
    setToast(`Role ${modal.index === null ? 'added' : 'updated'}.`)
  }
  function deleteRole(index) { setRoles((current) => current.filter((_, rowIndex) => rowIndex !== index)); setToast('Role deleted.') }

  return <div className="users-page roles-page">
    <div className="users-title-row"><div><div className="users-eyebrow">SETTINGS <span>/</span> ROLES</div><h1>Roles</h1><p>Manage role definitions and access permissions.</p></div><button className="users-add" type="button" onClick={() => setModal({ index: null, values: {} })}><span>＋</span> Add Role</button></div>
    <div className="users-stats"><article><span className="stat-symbol">♙</span><div><small>TOTAL ROLES</small><strong>{roles.length}</strong><span className="stat-hint">Across this organization</span></div></article><article><span className="stat-symbol active-symbol">✓</span><div><small>ACTIVE ROLES</small><strong>{activeCount}</strong><span className="stat-hint">Available for assignment</span></div></article><article><span className="stat-symbol inactive-symbol">♧</span><div><small>INACTIVE ROLES</small><strong>{roles.length - activeCount}</strong><span className="stat-hint">Currently unavailable</span></div></article></div>
    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label="Search roles" placeholder="Search role, description or permission..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div><select aria-label="Filter roles by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option><option>Active</option><option>Inactive</option></select><button className="reset-button" type="button" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table roles-table"><thead><tr><th>ROLE</th><th>DESCRIPTION</th><th>USERS</th><th>PERMISSIONS</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{pageRows.map((role) => { const index = roles.indexOf(role); return <tr key={`${role.name}-${index}`}><td><strong className="role-name">{role.name}</strong></td><td>{role.description}</td><td>{role.users || '0'}</td><td><span className="permission-summary">{role.permissions || 'No permissions set'}</span></td><td><span className={`status-badge ${role.status === 'Active' ? 'active' : 'inactive'}`}>{role.status}</span></td><td><div className="user-actions"><button type="button" title="Edit" aria-label={`Edit ${role.name}`} onClick={() => setModal({ index, values: { ...role } })}>✎</button><button type="button" title="Delete" aria-label={`Delete ${role.name}`} onClick={() => deleteRole(index)}>♲</button></div></td></tr> })}{pageRows.length === 0 && <tr><td colSpan="6"><div className="users-empty"><span>⌕</span><strong>No roles found</strong><p>Add a role or change your search.</p><button type="button" onClick={() => { setQuery(''); setStatus('All statuses') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> roles</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>
    <div className="users-disclaimer">Role management <span>•</span> Data is saved in this browser.</div>
    {modal && <RoleModal values={modal.values} editing={modal.index !== null} onClose={() => setModal(null)} onSave={saveRole} />}
    {toast && <div className="user-toast" role="status"><span>✓</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}
