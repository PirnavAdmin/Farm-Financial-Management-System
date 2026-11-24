import TableActionMenu from '../../TableActionMenu'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildExpensePayload,
  computeSummaryCards,
  createExpense,
  deleteExpense,
  displayDateToIso,
  formatCurrency,
  formatDate,
  getExpenseById,
  getExpenseSummary,
  getNextExpenseNo,
  isoToDisplayDate,
  listExpenseCategories,
  listExpenseCrops,
  listExpenseFarmers,
  listExpenseFarms,
  listExpenseSuppliers,
  listExpenses,
  localDate,
  normalizeExpense,
  parseDecimal,
  PAYMENT_MODES,
  SEASONS,
  updateExpense,
} from './expenseService.js'
import './expenses.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Paid', 'Partially Paid', 'Pending', 'Overdue', 'Cancelled']
const PAGE_SIZE = 10

const REPORT_TYPES = [
  { key: 'expense-summary', label: 'Expense Summary', icon: '📊' },
  { key: 'by-category', label: 'By Category', icon: '🏷️' },
  { key: 'by-supplier', label: 'By Supplier', icon: '🏪' },
  { key: 'by-farm', label: 'By Farm', icon: '🌾' },
  { key: 'by-crop', label: 'By Crop', icon: '🌱' },
  { key: 'by-payment-mode', label: 'By Payment Mode', icon: '💳' },
  { key: 'monthly-trend', label: 'Monthly Trend', icon: '📈' },
  { key: 'seasonal-analysis', label: 'Seasonal Analysis', icon: '🌤️' },
  { key: 'pending-payables', label: 'Pending Payables', icon: '⏳' },
  { key: 'overdue-report', label: 'Overdue Report', icon: '🔴' },
  { key: 'payment-history', label: 'Payment History', icon: '📋' },
  { key: 'top-expenses', label: 'Top Expenses', icon: '🔝' },
  { key: 'budget-vs-actual', label: 'Budget vs Actual', icon: '📉' },
  { key: 'annual-summary', label: 'Annual Summary', icon: '📅' },
]

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls = {
    Paid: 'exp-status-paid',
    'Partially Paid': 'exp-status-partial',
    Pending: 'exp-status-pending',
    Overdue: 'exp-status-overdue',
    Cancelled: 'exp-status-cancelled',
  }[status] || 'exp-status-pending'
  return <span className={`exp-status ${cls}`}>{status || 'Pending'}</span>
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary, loading }) {
  const cards = [
    { label: 'Total Expenses', value: formatCurrency(summary.totalExpenses), icon: '₹', hint: 'All recorded expenses', color: 'primary' },
    { label: 'Paid Expenses', value: formatCurrency(summary.paidExpenses), icon: '✓', hint: 'Fully settled', color: 'success' },
    { label: 'Pending Payables', value: formatCurrency(summary.pendingPayables), icon: '⏳', hint: 'Outstanding balance', color: 'warning' },
    { label: 'This Month', value: formatCurrency(summary.thisMonth), icon: '📅', hint: 'Current month expenses', color: 'info' },
  ]
  return (
    <div className="exp-summary">
      {cards.map((card) => (
        <article key={card.label} className={`exp-summary-card exp-card-${card.color}`}>
          <span className="exp-card-icon">{card.icon}</span>
          <div className="exp-card-body">
            <small>{card.label.toUpperCase()}</small>
            <strong className={loading ? 'exp-skeleton' : ''}>{loading ? '—' : card.value}</strong>
            <span className="exp-card-hint">{card.hint}</span>
          </div>
          <b className="exp-card-arrow">↗</b>
        </article>
      ))}
    </div>
  )
}

// ─── Filter Date Input (Displays dd/mm/yyyy with native calendar picker) ─────────

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
    if (iso) {
      onChange(iso)
    }
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
    <div className="exp-date-filter-wrap">
      <input
        type="text"
        id={id}
        className="exp-input exp-date-text-input"
        placeholder={placeholder}
        value={typedText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      <button
        type="button"
        className="exp-date-picker-trigger"
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
        className="exp-date-native-hidden"
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

// ─── Date field with native picker ───────────────────────────────────────────

function DateField({ name, value, onChange, placeholder = 'YYYY-MM-DD', required }) {
  return (
    <div className="exp-date-wrap">
      <input
        type="date"
        name={name}
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="exp-input"
      />
    </div>
  )
}

// ─── Calc Banner ──────────────────────────────────────────────────────────────

function CalcBanner({ qty, rate, gross, discount, taxPct, taxAmt, otherCharges, finalAmount, calcMode }) {
  if (calcMode === 'direct') {
    return (
      <div className="exp-calc-banner">
        <span>Direct Entry Mode</span>
        <span className="exp-calc-final">Final Amount: <strong>{formatCurrency(finalAmount)}</strong></span>
      </div>
    )
  }
  return (
    <div className="exp-calc-banner">
      <span>{qty || 0} × ₹{rate || 0} = ₹{gross.toFixed(2)}</span>
      <span>− Discount ₹{discount.toFixed(2)}</span>
      <span>+ Tax({taxPct}%) ₹{taxAmt.toFixed(2)}</span>
      <span>+ Charges ₹{otherCharges.toFixed(2)}</span>
      <span className="exp-calc-final">= <strong>{formatCurrency(finalAmount)}</strong></span>
    </div>
  )
}

// ─── Add / Edit Form ──────────────────────────────────────────────────────────

function ExpenseForm({ initialValues, categories, suppliers, farmers, farms, crops, onClose, onSave, busy }) {
  const isEdit = Boolean(initialValues?.id)
  const [values, setValues] = useState({
    expenseDate: localDate(),
    expenseNo: '',
    expenseCategory: '',
    expenseSubcategory: '',
    categoryId: null,
    description: '',
    referenceNo: '',
    // Agricultural
    farm: '',
    fieldParcel: '',
    crop: '',
    season: '',
    farmer: '',
    // Supplier
    supplier: '',
    invoiceNo: '',
    invoiceDate: '',
    supplierRef: '',
    // Amount
    calcMode: 'rate',
    quantity: '',
    unit: 'kg',
    rate: '',
    directAmount: '',
    discount: '0',
    taxPercent: '0',
    otherCharges: '0',
    // Payment
    status: 'Pending',
    dueDate: '',
    amountPaid: '0',
    paymentMode: 'Cash',
    bankCash: '',
    paymentRef: '',
    remarks: '',
    ...initialValues,
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (val) => setValues((v) => ({ ...v, [field]: typeof val === 'string' ? val : val?.target?.value ?? val }))

  // Amount calculation
  const qty = parseDecimal(values.quantity)
  const rate = parseDecimal(values.rate)
  const gross = values.calcMode === 'rate' ? Math.round(qty * rate * 100) / 100 : parseDecimal(values.directAmount)
  const discount = parseDecimal(values.discount)
  const taxPct = parseDecimal(values.taxPercent)
  const taxAmt = Math.round((gross - discount) * taxPct * 100) / 10000
  const otherCharges = parseDecimal(values.otherCharges)
  const finalAmount = Math.max(0, Math.round((gross - discount + taxAmt + otherCharges) * 100) / 100)

  const amountPaid = parseDecimal(values.amountPaid)
  const pendingBalance = Math.max(0, Math.round((finalAmount - amountPaid) * 100) / 100)

  function validate() {
    const e = {}
    if (!values.expenseDate) e.expenseDate = 'Date required'
    if (!values.expenseCategory) e.expenseCategory = 'Category required'
    if (!values.description.trim()) e.description = 'Description required'
    if (finalAmount <= 0) e.amount = 'Amount must be greater than 0'
    if (!values.status) e.status = 'Status required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    try {
      const payload = buildExpensePayload(
        { ...values, amount: finalAmount },
        categories
      )
      await onSave(payload, initialValues?.id)
    } catch (err) {
      setErrors({ _form: err.friendlyMessage || err.message })
    }
  }

  const catNames = categories.map((c) => c.name)
  const supplierNames = ['Direct Purchase', ...suppliers.map((s) => s.name)]
  const farmerNames = farmers.map((f) => f.name)
  const farmNames = farms.map((f) => f.name)
  const cropNames = crops.map((c) => c.name)

  return (
    <div className="exp-form-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Expense' : 'Add Expense'}>
      <div className="exp-form-card">
        <header className="exp-form-header">
          <div>
            <span className="exp-form-eyebrow">FINANCE / EXPENSES</span>
            <h2>{isEdit ? 'Edit Expense Record' : 'Add Expense Record'}</h2>
            <p>Record agricultural or operational expense details.</p>
          </div>
          <button type="button" className="exp-form-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <form className="exp-form-body" onSubmit={handleSubmit} noValidate>
          {errors._form && <div className="exp-form-error">{errors._form}</div>}

          {/* Section A: Basic Info */}
          <div className="exp-form-section">
            <h3 className="exp-form-section-title">A. Basic Information</h3>
            <div className="exp-form-grid">
              <label className="exp-form-label">
                Expense Date <span className="exp-required">*</span>
                <DateField name="expenseDate" value={values.expenseDate} onChange={set('expenseDate')} required />
                {errors.expenseDate && <span className="exp-field-error">{errors.expenseDate}</span>}
              </label>
              <label className="exp-form-label">
                Expense No
                <input className="exp-input" type="text" value={values.expenseNo} onChange={set('expenseNo')} placeholder="Auto-generated" readOnly={isEdit} />
              </label>
              <label className="exp-form-label">
                Category <span className="exp-required">*</span>
                <select className="exp-input" value={values.expenseCategory} onChange={set('expenseCategory')} required>
                  <option value="">— Select Category —</option>
                  {catNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                {errors.expenseCategory && <span className="exp-field-error">{errors.expenseCategory}</span>}
              </label>
              <label className="exp-form-label">
                Subcategory
                <input className="exp-input" type="text" value={values.expenseSubcategory || ''} onChange={set('expenseSubcategory')} placeholder="e.g. Hybrid, DAP, Weeding" />
              </label>
              <label className="exp-form-label exp-wide">
                Description <span className="exp-required">*</span>
                <textarea className="exp-input exp-textarea" value={values.description} onChange={set('description')} placeholder="Enter expense description" rows={2} required />
                {errors.description && <span className="exp-field-error">{errors.description}</span>}
              </label>
              <label className="exp-form-label">
                Reference No
                <input className="exp-input" type="text" value={values.referenceNo} onChange={set('referenceNo')} placeholder="e.g. PO-2024-001" />
              </label>
            </div>
          </div>

          {/* Section B: Agricultural Info */}
          <div className="exp-form-section">
            <h3 className="exp-form-section-title">B. Agricultural Information</h3>
            <div className="exp-form-grid">
              <label className="exp-form-label">
                Farmer
                <input className="exp-input" type="text" list="exp-farmer-list" value={values.farmer} onChange={set('farmer')} placeholder="Select or type farmer" />
                <datalist id="exp-farmer-list">{farmerNames.map((n) => <option key={n} value={n} />)}</datalist>
              </label>
              <label className="exp-form-label">
                Farm
                <input className="exp-input" type="text" list="exp-farm-list" value={values.farm} onChange={set('farm')} placeholder="Select or type farm" />
                <datalist id="exp-farm-list">{farmNames.map((n) => <option key={n} value={n} />)}</datalist>
              </label>
              <label className="exp-form-label">
                Field / Parcel
                <input className="exp-input" type="text" value={values.fieldParcel} onChange={set('fieldParcel')} placeholder="e.g. North Block, Plot A" />
              </label>
              <label className="exp-form-label">
                Crop
                <input className="exp-input" type="text" list="exp-crop-list" value={values.crop} onChange={set('crop')} placeholder="Select or type crop" />
                <datalist id="exp-crop-list">{cropNames.map((n) => <option key={n} value={n} />)}</datalist>
              </label>
              <label className="exp-form-label">
                Season
                <select className="exp-input" value={values.season} onChange={set('season')}>
                  <option value="">— Select Season —</option>
                  {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Section C: Supplier */}
          <div className="exp-form-section">
            <h3 className="exp-form-section-title">C. Supplier Details</h3>
            <div className="exp-form-grid">
              <label className="exp-form-label">
                Supplier
                <input className="exp-input" type="text" list="exp-supplier-list" value={values.supplier} onChange={set('supplier')} placeholder="Select or type supplier" />
                <datalist id="exp-supplier-list">{supplierNames.map((n) => <option key={n} value={n} />)}</datalist>
              </label>
              <label className="exp-form-label">
                Invoice No
                <input className="exp-input" type="text" value={values.invoiceNo} onChange={set('invoiceNo')} placeholder="e.g. INV-2024-001" />
              </label>
              <label className="exp-form-label">
                Invoice Date
                <DateField name="invoiceDate" value={values.invoiceDate} onChange={set('invoiceDate')} />
              </label>
              <label className="exp-form-label">
                Supplier Reference
                <input className="exp-input" type="text" value={values.supplierRef} onChange={set('supplierRef')} placeholder="Supplier PO or ref" />
              </label>
            </div>
          </div>

          {/* Section D: Amount */}
          <div className="exp-form-section">
            <h3 className="exp-form-section-title">D. Amount</h3>
            <div className="exp-calc-mode-toggle">
              <button type="button" className={`exp-toggle-btn ${values.calcMode === 'rate' ? 'active' : ''}`} onClick={() => setValues((v) => ({ ...v, calcMode: 'rate' }))}>
                Quantity × Rate
              </button>
              <button type="button" className={`exp-toggle-btn ${values.calcMode === 'direct' ? 'active' : ''}`} onClick={() => setValues((v) => ({ ...v, calcMode: 'direct' }))}>
                Direct Entry
              </button>
            </div>
            <div className="exp-form-grid">
              {values.calcMode === 'rate' ? (
                <>
                  <label className="exp-form-label">
                    Quantity
                    <input className="exp-input" type="number" min="0" step="0.001" value={values.quantity} onChange={set('quantity')} placeholder="0.00" />
                  </label>
                  <label className="exp-form-label">
                    Unit
                    <select className="exp-input" value={values.unit} onChange={set('unit')}>
                      {['kg', 'quintal', 'tonne', 'litre', 'bag', 'piece', 'acre', 'hectare', 'hour', 'day'].map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </label>
                  <label className="exp-form-label">
                    Rate (₹ / unit)
                    <input className="exp-input" type="number" min="0" step="0.01" value={values.rate} onChange={set('rate')} placeholder="0.00" />
                  </label>
                </>
              ) : (
                <label className="exp-form-label">
                  Direct Amount (₹) <span className="exp-required">*</span>
                  <input className="exp-input" type="number" min="0.01" step="0.01" value={values.directAmount} onChange={set('directAmount')} placeholder="0.00" required />
                  {errors.amount && <span className="exp-field-error">{errors.amount}</span>}
                </label>
              )}
              <label className="exp-form-label">
                Discount (₹)
                <input className="exp-input" type="number" min="0" step="0.01" value={values.discount} onChange={set('discount')} placeholder="0.00" />
              </label>
              <label className="exp-form-label">
                Tax (%)
                <input className="exp-input" type="number" min="0" max="100" step="0.01" value={values.taxPercent} onChange={set('taxPercent')} placeholder="0" />
              </label>
              <label className="exp-form-label">
                Other Charges (₹)
                <input className="exp-input" type="number" min="0" step="0.01" value={values.otherCharges} onChange={set('otherCharges')} placeholder="0.00" />
              </label>
            </div>
            <CalcBanner qty={qty} rate={rate} gross={gross} discount={discount} taxPct={taxPct} taxAmt={taxAmt} otherCharges={otherCharges} finalAmount={finalAmount} calcMode={values.calcMode} />
            {errors.amount && <span className="exp-field-error">{errors.amount}</span>}
          </div>

          {/* Section E: Payment */}
          <div className="exp-form-section">
            <h3 className="exp-form-section-title">E. Payment Details</h3>
            <div className="exp-form-grid">
              <label className="exp-form-label">
                Payment Status <span className="exp-required">*</span>
                <select className="exp-input" value={values.status} onChange={set('status')} required>
                  {['Paid', 'Partially Paid', 'Pending', 'Overdue', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.status && <span className="exp-field-error">{errors.status}</span>}
              </label>
              <label className="exp-form-label">
                Due Date
                <DateField name="dueDate" value={values.dueDate} onChange={set('dueDate')} />
              </label>
              <label className="exp-form-label">
                Amount Paid (₹)
                <input className="exp-input" type="number" min="0" step="0.01" value={values.amountPaid} onChange={set('amountPaid')} placeholder="0.00" />
              </label>
              <label className="exp-form-label">
                Pending Balance
                <input className="exp-input" type="text" value={formatCurrency(pendingBalance)} readOnly tabIndex={-1} style={{ background: 'var(--exp-bg-muted)', color: pendingBalance > 0 ? 'var(--exp-warning)' : 'var(--exp-success)' }} />
              </label>
              <label className="exp-form-label">
                Payment Mode
                <select className="exp-input" value={values.paymentMode} onChange={set('paymentMode')}>
                  {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="exp-form-label">
                Bank / Cash Account
                <input className="exp-input" type="text" list="exp-bank-list" value={values.bankCash} onChange={set('bankCash')} placeholder="e.g. SBI Current A/c" />
                <datalist id="exp-bank-list">{['Cash', 'SBI Current A/c', 'HDFC A/c', 'Petty Cash', 'UPI Wallet'].map((b) => <option key={b} value={b} />)}</datalist>
              </label>
              <label className="exp-form-label">
                Payment Reference
                <input className="exp-input" type="text" value={values.paymentRef} onChange={set('paymentRef')} placeholder="e.g. TXN12345" />
              </label>
              <label className="exp-form-label exp-wide">
                Remarks
                <textarea className="exp-input exp-textarea" value={values.remarks} onChange={set('remarks')} placeholder="Any additional notes" rows={2} />
              </label>
            </div>
          </div>

          <footer className="exp-form-footer">
            <span className="exp-form-note">Fields marked <span className="exp-required">*</span> are required.</span>
            <div className="exp-form-actions">
              <button type="button" className="exp-btn exp-btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="exp-btn exp-btn-primary" disabled={busy}>
                {busy ? 'Saving…' : isEdit ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}

// ─── View Detail Modal ────────────────────────────────────────────────────────

function ViewModal({ record, onClose, onEdit }) {
  if (!record) return null
  const rows = [
    ['Expense No', record.expenseNo],
    ['Date', record.expenseDateDisplay || record.expenseDate],
    ['Category', record.expenseCategory],
    ['Subcategory', record.expenseSubcategory],
    ['Description', record.description],
    ['Farmer', record.farmer],
    ['Farm', record.farm],
    ['Crop', record.crop],
    ['Supplier', record.supplier],
    ['Total Amount', record.amountDisplay],
    ['Amount Paid', record.amountPaidDisplay],
    ['Pending', record.pendingAmountDisplay],
    ['Status', record.status],
    ['Payment Mode', record.paymentMode],
    ['Reference No', record.referenceNo],
    ['Remarks', record.remarks],
  ].filter(([, v]) => v)
  return (
    <div className="exp-modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="exp-modal-box">
        <div className="exp-modal-header">
          <div>
            <span className="exp-form-eyebrow">EXPENSE DETAIL</span>
            <h3>{record.expenseNo || 'Expense Record'}</h3>
          </div>
          <button type="button" className="exp-form-close" onClick={onClose}>×</button>
        </div>
        <div className="exp-modal-body">
          <dl className="exp-detail-grid">
            {rows.map(([label, val]) => (
              <React.Fragment key={label}>
                <dt>{label}</dt>
                <dd>{label === 'Status' ? <StatusBadge status={val} /> : val}</dd>
              </React.Fragment>
            ))}
          </dl>
          {record.payments?.length > 0 && (
            <>
              <h4 className="exp-section-subheader">Payment History</h4>
              <table className="exp-mini-table">
                <thead><tr><th>Date</th><th>Mode</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {record.payments.map((p, i) => (
                    <tr key={p.id ?? i}>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td>{p.paymentMode}</td>
                      <td>{formatCurrency(p.amount)}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <div className="exp-modal-footer">
          <button type="button" className="exp-btn exp-btn-secondary" onClick={onClose}>Close</button>
          <button type="button" className="exp-btn exp-btn-primary" onClick={() => { onClose(); onEdit(record) }}>Edit</button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({ record, onClose, onConfirm, busy }) {
  if (!record) return null
  return (
    <div className="exp-modal-backdrop" role="dialog" aria-modal="true">
      <div className="exp-modal-box exp-confirm-box">
        <div className="exp-modal-header">
          <h3>Delete Expense</h3>
          <button type="button" className="exp-form-close" onClick={onClose}>×</button>
        </div>
        <div className="exp-modal-body">
          <p>Are you sure you want to delete expense <strong>{record.expenseNo || record.id}</strong>?</p>
          <p className="exp-warn-text">This action cannot be undone.</p>
        </div>
        <div className="exp-modal-footer">
          <button type="button" className="exp-btn exp-btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="exp-btn exp-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reports Section ──────────────────────────────────────────────────────────

function ReportsSection({ summary }) {
  const [activeReport, setActiveReport] = useState('expense-summary')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function handleCSV() {
    const url = `/api/expenses/export/csv?${new URLSearchParams({ startDate: dateFrom || '', endDate: dateTo || '' })}`
    window.open(url, '_blank')
  }

  return (
    <div className="exp-reports-wrapper">
      <div className="exp-reports-sidebar">
        <h3 className="exp-reports-heading">Report Types</h3>
        {REPORT_TYPES.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`exp-report-nav-btn ${activeReport === r.key ? 'active' : ''}`}
            onClick={() => setActiveReport(r.key)}
          >
            <span>{r.icon}</span> {r.label}
          </button>
        ))}
      </div>
      <div className="exp-reports-panel">
        <div className="exp-reports-toolbar">
          <h3>{REPORT_TYPES.find((r) => r.key === activeReport)?.label}</h3>
          <div className="exp-reports-filters">
            <label>From <input type="date" className="exp-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
            <label>To <input type="date" className="exp-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            <button type="button" className="exp-btn exp-btn-secondary" onClick={handleCSV}>⬇ Export CSV</button>
          </div>
        </div>
        <div className="exp-report-sheet">
          <div className="exp-report-kpi-grid">
            <div className="exp-report-kpi-card">
              <small>TOTAL EXPENSES</small>
              <strong>{formatCurrency(summary.totalExpenses)}</strong>
            </div>
            <div className="exp-report-kpi-card">
              <small>PAID</small>
              <strong>{formatCurrency(summary.paidExpenses)}</strong>
            </div>
            <div className="exp-report-kpi-card">
              <small>PENDING PAYABLES</small>
              <strong>{formatCurrency(summary.pendingPayables)}</strong>
            </div>
            <div className="exp-report-kpi-card">
              <small>THIS MONTH</small>
              <strong>{formatCurrency(summary.thisMonth)}</strong>
            </div>
          </div>
          <p className="exp-report-note">
            Use the <strong>Export CSV</strong> button to download detailed data for this report type.
            Connect your backend report endpoint (<code>/api/Loan/reports/{activeReport}</code>) to populate charts here.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Expenses() {
  // Data state
  const [records, setRecords] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [farmers, setFarmers] = useState([])
  const [farms, setFarms] = useState([])
  const [crops, setCrops] = useState([])
  const [summary, setSummary] = useState({ totalExpenses: 0, paidExpenses: 0, pendingPayables: 0, thisMonth: 0 })
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // UI state
  const [activeTab, setActiveTab] = useState('registry')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [farmFilter, setFarmFilter] = useState('')
  const [cropFilter, setCropFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)

  // Form / modal state
  const [screen, setScreen] = useState('list') // 'list' | 'add' | 'edit'
  const [editRecord, setEditRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Notifications
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const toastTimer = useRef(null)

  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast({ msg: '', type: 'success' }), 3200)
  }

  // ── Load reference data once ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      listExpenseCategories(),
      listExpenseSuppliers(),
      listExpenseFarmers(),
      listExpenseFarms(),
      listExpenseCrops(),
    ]).then(([cats, sups, frs, fms, crps]) => {
      setCategories(cats)
      setSuppliers(sups)
      setFarmers(frs)
      setFarms(fms)
      setCrops(crps)
    }).catch(() => {})
  }, [])

  // ── Load expenses ────────────────────────────────────────────────────────
  const loadExpenses = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const params = { page, pageSize: PAGE_SIZE }
      if (search.trim()) params.search = search.trim()
      if (dateFrom) params.startDate = dateFrom
      if (dateTo) params.endDate = dateTo
      if (categoryFilter) params.expenseCategory = categoryFilter
      if (supplierFilter) params.supplier = supplierFilter
      if (farmFilter) params.farm = farmFilter
      if (cropFilter) params.crop = cropFilter
      if (statusFilter !== 'All') params.status = statusFilter

      const today = new Date()
      const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

      const [listData, allMetrics, paidList, monthList] = await Promise.all([
        listExpenses(params),
        getExpenseSummary({}).catch(() => null),
        listExpenses({ status: 'Paid', pageSize: 1 }).catch(() => null),
        listExpenses({ startDate: firstOfMonth, pageSize: 1 }).catch(() => null),
      ])

      const rawRows = Array.isArray(listData?.data) ? listData.data : (Array.isArray(listData) ? listData : [])
      const normalized = rawRows.map((r) => { try { return normalizeExpense(r) } catch { return null } }).filter(Boolean)

      setRecords(normalized)
      setTotalCount(Number(listData?.totalRecords ?? listData?.totalCount ?? normalized.length) || 0)
      setTotalPages(Number(listData?.totalPages ?? listData?.pageCount) || Math.max(1, Math.ceil(normalized.length / PAGE_SIZE)))

      const cards = computeSummaryCards(allMetrics || listData, paidList, monthList)
      setSummary(cards)
    } catch (err) {
      setLoadError(err.friendlyMessage || err.message || 'Unable to load expenses from the API.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [page, search, dateFrom, dateTo, categoryFilter, supplierFilter, farmFilter, cropFilter, statusFilter])

  useEffect(() => { loadExpenses() }, [loadExpenses])
  useEffect(() => { setPage(1) }, [search, dateFrom, dateTo, categoryFilter, supplierFilter, farmFilter, cropFilter, statusFilter])

  // ── Add / open form ──────────────────────────────────────────────────────
  async function handleAddClick() {
    const nextNo = await getNextExpenseNo().catch(() => '')
    setEditRecord({ expenseNo: nextNo })
    setScreen('add')
  }

  async function handleEditClick(record) {
    try {
      setBusy(true)
      const full = await getExpenseById(record.id)
      setEditRecord({
        ...full,
        expenseDate: full.expenseDate || localDate(),
        calcMode: 'direct',
        directAmount: String(full.amount || ''),
        quantity: '',
        unit: 'kg',
        rate: '',
        discount: '0',
        taxPercent: '0',
        otherCharges: '0',
        amountPaid: String(full.amountPaid || '0'),
      })
      setScreen('edit')
    } catch (err) {
      showToast(err.friendlyMessage || err.message || 'Unable to load expense details.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleViewClick(record) {
    try {
      setBusy(true)
      const full = await getExpenseById(record.id)
      setViewRecord(full)
    } catch {
      setViewRecord(record)
    } finally {
      setBusy(false)
    }
  }

  // ── Save (create or update) ──────────────────────────────────────────────
  async function handleSave(payload, id) {
    setBusy(true)
    try {
      if (id) {
        await updateExpense(id, payload)
        showToast('Expense record updated successfully.')
      } else {
        await createExpense(payload)
        showToast('Expense record added successfully.')
      }
      setScreen('list')
      setEditRecord(null)
      await loadExpenses()
    } catch (err) {
      throw err // re-throw so ExpenseForm can show field-level error
    } finally {
      setBusy(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteBusy(true)
    try {
      await deleteExpense(deleteTarget.id)
      showToast('Expense record deleted.')
      setDeleteTarget(null)
      await loadExpenses()
    } catch (err) {
      showToast(err.friendlyMessage || err.message || 'Unable to delete expense.', 'error')
      setDeleteTarget(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  // ── Reset filters ────────────────────────────────────────────────────────
  function resetFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setCategoryFilter('')
    setSupplierFilter('')
    setFarmFilter('')
    setCropFilter('')
    setStatusFilter('All')
    setPage(1)
  }

  const pageCount = Math.max(totalPages, 1)
  const catNames = categories.map((c) => c.name)

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="expense-page">
      {/* Toast */}
      {toast.msg && (
        <div className={`exp-toast ${toast.type === 'error' ? 'exp-toast-error' : ''}`} role="status">
          <span>{toast.type === 'error' ? '✗' : '✓'}</span>
          {toast.msg}
          <button type="button" onClick={() => setToast({ msg: '', type: 'success' })} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Page Header */}
      <div className="exp-page-header">
        <div>
          <div className="exp-eyebrow">FINANCE <span>/</span> EXPENSES</div>
          <h1 className="exp-page-title">Expense Management</h1>
          <p className="exp-page-desc">Track seed, fertilizer, labour, machinery, and all farm operational costs.</p>
        </div>
        <div className="exp-header-actions">
          <a href="/api/expenses/export/csv" className="exp-btn exp-btn-secondary" target="_blank" rel="noopener noreferrer">⬇ Export CSV</a>
          <button type="button" className="exp-btn exp-btn-primary" onClick={handleAddClick} disabled={busy}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* Module Tab Switcher */}
      <div className="exp-module-tabs">
        <button type="button" className={`exp-module-tab-btn ${activeTab === 'registry' ? 'active' : ''}`} onClick={() => setActiveTab('registry')}>
          📋 Expense Registry &amp; Ledger
        </button>
        <button type="button" className={`exp-module-tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          📊 Reports &amp; Analytics
        </button>
      </div>

      {activeTab === 'registry' && (
        <>
          {/* Summary Cards */}
          <SummaryCards summary={summary} loading={loading} />

          {/* Connection / Load Error Banner */}
          {loadError && (
            <div className="exp-error-banner" role="alert">
              <div className="exp-error-content">
                <span className="exp-error-icon" aria-hidden="true">⚠</span>
                <span className="exp-error-text">
                  {loadError.includes('ERR_NGROK_3200') || loadError.includes('ngrok')
                    ? 'Backend service is currently unreachable. Please check server connection and retry.'
                    : loadError}
                </span>
                {(loadError.includes('ERR_NGROK_3200') || loadError.includes('ngrok')) && (
                  <span className="exp-error-badge">Offline (ERR_NGROK_3200)</span>
                )}
              </div>
              <button type="button" className="exp-error-retry-btn" onClick={loadExpenses}>
                ↻ Retry
              </button>
            </div>
          )}

          {/* Status Filter Tabs */}
          <div className="exp-status-tabs" role="tablist" aria-label="Filter expenses by status">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab}
                className={`exp-status-tab ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="exp-toolbar" role="search" aria-label="Expense search and filters">
            {/* 1. Search Expenses */}
            <div className="exp-search-wrap">
              <span className="exp-search-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                className="exp-input exp-search-input"
                placeholder="Search expenses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search expenses"
              />
            </div>

            {/* 2. From Date */}
            <FilterDateInput
              id="exp-filter-from-date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(val) => setDateFrom(val)}
              placeholder="From: dd/mm/yyyy"
              ariaLabel="From Date"
            />

            {/* 3. To Date */}
            <FilterDateInput
              id="exp-filter-to-date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(val) => setDateTo(val)}
              placeholder="To: dd/mm/yyyy"
              ariaLabel="To Date"
            />

            {/* 4. Category */}
            <div className="exp-select-wrap">
              <select
                className="exp-input exp-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {catNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* 5. Supplier */}
            <div className="exp-select-wrap">
              <select
                className="exp-input exp-select"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                aria-label="Filter by supplier"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => <option key={s.id ?? s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            {/* 6. Farm */}
            <div className="exp-select-wrap">
              <select
                className="exp-input exp-select"
                value={farmFilter}
                onChange={(e) => setFarmFilter(e.target.value)}
                aria-label="Filter by farm"
              >
                <option value="">All Farms</option>
                {farms.map((f) => <option key={f.id ?? f.name} value={f.name}>{f.name}</option>)}
              </select>
            </div>

            {/* 7. Reset */}
            <button
              type="button"
              className="exp-reset-btn"
              onClick={resetFilters}
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

          {/* Registry Table */}
          <div className="exp-table-card">
            <div className="exp-table-wrap">
              <table className="exp-table" aria-label="Expense records">
                <thead>
                  <tr>
                    <th>Expense No</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Supplier</th>
                    <th>Farm &amp; Crop</th>
                    <th className="exp-col-amount">Total Expense</th>
                    <th className="exp-col-amount">Paid</th>
                    <th className="exp-col-amount">Pending</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11}>
                        <div className="exp-table-empty">
                          <div className="exp-spinner" />
                          <strong>Loading expenses…</strong>
                        </div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={11}>
                        <div className="exp-table-empty">
                          <span className="exp-empty-icon">📋</span>
                          <strong>No expense records found</strong>
                          <p>{loadError || 'Add an expense or change your search filters.'}</p>
                          <button type="button" className="exp-btn exp-btn-secondary" onClick={resetFilters}>Clear Filters</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => (
                      <tr key={rec.id}>
                        <td className="exp-col-id">{rec.expenseNo || `EXP-${rec.id}`}</td>
                        <td>{rec.expenseDateDisplay || rec.expenseDate}</td>
                        <td>{rec.expenseCategory || '—'}</td>
                        <td className="exp-col-desc" title={rec.description}>{rec.description || '—'}</td>
                        <td>{rec.supplier || '—'}</td>
                        <td>
                          {rec.farm && <div className="exp-cell-farm">{rec.farm}</div>}
                          {rec.crop && <div className="exp-cell-crop">{rec.crop}</div>}
                          {!rec.farm && !rec.crop && '—'}
                        </td>
                        <td className="exp-col-amount">{rec.amountDisplay}</td>
                        <td className="exp-col-amount exp-paid">{rec.amountPaidDisplay}</td>
                        <td className="exp-col-amount exp-pending">{rec.pendingAmountDisplay}</td>
                        <td><StatusBadge status={rec.status} /></td>
                        <td>
                          <div className="exp-actions">
                            <TableActionMenu items={[
                              { label: 'View Detail', icon: 'view', onClick: () => handleViewClick(rec) },
                              { label: 'Edit Expense', icon: 'edit', onClick: () => handleEditClick(rec) },
                              { label: 'Delete Expense', icon: 'delete', danger: true, onClick: () => setDeleteTarget(rec) },
                            ]} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="exp-table-footer">
              <span>
                Showing <strong>{totalCount > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, totalCount)}</strong> of <strong>{totalCount}</strong> records
              </span>
              <div className="exp-pagination">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
                  const p = pageCount <= 7 ? i + 1 : Math.max(1, Math.min(pageCount - 6, page - 3)) + i
                  return (
                    <button
                      key={p}
                      type="button"
                      className={page === p ? 'exp-page-active' : ''}
                      onClick={() => setPage(p)}
                    >{p}</button>
                  )
                })}
                <button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && <ReportsSection summary={summary} />}

      {/* Add / Edit Form */}
      {(screen === 'add' || screen === 'edit') && (
        <ExpenseForm
          initialValues={editRecord}
          categories={categories}
          suppliers={suppliers}
          farmers={farmers}
          farms={farms}
          crops={crops}
          onClose={() => { setScreen('list'); setEditRecord(null) }}
          onSave={handleSave}
          busy={busy}
        />
      )}

      {/* View Detail */}
      {viewRecord && (
        <ViewModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onEdit={(rec) => handleEditClick(rec)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteDialog
          record={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          busy={deleteBusy}
        />
      )}

      <div className="exp-disclaimer">Expense records • Managed by AGRIMAN API</div>
    </div>
  )
}
