import TableActionMenu from '../../TableActionMenu'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  computePaymentSummaryCards,
  createPayment,
  deletePayment,
  cancelPayment,
  displayDateToIso,
  formatCurrency,
  formatDate,
  getNextPaymentNo,
  isoToDisplayDate,
  listOutstandingExpenses,
  listPaymentBankAccounts,
  listPaymentCrops,
  listPaymentFarms,
  listPaymentLabours,
  listPayments,
  listPaymentSuppliers,
  localDate,
  normalizePayment,
  parseDecimal,
  PAYEE_TYPES,
  PAYMENT_MODES,
  PAYMENT_PURPOSES,
  PAYMENT_STATUSES,
  SEASONS,
  updatePayment,
} from './paymentService.js'
import './payments.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Completed', 'Pending', 'Processing', 'Failed', 'Cancelled']
const PAGE_SIZE = 10

const REPORT_TYPES = [
  { key: 'summary', label: 'Payment Summary', icon: '📊' },
  { key: 'by-purpose', label: 'By Purpose / Category', icon: '🏷️' },
  { key: 'by-payee', label: 'By Payee Name', icon: '👥' },
  { key: 'by-payee-type', label: 'By Payee Type', icon: '🏢' },
  { key: 'by-mode', label: 'By Payment Mode', icon: '💳' },
  { key: 'by-farm', label: 'By Farm Allocation', icon: '🌾' },
  { key: 'by-crop', label: 'By Crop Cost', icon: '🌱' },
  { key: 'monthly-outflow', label: 'Monthly Outflow Trend', icon: '📈' },
  { key: 'seasonal-outflow', label: 'Seasonal Outflow', icon: '🌤️' },
  { key: 'pending-disbursements', label: 'Pending Disbursements', icon: '⏳' },
  { key: 'cheques-issued', label: 'Cheques Register', icon: '📑' },
  { key: 'top-disbursements', label: 'Top Disbursements', icon: '🔝' },
]

// ─── Helper: Number to Words (INR) for Voucher ────────────────────────────────

function numberToWordsINR(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0))
  if (num === 0) return 'Zero Rupees Only'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertBelowThousand(n) {
    let str = ''
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      str += ones[n] + ' '
    }
    return str.trim()
  }

  let words = ''
  const crore = Math.floor(num / 10000000)
  let rem = num % 10000000

  const lakh = Math.floor(rem / 100000)
  rem = rem % 100000

  const thousand = Math.floor(rem / 1000)
  rem = rem % 1000

  if (crore > 0) words += convertBelowThousand(crore) + ' Crore '
  if (lakh > 0) words += convertBelowThousand(lakh) + ' Lakh '
  if (thousand > 0) words += convertBelowThousand(thousand) + ' Thousand '
  if (rem > 0) words += convertBelowThousand(rem) + ' '

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ')
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls = {
    Completed: 'pay-status-completed',
    Pending: 'pay-status-pending',
    Processing: 'pay-status-processing',
    Failed: 'pay-status-failed',
    Cancelled: 'pay-status-cancelled',
  }[status] || 'pay-status-completed'
  return <span className={`pay-status ${cls}`}>{status || 'Completed'}</span>
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary, loading }) {
  const cards = [
    { label: 'Total Payments', value: formatCurrency(summary.totalPayments), icon: '₹', hint: `${summary.totalRecords} registered outflows`, color: 'primary' },
    { label: 'Successfully Paid', value: formatCurrency(summary.successfulAmount), icon: '✓', hint: 'Completed settlements', color: 'success' },
    { label: 'Pending Outflows', value: formatCurrency(summary.pendingAmount), icon: '⏳', hint: 'Pending & in-transit', color: 'warning' },
    { label: 'This Month', value: formatCurrency(summary.thisMonthAmount), icon: '📅', hint: 'Current month total', color: 'info' },
  ]
  return (
    <div className="pay-summary">
      {cards.map((card) => (
        <article key={card.label} className={`pay-summary-card pay-card-${card.color}`}>
          <span className="pay-card-icon">{card.icon}</span>
          <div className="pay-card-body">
            <small>{card.label.toUpperCase()}</small>
            <strong className={loading ? 'pay-skeleton' : ''}>{loading ? '—' : card.value}</strong>
            <span className="pay-card-hint">{card.hint}</span>
          </div>
          <b className="pay-card-arrow">↗</b>
        </article>
      ))}
    </div>
  )
}

// ─── Filter Date Input (Displays dd/mm/yyyy with calendar trigger) ─────────────

function FilterDateInput({ id, value, min, max, onChange, placeholder, ariaLabel }) {
  const [typedText, setTypedText] = useState('')
  const nativePickerRef = useRef(null)

  useEffect(() => {
    setTypedText(value ? isoToDisplayDate(value) : '')
  }, [value])

  const handleTextChange = (e) => {
    const raw = e.target.value
    setTypedText(raw)
    if (!raw.trim()) {
      onChange('')
      return
    }
    const iso = displayDateToIso(raw)
    if (iso) onChange(iso)
  }

  const handleBlur = () => {
    if (typedText && !displayDateToIso(typedText)) {
      setTypedText(value ? isoToDisplayDate(value) : '')
    }
  }

  const handleNativeChange = (e) => {
    const iso = e.target.value
    if (iso) {
      setTypedText(isoToDisplayDate(iso))
      onChange(iso)
    } else {
      setTypedText('')
      onChange('')
    }
  }

  const openPicker = () => {
    if (!nativePickerRef.current) return
    try {
      if (nativePickerRef.current.showPicker) {
        nativePickerRef.current.showPicker()
      } else {
        nativePickerRef.current.click()
      }
    } catch {
      nativePickerRef.current.click()
    }
  }

  return (
    <div className="pay-date-filter-wrap">
      <input
        type="text"
        id={id}
        className="pay-input pay-date-text-input"
        placeholder={placeholder}
        value={typedText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <button
        type="button"
        className="pay-date-picker-trigger"
        onClick={openPicker}
        aria-label={`Open calendar for ${ariaLabel}`}
        title="Open calendar picker"
        tabIndex={-1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={nativePickerRef}
        type="date"
        className="pay-date-native-hidden"
        value={value || ''}
        min={min}
        max={max}
        onChange={handleNativeChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}

// ─── Payment Form (Add / Edit) ────────────────────────────────────────────────

function PaymentForm({
  initialData,
  onSave,
  onCancel,
  saving,
  suppliers = [],
  labours = [],
  bankAccounts = [],
  farms = [],
  crops = [],
  expenses = [],
}) {
  const isEdit = Boolean(initialData?.id)

  const [form, setForm] = useState({
    paymentNo: initialData?.paymentNo || '',
    paymentDate: initialData?.paymentDate || localDate(),
    purpose: initialData?.purpose || PAYMENT_PURPOSES[0],
    category: initialData?.category || '',
    payeeType: initialData?.payeeType || PAYEE_TYPES[0],
    payeeName: initialData?.payeeName || '',
    contactInfo: initialData?.contactInfo || '',
    farm: initialData?.farm || '',
    fieldParcel: initialData?.fieldParcel || '',
    crop: initialData?.crop || '',
    season: initialData?.season || 'Kharif (Monsoon)',
    refType: initialData?.refType || 'None',
    refNo: initialData?.refNo || '',
    originalAmount: initialData?.originalAmount != null ? String(initialData.originalAmount) : '',
    outstandingAmount: initialData?.outstandingAmount != null ? String(initialData.outstandingAmount) : '',
    amount: initialData?.amount != null ? String(initialData.amount) : '',
    additionalCharges: initialData?.additionalCharges != null ? String(initialData.additionalCharges) : '0',
    discount: initialData?.discount != null ? String(initialData.discount) : '0',
    paymentMode: initialData?.paymentMode || 'Bank Transfer',
    bankAccount: initialData?.bankAccount || (bankAccounts[0]?.name || 'AGRIMAN Farm Account'),
    transactionRef: initialData?.transactionRef || '',
    chequeNo: initialData?.chequeNo || '',
    chequeDate: initialData?.chequeDate || '',
    remarks: initialData?.remarks || '',
    status: initialData?.status || 'Completed',
  })

  const [errors, setErrors] = useState({})

  // Auto-fill code if adding new
  useEffect(() => {
    if (!isEdit && !form.paymentNo) {
      getNextPaymentNo().then((code) => setForm((prev) => ({ ...prev, paymentNo: code })))
    }
  }, [isEdit, form.paymentNo])

  const calculatedTotal = useMemo(() => {
    const a = parseDecimal(form.amount)
    const c = parseDecimal(form.additionalCharges)
    const d = parseDecimal(form.discount)
    return Math.max(0, Math.round((a + c - d) * 100) / 100)
  }, [form.amount, form.additionalCharges, form.discount])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Handle payee selection helper
  const handlePayeeSelect = (e) => {
    const selectedName = e.target.value
    if (!selectedName) return

    handleChange('payeeName', selectedName)

    if (form.payeeType === 'Supplier / Vendor') {
      const match = suppliers.find((s) => s.name === selectedName)
      if (match?.mobile) handleChange('contactInfo', match.mobile)
    } else if (form.payeeType === 'Employee / Labourer') {
      const match = labours.find((l) => l.name === selectedName)
      if (match?.mobile) handleChange('contactInfo', match.mobile)
    }
  }

  // Handle Expense link helper
  const handleExpenseLink = (e) => {
    const expNo = e.target.value
    handleChange('refNo', expNo)
    if (!expNo) return

    const match = expenses.find((x) => (x.expenseNo || `EXP-${x.id}`) === expNo)
    if (match) {
      handleChange('refType', 'Expense')
      handleChange('originalAmount', String(match.amount || ''))
      const pending = Math.max(0, (match.amount || 0) - (match.amountPaid || 0))
      handleChange('outstandingAmount', String(pending))
      if (!form.amount || parseDecimal(form.amount) === 0) {
        handleChange('amount', String(pending > 0 ? pending : match.amount))
      }
      if (match.supplier && !form.payeeName) {
        handleChange('payeeName', match.supplier)
        handleChange('payeeType', 'Supplier / Vendor')
      }
      if (match.farm && !form.farm) handleChange('farm', match.farm)
      if (match.crop && !form.crop) handleChange('crop', match.crop)
      if (match.expenseCategory && !form.category) handleChange('category', match.expenseCategory)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}

    if (!form.paymentNo.trim()) errs.paymentNo = 'Payment number is required.'
    if (!form.paymentDate) errs.paymentDate = 'Payment date is required.'
    if (!form.payeeName.trim()) errs.payeeName = 'Payee name is required.'
    if (!form.purpose.trim()) errs.purpose = 'Purpose is required.'
    if (parseDecimal(form.amount) <= 0) errs.amount = 'Amount must be greater than zero.'
    if (!form.paymentMode.trim()) errs.paymentMode = 'Payment method is required.'

    if (form.paymentMode === 'Cheque' && !form.chequeNo.trim()) {
      errs.chequeNo = 'Cheque number is required for Cheque payment mode.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSave({
      ...form,
      bankAccountId: bankAccounts.find((b) => b.name === form.bankAccount)?.id ?? initialData?.bankAccountId ?? null,
      supplierId: form.payeeType === 'Supplier / Vendor'
        ? (suppliers.find((s) => s.name === form.payeeName)?.id ?? initialData?.supplierId ?? null)
        : null,
      labourId: form.payeeType === 'Employee / Labourer'
        ? (labours.find((l) => l.name === form.payeeName)?.id ?? initialData?.labourId ?? null)
        : null,
      totalAmount: calculatedTotal,
    })
  }

  return (
    <div className="pay-form-overlay" role="dialog" aria-modal="true" aria-labelledby="pay-form-title">
      <div className="pay-form-card">
        <div className="pay-form-header">
          <div>
            <div className="pay-eyebrow">FINANCE <span>/</span> PAYMENTS</div>
            <h2 id="pay-form-title" className="pay-form-title">
              {isEdit ? 'Edit Payment Record' : 'Record Outgoing Payment'}
            </h2>
            <p className="pay-form-subtitle">
              Settle supplier invoices, disburse labour wages, pay loan EMIs, or record farm operational expenses.
            </p>
          </div>
          <button type="button" className="pay-modal-close" onClick={onCancel} aria-label="Close form">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="pay-form-body">

            {/* SECTION A: Basic Payment Information */}
            <fieldset className="pay-form-section">
              <legend>A. Basic Payment Information</legend>
              <div className="pay-form-grid pay-grid-3">
                <div className="pay-field">
                  <label htmlFor="f-paymentNo">Payment Voucher No *</label>
                  <input
                    id="f-paymentNo"
                    type="text"
                    className={`pay-input ${errors.paymentNo ? 'pay-input-err' : ''}`}
                    value={form.paymentNo}
                    onChange={(e) => handleChange('paymentNo', e.target.value)}
                    placeholder="PAY-2026-0001"
                    required
                  />
                  {errors.paymentNo && <span className="pay-err-msg">{errors.paymentNo}</span>}
                </div>

                <div className="pay-field">
                  <label htmlFor="f-paymentDate">Payment Date *</label>
                  <input
                    id="f-paymentDate"
                    type="date"
                    className={`pay-input ${errors.paymentDate ? 'pay-input-err' : ''}`}
                    value={form.paymentDate}
                    onChange={(e) => handleChange('paymentDate', e.target.value)}
                    required
                  />
                  {errors.paymentDate && <span className="pay-err-msg">{errors.paymentDate}</span>}
                </div>

                <div className="pay-field">
                  <label htmlFor="f-purpose">Payment Purpose *</label>
                  <select
                    id="f-purpose"
                    className={`pay-input pay-select ${errors.purpose ? 'pay-input-err' : ''}`}
                    value={form.purpose}
                    onChange={(e) => {
                      handleChange('purpose', e.target.value)
                      if (!form.category) handleChange('category', e.target.value)
                    }}
                    required
                  >
                    {PAYMENT_PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.purpose && <span className="pay-err-msg">{errors.purpose}</span>}
                </div>
              </div>
            </fieldset>

            {/* SECTION B: Payee Information */}
            <fieldset className="pay-form-section">
              <legend>B. Payee Details</legend>
              <div className="pay-form-grid pay-grid-3">
                <div className="pay-field">
                  <label htmlFor="f-payeeType">Payee Type *</label>
                  <select
                    id="f-payeeType"
                    className="pay-input pay-select"
                    value={form.payeeType}
                    onChange={(e) => {
                      handleChange('payeeType', e.target.value)
                      handleChange('payeeName', '')
                    }}
                  >
                    {PAYEE_TYPES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-payeeName">Payee Name *</label>
                  <div className="pay-combined-input">
                    <input
                      id="f-payeeName"
                      type="text"
                      className={`pay-input ${errors.payeeName ? 'pay-input-err' : ''}`}
                      value={form.payeeName}
                      onChange={(e) => handleChange('payeeName', e.target.value)}
                      placeholder="Enter payee or select below"
                      required
                    />
                    {form.payeeType === 'Supplier / Vendor' && suppliers.length > 0 && (
                      <select className="pay-quick-select" onChange={handlePayeeSelect} defaultValue="" aria-label="Select registered supplier">
                        <option value="" disabled>Select Supplier...</option>
                        {suppliers.map((s) => <option key={s.id ?? s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    )}
                    {form.payeeType === 'Employee / Labourer' && labours.length > 0 && (
                      <select className="pay-quick-select" onChange={handlePayeeSelect} defaultValue="" aria-label="Select registered labourer">
                        <option value="" disabled>Select Labourer...</option>
                        {labours.map((l) => <option key={l.id ?? l.name} value={l.name}>{l.name}</option>)}
                      </select>
                    )}
                  </div>
                  {errors.payeeName && <span className="pay-err-msg">{errors.payeeName}</span>}
                </div>

                <div className="pay-field">
                  <label htmlFor="f-contactInfo">Contact / Phone Number</label>
                  <input
                    id="f-contactInfo"
                    type="text"
                    className="pay-input"
                    value={form.contactInfo}
                    onChange={(e) => handleChange('contactInfo', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </fieldset>

            {/* SECTION C: Agricultural Allocation */}
            <fieldset className="pay-form-section">
              <legend>C. Agricultural Context &amp; Allocation</legend>
              <div className="pay-form-grid pay-grid-4">
                <div className="pay-field">
                  <label htmlFor="f-farm">Farm / Location</label>
                  <input
                    id="f-farm"
                    list="farm-options"
                    type="text"
                    className="pay-input"
                    value={form.farm}
                    onChange={(e) => handleChange('farm', e.target.value)}
                    placeholder="e.g. North Field"
                  />
                  <datalist id="farm-options">
                    {farms.map((f) => <option key={f.id ?? f.name} value={f.name} />)}
                  </datalist>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-fieldParcel">Field Parcel / Block</label>
                  <input
                    id="f-fieldParcel"
                    type="text"
                    className="pay-input"
                    value={form.fieldParcel}
                    onChange={(e) => handleChange('fieldParcel', e.target.value)}
                    placeholder="Plot A, Greenhouse 1"
                  />
                </div>

                <div className="pay-field">
                  <label htmlFor="f-crop">Crop</label>
                  <input
                    id="f-crop"
                    list="crop-options"
                    type="text"
                    className="pay-input"
                    value={form.crop}
                    onChange={(e) => handleChange('crop', e.target.value)}
                    placeholder="Paddy, Cotton, Wheat"
                  />
                  <datalist id="crop-options">
                    {crops.map((c) => <option key={c.id ?? c.name} value={c.name} />)}
                  </datalist>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-season">Season</label>
                  <select
                    id="f-season"
                    className="pay-input pay-select"
                    value={form.season}
                    onChange={(e) => handleChange('season', e.target.value)}
                  >
                    <option value="">None / General</option>
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* SECTION D: Allocation & Reference Linking */}
            <fieldset className="pay-form-section">
              <legend>D. Reference &amp; Bill Allocation</legend>
              <div className="pay-form-grid pay-grid-3">
                <div className="pay-field">
                  <label htmlFor="f-refType">Reference Type</label>
                  <select
                    id="f-refType"
                    className="pay-input pay-select"
                    value={form.refType}
                    onChange={(e) => handleChange('refType', e.target.value)}
                  >
                    <option value="None">Direct Outflow (No Prior Bill)</option>
                    <option value="Expense">Expense Bill Settle</option>
                    <option value="Loan">Loan Installment / EMI</option>
                    <option value="Invoice">Purchase Invoice</option>
                    <option value="Advance">Advance Disbursement</option>
                  </select>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-refNo">Reference / Bill / Loan No</label>
                  <div className="pay-combined-input">
                    <input
                      id="f-refNo"
                      type="text"
                      className="pay-input"
                      value={form.refNo}
                      onChange={(e) => handleChange('refNo', e.target.value)}
                      placeholder="e.g. EXP-2026-0098"
                    />
                    {expenses.length > 0 && form.refType === 'Expense' && (
                      <select className="pay-quick-select" onChange={handleExpenseLink} defaultValue="" aria-label="Select registered expense">
                        <option value="" disabled>Link Expense...</option>
                        {expenses.map((x) => (
                          <option key={x.id} value={x.expenseNo || `EXP-${x.id}`}>
                            {x.expenseNo || `EXP-${x.id}`} - {x.supplier || x.expenseCategory} ({formatCurrency(x.amount)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-outstandingAmount">Outstanding Balance (₹)</label>
                  <input
                    id="f-outstandingAmount"
                    type="number"
                    step="0.01"
                    className="pay-input"
                    value={form.outstandingAmount}
                    onChange={(e) => handleChange('outstandingAmount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </fieldset>

            {/* SECTION E: Amount Details & Real-Time Calculation */}
            <fieldset className="pay-form-section">
              <legend>E. Amount Details &amp; Calculations</legend>
              <div className="pay-form-grid pay-grid-4">
                <div className="pay-field">
                  <label htmlFor="f-amount">Base Payment Amount (₹) *</label>
                  <input
                    id="f-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`pay-input pay-amount-highlight ${errors.amount ? 'pay-input-err' : ''}`}
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {errors.amount && <span className="pay-err-msg">{errors.amount}</span>}
                </div>

                <div className="pay-field">
                  <label htmlFor="f-additionalCharges">Additional Charges (₹)</label>
                  <input
                    id="f-additionalCharges"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pay-input"
                    value={form.additionalCharges}
                    onChange={(e) => handleChange('additionalCharges', e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="pay-field-hint">e.g. Bank fees, delivery</small>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-discount">Discount / Rebate (₹)</label>
                  <input
                    id="f-discount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pay-input"
                    value={form.discount}
                    onChange={(e) => handleChange('discount', e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="pay-field-hint">Supplier cash concession</small>
                </div>

                <div className="pay-field">
                  <label>Total Net Outflow (₹)</label>
                  <div className="pay-total-computed-box">
                    <strong>{formatCurrency(calculatedTotal)}</strong>
                    <span className="pay-formula-caption">= Base + Charges - Rebate</span>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* SECTION F: Payment Method & Banking */}
            <fieldset className="pay-form-section">
              <legend>F. Payment Method &amp; Banking</legend>
              <div className="pay-form-grid pay-grid-3">
                <div className="pay-field">
                  <label htmlFor="f-paymentMode">Payment Mode *</label>
                  <select
                    id="f-paymentMode"
                    className="pay-input pay-select"
                    value={form.paymentMode}
                    onChange={(e) => handleChange('paymentMode', e.target.value)}
                    required
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-bankAccount">Paid From (Bank / Cash Account) *</label>
                  <input
                    id="f-bankAccount"
                    list="bank-options"
                    type="text"
                    className="pay-input"
                    value={form.bankAccount}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    placeholder="e.g. HDFC Farm Account"
                    required
                  />
                  <datalist id="bank-options">
                    {bankAccounts.map((b) => <option key={b.id ?? b.name} value={b.name} />)}
                    <option value="Cash in Hand" />
                    <option value="Main Operational Account" />
                  </datalist>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-transactionRef">Transaction / UTR / Reference No</label>
                  <input
                    id="f-transactionRef"
                    type="text"
                    className="pay-input"
                    value={form.transactionRef}
                    onChange={(e) => handleChange('transactionRef', e.target.value)}
                    placeholder="UTR-091334812"
                  />
                </div>
              </div>

              {/* Conditional Cheque Fields */}
              {form.paymentMode === 'Cheque' && (
                <div className="pay-form-grid pay-grid-2 pay-cheque-highlight">
                  <div className="pay-field">
                    <label htmlFor="f-chequeNo">Cheque Number *</label>
                    <input
                      id="f-chequeNo"
                      type="text"
                      className={`pay-input ${errors.chequeNo ? 'pay-input-err' : ''}`}
                      value={form.chequeNo}
                      onChange={(e) => handleChange('chequeNo', e.target.value)}
                      placeholder="e.g. CHQ-882190"
                      required
                    />
                    {errors.chequeNo && <span className="pay-err-msg">{errors.chequeNo}</span>}
                  </div>
                  <div className="pay-field">
                    <label htmlFor="f-chequeDate">Cheque Issue / Due Date</label>
                    <input
                      id="f-chequeDate"
                      type="date"
                      className="pay-input"
                      value={form.chequeDate}
                      onChange={(e) => handleChange('chequeDate', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </fieldset>

            {/* SECTION G: Supporting Details & Status */}
            <fieldset className="pay-form-section">
              <legend>G. Status &amp; Supporting Remarks</legend>
              <div className="pay-form-grid pay-grid-2">
                <div className="pay-field">
                  <label htmlFor="f-status">Payment Status *</label>
                  <select
                    id="f-status"
                    className="pay-input pay-select"
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {PAYMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="pay-field">
                  <label htmlFor="f-remarks">Remarks &amp; Notes</label>
                  <input
                    id="f-remarks"
                    type="text"
                    className="pay-input"
                    value={form.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    placeholder="Specific remarks, delivery details, or terms"
                  />
                </div>
              </div>
            </fieldset>

          </div>

          <div className="pay-form-footer">
            <span className="pay-form-footnote">
              * Required fields. Completed disbursements directly update agricultural financial ledgers.
            </span>
            <div className="pay-form-actions">
              <button type="button" className="pay-btn pay-btn-secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="pay-btn pay-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Payment Record' : 'Save & Record Payment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── View Payment Modal ───────────────────────────────────────────────────────

function ViewPaymentModal({ record, onClose, onPrintVoucher, onEdit }) {
  if (!record) return null

  return (
    <div className="pay-form-overlay" role="dialog" aria-modal="true" aria-labelledby="pay-view-title">
      <div className="pay-modal-box pay-view-card">
        <div className="pay-form-header">
          <div>
            <div className="pay-eyebrow">FINANCE <span>/</span> PAYMENT SPECIFICATION</div>
            <h2 id="pay-view-title" className="pay-form-title">Payment Voucher: {record.paymentNo}</h2>
            <p className="pay-form-subtitle">Registered transaction dated {record.paymentDateDisplay || record.paymentDate}</p>
          </div>
          <button type="button" className="pay-modal-close" onClick={onClose} aria-label="Close view">×</button>
        </div>

        <div className="pay-modal-body pay-view-body">
          <div className="pay-view-top-bar">
            <div>
              <span className="pay-view-label">TRANSACTION STATUS</span>
              <div style={{ marginTop: '4px' }}><StatusBadge status={record.status} /></div>
            </div>
            <div className="pay-view-amount-callout">
              <span className="pay-view-label">TOTAL DISBURSED AMOUNT</span>
              <strong className="pay-amount-lg">{record.totalAmountDisplay || formatCurrency(record.totalAmount)}</strong>
            </div>
          </div>

          <div className="pay-view-specs-grid">
            <div className="pay-spec-item">
              <span className="pay-spec-title">Payment Date</span>
              <span className="pay-spec-val">{record.paymentDateDisplay || record.paymentDate}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Payment Purpose</span>
              <span className="pay-spec-val">{record.purpose}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Category</span>
              <span className="pay-spec-val">{record.category || '—'}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Payee Type</span>
              <span className="pay-spec-val">{record.payeeType}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Payee Name</span>
              <span className="pay-spec-val"><strong>{record.payeeName}</strong></span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Contact Number</span>
              <span className="pay-spec-val">{record.contactInfo || '—'}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Farm Location</span>
              <span className="pay-spec-val">{record.farm || '—'} {record.fieldParcel ? `(${record.fieldParcel})` : ''}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Crop &amp; Season</span>
              <span className="pay-spec-val">{record.crop || '—'} {record.season ? `(${record.season})` : ''}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Reference Linked</span>
              <span className="pay-spec-val">{record.refType !== 'None' ? `${record.refType}: ${record.refNo || '—'}` : 'Direct Payment'}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Payment Mode</span>
              <span className="pay-spec-val">{record.paymentMode}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Paid From Account</span>
              <span className="pay-spec-val">{record.bankAccount}</span>
            </div>
            <div className="pay-spec-item">
              <span className="pay-spec-title">Transaction / UTR Ref</span>
              <span className="pay-spec-val">{record.transactionRef || '—'}</span>
            </div>
            {record.chequeNo && (
              <>
                <div className="pay-spec-item">
                  <span className="pay-spec-title">Cheque Number</span>
                  <span className="pay-spec-val">{record.chequeNo}</span>
                </div>
                <div className="pay-spec-item">
                  <span className="pay-spec-title">Cheque Date</span>
                  <span className="pay-spec-val">{formatDate(record.chequeDate) || '—'}</span>
                </div>
              </>
            )}
          </div>

          {/* Amount Breakdown Table */}
          <div className="pay-view-breakdown-card">
            <h4>Payment Breakdown</h4>
            <div className="pay-breakdown-row">
              <span>Base Paid Amount:</span>
              <strong>{formatCurrency(record.amount)}</strong>
            </div>
            {record.additionalCharges > 0 && (
              <div className="pay-breakdown-row">
                <span>Additional Bank / Delivery Charges:</span>
                <span>+ {formatCurrency(record.additionalCharges)}</span>
              </div>
            )}
            {record.discount > 0 && (
              <div className="pay-breakdown-row">
                <span>Discount / Concession:</span>
                <span>- {formatCurrency(record.discount)}</span>
              </div>
            )}
            <div className="pay-breakdown-row pay-breakdown-total">
              <span>Net Outflow:</span>
              <strong>{record.totalAmountDisplay || formatCurrency(record.totalAmount)}</strong>
            </div>
          </div>

          {record.remarks && (
            <div className="pay-view-remarks">
              <span className="pay-spec-title">Remarks &amp; Notes:</span>
              <p>{record.remarks}</p>
            </div>
          )}
        </div>

        <div className="pay-form-footer">
          <div className="pay-view-voucher-btn-wrap">
            <button
              type="button"
              className="pay-btn pay-btn-secondary"
              onClick={() => {
                onClose()
                onPrintVoucher(record)
              }}
            >
              🖨️ View &amp; Print Voucher
            </button>
          </div>
          <div className="pay-form-actions">
            <button type="button" className="pay-btn pay-btn-secondary" onClick={onClose}>Close</button>
            <button
              type="button"
              className="pay-btn pay-btn-primary"
              onClick={() => {
                onClose()
                onEdit(record)
              }}
            >
              Edit Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Printable Voucher Modal ──────────────────────────────────────────────────

function PrintableVoucherModal({ record, onClose }) {
  if (!record) return null

  const handlePrint = () => {
    window.print()
  }

  const amountInWords = numberToWordsINR(record.totalAmount)

  return (
    <div className="pay-form-overlay pay-print-overlay" role="dialog" aria-modal="true" aria-labelledby="voucher-title">
      <div className="pay-voucher-container">
        {/* Screen Controls Header */}
        <div className="pay-voucher-actions-bar no-print">
          <div>
            <strong>Payment Voucher Preview</strong>
            <span style={{ marginLeft: '12px', fontSize: '13px', color: '#657269' }}>
              Official AGRIMAN agricultural disbursement receipt
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="pay-btn pay-btn-primary" onClick={handlePrint}>
              🖨️ Print Voucher
            </button>
            <button type="button" className="pay-btn pay-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Paper Document */}
        <div className="pay-voucher-paper">
          {/* Header */}
          <div className="pay-voucher-header">
            <div className="pay-voucher-logo-area">
              <span className="pay-voucher-logo">🌾 AGRIMAN</span>
              <small>FARM FINANCIAL MANAGEMENT SYSTEM</small>
            </div>
            <div className="pay-voucher-title-area">
              <h1 id="voucher-title">PAYMENT VOUCHER</h1>
              <div className="pay-voucher-badge">{record.status.toUpperCase()}</div>
            </div>
          </div>

          <div className="pay-voucher-meta-grid">
            <div className="pay-voucher-meta-cell">
              <span className="pay-v-label">Voucher No:</span>
              <strong className="pay-v-val">{record.paymentNo}</strong>
            </div>
            <div className="pay-voucher-meta-cell">
              <span className="pay-v-label">Payment Date:</span>
              <strong className="pay-v-val">{record.paymentDateDisplay || record.paymentDate}</strong>
            </div>
            <div className="pay-voucher-meta-cell">
              <span className="pay-v-label">Payment Mode:</span>
              <strong className="pay-v-val">{record.paymentMode}</strong>
            </div>
            <div className="pay-voucher-meta-cell">
              <span className="pay-v-label">Bank / Account:</span>
              <strong className="pay-v-val">{record.bankAccount}</strong>
            </div>
          </div>

          {/* Payee Box */}
          <div className="pay-voucher-section">
            <div className="pay-voucher-box">
              <div className="pay-v-row">
                <span className="pay-v-label">Paid To:</span>
                <strong className="pay-v-name">{record.payeeName}</strong>
                <span className="pay-v-pill">{record.payeeType}</span>
              </div>
              {record.contactInfo && (
                <div className="pay-v-row">
                  <span className="pay-v-label">Contact No:</span>
                  <span>{record.contactInfo}</span>
                </div>
              )}
              {record.farm && (
                <div className="pay-v-row">
                  <span className="pay-v-label">Farm &amp; Crop:</span>
                  <span>{record.farm} {record.fieldParcel ? `[${record.fieldParcel}]` : ''} {record.crop ? `• ${record.crop}` : ''} {record.season ? `(${record.season})` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div className="pay-voucher-section">
            <table className="pay-voucher-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Purpose / Description</th>
                  <th>Reference / Bill No</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>{record.purpose}</strong>
                    {record.category && <div style={{ fontSize: '11px', color: '#555' }}>Category: {record.category}</div>}
                    {record.remarks && <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>Notes: {record.remarks}</div>}
                  </td>
                  <td>{record.refType !== 'None' ? `${record.refType}: ${record.refNo || '—'}` : 'Direct Disbursement'}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(record.amount)}</td>
                </tr>
                {record.additionalCharges > 0 && (
                  <tr>
                    <td>2</td>
                    <td>Additional Delivery / Bank Charges</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(record.additionalCharges)}</td>
                  </tr>
                )}
                {record.discount > 0 && (
                  <tr>
                    <td>3</td>
                    <td>Discount / Supplier Concession</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right', color: '#c0392b' }}>- {formatCurrency(record.discount)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3" style={{ textAlign: 'right' }}>TOTAL AMOUNT PAID:</th>
                  <th style={{ textAlign: 'right', fontSize: '15px' }}>{record.totalAmountDisplay || formatCurrency(record.totalAmount)}</th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in words */}
          <div className="pay-voucher-words-box">
            <span className="pay-v-label">Amount in Words:</span>
            <strong className="pay-words-text">{amountInWords}</strong>
          </div>

          {/* Payment & Banking Verification */}
          <div className="pay-voucher-bank-strip">
            <div>
              <span className="pay-v-label">Transaction / UTR Ref:</span>
              <span>{record.transactionRef || 'N/A'}</span>
            </div>
            {record.chequeNo && (
              <div>
                <span className="pay-v-label">Cheque Details:</span>
                <span>{record.chequeNo} (Dated: {formatDate(record.chequeDate) || 'N/A'})</span>
              </div>
            )}
            <div>
              <span className="pay-v-label">Disbursement Type:</span>
              <span>Agricultural Expenditure</span>
            </div>
          </div>

          {/* Signature Grid */}
          <div className="pay-voucher-signatures">
            <div className="pay-sig-block">
              <div className="pay-sig-line"></div>
              <span>Prepared By (Accountant / Farmer)</span>
            </div>
            <div className="pay-sig-block">
              <div className="pay-sig-line"></div>
              <span>Verified / Approved By</span>
            </div>
            <div className="pay-sig-block">
              <div className="pay-sig-line"></div>
              <span>Receiver's Signature / Stamp</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pay-voucher-footer">
            <small>This is a computer-generated voucher from AGRIMAN Farm Financial Management System.</small>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteDialog({ record, onConfirm, onCancel, busy }) {
  if (!record) return null
  return (
    <div className="pay-form-overlay" role="dialog" aria-modal="true" aria-labelledby="pay-del-title">
      <div className="pay-modal-box pay-del-card">
        <h3 id="pay-del-title" style={{ margin: '0 0 10px', color: '#c0392b' }}>Delete Payment Record?</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--pay-text-muted)', fontSize: '13.5px', lineHeight: '1.5' }}>
          Are you sure you want to permanently delete payment <strong>{record.paymentNo}</strong> for{' '}
          <strong>{record.payeeName}</strong> ({formatCurrency(record.totalAmount)})? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="pay-btn pay-btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="pay-btn pay-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cancel Payment Modal ─────────────────────────────────────────────────────

function CancelDialog({ record, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState('Payment cancelled or reversed')
  if (!record) return null

  return (
    <div className="pay-form-overlay" role="dialog" aria-modal="true" aria-labelledby="pay-cancel-title">
      <div className="pay-modal-box pay-del-card">
        <h3 id="pay-cancel-title" style={{ margin: '0 0 10px', color: '#b45309' }}>Cancel Payment Transaction?</h3>
        <p style={{ margin: '0 0 12px', color: 'var(--pay-text-muted)', fontSize: '13.5px', lineHeight: '1.5' }}>
          Mark payment <strong>{record.paymentNo}</strong> ({formatCurrency(record.totalAmount)}) as Cancelled.
          This will exclude the amount from successful outflows while retaining the audit trail.
        </p>
        <div className="pay-field" style={{ marginBottom: '16px' }}>
          <label htmlFor="cancel-reason">Cancellation Reason</label>
          <input
            id="cancel-reason"
            type="text"
            className="pay-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Cheque bounced, duplicate entry, incorrect amount"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="pay-btn pay-btn-secondary" onClick={onCancel} disabled={busy}>
            Dismiss
          </button>
          <button type="button" className="pay-btn pay-btn-warning" onClick={() => onConfirm(reason)} disabled={busy}>
            {busy ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reports & Analytics Section ──────────────────────────────────────────────

function ReportsSection({ records = [] }) {
  const [selectedReport, setSelectedReport] = useState('summary')

  // Pre-calculate report views
  const reportData = useMemo(() => {
    switch (selectedReport) {
      case 'by-purpose': {
        const map = {}
        records.forEach((r) => {
          const key = r.purpose || 'Other'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-payee': {
        const map = {}
        records.forEach((r) => {
          const key = r.payeeName || 'Unknown Payee'
          if (!map[key]) map[key] = { label: key, type: r.payeeType, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-payee-type': {
        const map = {}
        records.forEach((r) => {
          const key = r.payeeType || 'Other'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-mode': {
        const map = {}
        records.forEach((r) => {
          const key = r.paymentMode || 'Unknown'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-farm': {
        const map = {}
        records.forEach((r) => {
          const key = r.farm || 'General Farm Operations'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-crop': {
        const map = {}
        records.forEach((r) => {
          const key = r.crop || 'Unallocated Crop Cost'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'monthly-outflow': {
        const map = {}
        records.forEach((r) => {
          const month = (r.paymentDate || '').slice(0, 7) || 'Unknown'
          if (!map[month]) map[month] = { label: month, count: 0, total: 0 }
          map[month].count += 1
          map[month].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.label.localeCompare(a.label))
      }
      case 'seasonal-outflow': {
        const map = {}
        records.forEach((r) => {
          const key = r.season || 'General / Non-Seasonal'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.totalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'pending-disbursements': {
        return records.filter((r) => r.status === 'Pending' || r.status === 'Processing')
      }
      case 'cheques-issued': {
        return records.filter((r) => r.paymentMode === 'Cheque' || r.chequeNo)
      }
      case 'top-disbursements': {
        return [...records].sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0)).slice(0, 10)
      }
      case 'summary':
      default: {
        return records
      }
    }
  }, [records, selectedReport])

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (['by-purpose', 'by-payee', 'by-payee-type', 'by-mode', 'by-farm', 'by-crop', 'monthly-outflow', 'seasonal-outflow'].includes(selectedReport)) {
      csvContent += 'Category/Group,Transaction Count,Total Outflow (INR)\n'
      reportData.forEach((row) => {
        csvContent += `"${row.label}",${row.count},${row.total}\n`
      })
    } else {
      csvContent += 'Payment No,Date,Purpose,Payee Name,Type,Farm,Crop,Amount (INR),Payment Mode,Bank Account,Ref No,Status\n'
      records.forEach((r) => {
        csvContent += `"${r.paymentNo}","${r.paymentDate}","${r.purpose}","${r.payeeName}","${r.payeeType}","${r.farm}","${r.crop}",${r.totalAmount},"${r.paymentMode}","${r.bankAccount}","${r.refNo}","${r.status}"\n`
      })
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `agriman_payment_report_${selectedReport}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="pay-reports-container">
      <aside className="pay-reports-sidebar">
        <h3>Report Category</h3>
        <nav className="pay-reports-nav">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.key}
              type="button"
              className={`pay-report-nav-item ${selectedReport === rt.key ? 'active' : ''}`}
              onClick={() => setSelectedReport(rt.key)}
            >
              <span>{rt.icon}</span>
              <span>{rt.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="pay-reports-content">
        <div className="pay-report-top">
          <div>
            <h2>{REPORT_TYPES.find((r) => r.key === selectedReport)?.label}</h2>
            <p>Aggregated analysis across recorded disbursements.</p>
          </div>
          <button type="button" className="pay-btn pay-btn-secondary" onClick={exportCSV}>
            ⬇ Export Report CSV
          </button>
        </div>

        <div className="pay-table-card">
          <table className="pay-table">
            {['by-purpose', 'by-payee', 'by-payee-type', 'by-mode', 'by-farm', 'by-crop', 'monthly-outflow', 'seasonal-outflow'].includes(selectedReport) ? (
              <>
                <thead>
                  <tr>
                    <th>Category / Entity</th>
                    <th>Transactions</th>
                    <th className="pay-col-amount">Total Outflow Amount</th>
                    <th className="pay-col-amount">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => {
                    const grandTotal = records.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0)
                    const pct = grandTotal > 0 ? ((row.total / grandTotal) * 100).toFixed(1) : 0
                    return (
                      <tr key={idx}>
                        <td><strong>{row.label}</strong></td>
                        <td>{row.count} payments</td>
                        <td className="pay-col-amount"><strong>{formatCurrency(row.total)}</strong></td>
                        <td className="pay-col-amount">{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th>Payment No</th>
                    <th>Date</th>
                    <th>Payee</th>
                    <th>Purpose</th>
                    <th>Farm / Crop</th>
                    <th className="pay-col-amount">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.id}>
                      <td className="pay-col-id">{r.paymentNo}</td>
                      <td>{r.paymentDateDisplay || r.paymentDate}</td>
                      <td>{r.payeeName}</td>
                      <td>{r.purpose}</td>
                      <td>{r.farm ? `${r.farm} ${r.crop ? `(${r.crop})` : ''}` : '—'}</td>
                      <td className="pay-col-amount"><strong>{r.totalAmountDisplay || formatCurrency(r.totalAmount)}</strong></td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </section>
    </div>
  )
}

// ─── Main Payments Component ──────────────────────────────────────────────────

export default function Payments() {
  // Data State
  const [records, setRecords] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [labours, setLabours] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [expenses, setExpenses] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  // Filters State
  const [activeTab, setActiveTab] = useState('registry') // 'registry' | 'reports'
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [purposeFilter, setPurposeFilter] = useState('All Purposes')
  const [payeeTypeFilter, setPayeeTypeFilter] = useState('All Payees')
  const [modeFilter, setModeFilter] = useState('All Modes')

  // Pagination
  const [page, setPage] = useState(1)

  // Modals & Screens
  const [screen, setScreen] = useState('list') // 'list' | 'add' | 'edit'
  const [editRecord, setEditRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [voucherRecord, setVoucherRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  // Toast
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const toastTimer = useRef(null)

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast({ msg: '', type: 'success' }), 3200)
  }, [])

  // ─── Load Reference Data ─────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      listPaymentSuppliers(),
      listPaymentLabours(),
      listPaymentBankAccounts(),
      listPaymentFarms(),
      listPaymentCrops(),
      listOutstandingExpenses(),
    ]).then(([sList, lList, bList, fList, cList, eList]) => {
      setSuppliers(sList)
      setLabours(lList)
      setBankAccounts(bList)
      setFarms(fList)
      setCrops(cList)
      setExpenses(eList)
    }).catch((err) => {
      console.warn('[Payments Ref] Error loading references:', err)
    })
  }, [])

  // ─── Fetch Payments ──────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await listPayments({
        status: statusFilter,
        search,
        startDate: dateFrom,
        endDate: dateTo,
        purpose: purposeFilter,
        payeeType: payeeTypeFilter,
        paymentMode: modeFilter,
      })
      setRecords(data)
    } catch (err) {
      console.error('[Payments Fetch] Error:', err)
      setLoadError('Failed to load payments data. Offline ledger active.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, dateFrom, dateTo, purposeFilter, payeeTypeFilter, modeFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Summary Metrics
  const summary = useMemo(() => computePaymentSummaryCards(records), [records])

  // Reset Filters
  const resetFilters = () => {
    setStatusFilter('All')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPurposeFilter('All Purposes')
    setPayeeTypeFilter('All Payees')
    setModeFilter('All Modes')
    setPage(1)
  }

  // Filter Active Count Helper
  const hasActiveFilters = Boolean(
    statusFilter !== 'All' ||
    search ||
    dateFrom ||
    dateTo ||
    purposeFilter !== 'All Purposes' ||
    payeeTypeFilter !== 'All Payees' ||
    modeFilter !== 'All Modes'
  )

  // Pagination Slice
  const totalRecords = records.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return records.slice(start, start + PAGE_SIZE)
  }, [records, page])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAddClick = () => {
    setEditRecord(null)
    setScreen('add')
  }

  const handleEditClick = (rec) => {
    setEditRecord(rec)
    setScreen('edit')
  }

  const handleSavePayment = async (formValues) => {
    setBusy(true)
    try {
      if (editRecord?.id) {
        await updatePayment(editRecord.id, formValues)
        showToast(`Payment ${formValues.paymentNo} updated successfully!`)
      } else {
        await createPayment(formValues)
        showToast(`Payment ${formValues.paymentNo} recorded successfully!`)
      }
      setScreen('list')
      setEditRecord(null)
      fetchPayments()
    } catch (err) {
      showToast(err.message || 'Error saving payment', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deletePayment(deleteTarget.id)
      showToast(`Payment ${deleteTarget.paymentNo} deleted.`)
      setDeleteTarget(null)
      fetchPayments()
    } catch (err) {
      showToast(err.message || 'Error deleting payment', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return
    setBusy(true)
    try {
      await cancelPayment(cancelTarget.id, reason)
      showToast(`Payment ${cancelTarget.paymentNo} marked as Cancelled.`)
      setCancelTarget(null)
      fetchPayments()
    } catch (err) {
      showToast(err.message || 'Error cancelling payment', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,Payment No,Date,Purpose,Category,Payee Name,Payee Type,Farm,Crop,Amount (INR),Payment Mode,Bank Account,Ref No,Status,Remarks\n'
    records.forEach((r) => {
      csv += `"${r.paymentNo}","${r.paymentDate}","${r.purpose}","${r.category}","${r.payeeName}","${r.payeeType}","${r.farm}","${r.crop}",${r.totalAmount},"${r.paymentMode}","${r.bankAccount}","${r.refNo}","${r.status}","${r.remarks}"\n`
    })
    const encoded = encodeURI(csv)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `agriman_payments_${localDate()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="payments-page">
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`pay-toast ${toast.type === 'error' ? 'pay-toast-error' : ''}`} role="status">
          <span>{toast.type === 'error' ? '✗' : '✓'}</span>
          {toast.msg}
          <button type="button" onClick={() => setToast({ msg: '', type: 'success' })} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Page Header */}
      <div className="pay-page-header">
        <div>
          <div className="pay-eyebrow">FINANCE <span>/</span> PAYMENTS</div>
          <h1 className="pay-page-title">Payment Management</h1>
          <p className="pay-page-desc">
            Manage outgoing payments, supplier settlements, labour wages, loan repayments, and printable payment vouchers.
          </p>
        </div>
        <div className="pay-header-actions">
          <button type="button" className="pay-btn pay-btn-secondary" onClick={handleExportCSV}>
            ⬇ Export CSV
          </button>
          <button type="button" className="pay-btn pay-btn-primary" onClick={handleAddClick} disabled={busy}>
            + Record Payment
          </button>
        </div>
      </div>

      {/* Module Tabs Switcher */}
      <div className="pay-module-tabs">
        <button
          type="button"
          className={`pay-module-tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
          onClick={() => setActiveTab('registry')}
        >
          📋 Payment Registry &amp; Ledger
        </button>
        <button
          type="button"
          className={`pay-module-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Reports &amp; Outflow Analytics
        </button>
      </div>

      {activeTab === 'registry' && (
        <>
          {/* Summary Cards */}
          <SummaryCards summary={summary} loading={loading} />

          {/* Load Error Banner */}
          {loadError && (
            <div className="pay-error-banner" role="alert">
              <span>⚠️ {loadError}</span>
              <button type="button" className="pay-error-retry-btn" onClick={fetchPayments}>Retry</button>
            </div>
          )}

          {/* Status Filter Tabs (Pill style) */}
          <div className="pay-status-tabs" role="tablist" aria-label="Filter by payment status">
            {STATUS_TABS.map((st) => (
              <button
                key={st}
                type="button"
                role="tab"
                aria-selected={statusFilter === st}
                className={`pay-status-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(st)
                  setPage(1)
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Toolbar (Single Horizontal Row on Desktop) */}
          <div className="pay-toolbar">
            {/* 1. Search */}
            <div className="pay-search-wrap">
              <span className="pay-search-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                className="pay-input pay-search-input"
                placeholder="Search Payments..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                aria-label="Search payment records"
              />
            </div>

            {/* 2. From Date */}
            <FilterDateInput
              id="pay-filter-from-date"
              value={dateFrom}
              onChange={(val) => {
                setDateFrom(val)
                setPage(1)
              }}
              placeholder="dd/mm/yyyy"
              ariaLabel="Filter start date"
            />

            {/* 3. To Date */}
            <FilterDateInput
              id="pay-filter-to-date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(val) => {
                setDateTo(val)
                setPage(1)
              }}
              placeholder="dd/mm/yyyy"
              ariaLabel="Filter end date"
            />

            {/* 4. Purpose Dropdown */}
            <div className="pay-select-wrap">
              <select
                className="pay-input pay-select"
                value={purposeFilter}
                onChange={(e) => {
                  setPurposeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by payment purpose"
              >
                <option value="All Purposes">All Purposes</option>
                {PAYMENT_PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 5. Payee Type Dropdown */}
            <div className="pay-select-wrap">
              <select
                className="pay-input pay-select"
                value={payeeTypeFilter}
                onChange={(e) => {
                  setPayeeTypeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by payee type"
              >
                <option value="All Payees">All Payees</option>
                {PAYEE_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            {/* 6. Payment Mode Dropdown */}
            <div className="pay-select-wrap">
              <select
                className="pay-input pay-select"
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by payment mode"
              >
                <option value="All Modes">All Modes</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* 7. Reset Filters Button */}
            <button
              type="button"
              className="pay-reset-btn"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Reset</span>
            </button>
          </div>

          {/* Payment Registry Table */}
          <div className="pay-table-card">
            <div className="pay-table-wrap">
              <table className="pay-table" aria-label="Payments registry table">
                <thead>
                  <tr>
                    <th>Payment No</th>
                    <th>Date</th>
                    <th>Purpose / Category</th>
                    <th>Payee</th>
                    <th>Reference</th>
                    <th className="pay-col-amount">Amount</th>
                    <th>Mode &amp; Account</th>
                    <th>Txn / Cheque Ref</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="pay-empty-cell">
                        <div className="pay-loading-spinner">Loading payments...</div>
                      </td>
                    </tr>
                  ) : paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="pay-empty-cell">
                        <div className="pay-empty-state">
                          <p>No payment records found matching your filters.</p>
                          {hasActiveFilters && (
                            <button type="button" className="pay-btn pay-btn-secondary" onClick={resetFilters}>
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td className="pay-col-id">
                          <strong>{rec.paymentNo}</strong>
                        </td>
                        <td>{rec.paymentDateDisplay || rec.paymentDate}</td>
                        <td>
                          <div className="pay-purpose-cell">
                            <strong>{rec.purpose}</strong>
                            {rec.category && <small>{rec.category}</small>}
                          </div>
                        </td>
                        <td>
                          <div className="payee-cell">
                            <strong>{rec.payeeName}</strong>
                            <small>{rec.payeeType}</small>
                          </div>
                        </td>
                        <td>
                          {rec.refType !== 'None' && rec.refNo ? (
                            <span className="pay-ref-pill">{rec.refType}: {rec.refNo}</span>
                          ) : (
                            <span className="pay-muted">—</span>
                          )}
                        </td>
                        <td className="pay-col-amount">
                          <strong className="pay-amount-text">{rec.totalAmountDisplay || formatCurrency(rec.totalAmount)}</strong>
                        </td>
                        <td>
                          <div className="pay-mode-cell">
                            <span>{rec.paymentMode}</span>
                            <small>{rec.bankAccount}</small>
                          </div>
                        </td>
                        <td>
                          <div className="pay-ref-cell">
                            {rec.transactionRef && <span>{rec.transactionRef}</span>}
                            {rec.chequeNo && <small>CHQ: {rec.chequeNo}</small>}
                            {!rec.transactionRef && !rec.chequeNo && <span className="pay-muted">—</span>}
                          </div>
                        </td>
                        <td><StatusBadge status={rec.status} /></td>
                        <td>
                          <div className="pay-actions">
                            <TableActionMenu items={[
                              { label: 'View Details', icon: 'view', onClick: () => setViewRecord(rec) },
                              { label: 'Print Voucher', icon: 'pay', onClick: () => setVoucherRecord(rec) },
                              { label: 'Edit Payment', icon: 'edit', onClick: () => handleEditClick(rec) },
                              rec.status !== 'Cancelled' ? {
                                label: 'Cancel Payment',
                                icon: 'delete',
                                danger: true,
                                onClick: () => setCancelTarget(rec),
                              } : null,
                              { label: 'Delete Record', icon: 'delete', danger: true, onClick: () => setDeleteTarget(rec) },
                            ].filter(Boolean)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="pay-table-footer">
              <span>
                Showing <strong>{totalRecords > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, totalRecords)}</strong> of <strong>{totalRecords}</strong> disbursements
              </span>
              <div className="pay-pagination">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : Math.max(1, Math.min(totalPages - 6, page - 3)) + i
                  return (
                    <button
                      key={p}
                      type="button"
                      className={page === p ? 'pay-page-active' : ''}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                })}
                <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reports Section View */}
      {activeTab === 'reports' && <ReportsSection records={records} />}

      {/* Add / Edit Form Modal */}
      {(screen === 'add' || screen === 'edit') && (
        <PaymentForm
          initialData={editRecord}
          onSave={handleSavePayment}
          onCancel={() => {
            setScreen('list')
            setEditRecord(null)
          }}
          saving={busy}
          suppliers={suppliers}
          labours={labours}
          bankAccounts={bankAccounts}
          farms={farms}
          crops={crops}
          expenses={expenses}
        />
      )}

      {/* View Modal */}
      {viewRecord && (
        <ViewPaymentModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onPrintVoucher={(rec) => setVoucherRecord(rec)}
          onEdit={(rec) => handleEditClick(rec)}
        />
      )}

      {/* Printable Voucher Modal */}
      {voucherRecord && (
        <PrintableVoucherModal
          record={voucherRecord}
          onClose={() => setVoucherRecord(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteDialog
          record={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          busy={busy}
        />
      )}

      {/* Cancel Payment Dialog */}
      {cancelTarget && (
        <CancelDialog
          record={cancelTarget}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}
