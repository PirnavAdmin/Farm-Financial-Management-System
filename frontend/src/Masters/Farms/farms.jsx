import { useEffect, useMemo, useRef, useState } from 'react'
import api, { BUSINESS_API_BASE_URL } from '../../services/api'
import './farms.css'

const emptyForm = { farmer: '', farmerId: '', farmName: '', surveyNumber: '', landArea: '', areaUnit: '', landType: '', ownershipType: '', village: '', mandal: '', district: '', irrigationType: '', soilType: '', status: 'Active', remarks: '' }
const emptyLookups = { units: [], ownershipTypes: [], statuses: [], landTypes: [], irrigationSources: [], soilTypes: [] }
const unwrap = (response) => response?.data?.data ?? response?.data ?? response
function records(value) {
  if (Array.isArray(value)) return value
  const nested = value?.items || value?.results || value?.records || value?.farms || value?.farmers || value?.landTypes || value?.values || value?.data
  return Array.isArray(nested) ? nested : nested && typeof nested === 'object' ? records(nested) : []
}
const first = (obj, ...keys) => keys.map((key) => obj?.[key]).find((value) => value !== undefined && value !== null)
function mapFarm(raw) {
  const land = raw.landDetails || raw.primaryLandParcel || raw.land || raw
  const farmer = raw.farmer || raw.farmerDetails || {}
  const areaUnit = first(land, 'areaUnit', 'areaUnitName', 'unit') || ''
  const ownership = first(raw, 'ownershipType', 'ownershipTypeName') || ''
  return {
    ...raw, id: first(raw, 'id', 'farmId'), farmerId: first(raw, 'farmerId') ?? first(farmer, 'id', 'farmerId'),
    farmer: typeof farmer === 'string' ? farmer : first(farmer, 'fullName', 'name') || first(raw, 'farmerName', 'ownerName') || '',
    farmName: first(raw, 'farmName', 'name') || '', surveyNumber: first(land, 'surveyNumber', 'surveyNo') || '',
    landArea: String(first(land, 'landArea', 'area', 'areaValue') ?? ''), areaUnit: typeof areaUnit === 'string' ? areaUnit : areaUnit.name || areaUnit.unitName || '',
    landType: first(land, 'landTypeName', 'landType')?.name || first(land, 'landTypeName', 'landType') || '',
    ownershipType: typeof ownership === 'string' ? ownership : ownership.name || ownership.ownershipName || '',
    village: first(land, 'village', 'villageName') || '', mandal: first(land, 'mandal', 'mandalName') || '', district: first(land, 'district', 'districtName') || '',
    irrigationType: first(land, 'irrigationType', 'irrigationSource', 'irrigationSourceName')?.name || first(land, 'irrigationType', 'irrigationSource', 'irrigationSourceName') || '',
    soilType: first(land, 'soilType', 'soilTypeName')?.name || first(land, 'soilType', 'soilTypeName') || '',
    status: String(first(raw, 'status', 'statusName', 'isActive') ?? 'Active') === 'false' ? 'Inactive' : first(raw, 'status', 'statusName') || (raw.isActive === false ? 'Inactive' : 'Active'),
    remarks: first(land, 'remarks', 'description') || '',
  }
}
async function request(url, method = 'GET', data) {
  const response = await api.request({ baseURL: BUSINESS_API_BASE_URL, url, method, data })
  const result = unwrap(response)
  if (result?.success === false) throw new Error(result.message || 'The farm request failed.')
  return result
}
function apiErrorMessage(error, fallback) {
  const data = error.response?.data
  if (data?.errors && typeof data.errors === 'object') {
    const details = Object.entries(data.errors).flatMap(([field, messages]) => (Array.isArray(messages) ? messages : [messages]).map((message) => `${field}: ${message}`)).join(' ')
    if (details) return details
  }
  if (typeof data === 'string' && data.trim()) return data
  return data?.detail || data?.message || data?.title || error.friendlyMessage || error.message || fallback
}
function Field({ label, name, form, errors, onChange, required = false, options, type = 'text', readOnly = false }) {
  return <label className="farm-field"><span>{label}{required && <em> *</em>}</span>
    {options ? <select name={name} value={form[name] ?? ''} onChange={onChange} required={required} disabled={readOnly}><option value="" disabled>Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}</select> : <input name={name} type={type} value={form[name] ?? ''} onChange={onChange} required={required} readOnly={readOnly} min={type === 'number' ? '0' : undefined} step={type === 'number' ? 'any' : undefined} />}
    {errors?.[name] && <small className="farm-field-error">{errors[name]}</small>}</label>
}

export default function Farms() {
  const [farms, setFarms] = useState([]), [farmers, setFarmers] = useState([]), [lookups, setLookups] = useState(emptyLookups)
  const [query, setQuery] = useState(''), [statusFilter, setStatusFilter] = useState('All statuses'), [ownershipFilter, setOwnershipFilter] = useState('All ownership types')
  const [modal, setModal] = useState(null), [form, setForm] = useState(emptyForm), [errors, setErrors] = useState({}), [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true), [submitting, setSubmitting] = useState(false), [toast, setToast] = useState('')
  const submitLock = useRef(false)

  async function loadFarms() {
    setLoading(true)
    try { const result = await request('/api/Farms'); setFarms(records(result).map(mapFarm)); setToast('') }
    catch (error) { setFarms([]); setToast(apiErrorMessage(error, 'Unable to load farms.')) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    loadFarms()
    Promise.allSettled([
      request('/api/Farmers'), request('/api/Masters/area-units'), request('/api/Masters/ownership-types'), request('/api/Masters/statuses'),
      request('/api/Masters/land-types'), request('/api/Masters/irrigation-sources'), request('/api/Masters/soil-types'),
    ]).then(([farmerRes, unitsRes, ownershipRes, statusesRes, landRes, irrigationRes, soilsRes]) => {
      if (farmerRes.status === 'fulfilled') setFarmers(records(farmerRes.value))
      const options = (result, key) => records(result?.value).map((item) => {
        if (typeof item === 'string' || typeof item === 'number') return { value: item, label: String(item) }
        const label = item.name ?? item[`${key}Name`] ?? item[key] ?? item.label ?? item.title ?? item.description ?? item.typeName ?? item.displayName
        return { value: item.id ?? item[`${key}Id`] ?? item.value ?? item.code ?? label, label: label ?? String(item.id ?? '') }
      }).filter((item) => item.label)
      setLookups({ units: options(unitsRes, 'areaUnit'), ownershipTypes: options(ownershipRes, 'ownershipType'), statuses: options(statusesRes, 'status'), landTypes: options(landRes, 'landType'), irrigationSources: options(irrigationRes, 'irrigationSource'), soilTypes: options(soilsRes, 'soilType') })
    })
  }, [])
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer) } }, [toast])

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return farms.filter((farm) => (!term || [farm.farmer, farm.farmName, farm.surveyNumber, farm.village, farm.mandal, farm.district, farm.landType, farm.ownershipType, farm.irrigationType, farm.soilType].some((value) => String(value ?? '').toLowerCase().includes(term)))
      && (statusFilter === 'All statuses' || farm.status === statusFilter) && (ownershipFilter === 'All ownership types' || farm.ownershipType === ownershipFilter))
  }, [farms, query, statusFilter, ownershipFilter])

  async function openForm(mode, farm = null) {
    submitLock.current = false; setErrors({}); setFormError(''); setModal({ mode, farm })
    if (!farm) { setForm(emptyForm); return }
    setForm({ ...emptyForm, ...farm, farmerId: farm.farmerId ?? '' })
    try { const detail = mapFarm(await request(`/api/Farms/${farm.id}`)); setForm({ ...emptyForm, ...detail, farmerId: detail.farmerId ?? '' }); setModal({ mode, farm: detail }) }
    catch (error) { setModal(null); setToast(apiErrorMessage(error, 'Unable to load farm details.')) }
  }
  function updateField(event) {
    const { name, value } = event.target
    if (name === 'farmerId') {
      const selected = farmers.find((item) => String(item.id ?? item.farmerId) === value)
      setForm((current) => ({ ...current, farmerId: value, farmer: selected?.fullName || selected?.name || selected?.farmerName || '' }))
    } else setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' })); setFormError('')
  }
  function validate() {
    const next = {}
    for (const [field, label] of [['farmerId', 'Farmer'], ['farmName', 'Farm Name'], ['surveyNumber', 'Survey Number'], ['landArea', 'Land Area'], ['areaUnit', 'Area Unit'], ['landType', 'Land Type']]) if (!String(form[field] ?? '').trim()) next[field] = `${label} is required.`
    const area = Number(form.landArea); if (String(form.landArea).trim() && (!Number.isFinite(area) || area <= 0)) next.landArea = 'Land Area must be greater than zero.'
    setErrors(next); return !Object.keys(next).length
  }
  async function saveFarm(event) {
    event.preventDefault(); if (submitLock.current) return; submitLock.current = true
    if (!validate()) { submitLock.current = false; return }
    setSubmitting(true)
    const unit = lookups.units.find((item) => String(item.value ?? item) === form.areaUnit)
    const landType = lookups.landTypes.find((item) => String(item.value ?? item) === form.landType)
    const ownership = lookups.ownershipTypes.find((item) => String(item.value ?? item) === form.ownershipType)
    const irrigation = lookups.irrigationSources.find((item) => String(item.value ?? item) === form.irrigationType)
    const soil = lookups.soilTypes.find((item) => String(item.value ?? item) === form.soilType)
    const payload = { farmerId: Number.isNaN(Number(form.farmerId)) ? form.farmerId : Number(form.farmerId), farmName: form.farmName.trim(), surveyNumber: form.surveyNumber.trim(), landArea: Number(form.landArea), areaUnit: unit?.label ?? form.areaUnit, areaUnitId: unit?.value, landType: landType?.label ?? form.landType, landTypeId: landType?.value, ownershipType: ownership?.label ?? form.ownershipType, ownershipTypeId: ownership?.value, village: form.village, mandal: form.mandal, district: form.district, irrigationType: irrigation?.label ?? form.irrigationType, irrigationSourceId: irrigation?.value, soilType: soil?.label ?? form.soilType, soilTypeId: soil?.value, status: form.status, remarks: form.remarks }
    try {
      await request(modal.mode === 'edit' ? `/api/Farms/${modal.farm.id}` : '/api/Farms', modal.mode === 'edit' ? 'PUT' : 'POST', payload)
      setModal(null); setToast(modal.mode === 'edit' ? 'Farm updated successfully.' : 'Farm added successfully.'); await loadFarms()
    } catch (error) { setFormError(apiErrorMessage(error, 'Unable to save this farm. Please try again.')) }
    finally { submitLock.current = false; setSubmitting(false) }
  }
  async function deleteFarm(farm) {
    if (!window.confirm(`Delete ${farm.farmName}? This will remove the farm and its associated land details and documents.`)) return
    try { await request(`/api/Farms/${farm.id}`, 'DELETE'); setToast(`${farm.farmName} was deleted.`); await loadFarms() }
    catch (error) { setToast(apiErrorMessage(error, 'Unable to delete this farm.')) }
  }
  const farmerOptions = farmers.map((farmer) => ({ value: farmer.id ?? farmer.farmerId, label: farmer.fullName || farmer.name || farmer.farmerName || farmer.email || String(farmer.id ?? farmer.farmerId) }))
  const readOnly = modal?.mode === 'view'
  return <section className="farms-page">
    <div className="farms-heading"><div><div className="farms-eyebrow">MASTERS / LAND MANAGEMENT</div><h1>Farms</h1><p>Manage farm parcels, ownership, and land details.</p></div><button className="farm-primary-button" type="button" onClick={() => openForm('add')}>＋ Add Farm</button></div>
    <div className="farm-demo-notice"><strong>Live API data</strong><span>Farm records and changes are saved through the AGRIMAN API.</span></div>
    {toast && <p className="farm-form-error" role="status">{toast}</p>}
    <div className="farms-toolbar"><label className="farm-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search farms, farmers, survey no., location…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search farms" /></label>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{lookups.statuses.map((item) => <option key={item.value ?? item} value={item.label ?? item}>{item.label ?? item}</option>)}</select>
      <select value={ownershipFilter} onChange={(event) => setOwnershipFilter(event.target.value)} aria-label="Filter by ownership"><option>All ownership types</option>{lookups.ownershipTypes.map((item) => <option key={item.value ?? item} value={item.label ?? item}>{item.label ?? item}</option>)}</select><span className="farm-record-count">{rows.length} {rows.length === 1 ? 'record' : 'records'}</span></div>
    <div className="farms-table-wrap"><table className="farms-table"><thead><tr><th>FARM / SURVEY NO.</th><th>FARMER</th><th>LAND AREA</th><th>LOCATION</th><th>OWNERSHIP</th><th>IRRIGATION</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
      {loading ? <tr><td className="farms-empty" colSpan="8"><strong>Loading farms…</strong></td></tr> : rows.map((farm) => <tr key={farm.id}><td><strong>{farm.farmName}</strong><small>{farm.surveyNumber} · {farm.landType || 'Land type not set'}</small></td><td>{farm.farmer}</td><td>{farm.landArea} {farm.areaUnit}</td><td>{farm.village || '—'}<small>{[farm.mandal, farm.district].filter(Boolean).join(', ') || '—'}</small></td><td>{farm.ownershipType || '—'}</td><td>{farm.irrigationType || '—'}</td><td><span className={`farm-status ${farm.status === 'Active' ? 'is-active' : 'is-inactive'}`}>{farm.status}</span></td><td><div className="farm-row-actions"><button type="button" aria-label={`View ${farm.farmName}`} onClick={() => openForm('view', farm)}>View</button><button type="button" aria-label={`Edit ${farm.farmName}`} onClick={() => openForm('edit', farm)}>Edit</button><button className="farm-delete-action" type="button" aria-label={`Delete ${farm.farmName}`} onClick={() => deleteFarm(farm)}>Delete</button></div></td></tr>)}
      {!loading && !rows.length && <tr><td className="farms-empty" colSpan="8"><strong>No farms found</strong><span>{toast || 'Try another search or filter.'}</span></td></tr>}</tbody></table></div>
    {modal && <div className="farm-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}><section className="farm-modal" role="dialog" aria-modal="true" aria-labelledby="farm-modal-title">
      <header className="farm-modal-header"><div><div className="farms-eyebrow">LAND RECORD</div><h2 id="farm-modal-title">{modal.mode === 'add' ? 'Add Farm' : modal.mode === 'edit' ? 'Edit Farm' : 'Farm Details'}</h2></div><button type="button" className="farm-close-button" aria-label="Close" onClick={() => setModal(null)}>×</button></header>
      {formError && <p className="farm-form-error" role="alert">{formError}</p>}<form onSubmit={saveFarm} noValidate><div className="farm-form-grid">
        <Field label="Farmer" name="farmerId" form={form} errors={errors} onChange={updateField} required options={farmerOptions} readOnly={readOnly} /><Field label="Farm Name" name="farmName" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} /><Field label="Survey Number" name="surveyNumber" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} /><Field label="Land Area" name="landArea" type="number" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} />
        <Field label="Area Unit" name="areaUnit" form={form} errors={errors} onChange={updateField} required options={lookups.units} readOnly={readOnly} /><Field label="Land Type" name="landType" form={form} errors={errors} onChange={updateField} required options={lookups.landTypes} readOnly={readOnly} /><Field label="Ownership Type" name="ownershipType" form={form} errors={errors} onChange={updateField} options={lookups.ownershipTypes} readOnly={readOnly} />
        <Field label="Village" name="village" form={form} errors={errors} onChange={updateField} readOnly={readOnly} /><Field label="Mandal" name="mandal" form={form} errors={errors} onChange={updateField} readOnly={readOnly} /><Field label="District" name="district" form={form} errors={errors} onChange={updateField} readOnly={readOnly} /><Field label="Irrigation Type" name="irrigationType" form={form} errors={errors} onChange={updateField} options={lookups.irrigationSources} readOnly={readOnly} /><Field label="Soil Type" name="soilType" form={form} errors={errors} onChange={updateField} options={lookups.soilTypes} readOnly={readOnly} /><Field label="Status" name="status" form={form} errors={errors} onChange={updateField} options={lookups.statuses} readOnly={readOnly} />
        <label className="farm-field farm-field-wide"><span>Remarks</span><textarea name="remarks" value={form.remarks ?? ''} onChange={updateField} rows="3" readOnly={readOnly} /></label></div>
        <footer className="farm-modal-footer"><button className="farm-secondary-button" type="button" onClick={() => setModal(null)}>{readOnly ? 'Close' : 'Cancel'}</button>{!readOnly && <button className="farm-primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving…' : modal.mode === 'edit' ? 'Save Changes' : 'Add Farm'}</button>}</footer></form>
    </section></div>}
  </section>
}
