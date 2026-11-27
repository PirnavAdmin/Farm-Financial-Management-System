import TableActionMenu from '../../TableActionMenu'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  createIncome,
  deleteIncome,
  exportIncomeReportCsv,
  getIncomeById,
  getIncomeReport,
  listIncome,
  listIncomeCategories,
  listIncomeFarmers,
  listIncomeFarms,
  listIncomeCrops,
  updateIncome,
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
  const iso = String(value).slice(0, 10)
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return value
}

function isoToDisplayDate(iso) {
  if (!iso) return ''
  const match = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

function displayDateToIso(display) {
  if (!display) return ''
  const match = String(display).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function sanitizeApiError(message) {
  if (!message) return 'Unable to connect to the Income service. Please check your connection and try again.'
  const text = String(message)
  if (/ngrok|ERR_NGROK|tunnel|ECONNREFUSED|Network Error|Failed to fetch/i.test(text)) {
    return 'Income service is currently unreachable. Please check your connection and click Retry.'
  }
  return text
}

const INCOME_DATE_PRESETS = [
  { value: 'last_1_month', label: 'Last 1 Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
]

function formatLocalIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function subtractLocalMonths(baseDate, months) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth() - months
  const day = baseDate.getDate()
  const target = new Date(year, month, 1)
  const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, maxDay))
  return target
}

function computeIncomeDateRange(preset, now = new Date()) {
  const y = now.getFullYear()
  const m = now.getMonth()
  const todayIso = formatLocalIso(now)

  switch (preset) {
    case 'last_1_month':
      return { from: formatLocalIso(subtractLocalMonths(now, 1)), to: todayIso }
    case 'last_3_months':
      return { from: formatLocalIso(subtractLocalMonths(now, 3)), to: todayIso }
    case 'last_6_months':
      return { from: formatLocalIso(subtractLocalMonths(now, 6)), to: todayIso }
    case 'this_month': {
      const first = new Date(y, m, 1)
      const last = new Date(y, m + 1, 0)
      return { from: formatLocalIso(first), to: formatLocalIso(last) }
    }
    case 'this_year':
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    case 'last_year':
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` }
    case 'all_time':
    default:
      return { from: '', to: '' }
  }
}

function formatSelectedPeriodLabel(preset, dateFrom, dateTo) {
  const found = INCOME_DATE_PRESETS.find(p => p.value === preset)
  if (preset === 'all_time') return 'All Time'
  if (preset === 'custom') {
    if (dateFrom && dateTo) return `${isoToDisplayDate(dateFrom)} – ${isoToDisplayDate(dateTo)}`
    if (dateFrom) return `From ${isoToDisplayDate(dateFrom)}`
    if (dateTo) return `Until ${isoToDisplayDate(dateTo)}`
    return 'Custom Range'
  }
  const range = dateFrom && dateTo ? `${isoToDisplayDate(dateFrom)} – ${isoToDisplayDate(dateTo)}` : ''
  return found ? (range ? `${found.label} (${range})` : found.label) : 'All Time'
}

const CALENDAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const CALENDAR_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i)
    cells.push({ iso: formatLocalIso(d), day: d.getDate(), outside: true })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    cells.push({ iso: formatLocalIso(d), day, outside: false })
  }
  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day)
    cells.push({ iso: formatLocalIso(d), day, outside: true })
  }
  return cells
}

function IncomeDateRangeFilter({
  preset,
  onPresetChange,
  onApplyCustomRange,
  dateFrom,
  dateTo,
  compact = false,
}) {
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const todayIso = formatLocalIso(now)
  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear()
    const list = []
    for (let y = cur - 10; y <= cur + 2; y++) list.push(y)
    return list
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function openPopover() {
    if (open) {
      setOpen(false)
      return
    }
    const isCustom = preset === 'custom'
    setShowCalendar(isCustom)
    setDraftFrom(isCustom ? dateFrom : '')
    setDraftTo(isCustom ? dateTo : '')
    if (isCustom && dateFrom) {
      const m = dateFrom.match(/^(\d{4})-(\d{2})/)
      if (m) {
        setViewYear(Number(m[1]))
        setViewMonth(Number(m[2]) - 1)
      }
    } else {
      const d = new Date()
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
    setOpen(true)
  }

  function handlePresetClick(value) {
    if (value === 'custom') {
      setShowCalendar(true)
      setDraftFrom(preset === 'custom' ? dateFrom : '')
      setDraftTo(preset === 'custom' ? dateTo : '')
      return
    }
    onPresetChange(value)
    setShowCalendar(false)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  function handleDayClick(cellIso) {
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(cellIso)
      setDraftTo('')
      return
    }
    if (cellIso < draftFrom) return
    setDraftTo(cellIso)
  }

  function handleApply() {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return
    onApplyCustomRange(draftFrom, draftTo)
    setOpen(false)
  }

  function handleCancel() {
    setOpen(false)
  }

  const cells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth])

  const triggerLabel = useMemo(() => {
    if (preset === 'custom' && dateFrom && dateTo) {
      return `${isoToDisplayDate(dateFrom)} – ${isoToDisplayDate(dateTo)}`
    }
    const found = INCOME_DATE_PRESETS.find(p => p.value === preset)
    return found ? found.label : 'All Time'
  }, [preset, dateFrom, dateTo])

  return (
    <div ref={wrapRef} className={`income-date-dropdown-wrap ${compact ? 'is-compact' : ''}`}>
      <button
        type="button"
        className={`income-date-trigger ${open ? 'is-open' : ''} ${preset !== 'all_time' ? 'has-value' : ''}`}
        aria-label="Date Range"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openPopover}
      >
        <svg className="income-date-trigger-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="income-date-trigger-text">{triggerLabel}</span>
        <svg className="income-date-trigger-caret" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={`income-date-popover ${showCalendar ? 'with-calendar' : ''}`} role="dialog" aria-label="Select date range">
          <ul className="income-date-preset-list" role="listbox" aria-label="Date range presets">
            {INCOME_DATE_PRESETS.map(opt => {
              const isSelected = opt.value === 'custom' ? showCalendar : (!showCalendar && preset === opt.value)
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`income-date-preset-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handlePresetClick(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {opt.value === 'custom' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {showCalendar && (
            <div className="income-cal-panel">
              <div className="income-cal-selected-bar">
                <div className="income-cal-selected-chip">
                  <small>Start Date</small>
                  <strong>{draftFrom ? isoToDisplayDate(draftFrom) : 'Select date'}</strong>
                </div>
                <span className="income-cal-arrow" aria-hidden="true">→</span>
                <div className="income-cal-selected-chip">
                  <small>End Date</small>
                  <strong>{draftTo ? isoToDisplayDate(draftTo) : (draftFrom ? 'Select end date' : 'Select date')}</strong>
                </div>
              </div>

              <div className="income-cal-header">
                <button type="button" className="income-cal-nav-btn" aria-label="Previous month" onClick={prevMonth}>
                  ‹
                </button>
                <div className="income-cal-selectors">
                  <select
                    aria-label="Calendar month"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                  >
                    {CALENDAR_MONTHS.map((mName, idx) => (
                      <option key={mName} value={idx}>{mName}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Calendar year"
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="income-cal-nav-btn" aria-label="Next month" onClick={nextMonth}>
                  ›
                </button>
              </div>

              <div className="income-cal-weekdays" aria-hidden="true">
                {CALENDAR_WEEKDAYS.map(wd => (
                  <span key={wd}>{wd}</span>
                ))}
              </div>

              <div className="income-cal-grid" role="grid" aria-label="Calendar dates">
                {cells.map(cell => {
                  const isStart = Boolean(draftFrom && cell.iso === draftFrom)
                  const isEnd = Boolean(draftTo && cell.iso === draftTo)
                  const isInRange = Boolean(draftFrom && draftTo && cell.iso > draftFrom && cell.iso < draftTo)
                  const isToday = cell.iso === todayIso
                  const isDisabled = Boolean(draftFrom && !draftTo && cell.iso < draftFrom)

                  const cls = [
                    'income-cal-day',
                    cell.outside ? 'is-outside' : '',
                    isToday ? 'is-today' : '',
                    isStart ? 'is-start' : '',
                    isEnd ? 'is-end' : '',
                    isInRange ? 'is-in-range' : '',
                    isDisabled ? 'is-disabled' : '',
                  ].filter(Boolean).join(' ')

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      className={cls}
                      disabled={isDisabled}
                      aria-label={isoToDisplayDate(cell.iso)}
                      aria-pressed={isStart || isEnd}
                      onClick={() => handleDayClick(cell.iso)}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>

              <div className="income-cal-footer">
                <button type="button" className="income-cal-cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="income-cal-apply-btn"
                  disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                  onClick={handleApply}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
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

const INCOME_FORM_STEPS = [
  { id: 1, key: 'basic', label: 'Basic Information', subtitle: 'Document reference, transaction date, income category, and income source.' },
  { id: 2, key: 'agricultural', label: 'Agricultural Information', subtitle: 'Farmer, farm location, plot/parcel, crop commodity, and production season (optional for non-crop income).' },
  { id: 3, key: 'amount', label: 'Amount & Calculation', subtitle: 'Specify quantity & unit rate, or enter direct lump sum for subsidies and grants.' },
  { id: 4, key: 'collection', label: 'Collection & Settlement', subtitle: 'Customer/buyer, payment terms, collections received, and due balance tracking.' },
  { id: 5, key: 'supporting', label: 'Supporting Information', subtitle: 'Invoice / bill number and transaction audit remarks.' },
]

function validateStep(step, values) {
  const all = validateForm(values)
  const stepFields = {
    1: ['incomeDate', 'incomeType'],
    2: [],
    3: ['directAmount', 'quantity', 'unit', 'rate', 'discount', 'otherCharges'],
    4: ['paymentMode'],
    5: [],
  }
  const fields = stepFields[step] || []
  const out = {}
  fields.forEach(f => {
    if (all[f]) out[f] = all[f]
  })
  return out
}

function getEarliestErrorStep(errors) {
  if (errors.incomeDate || errors.incomeType) return 1
  if (errors.directAmount || errors.quantity || errors.unit || errors.rate || errors.discount || errors.otherCharges) return 3
  if (errors.paymentMode) return 4
  return 1
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
  const [formStep, setFormStep] = useState(1)
  const [reviewMode, setReviewMode] = useState(false)

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
  const [datePreset, setDatePreset] = useState('all_time')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [farmFilter, setFarmFilter] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [dateFromText, setDateFromText] = useState('')
  const [dateToText, setDateToText] = useState('')
  const [dateRangeError, setDateRangeError] = useState('')
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

  // Load Data (using backend-supported query parameters on GET /api/Income)
  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const catMatch = categories.find(c => c.name === typeFilter)
      const incomeParams = {}
      if (search.trim()) incomeParams.search = search.trim()
      if (dateFrom) incomeParams.fromDate = dateFrom
      if (dateTo) incomeParams.toDate = dateTo
      if (catMatch?.id != null) incomeParams.categoryId = catMatch.id

      const [incomeRes, typesRes, farmersRes, farmsRes, cropsRes] = await Promise.allSettled([
        listIncome(incomeParams),
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
        setError(sanitizeApiError(err?.friendlyMessage || err?.message))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, dateFrom, dateTo, typeFilter])

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
    setFormStep(1)
    setReviewMode(false)
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
        setFormStep(1)
        setReviewMode(false)
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
    setFormStep(1)
    setReviewMode(false)
    setError('')
    if (msg) setNotice(msg)
  }

  function handleStepContinue() {
    clearMessages()
    const stepErrs = validateStep(formStep, formValues)
    if (Object.keys(stepErrs).length > 0) {
      setFormErrors(curr => ({ ...curr, ...stepErrs }))
      return
    }
    setFormErrors({})
    if (formStep < 5) {
      setFormStep(s => s + 1)
    }
  }

  function handleStepBack() {
    clearMessages()
    if (reviewMode) {
      setReviewMode(false)
      return
    }
    setFormStep(s => Math.max(1, s - 1))
  }

  function handleJumpToStep(stepNum) {
    if (busy) return
    if (stepNum < formStep || reviewMode) {
      clearMessages()
      setReviewMode(false)
      setFormStep(stepNum)
    }
  }

  function handleEnterReview() {
    clearMessages()
    const validationErrors = validateForm(formValues)
    setFormErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setReviewMode(false)
      setFormStep(getEarliestErrorStep(validationErrors))
      return
    }
    setReviewMode(true)
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
    setDatePreset('all_time')
    setDateFrom('')
    setDateTo('')
    setDateFromText('')
    setDateToText('')
    setDateRangeError('')
    setTypeFilter('')
    setSourceFilter('')
    setFarmFilter('')
    setCropFilter('')
    setSeasonFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const activeAdvancedFilters = [
    farmFilter ? { key: 'farm', label: `Farm: ${farmFilter}`, clear: () => { setFarmFilter(''); setPage(1) } } : null,
    cropFilter ? { key: 'crop', label: `Crop: ${cropFilter}`, clear: () => { setCropFilter(''); setPage(1) } } : null,
    seasonFilter ? { key: 'season', label: `Season: ${seasonFilter}`, clear: () => { setSeasonFilter(''); setPage(1) } } : null,
    sourceFilter ? { key: 'source', label: `Source: ${sourceFilter}`, clear: () => { setSourceFilter(''); setPage(1) } } : null,
  ].filter(Boolean)

  const selectedPeriodLabel = formatSelectedPeriodLabel(datePreset, dateFrom, dateTo)

  const hasAnyActiveFilter = Boolean(
    search || datePreset !== 'all_time' || dateFrom || dateTo || typeFilter || statusFilter || activeAdvancedFilters.length > 0
  )

  function handleDatePresetChange(preset) {
    setDatePreset(preset)
    setDateRangeError('')
    if (preset === 'custom') {
      setPage(1)
      return
    }
    const { from, to } = computeIncomeDateRange(preset)
    setDateFrom(from)
    setDateTo(to)
    setDateFromText(isoToDisplayDate(from))
    setDateToText(isoToDisplayDate(to))
    setPage(1)
  }

  function handleApplyCustomRange(fromIso, toIso) {
    setDatePreset('custom')
    setDateFrom(fromIso)
    setDateTo(toIso)
    setPage(1)
  }

  // CSV Export for Registry (via backend /api/Reports/export/monthly-income)
  async function exportRegistryCSV() {
    try {
      await exportIncomeReportCsv('monthly', {
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
      })
    } catch (err) {
      setError(sanitizeApiError(err?.friendlyMessage || err?.message || 'Unable to export income CSV from backend.'))
    }
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
              </div>
              <h1>Income Management</h1>
              <p>
                Track harvest crop sales, dairy revenue, government subsidies, equipment rentals, and operational farm income.
              </p>
            </div>
            <div className="income-header-actions">
              {activeTab === 'registry' && (
                <button className="income-secondary-button" type="button" onClick={exportRegistryCSV} title="Export current records to CSV">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </button>
              )}
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
                    <small>Total Income</small>
                    <strong>{formatCurrency(totalIncome)}</strong>
                    <span>{eligibleRecords.length} active {eligibleRecords.length === 1 ? 'transaction' : 'transactions'}</span>
                  </div>
                </article>

                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-received" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  <div className="income-summary-info">
                    <small>Amount Received</small>
                    <strong>{formatCurrency(totalReceived)}</strong>
                    <span>{countReceived} settled in full</span>
                  </div>
                </article>

                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-pending" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <div className="income-summary-info">
                    <small>Pending Receivables</small>
                    <strong>{formatCurrency(totalPending)}</strong>
                    <span>{countPending + countPartially + countOverdue} with outstanding dues</span>
                  </div>
                </article>

                <article className="income-summary-card">
                  <span className="income-summary-icon income-icon-month" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                  <div className="income-summary-info">
                    <small>This Month</small>
                    <strong>{formatCurrency(thisMonthIncome)}</strong>
                    <span>{monthRecords.length} records in current month</span>
                  </div>
                </article>
              </section>

              {/* Main Table Panel */}
              <section className="income-panel">
                <div className="income-panel-heading">
                  <div>
                    <h2>Income Transactions Registry</h2>
                    <p>Audited ledger of harvest sales, agricultural by-products, subsidies, and collections.</p>
                  </div>
                  <span className="income-record-count">
                    {filteredRecords.length} {filteredRecords.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>

                {/* Compact Single-Row Filter Toolbar */}
                <div className="income-toolbar-wrapper">
                  <div className="income-toolbar">
                    <label className="income-search">
                      <span aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <input
                        aria-label="Search income records"
                        placeholder="Search Income No, Farmer, Buyer, Crop..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                      />
                    </label>

                    <IncomeDateRangeFilter
                      preset={datePreset}
                      onPresetChange={handleDatePresetChange}
                      onApplyCustomRange={handleApplyCustomRange}
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                    />

                    <select
                      aria-label="Filter by category"
                      className="income-toolbar-select"
                      value={typeFilter}
                      onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                    >
                      <option value="">All Categories</option>
                      {incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <select
                      aria-label="Filter by status"
                      className="income-toolbar-select"
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                    >
                      <option value="">All Statuses</option>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <button
                      type="button"
                      className={`income-more-filters-btn ${showMoreFilters || activeAdvancedFilters.length > 0 ? 'active' : ''}`}
                      aria-expanded={showMoreFilters}
                      onClick={() => setShowMoreFilters(prev => !prev)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                      More Filters
                      {activeAdvancedFilters.length > 0 && (
                        <span className="income-filter-badge">{activeAdvancedFilters.length}</span>
                      )}
                    </button>

                    <button
                      className="income-clear-button"
                      type="button"
                      onClick={resetFilters}
                      disabled={!hasAnyActiveFilter}
                      title="Reset all filters"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      Reset
                    </button>
                  </div>

                  {/* Expandable Advanced Filters */}
                  {showMoreFilters && (
                    <div className="income-advanced-filters" aria-label="Advanced income filters">
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

                      <label className="income-filter-field">
                        <span>Income Source</span>
                        <select
                          aria-label="Filter by income source"
                          value={sourceFilter}
                          onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
                        >
                          <option value="">All Sources</option>
                          {incomeSources.map(src => <option key={src} value={src}>{src}</option>)}
                        </select>
                      </label>
                    </div>
                  )}

                  {/* Active Selected Period / Advanced Filter Chips */}
                  {(datePreset !== 'all_time' || activeAdvancedFilters.length > 0) && (
                    <div className="income-active-chips">
                      <span className="income-chips-label">Active Filters:</span>
                      {datePreset !== 'all_time' && (
                        <span className="income-filter-chip">
                          Period: {selectedPeriodLabel}
                          <button type="button" aria-label="Clear period filter" onClick={() => handleDatePresetChange('all_time')}>×</button>
                        </span>
                      )}
                      {activeAdvancedFilters.map(chip => (
                        <span key={chip.key} className="income-filter-chip">
                          {chip.label}
                          <button type="button" aria-label={`Remove ${chip.label}`} onClick={chip.clear}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {notice && (
                  <div className="income-notice" role="status">
                    <span>✓ {notice}</span>
                    <button type="button" className="income-notice-dismiss" onClick={() => setNotice('')} aria-label="Dismiss notice">
                      ✕
                    </button>
                  </div>
                )}

                {error && (
                  <div className="income-error" role="alert">
                    <div className="income-error-content">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{error}</span>
                    </div>
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
                      ) : error && safeRecords.length === 0 ? (
                        <tr>
                          <td colSpan="10">
                            <div className="income-empty income-empty-error">
                              <span className="income-empty-icon is-error" aria-hidden="true">!</span>
                              <strong>Unable to load income records</strong>
                              <p>{error}</p>
                              <button type="button" onClick={loadData}>Retry Connection</button>
                            </div>
                          </td>
                        </tr>
                      ) : pageRecords.length === 0 ? (
                        <tr>
                          <td colSpan="10">
                            <div className="income-empty">
                              <span className="income-empty-icon" aria-hidden="true">₹</span>
                              <strong>{safeRecords.length ? 'No transactions match your filters' : 'No income records found'}</strong>
                              <p>
                                {safeRecords.length
                                  ? 'Try adjusting your search terms, date range, or clear active filters.'
                                  : 'Start tracking your farm revenue by recording your first income transaction.'}
                              </p>
                              {safeRecords.length ? (
                                <button type="button" onClick={resetFilters}>Reset Filters</button>
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
              loading={loading}
              error={error}
              onRetry={loadData}
              datePreset={datePreset}
              onDatePresetChange={handleDatePresetChange}
              onApplyCustomRange={handleApplyCustomRange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedPeriodLabel={selectedPeriodLabel}
            />
          )}
        </>
      ) : isFormScreen(screen) ? (
        /* 5-Step Guided Income Form */
        <section className="income-form-screen">
          <button className="income-back-link" type="button" disabled={busy} onClick={() => returnToList()}>
            ← Back to Income Ledger
          </button>

          <header className="income-page-heading income-wizard-header">
            <div>
              <div className="income-breadcrumb">
                <span>Finance</span>
                <span>/</span>
                <span>Income Management</span>
                <span>/</span>
                <strong>{screen === 'edit' ? 'Edit Income' : 'Record Income'}</strong>
              </div>
              <h1>{screen === 'edit' ? 'Edit Income' : 'Record Income'}</h1>
              <p>
                {screen === 'edit'
                  ? `Update financial values, crop particulars, and settlement terms for ${selectedRecord?.incomeNo || 'this record'}.`
                  : 'Create a new income transaction with agricultural and collection details.'}
              </p>
            </div>
            <div className="income-step-counter" aria-live="polite">
              {reviewMode ? 'Final Review' : `Step ${formStep} of 5`}
            </div>
          </header>

          {/* Horizontal 5-Step Progress Indicator */}
          <nav className="income-stepper" aria-label="Income form progress">
            {INCOME_FORM_STEPS.map((step, idx) => {
              const isCompleted = reviewMode || step.id < formStep
              const isCurrent = !reviewMode && step.id === formStep
              const isClickable = isCompleted && !busy
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    className={`income-step-item ${isCompleted ? 'is-completed' : ''} ${isCurrent ? 'is-current' : ''}`}
                    disabled={!isClickable}
                    onClick={() => handleJumpToStep(step.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span className="income-step-circle">
                      {isCompleted ? '✓' : step.id}
                    </span>
                    <span className="income-step-label">{step.label}</span>
                  </button>
                  {idx < INCOME_FORM_STEPS.length - 1 && (
                    <span
                      className={`income-step-connector ${isCompleted ? 'is-completed' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              )
            })}
          </nav>

          {error && (
            <div className="income-error" role="alert" style={{ margin: '0 0 16px' }}>
              <div className="income-error-content">
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Two-Column Workspace: Left Active Step (65-70%) + Right Persistent Summary (30-35%) */}
          <div className="income-wizard-layout">
            <form
              className="income-wizard-main"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                if (reviewMode) {
                  submitForm(e)
                } else if (formStep < 5) {
                  handleStepContinue()
                } else {
                  handleEnterReview()
                }
              }}
            >
              {!reviewMode ? (
                <div className="income-wizard-card">
                  <div className="income-section-heading">
                    <span className="income-section-step">{formStep}</span>
                    <div>
                      <h2>{INCOME_FORM_STEPS[formStep - 1].label}</h2>
                      <p>{INCOME_FORM_STEPS[formStep - 1].subtitle}</p>
                    </div>
                  </div>

                  {/* STEP 1: BASIC INFORMATION */}
                  {formStep === 1 && (
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
                        label="Income Number"
                        name="incomeNo"
                        hint="Auto-generated by backend on save"
                      >
                        <input
                          id="incomeNo"
                          name="incomeNo"
                          value={formValues.incomeNo || 'Auto-generated on save'}
                          readOnly
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
                  )}

                  {/* STEP 2: AGRICULTURAL INFORMATION */}
                  {formStep === 2 && (
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

                      <FormField label="Crop / Produce" name="crop" hint="Harvest produce or commodity (optional for non-crop)">
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

                      <FormField label="Agricultural Season" name="season" full hint="Harvest or production season">
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
                  )}

                  {/* STEP 3: AMOUNT & CALCULATION */}
                  {formStep === 3 && (
                    <div>
                      <div className="income-calc-mode-switch" role="group" aria-label="Calculation mode">
                        <button
                          type="button"
                          className={`income-mode-btn ${formValues.calcMode === 'rate' ? 'active' : ''}`}
                          onClick={() => setFormValues(curr => ({ ...curr, calcMode: 'rate' }))}
                        >
                          Quantity × Unit Rate Calculation
                        </button>
                        <button
                          type="button"
                          className={`income-mode-btn ${formValues.calcMode === 'direct' ? 'active' : ''}`}
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

                            <FormField label="Rate per Unit (₹)" name="rate" error={formErrors.rate} required full>
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
                      </div>
                    </div>
                  )}

                  {/* STEP 4: COLLECTION & SETTLEMENT */}
                  {formStep === 4 && (
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
                          aria-invalid={Boolean(formErrors.paymentMode)}
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

                      <FormField label="Collection Status" name="status" hint="Calculated automatically from collections">
                        <select
                          id="status"
                          name="status"
                          value={formValues.status}
                          onChange={updateField}
                        >
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </FormField>
                    </div>
                  )}

                  {/* STEP 5: SUPPORTING INFORMATION & NOTES */}
                  {formStep === 5 && (
                    <div className="income-form-grid">
                      <FormField label="Invoice / Bill Number" name="invoiceNo" full hint="Commercial tax invoice or mandi slip">
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
                          rows="4"
                          maxLength="500"
                          placeholder="Enter additional remarks or transaction notes..."
                          value={formValues.remarks}
                          onChange={updateField}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              ) : (
                /* FINAL REVIEW BEFORE SAVING */
                <div className="income-wizard-card income-review-card">
                  <div className="income-section-heading">
                    <span className="income-section-step">✓</span>
                    <div>
                      <h2>Review Income Transaction</h2>
                      <p>Verify all details below before saving to the Income Ledger.</p>
                    </div>
                  </div>

                  <div className="income-review-sections">
                    <div className="income-review-block">
                      <div className="income-review-block-head">
                        <h3>1. Basic Information</h3>
                        <button type="button" onClick={() => handleJumpToStep(1)}>Edit</button>
                      </div>
                      <dl className="income-review-dl">
                        <div><dt>Income Date</dt><dd>{formatDate(formValues.incomeDate)}</dd></div>
                        <div><dt>Category</dt><dd>{formValues.incomeType || '—'}</dd></div>
                        <div><dt>Source</dt><dd>{formValues.incomeSource || '—'}</dd></div>
                        <div><dt>Description</dt><dd>{formValues.description || '—'}</dd></div>
                      </dl>
                    </div>

                    <div className="income-review-block">
                      <div className="income-review-block-head">
                        <h3>2. Agricultural Information</h3>
                        <button type="button" onClick={() => handleJumpToStep(2)}>Edit</button>
                      </div>
                      <dl className="income-review-dl">
                        <div><dt>Farmer / Operator</dt><dd>{formValues.farmer || '—'}</dd></div>
                        <div><dt>Farm &amp; Parcel</dt><dd>{[formValues.farm, formValues.fieldParcel].filter(Boolean).join(' • ') || '—'}</dd></div>
                        <div><dt>Crop / Produce</dt><dd>{formValues.crop || '—'}</dd></div>
                        <div><dt>Season</dt><dd>{formValues.season || '—'}</dd></div>
                      </dl>
                    </div>

                    <div className="income-review-block">
                      <div className="income-review-block-head">
                        <h3>3. Amount &amp; Calculation</h3>
                        <button type="button" onClick={() => handleJumpToStep(3)}>Edit</button>
                      </div>
                      <dl className="income-review-dl">
                        <div>
                          <dt>Calculation Mode</dt>
                          <dd>{formValues.calcMode === 'rate' ? `${formValues.quantity || 0} ${formValues.unit || ''} × ${formatCurrency(formValues.rate || 0)}` : 'Direct Lump Sum'}</dd>
                        </div>
                        <div><dt>Gross Amount</dt><dd>{formatCurrency(calculatedAmounts.grossAmount)}</dd></div>
                        <div><dt>Discount / Charges</dt><dd>-{formatCurrency(formValues.discount || 0)} / +{formatCurrency(formValues.otherCharges || 0)}</dd></div>
                        <div><dt>Final Net Income</dt><dd className="val-success"><strong>{formatCurrency(calculatedAmounts.netAmount)}</strong></dd></div>
                      </dl>
                    </div>

                    <div className="income-review-block">
                      <div className="income-review-block-head">
                        <h3>4. Collection &amp; Settlement</h3>
                        <button type="button" onClick={() => handleJumpToStep(4)}>Edit</button>
                      </div>
                      <dl className="income-review-dl">
                        <div><dt>Customer / Buyer</dt><dd>{formValues.buyer || 'Direct / Mandi'}</dd></div>
                        <div><dt>Payment Mode</dt><dd>{formValues.paymentMode} {formValues.bankCash ? `(${formValues.bankCash})` : ''}</dd></div>
                        <div><dt>Amount Received</dt><dd className="val-success">{formatCurrency(calculatedAmounts.amountReceived)}</dd></div>
                        <div><dt>Pending Receivables</dt><dd className={calculatedAmounts.pendingAmount > 0 ? 'val-warning' : ''}>{formatCurrency(calculatedAmounts.pendingAmount)}</dd></div>
                      </dl>
                    </div>

                    <div className="income-review-block">
                      <div className="income-review-block-head">
                        <h3>5. Supporting Information</h3>
                        <button type="button" onClick={() => handleJumpToStep(5)}>Edit</button>
                      </div>
                      <dl className="income-review-dl">
                        <div><dt>Invoice / Bill No</dt><dd>{formValues.invoiceNo || '—'}</dd></div>
                        <div><dt>Remarks</dt><dd>{formValues.remarks || '—'}</dd></div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* Persistent Bottom Navigation */}
              <div className="income-wizard-footer">
                <div>
                  {formStep === 1 && !reviewMode ? (
                    <button className="income-secondary-button" type="button" disabled={busy} onClick={() => returnToList()}>
                      Cancel
                    </button>
                  ) : (
                    <button className="income-secondary-button" type="button" disabled={busy} onClick={handleStepBack}>
                      ← Back
                    </button>
                  )}
                </div>

                <div className="income-wizard-footer-right">
                  {!reviewMode && formStep < 5 ? (
                    <button className="income-primary-button" type="button" disabled={busy} onClick={handleStepContinue}>
                      Continue →
                    </button>
                  ) : !reviewMode && formStep === 5 ? (
                    <button className="income-primary-button" type="button" disabled={busy} onClick={handleEnterReview}>
                      Review &amp; Save →
                    </button>
                  ) : (
                    <button className="income-primary-button" type="submit" disabled={busy || loading}>
                      {busy ? 'Saving...' : screen === 'edit' ? 'Confirm & Update Income' : 'Confirm & Save Income'}
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Right: Persistent Income Summary Panel (30-35%) */}
            <aside className="income-summary-sidebar" aria-label="Live Income Summary">
              <div className="income-summary-sidebar-head">
                <h3>Income Summary</h3>
                <span className={`income-status is-${
                  calculatedAmounts.pendingAmount <= 0
                    ? 'received'
                    : calculatedAmounts.amountReceived > 0
                    ? 'pending'
                    : 'pending'
                }`}>
                  <i />
                  {calculatedAmounts.pendingAmount <= 0
                    ? 'Received'
                    : calculatedAmounts.amountReceived > 0
                    ? 'Partially Paid'
                    : 'Pending'}
                </span>
              </div>

              <div className="income-summary-sidebar-rows">
                <div className="income-summary-row">
                  <span>Quantity</span>
                  <strong>{formValues.calcMode === 'rate' ? (formValues.quantity || '—') : '1 (Lump Sum)'}</strong>
                </div>
                <div className="income-summary-row">
                  <span>Unit</span>
                  <strong>{formValues.calcMode === 'rate' ? (formValues.unit || '—') : 'lump sum'}</strong>
                </div>
                <div className="income-summary-row">
                  <span>Rate per Unit</span>
                  <strong>{formValues.calcMode === 'rate' ? formatCurrency(formValues.rate || 0) : '—'}</strong>
                </div>
                <div className="income-summary-divider" />
                <div className="income-summary-row">
                  <span>Gross Amount</span>
                  <strong>{formatCurrency(calculatedAmounts.grossAmount)}</strong>
                </div>
                <div className="income-summary-row">
                  <span>Discounts / Deductions</span>
                  <strong>− {formatCurrency(formValues.discount || 0)}</strong>
                </div>
                <div className="income-summary-row">
                  <span>Other Charges</span>
                  <strong>+ {formatCurrency(formValues.otherCharges || 0)}</strong>
                </div>
              </div>

              <div className="income-summary-net-box">
                <span>Final Net Income</span>
                <strong>{formatCurrency(calculatedAmounts.netAmount)}</strong>
              </div>

              <div className="income-summary-sidebar-rows">
                <div className="income-summary-row">
                  <span>Amount Received</span>
                  <strong className="val-success">{formatCurrency(calculatedAmounts.amountReceived)}</strong>
                </div>
                <div className="income-summary-row">
                  <span>Pending Receivables</span>
                  <strong className={calculatedAmounts.pendingAmount > 0 ? 'val-warning' : ''}>
                    {formatCurrency(calculatedAmounts.pendingAmount)}
                  </strong>
                </div>
                <div className="income-summary-row">
                  <span>Collection Status</span>
                  <strong>
                    {calculatedAmounts.pendingAmount <= 0
                      ? 'Settled'
                      : calculatedAmounts.amountReceived > 0
                      ? 'Partial'
                      : 'Pending'}
                  </strong>
                </div>
              </div>
            </aside>
          </div>
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

function formatMonthLabel(ym) {
  if (!ym || ym === 'Unknown') return 'Unknown'
  const match = String(ym).match(/^(\d{4})-(\d{2})$/)
  if (!match) return ym
  try {
    return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(
      new Date(Number(match[1]), Number(match[2]) - 1, 1)
    )
  } catch {
    return ym
  }
}

function MonthlyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="income-chart-empty">
        No monthly trend data available for the selected period.
      </div>
    )
  }

  const chronological = [...data].sort((a, b) => a.month.localeCompare(b.month))
  const maxVal = Math.max(1, ...chronological.map(d => Math.max(d.total, d.received)))
  const chartHeight = 190
  const chartTop = 16
  const barAreaHeight = chartHeight - chartTop - 28
  const colWidth = Math.max(56, Math.min(92, Math.floor(560 / Math.max(1, chronological.length))))
  const svgWidth = Math.max(360, chronological.length * colWidth + 32)

  return (
    <div className="income-trend-chart-wrap">
      <div className="income-chart-legend">
        <span><i className="legend-dot earned" /> Total Earned</span>
        <span><i className="legend-dot received" /> Amount Received</span>
      </div>
      <div className="income-trend-svg-scroll">
        <svg
          className="income-trend-svg"
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          role="img"
          aria-label="Monthly Income Trend Chart"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick, idx) => {
            const y = chartTop + barAreaHeight * (1 - tick)
            return (
              <line
                key={idx}
                x1="12"
                x2={svgWidth - 12}
                y1={y}
                y2={y}
                className="income-chart-gridline"
              />
            )
          })}

          {chronological.map((item, idx) => {
            const xCenter = 16 + idx * colWidth + colWidth / 2
            const barW = Math.min(18, Math.floor((colWidth - 18) / 2))
            const hEarned = Math.max(2, (item.total / maxVal) * barAreaHeight)
            const hReceived = Math.max(item.received > 0 ? 2 : 0, (item.received / maxVal) * barAreaHeight)
            const yEarned = chartTop + barAreaHeight - hEarned
            const yReceived = chartTop + barAreaHeight - hReceived

            return (
              <g key={item.month}>
                <title>
                  {`${formatMonthLabel(item.month)} — Earned: ${formatCurrency(item.total)} | Received: ${formatCurrency(item.received)} (${item.count} txns)`}
                </title>
                <rect
                  x={xCenter - barW - 2}
                  y={yEarned}
                  width={barW}
                  height={hEarned}
                  rx="3"
                  className="income-bar-earned"
                />
                <rect
                  x={xCenter + 2}
                  y={yReceived}
                  width={barW}
                  height={hReceived}
                  rx="3"
                  className="income-bar-received"
                />
                <text
                  x={xCenter}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="income-chart-axis-label"
                >
                  {formatMonthLabel(item.month)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function HorizontalBarList({ items, totalSum, emptyText = 'No breakdown data available.' }) {
  if (!items || items.length === 0) {
    return <div className="income-chart-empty">{emptyText}</div>
  }

  const maxVal = Math.max(1, ...items.map(i => Number(i.total || 0)))
  return (
    <div className="income-hbar-list">
      {items.map(item => {
        const pct = totalSum > 0 ? ((item.total / totalSum) * 100).toFixed(1) : '0.0'
        const widthPct = Math.max(3, (item.total / maxVal) * 100)
        return (
          <div key={item.label} className="income-hbar-item">
            <div className="income-hbar-meta">
              <span className="income-hbar-label" title={item.label}>{item.label}</span>
              <span className="income-hbar-value">
                {formatCurrency(item.total)}
                {totalSum > 0 && <small> ({pct}%)</small>}
              </span>
            </div>
            <div className="income-hbar-track">
              <div className="income-hbar-fill" style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// In-module Reports & Analytics Section (Tab 2)
function IncomeReportsSection({
  records,
  reportType,
  setReportType,
  loading,
  error,
  onRetry,
  datePreset,
  onDatePresetChange,
  onApplyCustomRange,
  dateFrom,
  dateTo,
  selectedPeriodLabel,
}) {
  const [reportSeasonFilter, setReportSeasonFilter] = useState('')
  const [farmCropView, setFarmCropView] = useState('farm')

  const activeRecords = useMemo(() => {
    const nonCancelled = records.filter(r => r.status !== 'Cancelled')
    return nonCancelled.filter(r => {
      if (reportSeasonFilter && r.season !== reportSeasonFilter) return false
      if (dateFrom && (!r.incomeDate || r.incomeDate < dateFrom)) return false
      if (dateTo && (!r.incomeDate || r.incomeDate > dateTo)) return false
      return true
    })
  }, [records, dateFrom, dateTo, reportSeasonFilter])

  const totalEarned = useMemo(
    () => activeRecords.reduce((s, r) => s + Number(r.netAmount || 0), 0),
    [activeRecords]
  )
  const totalCollected = useMemo(
    () => activeRecords.reduce((s, r) => s + Number(r.amountReceived || 0), 0),
    [activeRecords]
  )
  const totalOutstanding = useMemo(
    () => activeRecords.reduce((s, r) => s + Number(r.pendingAmount || 0), 0),
    [activeRecords]
  )
  const averageTransaction = activeRecords.length > 0 ? totalEarned / activeRecords.length : 0
  const collectionRate = totalEarned > 0 ? Math.min(100, (totalCollected / totalEarned) * 100) : 0

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
    let filename = `AGRIMAN_Income_Report_${reportType}_${datePreset}_${localDate()}.csv`

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
      headers = ['Metric', 'Value']
      rows = [
        ['Total Transactions', activeRecords.length],
        ['Total Net Revenue', totalEarned],
        ['Total Amount Received', totalCollected],
        ['Total Outstanding Pending', totalOutstanding],
        ['Average Transaction Size', averageTransaction.toFixed(2)],
        ['Collection Efficiency %', `${collectionRate.toFixed(1)}%`],
      ]
    }

    const csvContent = [
      `# Period: ${selectedPeriodLabel}${reportSeasonFilter ? ` | Season: ${reportSeasonFilter}` : ''}`,
      headers.join(','),
      ...rows.map(e => e.join(',')),
    ].join('\n')
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

  const overdueTotal = receivablesAging.filter(r => r.isOverdue).reduce((s, r) => s + Number(r.pendingAmount || 0), 0)
  const withinTermsTotal = receivablesAging.filter(r => !r.isOverdue).reduce((s, r) => s + Number(r.pendingAmount || 0), 0)

  return (
    <section className="income-reports-wrapper" aria-label="Income Reports and Analytics">
      {/* Report Selection & Export Toolbar */}
      <div className="income-reports-toolbar">
        <div className="income-reports-controls">
          <div className="income-report-control-group">
            <label htmlFor="income-report-view-select">Report View</label>
            <select
              id="income-report-view-select"
              className="income-report-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
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

          <div className="income-report-control-group">
            <label>Date Range</label>
            <IncomeDateRangeFilter
              preset={datePreset}
              onPresetChange={onDatePresetChange}
              onApplyCustomRange={onApplyCustomRange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              compact
            />
          </div>

          <div className="income-report-control-group">
            <label htmlFor="income-report-season-select">Season</label>
            <select
              id="income-report-season-select"
              className="income-report-select is-compact"
              value={reportSeasonFilter}
              onChange={(e) => setReportSeasonFilter(e.target.value)}
            >
              <option value="">All Seasons</option>
              {seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="income-reports-actions">
          <button
            className="income-secondary-button"
            type="button"
            onClick={exportReportCSV}
            disabled={loading || activeRecords.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
          <button
            className="income-secondary-button"
            type="button"
            onClick={handlePrint}
            disabled={loading || activeRecords.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        {loading ? (
          <div className="income-report-state" role="status">
            <div className="income-report-spinner" aria-hidden="true" />
            <strong>Loading Income Analytics...</strong>
            <p>Fetching live income transactions and preparing financial summaries.</p>
          </div>
        ) : error && records.length === 0 ? (
          <div className="income-report-state is-error" role="alert">
            <span className="income-empty-icon is-error" aria-hidden="true">!</span>
            <strong>Unable to load report data</strong>
            <p>{error}</p>
            {onRetry && (
              <button className="income-secondary-button" type="button" onClick={onRetry}>
                Retry Connection
              </button>
            )}
          </div>
        ) : activeRecords.length === 0 ? (
          <div className="income-report-state">
            <span className="income-empty-icon" aria-hidden="true">₹</span>
            <strong>No income data available</strong>
            <p>
              {records.length > 0
                ? 'No active income transactions match the selected reporting period or season.'
                : 'No income transactions have been recorded yet for reporting.'}
            </p>
            {(datePreset !== 'all_time' || reportSeasonFilter) && (
              <button
                className="income-secondary-button"
                type="button"
                onClick={() => { onDatePresetChange('all_time'); setReportSeasonFilter('') }}
              >
                Reset Report Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {error && (
              <div className="income-error" role="alert" style={{ margin: '0 0 16px' }}>
                <div className="income-error-content">
                  <span>{error}</span>
                </div>
                {onRetry && <button type="button" onClick={onRetry}>Retry</button>}
              </div>
            )}

            {reportType === 'summary' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Executive Income &amp; Collection Summary</h3>
                    <p className="income-report-sub">
                      Comprehensive overview of earned farm revenue, cleared collections, pending dues, and category performance.
                    </p>
                  </div>
                </div>

                {/* 4 Executive Summary KPI Cards */}
                <div className="income-report-kpi-grid">
                  <article className="income-report-kpi-card accent-green">
                    <div className="income-report-kpi-top">
                      <span className="income-report-kpi-icon is-green" aria-hidden="true">₹</span>
                      <small>Total Earned Income</small>
                    </div>
                    <strong>{formatCurrency(totalEarned)}</strong>
                    <span className="income-report-kpi-sub">{activeRecords.length} active {activeRecords.length === 1 ? 'transaction' : 'transactions'}</span>
                  </article>

                  <article className="income-report-kpi-card accent-emerald">
                    <div className="income-report-kpi-top">
                      <span className="income-report-kpi-icon is-emerald" aria-hidden="true">✓</span>
                      <small>Collections Received</small>
                    </div>
                    <strong className="val-success">{formatCurrency(totalCollected)}</strong>
                    <span className="income-report-kpi-sub">{collectionRate.toFixed(1)}% of earned income cleared</span>
                  </article>

                  <article className="income-report-kpi-card accent-amber">
                    <div className="income-report-kpi-top">
                      <span className="income-report-kpi-icon is-amber" aria-hidden="true">◷</span>
                      <small>Outstanding Receivables</small>
                    </div>
                    <strong className="val-warning">{formatCurrency(totalOutstanding)}</strong>
                    <span className="income-report-kpi-sub">{receivablesAging.length} pending {receivablesAging.length === 1 ? 'invoice' : 'invoices'}</span>
                  </article>

                  <article className="income-report-kpi-card accent-blue">
                    <div className="income-report-kpi-top">
                      <span className="income-report-kpi-icon is-blue" aria-hidden="true">≈</span>
                      <small>Average Transaction Size</small>
                    </div>
                    <strong>{formatCurrency(averageTransaction)}</strong>
                    <span className="income-report-kpi-sub">Across {categorySummary.length} active {categorySummary.length === 1 ? 'category' : 'categories'}</span>
                  </article>
                </div>

                {/* Data-Driven Analytics Grid */}
                <div className="income-analytics-grid">
                  {/* A. Monthly Income Trend */}
                  <div className="income-analytics-card">
                    <div className="income-analytics-card-head">
                      <div>
                        <h4>Monthly Income Trend</h4>
                        <p>Earned revenue vs. cleared collections across active months</p>
                      </div>
                    </div>
                    <MonthlyTrendChart data={monthSummary} />
                  </div>

                  {/* B. Income by Category */}
                  <div className="income-analytics-card">
                    <div className="income-analytics-card-head">
                      <div>
                        <h4>Income by Category</h4>
                        <p>Revenue contribution across agricultural income streams</p>
                      </div>
                    </div>
                    <HorizontalBarList
                      items={categorySummary.slice(0, 6).map(c => ({ label: c.name, total: c.total }))}
                      totalSum={totalEarned}
                      emptyText="No category data available."
                    />
                  </div>

                  {/* C. Farm-wise & Crop-wise Income */}
                  <div className="income-analytics-card">
                    <div className="income-analytics-card-head with-toggle">
                      <div>
                        <h4>{farmCropView === 'farm' ? 'Farm-wise Income' : 'Crop-wise Income'}</h4>
                        <p>Top revenue-generating {farmCropView === 'farm' ? 'farms' : 'crops & produce'}</p>
                      </div>
                      <div className="income-mini-toggle" role="tablist">
                        <button
                          type="button"
                          className={farmCropView === 'farm' ? 'active' : ''}
                          onClick={() => setFarmCropView('farm')}
                        >
                          Farms
                        </button>
                        <button
                          type="button"
                          className={farmCropView === 'crop' ? 'active' : ''}
                          onClick={() => setFarmCropView('crop')}
                        >
                          Crops
                        </button>
                      </div>
                    </div>
                    <HorizontalBarList
                      items={(farmCropView === 'farm' ? farmSummary : cropSummary).slice(0, 6).map(i => ({ label: i.name, total: i.total }))}
                      totalSum={totalEarned}
                      emptyText={`No ${farmCropView} revenue data available.`}
                    />
                  </div>

                  {/* D. Collection Breakdown */}
                  <div className="income-analytics-card">
                    <div className="income-analytics-card-head">
                      <div>
                        <h4>Collection Breakdown</h4>
                        <p>Realization status of total earned farm income</p>
                      </div>
                      <span className="income-collection-pct">{collectionRate.toFixed(1)}% Collected</span>
                    </div>
                    <div className="income-collection-body">
                      <div className="income-collection-progress" aria-label={`Collection efficiency ${collectionRate.toFixed(1)}%`}>
                        <div className="income-collection-progress-fill" style={{ width: `${collectionRate}%` }} />
                      </div>
                      <div className="income-collection-rows">
                        <div className="income-collection-row">
                          <span>Total Earned Income</span>
                          <strong>{formatCurrency(totalEarned)}</strong>
                        </div>
                        <div className="income-collection-row">
                          <span>Amount Received (Cleared)</span>
                          <strong className="val-success">{formatCurrency(totalCollected)}</strong>
                        </div>
                        <div className="income-collection-row">
                          <span>Outstanding Receivables</span>
                          <strong className="val-warning">{formatCurrency(totalOutstanding)}</strong>
                        </div>
                        <div className="income-collection-row">
                          <span>Overdue Beyond Terms</span>
                          <strong className={overdueTotal > 0 ? 'val-danger' : ''}>{formatCurrency(overdueTotal)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'category' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Category-wise Income &amp; Revenue Breakdown</h3>
                    <p className="income-report-sub">Distribution of earned revenue, collections, and pending dues across income categories.</p>
                  </div>
                </div>
                <div className="income-report-visual-box">
                  <HorizontalBarList
                    items={categorySummary.map(c => ({ label: c.name, total: c.total }))}
                    totalSum={totalEarned}
                  />
                </div>
                <div className="income-table-wrap">
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
                        const share = totalEarned > 0 ? ((c.total / totalEarned) * 100).toFixed(1) : '0.0'
                        return (
                          <tr key={c.name}>
                            <td><strong>{c.name}</strong></td>
                            <td>{c.count}</td>
                            <td className="income-number-cell">{formatCurrency(c.total)}</td>
                            <td className="income-number-cell val-success">{formatCurrency(c.received)}</td>
                            <td className="income-number-cell" style={{ color: c.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(c.pending)}</td>
                            <td className="income-number-cell">{share}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="income-table-total-row">
                        <td><strong>Total</strong></td>
                        <td><strong>{activeRecords.length}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalEarned)}</strong></td>
                        <td className="income-number-cell val-success"><strong>{formatCurrency(totalCollected)}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalOutstanding)}</strong></td>
                        <td className="income-number-cell"><strong>100.0%</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'farm' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Farm-wise Revenue Generation</h3>
                    <p className="income-report-sub">Comparative income performance and receivables across individual farm parcels.</p>
                  </div>
                </div>
                <div className="income-report-visual-box">
                  <HorizontalBarList
                    items={farmSummary.map(f => ({ label: f.name, total: f.total }))}
                    totalSum={totalEarned}
                  />
                </div>
                <div className="income-table-wrap">
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
                          <td className="income-number-cell val-success">{formatCurrency(f.received)}</td>
                          <td className="income-number-cell" style={{ color: f.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(f.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="income-table-total-row">
                        <td><strong>Total</strong></td>
                        <td><strong>{activeRecords.length}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalEarned)}</strong></td>
                        <td className="income-number-cell val-success"><strong>{formatCurrency(totalCollected)}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalOutstanding)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'crop' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Crop &amp; Produce Commodity Revenue</h3>
                    <p className="income-report-sub">Sales volume and total revenue generated by each crop or agricultural commodity.</p>
                  </div>
                </div>
                <div className="income-report-visual-box">
                  <HorizontalBarList
                    items={cropSummary.map(c => ({ label: c.name, total: c.total }))}
                    totalSum={totalEarned}
                  />
                </div>
                <div className="income-table-wrap">
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
                    <tfoot>
                      <tr className="income-table-total-row">
                        <td><strong>Total</strong></td>
                        <td><strong>{activeRecords.length}</strong></td>
                        <td>—</td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalEarned)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Month-by-Month Income Trend</h3>
                    <p className="income-report-sub">Chronological monthly revenue earned, cleared collections, and pending balances.</p>
                  </div>
                </div>
                <div className="income-report-visual-box">
                  <MonthlyTrendChart data={monthSummary} />
                </div>
                <div className="income-table-wrap">
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
                          <td><strong>{formatMonthLabel(m.month)}</strong></td>
                          <td>{m.count}</td>
                          <td className="income-number-cell">{formatCurrency(m.total)}</td>
                          <td className="income-number-cell val-success">{formatCurrency(m.received)}</td>
                          <td className="income-number-cell" style={{ color: m.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(m.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="income-table-total-row">
                        <td><strong>Total</strong></td>
                        <td><strong>{activeRecords.length}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalEarned)}</strong></td>
                        <td className="income-number-cell val-success"><strong>{formatCurrency(totalCollected)}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalOutstanding)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'season' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Agricultural Season Income Distribution</h3>
                    <p className="income-report-sub">Income breakdown across Kharif, Rabi, Zaid, and annual agricultural seasons.</p>
                  </div>
                </div>
                <div className="income-report-visual-box">
                  <HorizontalBarList
                    items={seasonSummary.map(s => ({ label: s.season, total: s.total }))}
                    totalSum={totalEarned}
                  />
                </div>
                <div className="income-table-wrap">
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
                          <td className="income-number-cell val-success">{formatCurrency(s.received)}</td>
                          <td className="income-number-cell" style={{ color: s.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(s.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="income-table-total-row">
                        <td><strong>Total</strong></td>
                        <td><strong>{activeRecords.length}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalEarned)}</strong></td>
                        <td className="income-number-cell val-success"><strong>{formatCurrency(totalCollected)}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalOutstanding)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'buyer' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Customer &amp; Buyer Revenue Ledger</h3>
                    <p className="income-report-sub">Total sales, cleared payments, and outstanding credit balances by buyer.</p>
                  </div>
                </div>
                <div className="income-report-visual-box">
                  <HorizontalBarList
                    items={buyerSummary.slice(0, 8).map(b => ({ label: b.buyer, total: b.total }))}
                    totalSum={totalEarned}
                  />
                </div>
                <div className="income-table-wrap">
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
                          <td className="income-number-cell val-success">{formatCurrency(b.received)}</td>
                          <td className="income-number-cell" style={{ color: b.pending > 0 ? '#b45309' : '#64748b' }}>{formatCurrency(b.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="income-table-total-row">
                        <td><strong>Total</strong></td>
                        <td><strong>{activeRecords.length}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalEarned)}</strong></td>
                        <td className="income-number-cell val-success"><strong>{formatCurrency(totalCollected)}</strong></td>
                        <td className="income-number-cell"><strong>{formatCurrency(totalOutstanding)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'receivables' && (
              <div className="income-report-section">
                <div className="income-report-header">
                  <div>
                    <h3 className="income-report-title">Pending &amp; Overdue Receivables Aging Analysis</h3>
                    <p className="income-report-sub">Unsettled customer invoices ordered by collection due date.</p>
                  </div>
                </div>
                <div className="income-aging-strip">
                  <div className="income-aging-pill">
                    <span>Open Invoices</span>
                    <strong>{receivablesAging.length}</strong>
                  </div>
                  <div className="income-aging-pill">
                    <span>Within Terms</span>
                    <strong>{formatCurrency(withinTermsTotal)}</strong>
                  </div>
                  <div className="income-aging-pill is-overdue">
                    <span>Overdue Balance</span>
                    <strong>{formatCurrency(overdueTotal)}</strong>
                  </div>
                </div>
                <div className="income-table-wrap">
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
                            <td className="income-number-cell val-success">{formatCurrency(r.amountReceived)}</td>
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
                    {receivablesAging.length > 0 && (
                      <tfoot>
                        <tr className="income-table-total-row">
                          <td colSpan="4"><strong>Total Outstanding</strong></td>
                          <td className="income-number-cell">
                            <strong>{formatCurrency(receivablesAging.reduce((s, r) => s + Number(r.netAmount || 0), 0))}</strong>
                          </td>
                          <td className="income-number-cell val-success">
                            <strong>{formatCurrency(receivablesAging.reduce((s, r) => s + Number(r.amountReceived || 0), 0))}</strong>
                          </td>
                          <td className="income-number-cell" style={{ color: '#b45309' }}>
                            <strong>{formatCurrency(totalOutstanding)}</strong>
                          </td>
                          <td colSpan="2" />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
