import { useEffect, useMemo, useState } from 'react'
import './loans.css'

const moduleName = 'Loans'
const storeKey = 'agriman-finance-loans'

// Available Loan Types tailored for Indian Agriculture & Farm Operations
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

// Common Banks / Lenders in Agriculture
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

// Initial Seed Data for Loans
const SEED_LOANS = [
  {
    loanNo: 'LOAN-2026-001',
    bankName: 'District Cooperative Central Bank (DCCB)',
    loanType: 'Crop Loan (KCC)',
    sanctionAmount: 500000,
    interestRate: 7.0,
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    emi: 42500,
    outstandingAmount: 372000,
    status: 'Active',
    remarks: 'Kharif season subsidized crop loan sanctioned against 10 acres land survey.',
  },
  {
    loanNo: 'LOAN-2026-002',
    bankName: 'State Bank of India (Agri Branch)',
    loanType: 'Tractor / Equipment Loan',
    sanctionAmount: 750000,
    interestRate: 8.5,
    startDate: '2025-11-15',
    endDate: '2030-11-14',
    emi: 15400,
    outstandingAmount: 620000,
    status: 'Active',
    remarks: 'Financed for Mahindra 575 DI Tractor purchase.',
  },
  {
    loanNo: 'LOAN-2026-003',
    bankName: 'Nabard Primary Agri Co-op (PACS)',
    loanType: 'Drip Irrigation Loan',
    sanctionAmount: 200000,
    interestRate: 4.0,
    startDate: '2025-04-10',
    endDate: '2027-04-09',
    emi: 8680,
    outstandingAmount: 85000,
    status: 'Active',
    remarks: 'Government subsidized micro-irrigation installation loan.',
  },
  {
    loanNo: 'LOAN-2026-004',
    bankName: 'Canara Bank (Kisan Credit)',
    loanType: 'Dairy / Livestock Loan',
    sanctionAmount: 150000,
    interestRate: 9.0,
    startDate: '2024-08-01',
    endDate: '2026-07-31',
    emi: 6850,
    outstandingAmount: 0,
    status: 'Closed',
    remarks: 'Financed for 2 Murrah buffaloes purchase. Fully repaid.',
  },
]

// Initial Seed Data for Loan Payments
const SEED_PAYMENTS = [
  {
    id: 'LN-PAY-2026-001',
    loanNo: 'LOAN-2026-001',
    paymentDate: '2026-07-05',
    principal: 39580,
    interest: 2920,
    penalty: 0,
    totalPayment: 42500,
    paymentMode: 'Bank Transfer / NEFT / RTGS',
    referenceNo: 'UTR-SBIN-892104',
    remarks: 'July 2026 monthly installment',
  },
  {
    id: 'LN-PAY-2026-002',
    loanNo: 'LOAN-2026-001',
    paymentDate: '2026-08-05',
    principal: 39810,
    interest: 2690,
    penalty: 0,
    totalPayment: 42500,
    paymentMode: 'Bank Transfer / NEFT / RTGS',
    referenceNo: 'UTR-SBIN-912044',
    remarks: 'August 2026 monthly installment',
  },
  {
    id: 'LN-PAY-2026-003',
    loanNo: 'LOAN-2026-002',
    paymentDate: '2026-09-10',
    principal: 11000,
    interest: 4400,
    penalty: 0,
    totalPayment: 15400,
    paymentMode: 'Auto Debit / ECS',
    referenceNo: 'ECS-SBI-00912',
    remarks: 'September 2026 tractor EMI deduction',
  },
  {
    id: 'LN-PAY-2026-004',
    loanNo: 'LOAN-2026-003',
    paymentDate: '2026-10-15',
    principal: 8100,
    interest: 580,
    penalty: 0,
    totalPayment: 8680,
    paymentMode: 'UPI',
    referenceNo: 'UPI-HDFC-99210',
    remarks: 'October 2026 drip loan EMI payment',
  },
]

// Formatting Helpers
function formatCurrency(val) {
  const num = Number(val) || 0
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
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

function formatPct(val) {
  const num = Number(val) || 0
  if (num % 1 === 0) return `${Math.round(num)}%`
  return `${num.toFixed(1)}%`
}

// Normalize raw or legacy record from LocalStorage
function normalizeLoan(raw) {
  if (!raw) return null
  const sanction = parseAmount(raw.sanctionAmount || raw['Sanction Amount'])
  const outstanding = raw.outstandingAmount !== undefined || raw['Outstanding Amount'] !== undefined
    ? parseAmount(raw.outstandingAmount || raw['Outstanding Amount'])
    : sanction
  const st = raw.status || raw['Status'] || (outstanding <= 0 ? 'Closed' : 'Active')

  return {
    loanNo: raw.loanNo || raw['Loan No'] || '',
    bankName: raw.bankName || raw['Bank / Lender'] || '',
    loanType: raw.loanType || raw['Loan Type'] || 'Crop Loan (KCC)',
    sanctionAmount: sanction,
    interestRate: parseRate(raw.interestRate || raw['Interest Rate']),
    startDate: raw.startDate || raw['Start Date'] || '',
    endDate: raw.endDate || raw['End Date'] || '',
    emi: parseAmount(raw.emi || raw['EMI']),
    outstandingAmount: outstanding,
    status: st,
    remarks: raw.remarks || raw['Remarks'] || '',
  }
}

function normalizePayment(raw) {
  if (!raw) return null
  const principal = parseAmount(raw.principal || raw['Principal'])
  const interest = parseAmount(raw.interest || raw['Interest'])
  const penalty = parseAmount(raw.penalty || raw['Penalty'])
  const total = raw.totalPayment || raw['Total Payment']
    ? parseAmount(raw.totalPayment || raw['Total Payment'])
    : (principal + interest + penalty)

  return {
    id: raw.id || raw.paymentNo || raw['Reference No'] || `LN-PAY-${Date.now().toString().slice(-4)}`,
    loanNo: raw.loanNo || raw['Loan No'] || '',
    paymentDate: raw.paymentDate || raw['Payment Date'] || todayDate(),
    principal,
    interest,
    penalty,
    totalPayment: total,
    paymentMode: raw.paymentMode || raw['Payment Mode'] || 'Bank Transfer / NEFT / RTGS',
    referenceNo: raw.referenceNo || raw['Reference No'] || '',
    remarks: raw.remarks || raw['Remarks'] || '',
  }
}

// Convert to legacy shape when saving so any external/generic consumers still work
function toStorageLoan(loan) {
  return {
    ...loan,
    'Loan No': loan.loanNo,
    'Bank / Lender': loan.bankName,
    'Loan Type': loan.loanType,
    'Sanction Amount': formatCurrency(loan.sanctionAmount),
    'Interest Rate': `${loan.interestRate}%`,
    'Start Date': loan.startDate,
    'End Date': loan.endDate,
    'EMI': formatCurrency(loan.emi),
    'Outstanding Amount': formatCurrency(loan.outstandingAmount),
    'Status': loan.status,
  }
}

function toStoragePayment(p) {
  return {
    ...p,
    'Loan No': p.loanNo,
    'Payment Date': p.paymentDate,
    'Principal': formatCurrency(p.principal),
    'Interest': formatCurrency(p.interest),
    'Penalty': formatCurrency(p.penalty),
    'Total Payment': formatCurrency(p.totalPayment),
    'Payment Mode': p.paymentMode,
    'Reference No': p.referenceNo,
  }
}

export default function Loans() {
  const [view, setView] = useState('loans') // 'loans' | 'payments'

  // Load Loans from LocalStorage
  const [loans, setLoans] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storeKey}-records`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeLoan).filter(Boolean)
        }
      }
    } catch {
      // fallback
    }
    return SEED_LOANS
  })

  // Load Payments from LocalStorage
  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storeKey}-payments`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizePayment).filter(Boolean)
        }
      }
    } catch {
      // fallback
    }
    return SEED_PAYMENTS
  })

  // Payment totals per loan
  const loanPaymentStats = useMemo(() => {
    const map = {}
    payments.forEach((p) => {
      if (!map[p.loanNo]) {
        map[p.loanNo] = { totalPaid: 0, principalPaid: 0, count: 0 }
      }
      map[p.loanNo].totalPaid += Number(p.totalPayment) || 0
      map[p.loanNo].principalPaid += Number(p.principal) || 0
      map[p.loanNo].count += 1
    })
    return map
  }, [payments])

  const getLoanPaid = (loan) => {
    if (!loan) return 0
    const stats = loanPaymentStats[loan.loanNo]
    if (stats && stats.count > 0) {
      return stats.totalPaid
    }
    const sanction = loan.sanctionAmount || 0
    const out = loan.outstandingAmount !== undefined ? loan.outstandingAmount : sanction
    return Math.max(0, sanction - out)
  }

  const getLoanOutstanding = (loan) => {
    if (!loan) return 0
    const sanction = loan.sanctionAmount || 0
    const stats = loanPaymentStats[loan.loanNo]
    if (stats && stats.count > 0) {
      return Math.max(0, sanction - stats.totalPaid)
    }
    return loan.outstandingAmount !== undefined ? loan.outstandingAmount : sanction
  }

  // Save to LocalStorage
  useEffect(() => {
    const synchronizedLoans = loans.map((loan) => {
      const out = getLoanOutstanding(loan)
      return {
        ...loan,
        outstandingAmount: out,
        status: out <= 0 ? 'Closed' : (loan.status === 'Closed' && out > 0 ? 'Active' : loan.status),
      }
    })
    localStorage.setItem(`${storeKey}-records`, JSON.stringify(synchronizedLoans.map(toStorageLoan)))
  }, [loans, payments, loanPaymentStats])

  useEffect(() => {
    localStorage.setItem(`${storeKey}-payments`, JSON.stringify(payments.map(toStoragePayment)))
  }, [payments])

  // Filters & State
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [paymentModeFilter, setPaymentModeFilter] = useState('All')
  const [selectedLoanFilter, setSelectedLoanFilter] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 5

  // Modals
  const [loanModal, setLoanModal] = useState(null) // null | { isEdit: boolean, data: object }
  const [paymentModal, setPaymentModal] = useState(null) // null | { isEdit: boolean, data: object }
  const [viewLoanDetails, setViewLoanDetails] = useState(null) // null | loan object
  const [deleteConfirm, setDeleteConfirm] = useState(null) // null | { type: 'loan'|'payment', item: object }
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Reset pagination on filter or view change
  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, typeFilter, paymentModeFilter, selectedLoanFilter, view])

  // KPI Calculations
  const totalSanctioned = useMemo(() => loans.reduce((acc, l) => acc + (l.sanctionAmount || 0), 0), [loans])
  const totalOutstanding = useMemo(() => loans.reduce((acc, l) => acc + getLoanOutstanding(l), 0), [loans, loanPaymentStats])
  const activeLoansCount = useMemo(() => {
    const active = loans.filter((l) => getLoanOutstanding(l) > 0 && l.status !== 'Closed')
    return active.length || loans.filter((l) => l.status === 'Active').length
  }, [loans, loanPaymentStats])

  const totalPaymentsAmount = useMemo(() => payments.reduce((acc, p) => acc + (p.totalPayment || 0), 0), [payments])
  const totalPrincipalPaid = useMemo(() => payments.reduce((acc, p) => acc + (p.principal || 0), 0), [payments])
  const totalInterestPaid = useMemo(() => payments.reduce((acc, p) => acc + (p.interest || 0) + (p.penalty || 0), 0), [payments])

  // Paid amount displayed in Loan Screen matching Loan Payment Screen
  const totalPaidDisplay = useMemo(() => {
    return payments.length > 0 ? totalPaymentsAmount : Math.max(0, totalSanctioned - totalOutstanding)
  }, [payments, totalPaymentsAmount, totalSanctioned, totalOutstanding])

  const totalRepaidPct = totalSanctioned > 0 ? (totalPaidDisplay / totalSanctioned) * 100 : 0

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    const q = query.trim().toLowerCase()
    return loans.filter((loan) => {
      const matchText = !q ||
        loan.loanNo.toLowerCase().includes(q) ||
        loan.bankName.toLowerCase().includes(q) ||
        loan.loanType.toLowerCase().includes(q) ||
        (loan.remarks && loan.remarks.toLowerCase().includes(q))

      const matchStatus = statusFilter === 'All' || loan.status === statusFilter
      const matchType = typeFilter === 'All' || loan.loanType === typeFilter
      return matchText && matchStatus && matchType
    })
  }, [loans, query, statusFilter, typeFilter])

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

  // Pagination
  const activeList = view === 'loans' ? filteredLoans : filteredPayments
  const pageCount = Math.max(1, Math.ceil(activeList.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRecords = activeList.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Handlers for Loans
  const handleOpenAddLoan = () => {
    const nextNum = loans.length + 1
    const generatedCode = `LOAN-2026-${String(nextNum).padStart(3, '0')}`
    setLoanModal({
      isEdit: false,
      data: {
        loanNo: generatedCode,
        bankName: '',
        loanType: 'Crop Loan (KCC)',
        sanctionAmount: '',
        interestRate: '7.0',
        startDate: todayDate(),
        endDate: '',
        emi: '',
        outstandingAmount: '',
        status: 'Active',
        remarks: '',
      },
    })
  }

  const handleOpenEditLoan = (loan) => {
    setLoanModal({
      isEdit: true,
      data: {
        ...loan,
        outstandingAmount: getLoanOutstanding(loan),
      },
    })
  }

  const handleSaveLoan = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const sanction = parseAmount(formData.get('sanctionAmount'))
    const rate = parseRate(formData.get('interestRate'))
    const emiVal = parseAmount(formData.get('emi'))
    const outVal = formData.get('outstandingAmount') !== ''
      ? parseAmount(formData.get('outstandingAmount'))
      : sanction

    const newLoanObj = {
      loanNo: formData.get('loanNo')?.trim() || `LOAN-${Date.now().toString().slice(-4)}`,
      bankName: formData.get('bankName')?.trim() || 'Cooperative Bank',
      loanType: formData.get('loanType') || 'Crop Loan (KCC)',
      sanctionAmount: sanction,
      interestRate: rate,
      startDate: formData.get('startDate') || todayDate(),
      endDate: formData.get('endDate') || '',
      emi: emiVal,
      outstandingAmount: outVal,
      status: outVal <= 0 ? 'Closed' : (formData.get('status') || 'Active'),
      remarks: formData.get('remarks')?.trim() || '',
    }

    if (loanModal.isEdit) {
      setLoans((prev) => prev.map((l) => (l.loanNo === loanModal.data.loanNo ? newLoanObj : l)))
      showToast(`Loan ${newLoanObj.loanNo} updated successfully.`)
    } else {
      if (loans.some((l) => l.loanNo === newLoanObj.loanNo)) {
        alert(`Loan number "${newLoanObj.loanNo}" already exists!`)
        return
      }
      setLoans((prev) => [newLoanObj, ...prev])
      showToast(`Loan ${newLoanObj.loanNo} registered successfully.`)
    }

    setLoanModal(null)
  }

  const handleDeleteLoan = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'loan') return
    const targetNo = deleteConfirm.item.loanNo
    setLoans((prev) => prev.filter((l) => l.loanNo !== targetNo))
    setDeleteConfirm(null)
    showToast(`Loan ${targetNo} deleted.`)
  }

  // Handlers for Loan Payments
  const handleOpenAddPayment = (preselectedLoanNo = '') => {
    const nextPayId = `LN-PAY-${Date.now().toString().slice(-4)}`
    const defaultLoan = preselectedLoanNo || (loans.find((l) => l.status === 'Active')?.loanNo || loans[0]?.loanNo || '')
    const targetLoan = loans.find((l) => l.loanNo === defaultLoan)

    setPaymentModal({
      isEdit: false,
      data: {
        id: nextPayId,
        loanNo: defaultLoan,
        paymentDate: todayDate(),
        principal: targetLoan ? (targetLoan.emi ? Math.round(targetLoan.emi * 0.85) : '') : '',
        interest: targetLoan ? (targetLoan.emi ? Math.round(targetLoan.emi * 0.15) : '') : '',
        penalty: 0,
        totalPayment: targetLoan?.emi || 0,
        paymentMode: 'Bank Transfer / NEFT / RTGS',
        referenceNo: '',
        remarks: '',
      },
    })
  }

  const handleOpenEditPayment = (payment) => {
    setPaymentModal({
      isEdit: true,
      data: { ...payment },
    })
  }

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
      alert('Total payment must be greater than ₹0.')
      return
    }

    const targetLoan = loans.find((l) => l.loanNo === loanNo)
    if (!targetLoan && loans.length > 0) {
      alert('Selected loan was not found.')
      return
    }

    const newPaymentObj = {
      id: paymentModal.data.id,
      loanNo,
      paymentDate: formData.get('paymentDate') || todayDate(),
      principal,
      interest,
      penalty,
      totalPayment,
      paymentMode: formData.get('paymentMode') || 'Bank Transfer / NEFT / RTGS',
      referenceNo: formData.get('referenceNo')?.trim() || '',
      remarks: formData.get('remarks')?.trim() || '',
    }

    if (paymentModal.isEdit) {
      const oldPayment = paymentModal.data
      const diff = totalPayment - (oldPayment.totalPayment || 0)

      setPayments((prev) => prev.map((p) => (p.id === newPaymentObj.id ? newPaymentObj : p)))

      // Adjust loan outstanding
      setLoans((prev) =>
        prev.map((l) => {
          if (l.loanNo !== loanNo) return l
          const updatedPaid = (loanPaymentStats[loanNo]?.totalPaid || 0) + diff
          const updatedBal = Math.max(0, (l.sanctionAmount || 0) - updatedPaid)
          return {
            ...l,
            outstandingAmount: updatedBal,
            status: updatedBal <= 0 ? 'Closed' : l.status,
          }
        })
      )

      showToast(`Payment ${newPaymentObj.id} updated successfully.`)
    } else {
      setPayments((prev) => [newPaymentObj, ...prev])

      // Automatically reduce Loan Outstanding Amount by payment
      setLoans((prev) =>
        prev.map((l) => {
          if (l.loanNo !== loanNo) return l
          const updatedPaid = (loanPaymentStats[loanNo]?.totalPaid || 0) + totalPayment
          const updatedBal = Math.max(0, (l.sanctionAmount || 0) - updatedPaid)
          return {
            ...l,
            outstandingAmount: updatedBal,
            status: updatedBal <= 0 ? 'Closed' : l.status,
          }
        })
      )

      showToast(`Payment of ${formatCurrency(totalPayment)} recorded for ${loanNo}.`)
    }

    setPaymentModal(null)
  }

  const handleDeletePayment = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'payment') return
    const target = deleteConfirm.item

    setPayments((prev) => prev.filter((p) => p.id !== target.id))

    // Revert the deduction from the loan
    setLoans((prev) =>
      prev.map((l) => {
        if (l.loanNo !== target.loanNo) return l
        const updatedPaid = Math.max(0, (loanPaymentStats[l.loanNo]?.totalPaid || 0) - (target.totalPayment || 0))
        const restoredBal = Math.max(0, (l.sanctionAmount || 0) - updatedPaid)
        return {
          ...l,
          outstandingAmount: restoredBal,
          status: restoredBal > 0 && l.status === 'Closed' ? 'Active' : l.status,
        }
      })
    )

    setDeleteConfirm(null)
    showToast(`Payment ${target.id} deleted.`)
  }

  // Get payments for a specific loan
  const getLoanPayments = (lNo) => payments.filter((p) => p.loanNo === lNo)

  return (
    <div className="users-page finance-screen">
      {/* 1. Title Row */}
      <div className="users-title-row">
        <div>
          <div className="users-eyebrow">
            FINANCE <span>/</span> LOAN &amp; FINANCE MODULE
          </div>
          <h1>Loan &amp; Finance Management</h1>
          <p>Track sanctioned farm loans, interest rates, installment payments, and outstanding liabilities.</p>
        </div>

        <div>
          {view === 'loans' ? (
            <button className="users-add" type="button" onClick={handleOpenAddLoan}>
              <span>＋</span> Add New Loan
            </button>
          ) : (
            <button className="users-add" type="button" onClick={() => handleOpenAddPayment()}>
              <span>＋</span> Record Loan Payment
            </button>
          )}
        </div>
      </div>

      {/* 2. View Switch Navigation */}
      <div className="finance-view-switch">
        <button
          className={view === 'loans' ? 'selected' : ''}
          type="button"
          onClick={() => {
            setView('loans')
            setQuery('')
          }}
        >
          <span>🏛</span> Loan Screen
          <span className="tab-count">{loans.length}</span>
        </button>
        <button
          className={view === 'payments' ? 'selected' : ''}
          type="button"
          onClick={() => {
            setView('payments')
            setQuery('')
          }}
        >
          <span>💳</span> Loan Payment Screen
          <span className="tab-count">{payments.length}</span>
        </button>
      </div>

      {/* 3. KPI Summary Cards */}
      {view === 'loans' ? (
        <div className="loan-stats-grid">
          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-green">🏛</div>
            <div className="loan-stat-info">
              <small>Active Loans</small>
              <strong>{activeLoansCount} of {loans.length}</strong>
              <span>Active borrower accounts</span>
            </div>
          </article>

          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-blue">₹</div>
            <div className="loan-stat-info">
              <small>Total Sanctioned</small>
              <strong>{formatCurrency(totalSanctioned)}</strong>
              <span>Sanctioned credit capital</span>
            </div>
          </article>

          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-amber">⏳</div>
            <div className="loan-stat-info">
              <small>Total Outstanding</small>
              <strong style={{ color: totalOutstanding > 0 ? '#b45309' : '#15803d' }}>
                {formatCurrency(totalOutstanding)}
              </strong>
              <span>Current unpaid principal</span>
            </div>
          </article>

          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-purple">✓</div>
            <div className="loan-stat-info">
              <small>Total Amount Paid</small>
              <strong style={{ color: '#15803d' }}>{formatCurrency(totalPaidDisplay)}</strong>
              <span>
                {totalSanctioned > 0 ? `${formatPct(totalRepaidPct)} repaid` : '0%'}
              </span>
            </div>
          </article>
        </div>
      ) : (
        <div className="loan-stats-grid">
          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-green">📋</div>
            <div className="loan-stat-info">
              <small>Total Payments</small>
              <strong>{payments.length} Vouchers</strong>
              <span>Recorded installments</span>
            </div>
          </article>

          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-blue">₹</div>
            <div className="loan-stat-info">
              <small>Total Amount Paid</small>
              <strong style={{ color: '#15803d' }}>{formatCurrency(totalPaymentsAmount)}</strong>
              <span>Cumulative cash outflow</span>
            </div>
          </article>

          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-purple">📉</div>
            <div className="loan-stat-info">
              <small>Principal Reductions</small>
              <strong>{formatCurrency(totalPrincipalPaid)}</strong>
              <span>Direct liability reduction</span>
            </div>
          </article>

          <article className="loan-stat-card">
            <div className="loan-stat-icon loan-icon-amber">🏷</div>
            <div className="loan-stat-info">
              <small>Interest &amp; Charges</small>
              <strong>{formatCurrency(totalInterestPaid)}</strong>
              <span>Finance cost paid</span>
            </div>
          </article>
        </div>
      )}

      {/* 4. Table Panel */}
      <section className="users-panel">
        <div className="users-toolbar">
          <div className="user-search">
            <span>⌕</span>
            <input
              aria-label={`Search ${view}`}
              placeholder={
                view === 'loans'
                  ? 'Search by loan no, bank / lender, or loan type...'
                  : 'Search by loan no, payment mode, reference...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {view === 'loans' ? (
            <>
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                aria-label="Filter by Loan Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Loan Types</option>
                {LOAN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <select
                aria-label="Filter by Loan No"
                value={selectedLoanFilter}
                onChange={(e) => setSelectedLoanFilter(e.target.value)}
              >
                <option value="All">All Loan Numbers</option>
                {loans.map((l) => (
                  <option key={l.loanNo} value={l.loanNo}>
                    {l.loanNo} ({l.bankName.slice(0, 20)}...)
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Payment Mode"
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
              >
                <option value="All">All Payment Modes</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            className="reset-button"
            type="button"
            onClick={() => {
              setQuery('')
              setStatusFilter('All')
              setTypeFilter('All')
              setPaymentModeFilter('All')
              setSelectedLoanFilter('All')
            }}
          >
            ↻ <span>Reset Filters</span>
          </button>
        </div>

        {/* 5. Main Table */}
        <div className="users-table-wrap">
          {view === 'loans' ? (
            <table className="users-table">
              <thead>
                <tr>
                  <th>LOAN NO</th>
                  <th>BANK / LENDER</th>
                  <th>LOAN TYPE</th>
                  <th style={{ textAlign: 'right' }}>SANCTION AMOUNT</th>
                  <th style={{ textAlign: 'center' }}>INTEREST RATE</th>
                  <th>START DATE</th>
                  <th>END DATE</th>
                  <th style={{ textAlign: 'right' }}>EMI</th>
                  <th style={{ textAlign: 'right' }}>OUTSTANDING AMOUNT</th>
                  <th style={{ textAlign: 'center' }}>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((loan) => {
                  const loanOut = getLoanOutstanding(loan)
                  const loanPaid = getLoanPaid(loan)
                  const repaidPct = loan.sanctionAmount > 0
                    ? Math.min(100, Math.max(0, (loanPaid / loan.sanctionAmount) * 100))
                    : 0
                  const loanStatus = loanOut <= 0 ? 'Closed' : loan.status

                  return (
                    <tr key={loan.loanNo}>
                      <td>
                        <span className="loan-code-chip">{loan.loanNo}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ color: '#1e293b', fontSize: '11px' }}>{loan.bankName}</strong>
                          {loan.remarks && (
                            <span style={{ color: '#64748b', fontSize: '9.5px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {loan.remarks}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="loan-type-pill">{loan.loanType}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(loan.sanctionAmount)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                        {loan.interestRate}% p.a.
                      </td>
                      <td>{formatDate(loan.startDate)}</td>
                      <td>{formatDate(loan.endDate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                        {loan.emi ? formatCurrency(loan.emi) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <strong style={{ color: loanOut > 0 ? '#b45309' : '#15803d', fontSize: '12px' }}>
                            {formatCurrency(loanOut)}
                          </strong>
                          <div className="loan-progress-wrap">
                            <div className="loan-progress-bar">
                              <div className="loan-progress-fill" style={{ width: `${repaidPct}%` }} />
                            </div>
                            <div className="loan-progress-text">
                              <span>{formatPct(repaidPct)} repaid</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`loan-status-badge ${
                            loanStatus === 'Active'
                              ? 'loan-status-active'
                              : loanStatus === 'Closed'
                              ? 'loan-status-closed'
                              : 'loan-status-overdue'
                          }`}
                        >
                          <i /> {loanStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="loan-actions-cell" style={{ justifyContent: 'center' }}>
                          {loanStatus === 'Active' && (
                            <button
                              type="button"
                              className="loan-btn-action loan-btn-pay"
                              title="Record payment for this loan"
                              onClick={() => {
                                handleOpenAddPayment(loan.loanNo)
                                setView('payments')
                              }}
                            >
                              💳 Pay
                            </button>
                          )}
                          <button
                            type="button"
                            className="loan-btn-action"
                            title="View Loan Details and History"
                            onClick={() => setViewLoanDetails(loan)}
                          >
                            👁
                          </button>
                          <button
                            type="button"
                            className="loan-btn-action"
                            title="Edit Loan"
                            onClick={() => handleOpenEditLoan(loan)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="loan-btn-action loan-btn-danger"
                            title="Delete Loan"
                            onClick={() => setDeleteConfirm({ type: 'loan', item: loan })}
                          >
                            ♲
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {pagedRecords.length === 0 && (
                  <tr>
                    <td colSpan={11}>
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No loan records found</strong>
                        <p>Register a new loan or adjust your search filter criteria.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuery('')
                            setStatusFilter('All')
                            setTypeFilter('All')
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>VOUCHER NO</th>
                  <th>LOAN NO</th>
                  <th>PAYMENT DATE</th>
                  <th style={{ textAlign: 'right' }}>PRINCIPAL</th>
                  <th style={{ textAlign: 'right' }}>INTEREST</th>
                  <th style={{ textAlign: 'right' }}>PENALTY</th>
                  <th style={{ textAlign: 'right' }}>TOTAL PAYMENT</th>
                  <th>PAYMENT MODE</th>
                  <th>REFERENCE NO</th>
                  <th>REMARKS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="loan-code-chip">{payment.id}</span>
                    </td>
                    <td>
                      <span
                        className="loan-code-chip"
                        style={{ cursor: 'pointer', background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                        title="Click to view loan details"
                        onClick={() => {
                          const matched = loans.find((l) => l.loanNo === payment.loanNo)
                          if (matched) setViewLoanDetails(matched)
                        }}
                      >
                        {payment.loanNo}
                      </span>
                    </td>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(payment.principal)}
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>
                      {formatCurrency(payment.interest)}
                    </td>
                    <td style={{ textAlign: 'right', color: payment.penalty > 0 ? '#b91c1c' : '#94a3b8' }}>
                      {formatCurrency(payment.penalty)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '12px' }}>
                      {formatCurrency(payment.totalPayment)}
                    </td>
                    <td>
                      <span style={{ fontSize: '10.5px', color: '#334155' }}>{payment.paymentMode}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                        {payment.referenceNo || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{payment.remarks || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="loan-actions-cell" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="loan-btn-action"
                          title="Edit Payment"
                          onClick={() => handleOpenEditPayment(payment)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="loan-btn-action loan-btn-danger"
                          title="Delete Payment"
                          onClick={() => setDeleteConfirm({ type: 'payment', item: payment })}
                        >
                          ♲
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pagedRecords.length === 0 && (
                  <tr>
                    <td colSpan={11}>
                      <div className="users-empty">
                        <span>⌕</span>
                        <strong>No loan payments found</strong>
                        <p>Record a new installment payment above or adjust your search filters.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuery('')
                            setPaymentModeFilter('All')
                            setSelectedLoanFilter('All')
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 6. Pagination Footer */}
        <div className="users-table-footer">
          <span>
            Showing <strong>{activeList.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, activeList.length)}</strong> of <strong>{activeList.length}</strong> records
          </span>
          <div className="pagination">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, idx) => (
              <button
                key={idx + 1}
                type="button"
                className={currentPage === idx + 1 ? 'current' : ''}
                onClick={() => setPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ── MODAL 1: ADD / EDIT LOAN ────────────────────────────────────────── */}
      {loanModal && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setLoanModal(null)}
        >
          <form className="user-modal" onSubmit={handleSaveLoan} style={{ maxWidth: '640px' }}>
            <header className="modal-header">
              <div>
                <span>FINANCE / LOAN SCREEN</span>
                <h2>{loanModal.isEdit ? 'Edit Loan Record' : 'Register New Loan'}</h2>
                <p>Configure bank lender, loan terms, sanction amount, interest, and monthly EMI.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setLoanModal(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-grid">
                  {/* Loan No */}
                  <label>
                    Loan No <em>*</em>
                    <input
                      name="loanNo"
                      required
                      defaultValue={loanModal.data.loanNo}
                      placeholder="e.g. LOAN-2026-005"
                      readOnly={loanModal.isEdit}
                      style={loanModal.isEdit ? { background: '#f8fafc', color: '#64748b' } : {}}
                    />
                  </label>

                  {/* Bank / Lender */}
                  <label>
                    Bank / Lender <em>*</em>
                    <input
                      name="bankName"
                      required
                      defaultValue={loanModal.data.bankName}
                      placeholder="e.g. District Cooperative Central Bank"
                      list="bank-suggestions"
                    />
                    <datalist id="bank-suggestions">
                      {COMMON_BANKS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </label>

                  {/* Loan Type */}
                  <label>
                    Loan Type <em>*</em>
                    <select name="loanType" defaultValue={loanModal.data.loanType}>
                      {LOAN_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Sanction Amount */}
                  <label>
                    Sanction Amount (₹) <em>*</em>
                    <input
                      name="sanctionAmount"
                      type="number"
                      min="1000"
                      step="any"
                      required
                      defaultValue={loanModal.data.sanctionAmount}
                      placeholder="e.g. 500000"
                    />
                  </label>

                  {/* Interest Rate */}
                  <label>
                    Interest Rate (% p.a.) <em>*</em>
                    <input
                      name="interestRate"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={loanModal.data.interestRate}
                      placeholder="e.g. 7.0"
                    />
                  </label>

                  {/* EMI */}
                  <label>
                    EMI Amount (₹)
                    <input
                      name="emi"
                      type="number"
                      min="0"
                      step="any"
                      defaultValue={loanModal.data.emi}
                      placeholder="e.g. 42500"
                    />
                  </label>

                  {/* Start Date */}
                  <label>
                    Start Date <em>*</em>
                    <input
                      name="startDate"
                      type="date"
                      required
                      defaultValue={loanModal.data.startDate || todayDate()}
                    />
                  </label>

                  {/* End Date */}
                  <label>
                    End Date <em>*</em>
                    <input
                      name="endDate"
                      type="date"
                      required
                      defaultValue={loanModal.data.endDate}
                    />
                  </label>

                  {/* Outstanding Amount */}
                  <label>
                    Outstanding Amount (₹)
                    <input
                      name="outstandingAmount"
                      type="number"
                      min="0"
                      step="any"
                      defaultValue={loanModal.data.outstandingAmount}
                      placeholder="Defaults to sanction amount if empty"
                    />
                  </label>

                  {/* Status */}
                  <label>
                    Status
                    <select name="status" defaultValue={loanModal.data.status || 'Active'}>
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>

                  {/* Remarks */}
                  <label className="field-wide">
                    Remarks / Purpose
                    <input
                      name="remarks"
                      defaultValue={loanModal.data.remarks || ''}
                      placeholder="e.g. Paddy cultivation seasonal working capital, subsidised interest rate"
                    />
                  </label>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
              <span>All mandatory fields marked with an asterisk (*).</span>
              <div>
                <button type="button" onClick={() => setLoanModal(null)}>
                  Cancel
                </button>
                <button className="save-button" type="submit">
                  {loanModal.isEdit ? 'Save Changes' : 'Register Loan'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {/* ── MODAL 2: ADD / EDIT LOAN PAYMENT ───────────────────────────────── */}
      {paymentModal && (
        <LoanPaymentModal
          isEdit={paymentModal.isEdit}
          initialData={paymentModal.data}
          loans={loans}
          onClose={() => setPaymentModal(null)}
          onSave={handleSavePayment}
          getLoanOutstanding={getLoanOutstanding}
        />
      )}

      {/* ── MODAL 3: VIEW LOAN DETAILS & REPAYMENT LEDGER ──────────────────── */}
      {viewLoanDetails && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setViewLoanDetails(null)}
        >
          <div className="user-modal loan-view-dialog">
            <header className="modal-header">
              <div>
                <span>LOAN SUMMARY &amp; PAYMENT LEDGER</span>
                <h2>{viewLoanDetails.loanNo}</h2>
                <p>{viewLoanDetails.bankName} • {viewLoanDetails.loanType}</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setViewLoanDetails(null)}>
                ×
              </button>
            </header>

            <div className="modal-body">
              {/* Header Card */}
              <div className="loan-view-header-card">
                <div>
                  <small style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Remaining Principal Balance
                  </small>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: getLoanOutstanding(viewLoanDetails) > 0 ? '#b45309' : '#15803d' }}>
                    {formatCurrency(getLoanOutstanding(viewLoanDetails))}
                  </div>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    Out of {formatCurrency(viewLoanDetails.sanctionAmount)} Sanctioned • {formatCurrency(getLoanPaid(viewLoanDetails))} Paid
                  </span>
                </div>

                <span
                  className={`loan-status-badge ${
                    getLoanOutstanding(viewLoanDetails) <= 0
                      ? 'loan-status-closed'
                      : viewLoanDetails.status === 'Active'
                      ? 'loan-status-active'
                      : 'loan-status-overdue'
                  }`}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                >
                  <i /> {viewLoanDetails.status}
                </span>
              </div>

              {/* Detail Grid */}
              <div className="loan-view-grid">
                <div className="loan-view-item">
                  <small>Sanction Amount</small>
                  <strong>{formatCurrency(viewLoanDetails.sanctionAmount)}</strong>
                </div>
                <div className="loan-view-item">
                  <small>Interest Rate</small>
                  <strong>{viewLoanDetails.interestRate}% p.a.</strong>
                </div>
                <div className="loan-view-item">
                  <small>Monthly EMI</small>
                  <strong style={{ color: '#2563eb' }}>{viewLoanDetails.emi ? formatCurrency(viewLoanDetails.emi) : '—'}</strong>
                </div>
                <div className="loan-view-item">
                  <small>Start Date</small>
                  <span>{formatDate(viewLoanDetails.startDate)}</span>
                </div>
                <div className="loan-view-item">
                  <small>Maturity End Date</small>
                  <span>{formatDate(viewLoanDetails.endDate)}</span>
                </div>
                <div className="loan-view-item">
                  <small>Loan Category</small>
                  <span>{viewLoanDetails.loanType}</span>
                </div>
              </div>

              {/* Payment History Sub-table */}
              <div className="loan-history-section">
                <h4>Repayment Ledger ({getLoanPayments(viewLoanDetails.loanNo).length} payments recorded)</h4>
                {getLoanPayments(viewLoanDetails.loanNo).length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <table className="loan-sub-table">
                      <thead>
                        <tr>
                          <th>VOUCHER</th>
                          <th>DATE</th>
                          <th style={{ textAlign: 'right' }}>PRINCIPAL</th>
                          <th style={{ textAlign: 'right' }}>INTEREST</th>
                          <th style={{ textAlign: 'right' }}>TOTAL</th>
                          <th>MODE</th>
                          <th>REF NO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getLoanPayments(viewLoanDetails.loanNo).map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.id}</td>
                            <td>{formatDate(p.paymentDate)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.principal)}</td>
                            <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(p.interest)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                              {formatCurrency(p.totalPayment)}
                            </td>
                            <td>{p.paymentMode}</td>
                            <td style={{ fontFamily: 'monospace' }}>{p.referenceNo || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                    No repayment installments have been logged for this loan yet.
                  </p>
                )}
              </div>
            </div>

            <footer className="modal-footer">
              <span style={{ fontSize: '9px', color: '#64748b' }}>
                Account: {viewLoanDetails.loanNo}
              </span>
              <div>
                <button type="button" onClick={() => setViewLoanDetails(null)}>
                  Close
                </button>
                {viewLoanDetails.status === 'Active' && (
                  <button
                    className="save-button"
                    type="button"
                    onClick={() => {
                      const lNo = viewLoanDetails.loanNo
                      setViewLoanDetails(null)
                      setView('payments')
                      handleOpenAddPayment(lNo)
                    }}
                  >
                    💳 Record Payment
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteConfirm && (
        <div
          className="dialog-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="user-modal confirm-dialog">
            <div className="delete-symbol">!</div>
            <h2>
              Delete {deleteConfirm.type === 'loan' ? 'Loan Record' : 'Loan Payment'}?
            </h2>
            <p>
              Are you sure you want to delete{' '}
              <strong>
                {deleteConfirm.type === 'loan' ? deleteConfirm.item.loanNo : deleteConfirm.item.id}
              </strong>
              ?
              {deleteConfirm.type === 'payment' && (
                <span> This will restore the paid principal of {formatCurrency(deleteConfirm.item.principal)} back to the loan balance.</span>
              )}
            </p>

            <div className="dialog-actions">
              <button type="button" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="delete-button"
                type="button"
                onClick={deleteConfirm.type === 'loan' ? handleDeleteLoan : handleDeletePayment}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="user-toast" role="status">
          <span>✓</span>
          {toast}
          <button type="button" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}

// Subcomponent for Loan Payment Modal with Real-time Auto-Calculation
function LoanPaymentModal({ isEdit, initialData, loans, onClose, onSave, getLoanOutstanding }) {
  const [loanNo, setLoanNo] = useState(initialData.loanNo || loans[0]?.loanNo || '')
  const [paymentDate, setPaymentDate] = useState(initialData.paymentDate || todayDate())
  const [principal, setPrincipal] = useState(initialData.principal || '')
  const [interest, setInterest] = useState(initialData.interest || '')
  const [penalty, setPenalty] = useState(initialData.penalty || 0)
  const [paymentMode, setPaymentMode] = useState(initialData.paymentMode || 'Bank Transfer / NEFT / RTGS')
  const [referenceNo, setReferenceNo] = useState(initialData.referenceNo || '')
  const [remarks, setRemarks] = useState(initialData.remarks || '')

  // Live Auto-calculated Total Payment
  const totalPayment = (Number(principal) || 0) + (Number(interest) || 0) + (Number(penalty) || 0)

  const selectedLoan = loans.find((l) => l.loanNo === loanNo)
  const selectedOutstanding = selectedLoan ? (getLoanOutstanding ? getLoanOutstanding(selectedLoan) : selectedLoan.outstandingAmount) : 0

  // Auto-fill suggestion when loan changes if not editing
  const handleLoanChange = (newLoanNo) => {
    setLoanNo(newLoanNo)
    const target = loans.find((l) => l.loanNo === newLoanNo)
    if (target && !isEdit) {
      if (target.emi) {
        setPrincipal(Math.round(target.emi * 0.85))
        setInterest(Math.round(target.emi * 0.15))
      }
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="user-modal" onSubmit={onSave} style={{ maxWidth: '620px' }}>
        <header className="modal-header">
          <div>
            <span>FINANCE / LOAN PAYMENT</span>
            <h2>{isEdit ? 'Edit Loan Payment' : 'Record Loan Payment'}</h2>
            <p>Log loan installment repayment, principal reduction, interest, and charges.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="form-section">
            <div className="form-grid">
              {/* Loan Selection */}
              <label className="field-wide">
                Select Loan Account <em>*</em>
                <select
                  name="loanNo"
                  value={loanNo}
                  onChange={(e) => handleLoanChange(e.target.value)}
                  required
                >
                  {loans.map((l) => {
                    const lOut = getLoanOutstanding ? getLoanOutstanding(l) : l.outstandingAmount
                    return (
                      <option key={l.loanNo} value={l.loanNo}>
                        {l.loanNo} — {l.bankName} ({l.loanType}) • Outstanding: {formatCurrency(lOut)}
                      </option>
                    )
                  })}
                </select>
                {selectedLoan && (
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#475569' }}>
                    Current Outstanding: <strong style={{ color: '#b45309' }}>{formatCurrency(selectedOutstanding)}</strong> | Standard EMI: <strong style={{ color: '#2563eb' }}>{formatCurrency(selectedLoan.emi)}</strong>
                  </div>
                )}
              </label>

              {/* Payment Date */}
              <label>
                Payment Date <em>*</em>
                <input
                  name="paymentDate"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </label>

              {/* Payment Mode */}
              <label>
                Payment Mode <em>*</em>
                <select
                  name="paymentMode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  required
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              {/* Principal */}
              <label>
                Principal Amount (₹) <em>*</em>
                <input
                  name="principal"
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="e.g. 38000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                />
              </label>

              {/* Interest */}
              <label>
                Interest Amount (₹)
                <input
                  name="interest"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 4500"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                />
              </label>

              {/* Penalty */}
              <label>
                Penalty / Late Fee (₹)
                <input
                  name="penalty"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={penalty}
                  onChange={(e) => setPenalty(e.target.value)}
                />
              </label>

              {/* Total Payment (Auto-Calculated) */}
              <label>
                Total Payment (Auto-Calculated)
                <div className="loan-calc-highlight-box">
                  <small>Principal + Interest + Penalty</small>
                  <strong>{formatCurrency(totalPayment)}</strong>
                </div>
              </label>

              {/* Reference No */}
              <label className="field-wide">
                Reference / Transaction / UTR No
                <input
                  name="referenceNo"
                  placeholder="e.g. UTR-SBIN-892104 or Cheque No #410291"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </label>

              {/* Remarks */}
              <label className="field-wide">
                Payment Remarks
                <input
                  name="remarks"
                  placeholder="e.g. Monthly EMI debit via Net Banking"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <span>Principal reduction will update the loan outstanding balance.</span>
          <div>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="save-button" type="submit">
              {isEdit ? 'Save Changes' : 'Record Payment'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
