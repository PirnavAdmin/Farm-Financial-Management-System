import { useMemo, useState } from 'react'
import './audit log.css'

const auditEntries = [
  { time: '22 Oct 2026, 11:40 AM', user: 'Arjun Mehta', action: 'Updated', module: 'Income', details: 'Income transaction INC-2026-0142 updated.', ip: '192.168.1.14' },
  { time: '22 Oct 2026, 10:25 AM', user: 'Priya Sharma', action: 'Created', module: 'Inventory', details: 'Stock in record SIN-2026-0182 created.', ip: '192.168.1.22' },
  { time: '21 Oct 2026, 04:15 PM', user: 'Arjun Mehta', action: 'Signed in', module: 'Authentication', details: 'User signed in successfully.', ip: '192.168.1.14' },
  { time: '21 Oct 2026, 02:05 PM', user: 'Rahul Verma', action: 'Updated', module: 'Farmers', details: 'Farmer profile details updated.', ip: '192.168.1.31' },
  { time: '20 Oct 2026, 09:45 AM', user: 'Priya Sharma', action: 'Created', module: 'Expenses', details: 'Expense transaction EXP-2026-0097 created.', ip: '192.168.1.22' },
]
function exportCsv(rows) {
  const columns = ['time', 'user', 'action', 'module', 'details', 'ip']
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [columns.map(quote).join(','), ...rows.map((row) => columns.map((column) => quote(row[column])).join(','))].join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  link.download = 'audit-log.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function AuditLog() {
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('All actions')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => auditEntries.filter((entry) => `${entry.time} ${entry.user} ${entry.action} ${entry.module} ${entry.details} ${entry.ip}`.toLowerCase().includes(query.toLowerCase()) && (action === 'All actions' || entry.action === action)), [query, action])
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  return <div className="users-page audit-page">
    <div className="users-title-row"><div><div className="users-eyebrow">SETTINGS <span>/</span> AUDIT LOG</div><h1>Audit Log</h1><p>Review user activity and changes across your organization.</p></div><button className="users-add audit-export" type="button" onClick={() => exportCsv(filtered)}>↓ Export CSV</button></div>
    <div className="users-stats"><article><span className="stat-symbol">▤</span><div><small>LOG ENTRIES</small><strong>{auditEntries.length}</strong><span className="stat-hint">Recent activity</span></div></article><article><span className="stat-symbol active-symbol">◎</span><div><small>USERS RECORDED</small><strong>{new Set(auditEntries.map((entry) => entry.user)).size}</strong><span className="stat-hint">Unique users</span></div></article><article><span className="stat-symbol inactive-symbol">⌕</span><div><small>MATCHING FILTERS</small><strong>{filtered.length}</strong><span className="stat-hint">Current results</span></div></article></div>
    <section className="users-panel"><div className="users-toolbar"><div className="user-search"><span>⌕</span><input aria-label="Search audit log" placeholder="Search user, action, module or details..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div><select aria-label="Filter by action" value={action} onChange={(event) => { setAction(event.target.value); setPage(1) }}><option>All actions</option>{[...new Set(auditEntries.map((entry) => entry.action))].map((value) => <option key={value}>{value}</option>)}</select><button className="reset-button" type="button" onClick={() => { setQuery(''); setAction('All actions'); setPage(1) }}>↻ <span>Reset Filters</span></button></div>
      <div className="users-table-wrap"><table className="users-table audit-table"><thead><tr><th>TIMESTAMP</th><th>USER</th><th>ACTION</th><th>MODULE</th><th>DETAILS</th><th>IP ADDRESS</th></tr></thead><tbody>{pageRows.map((entry, index) => <tr key={`${entry.time}-${index}`}><td className="login-date">{entry.time}</td><td><strong className="audit-user">{entry.user}</strong></td><td><span className={`audit-action ${entry.action.toLowerCase().replace(/\s+/g, '-')}`}>{entry.action}</span></td><td>{entry.module}</td><td className="audit-details">{entry.details}</td><td>{entry.ip}</td></tr>)}{pageRows.length === 0 && <tr><td colSpan="6"><div className="users-empty"><span>⌕</span><strong>No audit entries found</strong><p>Try a different search or action filter.</p><button type="button" onClick={() => { setQuery(''); setAction('All actions') }}>Clear filters</button></div></td></tr>}</tbody></table></div>
      <div className="users-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries</span><div className="pagination"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button>{Array.from({ length: pageCount }, (_, index) => <button type="button" className={currentPage === index + 1 ? 'current' : ''} key={index} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>›</button></div></div>
    </section>
    <div className="users-disclaimer">Demo activity <span>•</span> Audit entries are sample data until an audit API is connected.</div>
  </div>
}
