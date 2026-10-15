import { useState } from 'react'
import './App.css'
import Login from './login.jsx'
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

function App() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('agriman_logged_in') === 'true')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('agriman_user_email') || 'meghanareddybutreddy@gmail.com')
  const [active, setActive] = useState('Dashboard')
  const [expanded, setExpanded] = useState({ Masters: true })
  const [profileOpen, setProfileOpen] = useState(false)
  const userName = userEmail.split('@')[0]
  const userInitials = userName.split(/[._-]/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'AD'

  function handleLogin(email) {
    const nextEmail = email || 'meghanareddybutreddy@gmail.com'
    setUserEmail(nextEmail)
    setLoggedIn(true)
    localStorage.setItem('agriman_logged_in', 'true')
    localStorage.setItem('agriman_user_email', nextEmail)
  }

  function handleLogout() {
    setLoggedIn(false)
    setProfileOpen(false)
    localStorage.removeItem('agriman_logged_in')
  }

  function selectItem(label) {
    setActive(label)
    setProfileOpen(false)
  }

  if (!loggedIn) return <Login onLogin={handleLogin} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={() => selectItem('Dashboard')}>
          <span className="brand-mark">A</span><span className="brand-name">AGRIMAN<small>Farm management</small></span>
        </a>
        <div className="menu-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {menuGroups.map((group) => {
            const isOpen = Boolean(expanded[group.label])
            const isActive = active === group.label || group.children?.includes(active)
            return <div className="menu-group" key={group.label}>
              <button className={`menu-item${isActive ? ' selected' : ''}`} type="button" aria-expanded={group.children ? isOpen : undefined}
                onClick={() => group.children ? setExpanded((current) => ({ ...current, [group.label]: !current[group.label] })) : selectItem(group.label)}>
                <span className="menu-icon" aria-hidden="true">{group.icon}</span><span>{group.label}</span>
                {group.children && <span className={`chevron${isOpen ? ' open' : ''}`} aria-hidden="true">⌄</span>}
              </button>
              {group.children && isOpen && <div className="submenu">{group.children.map((item) =>
                <button className={`submenu-item${active === item ? ' selected' : ''}`} key={item} type="button" onClick={() => selectItem(item)}>
                  <span className="submenu-dot" aria-hidden="true" />{item}
                </button>)}</div>}
            </div>
          })}
        </nav>
        <div className="sidebar-footer"><div className="avatar">{userInitials}</div><div className="user-details"><strong title={userEmail}>{userEmail}</strong><span>Administrator</span></div>
          <button className="more-button logout-button" type="button" aria-label="Sign out" onClick={handleLogout}>↪</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="topbar-actions"><button className="icon-button notification-button" type="button" aria-label="Notifications">♧<i /></button><div className="topbar-divider" />
            <div className="profile-menu-wrap"><button className="profile-trigger" type="button" aria-expanded={profileOpen} aria-label="Account menu" onClick={() => setProfileOpen((open) => !open)}>
              <span className="top-avatar">{userInitials}</span><span className="top-user"><strong>{userName}</strong><span>{userEmail}</span></span><span className="top-chevron">⌄</span>
            </button>{profileOpen && <div className="profile-dropdown"><div className="profile-email">Signed in as<strong>{userEmail}</strong></div><button type="button" onClick={handleLogout}>↪ <span>Log out</span></button></div>}</div>
          </div>
        </header>
        {active === 'Users' ? <Users /> : <section className="page-content">
          {active === 'Dashboard' ? <Dashboard onNavigate={selectItem} /> : <div className="module-view-container"><div className="page-heading"><div>
            <div className="eyebrow">FARM FINANCIAL MANAGEMENT • {active.toUpperCase()}</div><h1>{active}</h1><p>Manage, audit, and analyze {active} data across all farm operations.</p>
          </div><button className="date-filter" type="button" onClick={() => selectItem('Dashboard')}><span>▦</span> Return to Dashboard</button></div>
            <div className="welcome-card"><div className="welcome-copy"><span className="welcome-tag">YOUR FARM, IN GOOD HANDS</span><h2>{active} workspace</h2><p>This section is ready for your farm management records.</p>
              <button type="button" className="primary-button" onClick={() => selectItem('Dashboard')}>View dashboard <span>→</span></button></div></div></div>}
          <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
        </section>}
      </main>
    </div>
  )
}

export default App
