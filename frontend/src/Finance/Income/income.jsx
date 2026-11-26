import TableActionMenu from '../../TableActionMenu'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  createIncome,
  deleteIncome,
  getIncomeById,
  listIncome,
  listIncomeCategories,
  listIncomeFarmers,
  listIncomeFarms,
  listIncomeCrops,
  updateIncome,
  STANDARD_AGRICULTURAL_CATEGORIES,
} from './incomeService.js'
import './income.css'

const paymentModes = [
  'Bank Transfer',
  'Cash',
  'Cheque',
  'UPI',
  'Auto Debit / ECS',
  'Other',
]

const paymentTermsOptions = [
  'Immediate / Cash on Delivery',
  'Net 15 Days',
  'Net 30 Days',
  'Net 45 Days',
  'Net 60 Days',
  'Advance Received',
  '50% Advance / 50% on Delivery',
  'Custom Terms',
]

const seasons = [
  'Kharif (Monsoon)',
  'Rabi (Winter)',
  'Zaid (Summer)',
  'Annual / Perennial',
  'Off-Season Greenhouse',
]

const incomeSources = [
  'Harvest Crop Sales',
  'Fruits and Vegetables Sales',
  'Dairy & Milk Produce',
  'Livestock & Animal Sales',
  'Agricultural By-product Sales',
  'Government Subsidies & Grants',
  'Crop Insurance Claim Settlement',
  'Farm Equipment / Tractor Rental',
  'Agricultural Contracting Services',
  'Other Operational Income',
]

const statuses = ['Received', 'Partially Paid', 'Pending', 'Overdue', 'Cancelled']
const pageSizes = [5, 10, 20, 50]

const commonUnits = ['kg', 'quintal', 'tonne', 'litre', 'bag', 'acre', 'hour', 'head', 'bundle', 'lump sum']
const commonBankCash = [
  'HDFC Farm Account',
  'SBI Agri Current Account',
  'ICICI Commercial Account',
  'District Cooperative Bank',
  'Cash in Hand',
  'Petty Cash',
]
const commonBuyers = [
  'Sri Lakshmi Traders (Mandi Merchant)',
  'District Dairy Cooperative Society',
  'Vardhman Cotton Mill',
  'National Agro Commodity Exchange',
  'Dept of Agriculture & Farmers Welfare',
  'Kisan Agro Mandi Yard',
  'Balram Farm Equipment Services',
  'Metro Cash & Carry Wholesale',
]

function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function createEmptyForm(incomeNo = '') {
  return {
    incomeDate: localDate(),
    incomeNo,
    incomeType: 'Crop Sales',
    incomeSource: 'Harvest Crop Sales',
    remarks: '',
    description: '',
    farmer: '',
    farm: '',
    fieldParcel: '',
    crop: '',
    season: 'Kharif (Monsoon)',
    calcMode: 'rate', // 'rate' | 'direct'
    quantity: '100',
    unit: 'quintal',
    rate: '2500',
    directAmount: '',
    discount: '0',
    otherCharges: '0',
    buyer: '',
    expectedCollectionDate: '',
    paymentTerms: 'Immediate / Cash on Delivery',
    amountReceived: '',
    paymentMode: 'Bank Transfer',
    bankCash: 'HDFC Farm Account',
    referenceNumber: '',
    invoiceNo: '',
    status: 'Received',
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'
  try {
    const d = value.slice(0, 10)
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${d}T00:00:00`))
  } catch {
    return value
  }
}

function amounts(values) {
  let grossAmount = 0
  if (values.calcMode === 'direct') {
    grossAmount = Number(values.directAmount) || 0
  } else {
    const quantity = Number(values.quantity) || 0
    const rate = Number(values.rate) || 0
    grossAmount = Math.round((quantity * rate + Number.EPSILON) * 100) / 100
  }
  const discount = Number(values.discount) || 0
  const otherCharges = Number(values.otherCharges) || 0
  const netAmount = Math.max(0, Math.round((grossAmount - discount + otherCharges + Number.EPSILON) * 100) / 100)

  // Received and Pending
  let received = values.amountReceived !== '' && values.amountReceived != null ? Number(values.amountReceived) : (values.status === 'Received' ? netAmount : 0)
  received = Math.max(0, Math.min(netAmount, received))
  const pending = Math.max(0, Math.round((netAmount - received + Number.EPSILON) * 100) / 100)

  return { grossAmount, netAmount, amountReceived: received, pendingAmount: pending }
}

function validateForm(values) {
  const errors = {}
  const { grossAmount, netAmount } = amounts(values)

  if (!values.incomeDate) errors.incomeDate = 'Income date is mandatory.'
  if (!values.incomeType) errors.incomeType = 'Select an income category.'

  if (values.calcMode === 'direct') {
    const direct = Number(values.directAmount)
    if (!values.directAmount || !Number.isFinite(direct) || direct <= 0) {
      errors.directAmount = 'Enter a valid direct amount greater than ₹0.'
    }
  } else {
    const quantity = Number(values.quantity)
    const rate = Number(values.rate)
    if (!values.quantity || !Number.isFinite(quantity) || quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0.'
    }
    if (!values.unit?.trim()) errors.unit = 'Unit of measurement is required.'
    if (values.rate === '' || !Number.isFinite(rate) || rate < 0) {
      errors.rate = 'Enter a valid rate per unit (0 or more).'
    }
  }

  const discount = Number(values.discount || 0)
  const otherCharges = Number(values.otherCharges || 0)
  if (!Number.isFinite(discount) || discount < 0) errors.discount = 'Discount cannot be negative.'
  if (!Number.isFinite(otherCharges) || otherCharges < 0) errors.otherCharges = 'Charges cannot be negative.'
  if (discount > grossAmount && grossAmount > 0) errors.discount = 'Discount cannot exceed gross amount.'

  if (netAmount <= 0) {
    errors.rate = 'Final net income amount must be greater than ₹0.'
  }

  if (!values.paymentMode) errors.paymentMode = 'Select a payment mode.'

  return errors
}

function toFormValues(record) {
  return {
    incomeDate: record.incomeDate || localDate(),
    incomeNo: record.incomeNo || '',
    incomeType: record.incomeType || 'Crop Sales',
    incomeSource: record.incomeSource || 'Harvest Crop Sales',
    description: record.description || '',
    farmer: record.farmer || '',
    farm: record.farm || '',
    fieldParcel: record.fieldParcel || '',
    crop: record.crop || '',
    season: record.season || 'Kharif (Monsoon)',
    calcMode: record.unit === 'lump sum' ? 'direct' : 'rate',
    quantity: String(record.quantity ?? 100),
    unit: record.unit || 'quintal',
    rate: String(record.rate ?? 2500),
    directAmount: String(record.netAmount || record.grossAmount || ''),
    discount: String(record.discount ?? 0),
    otherCharges: String(record.otherCharges ?? 0),
    buyer: record.buyer || '',
    expectedCollectionDate: record.expectedCollectionDate || '',
    paymentTerms: record.paymentTerms || 'Immediate / Cash on Delivery',
    amountReceived: String(record.amountReceived ?? ''),
    paymentMode: record.paymentMode || 'Bank Transfer',
    bankCash: record.bankCash || record.bankOrCash || '',
    referenceNumber: record.referenceNumber || '',
    invoiceNo: record.invoiceNo || '',
    remarks: record.remarks || '',
    status: record.status || 'Received',
  }
}

function toRecordValues(values) {
  const { grossAmount, netAmount, amountReceived, pendingAmount } = amounts(values)

  // Determine intelligent status
  let status = values.status
  if (values.status !== 'Cancelled') {
    if (pendingAmount <= 0) status = 'Received'
    else if (amountReceived > 0) status = 'Partially Paid'
    else if (values.expectedCollectionDate && values.expectedCollectionDate < localDate()) status = 'Overdue'
    else status = 'Pending'
  }

  return {
    incomeDate: values.incomeDate,
    incomeNo: values.incomeNo.trim(),
    incomeType: values.incomeType,
    incomeSource: values.incomeSource,
    farmer: values.farmer.trim(),
    farm: values.farm.trim(),
    fieldParcel: values.fieldParcel.trim(),
    crop: values.crop.trim(),
    season: values.season,
    buyer: values.buyer.trim(),
    quantity: values.calcMode === 'direct' ? 1 : Number(values.quantity),
    unit: values.calcMode === 'direct' ? 'lump sum' : values.unit.trim(),
    rate: values.calcMode === 'direct' ? grossAmount : Number(values.rate),
    grossAmount,
    discount: Number(values.discount || 0),
    otherCharges: Number(values.otherCharges || 0),
    netAmount,
    amount: netAmount,
    amountReceived,
    pendingAmount,
    paymentTerms: values.paymentTerms,
    expectedCollectionDate: values.expectedCollectionDate,
    paymentMode: values.paymentMode,
    bankCash: values.bankCash.trim(),
    referenceNumber: values.referenceNumber.trim(),
    invoiceNo: values.invoiceNo.trim(),
    remarks: values.remarks.trim(),
    status,
  }
}

function getCategoryClass(type = '') {
  const lower = type.toLowerCase()
  if (lower.includes('crop') || lower.includes('grain')) return 'crop-sales'
  if (lower.includes('fruit') || lower.includes('vegetable')) return 'fruit-sales'
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('livestock') || lower.includes('animal')) return 'milk-sales'
  if (lower.includes('subsidy') || lower.includes('grant')) return 'subsidy'
  if (lower.includes('insurance')) return 'insurance'
  if (lower.includes('rental') || lower.includes('equipment')) return 'rental'
  if (lower.includes('service')) return 'service'
  return 'other'
}

export default function Income() {
  const [activeTab, setActiveTab] = useState('registry') // 'registry' | 'reports'
  const [records, setRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [farmers, setFarmers] = useState([])
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const safeRecords = Array.isArray(records) ? records : []
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  const [screen, setScreen] = useState('list') // 'list' | 'add' | 'edit' | 'details'
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [formValues, setFormValues] = useState(createEmptyForm())
  const [formErrors, setFormErrors] = useState({})

  // Quick Collection Modal State
  const [collectionModal, setCollectionModal] = useState(null) // null | record
  const [collectionForm, setCollectionForm] = useState({
    date: localDate(),
    amount: '',
    mode: 'Bank Transfer',
    bank: 'HDFC Farm Account',
    ref: '',
    notes: '',
  })

  // Registry Filters
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [farmFilter, setFarmFilter] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Reports Sub-tab
  const [reportType, setReportType] = useState('summary')

  // Categories list options
  const incomeTypes = useMemo(() => {
    const list = [...new Set([
      ...categories.map(c => c.name),
      ...STANDARD_AGRICULTURAL_CATEGORIES,
      ...safeRecords.map(r => r.incomeType).filter(Boolean)
    ])]
    return list
  }, [categories, safeRecords])

  const commonFarmersList = useMemo(() => {
    return farmers.map(f => `${f.name} (#${f.id})`)
  }, [farmers])

  const commonFarmsList = useMemo(() => {
    const fromApi = farms.map(f => f.name)
    const fromRecords = safeRecords.map(r => r.farm).filter(Boolean)
    return [...new Set([...fromApi, ...fromRecords, 'North Field', 'Lake Farm', 'South Orchard', 'Green Valley Farm', 'East Meadow'])]
  }, [farms, safeRecords])

  const commonCropsList = useMemo(() => {
    const fromApi = crops.map(c => c.name)
    const fromRecords = safeRecords.map(r => r.crop).filter(Boolean)
    return [...new Set([...fromApi, ...fromRecords, 'Paddy', 'Wheat', 'Cotton', 'Cow Milk', 'Maize', 'Sugarcane', 'Tomatoes', 'Soybean', 'Chilli'])]
  }, [crops, safeRecords])

  // Load Data
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [incomeRes, typesRes, farmersRes, farmsRes, cropsRes] = await Promise.allSettled([
        listIncome(),
        listIncomeCategories(),
        listIncomeFarmers(),
        listIncomeFarms(),
        listIncomeCrops(),
      ])

      if (incomeRes.status === 'fulfilled') setRecords(incomeRes.value)
      if (typesRes.status === 'fulfilled') setCategories(typesRes.value)
      if (farmersRes.status === 'fulfilled') setFarmers(farmersRes.value)
      if (farmsRes.status === 'fulfilled') setFarms(farmsRes.value)
      if (cropsRes.status === 'fulfilled') setCrops(cropsRes.value)

      if (incomeRes.status === 'rejected') {
        const err = incomeRes.reason
        setError(err.friendlyMessage || err.message || 'Failed to load income records.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered Registry Records
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    return safeRecords.filter(r => {
      const matchesSearch = !term || [
        r.incomeNo,
        r.farmer,
        r.farm,
        r.fieldParcel,
        r.crop,
        r.buyer,
        r.incomeType,
        r.incomeSource,
        r.referenceNumber,
        r.invoiceNo,
        r.remarks,
      ].some(val => String(val || '').toLowerCase().includes(term))

      return (
        matchesSearch &&
        (!dateFrom || r.incomeDate >= dateFrom) &&
        (!dateTo || r.incomeDate <= dateTo) &&
        (!typeFilter || r.incomeType === typeFilter) &&
        (!sourceFilter || r.incomeSource === sourceFilter) &&
        (!farmFilter || r.farm === farmFilter) &&
        (!cropFilter || r.crop === cropFilter) &&
        (!seasonFilter || r.season === seasonFilter) &&
        (!statusFilter || r.status === statusFilter)
      )
    })
  }, [safeRecords, search, dateFrom, dateTo, typeFilter, sourceFilter, farmFilter, cropFilter, seasonFilter, statusFilter])

  // KPI Calculations
  const eligibleRecords = useMemo(() => safeRecords.filter(r => r.status !== 'Cancelled'), [safeRecords])
  const totalIncome = useMemo(() => eligibleRecords.reduce((sum, r) => sum + Number(r.netAmount || 0), 0), [eligibleRecords])
  const totalReceived = useMemo(() => eligibleRecords.reduce((sum, r) => sum + Number(r.amountReceived || 0), 0), [eligibleRecords])
  const totalPending = useMemo(() => eligibleRecords.reduce((sum, r) => sum + Number(r.pendingAmount || 0), 0), [eligibleRecords])

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthRecords = useMemo(() => eligibleRecords.filter(r => r.incomeDate?.startsWith(currentMonthStr)), [eligibleRecords, currentMonthStr])
  const thisMonthIncome = useMemo(() => monthRecords.reduce((sum, r) => sum + Number(r.netAmount || 0), 0), [monthRecords])

  // Status counts
  const countAll = safeRecords.length
  const countReceived = safeRecords.filter(r => r.status === 'Received').length
  const countPartially = safeRecords.filter(r => r.status === 'Partially Paid').length
  const countPending = safeRecords.filter(r => r.status === 'Pending').length
  const countOverdue = safeRecords.filter(r => r.status === 'Overdue').length
  const countCancelled = safeRecords.filter(r => r.status === 'Cancelled').length

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const calculatedAmounts = amounts(formValues)

  function clearMessages() {
    setNotice('')
    setError('')
  }

  function openAdd() {
    clearMessages()
    setSelectedRecord(null)
    setFormValues(createEmptyForm())
    setFormErrors({})
    setScreen('add')
  }

  async function openRecord(record, target) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    clearMessages()
    try {
      const detail = await getIncomeById(record.id)
      setSelectedRecord(detail)
      if (target === 'edit') {
        setFormValues(toFormValues(detail))
        setFormErrors({})
      }
      setScreen(target)
    } catch (err) {
      setError(err.friendlyMessage || err.message)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function openEdit(record) { return openRecord(record, 'edit') }
  function openDetails(record) { return openRecord(record, 'details') }

  function returnToList(msg = '') {
    setScreen('list')
    setSelectedRecord(null)
    setPendingDelete(null)
    setCollectionModal(null)
    setFormErrors({})
    setError('')
    if (msg) setNotice(msg)
  }

  function updateField(e) {
    const { name, value } = e.target
    setFormValues(curr => {
      const next = { ...curr, [name]: value }
      // Auto-update amountReceived if status is switched manually
      if (name === 'status' && value === 'Received') {
        next.amountReceived = ''
      }
      return next
    })
    setFormErrors(curr => ({ ...curr, [name]: '' }))
  }

  async function submitForm(e) {
    e.preventDefault()
    if (busyRef.current) return
    clearMessages()

    const validationErrors = validateForm(formValues)
    setFormErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    busyRef.current = true
    setBusy(true)
    try {
      const recordPayload = toRecordValues(formValues)
      if (screen === 'edit' && selectedRecord) {
        await updateIncome(selectedRecord.id, recordPayload, categories, farmers, selectedRecord)
        await loadData()
        returnToList('Income record updated successfully.')
      } else {
        await createIncome(recordPayload, categories, farmers)
        await loadData()
        returnToList('Income record registered successfully.')
      }
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Failed to save income record.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      await deleteIncome(pendingDelete.id)
      await loadData()
      returnToList(`Income record ${pendingDelete.incomeNo} was deleted.`)
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Failed to delete record.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  // Quick Collection Modal Handlers
  function openCollectionModal(record) {
    setCollectionModal(record)
    setCollectionForm({
      date: localDate(),
      amount: String(record.pendingAmount || record.netAmount || ''),
      mode: 'Bank Transfer',
      bank: record.bankCash || 'HDFC Farm Account',
      ref: '',
      notes: `Collection for ${record.incomeNo}`,
    })
  }

  async function submitQuickCollection(e) {
    e.preventDefault()
    if (!collectionModal || busyRef.current) return
    const collAmt = Number(collectionForm.amount)
    if (!collAmt || collAmt <= 0) {
      alert('Please enter a collection amount greater than ₹0.')
      return
    }

    busyRef.current = true
    setBusy(true)
    try {
      const prevRcvd = Number(collectionModal.amountReceived || 0)
      const newRcvd = Math.min(Number(collectionModal.netAmount), prevRcvd + collAmt)
      const newPending = Math.max(0, Number(collectionModal.netAmount) - newRcvd)
      const newStatus = newPending <= 0 ? 'Received' : 'Partially Paid'

      const updatedValues = {
        ...toFormValues(collectionModal),
        amountReceived: String(newRcvd),
        paymentMode: collectionForm.mode,
        bankCash: collectionForm.bank,
        referenceNumber: collectionForm.ref || collectionModal.referenceNumber,
        remarks: `${collectionModal.remarks ? collectionModal.remarks + '. ' : ''}Collected ${formatCurrency(collAmt)} on ${formatDate(collectionForm.date)}. ${collectionForm.notes}`.trim(),
        status: newStatus,
      }

      await updateIncome(collectionModal.id, toRecordValues(updatedValues), categories, farmers, collectionModal)
      await loadData()
      setCollectionModal(null)
      setNotice(`Recorded collection of ${formatCurrency(collAmt)} for ${collectionModal.incomeNo}.`)
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Failed to record collection.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function resetFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setTypeFilter('')
    setSourceFilter('')
    setFarmFilter('')
    setCropFilter('')
    setSeasonFilter('')
    setStatusFilter('')
    setPage(1)
  }

  // CSV Export for Registry
  function exportRegistryCSV() {
    if (!filteredRecords.length) return
    const headers = [
      'Income No',
      'Date',
      'Category',
      'Source',
      'Farmer',
      'Farm',
      'Crop',
      'Season',
      'Buyer',
      'Gross Amount',
      'Discount',
      'Other Charges',
      'Total Net Amount',
      'Amount Received',
      'Pending Amount',
      'Payment Mode',
      'Bank/Cash',
      'Reference No',
      'Collection Status',
      'Remarks',
    ]

    const rows = filteredRecords.map(r => [
      `"${r.incomeNo || ''}"`,
      `"${r.incomeDate || ''}"`,
      `"${r.incomeType || ''}"`,
      `"${r.incomeSource || ''}"`,
      `"${r.farmer || ''}"`,
      `"${r.farm || ''}"`,
      `"${r.crop || ''}"`,
      `"${r.season || ''}"`,
      `"${r.buyer || ''}"`,
      r.grossAmount ?? r.netAmount,
      r.discount ?? 0,
      r.otherCharges ?? 0,
      r.netAmount,
      r.amountReceived,
      r.pendingAmount,
      `"${r.paymentMode || ''}"`,
      `"${r.bankCash || ''}"`,
      `"${r.referenceNumber || ''}"`,
      `"${r.status || ''}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `AGRIMAN_Income_Ledger_${localDate()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="income-page">
      {/* Dynamic Datalists */}
      <datalist id="common-farmers">
        {commonFarmersList.map(f => <option key={f} value={f} />)}
      </datalist>
      <datalist id="common-farms">
        {commonFarmsList.map(f => <option key={f} value={f} />)}
      </datalist>
      <datalist id="common-crops">
        {commonCropsList.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="common-units">
        {commonUnits.map(u => <option key={u} value={u} />)}
      </datalist>
      <datalist id="common-buyers">
        {commonBuyers.map(b => <option key={b} value={b} />)}
      </datalist>
      <datalist id="common-bank-cash">
        {commonBankCash.map(b => <option key={b} value={b} />)}
      </datalist>

      {/* Main View Router */}
      {screen === 'list' ? (
        <>
          {/* Header */}
          <header className="income-page-heading">
            <div>
              <div className="income-breadcrumb">
                <span>Finance</span>
                <span>/</span>
                <strong>Income Management</strong>
                <span className="income-breadcrumb-badge">
                  <i /> Live Verified API
                </span>
              </div>
              <h1>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#245a36' }}>
                  <path d="M6 3h12" />
                  <path d="M6 8h12" />
                  <path d="m6 13 8.5 8" />
                  <path d="M6 13h3" />
                  <path d="M9 13c6.667 0 6.667-10 0-10" />
                </svg>
                Income Management
              </h1>
              <p>
                Track harvest crop sales, dairy revenue, government subsidies, equipment rentals, and operational farm income.
              </p>
            </div>
            <div className="income-header-actions">
              <button className="income-secondary-button" type="button" onClick={exportRegistryCSV} title="Export current records to CSV">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
              <button className="income-primary-button" type="button" onClick={openAdd}>
                <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span> Record Income
              </button>
            </div>
          </header>

          {/* Module Primary Tab Switcher */}
          <div className="income-module-tabs" role="tablist">
            <button
              type="button"
              className={`income-module-tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
              onClick={() => setActiveTab('registry')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              Income Registry &amp; Ledger
            </button>
            <button
              type="button"
              className={`income-module-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Reports &amp; Analytics
            </button>
          </div>

          {activeTab === 'registry' ? (
            <>
              {/* 4 Summary Cards */}
              <section className="income-summary" aria-label="Income KPI summary">
                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-total" aria-hidden="true">
                    ₹
                  </span>
                  <div className="income-summary-info">
                    <div className="income-summary-header">
                      <small>Total Income</small>
                      <span className="income-summary-pill total">Realized Gross</span>
                    </div>
                    <strong>{formatCurrency(totalIncome)}</strong>
                    <span>{eligibleRecords.length} active {eligibleRecords.length === 1 ? 'transaction' : 'transactions'}</span>
                  </div>
                </article>

                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-received" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  <div className="income-summary-info">
                    <div className="income-summary-header">
                      <small>Amount Received</small>
                      <span className="income-summary-pill received">Cleared</span>
                    </div>
                    <strong>{formatCurrency(totalReceived)}</strong>
                    <span>{countReceived} settled in full</span>
                  </div>
                </article>

                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-pending" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <div className="income-summary-info">
                    <div className="income-summary-header">
                      <small>Pending Receivables</small>
                      <span className="income-summary-pill pending">Due Balance</span>
                    </div>
                    <strong>{formatCurrency(totalPending)}</strong>
                    <span>{countPending + countPartially + countOverdue} with outstanding dues</span>
                  </div>
                </article>

                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-month" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                  <div className="income-summary-info">
                    <div className="income-summary-header">
                      <small>This Month</small>
                      <span className="income-summary-pill month">Current Period</span>
                    </div>
                    <strong>{formatCurrency(thisMonthIncome)}</strong>
                    <span>{monthRecords.length} records in current month</span>
                  </div>
                </article>
              </section>

              {/* Status Filter Tabs */}
              <div className="income-status-tabs" role="tablist">
                <button
                  type="button"
                  className={`income-tab-btn ${statusFilter === '' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter(''); setPage(1) }}
                >
                  All Records <span className="income-tab-count">{countAll}</span>
                </button>
                <button
                  type="button"
                  className={`income-tab-btn ${statusFilter === 'Received' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('Received'); setPage(1) }}
                >
                  Received <span className="income-tab-count">{countReceived}</span>
                </button>
                <button
                  type="button"
                  className={`income-tab-btn ${statusFilter === 'Partially Paid' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('Partially Paid'); setPage(1) }}
                >
                  Partially Paid <span className="income-tab-count">{countPartially}</span>
                </button>
                <button
                  type="button"
                  className={`income-tab-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('Pending'); setPage(1) }}
                >
                  Pending <span className="income-tab-count">{countPending}</span>
                </button>
                <button
                  type="button"
                  className={`income-tab-btn ${statusFilter === 'Overdue' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('Overdue'); setPage(1) }}
                >
                  Overdue <span className="income-tab-count">{countOverdue}</span>
                </button>
                <button
                  type="button"
                  className={`income-tab-btn ${statusFilter === 'Cancelled' ? 'active' : ''}`}
                  onClick={() => { setStatusFilter('Cancelled'); setPage(1) }}
                >
                  Cancelled <span className="income-tab-count">{countCancelled}</span>
                </button>
              </div>

              {/* Main Table Panel */}
              <section className="income-panel">
                <div className="income-panel-heading">
                  <div>
                    <h2>Income Transactions Registry</h2>
                    <p>Audited ledger of harvest sales, agricultural by-products, subsidies, and collections.</p>
                  </div>
                  <span className="income-record-count">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    {filteredRecords.length} {filteredRecords.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>

                {/* Filters Toolbar */}
                <div className="income-toolbar">
                  <label className="income-search">
                    <span aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      aria-label="Search income records"
                      placeholder="Search Income No, Farmer, Farm, Crop, Buyer..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    />
                  </label>

                  <div className="income-filter-field">
                    <span>Date Range</span>
                    <div className="income-date-range">
                      <input
                        aria-label="From date"
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                      />
                      <span>to</span>
                      <input
                        aria-label="To date"
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                      />
                    </div>
                  </div>

                  <label className="income-filter-field">
                    <span>Category</span>
                    <select
                      aria-label="Filter by category"
                      value={typeFilter}
                      onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                    >
                      <option value="">All Categories</option>
                      {incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>

                  <label className="income-filter-field">
                    <span>Farm</span>
                    <select
                      aria-label="Filter by farm"
                      value={farmFilter}
                      onChange={(e) => { setFarmFilter(e.target.value); setPage(1) }}
                    >
                      <option value="">All Farms</option>
                      {commonFarmsList.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </label>

                  <label className="income-filter-field">
                    <span>Crop</span>
                    <select
                      aria-label="Filter by crop"
                      value={cropFilter}
                      onChange={(e) => { setCropFilter(e.target.value); setPage(1) }}
                    >
                      <option value="">All Crops</option>
                      {commonCropsList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>

                  <label className="income-filter-field">
                    <span>Season</span>
                    <select
                      aria-label="Filter by season"
                      value={seasonFilter}
                      onChange={(e) => { setSeasonFilter(e.target.value); setPage(1) }}
                    >
                      <option value="">All Seasons</option>
                      {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>

                  <button className="income-clear-button" type="button" onClick={resetFilters} title="Reset all filters">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                    Reset
                  </button>
                </div>

                {notice && (
                  <div className="income-notice" role="status">
                    <span>✓ {notice}</span>
                    <button type="button" className="income-clear-button" onClick={() => setNotice('')} style={{ height: '24px', padding: '0 6px' }}>
                      ✕
                    </button>
                  </div>
                )}

                {error && (
                  <div className="income-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={loadData}>Retry</button>
                  </div>
                )}

                {/* Table */}
                <div className="income-table-wrap">
                  <table className="income-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Income No</th>
                        <th>Category</th>
                        <th>Source &amp; Buyer</th>
                        <th>Farm &amp; Crop</th>
                        <th className="income-number-cell">Total Income</th>
                        <th className="income-number-cell">Received</th>
                        <th className="income-number-cell">Pending</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td className="income-empty-cell" colSpan="10">Loading income ledger...</td></tr>
                      ) : pageRecords.length === 0 ? (
                        <tr>
                          <td colSpan="10">
                            <div className="income-empty">
                              <span className="income-empty-icon" aria-hidden="true">₹</span>
                              <strong>{records.length ? 'No transactions match filters' : 'No income records registered yet'}</strong>
                              <p>
                                {records.length
                                  ? 'Try adjusting your search terms, date range, or clear active filters.'
                                  : 'Start logging your farm income by recording your first transaction.'}
                              </p>
                              {records.length ? (
                                <button type="button" onClick={resetFilters}>Clear filters</button>
                              ) : (
                                <button type="button" onClick={openAdd}>＋ Record First Income</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageRecords.map(record => (
                          <tr key={record.id}>
                            <td className="income-nowrap">{formatDate(record.incomeDate)}</td>
                            <td>
                              <button
                                className="income-id-link"
                                type="button"
                                title="Click to view full details"
                                onClick={() => openDetails(record)}
                              >
                                {record.incomeNo || '—'}
                              </button>
                            </td>
                            <td>
                              <span className={`income-type-tag ${getCategoryClass(record.incomeType)}`}>
                                {record.incomeType || 'Income'}
                              </span>
                            </td>
                            <td>
                              <div className="income-farmer-cell">
                                <span className="income-farmer-name">{record.incomeSource || record.buyer || 'Direct Sale'}</span>
                                <span className="income-farm-name">{record.buyer ? `Buyer: ${record.buyer}` : 'Direct / Mandi'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="income-farmer-cell">
                                <span className="income-farmer-name">{record.crop || record.farm || 'Farm Income'}</span>
                                <span className="income-farm-name">{record.farm || 'General Farm'} {record.season ? `(${record.season})` : ''}</span>
                              </div>
                            </td>
                            <td className="income-number-cell income-amount">
                              {formatCurrency(record.netAmount)}
                            </td>
                            <td className="income-number-cell" style={{ color: '#059669', fontWeight: 600 }}>
                              {formatCurrency(record.amountReceived)}
                            </td>
                            <td className="income-number-cell" style={{ color: record.pendingAmount > 0 ? '#b45309' : '#94a3b8', fontWeight: record.pendingAmount > 0 ? 600 : 400 }}>
                              {record.pendingAmount > 0 ? formatCurrency(record.pendingAmount) : '—'}
                            </td>
                            <td>
                              <StatusBadge status={record.status} />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="income-row-actions" style={{ justifyContent: 'center' }}>
                                <TableActionMenu
                                  items={[
                                    { label: 'View Details', icon: 'view', onClick: () => openDetails(record) },
                                    { label: 'Edit Income', icon: 'edit', onClick: () => openEdit(record) },
                                    record.pendingAmount > 0 && record.status !== 'Cancelled' ? {
                                      label: 'Record Collection',
                                      icon: 'pay',
                                      onClick: () => openCollectionModal(record),
                                    } : null,
                                    { label: 'Delete Income', icon: 'delete', danger: true, onClick: () => setPendingDelete(record) },
                                  ]}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <footer className="income-table-footer">
                  <span>
                    Showing{' '}
                    <strong>
                      {filteredRecords.length ? (currentPage - 1) * pageSize + 1 : 0}–
                      {Math.min(currentPage * pageSize, filteredRecords.length)}
                    </strong>{' '}
                    of <strong>{filteredRecords.length}</strong> transactions
                  </span>
                  <div className="income-pagination">
                    <label>
                      Rows per page{' '}
                      <select
                        aria-label="Rows per page"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                      >
                        {pageSizes.map(size => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </label>
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(c => Math.max(1, c - 1))}
                    >
                      ‹
                    </button>
                    <span>
                      Page {currentPage} of {pageCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={currentPage >= pageCount}
                      onClick={() => setPage(c => Math.min(pageCount, c + 1))}
                    >
                      ›
                    </button>
                  </div>
                </footer>
              </section>
            </>
          ) : (
            /* Tab 2: Reports & Analytics */
            <IncomeReportsSection
              records={safeRecords}
              reportType={reportType}
              setReportType={setReportType}
            />
          )}
        </>
      ) : isFormScreen(screen) ? (
        /* Add / Edit Form Organized into 5 Sections */
        <section className="income-form-screen">
          <button className="income-back-link" type="button" disabled={busy} onClick={() => returnToList()}>
            ← Back to Income Ledger
          </button>

          <header className="income-page-heading" style={{ marginBottom: '18px' }}>
            <div>
              <div className="income-breadcrumb">
                <span>Finance</span>
                <span>/</span>
                <span>Income Management</span>
                <span>/</span>
                <strong>{screen === 'edit' ? 'Edit Record' : 'Record New Income'}</strong>
              </div>
              <h1>{screen === 'edit' ? 'Edit Income Transaction' : 'Record New Farm Income'}</h1>
              <p>
                {screen === 'edit'
                  ? `Update financial values, crop particulars, and settlement terms for ${selectedRecord?.incomeNo || 'this record'}.`
                  : 'Enter harvest sales, dairy production, subsidies, or farm services. Net amount calculates in real-time.'}
              </p>
            </div>
          </header>

          {error && (
            <div className="income-error" role="alert">
              {error}
            </div>
          )}

          <form className="income-form" noValidate onSubmit={submitForm}>
            {/* Section A: Basic Information */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">A</span>
                <div>
                  <h2>Basic Information</h2>
                  <p>Document reference, transaction date, income category, and income source.</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Income Date" name="incomeDate" error={formErrors.incomeDate} required>
                  <input
                    id="incomeDate"
                    name="incomeDate"
                    type="date"
                    value={formValues.incomeDate}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.incomeDate)}
                  />
                </FormField>

                <FormField
                  label="Income No."
                  name="incomeNo"
                  hint="Auto-generated by backend on save"
                >
                  <input
                    id="incomeNo"
                    name="incomeNo"
                    value={formValues.incomeNo || 'Auto-generated on save'}
                    readOnly
                    style={{ background: '#f8fafc', color: '#64748b' }}
                  />
                </FormField>

                <FormField label="Income Category" name="incomeType" error={formErrors.incomeType} required>
                  <select
                    id="incomeType"
                    name="incomeType"
                    value={formValues.incomeType}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.incomeType)}
                  >
                    <option value="">Select category</option>
                    {incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>

                <FormField label="Income Source" name="incomeSource" hint="Commercial channel or revenue origin">
                  <select
                    id="incomeSource"
                    name="incomeSource"
                    value={formValues.incomeSource}
                    onChange={updateField}
                  >
                    {incomeSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                <FormField label="Description / Title" name="description" full hint="Short summary of the transaction">
                  <input
                    id="description"
                    name="description"
                    maxLength="200"
                    placeholder="e.g. Sona Masoori Paddy bulk sale from North Field Lot 1"
                    value={formValues.description}
                    onChange={updateField}
                  />
                </FormField>
              </div>
            </div>

            {/* Section B: Agricultural Information */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">B</span>
                <div>
                  <h2>Agricultural Information</h2>
                  <p>Farm location, plot/parcel, crop commodity, and production season (optional for non-crop income).</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Farmer / Operator" name="farmer" hint="Registered grower or manager">
                  <input
                    id="farmer"
                    name="farmer"
                    list="common-farmers"
                    maxLength="120"
                    placeholder="Enter or select farmer"
                    value={formValues.farmer}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Farm" name="farm" hint="Originating farm parcel">
                  <input
                    id="farm"
                    name="farm"
                    list="common-farms"
                    maxLength="120"
                    placeholder="e.g. North Field, Lake Farm"
                    value={formValues.farm}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Field / Parcel" name="fieldParcel" hint="Specific plot, block, or greenhouse">
                  <input
                    id="fieldParcel"
                    name="fieldParcel"
                    maxLength="80"
                    placeholder="e.g. Plot A-1, Block 4, Polyhouse 2"
                    value={formValues.fieldParcel}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Crop / Produce" name="crop" hint="Harvest produce or commodity">
                  <input
                    id="crop"
                    name="crop"
                    list="common-crops"
                    maxLength="120"
                    placeholder="e.g. Paddy, Wheat, Cow Milk, Cotton"
                    value={formValues.crop}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Agricultural Season" name="season" hint="Harvest or production season">
                  <select
                    id="season"
                    name="season"
                    value={formValues.season}
                    onChange={updateField}
                  >
                    {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
            </div>

            {/* Section C: Amount Information & Calculation */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">C</span>
                <div>
                  <h2>Amount Information &amp; Calculation</h2>
                  <p>Specify quantity &amp; unit rate, or enter direct lump sum for subsidies and grants.</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  type="button"
                  className={`income-secondary-button ${formValues.calcMode === 'rate' ? 'selected' : ''}`}
                  style={{
                    background: formValues.calcMode === 'rate' ? '#edf6ef' : '#fff',
                    borderColor: formValues.calcMode === 'rate' ? '#245a36' : '#cbd5e1',
                    color: formValues.calcMode === 'rate' ? '#245a36' : '#475569',
                    fontWeight: 600,
                  }}
                  onClick={() => setFormValues(curr => ({ ...curr, calcMode: 'rate' }))}
                >
                  Quantity × Unit Rate Calculation
                </button>
                <button
                  type="button"
                  className={`income-secondary-button ${formValues.calcMode === 'direct' ? 'selected' : ''}`}
                  style={{
                    background: formValues.calcMode === 'direct' ? '#edf6ef' : '#fff',
                    borderColor: formValues.calcMode === 'direct' ? '#245a36' : '#cbd5e1',
                    color: formValues.calcMode === 'direct' ? '#245a36' : '#475569',
                    fontWeight: 600,
                  }}
                  onClick={() => setFormValues(curr => ({ ...curr, calcMode: 'direct' }))}
                >
                  Direct Lump Sum Entry (Subsidies / Grants)
                </button>
              </div>

              <div className="income-form-grid">
                {formValues.calcMode === 'rate' ? (
                  <>
                    <FormField label="Quantity" name="quantity" error={formErrors.quantity} required>
                      <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="e.g. 100"
                        value={formValues.quantity}
                        onChange={updateField}
                        aria-invalid={Boolean(formErrors.quantity)}
                      />
                    </FormField>

                    <FormField label="Unit of Measurement" name="unit" error={formErrors.unit} required>
                      <input
                        id="unit"
                        name="unit"
                        list="common-units"
                        maxLength="30"
                        placeholder="e.g. quintal, kg, litre, tonne"
                        value={formValues.unit}
                        onChange={updateField}
                        aria-invalid={Boolean(formErrors.unit)}
                      />
                    </FormField>

                    <FormField label="Rate per Unit (₹)" name="rate" error={formErrors.rate} required>
                      <input
                        id="rate"
                        name="rate"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Rate in ₹"
                        value={formValues.rate}
                        onChange={updateField}
                        aria-invalid={Boolean(formErrors.rate)}
                      />
                    </FormField>
                  </>
                ) : (
                  <FormField label="Direct Gross Amount (₹)" name="directAmount" error={formErrors.directAmount} required full>
                    <input
                      id="directAmount"
                      name="directAmount"
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Enter direct grant or lump sum amount in ₹"
                      value={formValues.directAmount}
                      onChange={updateField}
                      aria-invalid={Boolean(formErrors.directAmount)}
                    />
                  </FormField>
                )}

                <FormField label="Discount / Deductions (₹)" name="discount" error={formErrors.discount}>
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Discount deduction (default 0)"
                    value={formValues.discount}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Other Charges / Additions (₹)" name="otherCharges" error={formErrors.otherCharges}>
                  <input
                    id="otherCharges"
                    name="otherCharges"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Freight, packing, handling"
                    value={formValues.otherCharges}
                    onChange={updateField}
                  />
                </FormField>

                {/* Live Real-time Calculation Breakdown Card */}
                <div className="income-calc-banner">
                  <div className="income-calc-item">
                    <span>Gross Amount</span>
                    <strong>{formatCurrency(calculatedAmounts.grossAmount)}</strong>
                    <small>{formValues.calcMode === 'rate' ? 'Quantity × Rate' : 'Direct Entry'}</small>
                  </div>

                  <div className="income-calc-item">
                    <span>Adjustments</span>
                    <strong>- {formatCurrency(formValues.discount || 0)} + {formatCurrency(formValues.otherCharges || 0)}</strong>
                    <small>Discounts &amp; charges</small>
                  </div>

                  <div className="income-calc-item emphasis">
                    <span>Final Net Income</span>
                    <strong>{formatCurrency(calculatedAmounts.netAmount)}</strong>
                    <small>Gross − Discount + Charges</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Section D: Collection Information */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">D</span>
                <div>
                  <h2>Collection &amp; Settlement Information</h2>
                  <p>Customer/buyer, payment terms, collections received, and due balance tracking.</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Customer / Buyer" name="buyer" hint="Purchaser, merchant, agency, or mandi">
                  <input
                    id="buyer"
                    name="buyer"
                    list="common-buyers"
                    maxLength="120"
                    placeholder="e.g. Sri Lakshmi Traders"
                    value={formValues.buyer}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Payment Terms" name="paymentTerms" hint="Credit terms agreed with buyer">
                  <select
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formValues.paymentTerms}
                    onChange={updateField}
                  >
                    {paymentTermsOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>

                <FormField label="Expected Collection Date" name="expectedCollectionDate" hint="Due date for collection">
                  <input
                    id="expectedCollectionDate"
                    name="expectedCollectionDate"
                    type="date"
                    value={formValues.expectedCollectionDate}
                    onChange={updateField}
                  />
                </FormField>

                <FormField
                  label="Amount Received (₹)"
                  name="amountReceived"
                  hint={`Leave empty for full settlement (${formatCurrency(calculatedAmounts.netAmount)})`}
                >
                  <input
                    id="amountReceived"
                    name="amountReceived"
                    type="number"
                    min="0"
                    max={calculatedAmounts.netAmount}
                    step="any"
                    placeholder={`e.g. ${calculatedAmounts.netAmount}`}
                    value={formValues.amountReceived}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Payment Mode" name="paymentMode" error={formErrors.paymentMode} required>
                  <select
                    id="paymentMode"
                    name="paymentMode"
                    value={formValues.paymentMode}
                    onChange={updateField}
                  >
                    {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>

                <FormField label="Bank / Cash Account" name="bankCash" hint="Account receiving funds">
                  <input
                    id="bankCash"
                    name="bankCash"
                    list="common-bank-cash"
                    maxLength="100"
                    placeholder="e.g. HDFC Farm Account, Cash in Hand"
                    value={formValues.bankCash}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Reference / UTR Number" name="referenceNumber" hint="Transaction ID, Cheque No, or UTR">
                  <input
                    id="referenceNumber"
                    name="referenceNumber"
                    maxLength="100"
                    placeholder="e.g. UTR-2026110091, CHQ-88210"
                    value={formValues.referenceNumber}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Initial Status" name="status" hint="Calculated automatically from collections">
                  <select
                    id="status"
                    name="status"
                    value={formValues.status}
                    onChange={updateField}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>

                {/* Collection Summary Banner */}
                <div className="income-calc-banner" style={{ gridColumn: '1 / -1' }}>
                  <div className="income-calc-item">
                    <span>Amount Received</span>
                    <strong style={{ color: '#059669' }}>{formatCurrency(calculatedAmounts.amountReceived)}</strong>
                    <small>Cleared funds</small>
                  </div>
                  <div className="income-calc-item">
                    <span>Pending Receivables</span>
                    <strong style={{ color: calculatedAmounts.pendingAmount > 0 ? '#b45309' : '#64748b' }}>
                      {formatCurrency(calculatedAmounts.pendingAmount)}
                    </strong>
                    <small>Due balance</small>
                  </div>
                  <div className="income-calc-item emphasis">
                    <span>Collection State</span>
                    <strong>
                      {calculatedAmounts.pendingAmount <= 0
                        ? 'Fully Settled (Received)'
                        : calculatedAmounts.amountReceived > 0
                        ? 'Partially Collected'
                        : 'Awaiting Collection (Pending)'}
                    </strong>
                    <small>Based on allocated amount</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Section E: Supporting Information */}
            <div className="income-form-section">
              <div className="income-section-heading">
                <span className="income-section-step">E</span>
                <div>
                  <h2>Supporting Information &amp; Notes</h2>
                  <p>Invoice / bill number, transport details, and transaction audit remarks.</p>
                </div>
              </div>

              <div className="income-form-grid">
                <FormField label="Invoice / Bill Number" name="invoiceNo" hint="Commercial tax invoice or mandi slip">
                  <input
                    id="invoiceNo"
                    name="invoiceNo"
                    maxLength="60"
                    placeholder="e.g. INV-2026-081"
                    value={formValues.invoiceNo}
                    onChange={updateField}
                  />
                </FormField>

                <FormField label="Transaction Remarks &amp; Notes" name="remarks" full hint="Any contractual terms, grain moisture, or quality specs">
                  <textarea
                    id="remarks"
                    name="remarks"
                    rows="3"
                    maxLength="500"
                    placeholder="Enter additional remarks or transaction notes..."
                    value={formValues.remarks}
                    onChange={updateField}
                  />
                </FormField>
              </div>
            </div>

            {/* Form Footer */}
            <div className="income-form-footer">
              <span>
                <i>*</i> Required fields for agricultural financial integrity
              </span>
              <div>
                <button className="income-secondary-button" type="button" disabled={busy} onClick={() => returnToList()}>
                  Cancel
                </button>
                <button className="income-primary-button" type="submit" disabled={busy || loading}>
                  {busy ? 'Saving to API...' : screen === 'edit' ? 'Update Income Record' : 'Save Income Record'}
                </button>
              </div>
            </div>
          </form>
        </section>
      ) : (
        /* Details View Screen */
        <section className="income-details-screen">
          <button className="income-back-link" type="button" disabled={busy} onClick={() => returnToList()}>
            ← Back to Income Ledger
          </button>
          {selectedRecord && (
            <>
              <header className="income-page-heading income-details-heading">
                <div>
                  <div className="income-breadcrumb">
                    <span>Finance</span>
                    <span>/</span>
                    <span>Income Management</span>
                    <span>/</span>
                    <strong>{selectedRecord.incomeNo}</strong>
                  </div>
                  <h1>Income Transaction Details</h1>
                  <p>Audit receipt and transaction particulars recorded for {selectedRecord.incomeNo}.</p>
                </div>
                <div className="income-header-actions">
                  <button className="income-secondary-button" type="button" onClick={() => openEdit(selectedRecord)}>
                    Edit Record
                  </button>
                  {selectedRecord.pendingAmount > 0 && selectedRecord.status !== 'Cancelled' && (
                    <button className="income-primary-button" type="button" onClick={() => openCollectionModal(selectedRecord)}>
                      Record Collection
                    </button>
                  )}
                </div>
              </header>

              {error && (
                <div className="income-error" role="alert">
                  {error}
                </div>
              )}

              {/* Net Income Banner */}
              <div className="income-detail-total">
                <div>
                  <span>Total Net Income Amount</span>
                  <strong>{formatCurrency(selectedRecord.netAmount)}</strong>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>Received / Pending</small>
                    <span style={{ fontWeight: 700, color: '#059669', fontSize: '14px' }}>
                      {formatCurrency(selectedRecord.amountReceived)}
                    </span>
                    {' / '}
                    <span style={{ fontWeight: 700, color: selectedRecord.pendingAmount > 0 ? '#b45309' : '#64748b', fontSize: '14px' }}>
                      {formatCurrency(selectedRecord.pendingAmount)}
                    </span>
                  </div>
                  <StatusBadge status={selectedRecord.status} />
                </div>
              </div>

              {/* Detail Card */}
              <section className="income-detail-card">
                <div className="income-detail-card-heading">
                  <div>
                    <span className={`income-type-tag ${getCategoryClass(selectedRecord.incomeType)}`}>
                      {selectedRecord.incomeType || 'Income'}
                    </span>
                    <h2>{selectedRecord.incomeSource || selectedRecord.buyer || 'Income Transaction'}</h2>
                  </div>
                  <span>{formatDate(selectedRecord.incomeDate)}</span>
                </div>

                <dl className="income-detail-grid">
                  <DetailItem label="Income Number" value={selectedRecord.incomeNo || '—'} />
                  <DetailItem label="Income Date" value={formatDate(selectedRecord.incomeDate)} />
                  <DetailItem label="Income Category" value={selectedRecord.incomeType || '—'} />
                  <DetailItem label="Revenue Source" value={selectedRecord.incomeSource || 'Harvest Produce'} />
                  <DetailItem label="Farmer / Operator" value={selectedRecord.farmer || '—'} />
                  <DetailItem label="Farm Parcel" value={selectedRecord.farm || '—'} />
                  <DetailItem label="Field / Plot" value={selectedRecord.fieldParcel || '—'} />
                  <DetailItem label="Crop Commodity" value={selectedRecord.crop || '—'} />
                  <DetailItem label="Production Season" value={selectedRecord.season || '—'} />
                  <DetailItem label="Customer / Buyer" value={selectedRecord.buyer || '—'} />
                  <DetailItem
                    label="Quantity &amp; Unit"
                    value={`${selectedRecord.quantity ?? '—'} ${selectedRecord.unit || ''}`.trim()}
                  />
                  <DetailItem
                    label="Rate per Unit"
                    value={selectedRecord.rate != null ? `₹ ${selectedRecord.rate}` : '—'}
                  />
                  <DetailItem
                    label="Gross Amount"
                    value={formatCurrency(selectedRecord.grossAmount ?? selectedRecord.netAmount)}
                  />
                  <DetailItem label="Discount Deductions" value={formatCurrency(selectedRecord.discount ?? 0)} />
                  <DetailItem label="Other Charges / Freight" value={formatCurrency(selectedRecord.otherCharges ?? 0)} />
                  <DetailItem
                    label="Final Net Realized"
                    value={formatCurrency(selectedRecord.netAmount)}
                  />
                  <DetailItem
                    label="Amount Received"
                    value={formatCurrency(selectedRecord.amountReceived)}
                  />
                  <DetailItem
                    label="Pending Balance"
                    value={selectedRecord.pendingAmount > 0 ? formatCurrency(selectedRecord.pendingAmount) : 'Settled (₹0)'}
                  />
                  <DetailItem label="Payment Terms" value={selectedRecord.paymentTerms || 'Immediate'} />
                  <DetailItem label="Expected Collection Due Date" value={formatDate(selectedRecord.expectedCollectionDate)} />
                  <DetailItem label="Payment Mode" value={selectedRecord.paymentMode || '—'} />
                  <DetailItem label="Bank / Cash Account" value={selectedRecord.bankCash || '—'} />
                  <DetailItem label="Transaction Reference / UTR" value={selectedRecord.referenceNumber || '—'} />
                  <DetailItem label="Invoice / Bill No" value={selectedRecord.invoiceNo || '—'} />
                  <DetailItem label="Collection Status" value={selectedRecord.status || 'Received'} />
                  <DetailItem label="Remarks &amp; Audit Notes" value={selectedRecord.remarks || 'No notes provided.'} full />
                </dl>
              </section>
            </>
          )}
        </section>
      )}

      {/* Quick Record Collection Modal */}
      {collectionModal && (
        <div className="income-dialog-backdrop" role="presentation">
          <div className="income-modal-box" style={{ maxWidth: '480px' }} role="dialog">
            <div className="income-modal-header">
              <div>
                <h2>Record Payment Collection</h2>
                <p>Record receipt against {collectionModal.incomeNo} (Pending: {formatCurrency(collectionModal.pendingAmount)})</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setCollectionModal(null)}>×</button>
            </div>
            <form onSubmit={submitQuickCollection}>
              <div className="income-form-grid" style={{ padding: '16px', gridTemplateColumns: '1fr' }}>
                <FormField label="Collection Date" name="date" required>
                  <input
                    type="date"
                    value={collectionForm.date}
                    onChange={(e) => setCollectionForm(c => ({ ...c, date: e.target.value }))}
                    required
                  />
                </FormField>
                <FormField label="Amount Received (₹)" name="amount" required>
                  <input
                    type="number"
                    min="1"
                    max={collectionModal.pendingAmount}
                    step="any"
                    value={collectionForm.amount}
                    onChange={(e) => setCollectionForm(c => ({ ...c, amount: e.target.value }))}
                    required
                  />
                </FormField>
                <FormField label="Payment Mode" name="mode" required>
                  <select
                    value={collectionForm.mode}
                    onChange={(e) => setCollectionForm(c => ({ ...c, mode: e.target.value }))}
                  >
                    {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
                <FormField label="Bank / Cash Account" name="bank">
                  <input
                    list="common-bank-cash"
                    value={collectionForm.bank}
                    onChange={(e) => setCollectionForm(c => ({ ...c, bank: e.target.value }))}
                  />
                </FormField>
                <FormField label="Reference / UTR Number" name="ref">
                  <input
                    placeholder="e.g. UTR-998812"
                    value={collectionForm.ref}
                    onChange={(e) => setCollectionForm(c => ({ ...c, ref: e.target.value }))}
                  />
                </FormField>
                <FormField label="Collection Notes" name="notes">
                  <input
                    placeholder="e.g. Part payment received via RTGS"
                    value={collectionForm.notes}
                    onChange={(e) => setCollectionForm(c => ({ ...c, notes: e.target.value }))}
                  />
                </FormField>
              </div>
              <div className="income-form-footer">
                <span />
                <div>
                  <button className="income-secondary-button" type="button" onClick={() => setCollectionModal(null)}>
                    Cancel
                  </button>
                  <button className="income-primary-button" type="submit" disabled={busy}>
                    {busy ? 'Saving...' : 'Confirm Collection'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div
          className="income-dialog-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPendingDelete(null) }}
        >
          <div className="income-delete-dialog" role="alertdialog">
            <span className="income-delete-icon">
              <Icon name="delete" />
            </span>
            <h2>Delete Income Record?</h2>
            <p>
              Are you sure you want to delete transaction <strong>{pendingDelete.incomeNo}</strong> with total amount{' '}
              <strong>{formatCurrency(pendingDelete.netAmount)}</strong>? This action will permanently remove it from your income ledger.
            </p>
            {error && (
              <div className="income-error" role="alert">
                {error}
              </div>
            )}
            <div>
              <button
                className="income-secondary-button"
                type="button"
                onClick={() => { setPendingDelete(null); setError('') }}
              >
                Cancel
              </button>
              <button className="income-danger-button" type="button" disabled={busy} onClick={confirmDelete}>
                {busy ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isFormScreen(screen) {
  return screen === 'add' || screen === 'edit'
}

function StatusBadge({ status }) {
  const s = status || 'Pending'
  const style = s === 'Received' ? 'received' : s === 'Partially Paid' ? 'partially' : s === 'Overdue' ? 'overdue' : s === 'Cancelled' ? 'cancelled' : 'pending'
  return (
    <span className={`income-status is-${style}`}>
      <i />
      {s}
    </span>
  )
}

function FormField({ label, name, error, hint, required = false, full = false, children }) {
  return (
    <div className={`income-field${full ? ' income-field-full' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span aria-hidden="true" style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
      {hint && <small className="income-field-hint">{hint}</small>}
      {error && (
        <span className="income-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={`income-detail-item${full ? ' income-detail-item-full' : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Icon({ name }) {
  if (name === 'delete') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    )
  }
  return null
}

// In-module Reports & Analytics Section (Tab 2)
function IncomeReportsSection({ records, reportType, setReportType }) {
  const activeRecords = records.filter(r => r.status !== 'Cancelled')

  // Group by category
  const categorySummary = useMemo(() => {
    const map = {}
    activeRecords.forEach(r => {
      const cat = r.incomeType || 'Other'
      if (!map[cat]) map[cat] = { name: cat, count: 0, total: 0, received: 0, pending: 0 }
      map[cat].count++
      map[cat].total += Number(r.netAmount || 0)
      map[cat].received += Number(r.amountReceived || 0)
      map[cat].pending += Number(r.pendingAmount || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [activeRecords])

  // Group by Farm
  const farmSummary = useMemo(() => {
    const map = {}
    activeRecords.forEach(r => {
      const f = r.farm || 'Unassigned Farm'
      if (!map[f]) map[f] = { name: f, count: 0, total: 0, received: 0, pending: 0 }
      map[f].count++
      map[f].total += Number(r.netAmount || 0)
      map[f].received += Number(r.amountReceived || 0)
      map[f].pending += Number(r.pendingAmount || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [activeRecords])

  // Group by Crop
  const cropSummary = useMemo(() => {
    const map = {}
    activeRecords.forEach(r => {
      const c = r.crop || 'Non-Crop / General'
      if (!map[c]) map[c] = { name: c, count: 0, total: 0, quantity: 0, unit: r.unit || 'unit' }
      map[c].count++
      map[c].total += Number(r.netAmount || 0)
      map[c].quantity += Number(r.quantity || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [activeRecords])

  // Group by Month
  const monthSummary = useMemo(() => {
    const map = {}
    activeRecords.forEach(r => {
      const m = r.incomeDate ? r.incomeDate.slice(0, 7) : 'Unknown'
      if (!map[m]) map[m] = { month: m, count: 0, total: 0, received: 0, pending: 0 }
      map[m].count++
      map[m].total += Number(r.netAmount || 0)
      map[m].received += Number(r.amountReceived || 0)
      map[m].pending += Number(r.pendingAmount || 0)
    })
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month))
  }, [activeRecords])

  // Group by Season
  const seasonSummary = useMemo(() => {
    const map = {}
    activeRecords.forEach(r => {
      const s = r.season || 'Unspecified Season'
      if (!map[s]) map[s] = { season: s, count: 0, total: 0, received: 0, pending: 0 }
      map[s].count++
      map[s].total += Number(r.netAmount || 0)
      map[s].received += Number(r.amountReceived || 0)
      map[s].pending += Number(r.pendingAmount || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [activeRecords])

  // Group by Buyer / Customer
  const buyerSummary = useMemo(() => {
    const map = {}
    activeRecords.forEach(r => {
      const b = r.buyer || 'Direct Mandi / Walk-in'
      if (!map[b]) map[b] = { buyer: b, count: 0, total: 0, received: 0, pending: 0 }
      map[b].count++
      map[b].total += Number(r.netAmount || 0)
      map[b].received += Number(r.amountReceived || 0)
      map[b].pending += Number(r.pendingAmount || 0)
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [activeRecords])

  // Pending & Overdue Receivables Aging
  const receivablesAging = useMemo(() => {
    const today = localDate()
    return activeRecords
      .filter(r => Number(r.pendingAmount || 0) > 0)
      .map(r => {
        const dueDate = r.expectedCollectionDate || r.incomeDate
        const isOverdue = dueDate < today
        return {
          ...r,
          dueDate,
          isOverdue,
        }
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [activeRecords])

  function exportReportCSV() {
    let headers = []
    let rows = []
    let filename = `AGRIMAN_Income_Report_${reportType}_${localDate()}.csv`

    if (reportType === 'category') {
      headers = ['Category', 'Transactions', 'Total Income', 'Received Amount', 'Pending Amount']
      rows = categorySummary.map(c => [`"${c.name}"`, c.count, c.total, c.received, c.pending])
    } else if (reportType === 'farm') {
      headers = ['Farm', 'Transactions', 'Total Income', 'Received Amount', 'Pending Amount']
      rows = farmSummary.map(f => [`"${f.name}"`, f.count, f.total, f.received, f.pending])
    } else if (reportType === 'crop') {
      headers = ['Crop / Produce', 'Transactions', 'Total Quantity', 'Unit', 'Total Revenue']
      rows = cropSummary.map(c => [`"${c.name}"`, c.count, c.quantity, `"${c.unit}"`, c.total])
    } else if (reportType === 'monthly') {
      headers = ['Month', 'Transactions', 'Total Income', 'Received Amount', 'Pending Amount']
      rows = monthSummary.map(m => [`"${m.month}"`, m.count, m.total, m.received, m.pending])
    } else if (reportType === 'season') {
      headers = ['Season', 'Transactions', 'Total Income', 'Received Amount', 'Pending Amount']
      rows = seasonSummary.map(s => [`"${s.season}"`, s.count, s.total, s.received, s.pending])
    } else if (reportType === 'buyer') {
      headers = ['Buyer / Customer', 'Transactions', 'Total Purchased', 'Amount Paid', 'Outstanding Balance']
      rows = buyerSummary.map(b => [`"${b.buyer}"`, b.count, b.total, b.received, b.pending])
    } else if (reportType === 'receivables') {
      headers = ['Income No', 'Date', 'Customer/Buyer', 'Total Amount', 'Received', 'Pending Due', 'Due Date', 'Status']
      rows = receivablesAging.map(r => [
        `"${r.incomeNo}"`,
        `"${r.incomeDate}"`,
        `"${r.buyer || ''}"`,
        r.netAmount,
        r.amountReceived,
        r.pendingAmount,
        `"${r.dueDate}"`,
        r.isOverdue ? 'Overdue' : 'Pending',
      ])
    } else {
      // Summary
      headers = ['Metric', 'Value']
      const totalRev = activeRecords.reduce((s, r) => s + Number(r.netAmount || 0), 0)
      const totalRcvd = activeRecords.reduce((s, r) => s + Number(r.amountReceived || 0), 0)
      const totalPend = activeRecords.reduce((s, r) => s + Number(r.pendingAmount || 0), 0)
      rows = [
        ['Total Transactions', activeRecords.length],
        ['Total Net Revenue', totalRev],
        ['Total Amount Received', totalRcvd],
        ['Total Outstanding Pending', totalPend],
        ['Collection Efficiency %', totalRev > 0 ? ((totalRcvd / totalRev) * 100).toFixed(1) + '%' : '0%'],
      ]
    }

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <section className="income-reports-wrapper">
      <div className="income-reports-toolbar">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Report View:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{
              height: '34px',
              borderRadius: '7px',
              borderColor: '#cbd5e1',
              padding: '0 10px',
              fontSize: '12.5px',
              fontWeight: 500,
            }}
          >
            <option value="summary">1. Executive Income Summary</option>
            <option value="category">2. Category-wise Revenue Breakdown</option>
            <option value="farm">3. Farm-wise Performance</option>
            <option value="crop">4. Crop-wise Commodity Revenue</option>
            <option value="monthly">5. Month-by-Month Trend</option>
            <option value="season">6. Agricultural Season Breakdown</option>
            <option value="buyer">7. Customer / Buyer Revenue &amp; Ledger</option>
            <option value="receivables">8. Pending &amp; Overdue Receivables Aging</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="income-secondary-button" type="button" onClick={exportReportCSV}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
          <button className="income-secondary-button" type="button" onClick={handlePrint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Report
          </button>
        </div>
      </div>

      {/* Report Render Area */}
      <div className="income-report-sheet">
        {reportType === 'summary' && (
          <div>
            <h3 className="income-report-title">Executive Income &amp; Collection Summary</h3>
            <p className="income-report-sub">Comprehensive overview of earned farm revenue, cleared collections, and pending dues.</p>
            <div className="income-report-kpi-grid">
              <div className="income-report-kpi-card">
                <span>Total Earned Income</span>
                <strong>{formatCurrency(activeRecords.reduce((s, r) => s + Number(r.netAmount || 0), 0))}</strong>
                <small>{activeRecords.length} recorded sales transactions</small>
              </div>
              <div className="income-report-kpi-card">
                <span>Collections Received</span>
                <strong style={{ color: '#059669' }}>
                  {formatCurrency(activeRecords.reduce((s, r) => s + Number(r.amountReceived || 0), 0))}
                </strong>
                <small>Cleared and deposited funds</small>
              </div>
              <div className="income-report-kpi-card">
                <span>Outstanding Receivables</span>
                <strong style={{ color: '#b45309' }}>
                  {formatCurrency(activeRecords.reduce((s, r) => s + Number(r.pendingAmount || 0), 0))}
                </strong>
                <small>Awaiting customer payment</small>
              </div>
              <div className="income-report-kpi-card">
                <span>Average Transaction Size</span>
                <strong>
                  {formatCurrency(activeRecords.length ? activeRecords.reduce((s, r) => s + Number(r.netAmount || 0), 0) / activeRecords.length : 0)}
                </strong>
                <small>Per completed transaction</small>
              </div>
            </div>
          </div>
        )}

        {reportType === 'category' && (
          <div>
            <h3 className="income-report-title">Category-wise Income &amp; Revenue Breakdown</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Transactions</th>
                  <th className="income-number-cell">Total Income</th>
                  <th className="income-number-cell">Amount Received</th>
                  <th className="income-number-cell">Pending Receivables</th>
                  <th className="income-number-cell">Share %</th>
                </tr>
              </thead>
              <tbody>
                {categorySummary.map(c => {
                  const totalAll = activeRecords.reduce((s, r) => s + Number(r.netAmount || 0), 0)
                  const share = totalAll > 0 ? ((c.total / totalAll) * 100).toFixed(1) : 0
                  return (
                    <tr key={c.name}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.count}</td>
                      <td className="income-number-cell">{formatCurrency(c.total)}</td>
                      <td className="income-number-cell" style={{ color: '#059669' }}>{formatCurrency(c.received)}</td>
                      <td className="income-number-cell" style={{ color: c.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(c.pending)}</td>
                      <td className="income-number-cell">{share}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'farm' && (
          <div>
            <h3 className="income-report-title">Farm-wise Revenue Generation</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Farm Parcel</th>
                  <th>Transactions</th>
                  <th className="income-number-cell">Total Income</th>
                  <th className="income-number-cell">Amount Received</th>
                  <th className="income-number-cell">Pending Due</th>
                </tr>
              </thead>
              <tbody>
                {farmSummary.map(f => (
                  <tr key={f.name}>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.count}</td>
                    <td className="income-number-cell">{formatCurrency(f.total)}</td>
                    <td className="income-number-cell" style={{ color: '#059669' }}>{formatCurrency(f.received)}</td>
                    <td className="income-number-cell" style={{ color: f.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(f.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'crop' && (
          <div>
            <h3 className="income-report-title">Crop &amp; Produce Commodity Revenue</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Crop / Produce</th>
                  <th>Transactions</th>
                  <th>Total Volume</th>
                  <th className="income-number-cell">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {cropSummary.map(c => (
                  <tr key={c.name}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.count}</td>
                    <td>{c.quantity} {c.unit}</td>
                    <td className="income-number-cell">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'monthly' && (
          <div>
            <h3 className="income-report-title">Month-by-Month Income Trend</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Transactions</th>
                  <th className="income-number-cell">Total Income</th>
                  <th className="income-number-cell">Received</th>
                  <th className="income-number-cell">Pending Due</th>
                </tr>
              </thead>
              <tbody>
                {monthSummary.map(m => (
                  <tr key={m.month}>
                    <td><strong>{m.month}</strong></td>
                    <td>{m.count}</td>
                    <td className="income-number-cell">{formatCurrency(m.total)}</td>
                    <td className="income-number-cell" style={{ color: '#059669' }}>{formatCurrency(m.received)}</td>
                    <td className="income-number-cell" style={{ color: m.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(m.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'season' && (
          <div>
            <h3 className="income-report-title">Agricultural Season Income Distribution</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Transactions</th>
                  <th className="income-number-cell">Total Income</th>
                  <th className="income-number-cell">Received</th>
                  <th className="income-number-cell">Pending Due</th>
                </tr>
              </thead>
              <tbody>
                {seasonSummary.map(s => (
                  <tr key={s.season}>
                    <td><strong>{s.season}</strong></td>
                    <td>{s.count}</td>
                    <td className="income-number-cell">{formatCurrency(s.total)}</td>
                    <td className="income-number-cell" style={{ color: '#059669' }}>{formatCurrency(s.received)}</td>
                    <td className="income-number-cell" style={{ color: s.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(s.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'buyer' && (
          <div>
            <h3 className="income-report-title">Customer &amp; Buyer Revenue Ledger</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Buyer / Purchaser</th>
                  <th>Transactions</th>
                  <th className="income-number-cell">Total Purchased</th>
                  <th className="income-number-cell">Amount Cleared</th>
                  <th className="income-number-cell">Outstanding Credit</th>
                </tr>
              </thead>
              <tbody>
                {buyerSummary.map(b => (
                  <tr key={b.buyer}>
                    <td><strong>{b.buyer}</strong></td>
                    <td>{b.count}</td>
                    <td className="income-number-cell">{formatCurrency(b.total)}</td>
                    <td className="income-number-cell" style={{ color: '#059669' }}>{formatCurrency(b.received)}</td>
                    <td className="income-number-cell" style={{ color: b.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(b.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'receivables' && (
          <div>
            <h3 className="income-report-title">Pending &amp; Overdue Receivables Aging Analysis</h3>
            <table className="income-table">
              <thead>
                <tr>
                  <th>Income No</th>
                  <th>Date</th>
                  <th>Buyer / Debtor</th>
                  <th>Farm &amp; Crop</th>
                  <th className="income-number-cell">Total Amount</th>
                  <th className="income-number-cell">Received</th>
                  <th className="income-number-cell">Outstanding Due</th>
                  <th>Due Date</th>
                  <th>Aging Status</th>
                </tr>
              </thead>
              <tbody>
                {receivablesAging.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      All income receivables have been settled in full. No pending balances.
                    </td>
                  </tr>
                ) : (
                  receivablesAging.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.incomeNo}</strong></td>
                      <td>{formatDate(r.incomeDate)}</td>
                      <td>{r.buyer || 'Direct Mandi'}</td>
                      <td>{r.crop || r.farm}</td>
                      <td className="income-number-cell">{formatCurrency(r.netAmount)}</td>
                      <td className="income-number-cell" style={{ color: '#059669' }}>{formatCurrency(r.amountReceived)}</td>
                      <td className="income-number-cell" style={{ color: '#b45309', fontWeight: 700 }}>
                        {formatCurrency(r.pendingAmount)}
                      </td>
                      <td>{formatDate(r.dueDate)}</td>
                      <td>
                        <span className={`income-status is-${r.isOverdue ? 'overdue' : 'pending'}`}>
                          <i />
                          {r.isOverdue ? 'Overdue Due Date' : 'Within Terms'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
