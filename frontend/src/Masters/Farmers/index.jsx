import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { farmerService } from '../../services/farmerService'
import { farmerAddressService } from '../../services/farmerAddressService'
import { farmerBankService } from '../../services/farmerBankService'
import api from '../../services/api'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
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
  tenantCountryCode: '+91',
  tenantMobile: '',
  surveyNumber: '',
  landArea: '',
  areaUnit: 'Acres',
  village: '',
  mandal: '',
  district: '',
  state: '',
  pinCode: '',
  rentAmount: '',
  rentFrequency: 'Monthly',
  leaseStartDate: '',
  leaseEndDate: '',
  status: 'Active',
  remarks: '',
  documents: [],
}

const RENTAL_DOCUMENT_MAX_FILES = 5
const RENTAL_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024
const RENTAL_DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
const RENTAL_PHONE_COUNTRY_CODES = [
  { code: '+91', country: 'India', maxDigits: 10 },
  { code: '+1', country: 'US / Canada', maxDigits: 10 },
  { code: '+44', country: 'United Kingdom', maxDigits: 10 },
  { code: '+61', country: 'Australia', maxDigits: 9 },
  { code: '+971', country: 'UAE', maxDigits: 9 },
  { code: '+65', country: 'Singapore', maxDigits: 8 },
  { code: '+94', country: 'Sri Lanka', maxDigits: 9 },
  { code: '+977', country: 'Nepal', maxDigits: 10 },
  { code: '+880', country: 'Bangladesh', maxDigits: 10 },
  { code: '+92', country: 'Pakistan', maxDigits: 10 },
  { code: '+966', country: 'Saudi Arabia', maxDigits: 9 },
]

function mapRentalLand(record) {
  const rawStatus = String(record.status ?? record.Status ?? 'Active').trim().toLowerCase()
  const documents = record.documents ?? record.Documents ?? []
  const savedMobile = String(record.tenantMobile ?? record.TenantMobile ?? record.mobile ?? record.Mobile ?? '')
  const savedCountryCode = record.tenantCountryCode ?? record.TenantCountryCode
  const matchedCountry = RENTAL_PHONE_COUNTRY_CODES.find(({ code }) => savedMobile.startsWith(code))
  const tenantCountryCode = matchedCountry?.code || savedCountryCode || '+91'
  const tenantMobile = savedMobile.startsWith(tenantCountryCode)
    ? savedMobile.slice(tenantCountryCode.length).replace(/\D/g, '')
    : savedMobile.replace(/\D/g, '')
  const tenantPhoneNumber = tenantMobile.slice(0, maxLocalPhoneDigits(tenantCountryCode))

  return {
    id: record.id ?? record.Id,
    farmerId: record.farmerId ?? record.FarmerId,
    tenantName: record.tenantName ?? record.TenantName ?? '',
    tenantCountryCode,
    tenantMobile: tenantPhoneNumber ? `${tenantCountryCode} ${tenantPhoneNumber}` : '',
    tenantPhoneNumber,
    surveyNumber: record.surveyNumber ?? record.SurveyNumber ?? '',
    landArea: String(record.landArea ?? record.LandArea ?? ''),
    areaUnit: record.areaUnit ?? record.AreaUnit ?? 'Acres',
    village: record.village ?? record.Village ?? '',
    mandal: record.mandal ?? record.Mandal ?? '',
    district: record.district ?? record.District ?? '',
    state: record.state ?? record.State ?? '',
    pinCode: String(record.pinCode ?? record.PinCode ?? '').replace(/\D/g, '').slice(0, 6),
    rentAmount: String(record.rentAmount ?? record.RentAmount ?? ''),
    rentFrequency: record.rentFrequency ?? record.RentFrequency ?? 'Monthly',
    leaseStartDate: String(record.leaseStartDate ?? record.LeaseStartDate ?? '').slice(0, 10),
    leaseEndDate: String(record.leaseEndDate ?? record.LeaseEndDate ?? '').slice(0, 10),
    status: rawStatus === 'inactive' ? 'Inactive' : 'Active',
    remarks: record.remarks ?? record.Remarks ?? '',
    documents: Array.isArray(documents) ? documents.map(document => ({
      id: document.id ?? document.Id,
      fileName: document.fileName ?? document.FileName ?? '',
      fileSize: Number(document.fileSize ?? document.FileSize ?? 0),
      uploadedAt: document.uploadedAt ?? document.UploadedAt ?? '',
    })) : [],
  }
}

function formatFileSize(fileSize) {
  if (!fileSize) return '0 KB'
  if (fileSize < 1024 * 1024) return `${Math.max(1, Math.round(fileSize / 1024))} KB`
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
}

function maxLocalPhoneDigits(countryCode) {
  return RENTAL_PHONE_COUNTRY_CODES.find(({ code }) => code === countryCode)?.maxDigits ?? 10
}

function postalOfficeMandal(postOffice) {
  const block = String(postOffice?.Block || '').trim()
  return block.toUpperCase() === 'NA' ? '' : block
}

function mostCommonPostalOfficeMandal(postOffices) {
  const counts = new Map()
  postOffices.forEach(postOffice => {
    const mandal = postalOfficeMandal(postOffice)
    if (mandal) counts.set(mandal, (counts.get(mandal) || 0) + 1)
  })

  const rankedMandals = [...counts.entries()].sort((left, right) => right[1] - left[1])
  if (!rankedMandals.length || rankedMandals[0][1] === rankedMandals[1]?.[1]) return ''
  return rankedMandals[0][0]
}

function formatLeaseDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN')
}

function areaInAcres(area, unit) {
  const conversions = {
    acres: 1,
    hectares: 2.47105,
    cents: 0.01,
    'square feet': 1 / 43560,
    gunthas: 0.025,
  }
  return (Number(area) || 0) * (conversions[String(unit || 'Acres').toLowerCase()] || 1)
}

function getLeaseDuration(start, end) {
  if (!start || !end) return '—'
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return '—'
  const days = Math.ceil((endDate - startDate) / 86400000) + 1
  return `${days} day${days === 1 ? '' : 's'}`
}

function defaultCropAllocations() {
  return [
    { crop: 'Paddy', area: 5 },
    { crop: 'Chilli', area: 5 },
    { crop: 'Corn', area: 5 },
  ]
}

function rentalCropStorageKey(record) {
  const identifier = record.id ?? `${record.tenantName}-${record.surveyNumber}`
  return `agriman_rental_crop_allocations_${encodeURIComponent(identifier)}`
}

function loadRentalCropAllocations(record) {
  try {
    const saved = localStorage.getItem(rentalCropStorageKey(record))
    if (saved === null) return { allocations: defaultCropAllocations(), isSample: true, error: '' }
    const allocations = JSON.parse(saved)
    if (!Array.isArray(allocations) || allocations.length === 0 || allocations.some(item => (
      typeof item.crop !== 'string' || !item.crop.trim() || !Number.isFinite(Number(item.area)) || Number(item.area) <= 0
    ))) {
      throw new Error('Saved crop chart data has an invalid format.')
    }
    return { allocations, isSample: false, error: '' }
  } catch (error) {
    return {
      allocations: defaultCropAllocations(),
      isSample: true,
      error: `Saved crop chart data could not be loaded: ${error.message}`,
    }
  }
}

function RentalLandDetails({ record, records, farmer, onClose, onDownloadDocument }) {
  const [cropAllocationState, setCropAllocationState] = useState(() => loadRentalCropAllocations(record))
  const [editingCropAllocation, setEditingCropAllocation] = useState(false)
  const [cropAllocationDraft, setCropAllocationDraft] = useState([])
  const [cropAllocationError, setCropAllocationError] = useState(cropAllocationState.error)
  const cropChartData = cropAllocationState.allocations.map(item => ({
    name: item.crop,
    value: Number(item.area),
  }))
  const totalFarmAcres = Number(farmer?.totalLand) || 0
  const activeRentalRecords = records.filter(item => item.status === 'Active')
  const activelyLeasedAcres = activeRentalRecords
    .reduce((total, item) => total + areaInAcres(item.landArea, item.areaUnit), 0)
  const activeTenantNames = [...new Set(activeRentalRecords
    .map(item => String(item.tenantName || '').trim())
    .filter(Boolean))]
  const chartLeasedAcres = Math.min(activelyLeasedAcres, totalFarmAcres)
  const farmAllocation = totalFarmAcres > 0
    ? [
        { name: 'Actively leased', value: chartLeasedAcres },
        { name: 'Not actively leased', value: Math.max(0, totalFarmAcres - activelyLeasedAcres) },
      ].filter(item => item.value > 0)
    : []
  const colors = ['#15803d', '#86efac', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f97316']
  const details = [
    ['Tenant / Receiver', record.tenantName],
    ['Mobile number', record.tenantMobile],
    ['Survey number', record.surveyNumber],
    ['Land area', `${Number(record.landArea).toLocaleString('en-IN')} ${record.areaUnit}`],
    ['Village', record.village],
    ['Mandal', record.mandal],
    ['District', record.district],
    ['State', record.state],
    ['PIN Code', record.pinCode],
    ['Rent', `₹${Number(record.rentAmount).toLocaleString('en-IN')} / ${record.rentFrequency}`],
    ['Lease period', `${formatLeaseDate(record.leaseStartDate)} – ${formatLeaseDate(record.leaseEndDate)}`],
    ['Duration', getLeaseDuration(record.leaseStartDate, record.leaseEndDate)],
    ['Status', record.status],
  ]

  function startCropAllocationEdit() {
    setCropAllocationDraft(cropAllocationState.allocations.map(item => ({ ...item })))
    setCropAllocationError('')
    setEditingCropAllocation(true)
  }

  function saveCropAllocation(event) {
    event.preventDefault()
    const allocations = cropAllocationDraft.map(item => ({
      crop: item.crop.trim(),
      area: Number(item.area),
    }))
    if (!allocations.length || allocations.some(item => !item.crop || !Number.isFinite(item.area) || item.area <= 0)) {
      setCropAllocationError('Enter a crop name and a positive acreage for each chart entry.')
      return
    }
    try {
      localStorage.setItem(rentalCropStorageKey(record), JSON.stringify(allocations))
      setCropAllocationState({ allocations, isSample: false, error: '' })
      setCropAllocationError('')
      setEditingCropAllocation(false)
    } catch (error) {
      setCropAllocationError(`Crop chart could not be saved in this browser: ${error.message}`)
    }
  }

  return (
    <div className="fm-overlay" role="presentation" onClick={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="fm-modal fm-tenant-detail" role="dialog" aria-modal="true" aria-labelledby="fm-tenant-detail-title">
        <header className="fm-modal-head">
          <div>
            <span className="fm-tenant-detail-eyebrow">RENTAL LAND / TENANT DETAILS</span>
            <h2 id="fm-tenant-detail-title">{record.tenantName || 'Tenant details'}</h2>
            <p>Land leased from {farmer?.name || 'the selected farmer'}.</p>
          </div>
          <button className="fm-close" onClick={onClose} aria-label="Close tenant details" type="button">✕</button>
        </header>
        <div className="fm-tenant-detail-body">
          <section className="fm-tenant-address-card" aria-label="Leased land address">
            <span className="fm-tenant-detail-eyebrow">LEASED LAND ADDRESS</span>
            <strong>{[record.village, record.mandal, record.district].filter(Boolean).join(', ') || 'Address not provided'}</strong>
            <span>Plot / Survey No. {record.surveyNumber || '—'}</span>
          </section>

          <section className="fm-tenant-fields" aria-label="Tenant and lease information">
            {details.map(([label, value]) => (
              <div className="fm-tenant-field" key={label}>
                <span>{label}</span>
                <strong>{value || '—'}</strong>
              </div>
            ))}
          </section>

          {record.documents?.length > 0 && (
            <section className="fm-rental-documents" aria-label="Rental agreement documents">
              <h3>Rental agreements</h3>
              <div className="fm-rental-document-list">
                {record.documents.map(document => (
                  <div className="fm-rental-document-item" key={document.id}>
                    <span>{document.fileName} <small>{formatFileSize(document.fileSize)}</small></span>
                    <button type="button" onClick={() => onDownloadDocument(record.id, document)}>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="fm-tenant-charts">
            <section className="fm-tenant-chart-card">
              <h3>Crop-wise land allocation</h3>
              <p>
                {cropAllocationState.isSample
                  ? 'Sample crop areas on this leased land, in acres.'
                  : 'Crop acreage saved in this browser, in acres.'}
              </p>
              {cropChartData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={cropChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={82}
                      label={({ name, value }) => `${name} ${value}ac`}
                    >
                      {cropChartData.map((item, index) => (
                        <Cell key={`${item.name}-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={value => `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })} acres`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="fm-tenant-chart-empty">Add crop and acreage values to show the pie chart.</div>
              )}
              {cropAllocationError && <p className="fm-tenant-chart-note" role="alert">{cropAllocationError}</p>}
              {!editingCropAllocation ? (
                <button type="button" className="fm-tenant-chart-edit" onClick={startCropAllocationEdit}>
                  Edit chart
                </button>
              ) : (
                <form className="fm-crop-allocation-editor" onSubmit={saveCropAllocation}>
                  {cropAllocationDraft.map((item, index) => (
                    <div className="fm-crop-allocation-row" key={`crop-${index}`}>
                      <label>
                        Crop
                        <input
                          value={item.crop}
                          onChange={event => setCropAllocationDraft(current => current.map((crop, cropIndex) => (
                            cropIndex === index ? { ...crop, crop: event.target.value } : crop
                          )))}
                          maxLength={60}
                          required
                        />
                      </label>
                      <label>
                        Acres
                        <input
                          type="number"
                          value={item.area}
                          onChange={event => setCropAllocationDraft(current => current.map((crop, cropIndex) => (
                            cropIndex === index ? { ...crop, area: event.target.value } : crop
                          )))}
                          min="0.01"
                          step="any"
                          required
                        />
                      </label>
                      <button
                        type="button"
                        className="fm-crop-allocation-remove"
                        onClick={() => setCropAllocationDraft(current => current.filter((_, cropIndex) => cropIndex !== index))}
                        aria-label={`Remove ${item.crop || 'crop'} chart entry`}
                      >×</button>
                    </div>
                  ))}
                  <div className="fm-crop-allocation-actions">
                    <button type="button" className="fm-tenant-chart-edit" onClick={() => setCropAllocationDraft(current => [...current, { crop: '', area: '' }])}>
                      + Add crop
                    </button>
                    <div>
                      <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={() => { setEditingCropAllocation(false); setCropAllocationError('') }}>
                        Cancel
                      </button>
                      <button type="submit" className="fm-btn-primary fm-foot-btn">Save chart</button>
                    </div>
                  </div>
                </form>
              )}
            </section>

            <section className="fm-tenant-chart-card">
              <h3>Farm land allocation</h3>
              <p>Active rental plots compared with the farmer’s registered land.</p>
              {farmAllocation.length ? (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={farmAllocation}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="48%"
                        outerRadius={82}
                        label={labelProps => {
                          const labelLines = [
                            `${Number(labelProps.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })} acres`,
                            ...(labelProps.name === 'Actively leased' ? activeTenantNames : []),
                          ]

                          return (
                            <text
                              x={labelProps.x}
                              y={labelProps.y}
                              textAnchor={labelProps.textAnchor}
                              fill={labelProps.name === 'Actively leased' ? '#15803d' : '#64748b'}
                              fontSize={12}
                            >
                              {labelLines.map((line, index) => (
                                <tspan key={`${line}-${index}`} x={labelProps.x} dy={index === 0 ? 0 : 14}>
                                  {line}
                                </tspan>
                              ))}
                            </text>
                          )
                        }}
                      >
                        {farmAllocation.map((item, index) => (
                          <Cell key={item.name} fill={index === 0 ? '#15803d' : '#dbeafe'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={value => `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })} acres`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {activelyLeasedAcres > totalFarmAcres && (
                    <p className="fm-tenant-chart-note">Recorded active rental area exceeds the farmer’s registered total land.</p>
                  )}
                </>
              ) : (
                <div className="fm-tenant-chart-empty">Registered total land is not available, so this comparison cannot be calculated.</div>
              )}
            </section>
          </div>
        </div>
        <footer className="fm-modal-foot fm-tenant-detail-foot">
          <span className="fm-rental-note">Address shown is the leased plot location recorded for this rental.</span>
          <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  )
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
  if (status === 502 || status === 503 || status === 504) {
    return {
      headline: 'Cannot connect to backend server (502)',
      detail: 'The ASP.NET Core backend or ngrok tunnel is currently offline or unreachable. Please ensure the backend (run-backend.bat) and ngrok tunnel (run-ngrok.bat) are running, then click Retry.',
    }
  }
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
  const [rentalFiles, setRentalFiles]     = useState([])
  const [selectedRentalDetail, setSelectedRentalDetail] = useState(null)
  const [rentalError, setRentalError]     = useState('')
  const [rentalPinLookupStatus, setRentalPinLookupStatus] = useState(null)
  const [rentalPinPostOffices, setRentalPinPostOffices] = useState([])
  const [savingRental, setSavingRental]   = useState(false)
  const [rentalLands, setRentalLands]     = useState([])
  const [rentalLoading, setRentalLoading] = useState(false)
  const [rentalLoadError, setRentalLoadError] = useState('')
  const [rentalSearch, setRentalSearch]   = useState('')
  const [rentalStatusFilter, setRentalStatusFilter] = useState('All')
  const [openRentalMenuId, setOpenRentalMenuId] = useState(null)
  const [rentalMenuPosition, setRentalMenuPosition] = useState(null)
  const [deletingRentalId, setDeletingRentalId] = useState(null)
  const rentalPinLookupRequest = useRef(0)
  const [profileFarmSummary, setProfileFarmSummary] = useState(null)
  const selectedProfileId = localStorage.getItem(profileStorageKey)
    || localStorage.getItem(profileNameStorageKey)
    || defaultProfileId

  useEffect(() => {
    if (openRentalMenuId === null) return undefined

    const closeMenu = () => {
      setOpenRentalMenuId(null)
      setRentalMenuPosition(null)
    }
    window.addEventListener('click', closeMenu)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [openRentalMenuId])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleRentalDocumentSelection(event) {
    const selectedFiles = Array.from(event.currentTarget.files || [])
    event.currentTarget.value = ''
    const invalidFile = selectedFiles.find(file => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      return !extension
        || !RENTAL_DOCUMENT_EXTENSIONS.has(extension)
        || file.size === 0
        || file.size > RENTAL_DOCUMENT_MAX_SIZE
    })

    if (rentalFiles.length + selectedFiles.length > RENTAL_DOCUMENT_MAX_FILES) {
      setRentalError(`Choose no more than ${RENTAL_DOCUMENT_MAX_FILES} agreement files.`)
      return
    }
    if (invalidFile) {
      setRentalError(`${invalidFile.name} is not supported. Choose a PDF, Word, JPG, or PNG file up to 10 MB.`)
      return
    }

    setRentalError('')
    setRentalFiles(current => [...current, ...selectedFiles])
  }

  async function handleDownloadRentalDocument(rentalLandId, rentalDocument) {
    try {
      const response = await api.get(
        `/api/RentalLands/${rentalLandId}/documents/${rentalDocument.id}`,
        { responseType: 'blob' }
      )
      const downloadUrl = window.URL.createObjectURL(response.data)
      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.download = rentalDocument.fileName || 'rental-agreement'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000)
    } catch (error) {
      showToast(errorText(error, 'download rental agreement'), 'error')
    }
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
    ? farmers.find(f => (f.email || '').trim().toLowerCase() === profileEmail.trim().toLowerCase())
    : null
  const normalizedProfileName = (profileName || '').trim().toLowerCase()
  const nameMatches = normalizedProfileName && !normalizedProfileName.includes('@') && normalizedProfileName !== 'user'
    ? farmers.filter(f => {
      const farmerName = (f.name || '').trim().toLowerCase()
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
  const searchedRentalLands = rentalLands.filter(record => (
    !normalizedRentalSearch || [
      record.tenantName, record.tenantMobile, record.surveyNumber, record.areaUnit,
      record.village, record.mandal, record.district, record.rentAmount,
      record.rentFrequency, record.leaseStartDate, record.leaseEndDate, record.status, record.remarks,
    ].some(value => String(value ?? '').toLowerCase().includes(normalizedRentalSearch))
  ))

  const counts = {
    All: rentalLands.length,
    Active: rentalLands.filter(record => record.status === 'Active').length,
    Inactive: rentalLands.filter(record => record.status === 'Inactive').length,
  }
  const visibleRentalLands = searchedRentalLands.filter(record =>
    rentalStatusFilter === 'All' || record.status === rentalStatusFilter
  )
  const rentalReadOnly = rentalModal?.mode === 'view'

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
    rentalPinLookupRequest.current += 1
    setRentalPinLookupStatus(null)
    setRentalPinPostOffices([])
    const pinCode = String(record ? record.pinCode || '' : currentFarmer?.pin || '').replace(/\D/g, '').slice(0, 6)
    const village = record ? record.village || '' : currentFarmer?.village || ''
    const mandal = record ? record.mandal || '' : currentFarmer?.mandal || ''
    const district = record ? record.district || '' : currentFarmer?.district || ''
    const state = record ? record.state || '' : currentFarmer?.state || ''
    setRentalForm(record ? {
      ...EMPTY_RENTAL_LAND,
      ...record,
      tenantMobile: record.tenantPhoneNumber || '',
      village,
      mandal,
      district,
      state,
      pinCode,
      remarks: record.remarks || '',
    } : {
      ...EMPTY_RENTAL_LAND,
      village,
      mandal,
      district,
      state,
      pinCode,
    })
    setRentalFiles([])
    setRentalError('')
    setRentalModal({ mode, id: record?.id || null })

    if (pinCode.length === 6 && (!village || !mandal || !district || !state)) {
      const requestId = rentalPinLookupRequest.current
      setRentalPinLookupStatus({ type: 'loading', message: 'Looking up location…' })
      void lookupRentalPinCode(pinCode, requestId)
    }
  }

  async function lookupRentalPinCode(pinCode, requestId) {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pinCode)}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`PIN lookup failed with status ${response.status}.`)

      const results = await response.json()
      const result = Array.isArray(results) ? results[0] : null
      const postOffices = result?.Status === 'Success'
        ? result.PostOffice?.filter(office => office?.Name && office?.District && office?.State) || []
        : []

      if (requestId !== rentalPinLookupRequest.current) return
      if (!postOffices.length) {
        setRentalError('PIN code not found. Enter the location details manually.')
        setRentalPinLookupStatus({
          type: 'error',
          message: 'PIN code not found. Enter the location details manually.',
        })
        return
      }

      setRentalPinPostOffices(postOffices)
      const firstOffice = postOffices[0]
      const district = postOffices.every(office => office.District === firstOffice.District)
        ? firstOffice.District
        : ''
      const state = postOffices.every(office => office.State === firstOffice.State)
        ? firstOffice.State
        : ''
      const mandal = mostCommonPostalOfficeMandal(postOffices)

      if (postOffices.length > 1) {
        setRentalForm(current => current ? {
          ...current,
          village: firstOffice.Name,
          mandal,
          district,
          state,
        } : current)
        setRentalPinLookupStatus({
          type: 'choice',
          message: 'This PIN has multiple post offices. Choose the correct village.',
        })
        return
      }

      const postOffice = firstOffice
      setRentalForm(current => current ? {
        ...current,
        village: postOffice.Name,
        mandal: postalOfficeMandal(postOffice),
        district: postOffice.District,
        state: postOffice.State,
      } : current)
      setRentalPinLookupStatus(null)
    } catch (error) {
      if (requestId !== rentalPinLookupRequest.current) return
      console.warn('[RentalLand] PIN lookup failed:', error)
      setRentalError('PIN lookup is unavailable. Enter the location details manually.')
      setRentalPinLookupStatus({
        type: 'error',
        message: 'PIN lookup is unavailable. Enter the location details manually.',
      })
    }
  }

  function handleRentalPinCodeChange(event) {
    const pinCode = event.target.value.replace(/\D/g, '').slice(0, 6)
    const requestId = ++rentalPinLookupRequest.current
    setRentalForm(current => current ? {
      ...current,
      pinCode,
      village: '',
      mandal: '',
      district: '',
      state: '',
    } : current)
    setRentalPinPostOffices([])
    setRentalPinLookupStatus(null)
    setRentalError('')

    if (pinCode.length === 6) {
      setRentalPinLookupStatus({ type: 'loading', message: 'Looking up location…' })
      void lookupRentalPinCode(pinCode, requestId)
    }
  }

  function handleRentalVillageChange(event) {
    const village = event.target.value
    const selectedOffice = rentalPinPostOffices.find(office => (
      office.Name.toLocaleLowerCase() === village.trim().toLocaleLowerCase()
    ))

    setRentalForm(current => current ? {
      ...current,
      village,
      ...(selectedOffice ? {
        mandal: postalOfficeMandal(selectedOffice),
        district: selectedOffice.District,
        state: selectedOffice.State,
      } : {}),
    } : current)

    if (selectedOffice) setRentalPinLookupStatus(null)
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
    let savedRecordId = rentalModal.id
    let rentalRecordSaved = false
    try {
      const payload = {
        farmerId: Number(currentFarmer.id),
        tenantName: String(rentalForm.tenantName || '').trim(),
        tenantCountryCode: rentalForm.tenantCountryCode || '+91',
        tenantMobile: `${rentalForm.tenantCountryCode || '+91'} ${String(rentalForm.tenantMobile || '').replace(/\D/g, '')}`.trim(),
        surveyNumber: String(rentalForm.surveyNumber || '').trim(),
        landArea: Number(rentalForm.landArea || 0),
        areaUnit: rentalForm.areaUnit || 'Acres',
        village: String(rentalForm.village || '').trim(),
        mandal: String(rentalForm.mandal || '').trim(),
        district: String(rentalForm.district || '').trim(),
        state: String(rentalForm.state || '').trim(),
        pinCode: String(rentalForm.pinCode || '').trim(),
        rentAmount: Number(rentalForm.rentAmount || 0),
        rentFrequency: rentalForm.rentFrequency || 'Monthly',
        leaseStartDate: rentalForm.leaseStartDate || '',
        leaseEndDate: rentalForm.leaseEndDate || '',
        status: rentalForm.status || 'Active',
        remarks: rentalForm.remarks ? String(rentalForm.remarks).trim() : null,
      }

      if (rentalModal.mode === 'edit') {
        await api.put(`/api/RentalLands/${rentalModal.id}`, payload)
        rentalRecordSaved = true
      } else {
        const response = await api.post('/api/RentalLands', payload)
        savedRecordId = response.data?.id ?? response.data?.Id
        if (!savedRecordId) throw new Error('Rental land was saved, but the API did not return its record ID.')
        rentalRecordSaved = true
        setRentalModal({ mode: 'edit', id: savedRecordId })
      }

      for (const file of rentalFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await api.post(
          `/api/RentalLands/${savedRecordId}/documents`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          }
        )
        const uploadedDocument = response.data
        setRentalForm(current => current ? {
          ...current,
          documents: [...(current.documents || []), {
            id: uploadedDocument.id ?? uploadedDocument.Id,
            fileName: uploadedDocument.fileName ?? uploadedDocument.FileName ?? file.name,
            fileSize: Number(uploadedDocument.fileSize ?? uploadedDocument.FileSize ?? file.size),
            uploadedAt: uploadedDocument.uploadedAt ?? uploadedDocument.UploadedAt ?? '',
          }],
        } : current)
        setRentalFiles(current => current.filter(pendingFile => pendingFile !== file))
      }

      setRentalModal(null)
      setRentalForm(null)
      setRentalFiles([])
      showToast(
        rentalFiles.length
          ? 'Rental land and agreement documents saved successfully.'
          : rentalModal.mode === 'edit' ? 'Rental land updated successfully.' : 'Rental land saved successfully.'
      )
      await fetchRentalLands()
    } catch (error) {
      const message = errorText(error, 'save rental land')
      setRentalError(rentalRecordSaved
        ? `Rental details were saved, but an agreement could not be uploaded. ${message}`
        : message)
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
                {(currentFarmer.name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'F'}
              </div>
              <div className="fm-profile-name">
                <span className="fm-profile-eyebrow">MY FARMER PROFILE</span>
                <h2>{currentFarmer.name}</h2>
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
                    : profileFarmSummary.location
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
              className={`fm-filter-btn${rentalStatusFilter === s ? ' active' : ''}`}
              onClick={() => setRentalStatusFilter(s)}
              aria-pressed={rentalStatusFilter === s}
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

      <div className="fm-table-wrap fm-rental-table-wrap">
        <table className="fm-table fm-rental-table">
          <colgroup>
            <col style={{ width: '16%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="fm-th-tenant">Tenant / Receiver</th>
              <th className="fm-th-mobile">Mobile</th>
              <th className="fm-th-survey">Survey No.</th>
              <th className="fm-th-area">Land Area</th>
              <th className="fm-th-rent">Rent</th>
              <th className="fm-th-lease">Lease Period</th>
              <th className="fm-th-status">Status</th>
              <th className="fm-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !hasLoaded ? (
              <tr>
                <td colSpan={8} className="fm-state-cell">
                  <div className="fm-loading-state"><div className="fm-loading-spinner"></div><p>Loading rental land…</p></div>
                </td>
              </tr>
            ) : !currentFarmer ? (
              <tr>
                <td colSpan={8} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">⚠</div>
                    <p>No linked land owner profile.</p>
                    <span>Link a farmer profile to view and save rental land records.</span>
                  </div>
                </td>
              </tr>
            ) : rentalLoadError ? (
              <tr>
                <td colSpan={8} className="fm-state-cell">
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
                <td colSpan={8} className="fm-state-cell">
                  <div className="fm-loading-state"><div className="fm-loading-spinner"></div><p>Loading rental land…</p></div>
                </td>
              </tr>
            ) : visibleRentalLands.length === 0 ? (
              <tr>
                <td colSpan={8} className="fm-state-cell">
                  <div className="fm-empty-state">
                    <div className="fm-empty-icon">🌾</div>
                    <p>{rentalLands.length ? 'No rental land matches your search.' : 'No rental land records to display.'}</p>
                    <span>{rentalLands.length ? 'Try another tenant, survey number, or location.' : 'Use Add Rental Land to record tenant and lease details.'}</span>
                  </div>
                </td>
              </tr>
            ) : visibleRentalLands.map(record => (
                <tr key={record.id}>
                  <td className="fm-td-tenant">
                    <button
                      type="button"
                      className="fm-tenant-name-button"
                      onClick={() => setSelectedRentalDetail(record)}
                      aria-label={`View tenant and rental details for ${record.tenantName}`}
                    >
                      {record.tenantName}
                    </button>
                  </td>
                  <td className="fm-td-mobile">{record.tenantMobile}</td>
                  <td className="fm-td-survey">{record.surveyNumber}</td>
                  <td className="fm-td-area">{Number(record.landArea).toFixed(2)} {record.areaUnit}</td>
                  <td className="fm-td-rent">₹{Number(record.rentAmount).toLocaleString('en-IN')} / {record.rentFrequency}</td>
                  <td className="fm-td-lease">{formatLeaseDate(record.leaseStartDate)} – {formatLeaseDate(record.leaseEndDate)}</td>
                  <td className="fm-td-status">
                    <span className={`fm-status-pill fm-status-${record.status.toLowerCase()} fm-rental-status`}>
                      <span className="fm-status-dot"></span>{record.status}
                    </span>
                  </td>
                  <td className="fm-td-actions">
                    <div className="fm-actions">
                      <button
                        className={`fm-action-btn fm-menu-trigger ${openRentalMenuId === record.id ? 'active' : ''}`}
                        type="button"
                        title="Actions"
                        aria-label={`Actions for ${record.tenantName}`}
                        aria-haspopup="menu"
                        aria-expanded={openRentalMenuId === record.id}
                        onClick={event => {
                          event.stopPropagation()
                          if (openRentalMenuId === record.id) {
                            setOpenRentalMenuId(null)
                            setRentalMenuPosition(null)
                            return
                          }

                          const buttonRect = event.currentTarget.getBoundingClientRect()
                          const menuWidth = 150
                          setRentalMenuPosition({
                            top: buttonRect.bottom + 4,
                            left: Math.max(
                              8,
                              Math.min(
                                buttonRect.left + buttonRect.width / 2 - menuWidth / 2,
                                window.innerWidth - menuWidth - 8
                              )
                            ),
                          })
                          setOpenRentalMenuId(record.id)
                        }}
                      >
                        <svg className="fm-action-dots-svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                          <circle cx="8" cy="3" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="13" r="1.5" />
                        </svg>
                      </button>
                      {openRentalMenuId === record.id && rentalMenuPosition && createPortal(
                        <div
                          className="fm-action-dropdown"
                          style={{ top: rentalMenuPosition.top, left: rentalMenuPosition.left }}
                          role="menu"
                          onClick={event => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="fm-action-menu-item"
                            role="menuitem"
                            onClick={() => {
                              setOpenRentalMenuId(null)
                              setRentalMenuPosition(null)
                              setSelectedRentalDetail(record)
                            }}
                          >
                            <span className="fm-menu-item-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </span>
                            View
                          </button>
                          <button
                            type="button"
                            className="fm-action-menu-item"
                            role="menuitem"
                            onClick={() => {
                              setOpenRentalMenuId(null)
                              setRentalMenuPosition(null)
                              openRentalLandForm(record, 'edit')
                            }}
                          >
                            <span className="fm-menu-item-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </span>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="fm-action-menu-item delete"
                            role="menuitem"
                            disabled={deletingRentalId !== null}
                            onClick={() => {
                              setOpenRentalMenuId(null)
                              setRentalMenuPosition(null)
                              handleDeleteRentalLand(record)
                            }}
                          >
                            <span className="fm-menu-item-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </span>
                            Delete
                          </button>
                        </div>,
                        document.body
                      )}
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
      {selectedRentalDetail && (
        <RentalLandDetails
          record={selectedRentalDetail}
          records={rentalLands}
          farmer={currentFarmer}
          onClose={() => setSelectedRentalDetail(null)}
          onDownloadDocument={handleDownloadRentalDocument}
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
      {rentalModal && rentalForm && (
        <div className="fm-overlay" role="presentation" onClick={event => {
          if (event.target === event.currentTarget && !savingRental) setRentalModal(null)
        }}>
          <section className="fm-modal fm-rental-modal" role="dialog" aria-modal="true" aria-labelledby="fm-rental-modal-title">
            <header className="fm-modal-head">
              <div>
                <h2 id="fm-rental-modal-title">
                  {rentalReadOnly ? 'Rental Land Details' : rentalModal.mode === 'edit' ? 'Edit Rental Land' : 'Add Rental Land'}
                </h2>
                <p>
                  {currentFarmer ? `Land leased out by ${currentFarmer.name}.` : 'Record the person and plot receiving the leased land.'}
                </p>
              </div>
              <button
                className="fm-close"
                onClick={() => !savingRental && setRentalModal(null)}
                aria-label="Close"
                type="button"
                disabled={savingRental}
              >✕</button>
            </header>
            {rentalError && <div className="fm-form-error-banner" role="alert">{rentalError}</div>}
            <form className="fm-form" onSubmit={handleRentalLandSubmit}>
              <div className="fm-form-body">
                <div className="fm-section-label">Tenant / Receiver</div>
                <div className="fm-row fm-rental-two-field-row">
                  <div className="fm-field">
                    <label htmlFor="rental-tenant-name">Tenant / Receiver Name <span className="fm-req">*</span></label>
                    <input id="rental-tenant-name" name="tenantName" value={rentalForm.tenantName} onChange={event => setRentalForm({ ...rentalForm, tenantName: event.target.value })} required maxLength={150} readOnly={rentalReadOnly} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-tenant-mobile">Mobile Number <span className="fm-req">*</span></label>
                    <div className="fm-phone-input-wrap">
                      <select
                        id="rental-tenant-country-code"
                        name="tenantCountryCode"
                        className="fm-phone-country-code"
                        value={rentalForm.tenantCountryCode || '+91'}
                        onChange={event => {
                          const tenantCountryCode = event.target.value
                          setRentalForm(current => ({
                            ...current,
                            tenantCountryCode,
                            tenantMobile: current.tenantMobile.slice(0, maxLocalPhoneDigits(tenantCountryCode)),
                          }))
                        }}
                        aria-label="Country calling code"
                        disabled={rentalReadOnly}
                      >
                        {RENTAL_PHONE_COUNTRY_CODES.map(({ code, country }) => (
                          <option key={code} value={code}>{code} {country.split(/[ /]/)[0].slice(0, 3)}</option>
                        ))}
                      </select>
                      <input
                        id="rental-tenant-mobile"
                        name="tenantMobile"
                        className="fm-phone-number"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={rentalForm.tenantMobile}
                        onChange={event => setRentalForm({
                          ...rentalForm,
                          tenantMobile: event.target.value.replace(/\D/g, '').slice(0, maxLocalPhoneDigits(rentalForm.tenantCountryCode)),
                        })}
                        required
                        maxLength={maxLocalPhoneDigits(rentalForm.tenantCountryCode)}
                        pattern={`[0-9]{6,${maxLocalPhoneDigits(rentalForm.tenantCountryCode)}}`}
                        title={`Enter 6 to ${maxLocalPhoneDigits(rentalForm.tenantCountryCode)} digits after the country code.`}
                        readOnly={rentalReadOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="fm-section-label">Plot and Lease Details</div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-survey-number">Survey Number <span className="fm-req">*</span></label>
                    <input id="rental-survey-number" name="surveyNumber" value={rentalForm.surveyNumber} onChange={event => setRentalForm({ ...rentalForm, surveyNumber: event.target.value })} required maxLength={100} readOnly={rentalReadOnly} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-land-area">Land Area <span className="fm-req">*</span></label>
                    <input id="rental-land-area" name="landArea" type="number" value={rentalForm.landArea} onChange={event => setRentalForm({ ...rentalForm, landArea: event.target.value })} required min="0.01" max="100000" step="any" disabled={rentalReadOnly} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-area-unit">Area Unit <span className="fm-req">*</span></label>
                    <select id="rental-area-unit" name="areaUnit" value={rentalForm.areaUnit} onChange={event => setRentalForm({ ...rentalForm, areaUnit: event.target.value })} required disabled={rentalReadOnly}>
                      {['Acres', 'Hectares', 'Cents', 'Square Feet', 'Gunthas'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </div>
                </div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-village">Village <span className="fm-req">*</span></label>
                    <input
                      id="rental-village"
                      name="village"
                      list={rentalPinPostOffices.length > 1 ? 'rental-pin-village-options' : undefined}
                      value={rentalForm.village}
                      onChange={handleRentalVillageChange}
                      title={rentalPinPostOffices.length > 1 ? 'This PIN matches multiple post offices. Choose the correct village from the suggestions if needed.' : undefined}
                      required
                      maxLength={100}
                      readOnly={rentalReadOnly || rentalPinLookupStatus?.type === 'loading'}
                    />
                    {rentalPinPostOffices.length > 1 && (
                      <datalist id="rental-pin-village-options">
                        {rentalPinPostOffices.map((office, index) => (
                          <option key={`${office.Name}-${index}`} value={office.Name} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-mandal">Mandal <span className="fm-req">*</span></label>
                    <input id="rental-mandal" name="mandal" value={rentalForm.mandal} onChange={event => setRentalForm({ ...rentalForm, mandal: event.target.value })} required maxLength={100} readOnly={rentalReadOnly || rentalPinLookupStatus?.type === 'loading'} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-district">District <span className="fm-req">*</span></label>
                    <input id="rental-district" name="district" value={rentalForm.district} onChange={event => setRentalForm({ ...rentalForm, district: event.target.value })} required maxLength={100} readOnly={rentalReadOnly || rentalPinLookupStatus?.type === 'loading'} />
                  </div>
                </div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-state">State <span className="fm-req">*</span></label>
                    <input
                      id="rental-state"
                      name="state"
                      value={rentalForm.state}
                      onChange={event => setRentalForm({ ...rentalForm, state: event.target.value })}
                      required
                      maxLength={100}
                      readOnly={rentalReadOnly || rentalPinLookupStatus?.type === 'loading'}
                    />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-pin-code">PIN Code <span className="fm-req">*</span></label>
                    <input
                      id="rental-pin-code"
                      name="pinCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={rentalForm.pinCode}
                      onChange={handleRentalPinCodeChange}
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      title="Enter a 6-digit PIN code."
                      readOnly={rentalReadOnly}
                      aria-describedby={rentalPinLookupStatus ? 'rental-pin-lookup-status' : undefined}
                    />
                    {rentalPinLookupStatus && (
                      <span
                        id="rental-pin-lookup-status"
                        className="fm-rental-pin-status-sr-only"
                        role={rentalPinLookupStatus.type === 'error' ? 'alert' : 'status'}
                      >
                        {rentalPinLookupStatus.message}
                      </span>
                    )}
                  </div>
                </div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-rent-amount">Rent Amount <span className="fm-req">*</span></label>
                    <input id="rental-rent-amount" name="rentAmount" type="number" value={rentalForm.rentAmount} onChange={event => setRentalForm({ ...rentalForm, rentAmount: event.target.value })} required min="0.01" max="1000000000" step="0.01" disabled={rentalReadOnly} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-rent-frequency">Rent Frequency <span className="fm-req">*</span></label>
                    <select id="rental-rent-frequency" name="rentFrequency" value={rentalForm.rentFrequency} onChange={event => setRentalForm({ ...rentalForm, rentFrequency: event.target.value })} required disabled={rentalReadOnly}>
                      {['Monthly', 'Yearly', 'Seasonal', 'One-time'].map(frequency => <option key={frequency} value={frequency}>{frequency}</option>)}
                    </select>
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-lease-start">Lease Start Date <span className="fm-req">*</span></label>
                    <input id="rental-lease-start" name="leaseStartDate" type="date" value={rentalForm.leaseStartDate} onChange={event => setRentalForm({ ...rentalForm, leaseStartDate: event.target.value })} required disabled={rentalReadOnly} />
                  </div>
                </div>
                <div className="fm-row">
                  <div className="fm-field">
                    <label htmlFor="rental-lease-end">Lease End Date <span className="fm-req">*</span></label>
                    <input id="rental-lease-end" name="leaseEndDate" type="date" value={rentalForm.leaseEndDate} onChange={event => setRentalForm({ ...rentalForm, leaseEndDate: event.target.value })} required min={rentalForm.leaseStartDate || undefined} disabled={rentalReadOnly} />
                  </div>
                  <div className="fm-field">
                    <label htmlFor="rental-status">Status <span className="fm-req">*</span></label>
                    <select id="rental-status" name="status" value={rentalForm.status || 'Active'} onChange={event => setRentalForm({ ...rentalForm, status: event.target.value })} required disabled={rentalReadOnly}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="fm-section-label">Rental Agreement Documents</div>
                <div className="fm-field fm-rental-document-field">
                  <label htmlFor="rental-agreement-files">Agreements (Optional)</label>
                  {!rentalReadOnly && (
                    <>
                      <div className="fm-rental-file-picker">
                        <input
                          id="rental-agreement-files"
                          className="fm-rental-file-input"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          onChange={handleRentalDocumentSelection}
                          disabled={savingRental}
                        />
                        <label className="fm-rental-file-button" htmlFor="rental-agreement-files">Choose Files</label>
                        {rentalFiles.length ? (
                          <div className="fm-rental-file-selected-list" aria-live="polite">
                            {rentalFiles.map((file, index) => (
                              <div className="fm-rental-file-selected-item" key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                                <span title={file.name}>
                                  {file.name} <small>{formatFileSize(file.size)}</small>
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${file.name}`}
                                  onClick={() => setRentalFiles(current => current.filter((_, fileIndex) => fileIndex !== index))}
                                  disabled={savingRental}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="fm-rental-file-selected" aria-live="polite">No files selected</span>
                        )}
                      </div>
                      <span className="fm-rental-document-help">
                        PDF, Word, JPG, or PNG · Up to {RENTAL_DOCUMENT_MAX_FILES} files · 10 MB maximum each
                      </span>
                    </>
                  )}
                  {rentalForm.documents?.length > 0 && (
                    <div className="fm-rental-document-list">
                      {rentalForm.documents.map(document => (
                        <div className="fm-rental-document-item" key={document.id}>
                          <span>{document.fileName} <small>{formatFileSize(document.fileSize)}</small></span>
                          <button
                            type="button"
                            onClick={() => handleDownloadRentalDocument(rentalForm.id || rentalModal.id, document)}
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {rentalReadOnly && !rentalForm.documents?.length && (
                    <span className="fm-rental-document-help">No rental agreements attached.</span>
                  )}
                </div>
              </div>
              <footer className="fm-modal-foot">
                <span className="fm-rental-note">
                  {currentFarmer ? 'Rental details will be saved with your linked farmer profile.' : 'A linked farmer profile is required to save rental details.'}
                </span>
                <div className="fm-tab-nav-btns">
                  {rentalReadOnly ? (
                    <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={() => setRentalModal(null)}>Close</button>
                  ) : (
                    <>
                      <button type="button" className="fm-btn-secondary fm-foot-btn" onClick={() => setRentalModal(null)} disabled={savingRental}>Cancel</button>
                      <button type="submit" className="fm-btn-primary fm-foot-btn" disabled={savingRental || !currentFarmer?.id}>
                        {savingRental ? 'Saving…' : rentalModal.mode === 'edit' ? 'Save Changes' : 'Save Rental Land'}
                      </button>
                    </>
                  )}
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
