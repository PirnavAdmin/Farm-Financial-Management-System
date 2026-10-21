import { useMemo, useRef, useState } from 'react'
import './farms.css'

const demoFarms = [
  { id: 'FARM-001', farmer: 'Ravi Kumar', farmName: 'Greenfield Farm', surveyNumber: '124/2A', landArea: '4.5', areaUnit: 'Acres', landType: 'Agricultural', ownershipType: 'Owned', village: 'Kondapalli', mandal: 'Ibrahimpatnam', district: 'NTR', irrigationType: 'Canal', soilType: 'Black cotton', status: 'Active', remarks: 'Paddy and chilli fields' },
  { id: 'FARM-002', farmer: 'Lakshmi Devi', farmName: 'Lakshmi Orchard', surveyNumber: '88/1', landArea: '2.25', areaUnit: 'Hectares', landType: 'Agricultural', ownershipType: 'Leased', village: 'Mangalagiri', mandal: 'Mangalagiri', district: 'Guntur', irrigationType: 'Borewell', soilType: 'Red loam', status: 'Active', remarks: 'Mango and guava orchard' },
  { id: 'FARM-003', farmer: 'Suresh Reddy', farmName: 'North Bund Plot', surveyNumber: '310/4B', landArea: '180', areaUnit: 'Cents', landType: 'Agricultural', ownershipType: 'Shared', village: 'Chilakaluripet', mandal: 'Chilakaluripet', district: 'Palnadu', irrigationType: 'Drip', soilType: 'Sandy loam', status: 'Active', remarks: '' },
  { id: 'FARM-004', farmer: 'Anitha Rao', farmName: 'Riverbend Fields', surveyNumber: '57/3', landArea: '96000', areaUnit: 'Square Feet', landType: 'Agricultural', ownershipType: 'Owned', village: 'Kuchipudi', mandal: 'Movva', district: 'Krishna', irrigationType: 'Canal', soilType: 'Alluvial', status: 'Inactive', remarks: 'Seasonal cultivation' },
  { id: 'FARM-005', farmer: 'Mohan Naidu', farmName: 'Sunrise Farm', surveyNumber: '19/2C', landArea: '7', areaUnit: 'Acres', landType: 'Agricultural', ownershipType: 'Leased', village: 'Nallapadu', mandal: 'Guntur', district: 'Guntur', irrigationType: 'Rain-fed', soilType: 'Red sandy', status: 'Active', remarks: 'Lease renewed in June' },
  { id: 'FARM-006', farmer: 'Padmaja Yadav', farmName: 'Hillview Lands', surveyNumber: '402/1', landArea: '1.8', areaUnit: 'Hectares', landType: 'Horticultural', ownershipType: 'Other', village: 'Atmakur', mandal: 'Singarayakonda', district: 'Prakasam', irrigationType: 'Sprinkler', soilType: 'Laterite', status: 'Active', remarks: 'Vegetable cultivation' },
  { id: 'FARM-007', farmer: 'Venkat Rao', farmName: 'Canal Side Plot', surveyNumber: '76/8A', landArea: '125', areaUnit: 'Cents', landType: 'Agricultural', ownershipType: 'Owned', village: 'Kankipadu', mandal: 'Kankipadu', district: 'Krishna', irrigationType: 'Canal', soilType: 'Clay loam', status: 'Inactive', remarks: '' },
  { id: 'FARM-008', farmer: 'Farzana Begum', farmName: 'Meadow Farm', surveyNumber: '211/5', landArea: '3.25', areaUnit: 'Acres', landType: 'Agricultural', ownershipType: 'Shared', village: 'Tenali', mandal: 'Tenali', district: 'Guntur', irrigationType: 'Borewell', soilType: 'Silty loam', status: 'Active', remarks: 'Shared with family members' },
]

const emptyForm = {
  farmer: '', farmName: '', surveyNumber: '', landArea: '', areaUnit: '', landType: '',
  ownershipType: 'Owned', village: '', mandal: '', district: '', irrigationType: '',
  soilType: '', status: 'Active', remarks: '',
}

const units = ['Acres', 'Hectares', 'Cents', 'Square Feet']
const ownershipTypes = ['Owned', 'Leased', 'Shared', 'Other']
const statuses = ['Active', 'Inactive']

function Field({ label, name, form, errors, onChange, required = false, options, type = 'text', readOnly = false }) {
  return <label className="farm-field">
    <span>{label}{required && <em> *</em>}</span>
    {options ? <select name={name} value={form[name] ?? ''} onChange={onChange} required={required} disabled={readOnly}>
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select> : <input name={name} type={type} value={form[name] ?? ''} onChange={onChange} required={required} readOnly={readOnly} min={type === 'number' ? '0' : undefined} step={type === 'number' ? 'any' : undefined} />}
    {errors?.[name] && <small className="farm-field-error">{errors[name]}</small>}
  </label>
}

export default function Farms({ initialFarms }) {
  const [farms, setFarms] = useState(() => Array.isArray(initialFarms) && initialFarms.length ? initialFarms : demoFarms)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [ownershipFilter, setOwnershipFilter] = useState('All ownership types')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return farms.filter((farm) => {
      const matchesQuery = !term || [farm.farmer, farm.farmName, farm.surveyNumber, farm.village, farm.mandal, farm.district, farm.landType, farm.ownershipType, farm.irrigationType, farm.soilType]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
      return matchesQuery && (statusFilter === 'All statuses' || farm.status === statusFilter)
        && (ownershipFilter === 'All ownership types' || farm.ownershipType === ownershipFilter)
    })
  }, [farms, query, statusFilter, ownershipFilter])

  function openForm(mode, farm = null) {
    submitLock.current = false
    setForm(farm ? { ...emptyForm, ...farm } : emptyForm)
    setErrors({})
    setFormError('')
    setModal({ mode, farm })
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  function validate() {
    const next = {}
    for (const [field, label] of [['farmer', 'Farmer'], ['farmName', 'Farm Name'], ['surveyNumber', 'Survey Number'], ['landArea', 'Land Area'], ['areaUnit', 'Area Unit']]) {
      if (!String(form[field] ?? '').trim()) next[field] = `${label} is required.`
    }
    const area = Number(form.landArea)
    if (String(form.landArea).trim() && (!Number.isFinite(area) || area <= 0)) next.landArea = 'Land Area must be greater than zero.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function saveFarm(event) {
    event.preventDefault()
    if (submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      if (!validate()) {
        submitLock.current = false
        return
      }
      const normalized = { ...form, farmer: form.farmer.trim(), farmName: form.farmName.trim(), surveyNumber: form.surveyNumber.trim(), landArea: String(Number(form.landArea)) }
      if (modal.mode === 'edit') {
        setFarms((current) => current.map((farm) => farm.id === modal.farm.id ? { ...farm, ...normalized } : farm))
      } else {
        setFarms((current) => [{ ...normalized, id: `FARM-${Date.now()}` }, ...current])
      }
      setModal(null)
      setFormError('')
    } catch {
      setFormError('Unable to save this farm. Please try again.')
      submitLock.current = false
    } finally {
      setSubmitting(false)
    }
  }

  function deleteFarm(farm) {
    if (!window.confirm(`Delete ${farm.farmName}? This only removes the record from this demonstration view.`)) return
    setFarms((current) => current.filter((item) => item.id !== farm.id))
  }

  const readOnly = modal?.mode === 'view'

  return <section className="farms-page">
    <div className="farms-heading">
      <div><div className="farms-eyebrow">MASTERS / LAND MANAGEMENT</div><h1>Farms</h1><p>Manage farm parcels, ownership, and land details.</p></div>
      <button className="farm-primary-button" type="button" onClick={() => openForm('add')}>＋ Add Farm</button>
    </div>

    <div className="farm-demo-notice"><strong>Demonstration data</strong><span>Sample records are stored in this page's React state only; they are not saved to the database.</span></div>

    <div className="farms-toolbar">
      <label className="farm-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search farms, farmers, survey no., location…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search farms" /></label>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
      <select value={ownershipFilter} onChange={(event) => setOwnershipFilter(event.target.value)} aria-label="Filter by ownership"><option>All ownership types</option>{ownershipTypes.map((type) => <option key={type}>{type}</option>)}</select>
      <span className="farm-record-count">{rows.length} {rows.length === 1 ? 'record' : 'records'}</span>
    </div>

    <div className="farms-table-wrap"><table className="farms-table">
      <thead><tr><th>FARM / SURVEY NO.</th><th>FARMER</th><th>LAND AREA</th><th>LOCATION</th><th>OWNERSHIP</th><th>IRRIGATION</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
      <tbody>{rows.map((farm) => <tr key={farm.id}>
        <td><strong>{farm.farmName}</strong><small>{farm.surveyNumber} · {farm.landType || 'Land type not set'}</small></td>
        <td>{farm.farmer}</td><td>{farm.landArea} {farm.areaUnit}</td>
        <td>{farm.village || '—'}<small>{[farm.mandal, farm.district].filter(Boolean).join(', ') || '—'}</small></td>
        <td>{farm.ownershipType || '—'}</td><td>{farm.irrigationType || '—'}</td>
        <td><span className={`farm-status ${farm.status === 'Active' ? 'is-active' : 'is-inactive'}`}>{farm.status}</span></td>
        <td><div className="farm-row-actions"><button type="button" aria-label={`View ${farm.farmName}`} onClick={() => openForm('view', farm)}>View</button><button type="button" aria-label={`Edit ${farm.farmName}`} onClick={() => openForm('edit', farm)}>Edit</button><button className="farm-delete-action" type="button" aria-label={`Delete ${farm.farmName}`} onClick={() => deleteFarm(farm)}>Delete</button></div></td>
      </tr>)}
      {!rows.length && <tr><td className="farms-empty" colSpan="8"><strong>No farms found</strong><span>Try another search or filter.</span></td></tr>}
      </tbody>
    </table></div>

    {modal && <div className="farm-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
      <section className="farm-modal" role="dialog" aria-modal="true" aria-labelledby="farm-modal-title">
        <header className="farm-modal-header"><div><div className="farms-eyebrow">LAND RECORD</div><h2 id="farm-modal-title">{modal.mode === 'add' ? 'Add Farm' : modal.mode === 'edit' ? 'Edit Farm' : 'Farm Details'}</h2></div><button type="button" className="farm-close-button" aria-label="Close" onClick={() => setModal(null)}>×</button></header>
        {formError && <p className="farm-form-error" role="alert">{formError}</p>}
        <form onSubmit={saveFarm} noValidate>
          <div className="farm-form-grid">
            <Field label="Farmer" name="farmer" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} />
            <Field label="Farm Name" name="farmName" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} />
            <Field label="Survey Number" name="surveyNumber" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} />
            <Field label="Land Area" name="landArea" type="number" form={form} errors={errors} onChange={updateField} required readOnly={readOnly} />
            <Field label="Area Unit" name="areaUnit" form={form} errors={errors} onChange={updateField} required options={units} readOnly={readOnly} />
            <Field label="Land Type" name="landType" form={form} errors={errors} onChange={updateField} readOnly={readOnly} />
            <Field label="Ownership Type" name="ownershipType" form={form} errors={errors} onChange={updateField} options={ownershipTypes} readOnly={readOnly} />
            <Field label="Village" name="village" form={form} errors={errors} onChange={updateField} readOnly={readOnly} />
            <Field label="Mandal" name="mandal" form={form} errors={errors} onChange={updateField} readOnly={readOnly} />
            <Field label="District" name="district" form={form} errors={errors} onChange={updateField} readOnly={readOnly} />
            <Field label="Irrigation Type" name="irrigationType" form={form} errors={errors} onChange={updateField} readOnly={readOnly} />
            <Field label="Soil Type" name="soilType" form={form} errors={errors} onChange={updateField} readOnly={readOnly} />
            <Field label="Status" name="status" form={form} errors={errors} onChange={updateField} options={statuses} readOnly={readOnly} />
            <label className="farm-field farm-field-wide"><span>Remarks</span><textarea name="remarks" value={form.remarks ?? ''} onChange={updateField} rows="3" readOnly={readOnly} /></label>
          </div>
          <footer className="farm-modal-footer"><button className="farm-secondary-button" type="button" onClick={() => setModal(null)}>{readOnly ? 'Close' : 'Cancel'}</button>{!readOnly && <button className="farm-primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving…' : modal.mode === 'edit' ? 'Save Changes' : 'Add Farm'}</button>}</footer>
        </form>
      </section>
    </div>}
  </section>
}
