import { useState, useEffect, useCallback } from 'react'
import { farmerService } from '../../services/farmerService'
import { farmerAddressService } from '../../services/farmerAddressService'
import { farmerBankService } from '../../services/farmerBankService'
import './farmers.css'

// ─── Constants ────────────────────────────────────────────────────────────────
// NOTE: no `address` text field — the FarmerAddresses table schema has:
//   FarmerId, Village, Mandal, District, State, PinCode (confirmed from SQL logs)
//   FarmerId is also the PK (one-to-one with Farmers), so no separate addressId.
const EMPTY = {
  code: '', name: '', fatherName: '', mobile: '', altMobile: '',
  email: '', aadhaar: '', village: '', mandal: '',
  district: '', state: '', pin: '', bankName: '', accountNo: '',
  ifsc: '', totalLand: '', status: 'Active',
  // hasAddress / hasBank track whether the farmer already has these records
  hasAddress: false,
  hasBank: false,
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
]

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(form) {
  const errs = {}
  if (!form.code.trim())   errs.code   = 'Farmer code is required'
  if (!form.name.trim())   errs.name   = 'Farmer name is required'
  if (!form.mobile.trim()) errs.mobile = 'Mobile number is required'
  else if (!/^\d{10}$/.test(form.mobile.trim())) errs.mobile = 'Enter a valid 10-digit mobile'
  if (form.altMobile && !/^\d{10}$/.test(form.altMobile.trim())) errs.altMobile = 'Enter a valid 10-digit number'
  if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
  if (form.aadhaar && !/^\d{4}\s\d{4}\s\d{4}$/.test(form.aadhaar.trim()) && !/^\d{12}$/.test(form.aadhaar.trim())) {
    errs.aadhaar = 'Format: 1234 5678 9012'
  }
  if (form.pin && !/^\d{6}$/.test(form.pin.trim())) errs.pin = 'Enter a valid 6-digit PIN'
  return errs
}

// ─── Response mappers ─────────────────────────────────────────────────────────
/**
 * Extract a farmer ID from various response shapes the backend may return:
 *   { id: 1, ... }  /  { data: { id: 1 } }  /  { farmerId: 1, ... }
 */
function extractFarmerId(res) {
  if (!res) return null
  return res.id ?? res.Id ?? res.farmerId ?? res.FarmerId
    ?? res.data?.id ?? res.data?.Id ?? null
}

/**
 * Map a raw farmer API object (from GET /api/Farmers or GET /api/Farmers/{id})
 * into a normalised shape for the UI.
 *
 * Backend confirmed schema (from SQL log):
 *   Farmers:          Id, FarmerCode, FarmerName, FatherOrHusbandName, Mobile,
 *                     AlternateMobile, Email, AadhaarNo, TotalLand, Status
 *   FarmerAddresses:  FarmerId(PK), Village, Mandal, District, State, PinCode
 *   FarmerBankAccounts: FarmerId(PK), BankName, AccountNumber, IFSC
 *                     (one-to-one so FarmerId is the key for PUT operations)
 */
function mapFarmer(f) {
  // Address: may be nested as f.address / f.Address or flat on f
  const addr = f.address || f.Address || f.farmerAddress || f.FarmerAddress || {}

  // Bank: may be a single object OR an array (take first element if array)
  let bank = f.bankAccount || f.BankAccount || {}
  const bankArr = f.bankAccounts || f.BankAccounts
  if (Array.isArray(bankArr) && bankArr.length > 0) bank = bankArr[0]

  const farmerId = f.id ?? f.Id ?? f.farmerId ?? f.FarmerId

  const hasAddress = !!(addr.village || addr.Village || addr.mandal || addr.Mandal ||
    addr.district || addr.District || addr.state || addr.State ||
    addr.pinCode || addr.PinCode)

  const hasBank = !!(bank.bankName || bank.BankName || bank.accountNumber || bank.AccountNumber)

  return {
    id:         farmerId,
    code:       f.farmerCode  || f.FarmerCode  || f.code  || f.Code  || '',
    name:       f.farmerName  || f.FarmerName  || f.name  || f.Name  || '',
    fatherName: f.fatherOrHusbandName || f.FatherOrHusbandName || f.fatherHusbandName || f.fatherName || '',
    mobile:     f.mobile      || f.Mobile      || '',
    altMobile:  f.alternateMobile || f.AlternateMobile || f.altMobile || '',
    email:      f.email       || f.Email       || '',
    aadhaar:    f.aadhaarNo   || f.AadhaarNo   || f.aadhaar || '',
    totalLand:  f.totalLand   != null ? String(f.totalLand)
              : f.TotalLand   != null ? String(f.TotalLand) : '',
    status:     f.status      || f.Status      || 'Unknown',
    // Address (FarmerId is PK — no separate addressId)
    hasAddress,
    village:    addr.village  || addr.Village  || f.village  || f.Village  || '',
    mandal:     addr.mandal   || addr.Mandal   || f.mandal   || f.Mandal   || '',
    district:   addr.district || addr.District || f.district || f.District || '',
    state:      addr.state    || addr.State    || f.state    || f.State    || '',
    pin:        addr.pinCode  || addr.PinCode  || f.pin      || f.Pin      || '',
    // Bank (FarmerId is PK — no separate bankAccountId)
    hasBank,
    bankName:   bank.bankName      || bank.BankName      || f.bankName || f.BankName || '',
    accountNo:  bank.accountNumber || bank.AccountNumber || f.accountNo || f.AccountNo || '',
    ifsc:       bank.ifsc          || bank.IFSC          || f.ifsc     || f.IFSC     || '',
  }
}

// ─── Error helpers ────────────────────────────────────────────────────────────
function getFarmerApiError(error, operation = 'request') {
  const status = error.statusCode || error.response?.status

  if (status === 404 && operation === 'list') {
    return {
      headline: 'Farmers endpoint not found (404)',
      detail: 'GET /api/Farmers returned 404. The ASP.NET Core backend or the ngrok tunnel may not be running. ' +
              'Update VITE_API_BASE_URL in frontend/.env to the current ngrok URL, restart Vite, and retry.',
    }
  }
  if (status === 404)  return { headline: 'Not found (404)',      detail: 'The farmer record or API route was not found.' }
  if (status === 400)  return { headline: 'Bad request (400)',    detail: error.friendlyMessage || 'The request payload was rejected by the backend. Check required fields.' }
  if (status === 401)  return { headline: 'Unauthorised (401)',   detail: 'Sign in again and retry.' }
  if (status === 403)  return { headline: 'Access denied (403)',  detail: 'You do not have permission to access Farmers.' }
  if (status === 409)  return { headline: 'Conflict (409)',       detail: 'A record with this data already exists.' }
  if (status === 500)  return { headline: 'Server error (500)',   detail: 'The ASP.NET Core backend encountered an error. Check the backend console.' }
  if (status === 0 || (!error.response && error.request))
    return { headline: 'Cannot reach backend', detail: 'Verify the backend is running and the ngrok URL in .env is current, then retry.' }

  const msg = error.friendlyMessage || error.message || 'The Farmers request failed.'
  return { headline: 'Request failed', detail: msg }
}

function errorText(error, operation = 'request') {
  if (typeof error === 'string') return error
  const e = getFarmerApiError(error, operation)
  return `${e.headline}: ${e.detail}`
}

// ─── Address & Bank helpers ───────────────────────────────────────────────────
/**
 * Save address for a farmer.
 * FarmerAddresses uses FarmerId as PK (one-to-one confirmed from SQL log).
 *
 * Strategy:
 *  – If the farmer already has an address (hasAddress=true) → PUT /api/FarmerAddresses/{farmerId}
 *  – Otherwise → POST /api/FarmerAddresses
 *  – If POST returns 400/409 (row already exists) → fall back to PUT
 */
async function saveAddress(farmerId, form, hasAddress) {
  const payload = {
    farmerId,
    village:  form.village  || '',
    mandal:   form.mandal   || '',
    district: form.district || '',
    state:    form.state    || '',
    pinCode:  form.pin      || '',
  }
  if (hasAddress) {
    await farmerAddressService.updateAddress(farmerId, payload)
  } else {
    try {
      await farmerAddressService.createAddress(payload)
    } catch (postErr) {
      const s = postErr.statusCode || postErr.response?.status
      if (s === 400 || s === 409) {
        // Row already exists with this farmerId — update instead
        await farmerAddressService.updateAddress(farmerId, payload)
      } else {
        throw postErr
      }
    }
  }
}

/**
 * Save bank account for a farmer.
 * Same one-to-one PK strategy as address.
 */
async function saveBank(farmerId, form, hasBank) {
  const payload = {
    farmerId,
    bankName:      form.bankName  || '',
    accountNumber: form.accountNo || '',
    ifsc:          form.ifsc      || '',
  }
  if (hasBank) {
    await farmerBankService.updateBankAccount(farmerId, payload)
  } else {
    try {
      await farmerBankService.createBankAccount(payload)
    } catch (postErr) {
      const s = postErr.statusCode || postErr.response?.status
      if (s === 400 || s === 409) {
        await farmerBankService.updateBankAccount(farmerId, payload)
      } else {
        throw postErr
      }
    }
  }
}

// ─── Farmer Form Modal ────────────────────────────────────────────────────────
function FarmerForm({ initial, onSave, onClose }) {
  const [form, setForm]         = useState(initial)
  const [errs, setErrs]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [apiError, setApiError] = useState(null)
  const [activeTab, setActiveTab] = useState('personal')

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
    if (Object.keys(errors).length) {
      setErrs(errors)
      if (errors.code || errors.name || errors.mobile || errors.altMobile || errors.email || errors.aadhaar) {
        setActiveTab('personal')
      } else if (errors.pin) {
        setActiveTab('address')
      }
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      const parsed = getFarmerApiError(err, 'save')
      setApiError(`${parsed.headline}: ${parsed.detail}`)
      if (err.validationErrors) {
        const backendErrs = {}
        for (const [key, msgs] of Object.entries(err.validationErrors)) {
          const lk = key.charAt(0).toLowerCase() + key.slice(1)
          backendErrs[lk] = Array.isArray(msgs) ? msgs.join(', ') : msgs
        }
        setErrs(prev => ({ ...prev, ...backendErrs }))
      }
    } finally {
      setSaving(false)
    }
  }

  const isEdit = Boolean(initial.id)
  const tabs = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'address',  label: '📍 Address' },
    { id: 'bank',     label: '🏦 Bank' },
  ]

  return (
    <div className="fm-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Farmer' : 'Add Farmer'}>
      <div className="fm-modal">
        {/* Header */}
        <div className="fm-modal-head">
          <div>
            <h2>{isEdit ? 'Edit Farmer Record' : 'Register New Farmer'}</h2>
            <p>{isEdit ? `Editing · ${initial.code}` : 'Add farmer profile, address, and bank details'}</p>
          </div>
          <button className="fm-close" onClick={onClose} aria-label="Close" type="button">✕</button>
        </div>

        {/* API Error */}
        {apiError && <div className="fm-form-error-banner">⚠️ {apiError}</div>}

        {/* Tabs */}
        <div className="fm-tabs">
          {tabs.map(t => (
            <button
              key={t.id} type="button"
              className={`fm-tab${activeTab === t.id ? ' fm-tab-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        <form className="fm-form" onSubmit={handleSubmit} noValidate>
          <div className="fm-form-body">

            {/* ── Personal Tab ── */}
            {activeTab === 'personal' && (<>
              <div className="fm-section-label">
                Basic Information <span className="fm-endpoint-hint">· POST /api/Farmers</span>
              </div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Farmer Code <span className="fm-req">*</span></label>
                  <input value={form.code} onChange={e => set('code', e.target.value)}
                    placeholder="e.g. FRM-001" className={errs.code ? 'err' : ''} disabled={isEdit} />
                  {errs.code && <span className="fm-err">{errs.code}</span>}
                </div>
                <div className="fm-field">
                  <label>Farmer Name <span className="fm-req">*</span></label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Full name" className={errs.name ? 'err' : ''} />
                  {errs.name && <span className="fm-err">{errs.name}</span>}
                </div>
                <div className="fm-field">
                  <label>Father / Husband Name</label>
                  <input value={form.fatherName} onChange={e => set('fatherName', e.target.value)}
                    placeholder="Father or husband name" />
                </div>
              </div>

              <div className="fm-section-label">Contact Details</div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Mobile <span className="fm-req">*</span></label>
                  <input value={form.mobile} onChange={e => set('mobile', e.target.value)}
                    placeholder="10-digit mobile" maxLength={10} className={errs.mobile ? 'err' : ''} />
                  {errs.mobile && <span className="fm-err">{errs.mobile}</span>}
                </div>
                <div className="fm-field">
                  <label>Alternate Mobile</label>
                  <input value={form.altMobile} onChange={e => set('altMobile', e.target.value)}
                    placeholder="Alternate number" maxLength={10} className={errs.altMobile ? 'err' : ''} />
                  {errs.altMobile && <span className="fm-err">{errs.altMobile}</span>}
                </div>
                <div className="fm-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="email@example.com" className={errs.email ? 'err' : ''} />
                  {errs.email && <span className="fm-err">{errs.email}</span>}
                </div>
              </div>

              <div className="fm-row fm-row-2">
                <div className="fm-field">
                  <label>Aadhaar No</label>
                  <input value={form.aadhaar} onChange={e => set('aadhaar', formatAadhaar(e.target.value))}
                    placeholder="1234 5678 9012" maxLength={14} autoComplete="off"
                    className={errs.aadhaar ? 'err' : ''} />
                  {errs.aadhaar && <span className="fm-err">{errs.aadhaar}</span>}
                </div>
                <div className="fm-field">
                  <label>Total Land (Acres)</label>
                  <input type="number" step="0.01" min="0" value={form.totalLand}
                    onChange={e => set('totalLand', e.target.value)} placeholder="e.g. 8.5" />
                </div>
              </div>

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
            </>)}

            {/* ── Address Tab ── */}
            {/* Fields match FarmerAddresses schema: Village, Mandal, District, State, PinCode */}
            {activeTab === 'address' && (<>
              <div className="fm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Address Details <span className="fm-endpoint-hint">· POST /api/FarmerAddresses</span></span>
                {form.hasAddress && <span className="fm-linked-badge">● Existing Address</span>}
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
                  <input value={form.pin} onChange={e => set('pin', e.target.value)}
                    placeholder="6-digit PIN" maxLength={6} className={errs.pin ? 'err' : ''} />
                  {errs.pin && <span className="fm-err">{errs.pin}</span>}
                </div>
              </div>
            </>)}

            {/* ── Bank Tab ── */}
            {/* Fields match FarmerBankAccounts schema: BankName, AccountNumber, IFSC */}
            {activeTab === 'bank' && (<>
              <div className="fm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Bank Credentials <span className="fm-endpoint-hint">· POST /api/FarmerBankAccounts</span></span>
                {form.hasBank && <span className="fm-linked-badge fm-linked-blue">● Existing Bank Record</span>}
              </div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Bank Name</label>
                  <input value={form.bankName} onChange={e => set('bankName', e.target.value)}
                    placeholder="e.g. State Bank of India" />
                </div>
                <div className="fm-field">
                  <label>Account Number</label>
                  <input value={form.accountNo} onChange={e => set('accountNo', e.target.value)}
                    placeholder="Account number" autoComplete="off" />
                </div>
                <div className="fm-field">
                  <label>IFSC Code</label>
                  <input value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234" maxLength={11} />
                </div>
              </div>
              <div className="fm-bank-notice">
                🔒 Bank details are transmitted securely and never logged.
              </div>
            </>)}
          </div>

          {/* Footer */}
          <div className="fm-modal-foot">
            <div className="fm-tab-nav-btns">
              {activeTab !== 'personal' && (
                <button type="button" className="fm-btn-secondary"
                  onClick={() => setActiveTab(activeTab === 'bank' ? 'address' : 'personal')}>
                  ← Back
                </button>
              )}
              {activeTab !== 'bank' && (
                <button type="button" className="fm-btn-secondary"
                  onClick={() => setActiveTab(activeTab === 'personal' ? 'address' : 'bank')}>
                  Next →
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="fm-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="fm-btn-primary" disabled={saving}>
                {saving
                  ? <><span className="fm-spinner"></span> Saving…</>
                  : isEdit ? '✓ Update Farmer' : '+ Save Farmer'}
              </button>
            </div>
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
        <p>
          You are about to permanently delete <strong>{farmer.name}</strong> ({farmer.code}).
          Linked address and bank records will also be removed.
        </p>
        <div className="fm-confirm-btns">
          <button className="fm-btn-secondary" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="fm-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? <><span className="fm-spinner fm-spinner-white"></span> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── View Farmer Drawer ───────────────────────────────────────────────────────
function ViewFarmer({ farmer, onClose, onEdit }) {
  function row(label, value) {
    return (
      <div className="fm-view-row">
        <span className="fm-view-label">{label}</span>
        <span className="fm-view-value">{value || <em className="fm-na">—</em>}</span>
      </div>
    )
  }
  return (
    <div className="fm-overlay" role="dialog" aria-modal="true" aria-label="Farmer Details">
      <div className="fm-modal fm-modal-view">
        <div className="fm-modal-head">
          <div className="fm-view-header-info">
            <div className="fm-avatar fm-avatar-lg">{farmer.name.charAt(0)}</div>
            <div>
              <h2>{farmer.name}</h2>
              <p>
                <span className="fm-code">{farmer.code}</span>&nbsp;&nbsp;
                <span className={`fm-status-pill fm-status-${farmer.status.toLowerCase()}`}>
                  <span className="fm-status-dot"></span>{farmer.status}
                </span>
              </p>
            </div>
          </div>
          <button className="fm-close" onClick={onClose} aria-label="Close" type="button">✕</button>
        </div>
        <div className="fm-form-body">
          <div className="fm-section-label">Personal Information</div>
          <div className="fm-view-grid">
            {row('Father / Husband', farmer.fatherName)}
            {row('Mobile', farmer.mobile)}
            {row('Alternate Mobile', farmer.altMobile)}
            {row('Email', farmer.email)}
            {row('Aadhaar No', farmer.aadhaar ? '••••  ••••  ' + farmer.aadhaar.replace(/\s/g,'').slice(-4) : null)}
            {row('Total Land', farmer.totalLand ? `${farmer.totalLand} acres` : null)}
          </div>
          <div className="fm-section-label">Address Information</div>
          <div className="fm-view-grid">
            {row('Village', farmer.village)}
            {row('Mandal', farmer.mandal)}
            {row('District', farmer.district)}
            {row('State', farmer.state)}
            {row('PIN Code', farmer.pin)}
          </div>
          <div className="fm-section-label">Bank Information</div>
          <div className="fm-view-grid">
            {row('Bank Name', farmer.bankName)}
            {row('Account No', farmer.accountNo ? '••••' + farmer.accountNo.slice(-4) : null)}
            {row('IFSC Code', farmer.ifsc)}
          </div>
        </div>
        <div className="fm-modal-foot">
          <div></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="fm-btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="fm-btn-primary" onClick={() => { onClose(); onEdit(farmer) }}>
              ✎ Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Farmers Page ────────────────────────────────────────────────────────
export default function Farmers() {
  const [farmers, setFarmers]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [hasLoaded, setHasLoaded]         = useState(false)
  const [apiError, setApiError]           = useState(null)   // { headline, detail }
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('All')
  const [modal, setModal]                 = useState(null)   // { mode: 'add'|'edit', data }
  const [viewTarget, setViewTarget]       = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleting, setDeleting]           = useState(false)
  const [toast, setToast]                 = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch list via GET /api/Farmers ──────────────────────────────────────
  const fetchFarmers = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const data = await farmerService.getFarmers()
      setFarmers(data.map(mapFarmer))
    } catch (err) {
      setApiError(getFarmerApiError(err, 'list'))
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }, [])

  useEffect(() => { fetchFarmers() }, [fetchFarmers])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = farmers.filter(f => {
    const q = search.toLowerCase().trim()
    const matchSearch = !q || [f.code, f.name, f.fatherName, f.mobile, f.village, f.mandal, f.district, f.bankName]
      .some(v => (v || '').toLowerCase().includes(q))
    const matchStatus = statusFilter === 'All' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    All:      farmers.length,
    Active:   farmers.filter(f => f.status === 'Active').length,
    Inactive: farmers.filter(f => f.status === 'Inactive').length,
  }

  // ── Open Add form ──────────────────────────────────────────────────────────
  function openAdd() {
    setModal({ mode: 'add', data: { ...EMPTY, code: farmerService.generateFarmerCode(farmers) } })
  }

  // ── Open Edit form — re-fetch fresh data for the single farmer ─────────────
  async function openEdit(farmer) {
    try {
      const fresh = await farmerService.getFarmerById(farmer.id)
      setModal({ mode: 'edit', data: mapFarmer(fresh) })
    } catch (err) {
      showToast(errorText(err, 'view'), 'error')
    }
  }

  /**
   * SAVE handler — 3-tier CRUD:
   *
   * ADD:
   *   1. POST /api/Farmers            → get farmerId
   *   2. POST /api/FarmerAddresses    (with farmerId)
   *   3. POST /api/FarmerBankAccounts (with farmerId)
   *
   * EDIT:
   *   1. PUT  /api/Farmers/{id}
   *   2. PUT  /api/FarmerAddresses/{farmerId}   ← farmerId is PK (one-to-one)
   *      (falls back to POST if address doesn't exist yet)
   *   3. PUT  /api/FarmerBankAccounts/{farmerId} ← same pattern
   *      (falls back to POST if bank record doesn't exist yet)
   */
  async function handleSave(form) {
    if (modal.mode === 'add') {
      // 1. Create Farmer
      const res = await farmerService.createFarmer(form)
      const farmerId = extractFarmerId(res)

      if (farmerId) {
        // 2. Create Address
        const hasAddressInfo = form.village || form.mandal || form.district || form.state || form.pin
        if (hasAddressInfo) {
          try { await saveAddress(farmerId, form, false) }
          catch (e) { console.warn('[FarmerAddress] create note:', e) }
        }
        // 3. Create Bank Account
        const hasBankInfo = form.bankName && form.accountNo && form.ifsc
        if (hasBankInfo) {
          try { await saveBank(farmerId, form, false) }
          catch (e) { console.warn('[FarmerBankAccount] create note:', e) }
        }
      }
      showToast(`Farmer "${form.name}" registered successfully`)

    } else {
      // 1. Update Farmer
      await farmerService.updateFarmer(form.id, form)

      // 2. Update / create Address using farmerId as the key
      const hasAddressInfo = form.village || form.mandal || form.district || form.state || form.pin
      if (hasAddressInfo) {
        try { await saveAddress(form.id, form, form.hasAddress) }
        catch (e) { console.warn('[FarmerAddress] update note:', e) }
      }

      // 3. Update / create Bank using farmerId as the key
      const hasBankInfo = form.bankName && form.accountNo && form.ifsc
      if (hasBankInfo) {
        try { await saveBank(form.id, form, form.hasBank) }
        catch (e) { console.warn('[FarmerBankAccount] update note:', e) }
      }

      showToast(`Farmer "${form.name}" updated successfully`)
    }
    await fetchFarmers()
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      // Delete bank and address by farmerId (PK), then the farmer
      if (deleteTarget.hasBank) {
        try { await farmerBankService.deleteBankAccount(deleteTarget.id) } catch (_) {}
      }
      if (deleteTarget.hasAddress) {
        try { await farmerAddressService.deleteAddress(deleteTarget.id) } catch (_) {}
      }
      await farmerService.deleteFarmer(deleteTarget.id)
      showToast(`Farmer "${deleteTarget.name}" deleted`, 'error')
      setDeleteTarget(null)
      await fetchFarmers()
    } catch (err) {
      showToast(errorText(err, 'delete'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Toggle Status ──────────────────────────────────────────────────────────
  async function toggleStatus(farmer) {
    const newStatus = farmer.status === 'Active' ? 'Inactive' : 'Active'
    try {
      await farmerService.updateFarmer(farmer.id, { ...farmer, status: newStatus })
      showToast(`${farmer.name} set to ${newStatus}`)
      await fetchFarmers()
    } catch (err) {
      showToast(errorText(err, 'update'), 'error')
    }
  }

  const showError = apiError && farmers.length === 0
  const showEmpty = hasLoaded && !loading && !showError && filtered.length === 0

  return (
    <div className="fm-page">

      {/* Toast */}
      {toast && (
        <div className={`fm-toast fm-toast-${toast.type}`} role="status">
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="fm-page-head">
        <div>
          <div className="fm-eyebrow">MASTERS</div>
          <h1 className="fm-title">Farmers</h1>
          <p className="fm-subtitle">Manage all registered farmers and their details</p>
        </div>
        <button className="fm-btn-primary fm-add-btn" onClick={openAdd} type="button">
          + Add Farmer
        </button>
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="fm-error-banner" role="alert">
          <div className="fm-error-banner-content">
            <div className="fm-error-icon">⚠️</div>
            <div>
              <div className="fm-error-headline">{apiError.headline}</div>
              <div className="fm-error-detail">{apiError.detail}</div>
            </div>
          </div>
          <button onClick={fetchFarmers} disabled={loading} className="fm-retry-btn" type="button">
            {loading ? <><span className="fm-spinner fm-spinner-white"></span> Retrying…</> : 'Retry'}
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
            aria-label="Search farmers"
          />
          {search && (
            <button className="fm-clear-search" onClick={() => setSearch('')} type="button" aria-label="Clear search">✕</button>
          )}
        </div>
        <div className="fm-filter-group">
          {['All', 'Active', 'Inactive'].map(s => (
            <button
              key={s} type="button"
              className={`fm-filter-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
              <span className="fm-filter-count">
                {loading && !hasLoaded ? '…' : showError ? '—' : counts[s]}
              </span>
            </button>
          ))}
          <button
            type="button" onClick={fetchFarmers}
            title="Refresh farmer list" aria-label="Refresh farmers"
            disabled={loading}
            className={`fm-refresh-btn${loading ? ' fm-spinning' : ''}`}
          >↻</button>
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
            {loading && !hasLoaded ? (
              <tr>
                <td colSpan={9} className="fm-state-cell">
                  <div className="fm-loading-state">
                    <div className="fm-loading-spinner"></div>
                    <p>Loading farmers…</p>
                  </div>
                </td>
              </tr>
            ) : showError ? (
              <tr>
                <td colSpan={9} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">⚠</div>
                    <p>Farmers could not be loaded</p>
                    <span>Check the error above and click Retry.</span>
                  </div>
                </td>
              </tr>
            ) : showEmpty ? (
              <tr>
                <td colSpan={9} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">🌾</div>
                    <p>{farmers.length === 0 ? 'No farmers registered yet.' : 'No farmers match your search or filters.'}</p>
                    <span>{farmers.length === 0 ? 'Click "+ Add Farmer" to register the first farmer.' : 'Try adjusting your search or status filter.'}</span>
                    {farmers.length === 0 && (
                      <button className="fm-btn-primary" style={{ marginTop: '12px' }} onClick={openAdd} type="button">
                        + Add Farmer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(f => (
                <tr key={f.id} className={loading ? 'fm-row-refreshing' : ''}>
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
                  <td>{f.village  || '—'}</td>
                  <td>{f.mandal   || '—'}</td>
                  <td>{f.district || '—'}</td>
                  <td>{f.totalLand ? `${f.totalLand} ac` : '—'}</td>
                  <td>
                    <button
                      className={`fm-status-pill fm-status-${f.status.toLowerCase()}`}
                      onClick={() => toggleStatus(f)}
                      title={`Click to set ${f.status === 'Active' ? 'Inactive' : 'Active'}`}
                      type="button"
                    >
                      <span className="fm-status-dot"></span>{f.status}
                    </button>
                  </td>
                  <td>
                    <div className="fm-actions">
                      <button className="fm-action-btn fm-view"   onClick={() => setViewTarget(f)}  title="View"   type="button">👁</button>
                      <button className="fm-action-btn fm-edit"   onClick={() => openEdit(f)}        title="Edit"   type="button">✎</button>
                      <button className="fm-action-btn fm-delete" onClick={() => setDeleteTarget(f)} title="Delete" type="button">⛌</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="fm-table-footer">
        Showing <strong>{showError ? '—' : filtered.length}</strong> of <strong>{showError ? '—' : farmers.length}</strong> farmers
        &nbsp;·&nbsp; Active: <strong>{loading && !hasLoaded || showError ? '—' : counts.Active}</strong>
        &nbsp;·&nbsp; Inactive: <strong>{loading && !hasLoaded || showError ? '—' : counts.Inactive}</strong>
      </div>

      {/* Modals */}
      {modal && (
        <FarmerForm initial={modal.data} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {viewTarget && (
        <ViewFarmer farmer={viewTarget} onClose={() => setViewTarget(null)} onEdit={openEdit} />
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
