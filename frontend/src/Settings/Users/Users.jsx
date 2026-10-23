import { useEffect, useState } from 'react'
import './Users.css'

const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://mushiness-rehab-fanatic.ngrok-free.dev').replace(/\/+$/, '')
const defaultRoles = ['Administrator', 'Manager', 'Accountant', 'Viewer', 'Field Staff']
const modules = ['Dashboard', 'Farmers', 'Crops', 'Income', 'Expenditure', 'Purchase', 'Sales', 'Inventory', 'Reports', 'Settings', 'Audit Log']
const initials = (name = '') => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

async function requestUsersApi(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('agriman_access_token') || sessionStorage.getItem('agriman_access_token')
  const response = await fetch(`${apiBase}/api/v1/${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.detail || result?.message || result?.title || `Request failed (${response.status}).`)
  return result
}

function mapUser(user) {
  return {
    ...user,
    id: user.id,
    code: user.userCode || String(user.id),
    name: user.name || user.fullName || '',
    mobile: user.mobileNumber || user.phoneNumber || '',
    role: user.primaryRole || user.roles?.[0] || user.role || 'User',
    status: user.status || (user.isActive ? 'Active' : 'Inactive'),
    lastLogin: user.lastLoginFormatted || (user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'),
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  }
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 })
  const [availableRoles, setAvailableRoles] = useState(defaultRoles)
  const [query, setQuery] = useState(''), [roleFilter, setRoleFilter] = useState('All roles'), [statusFilter, setStatusFilter] = useState('All statuses')
  const [selected, setSelected] = useState([]), [page, setPage] = useState(1), [totalPages, setTotalPages] = useState(1), [totalCount, setTotalCount] = useState(0)
  const [modal, setModal] = useState(null), [confirm, setConfirm] = useState(null), [toast, setToast] = useState(''), [loading, setLoading] = useState(true)
  const pageSize = 5

  async function loadUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (query.trim()) params.set('search', query.trim())
      if (roleFilter !== 'All roles') params.set('role', roleFilter)
      if (statusFilter !== 'All statuses') params.set('status', statusFilter)
      const [list, counts] = await Promise.all([
        requestUsersApi(`users?${params}`),
        requestUsersApi('users/stats'),
      ])
      setUsers((list?.items || []).map(mapUser))
      setTotalCount(list?.totalCount ?? 0)
      setTotalPages(Math.max(1, list?.totalPages || 1))
      setStats(counts || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 })
      setSelected([])
      setToast('')
    } catch (error) {
      setToast(error.message || 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [page, query, roleFilter, statusFilter])
  useEffect(() => {
    requestUsersApi('roles').then((roles) => {
      if (Array.isArray(roles) && roles.length) setAvailableRoles(roles.map((role) => role.name))
    }).catch(() => {})
  }, [])
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer) } }, [toast])

  const filtered = users
  async function saveUser(form) {
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobile.trim(),
        roles: [form.role],
        isActive: form.status === 'Active',
      }
      if (!modal.user) payload.password = form.password
      await requestUsersApi(modal.user ? `users/${modal.user.id}` : 'users', { method: modal.user ? 'PUT' : 'POST', body: payload })
      setModal(null)
      setToast(modal.user ? 'User updated successfully.' : 'User added successfully.')
      await loadUsers()
    } catch (error) { setToast(error.message || 'Unable to save user.') }
  }

  async function deleteUser() {
    try {
      await requestUsersApi(`users/${confirm.id}`, { method: 'DELETE' })
      setSelected((current) => current.filter((id) => id !== confirm.id))
      setToast(`${confirm.name} was deleted.`)
      setConfirm(null)
      await loadUsers()
    } catch (error) { setToast(error.message || 'Unable to delete user.'); setConfirm(null) }
  }

  async function toggleStatus(user) {
    const isActive = user.status !== 'Active'
    try {
      await requestUsersApi(`users/${user.id}/status`, { method: 'PATCH', body: { isActive } })
      setToast(`${user.name}'s status updated.`)
      await loadUsers()
    } catch (error) { setToast(error.message || 'Unable to update user status.') }
  }

  const allPageSelected = filtered.length > 0 && filtered.every((u) => selected.includes(u.id))
  return <div className="users-page">
    <div className="users-title-row"><div><div className="users-eyebrow">SETTINGS <span>/</span> USERS</div><h1>Users</h1><p>Manage system users and their access permissions.</p></div><button className="users-add" onClick={() => setModal({ user: null })}><span>＋</span> Add User</button></div>
    <div className="users-stats"><article><span className="stat-symbol">♙</span><div><small>TOTAL USERS</small><strong>{stats.totalUsers}</strong><span className="stat-hint">Across your organization</span></div><b className="stat-arrow">↗</b></article><article><span className="stat-symbol active-symbol">✓</span><div><small>ACTIVE USERS</small><strong>{stats.activeUsers}</strong><span className="stat-hint">Currently have access</span></div><b className="stat-arrow green-arrow">●</b></article><article><span className="stat-symbol inactive-symbol">◷</span><div><small>INACTIVE USERS</small><strong>{stats.inactiveUsers}</strong><span className="stat-hint">Access currently paused</span></div><b className="stat-arrow gray-arrow">●</b></article></div>
    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label="Search users" placeholder="Search by name, email, mobile or role..." value={query} onChange={(e) => { setPage(1); setQuery(e.target.value) }} /></div><select aria-label="Filter by role" value={roleFilter} onChange={(e) => { setPage(1); setRoleFilter(e.target.value) }}><option>All roles</option>{availableRoles.map((role) => <option key={role}>{role}</option>)}</select><select aria-label="Filter by status" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}><option>All statuses</option><option>Active</option><option>Inactive</option></select><button className="reset-button" onClick={() => { setQuery(''); setRoleFilter('All roles'); setStatusFilter('All statuses'); setSelected([]); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table"><thead><tr><th><input type="checkbox" aria-label="Select all users on this page" checked={allPageSelected} onChange={(e) => setSelected(e.target.checked ? filtered.map((u) => u.id) : [])} /></th><th>ID</th><th>NAME</th><th>EMAIL</th><th>MOBILE</th><th>ROLE</th><th>STATUS</th><th>LAST LOGIN</th><th>ACTIONS</th></tr></thead><tbody>{loading ? <tr><td colSpan="9"><div className="users-empty"><strong>Loading users…</strong></div></td></tr> : filtered.map((user) => <tr key={user.id}><td><input type="checkbox" aria-label={`Select ${user.name}`} checked={selected.includes(user.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, user.id] : selected.filter((id) => id !== user.id))} /></td><td className="user-id">{user.code}</td><td><div className="user-person"><span className="user-avatar">{user.photo ? <img src={user.photo} alt="" /> : initials(user.name)}</span><strong>{user.name}</strong></div></td><td className="user-email">{user.email}</td><td className="user-mobile">{user.mobile}</td><td><span className={`role-badge role-${user.role.toLowerCase().replace(' ', '-')}`}>{user.role}</span></td><td><button className={`status-badge ${user.status.toLowerCase()}`} onClick={() => toggleStatus(user)} title="Click to change status"><i />{user.status}</button></td><td className="login-date">{user.lastLogin}</td><td><div className="user-actions"><button aria-label={`Edit ${user.name}`} title="Edit user" onClick={() => setModal({ user })}>✎</button><button aria-label={`Delete ${user.name}`} title="Delete user" onClick={() => setConfirm(user)}>♲</button></div></td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan="9"><div className="users-empty"><span>⌕</span><strong>No users found</strong><p>Try changing your search or filters.</p><button onClick={() => { setQuery(''); setRoleFilter('All roles'); setStatusFilter('All statuses'); setPage(1) }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{totalCount ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> users</span><div className="pagination"><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>{Array.from({ length: totalPages }, (_, i) => <button className={page === i + 1 ? 'current' : ''} key={i} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button aria-label="Next page" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button></div></div>
    </section>
    <div className="users-disclaimer">Demo workspace <span>•</span> User changes are stored in this browser only and do not provide authentication or secure permission enforcement.</div>
    {modal && <UserModal key={modal.user?.id || 'new'} user={modal.user} roles={availableRoles} onClose={() => setModal(null)} onSave={saveUser} />}
    {confirm && <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirm(null)}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="delete-symbol">!</span><h2 id="delete-title">Delete user?</h2><p>Are you sure you want to delete <strong>{confirm.name}</strong>? This action cannot be undone.</p><div className="dialog-actions"><button onClick={() => setConfirm(null)}>Cancel</button><button className="delete-button" onClick={deleteUser}>Delete User</button></div></section></div>}
    {toast && <div className="user-toast" role="status"><span>✓</span>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}

function UserModal({ user, roles, onClose, onSave }) {
  const [form, setForm] = useState(() => user ? { ...user, permissions: [...user.permissions] } : { name: '', email: '', mobile: '', role: roles[0] || 'Field Staff', status: 'Active', photo: '', permissions: ['Dashboard'] })
  const [errors, setErrors] = useState({})
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  function submit(e) { e.preventDefault(); const next = {}; if (!form.name.trim()) next.name = 'Full name is required.'; if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'; if (!/^\+?[\d\s()-]{7,18}$/.test(form.mobile.trim())) next.mobile = 'Enter a valid mobile number.'; if (!user && (form.password || '').length < 8) next.password = 'Password must be at least 8 characters.'; setErrors(next); if (!Object.keys(next).length) onSave(form) }
  function upload(e) { const file = e.target.files?.[0]; if (file) { if (!file.type.startsWith('image/')) { setErrors((x) => ({ ...x, photo: 'Choose an image file.' })); return } const reader = new FileReader(); reader.onload = () => change('photo', reader.result); reader.readAsDataURL(file) } }
  return <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="user-modal" onSubmit={submit} noValidate><header className="modal-header"><div><span>USER MANAGEMENT</span><h2>{user ? 'Edit user' : 'Add new user'}</h2><p>{user ? 'Update user details and access.' : 'Create a user and configure their access.'}</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="modal-body"><div className="form-section"><h3>Personal information</h3><div className="form-grid"><label className="field-wide">Full name <em>*</em><input autoFocus value={form.name} onChange={(e) => change('name', e.target.value)} placeholder="Enter full name" />{errors.name && <small className="field-error">{errors.name}</small>}</label><label>Email address <em>*</em><input type="email" value={form.email} onChange={(e) => change('email', e.target.value)} placeholder="name@company.com" />{errors.email && <small className="field-error">{errors.email}</small>}</label><label>Mobile number <em>*</em><input value={form.mobile} onChange={(e) => change('mobile', e.target.value)} placeholder="+91 00000 00000" />{errors.mobile && <small className="field-error">{errors.mobile}</small>}</label>{!user && <label className="field-wide">Password <em>*</em><input type="password" autoComplete="new-password" value={form.password || ''} onChange={(e) => change('password', e.target.value)} placeholder="At least 8 characters" />{errors.password && <small className="field-error">{errors.password}</small>}</label>}<label>Role<select value={form.role} onChange={(e) => change('role', e.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label><label>Status<select value={form.status} onChange={(e) => change('status', e.target.value)}><option>Active</option><option>Inactive</option></select></label></div></div>
    <div className="form-section additional-section"><h3>Additional information</h3><div className="photo-upload"><span className="photo-preview">{form.photo ? <img src={form.photo} alt="Profile preview" /> : initials(form.name) || '＋'}</span><div><strong>Profile photo</strong><p>Upload a profile image (PNG, JPG).</p><label className="upload-button">Choose image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></label>{errors.photo && <small className="field-error">{errors.photo}</small>}</div></div></div>
    <div className="form-section permissions-section"><div className="permission-heading"><div><h3>Access permissions</h3><p>Choose which modules this user can access.</p></div><button type="button" onClick={() => change('permissions', form.permissions.length === modules.length ? [] : [...modules])}>{form.permissions.length === modules.length ? 'Clear all' : 'Select all'}</button></div><div className="permission-grid">{modules.map((module) => <label key={module}><input type="checkbox" checked={form.permissions.includes(module)} onChange={(e) => change('permissions', e.target.checked ? [...form.permissions, module] : form.permissions.filter((m) => m !== module))} />{module}</label>)}</div></div></div>
    <footer className="modal-footer"><span><em>*</em> Required fields</span><div><button type="button" onClick={onClose}>Cancel</button><button className="save-button" type="submit">{user ? 'Save Changes' : 'Save User'}</button></div></footer></form></div>
}
