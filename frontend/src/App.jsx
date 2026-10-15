import { useState } from 'react'
import './App.css'
import Login from './login.jsx'
import Dashboard from './Dashboard/Dashboard.jsx'

const menuGroups = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Masters', icon: '▤', children: ['Farmers', 'Farms', 'Crops', 'Crop Varieties', 'Expense Categories', 'Income Categories', 'Products'] },
  { label: 'Agriculture', icon: '♧', children: ['Crop Seasons', 'Crop Activities', 'Labour Attendance', 'Machinery Usage'] },
  { label: 'Finance', icon: '₹', children: ['Income', 'Expenses', 'Payments', 'Receipts', 'Loans', 'Bank Accounts'] },
  { label: 'Inventory', icon: '▣', children: ['Purchases', 'Stock In', 'Stock Out', 'Stock Adjustment', 'Stock Ledger'] },
  { label: 'Sales', icon: '▱', children: ['Sales', 'Customers', 'Receivables'] },
  { label: 'Reports', icon: '▥', children: ['Income Report', 'Expense Report', 'Crop Profit', 'Farm Profit', 'Cash Flow', 'P&L', 'Dashboard Reports'] },
  { label: 'Notifications', icon: '♧' },
  { label: 'Settings', icon: '⚙', children: ['Users', 'Roles', 'Company', 'Audit Log'] },
]

function getInitials(email) {
  if (!email) return 'AD'
  const namePart = email.split('@')[0]
  const parts = namePart.split(/[._-]/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return namePart.slice(0, 2).toUpperCase()
}

function App() {
  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem('agriman_logged_in') === 'true'
  })
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('agriman_user_email') || 'meghanareddybutreddy@gmail.com'
  })
  const [active, setActive] = useState('Dashboard')
  const [expanded, setExpanded] = useState({ Masters: true })
  const [showUserMenu, setShowUserMenu] = useState(false)

  function handleLogin(email) {
    const mail = email || 'meghanareddybutreddy@gmail.com'
    setUserEmail(mail)
    setLoggedIn(true)
    localStorage.setItem('agriman_logged_in', 'true')
    localStorage.setItem('agriman_user_email', mail)
  }

  function handleLogout() {
    setLoggedIn(false)
    setShowUserMenu(false)
    localStorage.removeItem('agriman_logged_in')
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />
  }

  function selectItem(label) {
    setActive(label)
  }

  function toggleGroup(groupLabel) {
    setExpanded((current) => ({
      // accordion: keep only the clicked group open, close others to avoid vertical overflow
      [groupLabel]: !current[groupLabel]
    }))
  }

  const userInitials = getInitials(userEmail)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={() => selectItem('Dashboard')}>
          <span className="brand-mark">A</span>
          <span className="brand-name">AGRIMAN<small>Farm management</small></span>
        </a>
        <div className="menu-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {menuGroups.map((group) => {
            const isOpen = Boolean(expanded[group.label])
            const isActive = active === group.label || group.children?.includes(active)
            return (
              <div className="menu-group" key={group.label}>
                <button
                  className={`menu-item${isActive ? ' selected' : ''}`}
                  type="button"
                  aria-expanded={group.children ? Boolean(isOpen) : undefined}
                  onClick={() => group.children ? toggleGroup(group.label) : selectItem(group.label)}
                >
                  <span className="menu-icon" aria-hidden="true">{group.icon}</span>
                  <span>{group.label}</span>
                  {group.children && <span className={`chevron${isOpen ? ' open' : ''}`} aria-hidden="true">⌄</span>}
                </button>
                {group.children && isOpen && (
                  <div className="submenu">
                    {group.children.map((item) => (
                      <button
                        className={`submenu-item${active === item ? ' selected' : ''}`}
                        key={item}
                        type="button"
                        onClick={() => selectItem(item)}
                      >
                        <span className="submenu-dot" aria-hidden="true" />{item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{userInitials}</div>
          <div className="user-details">
            <strong title={userEmail}>{userEmail}</strong>
            <span>Administrator</span>
          </div>
          <button className="more-button logout-button" type="button" aria-label="Sign out" title="Sign out" onClick={handleLogout}>↪</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notifications">♧<i /></button>
            <div className="topbar-divider" />
            <div
              className="topbar-user-area"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <div className="top-avatar">{userInitials}</div>
              <div className="top-user" style={{ marginLeft: '8px' }}>
                <strong title={userEmail}>{userEmail}</strong>
                <span>Administrator</span>
              </div>
              <span className="top-chevron" style={{ marginLeft: '6px' }}>⌄</span>

              {showUserMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '42px',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    padding: '8px 0',
                    minWidth: '180px',
                    zIndex: 100
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{userEmail}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>● Active Session</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      fontSize: '12px',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>↪</span> Sign out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="top-logout-link"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: '8px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              title="Sign out"
            >
              Sign out ↪
            </button>
          </div>
        </header>

        <section className="page-content">
          {active === 'Dashboard' ? (
            <Dashboard onNavigate={selectItem} />
          ) : (
            <div className="module-view-container">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">FARM FINANCIAL MANAGEMENT • {active.toUpperCase()}</div>
                  <h1>{active}</h1>
                  <p>Manage, audit, and analyze {active} data across all farm operations.</p>
                </div>
                <button className="date-filter" type="button" onClick={() => selectItem('Dashboard')}>
                  <span>▦</span> Return to Dashboard
                </button>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '36px 24px',
                  textAlign: 'center',
                  marginTop: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🌱</div>
                <h3 style={{ margin: '0 0 6px', color: '#111827', fontSize: '18px' }}>{active} Workspace Active</h3>
                <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '13px' }}>
                  All records for {active} are synchronized with the central farm accounting system.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => selectItem('Dashboard')}
                >
                  View Dashboard Summary <span>→</span>
                </button>
              </div>
            </div>
          )}

          <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
        </section>
      </main>
    </div>
  )
}

export default App
