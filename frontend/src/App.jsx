import { useEffect, useState } from 'react'
import './App.css'
import Login from './login.jsx'
import Farmers from './Masters/Farmers/index.jsx'
import Users from './Settings/Users/Users.jsx'
import Dashboard from './Dashboard/Dashboard.jsx'

import Farms from './Masters/Farms/farms.jsx'
import { authRequest } from './auth.js'

import Crops from './Masters/Crops/index.jsx'


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
  const [loggedIn, setLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('agriman_access_token') || sessionStorage.getItem('agriman_access_token'))
  })
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('agriman_user_email') || sessionStorage.getItem('agriman_user_email') || 'User'
  })
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('agriman_user_role') || sessionStorage.getItem('agriman_user_role') || 'User'
  })
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('agriman_user_name')
      || sessionStorage.getItem('agriman_user_name')
      || localStorage.getItem('agriman_user_email')
      || sessionStorage.getItem('agriman_user_email')
      || 'User'
  })
  const [active, setActive] = useState('Dashboard')
  const [expanded, setExpanded] = useState({ Masters: true })
  const [showUserMenu, setShowUserMenu] = useState(false)
  const sidebarCollapsed = false

  useEffect(() => {
    const storage = localStorage.getItem('agriman_access_token') ? localStorage : sessionStorage
    const initialAccessToken = storage.getItem('agriman_access_token')
    if (!initialAccessToken) return undefined

    let mounted = true
    async function restoreSession() {
      try {
        const response = await authRequest('me', { method: 'GET', accessToken: initialAccessToken })
        const user = response.user || response

        if (!mounted) return
        const displayName = user.fullName || user.name || user.email || user.phoneNumber || storage.getItem('agriman_user_email') || 'User'
        const role = user.role || storage.getItem('agriman_user_role') || 'User'
        storage.setItem('agriman_user_email', displayName)
        storage.setItem('agriman_user_name', displayName)
        storage.setItem('agriman_user_role', role)
        setUserEmail(displayName)
        setUserName(displayName)
        setUserRole(role)
        setLoggedIn(true)
      } catch (requestError) {
        if (!mounted) return
        if (requestError.status === 401 || requestError.status === 400) {
          for (const currentStorage of [localStorage, sessionStorage]) {
            currentStorage.removeItem('agriman_access_token')
            currentStorage.removeItem('agriman_refresh_token')
            currentStorage.removeItem('agriman_user_email')
            currentStorage.removeItem('agriman_user_name')
            currentStorage.removeItem('agriman_user_role')
          }
          setLoggedIn(false)
          setUserEmail('User')
          setUserName('User')
          setUserRole('User')
        }
      }
    }

    restoreSession()
    return () => { mounted = false }
  }, [])

  function handleLogin(user, token, rememberMe, identifier) {
    const storage = rememberMe ? localStorage : sessionStorage
    const displayName = user.fullName || user.name || user.email || user.phoneNumber || identifier || 'User'
    const role = user.role || 'User'
    for (const currentStorage of [localStorage, sessionStorage]) {
      currentStorage.removeItem('agriman_access_token')
      currentStorage.removeItem('agriman_refresh_token')
      currentStorage.removeItem('agriman_user_email')
      currentStorage.removeItem('agriman_user_name')
      currentStorage.removeItem('agriman_user_role')
    }
    storage.setItem('agriman_access_token', token)
    storage.setItem('agriman_user_email', displayName)
    storage.setItem('agriman_user_name', user.fullName || user.name || displayName)
    storage.setItem('agriman_user_role', role)
    setUserEmail(displayName)
    setUserName(user.fullName || user.name || displayName)
    setUserRole(role)
    setLoggedIn(true)
  }

  function handleLogout() {
    setLoggedIn(false)
    setShowUserMenu(false)
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem('agriman_access_token')
      storage.removeItem('agriman_refresh_token')
      storage.removeItem('agriman_user_email')
      storage.removeItem('agriman_user_name')
      storage.removeItem('agriman_user_role')
    }
    setUserEmail('User')
    setUserName('User')
    setUserRole('User')
  }

  function selectItem(label) {
    setActive(label)
    setShowUserMenu(false)
  }

  const userInitials = getInitials(userName, userEmail)

  if (!loggedIn) return <Login onLogin={handleLogin} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <a className="brand" href="#dashboard" onClick={() => selectItem('Dashboard')}>
          <img className="brand-mark" src="/agriman-logo.png" alt="AGRIMAN Farm Management" />
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
          <div className="avatar">{userInitials}</div>
          <div className="user-details">
            <strong title={userEmail}>{userEmail}</strong>
            <span>{userRole}</span>
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
                <span>{userRole}</span>
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
        {active === 'Farmers' ? (
          <Farmers />
        ) : active === 'Users' ? (
          <Users />
        ) : active === 'Crops' ? (
          <section className="page-content">
            <Crops initialTab="crops" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Varieties' ? (
          <section className="page-content">
            <Crops initialTab="varieties" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Seasons' ? (
          <section className="page-content">
            <Crops initialTab="seasons" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : (
          <section className="page-content">
            {active === 'Users' ? (
            <Users />
          ) : active === 'Farms' ? (
            <Farms />
          ) : active === 'Dashboard' ? (
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
