import React, { useEffect, useMemo, useState } from 'react'
import TableActionMenu from '../../TableActionMenu'
import './loans.css'
import { loanService } from './loanService'
import {
  LandmarkIcon,
  WalletIcon,
  ReceiptTextIcon,
  CalendarIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  CoinsIcon,
  ShieldCheckIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  PrinterIcon,
  ArrowRightIcon,
} from './LoanIcons'

// Loan Types for Indian Agricultural & Farm Operations
const LOAN_TYPES = [
  'Crop Loan (KCC)',
  'Tractor / Equipment Loan',
  'Drip Irrigation Loan',
  'Dairy / Livestock Loan',
  'Land Purchase / Development',
  'Gold Loan (Agri)',
  'Working Capital Loan',
  'Term Loan',
  'Other',
]

// Common Banks / Lenders
const COMMON_BANKS = [
  'District Cooperative Central Bank (DCCB)',
  'State Bank of India (Agri Branch)',
  'HDFC Bank (Rural Finance)',
  'Canara Bank (Kisan Credit)',
  'Nabard Primary Agri Co-op (PACS)',
  'Punjab National Bank (Rural)',
  'Bank of Baroda',
  'ICICI Bank Rural',
  'Local Microfinance / Other',
]

// Payment Modes
const PAYMENT_MODES = [
  'Bank Transfer / NEFT / RTGS',
  'Auto Debit / ECS',
  'Cash',
  'Cheque',
  'UPI',
  'Other',
]

// Repayment Frequencies
const FREQUENCIES = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Yearly'
]

// 10 Standard Loan Reports
const REPORT_TYPES = [
  { id: 'summary', name: '1. Loan Summary Report' },
  { id: 'outstanding', name: '2. Loan-wise Outstanding Report' },
  { id: 'schedule', name: '3. EMI Repayment Schedule Report' },
  { id: 'upcoming', name: '4. Upcoming EMI Report (Next 45 Days)' },
  { id: 'overdue', name: '5. Overdue Installments & Penalties Report' },
  { id: 'principal-repayment', name: '6. Principal Repayment Ledger' },
  { id: 'interest-paid', name: '7. Interest & Charges Paid Report' },
  { id: 'disbursement-history', name: '8. Loan Disbursement History' },
  { id: 'payment-history', name: '9. Complete Payment Vouchers History' },
  { id: 'closure-statement', name: '10. Loan Closure & Payoff Statements' },
]

// Financial Calculation & Formatting Helpers
function formatCurrency(val) {
  const num = Number(val) || 0
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

function parseAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (!val) return 0
  const clean = String(val).replace(/[^0-9.-]/g, '')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

function parseRate(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (!val) return 0
  const clean = String(val).replace(/[^0-9.]/g, '')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

function formatDate(val) {
  if (!val) return '—'
  const dateOnly = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`
  }
  return val
}

function todayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeEmiClient(principal, ratePercent, tenureMonths, frequency = 'Monthly') {
  const P = parseAmount(principal)
  const R = parseRate(ratePercent)
  const N = parseInt(tenureMonths, 10) || 12
  if (P <= 0 || N <= 0) return 0
  if (R <= 0) return Math.round(P / N)

  const periodsPerYear = frequency === 'Quarterly' ? 4 : frequency === 'Half-Yearly' ? 2 : frequency === 'Yearly' ? 1 : 12
  const totalPeriods = frequency === 'Quarterly' ? Math.ceil(N / 3) : frequency === 'Half-Yearly' ? Math.ceil(N / 6) : frequency === 'Yearly' ? Math.ceil(N / 12) : N
  const r = R / (100 * periodsPerYear)

  const factor = Math.pow(1 + r, totalPeriods)
  const emi = (P * r * factor) / (factor - 1)
  return Math.round(emi)
}

function normalizeLoan(raw) {
  return {
    ...raw,
    bankName: raw.bankLender || raw.bankName || '',
    sanctionAmount: Number(raw.sanctionAmount) || 0,
    disbursedAmount: Number(raw.disbursedAmount) || Number(raw.sanctionAmount) || 0,
    outstandingAmount: Number(raw.outstandingAmount !== undefined ? raw.outstandingAmount : (raw.outstandingPrincipal ?? raw.sanctionAmount)) || 0,
    outstandingPrincipal: Number(raw.outstandingPrincipal !== undefined ? raw.outstandingPrincipal : (raw.outstandingAmount ?? raw.sanctionAmount)) || 0,
    emi: Number(raw.emi || raw.emiAmount) || 0,
    startDate: raw.startDate?.slice(0, 10) || '',
    endDate: raw.endDate?.slice(0, 10) || '',
    nextEmiDueDate: raw.nextEmiDueDate?.slice(0, 10) || '',
  }
}

function normalizePayment(raw) {
  return {
    ...raw,
    id: raw.voucherNo || String(raw.paymentId || raw.id),
    paymentDate: raw.paymentDate?.slice(0, 10) || '',
    principal: Number(raw.principal) || 0,
    interest: Number(raw.interest) || 0,
    penalty: Number(raw.penalty) || 0,
    totalPayment: Number(raw.totalPayment) || 0,
  }
}

export default function Loans() {
  // Navigation Views: 'loans' | 'payments' | 'schedules' | 'disbursements' | 'reports'
  const [view, setView] = useState('loans')

  const [loans, setLoans] = useState([])
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [paymentSummary, setPaymentSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState('')
  const [toast, setToast] = useState('')

  // Modals state
  const [loanModal, setLoanModal] = useState(null) // null | { isEdit: boolean, data: object }
  const [paymentModal, setPaymentModal] = useState(null) // null | { isEdit: boolean, data: object }
  const [disbursementModal, setDisbursementModal] = useState(null) // null | { loanId: number, loanNo: string, ... }
  const [closeModal, setCloseModal] = useState(null) // null | { loan: object }
  const [viewLoanDetails, setViewLoanDetails] = useState(null) // null | detailed loan object
  const [detailTab, setDetailTab] = useState('overview') // 'overview' | 'schedule' | 'disbursements' | 'payments' | 'documents' | 'settlement'
  const [deleteConfirm, setDeleteConfirm] = useState(null) // null | { type: 'loan', item: object }

  // Schedules View state
  const [scheduleLoanNo, setScheduleLoanNo] = useState('All')
  const [activeLoanSchedule, setActiveLoanSchedule] = useState([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  // Reports View state
  const [activeReportId, setActiveReportId] = useState('summary')
  const [reportData, setReportData] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportFromDate, setReportFromDate] = useState('')
  const [reportToDate, setReportToDate] = useState('')
  const [reportBankFilter, setReportBankFilter] = useState('All')
  const [reportTypeFilter, setReportTypeFilter] = useState('All')
  const [reportStatusFilter, setReportStatusFilter] = useState('All')

  // Document Upload State
  const [uploadDocType, setUploadDocType] = useState('Sanction Letter')
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Filters for lists
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [bankFilter, setBankFilter] = useState('All')
  const [paymentModeFilter, setPaymentModeFilter] = useState('All')
  const [selectedLoanFilter, setSelectedLoanFilter] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Load Main Data
  const loadData = async () => {
    try {
      const [records, paid, totals, paidTotals] = await Promise.all([
        loanService.list(),
        loanService.payments(),
        loanService.summary(),
        loanService.paymentSummary(),
      ])
      setLoans((records || []).map(normalizeLoan))
      setPayments((paid || []).map(normalizePayment))
      setSummary(totals || null)
      setPaymentSummary(paidTotals || null)
      setApiError('')
    } catch (error) {
      console.warn('[Loans loadData notice]:', error)
      setApiError(error.friendlyMessage || error.message)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData().finally(() => setLoading(false))
  }, [])

  // Action mutation runner
  const mutate = async (action, closeCallback, successMessage) => {
    if (saving) return
    setSaving(true)
    setApiError('')
    try {
      await action()
      if (closeCallback) closeCallback()
      if (successMessage) showToast(successMessage)
      await loadData()
    } catch (error) {
      setApiError(error.friendlyMessage || error.message)
    } finally {
      setSaving(false)
    }
  }

  // Load schedule for specific loan
  const loadLoanSchedule = async (loanId) => {
    if (!loanId) return
    setLoadingSchedule(true)
    try {
      const schedule = await loanService.schedule(loanId)
      setActiveLoanSchedule(schedule || [])
    } catch (error) {
      console.error('[Error loading schedule]:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }

  // Load report data
  const loadReportData = async () => {
    setLoadingReport(true)
    try {
      const params = {}
      if (reportFromDate) params.fromDate = reportFromDate
      if (reportToDate) params.toDate = reportToDate
      if (reportBankFilter !== 'All') params.bank = reportBankFilter
      if (reportTypeFilter !== 'All') params.loanType = reportTypeFilter
      if (reportStatusFilter !== 'All') params.status = reportStatusFilter

      const data = await loanService.report(activeReportId, params)
      setReportData(data || [])
    } catch (error) {
      console.error('[Error loading report]:', error)
    } finally {
      setLoadingReport(false)
    }
  }

  useEffect(() => {
    if (view === 'reports') {
      loadReportData()
    }
  }, [view, activeReportId, reportFromDate, reportToDate, reportBankFilter, reportTypeFilter, reportStatusFilter])

  // Recalculate schedule handler
  const handleRecalculateSchedule = async (loanId) => {
    await mutate(
      () => loanService.recalculateSchedule(loanId),
      () => loadLoanSchedule(loanId),
      'Repayment schedule recalculated based on current outstanding principal.'
    )
  }

  // Reset pagination on filter or view changes
  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, typeFilter, bankFilter, paymentModeFilter, selectedLoanFilter, view])

  // Aggregate KPI Calculations
  const totalSanctioned = summary?.totalSanctioned ?? loans.reduce((acc, l) => acc + (l.sanctionAmount || 0), 0)
  const totalDisbursed = summary?.totalDisbursed ?? loans.reduce((acc, l) => acc + (l.disbursedAmount || 0), 0)
  const totalOutstanding = summary?.totalOutstanding ?? loans.reduce((acc, l) => acc + (l.outstandingPrincipal || l.outstandingAmount || 0), 0)
  const activeLoansCount = summary?.activeLoans ?? loans.filter(l => l.status === 'Active').length
  const totalLoansCount = summary?.totalLoans ?? loans.length

  const totalAmountPaid = paymentSummary?.totalAmountPaid ?? payments.reduce((acc, p) => acc + (p.totalPayment || 0), 0)
  const totalPrincipalPaid = paymentSummary?.principalReductions ?? payments.reduce((acc, p) => acc + (p.principal || 0), 0)
  const totalInterestPaid = paymentSummary?.interestAndCharges ?? payments.reduce((acc, p) => acc + (p.interest + p.penalty || 0), 0)
  const upcomingPaymentsCount = summary?.upcomingPaymentsCount ?? 0
  const overdueInstallmentsCount = summary?.overdueInstallmentsCount ?? 0

  const totalRepaidPct = totalSanctioned > 0 ? (totalPrincipalPaid / totalSanctioned) * 100 : 0

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    const q = query.trim().toLowerCase()
    return loans.filter((loan) => {
      const matchText = !q ||
        loan.loanNo.toLowerCase().includes(q) ||
        (loan.loanAccountNo && loan.loanAccountNo.toLowerCase().includes(q)) ||
        loan.bankName.toLowerCase().includes(q) ||
        loan.loanType.toLowerCase().includes(q) ||
        (loan.remarks && loan.remarks.toLowerCase().includes(q))

      const matchStatus = statusFilter === 'All' || loan.status === statusFilter
      const matchType = typeFilter === 'All' || loan.loanType === typeFilter
      const matchBank = bankFilter === 'All' || loan.bankName === bankFilter
      return matchText && matchStatus && matchType && matchBank
    })
  }, [loans, query, statusFilter, typeFilter, bankFilter])

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter((p) => {
      const matchText = !q ||
        p.loanNo.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.paymentMode.toLowerCase().includes(q) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(q)) ||
        (p.remarks && p.remarks.toLowerCase().includes(q))

      const matchMode = paymentModeFilter === 'All' || p.paymentMode === paymentModeFilter
      const matchLoan = selectedLoanFilter === 'All' || p.loanNo === selectedLoanFilter
      return matchText && matchMode && matchLoan
    })
  }, [payments, query, paymentModeFilter, selectedLoanFilter])

  // Disbursements flattened list
  const allDisbursements = useMemo(() => {
    const list = []
    loans.forEach(l => {
      if (l.disbursements && l.disbursements.length > 0) {
        l.disbursements.forEach(d => {
          list.push({ ...d, loanNo: l.loanNo, bankName: l.bankName, loanType: l.loanType })
        })
      } else if (l.disbursedAmount > 0) {
        list.push({
          id: `DSB-${l.loanId}-INIT`,
          disbursementNo: `DSB-${l.startDate ? l.startDate.slice(0, 4) : '2026'}-001`,
          disbursementDate: l.startDate,
          disbursedAmount: l.disbursedAmount,
          bankAccount: l.bankName,
          referenceNo: 'INITIAL-DISBURSAL',
          remarks: 'Initial loan sanction disbursement',
          loanNo: l.loanNo,
          bankName: l.bankName,
          loanType: l.loanType
        })
      }
    })
    return list.sort((a, b) => new Date(b.disbursementDate) - new Date(a.disbursementDate))
  }, [loans])

  // Pagination for Active View
  const activeList = view === 'loans' ? filteredLoans : (view === 'payments' ? filteredPayments : (view === 'disbursements' ? allDisbursements : []))
  const pageCount = Math.max(1, Math.ceil(activeList.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRecords = activeList.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Open Add Loan
  const handleOpenAddLoan = () => {
    const nextNum = Math.max(0, ...loans.map((loan) => Number(loan.loanNo.split('-').at(-1)) || 0)) + 1
    const generatedCode = `LOAN-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`
    setLoanModal({
      isEdit: false,
      data: {
        loanNo: generatedCode,
        loanAccountNo: '',
        bankName: '',
        loanType: 'Crop Loan (KCC)',
        loanPurpose: 'Seasonal agricultural cultivation & farm inputs financing',
        sanctionAmount: '',
        disbursedAmount: '',
        interestRate: '7.0',
        interestType: 'Fixed',
        tenureMonths: 12,
        repaymentFrequency: 'Monthly',
        startDate: todayDate(),
        endDate: '',
        emi: '',
        outstandingAmount: '',
        processingFees: '0',
        status: 'Active',
        remarks: '',
      },
    })
  }

  // Open Edit Loan
  const handleOpenEditLoan = (loan) => {
    setLoanModal({
      isEdit: true,
      data: {
        ...loan,
        bankName: loan.bankName || loan.bankLender,
        tenureMonths: loan.tenureMonths || 12,
        repaymentFrequency: loan.repaymentFrequency || 'Monthly',
        interestType: loan.interestType || 'Fixed',
      },
    })
  }

  // Save Loan
  const handleSaveLoan = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const sanction = parseAmount(formData.get('sanctionAmount'))
    if (sanction <= 0) {
      alert('Please enter a valid sanction amount greater than ₹0.')
      return
    }

    const rate = parseRate(formData.get('interestRate'))
    const tenure = parseInt(formData.get('tenureMonths'), 10) || 12
    const frequency = formData.get('repaymentFrequency') || 'Monthly'
    const disbursed = formData.get('disbursedAmount') !== '' ? parseAmount(formData.get('disbursedAmount')) : sanction

    if (disbursed > sanction) {
      alert('Disbursed amount cannot exceed the sanctioned amount without an authorized revision.')
      return
    }

    const calculatedEmi = computeEmiClient(disbursed, rate, tenure, frequency)
    const emiVal = formData.get('emi') !== '' ? parseAmount(formData.get('emi')) : calculatedEmi

    const startDate = formData.get('startDate') || todayDate()
    const calcEndDate = new Date(startDate)
    calcEndDate.setMonth(calcEndDate.getMonth() + tenure)
    const endDateStr = formData.get('endDate') || calcEndDate.toISOString().slice(0, 10)

    const outVal = formData.get('outstandingAmount') !== '' ? parseAmount(formData.get('outstandingAmount')) : disbursed

    const newLoanObj = {
      loanNo: formData.get('loanNo')?.trim() || `LOAN-${Date.now().toString().slice(-4)}`,
      loanAccountNo: formData.get('loanAccountNo')?.trim() || '',
      bankName: formData.get('bankName')?.trim() || 'Cooperative Bank',
      loanType: formData.get('loanType') || 'Crop Loan (KCC)',
      loanPurpose: formData.get('loanPurpose')?.trim() || '',
      sanctionAmount: sanction,
      disbursedAmount: disbursed,
      interestRate: rate,
      interestType: formData.get('interestType') || 'Fixed',
      tenureMonths: tenure,
      repaymentFrequency: frequency,
      startDate,
      endDate: endDateStr,
      emi: emiVal,
      outstandingAmount: outVal,
      processingFees: parseAmount(formData.get('processingFees')),
      status: outVal <= 0 ? 'Closed' : (formData.get('status') || 'Active'),
      remarks: formData.get('remarks')?.trim() || '',
    }

    if (!loanModal.isEdit && loans.some((l) => l.loanNo === newLoanObj.loanNo)) {
      setApiError('This loan number already exists.')
      return
    }

    mutate(
      () => loanService.save(newLoanObj, loanModal.isEdit ? loanModal.data.loanId : undefined),
      () => setLoanModal(null),
      `Loan ${newLoanObj.loanNo} successfully saved with complete amortization schedule.`
    )
  }

  // Delete Loan Safe Handler
  const handleDeleteLoan = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'loan') return
    const target = deleteConfirm.item
    mutate(
      () => loanService.remove(target.loanId),
      () => setDeleteConfirm(null),
      `Loan ${target.loanNo} deleted.`
    )
  }

  // Open Payment Modal
  const handleOpenAddPayment = (preselectedLoanNo = '', installmentNo = null) => {
    const nextPayId = `VCH-LN-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`
    const defaultLoan = preselectedLoanNo || (loans.find((l) => l.status === 'Active')?.loanNo || loans[0]?.loanNo || '')
    const targetLoan = loans.find((l) => l.loanNo === defaultLoan)

    let defPrincipal = ''
    let defInterest = ''
    let defEmi = targetLoan?.emi || 0

    if (targetLoan && targetLoan.emi > 0) {
      const monthlyRate = (targetLoan.interestRate / 100) / 12
      const estInterest = Math.round((targetLoan.outstandingPrincipal || targetLoan.sanctionAmount) * monthlyRate)
      defInterest = Math.min(targetLoan.emi, estInterest)
      defPrincipal = Math.max(0, targetLoan.emi - defInterest)
    }

    setPaymentModal({
      isEdit: false,
      data: {
        voucherNo: nextPayId,
        loanNo: defaultLoan,
        installmentNumber: installmentNo,
        paymentDate: todayDate(),
        principal: defPrincipal,
        interest: defInterest,
        penalty: 0,
        totalPayment: defEmi,
        paymentMode: 'Bank Transfer / NEFT / RTGS',
        referenceNo: '',
        remarks: '',
        paymentType: 'Regular EMI',
      },
    })
  }

  // Save Payment
  const handleSavePayment = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const loanNo = formData.get('loanNo')
    const principal = parseAmount(formData.get('principal'))
    const interest = parseAmount(formData.get('interest'))
    const penalty = parseAmount(formData.get('penalty'))
    const totalPayment = principal + interest + penalty

    if (totalPayment <= 0) {
      alert('Total payment amount must be greater than ₹0.')
      return
    }

    const targetLoan = loans.find((l) => l.loanNo === loanNo)
    if (!targetLoan) {
      alert('Selected loan was not found.')
      return
    }

    if (principal > (targetLoan.outstandingPrincipal || targetLoan.outstandingAmount)) {
      alert(`Principal payment (₹${principal.toLocaleString('en-IN')}) cannot exceed the current outstanding principal (₹${(targetLoan.outstandingPrincipal || targetLoan.outstandingAmount).toLocaleString('en-IN')}).`)
      return
    }

    const paymentObj = {
      voucherNo: formData.get('voucherNo')?.trim() || `VCH-LN-${Date.now().toString().slice(-4)}`,
      loanNo,
      installmentNumber: formData.get('installmentNumber') ? parseInt(formData.get('installmentNumber'), 10) : undefined,
      paymentDate: formData.get('paymentDate') || todayDate(),
      principal,
      interest,
      penalty,
      totalPayment,
      paymentMode: formData.get('paymentMode') || 'Bank Transfer / NEFT / RTGS',
      referenceNo: formData.get('referenceNo')?.trim() || '',
      remarks: formData.get('remarks')?.trim() || '',
      paymentType: formData.get('paymentType') || 'Regular EMI',
    }

    mutate(
      () => loanService.recordPayment(targetLoan.loanId, paymentObj),
      () => setPaymentModal(null),
      `Payment voucher ${paymentObj.voucherNo} recorded for loan ${loanNo}.`
    )
  }

  // Open Disbursement Modal
  const handleOpenDisbursement = (loan) => {
    const nextDsbNo = `DSB-${new Date().getFullYear()}-${String((loan.disbursementsCount || 0) + 1).padStart(3, '0')}`
    const availableToDisburse = Math.max(0, loan.sanctionAmount - (loan.disbursedAmount || 0))

    setDisbursementModal({
      loanId: loan.loanId,
      loanNo: loan.loanNo,
      bankName: loan.bankName,
      sanctionAmount: loan.sanctionAmount,
      disbursedAmount: loan.disbursedAmount,
      availableToDisburse,
      disbursementNo: nextDsbNo,
      disbursementDate: todayDate(),
      amount: availableToDisburse,
      bankAccount: loan.bankName,
      referenceNo: '',
      remarks: 'Subsequent tranche disbursement for crop operation',
    })
  }

  // Save Disbursement
  const handleSaveDisbursement = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const amount = parseAmount(formData.get('disbursedAmount'))
    if (amount <= 0) {
      alert('Please enter a valid disbursement amount.')
      return
    }

    if (amount > disbursementModal.availableToDisburse) {
      alert(`Disbursement amount (₹${amount.toLocaleString('en-IN')}) exceeds remaining sanctioned limit (₹${disbursementModal.availableToDisburse.toLocaleString('en-IN')}).`)
      return
    }

    const dsbObj = {
      disbursementNo: formData.get('disbursementNo')?.trim(),
      disbursementDate: formData.get('disbursementDate') || todayDate(),
      disbursedAmount: amount,
      bankAccount: formData.get('bankAccount')?.trim() || disbursementModal.bankName,
      referenceNo: formData.get('referenceNo')?.trim() || '',
      remarks: formData.get('remarks')?.trim() || '',
    }

    mutate(
      () => loanService.recordDisbursement(disbursementModal.loanId, dsbObj),
      () => setDisbursementModal(null),
      `Disbursement ${dsbObj.disbursementNo} of ${formatCurrency(amount)} recorded.`
    )
  }

  // Open Loan Closure Modal
  const handleOpenCloseLoan = (loan) => {
    setCloseModal({
      loan,
      closedDate: todayDate(),
      settlementAmount: loan.outstandingPrincipal || loan.outstandingAmount || 0,
      paymentMode: 'Bank Transfer / NEFT / RTGS',
      referenceNo: '',
      remarks: 'Full loan payoff, settlement and account closure',
    })
  }

  // Save Loan Closure
  const handleSaveCloseLoan = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    const closureObj = {
      closedDate: formData.get('closedDate') || todayDate(),
      finalSettlementAmount: parseAmount(formData.get('finalSettlementAmount')),
      paymentMode: formData.get('paymentMode') || 'Bank Transfer / NEFT / RTGS',
      referenceNo: formData.get('referenceNo')?.trim() || 'NOC-SETTLEMENT',
      remarks: formData.get('remarks')?.trim() || 'Loan closed in full.',
      closureCertificateUrl: formData.get('closureCertificateUrl')?.trim() || '',
    }

    mutate(
      () => loanService.closeLoan(closeModal.loan.loanId, closureObj),
      () => setCloseModal(null),
      `Loan ${closeModal.loan.loanNo} successfully settled and marked as Closed.`
    )
  }

  // Open Full Loan Details
  const openLoanDetails = async (loan) => {
    try {
      const detailed = await loanService.detail(loan.loanId)
      setViewLoanDetails(normalizeLoan(detailed))
      setDetailTab('overview')
    } catch (error) {
      setApiError(error.friendlyMessage || error.message)
    }
  }

  // Document Upload Handler
  const handleUploadDoc = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !viewLoanDetails) return
    setUploadingDoc(true)
    try {
      await loanService.uploadDocument(viewLoanDetails.loanId, file, uploadDocType)
      showToast(`Document "${file.name}" uploaded successfully.`)
      // Refresh details
      const detailed = await loanService.detail(viewLoanDetails.loanId)
      setViewLoanDetails(normalizeLoan(detailed))
    } catch (err) {
      alert(err.friendlyMessage || err.message)
    } finally {
      setUploadingDoc(false)
    }
  }

  // Export Report to CSV / Excel
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data available to export for this report.')
      return
    }

    const keys = Object.keys(reportData[0])
    const headerRow = keys.join(',')
    const dataRows = reportData.map(row => {
      return keys.map(k => {
        let val = row[k] ?? ''
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`
        return val
      }).join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AGRIMAN_Loan_Report_${activeReportId}_${todayDate()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="users-page finance-screen" aria-busy={loading || saving}>
      {/* Toast Notification */}
      {toast && (
        <div className="user-toast" role="status">
          <CheckCircleIcon size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* API / Network Alert Banner */}
      {apiError && (
        <div role="alert" style={{ color: '#b91c1c', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <strong>Notice:</strong> {apiError}
          </div>
          <button
            type="button"
            className="loan-btn-action"
            disabled={loading || saving}
            onClick={async () => {
              setLoading(true)
              await loadData()
              setLoading(false)
            }}
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* 1. Title Row */}
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            FINANCE <span>/</span> LOANS &amp; LIABILITIES MODULE
          </div>
          <h1>Loan &amp; Finance Management</h1>
          <p>Complete enterprise agricultural credit, multi-tranche disbursements, repayment schedules, and debt liabilities.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {view === 'loans' && (
            <button className="users-add" type="button" onClick={handleOpenAddLoan} disabled={loading || saving}>
              <PlusIcon size={16} /> Add New Loan
            </button>
          )}
          {view === 'payments' && (
            <button className="users-add" type="button" onClick={() => handleOpenAddPayment()} disabled={loading || saving || !loans.length}>
              <PlusIcon size={16} /> Record Loan Payment
            </button>
          )}
          {view === 'disbursements' && (
            <button className="users-add" type="button" onClick={() => loans.length && handleOpenDisbursement(loans[0])} disabled={loading || saving || !loans.length}>
              <PlusIcon size={16} /> Record Disbursement
            </button>
          )}
          {view === 'reports' && (
            <button className="loan-export-btn" type="button" onClick={handleExportCSV}>
              <DownloadIcon size={15} /> Export Report (CSV)
            </button>
          )}
        </div>
      </div>

      {/* 2. Top-Level Module Sub-Navigation Switch */}
      <div className="finance-view-switch">
        <button
          className={view === 'loans' ? 'selected' : ''}
          type="button"
          onClick={() => setView('loans')}
        >
          <LandmarkIcon size={15} />
          Loan Registry
          <span className="tab-count">{loans.length}</span>
        </button>

        <button
          className={view === 'payments' ? 'selected' : ''}
          type="button"
          onClick={() => setView('payments')}
        >
          <ReceiptTextIcon size={15} />
          Payment Vouchers
          <span className="tab-count">{payments.length}</span>
        </button>

        <button
          className={view === 'schedules' ? 'selected' : ''}
          type="button"
          onClick={() => {
            setView('schedules')
            if (loans.length > 0 && (!activeLoanSchedule || activeLoanSchedule.length === 0)) {
              setScheduleLoanNo(loans[0].loanNo)
              loadLoanSchedule(loans[0].loanId)
            }
          }}
        >
          <CalendarIcon size={15} />
          Repayment Schedules
        </button>

        <button
          className={view === 'disbursements' ? 'selected' : ''}
          type="button"
          onClick={() => setView('disbursements')}
        >
          <CoinsIcon size={15} />
          Disbursements
          <span className="tab-count">{allDisbursements.length}</span>
        </button>

        <button
          className={view === 'reports' ? 'selected' : ''}
          type="button"
          onClick={() => setView('reports')}
        >
          <FileTextIcon size={15} />
          Loan Reports &amp; Analytics
        </button>
      </div>

      {/* 3. Overview KPI Summary Cards (Real Backend Figures) */}
      <div className="loan-stats-grid">
        {view === 'payments' ? (
          <>
            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-green">
                <ReceiptTextIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Total Payments</small>
                <strong>{paymentSummary?.totalPaymentsCount ?? payments.length} Vouchers</strong>
                <span>Recorded EMI payments</span>
              </div>
            </div>

            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-blue">
                <WalletIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Total Amount Paid</small>
                <strong>{formatCurrency(totalAmountPaid)}</strong>
                <span>Cumulative cash outflow</span>
              </div>
            </div>

            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-purple">
                <CoinsIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Principal Reductions</small>
                <strong>{formatCurrency(totalPrincipalPaid)}</strong>
                <span>Direct liability relief</span>
              </div>
            </div>

            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-amber">
                <LandmarkIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Interest &amp; Charges</small>
                <strong>{formatCurrency(totalInterestPaid)}</strong>
                <span>Financing cost paid</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-green">
                <LandmarkIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Active Loans</small>
                <strong>{activeLoansCount} of {totalLoansCount}</strong>
                <span>Active debt facilities</span>
              </div>
            </div>

            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-blue">
                <CoinsIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Total Disbursed</small>
                <strong>{formatCurrency(totalDisbursed)}</strong>
                <span>Sanctioned: {formatCurrency(totalSanctioned)}</span>
              </div>
            </div>

            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-amber">
                <WalletIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Total Outstanding</small>
                <strong>{formatCurrency(totalOutstanding)}</strong>
                <span>Unpaid principal liability</span>
              </div>
            </div>

            <div className="loan-stat-card">
              <div className="loan-stat-icon loan-icon-purple">
                <CheckCircleIcon size={20} />
              </div>
              <div className="loan-stat-info">
                <small>Principal Repaid</small>
                <strong>{formatCurrency(totalPrincipalPaid)}</strong>
                <span>{totalRepaidPct.toFixed(1)}% of sanctioned repaid</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. MAIN PANEL CONTENT BY VIEW */}

      {/* VIEW A: LOANS REGISTRY */}
      {view === 'loans' && (
        <div className="users-panel">
          {/* Toolbar & Filters */}
          <div className="users-toolbar">
            <div className="user-search">
              <SearchIcon size={16} />
              <input
                type="text"
                placeholder="Search by loan no, account no, bank / lender, loan type..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Loan Types</option>
              {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)}>
              <option value="All">All Lenders</option>
              {Array.from(new Set(loans.map(l => l.bankName).filter(Boolean))).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {(query || statusFilter !== 'All' || typeFilter !== 'All' || bankFilter !== 'All') && (
              <button
                type="button"
                className="reset-button"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('All')
                  setTypeFilter('All')
                  setBankFilter('All')
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>LOAN NO</th>
                  <th>BANK / LENDER</th>
                  <th>LOAN TYPE</th>
                  <th>SANCTIONED</th>
                  <th>DISBURSED</th>
                  <th>INTEREST</th>
                  <th>TENURE</th>
                  <th>EMI</th>
                  <th>OUTSTANDING</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right', paddingRight: '16px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>
                        <LandmarkIcon size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                        <strong>No loan records found</strong>
                        <p style={{ margin: '4px 0 12px', fontSize: '11.5px' }}>Register a new loan or adjust your search filter criteria.</p>
                        <button type="button" className="loan-btn-action" onClick={handleOpenAddLoan}>
                          <PlusIcon size={14} /> Register New Loan
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((loan) => (
                    <tr key={loan.loanId}>
                      <td>
                        <span className="loan-code-chip">{loan.loanNo}</span>
                        {loan.loanAccountNo && (
                          <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                            A/c: {loan.loanAccountNo}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ display: 'block', fontSize: '12px' }}>{loan.bankName}</strong>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Start: {formatDate(loan.startDate)}</span>
                      </td>
                      <td>
                        <span className="loan-type-pill">{loan.loanType}</span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '12.5px' }}>{formatCurrency(loan.sanctionAmount)}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                          {formatCurrency(loan.disbursedAmount)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{loan.interestRate}%</span>
                        <small style={{ display: 'block', fontSize: '9px', color: '#64748b' }}>{loan.interestType}</small>
                      </td>
                      <td>
                        <span>{loan.tenureMonths} Mo</span>
                        <small style={{ display: 'block', fontSize: '9px', color: '#64748b' }}>{loan.repaymentFrequency}</small>
                      </td>
                      <td>
                        <strong>{formatCurrency(loan.emi)}</strong>
                        {loan.nextEmiDueDate && (
                          <small style={{ display: 'block', fontSize: '9px', color: '#b45309' }}>
                            Due: {formatDate(loan.nextEmiDueDate)}
                          </small>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: (loan.outstandingPrincipal || loan.outstandingAmount) > 0 ? '#b45309' : '#15803d', fontSize: '13px' }}>
                          {formatCurrency(loan.outstandingPrincipal || loan.outstandingAmount)}
                        </strong>
                        <div className="loan-progress-wrap" style={{ marginTop: '3px' }}>
                          <div className="loan-progress-bar">
                            <div
                              className="loan-progress-fill"
                              style={{ width: `${Math.min(100, loan.sanctionAmount > 0 ? ((loan.sanctionAmount - (loan.outstandingPrincipal || loan.outstandingAmount)) / loan.sanctionAmount) * 100 : 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`loan-status-badge loan-status-${(loan.status || 'Active').toLowerCase()}`}>
                          <i />
                          {loan.status || 'Active'}
                        </span>
                      </td>
<td style={{ textAlign: 'center' }}>
                        <div className="loan-actions-cell" style={{ justifyContent: 'center' }}>
                          <TableActionMenu
                            items={[
                              {
                                label: 'View Details',
                                icon: 'view',
                                onClick: () => openLoanDetails(loan),
                              },
                              loan.status !== 'Closed' ? {
                                label: 'Record Payment',
                                icon: 'pay',
                                onClick: () => handleOpenAddPayment(loan.loanNo),
                              } : null,
                              loan.status !== 'Closed' && loan.disbursedAmount < loan.sanctionAmount ? {
                                label: 'Disburse Funds',
                                icon: <CoinsIcon size={14} />,
                                onClick: () => handleOpenDisbursement(loan),
                              } : null,
                              loan.status !== 'Closed' ? {
                                label: 'Settle & Close',
                                icon: <ShieldCheckIcon size={14} />,
                                onClick: () => handleOpenCloseLoan(loan),
                              } : null,
                              {
                                label: 'Edit Loan',
                                icon: 'edit',
                                onClick: () => handleOpenEditLoan(loan),
                              },
                              {
                                label: 'Delete Loan',
                                icon: 'delete',
                                danger: true,
                                onClick: () => setDeleteConfirm({ type: 'loan', item: loan }),
                              },
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

          {/* Footer Pagination */}
          <div className="users-table-footer">
            <span className="users-counter">
              Showing {activeList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, activeList.length)} of {activeList.length} loans
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i + 1}
                  className={`users-page-button ${currentPage === i + 1 ? 'active' : ''}`}
                  type="button"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: PAYMENT VOUCHERS */}
      {view === 'payments' && (
        <div className="users-panel">
          <div className="users-toolbar">
            <div className="user-search">
              <SearchIcon size={16} />
              <input
                type="text"
                placeholder="Search by voucher no, loan no, payment mode, reference..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <select value={selectedLoanFilter} onChange={(e) => setSelectedLoanFilter(e.target.value)}>
              <option value="All">All Loan Numbers</option>
              {loans.map(l => <option key={l.loanNo} value={l.loanNo}>{l.loanNo} - {l.bankName}</option>)}
            </select>

            <select value={paymentModeFilter} onChange={(e) => setPaymentModeFilter(e.target.value)}>
              <option value="All">All Payment Modes</option>
              {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {(query || selectedLoanFilter !== 'All' || paymentModeFilter !== 'All') && (
              <button
                type="button"
                className="reset-button"
                onClick={() => {
                  setQuery('')
                  setSelectedLoanFilter('All')
                  setPaymentModeFilter('All')
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>VOUCHER NO</th>
                  <th>LOAN NO</th>
                  <th>PAYMENT DATE</th>
                  <th>TYPE</th>
                  <th>INST #</th>
                  <th style={{ textAlign: 'right' }}>PRINCIPAL</th>
                  <th style={{ textAlign: 'right' }}>INTEREST</th>
                  <th style={{ textAlign: 'right' }}>PENALTY</th>
                  <th style={{ textAlign: 'right' }}>TOTAL PAID</th>
                  <th>PAYMENT MODE</th>
                  <th>REFERENCE NO</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
{pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>
                        <ReceiptTextIcon size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                        <strong>No loan payments recorded</strong>
                        <p style={{ margin: '4px 0 12px', fontSize: '11.5px' }}>Record a new installment or loan settlement payment voucher.</p>
                        <button type="button" className="loan-btn-action" onClick={() => handleOpenAddPayment()} disabled={!loans.length}>
                          <PlusIcon size={14} /> Record Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="loan-code-chip">{p.voucherNo || p.id}</span>
                      </td>
                      <td>
                        <strong>{p.loanNo}</strong>
                        {p.bankName && <small style={{ display: 'block', color: '#64748b', fontSize: '9.5px' }}>{p.bankName}</small>}
                      </td>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td>
                        <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {p.paymentType || 'Regular EMI'}
                        </span>
                      </td>
                      <td>{p.installmentNumber ? `#${p.installmentNumber}` : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                        {formatCurrency(p.principal)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#b45309' }}>
                        {formatCurrency(p.interest)}
                      </td>
                      <td style={{ textAlign: 'right', color: p.penalty > 0 ? '#dc2626' : '#64748b' }}>
                        {formatCurrency(p.penalty)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '12.5px' }}>
                        {formatCurrency(p.totalPayment)}
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: '#334155' }}>{p.paymentMode}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{p.referenceNo || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>{p.remarks || '—'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="users-table-footer">
            <span className="users-counter">
              Showing {activeList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, activeList.length)} of {activeList.length} vouchers
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i + 1}
                  className={`users-page-button ${currentPage === i + 1 ? 'active' : ''}`}
                  type="button"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: REPAYMENT SCHEDULES */}
      {view === 'schedules' && (
        <div className="users-panel">
          <div className="users-toolbar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Select Farm Loan:</label>
              <select
                value={scheduleLoanNo}
                onChange={(e) => {
                  setScheduleLoanNo(e.target.value)
                  const target = loans.find(l => l.loanNo === e.target.value)
                  if (target) loadLoanSchedule(target.loanId)
                }}
                style={{ height: '36px', minWidth: '220px' }}
              >
                {loans.map(l => (
                  <option key={l.loanNo} value={l.loanNo}>
                    {l.loanNo} – {l.bankName} (Bal: {formatCurrency(l.outstandingPrincipal || l.outstandingAmount)})
                  </option>
                ))}
              </select>
            </div>

            {scheduleLoanNo && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="loan-btn-action"
                  onClick={() => {
                    const target = loans.find(l => l.loanNo === scheduleLoanNo)
                    if (target) handleRecalculateSchedule(target.loanId)
                  }}
                >
                  Recalculate Schedule
                </button>
                <button
                  type="button"
                  className="loan-btn-action loan-btn-pay"
                  onClick={() => handleOpenAddPayment(scheduleLoanNo)}
                >
                  <ReceiptTextIcon size={14} /> Record Payment
                </button>
              </div>
            )}
          </div>

          {/* Schedule Table */}
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>INST #</th>
                  <th>DUE DATE</th>
                  <th style={{ textAlign: 'right' }}>OPENING PRINCIPAL</th>
                  <th style={{ textAlign: 'right' }}>PRINCIPAL</th>
                  <th style={{ textAlign: 'right' }}>INTEREST</th>
                  <th style={{ textAlign: 'right' }}>SCHEDULED EMI</th>
                  <th style={{ textAlign: 'right' }}>PAID AMOUNT</th>
                  <th style={{ textAlign: 'right' }}>REMAINING</th>
                  <th style={{ textAlign: 'right' }}>CLOSING PRINCIPAL</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loadingSchedule ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '32px' }}>Loading repayment schedule...</td>
                  </tr>
                ) : activeLoanSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <CalendarIcon size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                      <strong>No schedule generated yet</strong>
                      <p style={{ margin: '4px 0 12px', fontSize: '11.5px' }}>Click below to generate the standard amortization schedule for this loan.</p>
                      <button
                        type="button"
                        className="loan-btn-action"
                        onClick={() => {
                          const target = loans.find(l => l.loanNo === scheduleLoanNo)
                          if (target) handleRecalculateSchedule(target.loanId)
                        }}
                      >
                        Generate Amortization Schedule
                      </button>
                    </td>
                  </tr>
                ) : (
                  activeLoanSchedule.map((inst) => (
                    <tr key={inst.id || inst.installmentNumber}>
                      <td style={{ fontWeight: 700 }}>#{inst.installmentNumber}</td>
                      <td>{formatDate(inst.dueDate)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(inst.openingPrincipal)}</td>
                      <td style={{ textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{formatCurrency(inst.principalAmount)}</td>
                      <td style={{ textAlign: 'right', color: '#b45309' }}>{formatCurrency(inst.interestAmount)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 750 }}>{formatCurrency(inst.emiAmount)}</td>
                      <td style={{ textAlign: 'right', color: '#2563eb' }}>{formatCurrency(inst.paidAmount)}</td>
                      <td style={{ textAlign: 'right', color: inst.remainingAmount > 0 ? '#dc2626' : '#15803d', fontWeight: 600 }}>
                        {formatCurrency(inst.remainingAmount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(inst.closingPrincipal)}</td>
                      <td>
                        <span className={`inst-pill ${(inst.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                          {inst.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {inst.status !== 'Paid' && (
                          <button
                            type="button"
                            className="loan-btn-action loan-btn-pay"
                            style={{ padding: '2px 6px', fontSize: '9.5px' }}
                            onClick={() => handleOpenAddPayment(scheduleLoanNo, inst.installmentNumber)}
                          >
                            Pay Inst #{inst.installmentNumber}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW D: DISBURSEMENTS */}
      {view === 'disbursements' && (
        <div className="users-panel">
          <div className="users-toolbar">
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>Multi-Tranche Loan Disbursements</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Track all credit tranches drawn against sanctioned agricultural facilities.
            </span>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>DISBURSEMENT NO</th>
                  <th>LOAN NO</th>
                  <th>LENDER</th>
                  <th>FACILITY TYPE</th>
                  <th>DISBURSEMENT DATE</th>
                  <th style={{ textAlign: 'right' }}>DISBURSED AMOUNT</th>
                  <th>BANK ACCOUNT</th>
                  <th>REFERENCE NO</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px' }}>
                      <CoinsIcon size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                      <strong>No disbursements recorded</strong>
                      <p style={{ margin: '4px 0 12px', fontSize: '11.5px' }}>Record a new loan tranche disbursement.</p>
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td>
                        <span className="loan-code-chip">{d.disbursementNo}</span>
                      </td>
                      <td><strong>{d.loanNo}</strong></td>
                      <td>{d.bankName}</td>
                      <td><span className="loan-type-pill">{d.loanType}</span></td>
                      <td>{formatDate(d.disbursementDate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb', fontSize: '12.5px' }}>
                        {formatCurrency(d.disbursedAmount)}
                      </td>
                      <td>{d.bankAccount || '—'}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>{d.referenceNo || '—'}</span></td>
                      <td><span style={{ fontSize: '10.5px', color: '#64748b' }}>{d.remarks || '—'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="users-table-footer">
            <span className="users-counter">
              Showing {activeList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, activeList.length)} of {activeList.length} disbursements
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i + 1}
                  className={`users-page-button ${currentPage === i + 1 ? 'active' : ''}`}
                  type="button"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW E: LOAN REPORTS & STATEMENTS */}
      {view === 'reports' && (
        <div className="users-panel">
          <div className="loan-reports-toolbar">
            <div className="loan-reports-filters">
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Report:</label>
              <select
                value={activeReportId}
                onChange={(e) => setActiveReportId(e.target.value)}
                style={{ height: '34px', minWidth: '240px', fontWeight: 600 }}
              >
                {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <label style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>From:</label>
              <input
                type="date"
                value={reportFromDate}
                onChange={(e) => setReportFromDate(e.target.value)}
                style={{ height: '34px', padding: '0 8px', fontSize: '11px' }}
              />

              <label style={{ fontSize: '11px', color: '#64748b' }}>To:</label>
              <input
                type="date"
                value={reportToDate}
                onChange={(e) => setReportToDate(e.target.value)}
                style={{ height: '34px', padding: '0 8px', fontSize: '11px' }}
              />

              <select
                value={reportBankFilter}
                onChange={(e) => setReportBankFilter(e.target.value)}
                style={{ height: '34px' }}
              >
                <option value="All">All Lenders</option>
                {Array.from(new Set(loans.map(l => l.bankName).filter(Boolean))).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="loan-reports-actions">
              <button type="button" className="loan-export-btn" onClick={handleExportCSV}>
                <DownloadIcon size={14} /> Export CSV / Excel
              </button>
              <button type="button" className="loan-print-btn" onClick={() => window.print()}>
                <PrinterIcon size={14} /> Print Statement
              </button>
            </div>
          </div>

          {/* Render Active Report Data Table */}
          <div className="users-table-wrap">
            {loadingReport ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Generating report data...</div>
            ) : reportData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                <FileTextIcon size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                <strong>No records found for the selected report filters</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px' }}>Adjust your date range or filter criteria above.</p>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    {Object.keys(reportData[0]).map(col => (
                      <th key={col}>{col.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Object.keys(row).map(col => {
                        const val = row[col]
                        const isDate = typeof val === 'string' && val.includes('T') && val.length >= 10
                        const isAmount = typeof val === 'number' && (col.toLowerCase().includes('amount') || col.toLowerCase().includes('principal') || col.toLowerCase().includes('interest') || col.toLowerCase().includes('paid') || col.toLowerCase().includes('emi'))
                        return (
                          <td key={col}>
                            {isDate ? formatDate(val) : (isAmount ? formatCurrency(val) : String(val ?? '—'))}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT LOAN                                                  */}
      {/* ========================================================================= */}
      {loanModal && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setLoanModal(null)}>
          <div className="user-modal user-modal-card" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h2>{loanModal.isEdit ? 'Edit Loan Facility' : 'Register New Farm Loan'}</h2>
                <p>Configure sanction credit terms, interest calculation method, and repayment schedule.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setLoanModal(null)}>×</button>
            </div>

            <form onSubmit={handleSaveLoan}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="form-section">
                  <h3>1. BASIC LOAN &amp; LENDER IDENTIFICATION</h3>
                  <div className="form-grid">
                    <label>
                      Loan Number <em>*</em>
                      <input
                        type="text"
                        name="loanNo"
                        defaultValue={loanModal.data.loanNo}
                        required
                        placeholder="e.g. LOAN-2026-001"
                      />
                    </label>

                    <label>
                      Loan Account Number (Bank)
                      <input
                        type="text"
                        name="loanAccountNo"
                        defaultValue={loanModal.data.loanAccountNo}
                        placeholder="e.g. A/C 984501238475"
                      />
                    </label>

                    <label>
                      Bank / Lending Institution <em>*</em>
                      <input
                        list="bank-suggestions"
                        type="text"
                        name="bankName"
                        defaultValue={loanModal.data.bankName}
                        required
                        placeholder="e.g. District Cooperative Central Bank"
                      />
                      <datalist id="bank-suggestions">
                        {COMMON_BANKS.map(b => <option key={b} value={b} />)}
                      </datalist>
                    </label>

                    <label>
                      Loan Type <em>*</em>
                      <select name="loanType" defaultValue={loanModal.data.loanType}>
                        {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h3>2. CREDIT AMOUNTS, TENURE &amp; INTEREST TERMS</h3>
                  <div className="form-grid">
                    <label>
                      Sanctioned Amount (₹) <em>*</em>
                      <input
                        type="number"
                        step="0.01"
                        name="sanctionAmount"
                        defaultValue={loanModal.data.sanctionAmount}
                        required
                        placeholder="e.g. 500000"
                      />
                    </label>

                    <label>
                      Disbursed Amount (₹)
                      <input
                        type="number"
                        step="0.01"
                        name="disbursedAmount"
                        defaultValue={loanModal.data.disbursedAmount}
                        placeholder="Defaults to sanction amount"
                      />
                    </label>

                    <label>
                      Annual Interest Rate (% p.a.) <em>*</em>
                      <input
                        type="number"
                        step="0.01"
                        name="interestRate"
                        defaultValue={loanModal.data.interestRate}
                        required
                        placeholder="e.g. 7.0"
                      />
                    </label>

                    <label>
                      Interest Rate Type
                      <select name="interestType" defaultValue={loanModal.data.interestType || 'Fixed'}>
                        <option value="Fixed">Fixed Interest Rate</option>
                        <option value="Floating">Floating Interest Rate</option>
                      </select>
                    </label>

                    <label>
                      Loan Tenure (Months) <em>*</em>
                      <input
                        type="number"
                        name="tenureMonths"
                        defaultValue={loanModal.data.tenureMonths || 12}
                        required
                        placeholder="e.g. 12"
                      />
                    </label>

                    <label>
                      Repayment Frequency <em>*</em>
                      <select name="repaymentFrequency" defaultValue={loanModal.data.repaymentFrequency || 'Monthly'}>
                        {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </label>

                    <label>
                      Scheduled EMI (₹)
                      <input
                        type="number"
                        step="0.01"
                        name="emi"
                        defaultValue={loanModal.data.emi}
                        placeholder="Auto-calculated from terms"
                      />
                    </label>

                    <label>
                      Processing Fees &amp; Charges (₹)
                      <input
                        type="number"
                        step="0.01"
                        name="processingFees"
                        defaultValue={loanModal.data.processingFees || 0}
                        placeholder="e.g. 2500"
                      />
                    </label>

                    <label>
                      Start Date (Disbursal Date) <em>*</em>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={loanModal.data.startDate || todayDate()}
                        required
                      />
                    </label>

                    <label>
                      Maturity / End Date
                      <input
                        type="date"
                        name="endDate"
                        defaultValue={loanModal.data.endDate}
                      />
                    </label>

                    <label>
                      Current Outstanding Principal (₹)
                      <input
                        type="number"
                        step="0.01"
                        name="outstandingAmount"
                        defaultValue={loanModal.data.outstandingAmount}
                        placeholder="Leave blank to match disbursed"
                      />
                    </label>

                    <label>
                      Status
                      <select name="status" defaultValue={loanModal.data.status || 'Active'}>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </label>

                    <label className="field-wide">
                      Loan Purpose &amp; Remarks
                      <textarea
                        name="remarks"
                        rows={2}
                        defaultValue={loanModal.data.remarks || loanModal.data.loanPurpose}
                        placeholder="e.g. Paddy cultivation seasonal working capital, subsidised interest rate under government scheme"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <span>All mandatory fields marked with an asterisk (*).</span>
                <div>
                  <button type="button" onClick={() => setLoanModal(null)} disabled={saving}>Cancel</button>
                  <button type="submit" className="save-button" disabled={saving}>
                    {saving ? 'Saving...' : (loanModal.isEdit ? 'Update Loan' : 'Register Loan')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT                                                   */}
      {/* ========================================================================= */}
      {paymentModal && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setPaymentModal(null)}>
          <div className="user-modal user-modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h2>Record Loan Payment Voucher</h2>
                <p>Record installment repayment, separate principal vs interest, and update balance.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setPaymentModal(null)}>×</button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="form-section">
                  <div className="form-grid">
                    <label>
                      Voucher Number <em>*</em>
                      <input
                        type="text"
                        name="voucherNo"
                        defaultValue={paymentModal.data.voucherNo}
                        required
                        placeholder="e.g. VCH-LN-2026-001"
                      />
                    </label>

                    <label>
                      Target Loan <em>*</em>
                      <select name="loanNo" defaultValue={paymentModal.data.loanNo} required>
                        {loans.map(l => (
                          <option key={l.loanNo} value={l.loanNo}>
                            {l.loanNo} – {l.bankName} (Bal: {formatCurrency(l.outstandingPrincipal || l.outstandingAmount)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Payment Date <em>*</em>
                      <input
                        type="date"
                        name="paymentDate"
                        defaultValue={paymentModal.data.paymentDate || todayDate()}
                        required
                      />
                    </label>

                    <label>
                      Payment Type
                      <select name="paymentType" defaultValue={paymentModal.data.paymentType || 'Regular EMI'}>
                        <option value="Regular EMI">Regular EMI Installment</option>
                        <option value="Partial Payment">Partial Payment</option>
                        <option value="Advance Payment">Advance Payment</option>
                        <option value="Prepayment / Foreclosure">Prepayment / Foreclosure</option>
                      </select>
                    </label>

                    <label>
                      Installment Number (Optional)
                      <input
                        type="number"
                        name="installmentNumber"
                        defaultValue={paymentModal.data.installmentNumber || ''}
                        placeholder="e.g. 1 (auto-allocates if empty)"
                      />
                    </label>

                    <label>
                      Payment Mode <em>*</em>
                      <select name="paymentMode" defaultValue={paymentModal.data.paymentMode}>
                        {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h3>PAYMENT ALLOCATION BREAKDOWN</h3>
                  <div className="form-grid">
                    <label>
                      Principal Portion (₹) <em>*</em>
                      <input
                        type="number"
                        step="0.01"
                        name="principal"
                        defaultValue={paymentModal.data.principal}
                        required
                        placeholder="Reduces outstanding principal"
                      />
                    </label>

                    <label>
                      Interest Portion (₹) <em>*</em>
                      <input
                        type="number"
                        step="0.01"
                        name="interest"
                        defaultValue={paymentModal.data.interest}
                        required
                        placeholder="Financing cost"
                      />
                    </label>

                    <label>
                      Late Penalty / Other Charges (₹)
                      <input
                        type="number"
                        step="0.01"
                        name="penalty"
                        defaultValue={paymentModal.data.penalty || 0}
                        placeholder="Optional penalty"
                      />
                    </label>

                    <label>
                      Transaction Reference / UTR
                      <input
                        type="text"
                        name="referenceNo"
                        defaultValue={paymentModal.data.referenceNo}
                        placeholder="e.g. UTR-983475201"
                      />
                    </label>

                    <label className="field-wide">
                      Remarks / Notes
                      <input
                        type="text"
                        name="remarks"
                        defaultValue={paymentModal.data.remarks}
                        placeholder="e.g. 5th monthly EMI paid via SBI netbanking"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <span>Principal repayment directly reduces liability; interest is accounted separately.</span>
                <div>
                  <button type="button" onClick={() => setPaymentModal(null)} disabled={saving}>Cancel</button>
                  <button type="submit" className="save-button" disabled={saving}>
                    {saving ? 'Recording...' : 'Record Payment Voucher'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD DISBURSEMENT                                              */}
      {/* ========================================================================= */}
      {disbursementModal && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setDisbursementModal(null)}>
          <div className="user-modal user-modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h2>Record Loan Disbursement</h2>
                <p>Record additional credit tranche for Loan {disbursementModal.loanNo}.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setDisbursementModal(null)}>×</button>
            </div>

            <form onSubmit={handleSaveDisbursement}>
              <div className="modal-body">
                <div className="loan-payoff-box" style={{ margin: '14px 0' }}>
                  <div className="loan-payoff-row">
                    <span>Total Sanctioned Limit:</span>
                    <strong>{formatCurrency(disbursementModal.sanctionAmount)}</strong>
                  </div>
                  <div className="loan-payoff-row">
                    <span>Already Disbursed:</span>
                    <strong style={{ color: '#2563eb' }}>{formatCurrency(disbursementModal.disbursedAmount)}</strong>
                  </div>
                  <div className="loan-payoff-row total">
                    <span>Maximum Available to Disburse:</span>
                    <strong style={{ color: '#15803d' }}>{formatCurrency(disbursementModal.availableToDisburse)}</strong>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Disbursement Number <em>*</em>
                    <input
                      type="text"
                      name="disbursementNo"
                      defaultValue={disbursementModal.disbursementNo}
                      required
                    />
                  </label>

                  <label>
                    Disbursement Date <em>*</em>
                    <input
                      type="date"
                      name="disbursementDate"
                      defaultValue={disbursementModal.disbursementDate}
                      required
                    />
                  </label>

                  <label>
                    Amount to Disburse (₹) <em>*</em>
                    <input
                      type="number"
                      step="0.01"
                      name="disbursedAmount"
                      defaultValue={disbursementModal.amount}
                      max={disbursementModal.availableToDisburse}
                      required
                    />
                  </label>

                  <label>
                    Destination Bank Account
                    <input
                      type="text"
                      name="bankAccount"
                      defaultValue={disbursementModal.bankAccount}
                      placeholder="e.g. Farm Operations SBI Current A/c"
                    />
                  </label>

                  <label className="field-wide">
                    Reference / UTR Number
                    <input
                      type="text"
                      name="referenceNo"
                      defaultValue={disbursementModal.referenceNo}
                      placeholder="e.g. UTR-DSB-98341"
                    />
                  </label>

                  <label className="field-wide">
                    Disbursement Remarks
                    <textarea
                      name="remarks"
                      rows={2}
                      defaultValue={disbursementModal.remarks}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <span>Disbursements cannot exceed sanctioned limit.</span>
                <div>
                  <button type="button" onClick={() => setDisbursementModal(null)} disabled={saving}>Cancel</button>
                  <button type="submit" className="save-button" disabled={saving}>
                    {saving ? 'Saving...' : 'Confirm Disbursement'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LOAN SETTLEMENT & CLOSURE                                        */}
      {/* ========================================================================= */}
      {closeModal && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setCloseModal(null)}>
          <div className="user-modal user-modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h2>Loan Settlement &amp; Account Closure</h2>
                <p>Final payoff calculation, closure certificate attachment, and account status update.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setCloseModal(null)}>×</button>
            </div>

            <form onSubmit={handleSaveCloseLoan}>
              <div className="modal-body">
                <div className="loan-payoff-box" style={{ margin: '14px 0' }}>
                  <div className="loan-payoff-row">
                    <span>Loan Facility:</span>
                    <strong>{closeModal.loan.loanNo} ({closeModal.loan.bankName})</strong>
                  </div>
                  <div className="loan-payoff-row">
                    <span>Current Outstanding Principal:</span>
                    <strong style={{ color: '#b45309' }}>
                      {formatCurrency(closeModal.loan.outstandingPrincipal || closeModal.loan.outstandingAmount)}
                    </strong>
                  </div>
                  <div className="loan-payoff-row total">
                    <span>Final Payoff Settlement Required:</span>
                    <strong style={{ color: '#15803d', fontSize: '16px' }}>
                      {formatCurrency(closeModal.settlementAmount)}
                    </strong>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Closure / Settlement Date <em>*</em>
                    <input
                      type="date"
                      name="closedDate"
                      defaultValue={closeModal.closedDate}
                      required
                    />
                  </label>

                  <label>
                    Final Settlement Amount (₹) <em>*</em>
                    <input
                      type="number"
                      step="0.01"
                      name="finalSettlementAmount"
                      defaultValue={closeModal.settlementAmount}
                      required
                    />
                  </label>

                  <label>
                    Payment Mode
                    <select name="paymentMode" defaultValue={closeModal.paymentMode}>
                      {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>

                  <label>
                    Settlement UTR / Ref Number
                    <input
                      type="text"
                      name="referenceNo"
                      defaultValue={closeModal.referenceNo}
                      placeholder="e.g. UTR-CLOSURE-0091"
                    />
                  </label>

                  <label className="field-wide">
                    Bank NOC / Closure Certificate URL (Optional)
                    <input
                      type="text"
                      name="closureCertificateUrl"
                      placeholder="https://... or uploaded file path"
                    />
                  </label>

                  <label className="field-wide">
                    Closure Statement Notes
                    <textarea
                      name="remarks"
                      rows={2}
                      defaultValue={closeModal.remarks}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <span>Closing loan permanently settles all outstanding balance and prevents ordinary payments.</span>
                <div>
                  <button type="button" onClick={() => setCloseModal(null)} disabled={saving}>Cancel</button>
                  <button type="submit" className="save-button" style={{ background: '#059669' }} disabled={saving}>
                    {saving ? 'Closing...' : 'Confirm Payoff & Close Loan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAILED VIEW DIALOG WITH TABS                                   */}
      {/* ========================================================================= */}
      {viewLoanDetails && (
        <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && setViewLoanDetails(null)}>
          <div className="user-modal user-modal-card loan-view-dialog">
            <div className="modal-header">
              <div>
                <h2>{viewLoanDetails.loanNo} – {viewLoanDetails.bankName}</h2>
                <p>{viewLoanDetails.loanType} | A/c: {viewLoanDetails.loanAccountNo || 'N/A'}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setViewLoanDetails(null)}>×</button>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="loan-tabs-subnav">
              <button
                type="button"
                className={`loan-tab-subbtn ${detailTab === 'overview' ? 'active' : ''}`}
                onClick={() => setDetailTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`loan-tab-subbtn ${detailTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setDetailTab('schedule')}
              >
                Repayment Schedule ({viewLoanDetails.installments?.length || 0})
              </button>
              <button
                type="button"
                className={`loan-tab-subbtn ${detailTab === 'disbursements' ? 'active' : ''}`}
                onClick={() => setDetailTab('disbursements')}
              >
                Disbursements ({viewLoanDetails.disbursements?.length || 0})
              </button>
              <button
                type="button"
                className={`loan-tab-subbtn ${detailTab === 'payments' ? 'active' : ''}`}
                onClick={() => setDetailTab('payments')}
              >
                Payment Vouchers ({viewLoanDetails.payments?.length || 0})
              </button>
              <button
                type="button"
                className={`loan-tab-subbtn ${detailTab === 'documents' ? 'active' : ''}`}
                onClick={() => setDetailTab('documents')}
              >
                Documents ({viewLoanDetails.documents?.length || 0})
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* TAB 1: OVERVIEW */}
              {detailTab === 'overview' && (
                <div>
                  <div className="loan-view-header-card">
                    <div>
                      <small style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Current Outstanding Principal
                      </small>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: (viewLoanDetails.outstandingPrincipal || viewLoanDetails.outstandingAmount) > 0 ? '#b45309' : '#15803d' }}>
                        {formatCurrency(viewLoanDetails.outstandingPrincipal || viewLoanDetails.outstandingAmount)}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Sanctioned: {formatCurrency(viewLoanDetails.sanctionAmount)} | Disbursed: {formatCurrency(viewLoanDetails.disbursedAmount)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {viewLoanDetails.status !== 'Closed' && (
                        <button
                          type="button"
                          className="loan-btn-action loan-btn-pay"
                          onClick={() => {
                            const lNo = viewLoanDetails.loanNo
                            setViewLoanDetails(null)
                            handleOpenAddPayment(lNo)
                          }}
                        >
                          <ReceiptTextIcon size={14} /> Record Payment
                        </button>
                      )}
                      {viewLoanDetails.status !== 'Closed' && (
                        <button
                          type="button"
                          className="loan-btn-action"
                          style={{ color: '#059669', borderColor: '#a7f3d0' }}
                          onClick={() => {
                            const l = viewLoanDetails
                            setViewLoanDetails(null)
                            handleOpenCloseLoan(l)
                          }}
                        >
                          <ShieldCheckIcon size={14} /> Settle &amp; Close
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="loan-view-grid">
                    <div className="loan-view-item">
                      <small>Interest Terms</small>
                      <strong>{viewLoanDetails.interestRate}% p.a.</strong>
                      <span>{viewLoanDetails.interestType}</span>
                    </div>

                    <div className="loan-view-item">
                      <small>Tenure &amp; Frequency</small>
                      <strong>{viewLoanDetails.tenureMonths} Months</strong>
                      <span>{viewLoanDetails.repaymentFrequency}</span>
                    </div>

                    <div className="loan-view-item">
                      <small>Installment EMI</small>
                      <strong>{formatCurrency(viewLoanDetails.emi)}</strong>
                      <span>Next Due: {formatDate(viewLoanDetails.nextEmiDueDate)}</span>
                    </div>

                    <div className="loan-view-item">
                      <small>Start / End Dates</small>
                      <strong>{formatDate(viewLoanDetails.startDate)}</strong>
                      <span>Maturity: {formatDate(viewLoanDetails.endDate)}</span>
                    </div>

                    <div className="loan-view-item">
                      <small>Principal Repaid So Far</small>
                      <strong style={{ color: '#15803d' }}>{formatCurrency(viewLoanDetails.principalPaid)}</strong>
                      <span>Total Paid: {formatCurrency(viewLoanDetails.totalPaid)}</span>
                    </div>

                    <div className="loan-view-item">
                      <small>Interest &amp; Charges Paid</small>
                      <strong style={{ color: '#b45309' }}>{formatCurrency(viewLoanDetails.interestPaid)}</strong>
                      <span>Processing Fees: {formatCurrency(viewLoanDetails.processingFees)}</span>
                    </div>
                  </div>

                  {viewLoanDetails.remarks && (
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '6px', fontSize: '11.5px', color: '#334155' }}>
                      <strong>Purpose &amp; Notes:</strong> {viewLoanDetails.remarks}
                    </div>
                  )}

                  {viewLoanDetails.status === 'Closed' && (
                    <div style={{ marginTop: '14px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 14px', borderRadius: '6px', fontSize: '12px', color: '#065f46' }}>
                      <CheckCircleIcon size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} />
                      <strong>Account Closed:</strong> Settled on {formatDate(viewLoanDetails.closedDate)}. {viewLoanDetails.closureRemarks}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SCHEDULE */}
              {detailTab === 'schedule' && (
                <div>
                  <table className="loan-sub-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>DUE DATE</th>
                        <th style={{ textAlign: 'right' }}>OPENING</th>
                        <th style={{ textAlign: 'right' }}>PRINCIPAL</th>
                        <th style={{ textAlign: 'right' }}>INTEREST</th>
                        <th style={{ textAlign: 'right' }}>EMI</th>
                        <th style={{ textAlign: 'right' }}>PAID</th>
                        <th style={{ textAlign: 'right' }}>REMAINING</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewLoanDetails.installments?.map(inst => (
                        <tr key={inst.id}>
                          <td><strong>#{inst.installmentNumber}</strong></td>
                          <td>{formatDate(inst.dueDate)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(inst.openingPrincipal)}</td>
                          <td style={{ textAlign: 'right', color: '#15803d' }}>{formatCurrency(inst.principalAmount)}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{formatCurrency(inst.interestAmount)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(inst.emiAmount)}</td>
                          <td style={{ textAlign: 'right', color: '#2563eb' }}>{formatCurrency(inst.paidAmount)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inst.remainingAmount)}</td>
                          <td>
                            <span className={`inst-pill ${(inst.status || 'Pending').toLowerCase().replace(' ', '-')}`}>
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: DISBURSEMENTS */}
              {detailTab === 'disbursements' && (
                <div>
                  <table className="loan-sub-table">
                    <thead>
                      <tr>
                        <th>DISBURSEMENT NO</th>
                        <th>DATE</th>
                        <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        <th>BANK ACCOUNT</th>
                        <th>REFERENCE NO</th>
                        <th>REMARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewLoanDetails.disbursements?.map(d => (
                        <tr key={d.id}>
                          <td><strong>{d.disbursementNo}</strong></td>
                          <td>{formatDate(d.disbursementDate)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                            {formatCurrency(d.disbursedAmount)}
                          </td>
                          <td>{d.bankAccount || '—'}</td>
                          <td><span style={{ fontFamily: 'monospace' }}>{d.referenceNo || '—'}</span></td>
                          <td>{d.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: PAYMENTS */}
              {detailTab === 'payments' && (
                <div>
                  <table className="loan-sub-table">
                    <thead>
                      <tr>
                        <th>VOUCHER NO</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>INST #</th>
                        <th style={{ textAlign: 'right' }}>PRINCIPAL</th>
                        <th style={{ textAlign: 'right' }}>INTEREST</th>
                        <th style={{ textAlign: 'right' }}>TOTAL PAID</th>
                        <th>MODE</th>
                        <th>REFERENCE NO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewLoanDetails.payments?.map(p => (
                        <tr key={p.paymentId || p.id}>
                          <td><strong>{p.voucherNo || p.id}</strong></td>
                          <td>{formatDate(p.paymentDate)}</td>
                          <td>{p.paymentType}</td>
                          <td>{p.installmentNumber ? `#${p.installmentNumber}` : '—'}</td>
                          <td style={{ textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{formatCurrency(p.principal)}</td>
                          <td style={{ textAlign: 'right', color: '#b45309' }}>{formatCurrency(p.interest)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 750 }}>{formatCurrency(p.totalPayment)}</td>
                          <td>{p.paymentMode}</td>
                          <td><span style={{ fontFamily: 'monospace' }}>{p.referenceNo || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: DOCUMENTS */}
              {detailTab === 'documents' && (
                <div>
                  <div className="loan-doc-upload-box">
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      style={{ height: '34px', fontSize: '11px' }}
                    >
                      <option value="Sanction Letter">Sanction Letter</option>
                      <option value="Agreement">Loan Agreement</option>
                      <option value="Promissory Note">Promissory Note</option>
                      <option value="Closure Certificate / NOC">Closure Certificate / NOC</option>
                      <option value="Other">Other Document</option>
                    </select>

                    <label className="loan-btn-action" style={{ cursor: 'pointer' }}>
                      <PlusIcon size={14} /> Choose File to Upload
                      <input type="file" onChange={handleUploadDoc} disabled={uploadingDoc} />
                    </label>

                    {uploadingDoc && <span style={{ fontSize: '11px', color: '#2563eb' }}>Uploading...</span>}
                  </div>

                  <table className="loan-sub-table">
                    <thead>
                      <tr>
                        <th>DOCUMENT NAME</th>
                        <th>TYPE</th>
                        <th>UPLOADED ON</th>
                        <th>LINK / ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewLoanDetails.documents?.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                            No documents attached yet.
                          </td>
                        </tr>
                      ) : (
                        viewLoanDetails.documents?.map(doc => (
                          <tr key={doc.id}>
                            <td><strong>{doc.documentName}</strong></td>
                            <td><span className="loan-type-pill">{doc.documentType}</span></td>
                            <td>{formatDate(doc.uploadedAt)}</td>
                            <td>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="loan-btn-action"
                                style={{ textDecoration: 'none' }}
                              >
                                View File
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span>Facility Record ID #{viewLoanDetails.loanId}</span>
              <button type="button" onClick={() => setViewLoanDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE DIALOG                                                     */}
      {/* ========================================================================= */}
      {deleteConfirm && (
        <div className="dialog-backdrop">
          <div className="user-modal confirm-dialog">
            <div className="delete-symbol">!</div>
            <h2>Delete Loan Facility?</h2>
            <p>
              Are you sure you want to delete loan <strong>{deleteConfirm.item.loanNo}</strong> from <strong>{deleteConfirm.item.bankName}</strong>?
              This action cannot be undone. Loans with recorded financial payment transactions are permanently protected from deletion.
            </p>
            <div className="dialog-actions">
              <button type="button" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button type="button" className="delete-button" onClick={handleDeleteLoan}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
