import { useState, useEffect, useCallback } from 'react'
import { farmerService } from '../../services/farmerService'
import { farmerAddressService } from '../../services/farmerAddressService'
import { farmerBankService } from '../../services/farmerBankService'
import api from '../../services/api'
import './farmers.css'

// ─── Constants ────────────────────────────────────────────────────────────────
// NOTE: no `address` text field — the FarmerAddresses table schema has:
//   FarmerId, Village, Mandal, District, State, PinCode (confirmed from SQL logs)
//   FarmerId is also the PK (one-to-one with Farmers), so no separate addressId.
const EMPTY = {
  code: '', name: '', fatherName: '', mobile: '', altMobile: '',
  email: '', aadhaar: '', village: '', mandal: '',
  district: '', state: '', pin: '', bankName: '', branchName: '', bankPhone: '', accountNo: '',
  ifsc: '', totalLand: '', status: 'Active',
  // hasAddress / hasBank track whether the farmer already has these records
  hasAddress: false,
  hasBank: false,
}

const EMPTY_RENTAL_LAND = {
  tenantName: '',
  tenantMobile: '',
  surveyNumber: '',
  landArea: '',
  areaUnit: 'Acres',
  village: '',
  mandal: '',
  district: '',
  rentAmount: '',
  rentFrequency: 'Monthly',
  leaseStartDate: '',
  leaseEndDate: '',
  remarks: '',
}

function mapRentalLand(record) {
  return {
    id: record.id ?? record.Id,
    farmerId: record.farmerId ?? record.FarmerId,
    tenantName: record.tenantName ?? record.TenantName ?? '',
    tenantMobile: record.tenantMobile ?? record.TenantMobile ?? '',
    surveyNumber: record.surveyNumber ?? record.SurveyNumber ?? '',
    landArea: String(record.landArea ?? record.LandArea ?? ''),
    areaUnit: record.areaUnit ?? record.AreaUnit ?? 'Acres',
    village: record.village ?? record.Village ?? '',
    mandal: record.mandal ?? record.Mandal ?? '',
    district: record.district ?? record.District ?? '',
    rentAmount: String(record.rentAmount ?? record.RentAmount ?? ''),
    rentFrequency: record.rentFrequency ?? record.RentFrequency ?? 'Monthly',
    leaseStartDate: String(record.leaseStartDate ?? record.LeaseStartDate ?? '').slice(0, 10),
    leaseEndDate: String(record.leaseEndDate ?? record.LeaseEndDate ?? '').slice(0, 10),
    remarks: record.remarks ?? record.Remarks ?? '',
  }
}

function formatLeaseDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN')
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
  if (!form.code?.trim())   errs.code   = 'Farmer code is required'
  if (!form.name?.trim())   errs.name   = 'Farmer name is required'
  if (!form.mobile?.trim()) errs.mobile = 'Mobile number is required'
  else if (!/^\d{10}$/.test(form.mobile.trim())) errs.mobile = 'Enter a valid 10-digit mobile'
  if (form.altMobile && !/^\d{10}$/.test(form.altMobile.trim())) errs.altMobile = 'Enter a valid 10-digit number'
  if (form.email && !/\S+@\S+\.\S+/.test(form.email.trim())) errs.email = 'Enter a valid email'

  if (form.aadhaar) {
    const rawAadhaar = form.aadhaar.replace(/\D/g, '')
    if (rawAadhaar.length > 0 && rawAadhaar.length !== 12) {
      errs.aadhaar = 'Enter a valid 12-digit Aadhaar number'
    }
  }

  if (form.totalLand !== '' && form.totalLand != null) {
    const landNum = Number(form.totalLand)
    if (isNaN(landNum) || landNum < 0) {
      errs.totalLand = 'Total land cannot be negative'
    }
  }

  if (form.pin && !/^\d{6}$/.test(form.pin.trim())) errs.pin = 'Enter a valid 6-digit PIN'
  if (form.bankPhone && !/^\d{10}$/.test(form.bankPhone.trim())) errs.bankPhone = 'Enter a valid 10-digit phone number'
  return errs
}

// ─── Local Metadata Persistence (Fallback for Extended Bank Fields) ───────────
const BANK_META_KEY = 'agriman_farmer_bank_meta';

function getFarmerBankMeta(farmerId, code) {
  try {
    const raw = localStorage.getItem(BANK_META_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw);
    return (farmerId && map[farmerId]) || (code && map[code]) || {};
  } catch (_) {
    return {};
  }
}

function saveFarmerBankMeta(farmerId, code, data) {
  try {
    const raw = localStorage.getItem(BANK_META_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const entry = {
      branchName: data.branchName || '',
      bankPhone: data.bankPhone || '',
    };
    if (farmerId) map[farmerId] = entry;
    if (code) map[code] = entry;
    localStorage.setItem(BANK_META_KEY, JSON.stringify(map));
  } catch (_) {}
}

function deleteFarmerBankMeta(farmerId, code) {
  try {
    const raw = localStorage.getItem(BANK_META_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    if (farmerId) delete map[farmerId];
    if (code) delete map[code];
    localStorage.setItem(BANK_META_KEY, JSON.stringify(map));
  } catch (_) {}
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
  const farmerCode = f.farmerCode || f.FarmerCode || f.code || f.Code || ''
  const rawStatus = String(f.status || f.Status || 'Unknown').trim()
  const status = rawStatus.toLowerCase() === 'active'
    ? 'Active'
    : rawStatus.toLowerCase() === 'inactive'
      ? 'Inactive'
      : rawStatus || 'Unknown'

  // Look up any cached / local metadata if backend response omits extended bank fields
  const meta = getFarmerBankMeta(farmerId, farmerCode)

  const branchName =
    bank.branchName || bank.BranchName || bank.branch || bank.Branch ||
    f.branchName || f.BranchName || meta.branchName || ''

  const bankPhone =
    bank.phoneNumber || bank.PhoneNumber || bank.phone || bank.Phone ||
    bank.bankPhone || bank.BankPhone || bank.contactNumber || bank.ContactNumber ||
    f.bankPhone || f.BankPhone || meta.bankPhone || ''

  const hasAddress = !!(addr.village || addr.Village || addr.mandal || addr.Mandal ||
    addr.district || addr.District || addr.state || addr.State ||
    addr.pinCode || addr.PinCode)

  const hasBank = !!(bank.bankName || bank.BankName || branchName || bank.accountNumber || bank.AccountNumber || bankPhone || f.bankName || f.BankName)

  return {
    id:         farmerId,
    code:       farmerCode,
    name:       f.farmerName  || f.FarmerName  || f.name  || f.Name  || '',
    fatherName: f.fatherOrHusbandName || f.FatherOrHusbandName || f.fatherHusbandName || f.fatherName || '',
    mobile:     f.mobile      || f.Mobile      || '',
    altMobile:  f.alternateMobile || f.AlternateMobile || f.altMobile || '',
    email:      f.email       || f.Email       || '',
    aadhaar:    f.aadhaarNo   || f.AadhaarNo   || f.aadhaar || '',
    totalLand:  f.totalLand   != null ? String(f.totalLand)
              : f.TotalLand   != null ? String(f.TotalLand) : '',
    status,
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
    branchName,
    bankPhone,
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
    bankName:      form.bankName   || '',
    branchName:    form.branchName || '',
    phoneNumber:   form.bankPhone  || '',
    accountNumber: form.accountNo  || '',
    ifsc:          form.ifsc       || '',
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

  // Detect whether form has unsaved modifications
  function hasUnsavedChanges() {
    return Object.keys(EMPTY).some(key => {
      const currentVal = (form[key] ?? '').toString().trim()
      const initialVal = (initial[key] ?? '').toString().trim()
      return currentVal !== initialVal
    })
  }

  function handleCloseRequest() {
    if (saving) return
    if (hasUnsavedChanges()) {
      const confirmDiscard = window.confirm('You have unsaved changes in this form. Discard changes and close?')
      if (!confirmDiscard) return
    }
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    setApiError(null)

    const errors = validate(form)
    if (Object.keys(errors).length) {
      setErrs(errors)
      if (errors.code || errors.name || errors.mobile || errors.altMobile || errors.email || errors.aadhaar || errors.totalLand) {
        setActiveTab('personal')
      } else if (errors.pin || errors.bankPhone) {
        setActiveTab('addressBank')
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
    { id: 'personal',    label: '👤 Personal' },
    { id: 'addressBank', label: '📍 Address & Bank' },
  ]

  return (
    <div
      className="fm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit Farmer' : 'Add Farmer'}
      onClick={e => { if (e.target === e.currentTarget) handleCloseRequest() }}
    >
      <div className="fm-modal">
        {/* Header */}
        <div className="fm-modal-head">
          <div>
            <h2>{isEdit ? 'Edit Farmer Record' : 'Register New Farmer'}</h2>
            <p>{isEdit ? `Editing · ${initial.code}` : 'Add farmer profile, address, and bank details'}</p>
          </div>
          <button className="fm-close" onClick={handleCloseRequest} aria-label="Close" type="button">✕</button>
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
                  <input
                    value={form.code}
                    readOnly
                    className={`fm-input-readonly ${errs.code ? 'err' : ''}`}
                    placeholder="e.g. FRM-001"
                    title="Farmer Code is generated automatically"
                  />
                  {errs.code && <span className="fm-err">{errs.code}</span>}
                </div>
                <div className="fm-field">
                  <label>Farmer Name <span className="fm-req">*</span></label>
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Full name"
                    className={errs.name ? 'err' : ''}
                  />
                  {errs.name && <span className="fm-err">{errs.name}</span>}
                </div>
                <div className="fm-field">
                  <label>Father / Husband Name</label>
                  <input
                    value={form.fatherName}
                    onChange={e => set('fatherName', e.target.value)}
                    placeholder="Father or husband name"
                  />
                </div>
              </div>

              <div className="fm-section-label">Contact Details</div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Mobile <span className="fm-req">*</span></label>
                  <input
                    value={form.mobile}
                    onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className={errs.mobile ? 'err' : ''}
                  />
                  {errs.mobile && <span className="fm-err">{errs.mobile}</span>}
                </div>
                <div className="fm-field">
                  <label>Alternate Mobile</label>
                  <input
                    value={form.altMobile}
                    onChange={e => set('altMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Alternate number"
                    maxLength={10}
                    className={errs.altMobile ? 'err' : ''}
                  />
                  {errs.altMobile && <span className="fm-err">{errs.altMobile}</span>}
                </div>
                <div className="fm-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="email@example.com"
                    className={errs.email ? 'err' : ''}
                  />
                  {errs.email && <span className="fm-err">{errs.email}</span>}
                </div>
              </div>

              <div className="fm-section-label">Identity & Land Details</div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Aadhaar No</label>
                  <input
                    value={form.aadhaar}
                    onChange={e => set('aadhaar', formatAadhaar(e.target.value))}
                    placeholder="1234 5678 9012"
                    maxLength={14}
                    autoComplete="off"
                    className={errs.aadhaar ? 'err' : ''}
                  />
                  {errs.aadhaar && <span className="fm-err">{errs.aadhaar}</span>}
                </div>
                <div className="fm-field">
                  <label>Total Land (Acres)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.totalLand}
                    onChange={e => {
                      const val = e.target.value
                      if (val === '' || Number(val) >= 0) {
                        set('totalLand', val)
                      }
                    }}
                    placeholder="e.g. 8.5"
                    className={errs.totalLand ? 'err' : ''}
                  />
                  {errs.totalLand && <span className="fm-err">{errs.totalLand}</span>}
                </div>
                <div className="fm-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </>)}

            {/* ── Address & Bank Tab ── */}
            {activeTab === 'addressBank' && (<>
              {/* Address Details Group */}
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
                  <label>Mandal / Taluk</label>
                  <input value={form.mandal} onChange={e => set('mandal', e.target.value)} placeholder="Mandal / Taluk" />
                </div>
                <div className="fm-field">
                  <label>District</label>
                  <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="District" />
                </div>
              </div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>State</label>
                  <select value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="fm-field">
                  <label>PIN Code</label>
                  <input
                    value={form.pin}
                    onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit PIN"
                    maxLength={6}
                    className={errs.pin ? 'err' : ''}
                  />
                  {errs.pin && <span className="fm-err">{errs.pin}</span>}
                </div>
                <div className="fm-field" style={{ visibility: 'hidden' }} aria-hidden="true"></div>
              </div>

              {/* Bank Details Group */}
              <div className="fm-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                <span>Bank Details <span className="fm-endpoint-hint">· POST /api/FarmerBankAccounts</span></span>
                {form.hasBank && <span className="fm-linked-badge fm-linked-blue">● Existing Bank Record</span>}
              </div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Bank Name</label>
                  <input value={form.bankName} onChange={e => set('bankName', e.target.value)}
                    placeholder="e.g. State Bank of India" />
                </div>
                <div className="fm-field">
                  <label>Branch Name</label>
                  <input value={form.branchName} onChange={e => set('branchName', e.target.value)}
                    placeholder="e.g. Main Branch" />
                </div>
                <div className="fm-field">
                  <label>Phone Number</label>
                  <input
                    value={form.bankPhone}
                    onChange={e => set('bankPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit phone"
                    maxLength={10}
                    className={errs.bankPhone ? 'err' : ''}
                  />
                  {errs.bankPhone && <span className="fm-err">{errs.bankPhone}</span>}
                </div>
              </div>
              <div className="fm-row">
                <div className="fm-field">
                  <label>Account Number</label>
                  <input value={form.accountNo} onChange={e => set('accountNo', e.target.value)}
                    placeholder="Account number" autoComplete="off" />
                </div>
                <div className="fm-field">
                  <label>IFSC Code</label>
                  <input value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase().slice(0, 11))}
                    placeholder="e.g. SBIN0001234" maxLength={11} />
                </div>
                <div className="fm-field" style={{ visibility: 'hidden' }} aria-hidden="true"></div>
              </div>
              <div className="fm-bank-notice">
                🔒 Bank details are transmitted securely and never logged.
              </div>
            </>)}
          </div>

          {/* Footer */}
          <div className="fm-modal-foot">
            <div className="fm-tab-nav-btns">
              {activeTab === 'addressBank' && (
                <button type="button" className="fm-btn-secondary fm-foot-btn"
                  onClick={() => setActiveTab('personal')}>
                  ← Back to Personal
                </button>
              )}
              {activeTab === 'personal' && (
                <button type="button" className="fm-btn-secondary fm-foot-btn"
                  onClick={() => setActiveTab('addressBank')}>
                  Next: Address & Bank →
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={handleCloseRequest} disabled={saving}>Cancel</button>
              <button type="submit" className="fm-btn-primary fm-foot-btn" disabled={saving}>
                {saving
                  ? <><span className="fm-spinner fm-spinner-white"></span> Saving…</>
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
          <button className="fm-btn-secondary fm-foot-btn" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="fm-btn-danger fm-foot-btn" onClick={onConfirm} disabled={deleting}>
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
            {row('Branch Name', farmer.branchName)}
            {row('Phone Number', farmer.bankPhone)}
            {row('Account No', farmer.accountNo ? '••••' + farmer.accountNo.slice(-4) : null)}
            {row('IFSC Code', farmer.ifsc)}
          </div>
        </div>
        <div className="fm-modal-foot">
          <div></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={onClose}>Close</button>
            <button type="button" className="fm-btn-primary fm-foot-btn" onClick={() => { onClose(); onEdit(farmer) }}>
              ✎ Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Natural sorting by Farmer Code (FRM-001, FRM-002, ...) ──────────────────
function compareFarmerCodes(a, b) {
  const codeA = a?.code || a?.farmerCode || ''
  const codeB = b?.code || b?.farmerCode || ''
  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' })
}

// ─── Main Farmers Page ────────────────────────────────────────────────────────
export default function Farmers({ profileEmail, profileName }) {
  const profileStorageKey = `agriman_farmer_profile_${encodeURIComponent((profileEmail || '').trim().toLowerCase())}`
  const profileNameStorageKey = `agriman_farmer_profile_name_${encodeURIComponent((profileName || '').trim().toLowerCase())}`
  // Farmer ID 1 was explicitly confirmed for the seeded Prathap G account.
  const defaultProfileId = (profileName || '').trim().toLowerCase() === 'prathap g' ? '1' : ''
  const [farmers, setFarmers]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [hasLoaded, setHasLoaded]         = useState(false)
  const [apiError, setApiError]           = useState(null)   // { headline, detail }
  const [modal, setModal]                 = useState(null)   // { mode: 'add'|'edit', data }
  const [viewTarget, setViewTarget]       = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleting, setDeleting]           = useState(false)
  const [toast, setToast]                 = useState(null)
  const [rentalModal, setRentalModal]     = useState(null)
  const [rentalForm, setRentalForm]       = useState(null)
  const [rentalError, setRentalError]     = useState('')
  const [savingRental, setSavingRental]   = useState(false)
  const [rentalLands, setRentalLands]     = useState([])
  const [rentalLoading, setRentalLoading] = useState(false)
  const [rentalLoadError, setRentalLoadError] = useState('')
  const [rentalSearch, setRentalSearch]   = useState('')
  const [deletingRentalId, setDeletingRentalId] = useState(null)
  const [profileFarmSummary, setProfileFarmSummary] = useState(null)
  const selectedProfileId = localStorage.getItem(profileStorageKey)
    || localStorage.getItem(profileNameStorageKey)
    || defaultProfileId

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
      const mapped = data.map(mapFarmer).sort(compareFarmerCodes)
      setFarmers(mapped)
    } catch (err) {
      setApiError(getFarmerApiError(err, 'list'))
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }, [])

  useEffect(() => { fetchFarmers() }, [fetchFarmers])

  const emailFarmer = profileEmail
    ? farmers.find(f => f.email.trim().toLowerCase() === profileEmail.trim().toLowerCase())
    : null
  const normalizedProfileName = (profileName || '').trim().toLowerCase()
  const nameMatches = normalizedProfileName && !normalizedProfileName.includes('@') && normalizedProfileName !== 'user'
    ? farmers.filter(f => {
      const farmerName = f.name.trim().toLowerCase()
      return farmerName === normalizedProfileName
        || farmerName.startsWith(`${normalizedProfileName} `)
        || normalizedProfileName.startsWith(`${farmerName} `)
    })
    : []
  const selectedProfile = farmers.find(f => String(f.id) === selectedProfileId)
  const currentFarmer = emailFarmer || selectedProfile || (nameMatches.length === 1 ? nameMatches[0] : null)

  useEffect(() => {
    const farmerId = currentFarmer?.id
    if (!farmerId) return undefined

    let active = true
    async function fetchProfileFarmSummary() {
      try {
        const response = await api.get(`/api/Farms/farmer/${farmerId}`)
        const data = response.data?.data ?? response.data
        const farmRecords = data?.farms ?? data?.Farms
        if (!Array.isArray(farmRecords)) {
          throw new Error('The Farms API returned an unsupported profile response.')
        }
        const parcelCount = farmRecords.reduce((total, farm) => {
          const lands = farm.lands ?? farm.Lands
          return total + (Array.isArray(lands) ? lands.length : 0)
        }, 0)
        const location = currentFarmer.village
          || farmRecords[0]?.village
          || farmRecords[0]?.Village
          || 'Location not added'
        if (active) setProfileFarmSummary({ farmerId, parcelCount, location, error: '' })
      } catch (error) {
        if (active) {
          setProfileFarmSummary({
            farmerId,
            parcelCount: null,
            location: '',
            error: error.friendlyMessage || error.message || 'Farm details could not be loaded.',
          })
        }
      }
    }

    fetchProfileFarmSummary()
    return () => { active = false }
  }, [currentFarmer?.id, currentFarmer?.village])

  const fetchRentalLands = useCallback(async () => {
    if (!currentFarmer?.id) {
      setRentalLands([])
      setRentalLoadError('')
      setRentalLoading(false)
      return
    }

    setRentalLoading(true)
    setRentalLoadError('')
    try {
      const response = await api.get(`/api/RentalLands/farmer/${currentFarmer.id}`)
      const records = response.data?.data ?? response.data
      if (!Array.isArray(records)) {
        throw new Error('The Rental Lands API returned an unsupported response.')
      }
      setRentalLands(records.map(mapRentalLand))
    } catch (error) {
      setRentalLands([])
      setRentalLoadError(errorText(error, 'list rental land'))
    } finally {
      setRentalLoading(false)
    }
  }, [currentFarmer?.id])

  useEffect(() => { fetchRentalLands() }, [fetchRentalLands])

  const normalizedRentalSearch = rentalSearch.trim().toLowerCase()
  const visibleRentalLands = rentalLands.filter(record => (
    !normalizedRentalSearch || [
      record.tenantName, record.tenantMobile, record.surveyNumber, record.areaUnit,
      record.village, record.mandal, record.district, record.rentAmount,
      record.rentFrequency, record.leaseStartDate, record.leaseEndDate, record.remarks,
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedRentalSearch))
  ))

  const counts = {
    All: 0,
    Active: 0,
    Inactive: 0,
  }

  // ── Open View drawer — re-fetch fresh data for the single farmer ─────────────
  async function openView(farmer) {
    try {
      const fresh = await farmerService.getFarmerById(farmer.id)
      setViewTarget(mapFarmer(fresh))
    } catch (_) {
      setViewTarget(farmer)
    }
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
        saveFarmerBankMeta(farmerId, form.code, form)

        // 2. Create Address
        const hasAddressInfo = form.village || form.mandal || form.district || form.state || form.pin
        if (hasAddressInfo) {
          try { await saveAddress(farmerId, form, false) }
          catch (e) { console.warn('[FarmerAddress] create note:', e) }
        }
        // 3. Create Bank Account
        const hasBankInfo = form.bankName || form.accountNo || form.ifsc || form.branchName || form.bankPhone
        if (hasBankInfo) {
          try { await saveBank(farmerId, form, false) }
          catch (e) { console.warn('[FarmerBankAccount] create note:', e) }
        }
      }
      showToast(`Farmer "${form.name}" registered successfully`)

    } else {
      // 1. Update Farmer
      await farmerService.updateFarmer(form.id, form)
      saveFarmerBankMeta(form.id, form.code, form)

      // 2. Update / create Address using farmerId as the key
      const hasAddressInfo = form.village || form.mandal || form.district || form.state || form.pin
      if (hasAddressInfo) {
        try { await saveAddress(form.id, form, form.hasAddress) }
        catch (e) { console.warn('[FarmerAddress] update note:', e) }
      }

      // 3. Update / create Bank using farmerId as the key
      const hasBankInfo = form.bankName || form.accountNo || form.ifsc || form.branchName || form.bankPhone
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
      deleteFarmerBankMeta(deleteTarget.id, deleteTarget.code)
      showToast(`Farmer "${deleteTarget.name}" deleted`, 'error')
      setDeleteTarget(null)
      await fetchFarmers()
    } catch (err) {
      showToast(errorText(err, 'delete'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  function openRentalLandForm(record = null, mode = 'add') {
    setRentalForm(record ? { ...record } : {
      ...EMPTY_RENTAL_LAND,
      village: currentFarmer?.village || '',
      mandal: currentFarmer?.mandal || '',
      district: currentFarmer?.district || '',
    })
    setRentalError('')
    setRentalModal({ mode, id: record?.id || null })
  }

  async function handleRentalLandSubmit(event) {
    event.preventDefault()
    if (!rentalForm || !rentalModal || rentalModal.mode === 'view' || savingRental) return
    if (!currentFarmer?.id) {
      setRentalError('Link a farmer profile to this account before saving rental land.')
      return
    }

    setSavingRental(true)
    setRentalError('')
    try {
      const payload = {
        farmerId: Number(currentFarmer.id),
        tenantName: rentalForm.tenantName.trim(),
        tenantMobile: rentalForm.tenantMobile.trim(),
        surveyNumber: rentalForm.surveyNumber.trim(),
        landArea: Number(rentalForm.landArea),
        areaUnit: rentalForm.areaUnit,
        village: rentalForm.village.trim(),
        mandal: rentalForm.mandal.trim(),
        district: rentalForm.district.trim(),
        rentAmount: Number(rentalForm.rentAmount),
        rentFrequency: rentalForm.rentFrequency,
        leaseStartDate: rentalForm.leaseStartDate,
        leaseEndDate: rentalForm.leaseEndDate,
        remarks: rentalForm.remarks.trim() || null,
      }

      if (rentalModal.mode === 'edit') {
        await api.put(`/api/RentalLands/${rentalModal.id}`, payload)
      } else {
        await api.post('/api/RentalLands', payload)
      }

      setRentalModal(null)
      setRentalForm(null)
      showToast(rentalModal.mode === 'edit' ? 'Rental land updated successfully.' : 'Rental land saved successfully.')
      await fetchRentalLands()
    } catch (error) {
      setRentalError(errorText(error, 'save rental land'))
    } finally {
      setSavingRental(false)
    }
  }

  async function handleDeleteRentalLand(record) {
    if (deletingRentalId !== null) return
    if (!window.confirm(`Delete the rental land record for ${record.tenantName} (Survey ${record.surveyNumber})?`)) return

    setDeletingRentalId(record.id)
    try {
      await api.delete(`/api/RentalLands/${record.id}`)
      showToast('Rental land record deleted successfully.')
      await fetchRentalLands()
    } catch (error) {
      showToast(errorText(error, 'delete rental land'), 'error')
    } finally {
      setDeletingRentalId(null)
    }
  }

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
        <div className="fm-page-title-block">
          <div className="fm-eyebrow">MASTERS</div>
          <h1 className="fm-title">Farmers</h1>
          <p className="fm-subtitle">Manage all registered farmers and their details</p>
        </div>
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

      <section className="fm-profile-card" aria-label="Main farmer profile">
        {loading && !hasLoaded ? (
          <div className="fm-profile-message" role="status">Loading your farmer profile…</div>
        ) : currentFarmer ? (
          <>
            <div className="fm-profile-identity">
              <div className="fm-avatar fm-profile-avatar">
                {currentFarmer.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
              </div>
              <div className="fm-profile-name">
                <span className="fm-profile-eyebrow">MY FARMER PROFILE</span>
                <h2>{currentFarmer.name}</h2>
                <span>{currentFarmer.code} · {currentFarmer.fatherName || 'Farmer'}</span>
              </div>
            </div>
            <div className="fm-profile-summary-block">
              <span>CONTACT</span>
              <strong>{currentFarmer.mobile || 'Mobile not added'}</strong>
              <small>{currentFarmer.email || profileEmail || 'Email not added'}</small>
            </div>
            <div className="fm-profile-summary-block">
              <span>MY FARM</span>
              <strong>
                {currentFarmer.totalLand
                  ? `${Number(currentFarmer.totalLand).toFixed(1)} acres`
                  : 'Land details unavailable'}
              </strong>
              <small>
                {profileFarmSummary?.farmerId === currentFarmer.id
                  ? profileFarmSummary.error
                    ? 'Farm details unavailable'
                    : `${profileFarmSummary.location} · ${profileFarmSummary.parcelCount} farm ${profileFarmSummary.parcelCount === 1 ? 'parcel' : 'parcels'}`
                  : 'Loading farm details…'}
              </small>
            </div>
            <button type="button" className="fm-profile-view-button" onClick={() => openView(currentFarmer)}>
              View full profile <span aria-hidden="true">→</span>
            </button>
          </>
        ) : (
          <div className="fm-profile-message">
            <span className="fm-profile-eyebrow">MY FARMER PROFILE</span>
            <strong>{profileName || 'Signed-in user'}</strong>
            <span>No farmer profile record could be matched to this account.</span>
          </div>
        )}
      </section>

      {/* Toolbar */}
      <div className="fm-toolbar">
        <div className="fm-search-wrap">
          <span className="fm-search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            className="fm-search"
            placeholder="Search tenant, survey number or location…"
            value={rentalSearch}
            onChange={event => setRentalSearch(event.target.value)}
            aria-label="Search rental land"
          />
          {rentalSearch && (
            <button className="fm-clear-search" onClick={() => setRentalSearch('')} type="button" aria-label="Clear search">✕</button>
          )}
        </div>
        <div className="fm-filter-group">
          {['All', 'Active', 'Inactive'].map(s => (
            <button
              key={s} type="button"
              className={`fm-filter-btn${s === 'All' ? ' active' : ''}`}
              disabled
            >
              {s}
              <span className="fm-filter-count">
                {counts[s]}
              </span>
            </button>
          ))}
          <button
            type="button" onClick={fetchFarmers}
            title="Refresh farmer list" aria-label="Refresh farmers"
            disabled={loading}
            className={`fm-refresh-btn${loading ? ' fm-spinning' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="fm-rental-heading">
        <div>
          <h2>Rental Land Details</h2>
          <p>People and plots linked to the land you leased out</p>
        </div>
        <button
          type="button"
          className="fm-rental-add-btn"
          onClick={openRentalLandForm}
          title="Add a rental land record"
        >
          + Add Rental Land
        </button>
      </div>

      <div className="fm-table-wrap">
        <table className="fm-table fm-rental-table">
          <thead>
            <tr>
              <th>Tenant / Receiver</th>
              <th>Mobile</th>
              <th>Survey No.</th>
              <th className="fm-th-land fm-col-num">Land Area</th>
              <th>Village</th>
              <th>Mandal</th>
              <th>District</th>
              <th>Rent</th>
              <th>Lease Period</th>
              <th className="fm-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !hasLoaded ? (
              <tr>
                <td colSpan={10} className="fm-state-cell">
                  <div className="fm-loading-state"><div className="fm-loading-spinner"></div><p>Loading rental land…</p></div>
                </td>
              </tr>
            ) : !currentFarmer ? (
              <tr>
                <td colSpan={10} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">⚠</div>
                    <p>No linked land owner profile.</p>
                    <span>Link a farmer profile to view and save rental land records.</span>
                  </div>
                </td>
              </tr>
            ) : rentalLoadError ? (
              <tr>
                <td colSpan={10} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">⚠</div>
                    <p>Rental land could not be loaded.</p>
                    <span>{rentalLoadError}</span>
                    <button className="fm-btn-secondary" type="button" onClick={fetchRentalLands}>Retry</button>
                  </div>
                </td>
              </tr>
            ) : rentalLoading ? (
              <tr>
                <td colSpan={10} className="fm-state-cell">
                  <div className="fm-loading-state"><div className="fm-loading-spinner"></div><p>Loading rental land…</p></div>
                </td>
              </tr>
            ) : visibleRentalLands.length === 0 ? (
              <tr>
                <td colSpan={10} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">🌾</div>
                    <p>{rentalLands.length ? 'No rental land matches your search.' : 'No rental land records to display.'}</p>
                    <span>{rentalLands.length ? 'Try another tenant, survey number, or location.' : 'Use Add Rental Land to record tenant and lease details.'}</span>
                  </div>
                </td>
              </tr>
            ) : visibleRentalLands.map(record => (
              <tr key={record.id}>
                <td><strong>{record.tenantName}</strong></td>
                <td>{record.tenantMobile}</td>
                <td>{record.surveyNumber}</td>
                <td className="fm-td-land fm-col-num">{Number(record.landArea).toFixed(2)} {record.areaUnit}</td>
                <td>{record.village}</td>
                <td>{record.mandal}</td>
                <td>{record.district}</td>
                <td>₹{Number(record.rentAmount).toLocaleString('en-IN')} / {record.rentFrequency}</td>
                <td>{formatLeaseDate(record.leaseStartDate)} – {formatLeaseDate(record.leaseEndDate)}</td>
                <td className="fm-td-actions">
                  <div className="fm-actions">
                    <button className="fm-action-btn fm-view" onClick={() => openRentalLandForm(record, 'view')} title="View Rental Land" aria-label={`View rental land for ${record.tenantName}`} type="button">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="fm-action-btn fm-edit" onClick={() => openRentalLandForm(record, 'edit')} title="Edit Rental Land" aria-label={`Edit rental land for ${record.tenantName}`} type="button">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    <button className="fm-action-btn fm-delete" onClick={() => handleDeleteRentalLand(record)} title="Delete Rental Land" aria-label={`Delete rental land for ${record.tenantName}`} type="button" disabled={deletingRentalId !== null}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      {rentalModal && rentalForm && (
        <div className="fm-overlay" role="presentation" onClick={event => {
          if (event.target === event.currentTarget) setRentalModal(null)
        }}>
          <section className="fm-modal fm-rental-modal" role="dialog" aria-modal="true" aria-labelledby="fm-rental-modal-title">
            <header className="fm-modal-head">
              <div>
                <h2 id="fm-rental-modal-title">
                  Add Rental Land
                </h2>
                <p>
                  {currentFarmer ? `Land leased out by ${currentFarmer.name}.` : 'Record the person and plot receiving the leased land.'}
                </p>
              </div>
              <button
                className="fm-close"
                onClick={() => setRentalModal(null)}
                aria-label="Close"
                type="button"
              >✕</button>
            </header>
            <form className="fm-form" onSubmit={event => event.preventDefault()} noValidate>
              <div className="fm-form-body">
                <div className="fm-section-label">Tenant / Receiver</div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-tenant-name">Tenant / Receiver Name <span className="fm-req">*</span></label>
                    <input id="rental-tenant-name" name="tenantName" value={rentalForm.tenantName} onChange={event => setRentalForm({ ...rentalForm, tenantName: event.target.value })} required maxLength={150} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-tenant-mobile">Mobile Number <span className="fm-req">*</span></label>
                    <input id="rental-tenant-mobile" name="tenantMobile" type="tel" value={rentalForm.tenantMobile} onChange={event => setRentalForm({ ...rentalForm, tenantMobile: event.target.value })} required maxLength={20} pattern="^\+?[0-9\s()-]{7,20}$" />
                  </div>
                </div>

                <div className="fm-section-label">Plot and Lease Details</div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-survey-number">Survey Number <span className="fm-req">*</span></label>
                    <input id="rental-survey-number" name="surveyNumber" value={rentalForm.surveyNumber} onChange={event => setRentalForm({ ...rentalForm, surveyNumber: event.target.value })} required maxLength={100} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-land-area">Land Area <span className="fm-req">*</span></label>
                    <input id="rental-land-area" name="landArea" type="number" value={rentalForm.landArea} onChange={event => setRentalForm({ ...rentalForm, landArea: event.target.value })} required min="0.01" max="100000" step="any" />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-area-unit">Area Unit <span className="fm-req">*</span></label>
                    <select id="rental-area-unit" name="areaUnit" value={rentalForm.areaUnit} onChange={event => setRentalForm({ ...rentalForm, areaUnit: event.target.value })} required>
                      {['Acres', 'Hectares', 'Cents', 'Square Feet', 'Gunthas'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-village">Village <span className="fm-req">*</span></label>
                    <input id="rental-village" name="village" value={rentalForm.village} onChange={event => setRentalForm({ ...rentalForm, village: event.target.value })} required maxLength={100} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-mandal">Mandal <span className="fm-req">*</span></label>
                    <input id="rental-mandal" name="mandal" value={rentalForm.mandal} onChange={event => setRentalForm({ ...rentalForm, mandal: event.target.value })} required maxLength={100} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-district">District <span className="fm-req">*</span></label>
                    <input id="rental-district" name="district" value={rentalForm.district} onChange={event => setRentalForm({ ...rentalForm, district: event.target.value })} required maxLength={100} />
                  </div>
                </div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-rent-amount">Rent Amount <span className="fm-req">*</span></label>
                    <input id="rental-rent-amount" name="rentAmount" type="number" value={rentalForm.rentAmount} onChange={event => setRentalForm({ ...rentalForm, rentAmount: event.target.value })} required min="0.01" max="1000000000" step="0.01" />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-rent-frequency">Rent Frequency <span className="fm-req">*</span></label>
                    <select id="rental-rent-frequency" name="rentFrequency" value={rentalForm.rentFrequency} onChange={event => setRentalForm({ ...rentalForm, rentFrequency: event.target.value })} required>
                      {['Monthly', 'Yearly', 'Seasonal', 'One-time'].map(frequency => <option key={frequency} value={frequency}>{frequency}</option>)}
                    </select>
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-lease-start">Lease Start Date <span className="fm-req">*</span></label>
                    <input id="rental-lease-start" name="leaseStartDate" type="date" value={rentalForm.leaseStartDate} onChange={event => setRentalForm({ ...rentalForm, leaseStartDate: event.target.value })} required />
                  </div>
                </div>
                <div className="fm-row fm-row-2">
                  <div className="fm-field">
                    <label htmlFor="rental-lease-end">Lease End Date <span className="fm-req">*</span></label>
                    <input id="rental-lease-end" name="leaseEndDate" type="date" value={rentalForm.leaseEndDate} onChange={event => setRentalForm({ ...rentalForm, leaseEndDate: event.target.value })} required min={rentalForm.leaseStartDate || undefined} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-remarks">Remarks</label>
                    <textarea id="rental-remarks" name="remarks" value={rentalForm.remarks} onChange={event => setRentalForm({ ...rentalForm, remarks: event.target.value })} maxLength={500} rows={2} />
                  </div>
                </div>
              </div>
              <footer className="fm-modal-foot">
                <span className="fm-rental-note">UI preview only — entries will not be saved.</span>
                <div className="fm-tab-nav-btns">
                  <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={() => setRentalModal(null)}>Close</button>
                  <button
                    type="button"
                    className="fm-btn-primary fm-foot-btn"
                    onClick={() => showToast('UI preview only — rental entries are not saved.', 'error')}
                  >
                    Save Rental Land
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
