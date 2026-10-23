import { useEffect, useState } from 'react'
import './company.css'
import api from '../../services/api.js'

const companyApiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://mushiness-rehab-fanatic.ngrok-free.dev')
const defaults = {
  companyName: '', businessType: 'Agriculture', email: '', phone: '', gstin: '', address: '',
  village: '', district: '', state: '', pinCode: '', financialYear: '2026-2027', currency: 'INR (₹)',
}
function currencyForForm(value) {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'rupee' || normalized === 'inr' || normalized.includes('₹')) return 'INR (₹)'
  if (normalized === 'dollar' || normalized === 'usd' || normalized.includes('$')) return 'USD ($)'
  return value || defaults.currency
}
function currencyForApi(value, currentValue) {
  if (value === 'INR (₹)') return 'rupee'
  if (value === 'USD ($)') return 'dollar'
  return currentValue || value
}
function companyFormValues(data, current) {
  return {
    ...current,
    companyName: data.companyName ?? current.companyName,
    email: data.email ?? current.email,
    phone: data.phone ?? current.phone,
    address: data.address ?? current.address,
    district: data.city ?? current.district,
    pinCode: data.postalCode ?? current.pinCode,
    gstin: data.taxNumber ?? current.gstin,
    currency: currencyForForm(data.currency ?? current.currency),
  }
}

export default function Company() {
  const [company, setCompany] = useState(defaults)
  const [apiCompany, setApiCompany] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadCompany() {
      setLoading(true)
      setErrorMessage('')
      try {
        const response = await api.get('/api/v1/company', { baseURL: companyApiBase })
        const data = response.data || {}
        if (!mounted) return
        setApiCompany(data)
        setCompany((current) => companyFormValues(data, current))
      } catch (requestError) {
        if (!mounted) return
        setErrorMessage(requestError.friendlyMessage || requestError.message || 'Unable to load company settings.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadCompany()
    return () => { mounted = false }
  }, [])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer) }, [toast])

  function update(event) { setCompany((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setErrorMessage('')
    try {
      const payload = {
        companyName: company.companyName,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.district,
        country: apiCompany.country ?? '',
        postalCode: company.pinCode,
        taxNumber: company.gstin,
        currency: currencyForApi(company.currency, apiCompany.currency),
        timezone: apiCompany.timezone ?? '',
        website: apiCompany.website ?? '',
      }
      const response = await api.put('/api/v1/company', payload, { baseURL: companyApiBase })
      const data = response.data && typeof response.data === 'object' ? response.data : { ...apiCompany, ...payload }
      setApiCompany(data)
      setCompany((current) => companyFormValues(data, current))
      setToast('Company settings saved.')
    } catch (requestError) {
      setErrorMessage(requestError.friendlyMessage || requestError.message || 'Unable to save company settings.')
      setToast('Company settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="users-page company-page">
    <div className="users-title-row"><div><div className="users-eyebrow">SETTINGS <span>/</span> COMPANY</div><h1>Company</h1><p>Manage your organization details and financial settings.</p></div><button className="users-add" type="submit" form="company-settings-form" disabled={saving || loading}>{saving ? 'Saving…' : 'Save Changes'}</button></div>
    <div className="users-stats"><article><span className="stat-symbol">▣</span><div><small>ORGANIZATION</small><strong>{company.companyName || (loading ? 'Loading…' : 'Company')}</strong><span className="stat-hint">Company profile</span></div></article><article><span className="stat-symbol active-symbol">₹</span><div><small>FINANCIAL YEAR</small><strong>{company.financialYear}</strong><span className="stat-hint">Current reporting year</span></div></article><article><span className="stat-symbol inactive-symbol">◎</span><div><small>CURRENCY</small><strong>{company.currency.split(' ')[0]}</strong><span className="stat-hint">Default currency</span></div></article></div>
    {errorMessage && <div className="company-api-message" role="alert">{errorMessage}</div>}
    <section className="users-panel company-panel"><form id="company-settings-form" onSubmit={submit}>
      <div className="company-section"><div className="company-section-heading"><h2>Organization Details</h2><p>Information used on reports and business records.</p></div><div className="form-grid">
        <label>Company Name<input name="companyName" value={company.companyName} onChange={update} required /></label>
        <label>Business Type<input name="businessType" value={company.businessType} onChange={update} /></label>
        <label>Email<input name="email" type="email" value={company.email} onChange={update} /></label>
        <label>Phone<input name="phone" value={company.phone} onChange={update} /></label>
        <label>GSTIN<input name="gstin" value={company.gstin} onChange={update} /></label>
        <label>PIN Code<input name="pinCode" value={company.pinCode} onChange={update} /></label>
        <label className="field-wide">Address<input name="address" value={company.address} onChange={update} /></label>
        <label>Village / Town<input name="village" value={company.village} onChange={update} /></label>
        <label>District<input name="district" value={company.district} onChange={update} /></label>
        <label>State<input name="state" value={company.state} onChange={update} /></label>
      </div></div>
      <div className="company-section"><div className="company-section-heading"><h2>Financial Settings</h2><p>Used for financial reports and transaction defaults.</p></div><div className="form-grid">
        <label>Financial Year<select name="financialYear" value={company.financialYear} onChange={update}><option>2025-2026</option><option>2026-2027</option><option>2027-2028</option></select></label>
        <label>Currency<select name="currency" value={company.currency} onChange={update}><option>INR (₹)</option><option>USD ($)</option></select></label>
      </div></div>
      <footer className="company-footer"><span>{loading ? 'Loading company settings…' : 'Company settings are loaded from the organization API.'}</span><button className="save-button" type="submit" disabled={saving || loading}>{saving ? 'Saving…' : 'Save Changes'}</button></footer>
    </form></section>
    {toast && <div className="user-toast" role="status"><span>{errorMessage ? '!' : '✓'}</span>{toast}<button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </div>
}
