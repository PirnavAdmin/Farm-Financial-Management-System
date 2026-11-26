import TableActionMenu from '../../TableActionMenu'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  computeReceiptSummaryCards,
  createReceipt,
  deleteReceipt,
  cancelReceipt,
  displayDateToIso,
  formatCurrency,
  formatDate,
  getNextReceiptNo,
  isoToDisplayDate,
  listOutstandingIncomes,
  listOutstandingSales,
  listReceiptBankAccounts,
  listReceiptBuyers,
  listReceiptCrops,
  listReceiptFarms,
  listReceipts,
  localDate,
  normalizeReceipt,
  parseDecimal,
  PAYER_TYPES,
  COLLECTION_MODES,
  RECEIPT_PURPOSES,
  RECEIPT_STATUSES,
  SEASONS,
  updateReceipt,
} from './receiptService.js'
import './receipts.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Completed', 'Pending', 'Processing', 'Failed', 'Cancelled']
const PAGE_SIZE = 10

const REPORT_TYPES = [
  { key: 'summary', label: 'Receipt Summary', icon: '📊' },
  { key: 'by-purpose', label: 'By Purpose / Category', icon: '🏷️' },
  { key: 'by-payer', label: 'Customer-wise Collections', icon: '👥' },
  { key: 'by-payer-type', label: 'By Payer Type', icon: '🏢' },
  { key: 'by-mode', label: 'Collection Mode-wise', icon: '💳' },
  { key: 'by-farm', label: 'Farm-wise Collections', icon: '🌾' },
  { key: 'by-crop', label: 'Crop-wise Collections', icon: '🌱' },
  { key: 'monthly-receipts', label: 'Monthly Receipts Trend', icon: '📈' },
  { key: 'seasonal-receipts', label: 'Seasonal Collections', icon: '🌤️' },
  { key: 'pending-receivables', label: 'Pending Receivables', icon: '⏳' },
  { key: 'cheques-register', label: 'Cheques Register', icon: '📑' },
  { key: 'top-collections', label: 'Top Collections', icon: '🔝' },
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
    Completed: 'rec-status-completed',
    Pending: 'rec-status-pending',
    Processing: 'rec-status-processing',
    Failed: 'rec-status-failed',
    Cancelled: 'rec-status-cancelled',
  }[status] || 'rec-status-completed'
  return <span className={`rec-status ${cls}`}>{status || 'Completed'}</span>
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary, loading }) {
  const cards = [
    { label: 'Total Receipts', value: formatCurrency(summary.totalReceived), icon: '₹', hint: `${summary.totalReceipts} recorded receipts`, color: 'primary' },
    { label: 'Total Amount Received', value: formatCurrency(summary.totalReceived), icon: '✓', hint: 'Completed collections', color: 'success' },
    { label: 'Pending Receivables', value: formatCurrency(summary.pendingReceivables), icon: '⏳', hint: 'Pending & in-transit', color: 'warning' },
    { label: 'This Month', value: formatCurrency(summary.thisMonthAmount), icon: '📅', hint: 'Current month total', color: 'info' },
  ]
  return (
    <div className="rec-summary">
      {cards.map((card) => (
        <article key={card.label} className={`rec-summary-card rec-card-${card.color}`}>
          <span className="rec-card-icon">{card.icon}</span>
          <div className="rec-card-body">
            <small>{card.label.toUpperCase()}</small>
            <strong className={loading ? 'rec-skeleton' : ''}>{loading ? '—' : card.value}</strong>
            <span className="rec-card-hint">{card.hint}</span>
          </div>
          <b className="rec-card-arrow">↗</b>
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
    <div className="rec-date-filter-wrap">
      <input
        type="text"
        id={id}
        className="rec-input rec-date-text-input"
        placeholder={placeholder}
        value={typedText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <button
        type="button"
        className="rec-date-picker-trigger"
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
        className="rec-date-native-hidden"
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

// ─── Receipt Form (Add / Edit) ────────────────────────────────────────────────

function ReceiptForm({
  initialData,
  onSave,
  onCancel,
  saving,
  buyers = [],
  bankAccounts = [],
  farms = [],
  crops = [],
  sales = [],
  incomes = [],
}) {
  const isEdit = Boolean(initialData?.id)

  const [form, setForm] = useState({
    receiptNo: initialData?.receiptNo || '',
    receiptDate: initialData?.receiptDate || localDate(),
    purpose: initialData?.purpose || RECEIPT_PURPOSES[0],
    category: initialData?.category || '',
    payerType: initialData?.payerType || PAYER_TYPES[0],
    payerName: initialData?.payerName || '',
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
    discount: initialData?.discount != null ? String(initialData.discount) : '0',
    otherCharges: initialData?.otherCharges != null ? String(initialData.otherCharges) : '0',
    collectionMode: initialData?.collectionMode || 'Bank Transfer',
    bankAccount: initialData?.bankAccount || (bankAccounts[0]?.name || 'AGRIMAN Farm Account'),
    transactionRef: initialData?.transactionRef || '',
    chequeNo: initialData?.chequeNo || '',
    chequeDate: initialData?.chequeDate || '',
    remarks: initialData?.remarks || '',
    status: initialData?.status || 'Completed',
  })

  const [errors, setErrors] = useState({})

  // Auto-generate code if adding new
  useEffect(() => {
    if (!isEdit && !form.receiptNo) {
      getNextReceiptNo().then((code) => setForm((prev) => ({ ...prev, receiptNo: code })))
    }
  }, [isEdit, form.receiptNo])

  const calculatedFinal = useMemo(() => {
    const a = parseDecimal(form.amount)
    const d = parseDecimal(form.discount)
    const o = parseDecimal(form.otherCharges)
    return Math.max(0, Math.round((a - d + o) * 100) / 100)
  }, [form.amount, form.discount, form.otherCharges])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Handle buyer select helper
  const handleBuyerSelect = (e) => {
    const selectedName = e.target.value
    if (!selectedName) return
    handleChange('payerName', selectedName)
    const match = buyers.find((b) => b.name === selectedName)
    if (match?.mobile) handleChange('contactInfo', match.mobile)
    if (match?.outstanding > 0) handleChange('outstandingAmount', String(match.outstanding))
  }

  // Handle Sales Invoice link helper
  const handleSaleLink = (e) => {
    const sNo = e.target.value
    handleChange('refNo', sNo)
    if (!sNo) return

    const match = sales.find((s) => (s.salesNo || `SAL-${s.id}`) === sNo)
    if (match) {
      handleChange('refType', 'Sales Invoice')
      handleChange('originalAmount', String(match.netAmount || match.grossAmount || ''))
      const pending = Number(match.balanceAmount || Math.max(0, (match.netAmount || 0) - (match.paidAmount || 0)))
      handleChange('outstandingAmount', String(pending))
      if (!form.amount || parseDecimal(form.amount) === 0) {
        handleChange('amount', String(pending > 0 ? pending : match.netAmount || match.grossAmount))
      }
      if (match.buyer && !form.payerName) {
        handleChange('payerName', match.buyer)
        handleChange('payerType', 'Wholesale Buyer / Trader')
      }
      if (match.farm && !form.farm) handleChange('farm', match.farm)
      if (match.crop && !form.crop) handleChange('crop', match.crop)
      if (match.crop && !form.category) handleChange('category', `${match.crop} Sales`)
    }
  }

  // Handle Income link helper
  const handleIncomeLink = (e) => {
    const incNo = e.target.value
    handleChange('refNo', incNo)
    if (!incNo) return

    const match = incomes.find((inc) => (inc.incomeNo || `INC-${inc.id}`) === incNo)
    if (match) {
      handleChange('refType', 'Income Record')
      handleChange('originalAmount', String(match.netAmount || match.amount || ''))
      const pending = Number(match.pendingAmount || Math.max(0, (match.netAmount || 0) - (match.amountReceived || 0)))
      handleChange('outstandingAmount', String(pending))
      if (!form.amount || parseDecimal(form.amount) === 0) {
        handleChange('amount', String(pending > 0 ? pending : match.netAmount || match.amount))
      }
      if (match.buyer && !form.payerName) {
        handleChange('payerName', match.buyer)
      }
      if (match.farm && !form.farm) handleChange('farm', match.farm)
      if (match.crop && !form.crop) handleChange('crop', match.crop)
      if (match.category?.name && !form.category) handleChange('category', match.category.name)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}

    if (!form.receiptNo.trim()) errs.receiptNo = 'Receipt number is required.'
    if (!form.receiptDate) errs.receiptDate = 'Receipt date is required.'
    if (!form.payerName.trim()) errs.payerName = 'Customer / Payer name is required.'
    if (!form.purpose.trim()) errs.purpose = 'Receipt purpose is required.'
    if (parseDecimal(form.amount) <= 0) errs.amount = 'Receipt amount must be greater than zero.'
    if (!form.collectionMode.trim()) errs.collectionMode = 'Collection method is required.'

    if (form.collectionMode === 'Cheque' && !form.chequeNo.trim()) {
      errs.chequeNo = 'Cheque number is required for Cheque payment mode.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSave({
      ...form,
      bankAccountId: bankAccounts.find((b) => b.name === form.bankAccount)?.id ?? initialData?.bankAccountId ?? null,
      buyerId: buyers.find((b) => b.name === form.payerName)?.id ?? initialData?.buyerId ?? null,
      saleId: form.refType === 'Sales Invoice'
        ? (sales.find((s) => (s.salesNo || `SAL-${s.id}`) === form.refNo)?.id ?? initialData?.saleId ?? null)
        : null,
      finalAmount: calculatedFinal,
    })
  }

  return (
    <div className="rec-form-overlay" role="dialog" aria-modal="true" aria-labelledby="rec-form-title">
      <div className="rec-form-card">
        <div className="rec-form-header">
          <div>
            <div className="rec-eyebrow">FINANCE <span>/</span> RECEIPTS</div>
            <h2 id="rec-form-title" className="rec-form-title">
              {isEdit ? 'Edit Receipt Record' : 'Record Incoming Money / Collection'}
            </h2>
            <p className="rec-form-subtitle">
              Record customer collections, produce sales receipts, equipment rentals, and outstanding receivable settlements.
            </p>
          </div>
          <button type="button" className="rec-modal-close" onClick={onCancel} aria-label="Close form">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="rec-form-body">

            {/* SECTION A: Basic Receipt Information */}
            <fieldset className="rec-form-section">
              <legend>A. Basic Receipt Information</legend>
              <div className="rec-form-grid rec-grid-3">
                <div className="rec-field">
                  <label htmlFor="f-receiptNo">Receipt Voucher No *</label>
                  <input
                    id="f-receiptNo"
                    type="text"
                    className={`rec-input ${errors.receiptNo ? 'rec-input-err' : ''}`}
                    value={form.receiptNo}
                    onChange={(e) => handleChange('receiptNo', e.target.value)}
                    placeholder="REC-2026-0001"
                    required
                  />
                  {errors.receiptNo && <span className="rec-err-msg">{errors.receiptNo}</span>}
                </div>

                <div className="rec-field">
                  <label htmlFor="f-receiptDate">Receipt Date *</label>
                  <input
                    id="f-receiptDate"
                    type="date"
                    className={`rec-input ${errors.receiptDate ? 'rec-input-err' : ''}`}
                    value={form.receiptDate}
                    onChange={(e) => handleChange('receiptDate', e.target.value)}
                    required
                  />
                  {errors.receiptDate && <span className="rec-err-msg">{errors.receiptDate}</span>}
                </div>

                <div className="rec-field">
                  <label htmlFor="f-purpose">Receipt Purpose / Type *</label>
                  <select
                    id="f-purpose"
                    className={`rec-input rec-select ${errors.purpose ? 'rec-input-err' : ''}`}
                    value={form.purpose}
                    onChange={(e) => {
                      handleChange('purpose', e.target.value)
                      if (!form.category) handleChange('category', e.target.value)
                    }}
                    required
                  >
                    {RECEIPT_PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {errors.purpose && <span className="rec-err-msg">{errors.purpose}</span>}
                </div>
              </div>
            </fieldset>

            {/* SECTION B: Customer / Payer Information */}
            <fieldset className="rec-form-section">
              <legend>B. Customer / Payer Details</legend>
              <div className="rec-form-grid rec-grid-3">
                <div className="rec-field">
                  <label htmlFor="f-payerType">Payer Type *</label>
                  <select
                    id="f-payerType"
                    className="rec-input rec-select"
                    value={form.payerType}
                    onChange={(e) => {
                      handleChange('payerType', e.target.value)
                      handleChange('payerName', '')
                    }}
                  >
                    {PAYER_TYPES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-payerName">Customer / Payer Name *</label>
                  <div className="rec-combined-input">
                    <input
                      id="f-payerName"
                      type="text"
                      className={`rec-input ${errors.payerName ? 'rec-input-err' : ''}`}
                      value={form.payerName}
                      onChange={(e) => handleChange('payerName', e.target.value)}
                      placeholder="Enter customer name or select below"
                      required
                    />
                    {buyers.length > 0 && (
                      <select className="rec-quick-select" onChange={handleBuyerSelect} defaultValue="" aria-label="Select registered buyer">
                        <option value="" disabled>Select Registered Buyer...</option>
                        {buyers.map((b) => (
                          <option key={b.id ?? b.name} value={b.name}>
                            {b.name} {b.outstanding > 0 ? `(Bal: ${formatCurrency(b.outstanding)})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {errors.payerName && <span className="rec-err-msg">{errors.payerName}</span>}
                </div>

                <div className="rec-field">
                  <label htmlFor="f-contactInfo">Contact Number</label>
                  <input
                    id="f-contactInfo"
                    type="text"
                    className="rec-input"
                    value={form.contactInfo}
                    onChange={(e) => handleChange('contactInfo', e.target.value)}
                    placeholder="+91 98480 12345"
                  />
                </div>
              </div>
            </fieldset>

            {/* SECTION C: Agricultural Information */}
            <fieldset className="rec-form-section">
              <legend>C. Agricultural Allocation &amp; Origin</legend>
              <div className="rec-form-grid rec-grid-4">
                <div className="rec-field">
                  <label htmlFor="f-farm">Farm / Location</label>
                  <input
                    id="f-farm"
                    list="rec-farm-options"
                    type="text"
                    className="rec-input"
                    value={form.farm}
                    onChange={(e) => handleChange('farm', e.target.value)}
                    placeholder="e.g. North Field"
                  />
                  <datalist id="rec-farm-options">
                    {farms.map((f) => <option key={f.id ?? f.name} value={f.name} />)}
                  </datalist>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-fieldParcel">Field Parcel / Block</label>
                  <input
                    id="f-fieldParcel"
                    type="text"
                    className="rec-input"
                    value={form.fieldParcel}
                    onChange={(e) => handleChange('fieldParcel', e.target.value)}
                    placeholder="Plot A, Shed 1"
                  />
                </div>

                <div className="rec-field">
                  <label htmlFor="f-crop">Crop / Produce</label>
                  <input
                    id="f-crop"
                    list="rec-crop-options"
                    type="text"
                    className="rec-input"
                    value={form.crop}
                    onChange={(e) => handleChange('crop', e.target.value)}
                    placeholder="Paddy, Cotton, Milk"
                  />
                  <datalist id="rec-crop-options">
                    {crops.map((c) => <option key={c.id ?? c.name} value={c.name} />)}
                  </datalist>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-season">Agricultural Season</label>
                  <select
                    id="f-season"
                    className="rec-input rec-select"
                    value={form.season}
                    onChange={(e) => handleChange('season', e.target.value)}
                  >
                    <option value="">General / Non-Seasonal</option>
                    {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* SECTION D: Transaction Allocation */}
            <fieldset className="rec-form-section">
              <legend>D. Transaction Allocation &amp; Bill Settle</legend>
              <div className="rec-form-grid rec-grid-3">
                <div className="rec-field">
                  <label htmlFor="f-refType">Reference Type</label>
                  <select
                    id="f-refType"
                    className="rec-input rec-select"
                    value={form.refType}
                    onChange={(e) => handleChange('refType', e.target.value)}
                  >
                    <option value="None">Direct Collection (No Prior Bill)</option>
                    <option value="Sales Invoice">Sales Invoice Settle</option>
                    <option value="Income Record">Income Transaction</option>
                    <option value="Advance">Advance Collection</option>
                  </select>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-refNo">Reference / Invoice / Bill No</label>
                  <div className="rec-combined-input">
                    <input
                      id="f-refNo"
                      type="text"
                      className="rec-input"
                      value={form.refNo}
                      onChange={(e) => handleChange('refNo', e.target.value)}
                      placeholder="e.g. SAL-2026-0042"
                    />
                    {sales.length > 0 && form.refType === 'Sales Invoice' && (
                      <select className="rec-quick-select" onChange={handleSaleLink} defaultValue="" aria-label="Link Sales Invoice">
                        <option value="" disabled>Link Sales Invoice...</option>
                        {sales.map((s) => (
                          <option key={s.id} value={s.salesNo || `SAL-${s.id}`}>
                            {s.salesNo || `SAL-${s.id}`} - {s.buyer} ({formatCurrency(s.netAmount || s.grossAmount)})
                          </option>
                        ))}
                      </select>
                    )}
                    {incomes.length > 0 && form.refType === 'Income Record' && (
                      <select className="rec-quick-select" onChange={handleIncomeLink} defaultValue="" aria-label="Link Income Record">
                        <option value="" disabled>Link Income Record...</option>
                        {incomes.map((inc) => (
                          <option key={inc.id} value={inc.incomeNo || `INC-${inc.id}`}>
                            {inc.incomeNo || `INC-${inc.id}`} - {inc.buyer || inc.farm} ({formatCurrency(inc.netAmount || inc.amount)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-outstandingAmount">Outstanding Receivable (₹)</label>
                  <input
                    id="f-outstandingAmount"
                    type="number"
                    step="0.01"
                    className="rec-input"
                    value={form.outstandingAmount}
                    onChange={(e) => handleChange('outstandingAmount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </fieldset>

            {/* SECTION E: Amount Details & Real-Time Calculation */}
            <fieldset className="rec-form-section">
              <legend>E. Receipt Amount Details &amp; Calculation</legend>
              <div className="rec-form-grid rec-grid-4">
                <div className="rec-field">
                  <label htmlFor="f-amount">Base Received Amount (₹) *</label>
                  <input
                    id="f-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`rec-input rec-amount-highlight ${errors.amount ? 'rec-input-err' : ''}`}
                    value={form.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {errors.amount && <span className="rec-err-msg">{errors.amount}</span>}
                </div>

                <div className="rec-field">
                  <label htmlFor="f-discount">Discount / Rebate Allowed (₹)</label>
                  <input
                    id="f-discount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="rec-input"
                    value={form.discount}
                    onChange={(e) => handleChange('discount', e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="rec-field-hint">Buyer settlement concession</small>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-otherCharges">Handling / Other Charges (₹)</label>
                  <input
                    id="f-otherCharges"
                    type="number"
                    step="0.01"
                    min="0"
                    className="rec-input"
                    value={form.otherCharges}
                    onChange={(e) => handleChange('otherCharges', e.target.value)}
                    placeholder="0.00"
                  />
                  <small className="rec-field-hint">Weighing / packing fee</small>
                </div>

                <div className="rec-field">
                  <label>Total Net Collection (₹)</label>
                  <div className="rec-total-computed-box">
                    <strong>{formatCurrency(calculatedFinal)}</strong>
                    <span className="rec-formula-caption">= Base - Discount + Charges</span>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* SECTION F: Collection Method & Banking */}
            <fieldset className="rec-form-section">
              <legend>F. Collection Method &amp; Banking</legend>
              <div className="rec-form-grid rec-grid-3">
                <div className="rec-field">
                  <label htmlFor="f-collectionMode">Collection Mode *</label>
                  <select
                    id="f-collectionMode"
                    className="rec-input rec-select"
                    value={form.collectionMode}
                    onChange={(e) => handleChange('collectionMode', e.target.value)}
                    required
                  >
                    {COLLECTION_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-bankAccount">Deposited To (Bank / Cash Account) *</label>
                  <input
                    id="f-bankAccount"
                    list="rec-bank-options"
                    type="text"
                    className="rec-input"
                    value={form.bankAccount}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    placeholder="e.g. HDFC Farm Account"
                    required
                  />
                  <datalist id="rec-bank-options">
                    {bankAccounts.map((b) => <option key={b.id ?? b.name} value={b.name} />)}
                    <option value="Cash in Hand" />
                    <option value="Main Farm Account" />
                  </datalist>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-transactionRef">Transaction / UTR / Reference No</label>
                  <input
                    id="f-transactionRef"
                    type="text"
                    className="rec-input"
                    value={form.transactionRef}
                    onChange={(e) => handleChange('transactionRef', e.target.value)}
                    placeholder="UTR-091448123"
                  />
                </div>
              </div>

              {/* Conditional Cheque Fields */}
              {form.collectionMode === 'Cheque' && (
                <div className="rec-form-grid rec-grid-2 rec-cheque-highlight">
                  <div className="rec-field">
                    <label htmlFor="f-chequeNo">Cheque Number *</label>
                    <input
                      id="f-chequeNo"
                      type="text"
                      className={`rec-input ${errors.chequeNo ? 'rec-input-err' : ''}`}
                      value={form.chequeNo}
                      onChange={(e) => handleChange('chequeNo', e.target.value)}
                      placeholder="e.g. CHQ-778120"
                      required
                    />
                    {errors.chequeNo && <span className="rec-err-msg">{errors.chequeNo}</span>}
                  </div>
                  <div className="rec-field">
                    <label htmlFor="f-chequeDate">Cheque Issue / Due Date</label>
                    <input
                      id="f-chequeDate"
                      type="date"
                      className="rec-input"
                      value={form.chequeDate}
                      onChange={(e) => handleChange('chequeDate', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </fieldset>

            {/* SECTION G: Supporting Details & Status */}
            <fieldset className="rec-form-section">
              <legend>G. Status &amp; Supporting Remarks</legend>
              <div className="rec-form-grid rec-grid-2">
                <div className="rec-field">
                  <label htmlFor="f-status">Receipt Status *</label>
                  <select
                    id="f-status"
                    className="rec-input rec-select"
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {RECEIPT_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="rec-field">
                  <label htmlFor="f-remarks">Remarks &amp; Audit Notes</label>
                  <input
                    id="f-remarks"
                    type="text"
                    className="rec-input"
                    value={form.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    placeholder="e.g. Full settlement for 50 quintals Grade-A produce"
                  />
                </div>
              </div>
            </fieldset>

          </div>

          <div className="rec-form-footer">
            <span className="rec-form-footnote">
              * Required fields. Completed collections directly credit agricultural cash ledgers and reduce receivables.
            </span>
            <div className="rec-form-actions">
              <button type="button" className="rec-btn rec-btn-secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="rec-btn rec-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Receipt Record' : 'Save & Record Receipt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── View Receipt Modal ───────────────────────────────────────────────────────

function ViewReceiptModal({ record, onClose, onPrintVoucher, onEdit }) {
  if (!record) return null

  return (
    <div className="rec-form-overlay" role="dialog" aria-modal="true" aria-labelledby="rec-view-title">
      <div className="rec-modal-box rec-view-card">
        <div className="rec-form-header">
          <div>
            <div className="rec-eyebrow">FINANCE <span>/</span> RECEIPT SPECIFICATION</div>
            <h2 id="rec-view-title" className="rec-form-title">Receipt Voucher: {record.receiptNo}</h2>
            <p className="rec-form-subtitle">Registered collection dated {record.receiptDateDisplay || record.receiptDate}</p>
          </div>
          <button type="button" className="rec-modal-close" onClick={onClose} aria-label="Close view">×</button>
        </div>

        <div className="rec-modal-body rec-view-body">
          <div className="rec-view-top-bar">
            <div>
              <span className="rec-view-label">COLLECTION STATUS</span>
              <div style={{ marginTop: '4px' }}><StatusBadge status={record.status} /></div>
            </div>
            <div className="rec-view-amount-callout">
              <span className="rec-view-label">TOTAL RECEIVED AMOUNT</span>
              <strong className="rec-amount-lg">{record.finalAmountDisplay || formatCurrency(record.finalAmount)}</strong>
            </div>
          </div>

          <div className="rec-view-specs-grid">
            <div className="rec-spec-item">
              <span className="rec-spec-title">Receipt Date</span>
              <span className="rec-spec-val">{record.receiptDateDisplay || record.receiptDate}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Receipt Purpose</span>
              <span className="rec-spec-val">{record.purpose}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Category</span>
              <span className="rec-spec-val">{record.category || '—'}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Payer Type</span>
              <span className="rec-spec-val">{record.payerType}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Customer / Payer Name</span>
              <span className="rec-spec-val"><strong>{record.payerName}</strong></span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Contact Number</span>
              <span className="rec-spec-val">{record.contactInfo || '—'}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Farm Location</span>
              <span className="rec-spec-val">{record.farm || '—'} {record.fieldParcel ? `(${record.fieldParcel})` : ''}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Crop / Produce</span>
              <span className="rec-spec-val">{record.crop || '—'} {record.season ? `(${record.season})` : ''}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Reference Linked</span>
              <span className="rec-spec-val">{record.refType !== 'None' ? `${record.refType}: ${record.refNo || '—'}` : 'Direct Receipt'}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Collection Mode</span>
              <span className="rec-spec-val">{record.collectionMode}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Deposited To Account</span>
              <span className="rec-spec-val">{record.bankAccount}</span>
            </div>
            <div className="rec-spec-item">
              <span className="rec-spec-title">Transaction / UTR Ref</span>
              <span className="rec-spec-val">{record.transactionRef || '—'}</span>
            </div>
            {record.chequeNo && (
              <>
                <div className="rec-spec-item">
                  <span className="rec-spec-title">Cheque Number</span>
                  <span className="rec-spec-val">{record.chequeNo}</span>
                </div>
                <div className="rec-spec-item">
                  <span className="rec-spec-title">Cheque Date</span>
                  <span className="rec-spec-val">{formatDate(record.chequeDate) || '—'}</span>
                </div>
              </>
            )}
          </div>

          {/* Amount Breakdown Card */}
          <div className="rec-view-breakdown-card">
            <h4>Receipt Financial Breakdown</h4>
            <div className="rec-breakdown-row">
              <span>Base Received Amount:</span>
              <strong>{formatCurrency(record.amount)}</strong>
            </div>
            {record.discount > 0 && (
              <div className="rec-breakdown-row">
                <span>Discount / Rebate Concession:</span>
                <span style={{ color: '#c0392b' }}>- {formatCurrency(record.discount)}</span>
              </div>
            )}
            {record.otherCharges > 0 && (
              <div className="rec-breakdown-row">
                <span>Handling / Additional Charges:</span>
                <span>+ {formatCurrency(record.otherCharges)}</span>
              </div>
            )}
            <div className="rec-breakdown-row rec-breakdown-total">
              <span>Net Collected Inflow:</span>
              <strong>{record.finalAmountDisplay || formatCurrency(record.finalAmount)}</strong>
            </div>
          </div>

          {record.remarks && (
            <div className="rec-view-remarks">
              <span className="rec-spec-title">Remarks &amp; Audit Notes:</span>
              <p>{record.remarks}</p>
            </div>
          )}
        </div>

        <div className="rec-form-footer">
          <div className="rec-view-voucher-btn-wrap">
            <button
              type="button"
              className="rec-btn rec-btn-secondary"
              onClick={() => {
                onClose()
                onPrintVoucher(record)
              }}
            >
              🖨️ View &amp; Print Voucher
            </button>
          </div>
          <div className="rec-form-actions">
            <button type="button" className="rec-btn rec-btn-secondary" onClick={onClose}>Close</button>
            <button
              type="button"
              className="rec-btn rec-btn-primary"
              onClick={() => {
                onClose()
                onEdit(record)
              }}
            >
              Edit Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Printable Voucher Modal ──────────────────────────────────────────────────

function PrintableReceiptVoucherModal({ record, onClose }) {
  if (!record) return null

  const handlePrint = () => {
    window.print()
  }

  const amountInWords = numberToWordsINR(record.finalAmount)

  return (
    <div className="rec-form-overlay rec-print-overlay" role="dialog" aria-modal="true" aria-labelledby="rec-voucher-title">
      <div className="rec-voucher-container">
        {/* Screen Controls Bar */}
        <div className="rec-voucher-actions-bar no-print">
          <div>
            <strong>Receipt Voucher Preview</strong>
            <span style={{ marginLeft: '12px', fontSize: '13px', color: '#657269' }}>
              Official AGRIMAN agricultural collection acknowledgment
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="rec-btn rec-btn-primary" onClick={handlePrint}>
              🖨️ Print Voucher
            </button>
            <button type="button" className="rec-btn rec-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {/* Paper Document */}
        <div className="rec-voucher-paper">
          {/* Header */}
          <div className="rec-voucher-header">
            <div className="rec-voucher-logo-area">
              <span className="rec-voucher-logo">🌾 AGRIMAN</span>
              <small>FARM FINANCIAL MANAGEMENT SYSTEM</small>
            </div>
            <div className="rec-voucher-title-area">
              <h1 id="rec-voucher-title">OFFICIAL RECEIPT</h1>
              <div className="rec-voucher-badge">{record.status.toUpperCase()}</div>
            </div>
          </div>

          <div className="rec-voucher-meta-grid">
            <div className="rec-voucher-meta-cell">
              <span className="rec-v-label">Receipt No:</span>
              <strong className="rec-v-val">{record.receiptNo}</strong>
            </div>
            <div className="rec-voucher-meta-cell">
              <span className="rec-v-label">Receipt Date:</span>
              <strong className="rec-v-val">{record.receiptDateDisplay || record.receiptDate}</strong>
            </div>
            <div className="rec-voucher-meta-cell">
              <span className="rec-v-label">Payment Mode:</span>
              <strong className="rec-v-val">{record.collectionMode}</strong>
            </div>
            <div className="rec-voucher-meta-cell">
              <span className="rec-v-label">Bank Account:</span>
              <strong className="rec-v-val">{record.bankAccount}</strong>
            </div>
          </div>

          {/* Payer Box */}
          <div className="rec-voucher-section">
            <div className="rec-voucher-box">
              <div className="rec-v-row">
                <span className="rec-v-label">Received From:</span>
                <strong className="rec-v-name">{record.payerName}</strong>
                <span className="rec-v-pill">{record.payerType}</span>
              </div>
              {record.contactInfo && (
                <div className="rec-v-row">
                  <span className="rec-v-label">Contact No:</span>
                  <span>{record.contactInfo}</span>
                </div>
              )}
              {record.farm && (
                <div className="rec-v-row">
                  <span className="rec-v-label">Farm &amp; Crop:</span>
                  <span>{record.farm} {record.fieldParcel ? `[${record.fieldParcel}]` : ''} {record.crop ? `• ${record.crop}` : ''} {record.season ? `(${record.season})` : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rec-voucher-section">
            <table className="rec-voucher-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Purpose / Description</th>
                  <th>Reference / Invoice No</th>
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
                  <td>{record.refType !== 'None' ? `${record.refType}: ${record.refNo || '—'}` : 'Direct Collection'}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(record.amount)}</td>
                </tr>
                {record.discount > 0 && (
                  <tr>
                    <td>2</td>
                    <td>Discount / Early Settlement Rebate</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right', color: '#c0392b' }}>- {formatCurrency(record.discount)}</td>
                  </tr>
                )}
                {record.otherCharges > 0 && (
                  <tr>
                    <td>3</td>
                    <td>Weighing / Packaging Charges</td>
                    <td>—</td>
                    <td style={{ textAlign: 'right' }}>+ {formatCurrency(record.otherCharges)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3" style={{ textAlign: 'right' }}>TOTAL AMOUNT RECEIVED:</th>
                  <th style={{ textAlign: 'right', fontSize: '15px' }}>{record.finalAmountDisplay || formatCurrency(record.finalAmount)}</th>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in words */}
          <div className="rec-voucher-words-box">
            <span className="rec-v-label">Amount in Words:</span>
            <strong className="rec-words-text">{amountInWords}</strong>
          </div>

          {/* Payment & Banking Verification */}
          <div className="rec-voucher-bank-strip">
            <div>
              <span className="rec-v-label">Transaction / UTR Ref:</span>
              <span>{record.transactionRef || 'N/A'}</span>
            </div>
            {record.chequeNo && (
              <div>
                <span className="rec-v-label">Cheque Details:</span>
                <span>{record.chequeNo} (Dated: {formatDate(record.chequeDate) || 'N/A'})</span>
              </div>
            )}
            <div>
              <span className="rec-v-label">Receipt Classification:</span>
              <span>Agricultural Inflow / Collection</span>
            </div>
          </div>

          {/* Signature Grid */}
          <div className="rec-voucher-signatures">
            <div className="rec-sig-block">
              <div className="rec-sig-line"></div>
              <span>Received By (Accountant / Farmer)</span>
            </div>
            <div className="rec-sig-block">
              <div className="rec-sig-line"></div>
              <span>Authorized Signature</span>
            </div>
            <div className="rec-sig-block">
              <div className="rec-sig-line"></div>
              <span>Customer / Payer Acknowledgment</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="rec-voucher-footer">
            <small>This is an official computer-generated receipt from AGRIMAN Farm Financial Management System.</small>
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
    <div className="rec-form-overlay" role="dialog" aria-modal="true" aria-labelledby="rec-del-title">
      <div className="rec-modal-box rec-del-card">
        <h3 id="rec-del-title" style={{ margin: '0 0 10px', color: '#c0392b' }}>Delete Receipt Record?</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--rec-text-muted)', fontSize: '13.5px', lineHeight: '1.5' }}>
          Are you sure you want to permanently delete receipt <strong>{record.receiptNo}</strong> from{' '}
          <strong>{record.payerName}</strong> ({formatCurrency(record.finalAmount)})? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="rec-btn rec-btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="rec-btn rec-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cancel Receipt Modal ─────────────────────────────────────────────────────

function CancelDialog({ record, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState('Customer cheque bounced or collection cancelled')
  if (!record) return null

  return (
    <div className="rec-form-overlay" role="dialog" aria-modal="true" aria-labelledby="rec-cancel-title">
      <div className="rec-modal-box rec-del-card">
        <h3 id="rec-cancel-title" style={{ margin: '0 0 10px', color: '#b45309' }}>Cancel Receipt Transaction?</h3>
        <p style={{ margin: '0 0 12px', color: 'var(--rec-text-muted)', fontSize: '13.5px', lineHeight: '1.5' }}>
          Mark receipt <strong>{record.receiptNo}</strong> ({formatCurrency(record.finalAmount)}) as Cancelled.
          This will exclude the amount from completed collections while retaining the complete audit trail.
        </p>
        <div className="rec-field" style={{ marginBottom: '16px' }}>
          <label htmlFor="rec-cancel-reason">Cancellation Reason</label>
          <input
            id="rec-cancel-reason"
            type="text"
            className="rec-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Cheque returned, entry reversal, wrong customer"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" className="rec-btn rec-btn-secondary" onClick={onCancel} disabled={busy}>
            Dismiss
          </button>
          <button type="button" className="rec-btn rec-btn-warning" onClick={() => onConfirm(reason)} disabled={busy}>
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

  const reportData = useMemo(() => {
    switch (selectedReport) {
      case 'by-purpose': {
        const map = {}
        records.forEach((r) => {
          const key = r.purpose || 'Other'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-payer': {
        const map = {}
        records.forEach((r) => {
          const key = r.payerName || 'Unknown Customer'
          if (!map[key]) map[key] = { label: key, type: r.payerType, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-payer-type': {
        const map = {}
        records.forEach((r) => {
          const key = r.payerType || 'Other'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-mode': {
        const map = {}
        records.forEach((r) => {
          const key = r.collectionMode || 'Unknown'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-farm': {
        const map = {}
        records.forEach((r) => {
          const key = r.farm || 'General Farm Produce'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'by-crop': {
        const map = {}
        records.forEach((r) => {
          const key = r.crop || 'Unallocated Crop'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'monthly-receipts': {
        const map = {}
        records.forEach((r) => {
          const month = (r.receiptDate || '').slice(0, 7) || 'Unknown'
          if (!map[month]) map[month] = { label: month, count: 0, total: 0 }
          map[month].count += 1
          map[month].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.label.localeCompare(a.label))
      }
      case 'seasonal-receipts': {
        const map = {}
        records.forEach((r) => {
          const key = r.season || 'General / Non-Seasonal'
          if (!map[key]) map[key] = { label: key, count: 0, total: 0 }
          map[key].count += 1
          map[key].total += Number(r.finalAmount || 0)
        })
        return Object.values(map).sort((a, b) => b.total - a.total)
      }
      case 'pending-receivables': {
        return records.filter((r) => r.status === 'Pending' || r.status === 'Processing')
      }
      case 'cheques-register': {
        return records.filter((r) => r.collectionMode === 'Cheque' || r.chequeNo)
      }
      case 'top-collections': {
        return [...records].sort((a, b) => Number(b.finalAmount || 0) - Number(a.finalAmount || 0)).slice(0, 10)
      }
      case 'summary':
      default: {
        return records
      }
    }
  }, [records, selectedReport])

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (['by-purpose', 'by-payer', 'by-payer-type', 'by-mode', 'by-farm', 'by-crop', 'monthly-receipts', 'seasonal-receipts'].includes(selectedReport)) {
      csvContent += 'Category/Group,Transaction Count,Total Received (INR)\n'
      reportData.forEach((row) => {
        csvContent += `"${row.label}",${row.count},${row.total}\n`
      })
    } else {
      csvContent += 'Receipt No,Date,Purpose,Customer Name,Type,Farm,Crop,Amount (INR),Payment Mode,Bank Account,Ref No,Status\n'
      records.forEach((r) => {
        csvContent += `"${r.receiptNo}","${r.receiptDate}","${r.purpose}","${r.payerName}","${r.payerType}","${r.farm}","${r.crop}",${r.finalAmount},"${r.collectionMode}","${r.bankAccount}","${r.refNo}","${r.status}"\n`
      })
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `agriman_receipt_report_${selectedReport}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="rec-reports-container">
      <aside className="rec-reports-sidebar">
        <h3>Report Category</h3>
        <nav className="rec-reports-nav">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.key}
              type="button"
              className={`rec-report-nav-item ${selectedReport === rt.key ? 'active' : ''}`}
              onClick={() => setSelectedReport(rt.key)}
            >
              <span>{rt.icon}</span>
              <span>{rt.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="rec-reports-content">
        <div className="rec-report-top">
          <div>
            <h2>{REPORT_TYPES.find((r) => r.key === selectedReport)?.label}</h2>
            <p>Aggregated analysis across recorded customer collections.</p>
          </div>
          <button type="button" className="rec-btn rec-btn-secondary" onClick={exportCSV}>
            ⬇ Export Report CSV
          </button>
        </div>

        <div className="rec-table-card">
          <table className="rec-table">
            {['by-purpose', 'by-payer', 'by-payer-type', 'by-mode', 'by-farm', 'by-crop', 'monthly-receipts', 'seasonal-receipts'].includes(selectedReport) ? (
              <>
                <thead>
                  <tr>
                    <th>Category / Entity</th>
                    <th>Transactions</th>
                    <th className="rec-col-amount">Total Collection Amount</th>
                    <th className="rec-col-amount">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => {
                    const grandTotal = records.reduce((sum, r) => sum + Number(r.finalAmount || 0), 0)
                    const pct = grandTotal > 0 ? ((row.total / grandTotal) * 100).toFixed(1) : 0
                    return (
                      <tr key={idx}>
                        <td><strong>{row.label}</strong></td>
                        <td>{row.count} collections</td>
                        <td className="rec-col-amount"><strong>{formatCurrency(row.total)}</strong></td>
                        <td className="rec-col-amount">{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Customer / Payer</th>
                    <th>Purpose</th>
                    <th>Farm / Crop</th>
                    <th className="rec-col-amount">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.id}>
                      <td className="rec-col-id">{r.receiptNo}</td>
                      <td>{r.receiptDateDisplay || r.receiptDate}</td>
                      <td>{r.payerName}</td>
                      <td>{r.purpose}</td>
                      <td>{r.farm ? `${r.farm} ${r.crop ? `(${r.crop})` : ''}` : '—'}</td>
                      <td className="rec-col-amount"><strong>{r.finalAmountDisplay || formatCurrency(r.finalAmount)}</strong></td>
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

// ─── Main Receipts Component ──────────────────────────────────────────────────

export default function Receipts() {
  // Data State
  const [records, setRecords] = useState([])
  const [buyers, setBuyers] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [sales, setSales] = useState([])
  const [incomes, setIncomes] = useState([])

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
  const [payerTypeFilter, setPayerTypeFilter] = useState('All Payers')
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
      listReceiptBuyers(),
      listReceiptBankAccounts(),
      listReceiptFarms(),
      listReceiptCrops(),
      listOutstandingSales(),
      listOutstandingIncomes(),
    ]).then(([bList, bankList, fList, cList, sList, incList]) => {
      setBuyers(bList)
      setBankAccounts(bankList)
      setFarms(fList)
      setCrops(cList)
      setSales(sList)
      setIncomes(incList)
    }).catch((err) => {
      console.warn('[Receipts Ref] Error loading references:', err)
    })
  }, [])

  // ─── Fetch Receipts ──────────────────────────────────────────────────────────
  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await listReceipts({
        status: statusFilter,
        search,
        startDate: dateFrom,
        endDate: dateTo,
        purpose: purposeFilter,
        payerType: payerTypeFilter,
        collectionMode: modeFilter,
      })
      setRecords(data)
    } catch (err) {
      console.error('[Receipts Fetch] Error:', err)
      setLoadError('Failed to load receipts data. Offline ledger active.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, dateFrom, dateTo, purposeFilter, payerTypeFilter, modeFilter])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  // Summary Metrics
  const summary = useMemo(() => computeReceiptSummaryCards(records), [records])

  // Reset Filters
  const resetFilters = () => {
    setStatusFilter('All')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPurposeFilter('All Purposes')
    setPayerTypeFilter('All Payers')
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
    payerTypeFilter !== 'All Payers' ||
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

  const handleSaveReceipt = async (formValues) => {
    setBusy(true)
    try {
      if (editRecord?.id) {
        await updateReceipt(editRecord.id, formValues)
        showToast(`Receipt ${formValues.receiptNo} updated successfully!`)
      } else {
        await createReceipt(formValues)
        showToast(`Receipt ${formValues.receiptNo} recorded successfully!`)
      }
      setScreen('list')
      setEditRecord(null)
      fetchReceipts()
    } catch (err) {
      showToast(err.message || 'Error saving receipt', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteReceipt(deleteTarget.id)
      showToast(`Receipt ${deleteTarget.receiptNo} deleted.`)
      setDeleteTarget(null)
      fetchReceipts()
    } catch (err) {
      showToast(err.message || 'Error deleting receipt', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return
    setBusy(true)
    try {
      await cancelReceipt(cancelTarget.id, reason)
      showToast(`Receipt ${cancelTarget.receiptNo} marked as Cancelled.`)
      setCancelTarget(null)
      fetchReceipts()
    } catch (err) {
      showToast(err.message || 'Error cancelling receipt', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,Receipt No,Date,Purpose,Category,Customer Name,Payer Type,Farm,Crop,Amount (INR),Payment Mode,Bank Account,Ref No,Status,Remarks\n'
    records.forEach((r) => {
      csv += `"${r.receiptNo}","${r.receiptDate}","${r.purpose}","${r.category}","${r.payerName}","${r.payerType}","${r.farm}","${r.crop}",${r.finalAmount},"${r.collectionMode}","${r.bankAccount}","${r.refNo}","${r.status}","${r.remarks}"\n`
    })
    const encoded = encodeURI(csv)
    const link = document.createElement('a')
    link.setAttribute('href', encoded)
    link.setAttribute('download', `agriman_receipts_${localDate()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="receipts-page">
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`rec-toast ${toast.type === 'error' ? 'rec-toast-error' : ''}`} role="status">
          <span>{toast.type === 'error' ? '✗' : '✓'}</span>
          {toast.msg}
          <button type="button" onClick={() => setToast({ msg: '', type: 'success' })} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Page Header */}
      <div className="rec-page-header">
        <div>
          <div className="rec-eyebrow">FINANCE <span>/</span> RECEIPTS</div>
          <h1 className="rec-page-title">Receipt Management</h1>
          <p className="rec-page-desc">
            Record customer collections, sales produce receipts, rental income, and official receipt vouchers.
          </p>
        </div>
        <div className="rec-header-actions">
          <button type="button" className="rec-btn rec-btn-secondary" onClick={handleExportCSV}>
            ⬇ Export CSV
          </button>
          <button type="button" className="rec-btn rec-btn-primary" onClick={handleAddClick} disabled={busy}>
            + Record Receipt
          </button>
        </div>
      </div>

      {/* Module Tabs Switcher */}
      <div className="rec-module-tabs">
        <button
          type="button"
          className={`rec-module-tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
          onClick={() => setActiveTab('registry')}
        >
          📋 Receipt Registry &amp; Ledger
        </button>
        <button
          type="button"
          className={`rec-module-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📊 Reports &amp; Collection Analytics
        </button>
      </div>

      {activeTab === 'registry' && (
        <>
          {/* Summary Cards */}
          <SummaryCards summary={summary} loading={loading} />

          {/* Load Error Banner */}
          {loadError && (
            <div className="rec-error-banner" role="alert">
              <span>⚠️ {loadError}</span>
              <button type="button" className="rec-error-retry-btn" onClick={fetchReceipts}>Retry</button>
            </div>
          )}

          {/* Status Filter Tabs (Pill style) */}
          <div className="rec-status-tabs" role="tablist" aria-label="Filter by receipt status">
            {STATUS_TABS.map((st) => (
              <button
                key={st}
                type="button"
                role="tab"
                aria-selected={statusFilter === st}
                className={`rec-status-tab ${statusFilter === st ? 'active' : ''}`}
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
          <div className="rec-toolbar">
            {/* 1. Search */}
            <div className="rec-search-wrap">
              <span className="rec-search-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                className="rec-input rec-search-input"
                placeholder="Search Receipts..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                aria-label="Search receipt records"
              />
            </div>

            {/* 2. From Date */}
            <FilterDateInput
              id="rec-filter-from-date"
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
              id="rec-filter-to-date"
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
            <div className="rec-select-wrap">
              <select
                className="rec-input rec-select"
                value={purposeFilter}
                onChange={(e) => {
                  setPurposeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by receipt purpose"
              >
                <option value="All Purposes">All Purposes</option>
                {RECEIPT_PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 5. Payer Type Dropdown */}
            <div className="rec-select-wrap">
              <select
                className="rec-input rec-select"
                value={payerTypeFilter}
                onChange={(e) => {
                  setPayerTypeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by payer type"
              >
                <option value="All Payers">All Payers</option>
                {PAYER_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            {/* 6. Collection Mode Dropdown */}
            <div className="rec-select-wrap">
              <select
                className="rec-input rec-select"
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Filter by collection mode"
              >
                <option value="All Modes">All Modes</option>
                {COLLECTION_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* 7. Reset Filters Button */}
            <button
              type="button"
              className="rec-reset-btn"
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

          {/* Receipt Registry Table */}
          <div className="rec-table-card">
            <div className="rec-table-wrap">
              <table className="rec-table" aria-label="Receipts registry table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Purpose / Category</th>
                    <th>Customer / Payer</th>
                    <th>Reference</th>
                    <th className="rec-col-amount">Received Amount</th>
                    <th>Mode &amp; Account</th>
                    <th>Txn / Cheque Ref</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="rec-empty-cell">
                        <div className="rec-loading-spinner">Loading receipts...</div>
                      </td>
                    </tr>
                  ) : paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="rec-empty-cell">
                        <div className="rec-empty-state">
                          <p>No receipt records found matching your filters.</p>
                          {hasActiveFilters && (
                            <button type="button" className="rec-btn rec-btn-secondary" onClick={resetFilters}>
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td className="rec-col-id">
                          <strong>{rec.receiptNo}</strong>
                        </td>
                        <td>{rec.receiptDateDisplay || rec.receiptDate}</td>
                        <td>
                          <div className="rec-purpose-cell">
                            <strong>{rec.purpose}</strong>
                            {rec.category && <small>{rec.category}</small>}
                          </div>
                        </td>
                        <td>
                          <div className="rec-payer-cell">
                            <strong>{rec.payerName}</strong>
                            <small>{rec.payerType}</small>
                          </div>
                        </td>
                        <td>
                          {rec.refType !== 'None' && rec.refNo ? (
                            <span className="rec-ref-pill">{rec.refType}: {rec.refNo}</span>
                          ) : (
                            <span className="rec-muted">—</span>
                          )}
                        </td>
                        <td className="rec-col-amount">
                          <strong className="rec-amount-text">{rec.finalAmountDisplay || formatCurrency(rec.finalAmount)}</strong>
                        </td>
                        <td>
                          <div className="rec-mode-cell">
                            <span>{rec.collectionMode}</span>
                            <small>{rec.bankAccount}</small>
                          </div>
                        </td>
                        <td>
                          <div className="rec-ref-cell">
                            {rec.transactionRef && <span>{rec.transactionRef}</span>}
                            {rec.chequeNo && <small>CHQ: {rec.chequeNo}</small>}
                            {!rec.transactionRef && !rec.chequeNo && <span className="rec-muted">—</span>}
                          </div>
                        </td>
                        <td><StatusBadge status={rec.status} /></td>
                        <td>
                          <div className="rec-actions">
                            <TableActionMenu items={[
                              { label: 'View Details', icon: 'view', onClick: () => setViewRecord(rec) },
                              { label: 'Print Voucher', icon: 'pay', onClick: () => setVoucherRecord(rec) },
                              { label: 'Edit Receipt', icon: 'edit', onClick: () => handleEditClick(rec) },
                              rec.status !== 'Cancelled' ? {
                                label: 'Cancel Receipt',
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
            <div className="rec-table-footer">
              <span>
                Showing <strong>{totalRecords > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, totalRecords)}</strong> of <strong>{totalRecords}</strong> collections
              </span>
              <div className="rec-pagination">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : Math.max(1, Math.min(totalPages - 6, page - 3)) + i
                  return (
                    <button
                      key={p}
                      type="button"
                      className={page === p ? 'rec-page-active' : ''}
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
        <ReceiptForm
          initialData={editRecord}
          onSave={handleSaveReceipt}
          onCancel={() => {
            setScreen('list')
            setEditRecord(null)
          }}
          saving={busy}
          buyers={buyers}
          bankAccounts={bankAccounts}
          farms={farms}
          crops={crops}
          sales={sales}
          incomes={incomes}
        />
      )}

      {/* View Modal */}
      {viewRecord && (
        <ViewReceiptModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onPrintVoucher={(rec) => setVoucherRecord(rec)}
          onEdit={(rec) => handleEditClick(rec)}
        />
      )}

      {/* Printable Voucher Modal */}
      {voucherRecord && (
        <PrintableReceiptVoucherModal
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

      {/* Cancel Receipt Dialog */}
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
