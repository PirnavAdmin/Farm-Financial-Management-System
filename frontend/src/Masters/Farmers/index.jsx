import { useState } from 'react'
import './farmers.css'

// ─── seed data ────────────────────────────────────────────────────────────────
const SEED = [
  {
    id: 1,
    code: 'FRM-001',
    name: 'Ramesh Kumar',
    fatherName: 'Suresh Kumar',
    mobile: '9876543210',
    altMobile: '9123456780',
    email: 'ramesh@example.com',
    aadhaar: '1234 5678 9012',
    address: '12, Main Street',
    village: 'Kondapur',
    mandal: 'Serilingampally',
    district: 'Rangareddy',
    state: 'Telangana',
    pin: '500084',
    bankName: 'State Bank of India',
    accountNo: '31234567890',
    ifsc: 'SBIN0001234',
    totalLand: '8.5',
    status: 'Active',
  },
  {
    id: 2,
    code: 'FRM-002',
    name: 'Lakshmi Devi',
    fatherName: 'Venkat Rao',
    mobile: '9988776655',
    altMobile: '',
    email: '',
    aadhaar: '9876 5432 1098',
    address: '5, Tank Bund Road',
    village: 'Patancheru',
    mandal: 'Patancheru',
    district: 'Sangareddy',
    state: 'Telangana',
    pin: '502319',
    bankName: 'Andhra Bank',
    accountNo: '22334455667',
    ifsc: 'ANDB0001122',
    totalLand: '12.0',
    status: 'Active',
  },
  {
    id: 3,
    code: 'FRM-003',
    name: 'Mohan Reddy',
    fatherName: 'Ranga Reddy',
    mobile: '9090909090',
    altMobile: '9191919191',
    email: 'mohan@farm.in',
    aadhaar: '5555 4444 3333',
    address: '77, Bypass Road',
    village: 'Chevella',
    mandal: 'Chevella',
    district: 'Rangareddy',
    state: 'Telangana',
    pin: '501503',
    bankName: 'ICICI Bank',
    accountNo: '001234567891',
    ifsc: 'ICIC0000012',
    totalLand: '5.25',
    status: 'Inactive',
  },
]

const EMPTY = {
  code: '', name: '', fatherName: '', mobile: '', altMobile: '',
  email: '', aadhaar: '', address: '', village: '', mandal: '',
  district: '', state: '', pin: '', bankName: '', accountNo: '',
  ifsc: '', totalLand: '', status: 'Active',
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
]

let nextId = 4

// ─── helpers ──────────────────────────────────────────────────────────────────
function nextCode(farmers) {
  const nums = farmers.map(f => parseInt(f.code.replace('FRM-', ''), 10)).filter(Boolean)
  const max = nums.length ? Math.max(...nums) : 0
  return `FRM-${String(max + 1).padStart(3, '0')}`
}

function validate(form) {
  const errs = {}
  if (!form.code.trim())   errs.code    = 'Farmer code is required'
  if (!form.name.trim())   errs.name    = 'Farmer name is required'
  if (!form.mobile.trim()) errs.mobile  = 'Mobile number is required'
  else if (!/^\d{10}$/.test(form.mobile.trim())) errs.mobile = 'Enter a valid 10-digit mobile'
  if (form.altMobile && !/^\d{10}$/.test(form.altMobile.trim())) errs.altMobile = 'Enter a valid 10-digit number'
  if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
  if (form.aadhaar && !/^\d{4}\s\d{4}\s\d{4}$/.test(form.aadhaar.trim())) errs.aadhaar = 'Format: 1234 5678 9012'
  if (form.pin && !/^\d{6}$/.test(form.pin.trim())) errs.pin = 'Enter a valid 6-digit PIN'
  return errs
}

// ─── Farmer Form Modal ────────────────────────────────────────────────────────
function FarmerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [errs, setErrs] = useState({})

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errs[field]) setErrs(e => { const n = { ...e }; delete n[field]; return n })
  }

  function formatAadhaar(val) {
    const digits = val.replace(/\D/g, '').slice(0, 12)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errors = validate(form)
    if (Object.keys(errors).length) { setErrs(errors); return }
    onSave(form)
  }

  const isEdit = Boolean(initial.id)

  return (
    <div className="fm-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Farmer' : 'Add Farmer'}>
      <div className="fm-modal">
        <div className="fm-modal-head">
          <div>
            <h2>{isEdit ? 'Edit Farmer' : 'Add Farmer'}</h2>
            <p>{isEdit ? `Updating record · ${initial.code}` : 'Fill in the details to register a new farmer'}</p>
          </div>
          <button className="fm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="fm-form" onSubmit={handleSubmit} noValidate>
          <div className="fm-form-body">

            {/* ── Section: Basic Info ── */}
            <div className="fm-section-label">Basic Information</div>
            <div className="fm-row">
              <div className="fm-field">
                <label>Farmer Code <span className="fm-req">*</span></label>
                <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. FRM-001" className={errs.code ? 'err' : ''} />
                {errs.code && <span className="fm-err">{errs.code}</span>}
              </div>
              <div className="fm-field">
                <label>Farmer Name <span className="fm-req">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" className={errs.name ? 'err' : ''} />
                {errs.name && <span className="fm-err">{errs.name}</span>}
              </div>
              <div className="fm-field">
                <label>Father / Husband Name</label>
                <input value={form.fatherName} onChange={e => set('fatherName', e.target.value)} placeholder="Father or husband name" />
              </div>
            </div>

            {/* ── Section: Contact ── */}
            <div className="fm-section-label">Contact Details</div>
            <div className="fm-row">
              <div className="fm-field">
                <label>Mobile <span className="fm-req">*</span></label>
                <input value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="10-digit mobile" maxLength={10} className={errs.mobile ? 'err' : ''} />
                {errs.mobile && <span className="fm-err">{errs.mobile}</span>}
              </div>
              <div className="fm-field">
                <label>Alternate Mobile</label>
                <input value={form.altMobile} onChange={e => set('altMobile', e.target.value)} placeholder="Alternate number" maxLength={10} className={errs.altMobile ? 'err' : ''} />
                {errs.altMobile && <span className="fm-err">{errs.altMobile}</span>}
              </div>
              <div className="fm-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" className={errs.email ? 'err' : ''} />
                {errs.email && <span className="fm-err">{errs.email}</span>}
              </div>
            </div>
            <div className="fm-row fm-row-2">
              <div className="fm-field">
                <label>Aadhaar No</label>
                <input value={form.aadhaar} onChange={e => set('aadhaar', formatAadhaar(e.target.value))} placeholder="1234 5678 9012" maxLength={14} className={errs.aadhaar ? 'err' : ''} />
                {errs.aadhaar && <span className="fm-err">{errs.aadhaar}</span>}
              </div>
              <div className="fm-field fm-field-full">
                <label>Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House / Plot / Street" />
              </div>
            </div>

            {/* ── Section: Location ── */}
            <div className="fm-section-label">Location</div>
            <div className="fm-row">
              <div className="fm-field">
                <label>Village</label>
                <input value={form.village} onChange={e => set('village', e.target.value)} placeholder="Village" />
              </div>
              <div className="fm-field">
                <label>Mandal</label>
                <input value={form.mandal} onChange={e => set('mandal', e.target.value)} placeholder="Mandal / Taluk" />
              </div>
              <div className="fm-field">
                <label>District</label>
                <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="District" />
              </div>
            </div>
            <div className="fm-row fm-row-2">
              <div className="fm-field">
                <label>State</label>
                <select value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="fm-field">
                <label>PIN Code</label>
                <input value={form.pin} onChange={e => set('pin', e.target.value)} placeholder="6-digit PIN" maxLength={6} className={errs.pin ? 'err' : ''} />
                {errs.pin && <span className="fm-err">{errs.pin}</span>}
              </div>
            </div>

            {/* ── Section: Bank ── */}
            <div className="fm-section-label">Bank Details</div>
            <div className="fm-row">
              <div className="fm-field">
                <label>Bank Name</label>
                <input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Bank name" />
              </div>
              <div className="fm-field">
                <label>Account Number</label>
                <input value={form.accountNo} onChange={e => set('accountNo', e.target.value)} placeholder="Account number" />
              </div>
              <div className="fm-field">
                <label>IFSC</label>
                <input value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())} placeholder="IFSC code" maxLength={11} />
              </div>
            </div>

            {/* ── Section: Other ── */}
            <div className="fm-section-label">Status</div>
            <div className="fm-row fm-row-2">
              <div className="fm-field">
                <label>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>

          </div>

          <div className="fm-modal-foot">
            <button type="button" className="fm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="fm-btn-primary">{isEdit ? 'Update Farmer' : 'Save Farmer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirm({ farmer, onConfirm, onCancel }) {
  return (
    <div className="fm-overlay" role="dialog" aria-modal="true">
      <div className="fm-confirm">
        <div className="fm-confirm-icon">⚠</div>
        <h3>Delete Farmer?</h3>
        <p>Are you sure you want to delete <strong>{farmer.name}</strong> ({farmer.code})? This action cannot be undone.</p>
        <div className="fm-confirm-btns">
          <button className="fm-btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="fm-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Farmers Page ────────────────────────────────────────────────────────
export default function Farmers() {
  const [farmers, setFarmers]         = useState(SEED)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal]             = useState(null)   // null | { mode:'add'|'edit', data }
  const [deleteTarget, setDeleteTarget] = useState(null) // farmer to delete
  const [toast, setToast]             = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── filtered list ──
  const filtered = farmers.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || [f.code, f.name, f.mobile, f.village, f.mandal, f.district].some(v => v.toLowerCase().includes(q))
    const matchStatus = statusFilter === 'All' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── handlers ──
  function openAdd() {
    setModal({ mode: 'add', data: { ...EMPTY, code: nextCode(farmers) } })
  }

  function openEdit(farmer) {
    setModal({ mode: 'edit', data: { ...farmer } })
  }

  function handleSave(form) {
    if (modal.mode === 'add') {
      const newFarmer = { ...form, id: nextId++ }
      setFarmers(f => [...f, newFarmer])
      showToast(`Farmer "${form.name}" added successfully`)
    } else {
      setFarmers(f => f.map(r => r.id === form.id ? form : r))
      showToast(`Farmer "${form.name}" updated successfully`)
    }
    setModal(null)
  }

  function handleDelete() {
    setFarmers(f => f.filter(r => r.id !== deleteTarget.id))
    showToast(`Farmer "${deleteTarget.name}" deleted`, 'error')
    setDeleteTarget(null)
  }

  function toggleStatus(farmer) {
    const updated = { ...farmer, status: farmer.status === 'Active' ? 'Inactive' : 'Active' }
    setFarmers(f => f.map(r => r.id === farmer.id ? updated : r))
    showToast(`Status updated to ${updated.status}`)
  }

  return (
    <div className="fm-page">

      {/* Toast */}
      {toast && (
        <div className={`fm-toast fm-toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="fm-page-head">
        <div>
          <div className="fm-eyebrow">MASTERS</div>
          <h1 className="fm-title">Farmers</h1>
          <p className="fm-subtitle">Manage all registered farmers and their details</p>
        </div>
        <button className="fm-btn-primary fm-add-btn" onClick={openAdd}>
          <span>＋</span> Add Farmer
        </button>
      </div>

      {/* Toolbar */}
      <div className="fm-toolbar">
        <div className="fm-search-wrap">
          <span className="fm-search-icon">⌕</span>
          <input
            className="fm-search"
            placeholder="Search by name, code, mobile, village…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="fm-clear-search" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="fm-filter-group">
          {['All', 'Active', 'Inactive'].map(s => (
            <button
              key={s}
              className={`fm-filter-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
              <span className="fm-filter-count">
                {s === 'All' ? farmers.length : farmers.filter(f => f.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="fm-table-wrap">
        <table className="fm-table">
          <thead>
            <tr>
              <th>Farmer Code</th>
              <th>Farmer Name</th>
              <th>Mobile</th>
              <th>Village</th>
              <th>Mandal</th>
              <th>District</th>
              <th>Total Land</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="fm-empty">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">🌾</div>
                    <p>No farmers found</p>
                    <span>Try adjusting your search or filters</span>
                  </div>
                </td>
              </tr>
            ) : filtered.map(f => (
              <tr key={f.id}>
                <td><span className="fm-code">{f.code}</span></td>
                <td>
                  <div className="fm-name-cell">
                    <div className="fm-avatar">{f.name.charAt(0)}</div>
                    <div>
                      <strong>{f.name}</strong>
                      {f.fatherName && <span>{f.fatherName}</span>}
                    </div>
                  </div>
                </td>
                <td>{f.mobile}</td>
                <td>{f.village || '—'}</td>
                <td>{f.mandal || '—'}</td>
                <td>{f.district || '—'}</td>
                <td>{f.totalLand ? `${f.totalLand} ac` : '—'}</td>
                <td>
                  <button
                    className={`fm-status-pill fm-status-${f.status.toLowerCase()}`}
                    onClick={() => toggleStatus(f)}
                    title="Click to toggle status"
                  >
                    {f.status}
                  </button>
                </td>
                <td>
                  <div className="fm-actions">
                    <button className="fm-action-btn fm-edit" onClick={() => openEdit(f)} title="Edit">✎</button>
                    <button className="fm-action-btn fm-delete" onClick={() => setDeleteTarget(f)} title="Delete">⛌</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="fm-table-footer">
        Showing <strong>{filtered.length}</strong> of <strong>{farmers.length}</strong> farmers
        &nbsp;·&nbsp; Active: <strong>{farmers.filter(f => f.status === 'Active').length}</strong>
        &nbsp;·&nbsp; Inactive: <strong>{farmers.filter(f => f.status === 'Inactive').length}</strong>
      </div>

      {/* Modals */}
      {modal && (
        <FarmerForm
          initial={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          farmer={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
