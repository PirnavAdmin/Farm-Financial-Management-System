import { useMemo, useState } from 'react'
import './p&l.css'

const reportKind = 'pnl'
const reportTitle = 'P&L'
const descriptions = {
  'Income Report': 'Review income transactions by date, farm, crop, and income type.',
  'Expense Report': 'Review farm expenditure by category, supplier, crop, and date.',
  'Crop Profit': 'Compare income, expenses, and net profit for each crop.',
  'Farm Profit': 'Compare income, expenses, and net profit for each farm.',
  'Cash Flow': 'Review incoming receipts and outgoing payments over time.',
  'P&L': 'Summarize income, expenses, and net profit for the selected period.',
  'Dashboard Reports': 'Review key financial indicators across farm operations.',
}

function readRecords(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}
function amount(value) {
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}
function currency(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}
function dateISO(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const match = value.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
  if (!match) return ''
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[2]) + 1
  return month ? `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}` : ''
}
function buildReport() {
  const income = readRecords('agriman-finance-income-records')
  const expenses = readRecords('agriman-finance-expenses-records')
  const receipts = readRecords('agriman-finance-receipts-records')
  const payments = readRecords('agriman-finance-payments-records')
  const sales = readRecords('agriman-sales-sales')
  const totalIncome = income.reduce((sum, row) => sum + amount(row['Net Amount'] || row.Amount), 0)
  const totalExpenses = expenses.reduce((sum, row) => sum + amount(row.Amount), 0)
  const columns = []
  let rows = []
  if (reportKind === 'income') {
    columns.push('Date', 'Income No', 'Farmer', 'Farm', 'Crop', 'Income Type', 'Net Amount', 'Payment Mode')
    rows = income.map((row) => ({ Date: row.Date || row['Income Date'] || '', 'Income No': row['Income No'] || '', Farmer: row.Farmer || '', Farm: row.Farm || '', Crop: row.Crop || '', 'Income Type': row['Income Type'] || '', 'Net Amount': row['Net Amount'] || row.Amount || '', 'Payment Mode': row['Payment Mode'] || '' }))
  } else if (reportKind === 'expense') {
    columns.push('Expense Date', 'Expense No', 'Farmer', 'Farm', 'Crop', 'Category', 'Supplier', 'Amount')
    rows = expenses.map((row) => ({ 'Expense Date': row['Expense Date'] || row.Date || '', 'Expense No': row['Expense No'] || '', Farmer: row.Farmer || '', Farm: row.Farm || '', Crop: row.Crop || '', Category: row['Expense Category'] || '', Supplier: row.Supplier || '', Amount: row.Amount || '' }))
  } else if (reportKind === 'crop' || reportKind === 'farm') {
    const key = reportKind === 'crop' ? 'Crop' : 'Farm'
    const groups = new Map()
    for (const row of income) { const name = row[key] || 'Unassigned'; const current = groups.get(name) || { Income: 0, Expenses: 0 }; current.Income += amount(row['Net Amount'] || row.Amount); groups.set(name, current) }
    for (const row of expenses) { const name = row[key] || 'Unassigned'; const current = groups.get(name) || { Income: 0, Expenses: 0 }; current.Expenses += amount(row.Amount); groups.set(name, current) }
    columns.push(key, 'Income', 'Expenses', 'Net Profit', 'Profit Margin')
    rows = [...groups.entries()].map(([name, sums]) => ({ [key]: name, Income: currency(sums.Income), Expenses: currency(sums.Expenses), 'Net Profit': currency(sums.Income - sums.Expenses), 'Profit Margin': sums.Income ? `${((sums.Income - sums.Expenses) / sums.Income * 100).toFixed(1)}%` : '0.0%' }))
  } else if (reportKind === 'cashflow') {
    columns.push('Date', 'Flow', 'Party', 'Reference', 'Payment Mode', 'Amount')
    rows = [...receipts.map((row) => ({ Date: row.Date || '', Flow: 'Cash In', Party: row.From || '', Reference: row.Reference || row['Receipt No'] || '', 'Payment Mode': row['Payment Mode'] || '', Amount: row.Amount || '' })), ...payments.map((row) => ({ Date: row.Date || '', Flow: 'Cash Out', Party: row.Party || '', Reference: row['Reference Transaction'] || row['Payment No'] || '', 'Payment Mode': row['Payment Mode'] || '', Amount: row.Amount || '' }))].sort((a, b) => dateISO(b.Date).localeCompare(dateISO(a.Date)))
  } else if (reportKind === 'pnl') {
    const net = totalIncome - totalExpenses
    columns.push('Particulars', 'Amount')
    rows = [{ Particulars: 'Total Income', Amount: currency(totalIncome) }, { Particulars: 'Total Expenses', Amount: currency(totalExpenses) }, { Particulars: 'Net Profit / (Loss)', Amount: currency(net) }]
  } else {
    const totalSales = sales.reduce((sum, row) => sum + amount(row['Net Amount'] || row.Amount), 0)
    columns.push('Indicator', 'Value', 'Details')
    rows = [
      { Indicator: 'Total Income', Value: currency(totalIncome), Details: `${income.length} income records` },
      { Indicator: 'Total Expenses', Value: currency(totalExpenses), Details: `${expenses.length} expense records` },
      { Indicator: 'Net Profit', Value: currency(totalIncome - totalExpenses), Details: 'Income less expenses' },
      { Indicator: 'Sales Value', Value: currency(totalSales), Details: `${sales.length} sales records` },
      { Indicator: 'Cash Receipts', Value: currency(receipts.reduce((sum, row) => sum + amount(row.Amount), 0)), Details: `${receipts.length} receipt records` },
      { Indicator: 'Payments Made', Value: currency(payments.reduce((sum, row) => sum + amount(row.Amount), 0)), Details: `${payments.length} payment records` },
    ]
  }
  const netCash = receipts.reduce((sum, row) => sum + amount(row.Amount), 0) - payments.reduce((sum, row) => sum + amount(row.Amount), 0)
  const topLabel = reportKind === 'expense' ? 'TOTAL EXPENSES' : reportKind === 'cashflow' ? 'CASH RECEIVED' : 'TOTAL INCOME'
  const topValue = reportKind === 'expense' ? totalExpenses : reportKind === 'cashflow' ? receipts.reduce((sum, row) => sum + amount(row.Amount), 0) : totalIncome
  return { columns, rows, totalIncome, totalExpenses, netCash, topLabel, topValue }
}

function exportCsv(columns, rows) {
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [columns.map(quote).join(','), ...rows.map((row) => columns.map((column) => quote(row[column])).join(','))].join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  link.download = `${reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function ProfitLoss() {
  const report = useMemo(() => buildReport(), [])
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const filtered = report.rows.filter((row) => {
    const textMatch = Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase())
    const rowDate = dateISO(row.Date || row['Expense Date'] || row['Sales Date'])
    return textMatch && (!dateFrom || !rowDate || rowDate >= dateFrom) && (!dateTo || !rowDate || rowDate <= dateTo)
  })
  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return <div className="users-page report-screen">
    <div className="users-title-row"><div><div className="users-eyebrow">REPORTS <span>/</span> {reportTitle.toUpperCase()}</div><h1>{reportTitle}</h1><p>{descriptions[reportTitle]}</p></div><button className="users-add report-export" type="button" onClick={() => exportCsv(report.columns, filtered)}>↓ Export CSV</button></div>
    <div className="users-stats"><article><span className="stat-symbol">₹</span><div><small>{report.topLabel}</small><strong>{currency(report.topValue)}</strong><span className="stat-hint">From recorded transactions</span></div></article><article><span className="stat-symbol active-symbol">↗</span><div><small>NET PROFIT</small><strong>{currency(report.totalIncome - report.totalExpenses)}</strong><span className="stat-hint">Income less expenses</span></div></article><article><span className="stat-symbol inactive-symbol">▤</span><div><small>REPORT ROWS</small><strong>{report.rows.length}</strong><span className="stat-hint">Available records</span></div></article></div>
    <section className="users-panel"><div className="users-toolbar report-toolbar"><div className="user-search"><span>⌕</span><input aria-label={`Search ${reportTitle}`} placeholder={`Search ${reportTitle.toLowerCase()}...`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div><label className="report-date-filter">From <input aria-label="From date" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1) }} /></label><label className="report-date-filter">To <input aria-label="To date" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1) }} /></label><button className="reset-button" type="button" onClick={() => { setQuery(''); setDateFrom(''); setDateTo(''); setPage(1) }}>↻ <span>Reset</span></button></div>
      <div className="users-table-wrap"><table className="users-table report-table"><thead><tr>{report.columns.map((column) => <th key={column}>{column.toUpperCase()}</th>)}</tr></thead><tbody>{pageRows.map((row, index) => <tr key={`${reportTitle}-${index}`}>{report.columns.map((column, columnIndex) => <td className={columnIndex === 0 ? 'user-id' : ''} key={column}>{row[column] || '—'}</td>)}</tr>)}{pageRows.length === 0 && <tr><td colSpan={report.columns.length}><div className="users-empty"><span>⌕</span><strong>No report data found</strong><p>Record transactions in Finance to populate this report.</p><button type="button" onClick={() => { setQuery(''); setDateFrom(''); setDateTo('') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> rows</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>
    <div className="users-disclaimer">Report data <span>•</span> Calculated from Finance records saved in this browser.</div>
  </div>
}
