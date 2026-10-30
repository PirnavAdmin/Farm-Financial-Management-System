import { useEffect, useState, Component } from 'react'
import './App.css'
import Login from './login.jsx'
import Farmers from './Masters/Farmers/index.jsx'
import Users from './Settings/Users/Users.jsx'
import Dashboard from './Dashboard/Dashboard.jsx'

import Farms from './Masters/Farms/farms.jsx'
import ExpenseCategories from './Masters/Expense Categories/expense categories.jsx'
import IncomeCategories from './Masters/Income Categories/income categories.jsx'
import { authRequest } from './auth.js'

import Crops from './Masters/Crops/index.jsx'
import Income from './Finance/Income/income.jsx'
import Expenses from './Finance/Expenses/expenses.jsx'
import Payments from './Finance/Payments/payments.jsx'
import Receipts from './Finance/Receipts/receipts.jsx'
import Loans from './Finance/Loans/loans.jsx'
import BankAccounts from './Finance/Bank Accounts/bank accounts.jsx'
import Purchases from './Inventory/Purchases/purchases.jsx'
import StockIn from './Inventory/Stock In/stock in.jsx'
import StockOut from './Inventory/Stock Out/stock out.jsx'
import StockAdjustment from './Inventory/Stock Adjustment/stock adjustment.jsx'
import StockLedger from './Inventory/Stock Ledger/stock ledger.jsx'
import Sales from './Sales/Sales/sales.jsx'
import Customers from './Sales/Customers/customers.jsx'
import Receivables from './Sales/Receivables/receivables.jsx'
import CashFlow from './Reports/Cash Flow/cash flow.jsx'
import CropProfit from './Reports/Crop Profit/crop profit.jsx'
import DashboardReports from './Reports/Dashboard Reports/dashboard reports.jsx'
import ExpenseReport from './Reports/Expense Report/expense report.jsx'
import FarmProfit from './Reports/Farm Profit/farm profit.jsx'
import IncomeReport from './Reports/Income Report/income report.jsx'
import ProfitLoss from './Reports/P&L/p&l.jsx'
import AuditLog from './Settings/Audit Log/audit log.jsx'
import Company from './Settings/Company/company.jsx'
import Roles from './Settings/Roles/roles.jsx'


const menuGroups = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Masters', icon: '▤', children: ['Farmers', 'Farms', 'Crop Master', 'Crop Varieties', 'Expense Categories', 'Income Categories', 'Products'] },
  { label: 'Agriculture', icon: '♧', children: ['Crop Season', 'Crop Activities', 'Labour Attendance', 'Machinery Usage'] },
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

class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ModuleErrorBoundary caught error]:', error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.active !== this.props.active && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <section className="page-content">
          <div style={{ padding: '40px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '24px auto', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#1e3325', margin: '0 0 8px', fontSize: '20px' }}>Unable to display {this.props.active}</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '10px 20px', background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Reload View
            </button>
          </div>
          <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
        </section>
      );
    }
    return this.props.children;
  }
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

  function handleLogin(user, token, rememberMe, identifier, refreshToken) {
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
    if (refreshToken) storage.setItem('agriman_refresh_token', refreshToken)
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
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          <div className="topbar-actions">
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
          </div>
        </header>

        <ModuleErrorBoundary active={active}>
        {active === 'Farmers' ? (
          <Farmers />
        ) : active === 'Users' ? (
          <Users />
        ) : active === 'Crop Master' || active === 'Crops' ? (
          <section className="page-content">
            <Crops initialTab="crops" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Varieties' ? (
          <section className="page-content">
            <Crops initialTab="varieties" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Season' || active === 'Crop Seasons' ? (
          <section className="page-content">
            <Crops initialTab="seasons" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : active === 'Crop Activities' ? (
          <section className="page-content">
            <Crops initialTab="activities" onNavigate={selectItem} />
            <footer className="page-footer">© 2026 Agriman <span>Built for the people who grow our future.</span></footer>
          </section>
        ) : (
          <section className="page-content">
            {active === 'Income' ? (
              <Income />
            ) : active === 'Expenses' ? (
              <Expenses />
            ) : active === 'Payments' ? (
              <Payments />
            ) : active === 'Receipts' ? (
              <Receipts />
            ) : active === 'Loans' ? (
              <Loans />
            ) : active === 'Bank Accounts' ? (
              <BankAccounts />
            ) : active === 'Purchases' ? (
              <Purchases />
            ) : active === 'Stock In' ? (
              <StockIn />
            ) : active === 'Stock Out' ? (
              <StockOut />
            ) : active === 'Stock Adjustment' ? (
              <StockAdjustment />
            ) : active === 'Stock Ledger' ? (
              <StockLedger />
            ) : active === 'Sales' ? (
              <Sales />
            ) : active === 'Customers' ? (
              <Customers />
            ) : active === 'Receivables' ? (
              <Receivables />
            ) : active === 'Expense Categories' ? (
              <ExpenseCategories />
            ) : active === 'Income Categories' ? (
              <IncomeCategories />
            ) : active === 'Income Report' ? (
              <IncomeReport />
            ) : active === 'Expense Report' ? (
              <ExpenseReport />
            ) : active === 'Crop Profit' ? (
              <CropProfit />
            ) : active === 'Farm Profit' ? (
              <FarmProfit />
            ) : active === 'Cash Flow' ? (
              <CashFlow />
            ) : active === 'P&L' ? (
              <ProfitLoss />
            ) : active === 'Dashboard Reports' ? (
              <DashboardReports />
            ) : active === 'Roles' ? (
              <Roles />
            ) : active === 'Company' ? (
              <Company />
            ) : active === 'Audit Log' ? (
              <AuditLog />
            ) : active === 'Users' ? (
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
        </ModuleErrorBoundary>
      </main>
    </div>
  )
}

export default App
