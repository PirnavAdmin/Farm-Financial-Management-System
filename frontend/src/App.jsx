import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import Login from './login.jsx'
import Farmers from './Masters/Farmers/index.jsx'
import Users from './Settings/Users/Users.jsx'
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

// All searchable modules strictly from the sidebar menuGroups
const sidebarNavModules = menuGroups.flatMap((group) => {
  const list = [
    {
      name: group.label,
      category: group.label,
      icon: group.icon,
      isParent: true,
      path: group.label
    }
  ]
  if (group.children) {
    group.children.forEach((child) => {
      list.push({
        name: child,
        category: group.label,
        icon: group.icon,
        isParent: false,
        path: `${group.label} → ${child}`
      })
    })
  }
  return list
})

function formatDisplayName(email, customName) {
  if (customName) return customName
  if (!email) return 'Meghana Reddy'
  const prefix = email.split('@')[0]
  if (prefix.toLowerCase().includes('meghana')) return 'Meghana Reddy'
  const parts = prefix.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }
  return prefix.charAt(0).toUpperCase() + prefix.slice(1)
}

function getInitials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) {
    const prefix = email.split('@')[0]
    const parts = prefix.split(/[._-]/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return prefix.slice(0, 2).toUpperCase()
  }
  return 'MR'
}

function App() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('agriman_logged_in') === 'true')
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('agriman_user_email') || 'meghanareddybutreddy@gmail.com'
  })
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('agriman_user_name') || 'Meghana Reddy'
  })
  const [active, setActive] = useState('Dashboard')
  const [expanded, setExpanded] = useState({ Masters: true })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchRef = useRef(null)

  const userInitials = getInitials(userName, userEmail)

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) {
      return sidebarNavModules
    }
    return sidebarNavModules.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  function handleSelectModule(moduleItem) {
    selectItem(moduleItem.name)
    if (!moduleItem.isParent) {
      setExpanded((prev) => ({ ...prev, [moduleItem.category]: true }))
    }
    setSearchQuery('')
    setShowSearchDropdown(false)
  }

  function handleLogin(email, name) {
    const nextEmail = email || 'meghanareddybutreddy@gmail.com'
    const nextName = name || formatDisplayName(nextEmail)
    setUserEmail(nextEmail)
    setUserName(nextName)
    setLoggedIn(true)
    localStorage.setItem('agriman_logged_in', 'true')
    localStorage.setItem('agriman_user_email', nextEmail)
    localStorage.setItem('agriman_user_name', nextName)
  }

  function handleLogout() {
    setLoggedIn(false)
    setShowUserMenu(false)
    setShowNotifications(false)
    localStorage.removeItem('agriman_logged_in')
  }

  function selectItem(label) {
    setActive(label)
    setShowUserMenu(false)
    setShowNotifications(false)
  }

  if (!loggedIn) return <Login onLogin={handleLogin} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <a className="brand" href="#dashboard" onClick={() => selectItem('Dashboard')}>
          <span className="brand-mark">A</span><span className="brand-name">AGRIMAN<small>Farm management</small></span>
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
                  aria-expanded={group.children ? isOpen : undefined}
                  onClick={() => group.children ? setExpanded((current) => ({ ...current, [group.label]: !current[group.label] })) : selectItem(group.label)}
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
                        <span className="submenu-dot" aria-hidden="true" />
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar" style={{ background: '#1d4ed8', color: '#fff', fontWeight: 700 }}>{userInitials}</div>
          <div className="user-details"><strong title={userName}>{userName}</strong><span>Administrator</span></div>
          <button className="more-button logout-button" type="button" aria-label="Sign out" onClick={handleLogout}>↪</button>
        </div>
      </aside>

      <main className="main-content">
        {active === 'Dashboard' ? (
          <header className="topbar dashboard-topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="hamburger-btn"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                aria-label="Toggle navigation"
                title="Toggle sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="topbar-search-wrapper" ref={searchRef}>
                <div className="topbar-search-box">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="topbar-search-input"
                    placeholder="Search dashboard, crops, finance, inventory, reports..."
                    value={searchQuery}
                    onFocus={() => setShowSearchDropdown(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchDropdown(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowSearchDropdown(false)
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showSearchDropdown && (
                  <div className="search-results-dropdown">
                    <div className="search-dropdown-header">
                      <span>{searchQuery.trim() ? `Matching Modules (${filteredModules.length})` : 'Sidebar Modules (Click to Navigate)'}</span>
                    </div>
                    {filteredModules.length > 0 ? (
                      <div className="search-results-list">
                        {filteredModules.map((item) => (
                          <button
                            key={`${item.category}-${item.name}`}
                            type="button"
                            className="search-result-item"
                            onClick={() => handleSelectModule(item)}
                          >
                            <div className="search-result-left">
                              <span className="search-result-icon">{item.icon}</span>
                              <div className="search-result-text">
                                <span className="search-result-name">{item.name}</span>
                                <span className="search-result-category">{item.path}</span>
                              </div>
                            </div>
                            <span className="search-result-arrow">→</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="search-no-results">
                        <p>No sidebar module found matching &ldquo;<strong>{searchQuery}</strong>&rdquo;</p>
                        <small>Available: Crops, Expenses, Purchases, Reports, Farmers, etc.</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="topbar-right">
              <div className="bell-wrapper">
                <button
                  type="button"
                  className="bell-btn"
                  onClick={() => {
                    setShowNotifications((prev) => !prev)
                    setShowUserMenu(false)
                  }}
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span className="bell-badge-dot" />
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown-menu">
                    <div className="notif-dropdown-header">
                      <strong>Notifications</strong>
                      <span className="notif-count-badge">3 New</span>
                    </div>
                    <div className="notif-items-list">
                      <div className="notif-item unread">
                        <span className="notif-icon">🌾</span>
                        <div className="notif-item-body">
                          <strong>Harvest Alert</strong>
                          <p>Field #2 crop cycle is ready for harvest</p>
                          <small>15m ago</small>
                        </div>
                      </div>
                      <div className="notif-item unread">
                        <span className="notif-icon">⚠️</span>
                        <div className="notif-item-body">
                          <strong>Low Stock Warning</strong>
                          <p>DAP Fertilizer stock reached 4 Bags</p>
                          <small>1h ago</small>
                        </div>
                      </div>
                      <div className="notif-item">
                        <span className="notif-icon">💰</span>
                        <div className="notif-item-body">
                          <strong>Payment Received</strong>
                          <p>₹ 1,45,000 received from APMC Mandi</p>
                          <small>3h ago</small>
                        </div>
                      </div>
                    </div>
                    <div className="notif-footer">
                      <button type="button" onClick={() => setShowNotifications(false)}>Mark all as read</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-pill-wrapper">
                <div
                  className="user-pill-card"
                  onClick={() => {
                    setShowUserMenu((prev) => !prev)
                    setShowNotifications(false)
                  }}
                >
                  <div className="pill-avatar-wrap">
                    {userInitials}
                    <span className="avatar-online-dot" />
                  </div>
                  <div className="pill-user-info">
                    <strong className="pill-name">{userName}</strong>
                    <span className="pill-email">{userEmail}</span>
                  </div>
                  <svg
                    className={`pill-chevron ${showUserMenu ? 'open' : ''}`}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="pill-avatar-wrap" style={{ width: '38px', height: '38px', fontSize: '14px' }}>
                        {userInitials}
                        <span className="avatar-online-dot" />
                      </div>
                      <div className="dropdown-user-info">
                        <strong title={userName}>{userName}</strong>
                        <span title={userEmail}>{userEmail}</span>
                        <small className="session-pill">● Active Session</small>
                      </div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <button
                      type="button"
                      className="dropdown-logout-item"
                      onClick={handleLogout}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : (
          <header className="topbar classic-topbar">
            <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
            <div className="topbar-actions">
              <button className="icon-button notification-button" type="button" aria-label="Notifications">♧<i /></button>
              <div className="topbar-divider" />
              <div
                className="topbar-user-area"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowUserMenu((prev) => !prev)}
              >
                <div className="top-avatar" style={{ background: '#1d4ed8', color: '#fff', fontWeight: 700 }}>{userInitials}</div>
                <div className="top-user" style={{ marginLeft: '8px' }}>
                  <strong title={userName}>{userName}</strong>
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
        )}

        {active === 'Farmers' ? (
          <Farmers />
        ) : active === 'Users' ? (
          <Users />
        ) : (
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
                <div className="welcome-card">
                  <div className="welcome-copy">
                    <span className="welcome-tag">YOUR FARM, IN GOOD HANDS</span>
                    <h2>{active} workspace</h2>
                    <p>This section is ready for your farm management records.</p>
                    <button type="button" className="primary-button" onClick={() => selectItem('Dashboard')}>
                      View dashboard <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
