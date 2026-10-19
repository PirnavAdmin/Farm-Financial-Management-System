import { useState, useEffect, useCallback } from 'react'
import { farmerService } from '../../services/farmerService'
import { farmerAddressService } from '../../services/farmerAddressService'
import { farmerBankService } from '../../services/farmerBankService'
import './farmers.css'

const EMPTY = {
  code: '', name: '', fatherName: '', mobile: '', altMobile: '',
  email: '', aadhaar: '', address: '', village: '', mandal: '',
  district: '', state: '', pin: '', bankName: '', accountNo: '',
  ifsc: '', totalLand: '', status: 'Active', addressId: null, bankAccountId: null
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
]

function validate(form) {
  const errs = {}
  if (!form.code.trim())   errs.code    = 'Farmer code is required'
  if (!form.name.trim())   errs.name    = 'Farmer name is required'
  if (!form.mobile.trim()) errs.mobile  = 'Mobile number is required'
  else if (!/^\d{10}$/.test(form.mobile.trim())) errs.mobile = 'Enter a valid 10-digit mobile'
  if (form.altMobile && !/^\d{10}$/.test(form.altMobile.trim())) errs.altMobile = 'Enter a valid 10-digit number'
  if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
  if (form.aadhaar && !/^\d{4}\s\d{4}\s\d{4}$/.test(form.aadhaar.trim()) && !/^\d{12}$/.test(form.aadhaar.trim())) {
    errs.aadhaar = 'Format: 1234 5678 9012'
  }
  if (form.pin && !/^\d{6}$/.test(form.pin.trim())) errs.pin = 'Enter a valid 6-digit PIN'
  return errs
}

// ─── Farmer Form Modal ────────────────────────────────────────────────────────
function FarmerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [errs, setErrs] = useState({})
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState(null)

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (errs[field]) setErrs(e => { const n = { ...e }; delete n[field]; return n })
  }

  function formatAadhaar(val) {
    const digits = val.replace(/\D/g, '').slice(0, 12)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)
    const errors = validate(form)
    if (Object.keys(errors).length) { setErrs(errors); return }

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setApiError(err.friendlyMessage || err.message || 'Failed to save farmer.')
      if (err.validationErrors) {
        const backendErrs = {}
        for (const [key, msgs] of Object.entries(err.validationErrors)) {
          const lowerKey = key.charAt(0).toLowerCase() + key.slice(1)
          backendErrs[lowerKey] = Array.isArray(msgs) ? msgs.join(', ') : msgs
        }
        setErrs(prev => ({ ...prev, ...backendErrs }))
      }
    } finally {
      setSaving(false)
    }
  }

  const isEdit = Boolean(initial.id)

  return (
    <div className="fm-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Farmer' : 'Add Farmer'}>
      <div className="fm-modal">
        <div className="fm-modal-head">
          <div>
            <h2>{isEdit ? 'Edit Farmer Record' : 'Register New Farmer'}</h2>
            <p>{isEdit ? `Updating record · ${initial.code}` : 'Saves profile, address, and bank credentials to SQL Server'}</p>
          </div>
          <button className="fm-close" onClick={onClose} aria-label="Close" type="button">✕</button>
        </div>

        {apiError && (
          <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>
            ⚠️ {apiError}
          </div>
        )}

        <form className="fm-form" onSubmit={handleSubmit} noValidate>
          <div className="fm-form-body">

            {/* ── Section: Basic Info (/api/Farmers) ── */}
            <div className="fm-section-label">Basic Information (/api/Farmers)</div>
            <div className="fm-row">
              <div className="fm-field">
                <label>Farmer Code <span className="fm-req">*</span></label>
                <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. FRM-001" className={errs.code ? 'err' : ''} disabled={isEdit} />
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

            {/* ── Section: Contact Details ── */}
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
                <label>Address Line</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House / Plot / Street" />
              </div>
            </div>

            {/* ── Section: Location (/api/FarmerAddresses) ── */}
            <div className="fm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Address Details (/api/FarmerAddresses)</span>
              {form.addressId && <span style={{ fontSize: '11px', color: '#16a34a' }}>● Linked Address #{form.addressId}</span>}
            </div>
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

            {/* ── Section: Bank Details (/api/FarmerBankAccounts) ── */}
            <div className="fm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Bank Credentials (/api/FarmerBankAccounts)</span>
              {form.bankAccountId && <span style={{ fontSize: '11px', color: '#2563eb' }}>● Linked Bank Account #{form.bankAccountId}</span>}
            </div>
            <div className="fm-row">
              <div className="fm-field">
                <label>Bank Name</label>
                <input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="e.g. State Bank of India" />
              </div>
              <div className="fm-field">
                <label>Account Number</label>
                <input value={form.accountNo} onChange={e => set('accountNo', e.target.value)} placeholder="Account number" />
              </div>
              <div className="fm-field">
                <label>IFSC Code</label>
                <input value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} />
              </div>
            </div>

            {/* ── Section: Land & Status ── */}
            <div className="fm-section-label">Land & Status</div>
            <div className="fm-row fm-row-2">
              <div className="fm-field">
                <label>Total Land (Acres)</label>
                <input type="number" step="0.01" min="0" value={form.totalLand} onChange={e => set('totalLand', e.target.value)} placeholder="e.g. 8.5" />
              </div>
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
            <button type="button" className="fm-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="fm-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Complete Profile' : 'Save Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirm({ farmer, onConfirm, onCancel, deleting }) {
  return (
    <div className="fm-overlay" role="dialog" aria-modal="true">
      <div className="fm-confirm">
        <div className="fm-confirm-icon">⚠</div>
        <h3>Delete Farmer?</h3>
        <p>Are you sure you want to delete <strong>{farmer.name}</strong> ({farmer.code})? This will execute <code>DELETE /api/Farmers/{farmer.id}</code> in SQL Server.</p>
        <div className="fm-confirm-btns">
          <button className="fm-btn-secondary" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="fm-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Farmers Page ────────────────────────────────────────────────────────
export default function Farmers() {
  const [farmers, setFarmers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [apiError, setApiError]       = useState(null)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal]             = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [toast, setToast]             = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch Farmers from GET /api/Farmers ──
  const fetchFarmers = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const data = await farmerService.getFarmers()
      const mapped = data.map(f => ({
        id: f.id,
        code: f.farmerCode || f.code,
        name: f.farmerName || f.name,
        fatherName: f.fatherOrHusbandName || f.fatherHusbandName || f.fatherName || '',
        mobile: f.mobile || '',
        altMobile: f.alternateMobile || f.altMobile || '',
        email: f.email || '',
        aadhaar: f.aadhaarNo || f.aadhaar || '',
        totalLand: f.totalLand !== undefined && f.totalLand !== null ? String(f.totalLand) : '',
        status: f.status || 'Active',
        addressId: f.address?.id || null,
        village: f.address?.village || f.village || '',
        mandal: f.address?.mandal || f.mandal || '',
        district: f.address?.district || f.district || '',
        state: f.address?.state || f.state || '',
        pin: f.address?.pinCode || f.pin || '',
        address: f.address?.address || f.address || '',
        bankAccountId: f.bankAccount?.id || null,
        bankName: f.bankAccount?.bankName || f.bankName || '',
        accountNo: f.bankAccount?.accountNumber || f.accountNo || '',
        ifsc: f.bankAccount?.ifsc || f.ifsc || '',
      }))
      setFarmers(mapped)
    } catch (err) {
      setApiError(err.friendlyMessage || 'Failed to connect to ASP.NET Core API.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFarmers()
  }, [fetchFarmers])

  // ── filtered list ──
  const filtered = farmers.filter(f => {
    const q = search.toLowerCase().trim()
    const matchSearch = !q || [f.code, f.name, f.fatherName, f.mobile, f.village, f.mandal, f.district, f.bankName].some(v => (v || '').toLowerCase().includes(q))
    const matchStatus = statusFilter === 'All' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── handlers ──
  function openAdd() {
    setModal({
      mode: 'add',
      data: { ...EMPTY, code: farmerService.generateFarmerCode(farmers) }
    })
  }

  async function openEdit(farmer) {
    try {
      const fresh = await farmerService.getFarmerById(farmer.id)
      setModal({
        mode: 'edit',
        data: {
          ...farmer,
          code: fresh.farmerCode || farmer.code,
          name: fresh.farmerName || farmer.name,
          fatherName: fresh.fatherOrHusbandName || farmer.fatherName,
          mobile: fresh.mobile || farmer.mobile,
          altMobile: fresh.alternateMobile || farmer.altMobile,
          email: fresh.email || farmer.email,
          aadhaar: fresh.aadhaarNo || farmer.aadhaar,
          totalLand: fresh.totalLand !== undefined ? String(fresh.totalLand) : farmer.totalLand,
          status: fresh.status || farmer.status,
          addressId: fresh.address?.id || farmer.addressId || null,
          village: fresh.address?.village || farmer.village || '',
          mandal: fresh.address?.mandal || farmer.mandal || '',
          district: fresh.address?.district || farmer.district || '',
          state: fresh.address?.state || farmer.state || '',
          pin: fresh.address?.pinCode || farmer.pin || '',
          address: fresh.address?.address || farmer.address || '',
          bankAccountId: fresh.bankAccount?.id || farmer.bankAccountId || null,
          bankName: fresh.bankAccount?.bankName || farmer.bankName || '',
          accountNo: fresh.bankAccount?.accountNumber || farmer.accountNo || '',
          ifsc: fresh.bankAccount?.ifsc || farmer.ifsc || '',
        }
      })
    } catch {
      setModal({ mode: 'edit', data: { ...farmer } })
    }
  }

  /**
   * FULL 3-TIER CRUD SAVE:
   * 1. POST /api/Farmers or PUT /api/Farmers/{id}
   * 2. POST /api/FarmerAddresses or PUT /api/FarmerAddresses/{id}
   * 3. POST /api/FarmerBankAccounts or PUT /api/FarmerBankAccounts/{id}
   */
  async function handleSave(form) {
    if (modal.mode === 'add') {
      // 1. Create Farmer
      const createdFarmer = await farmerService.createFarmer(form)
      const farmerId = createdFarmer?.id || createdFarmer?.data?.id

      if (farmerId) {
        // 2. Create FarmerAddress
        if (form.village || form.mandal || form.district || form.state || form.pin) {
          try {
            await farmerAddressService.createAddress({
              farmerId,
              address: form.address,
              village: form.village,
              mandal: form.mandal,
              district: form.district,
              state: form.state,
              pinCode: form.pin
            })
          } catch (addrErr) {
            console.warn('FarmerAddress creation note:', addrErr)
          }
        }

        // 3. Create FarmerBankAccount
        if (form.bankName && form.accountNo && form.ifsc) {
          try {
            await farmerBankService.createBankAccount({
              farmerId,
              bankName: form.bankName,
              accountNumber: form.accountNo,
              ifsc: form.ifsc
            })
          } catch (bankErr) {
            console.warn('FarmerBankAccount creation note:', bankErr)
          }
        }
      }

      showToast(`Farmer "${form.name}" registered with address & bank details`)
    } else {
      // 1. Update Farmer
      await farmerService.updateFarmer(form.id, form)

      // 2. Update/Create Address
      const hasAddressInfo = form.village || form.mandal || form.district || form.state || form.pin
      if (form.addressId) {
        try {
          await farmerAddressService.updateAddress(form.addressId, {
            farmerId: form.id,
            address: form.address,
            village: form.village,
            mandal: form.mandal,
            district: form.district,
            state: form.state,
            pinCode: form.pin
          })
        } catch (addrErr) {
          console.warn('FarmerAddress update note:', addrErr)
        }
      } else if (hasAddressInfo) {
        try {
          await farmerAddressService.createAddress({
            farmerId: form.id,
            address: form.address,
            village: form.village,
            mandal: form.mandal,
            district: form.district,
            state: form.state,
            pinCode: form.pin
          })
        } catch (addrErr) {
          console.warn('FarmerAddress create note:', addrErr)
        }
      }

      // 3. Update/Create Bank Account
      const hasBankInfo = form.bankName && form.accountNo && form.ifsc
      if (form.bankAccountId) {
        try {
          await farmerBankService.updateBankAccount(form.bankAccountId, {
            farmerId: form.id,
            bankName: form.bankName,
            accountNumber: form.accountNo,
            ifsc: form.ifsc
          })
        } catch (bankErr) {
          console.warn('FarmerBankAccount update note:', bankErr)
        }
      } else if (hasBankInfo) {
        try {
          await farmerBankService.createBankAccount({
            farmerId: form.id,
            bankName: form.bankName,
            accountNumber: form.accountNo,
            ifsc: form.ifsc
          })
        } catch (bankErr) {
          console.warn('FarmerBankAccount create note:', bankErr)
        }
      }

      showToast(`Farmer "${form.name}" updated successfully`)
    }
    await fetchFarmers()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.bankAccountId) {
        try { await farmerBankService.deleteBankAccount(deleteTarget.bankAccountId) } catch (_) {}
      }
      if (deleteTarget.addressId) {
        try { await farmerAddressService.deleteAddress(deleteTarget.addressId) } catch (_) {}
      }
      await farmerService.deleteFarmer(deleteTarget.id)
      showToast(`Farmer "${deleteTarget.name}" deleted`, 'error')
      setDeleteTarget(null)
      await fetchFarmers()
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to delete farmer', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleStatus(farmer) {
    const newStatus = farmer.status === 'Active' ? 'Inactive' : 'Active'
    try {
      await farmerService.updateFarmer(farmer.id, { ...farmer, status: newStatus })
      showToast(`Status updated to ${newStatus}`)
      await fetchFarmers()
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to toggle status', 'error')
    }
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
        <button className="fm-btn-primary fm-add-btn" onClick={openAdd} type="button">
          <span>＋</span> Add Farmer
        </button>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>⚠️ {apiError}</span>
          <button onClick={fetchFarmers} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="fm-toolbar">
        <div className="fm-search-wrap">
          <span className="fm-search-icon">⌕</span>
          <input
            className="fm-search"
            placeholder="Search by name, code, mobile, village, bank…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="fm-clear-search" onClick={() => setSearch('')} type="button">✕</button>}
        </div>
        <div className="fm-filter-group">
          {['All', 'Active', 'Inactive'].map(s => (
            <button
              key={s}
              type="button"
              className={`fm-filter-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
              <span className="fm-filter-count">
                {s === 'All' ? farmers.length : farmers.filter(f => f.status === s).length}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={fetchFarmers}
            title="Refresh from SQL Server"
            style={{ padding: '6px 10px', border: '1px solid #e5e7eb', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          >
            🔄
          </button>
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
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>
                  ⏳ Loading farmers from SQL Server...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
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
                    type="button"
                  >
                    {f.status}
                  </button>
                </td>
                <td>
                  <div className="fm-actions">
                    <button className="fm-action-btn fm-edit" onClick={() => openEdit(f)} title="Edit" type="button">✎</button>
                    <button className="fm-action-btn fm-delete" onClick={() => setDeleteTarget(f)} title="Delete" type="button">⛌</button>
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
          deleting={deleting}
        />
      )}
    </div>
  )
}
