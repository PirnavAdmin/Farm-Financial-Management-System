import React from 'react'
import './Sidebar.css'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  getMainIcon,
  getChildIcon
} from './SidebarIcons'

export const defaultSidebarMenuGroups = [
  { label: 'Dashboard' },
  {
    label: 'Masters',
    children: [
      'Farmers',
      'Farms',
      'Crop Master',
      'Crop Varieties',
      'Expense Categories',
      'Income Categories',
      'Products',
      'Suppliers'
    ]
  },
  {
    label: 'Agriculture',
    children: [
      'Crop Season',
      'Crop Activities',
      'Labour Attendance',
      'Labour Management',
      'Machinery Usage'
    ]
  },
  {
    label: 'Finance',
    children: [
      'Income',
      'Expenses',
      'Payments',
      'Receipts',
      'Loans & Finance',
      'Bank Accounts'
    ]
  },
  {
    label: 'Inventory',
    children: [
      'Purchases',
      'Product Master',
      'Stock In',
      'Stock Out',
      'Stock Transfer',
      'Stock Adjustment',
      'Stock Ledger',
      'Low Stock'
    ]
  },
  {
    label: 'Sales',
    children: ['Sales', 'Customers', 'Receivables']
  },
  {
    label: 'Reports',
    children: [
      'Income Report',
      'Expense Report',
      'Crop Profit',
      'Farm Profit',
      'Cash Flow',
      'P&L',
      'Dashboard Reports'
    ]
  },
  { label: 'Notifications' },
  {
    label: 'Settings',
    children: ['Users', 'Roles', 'Company', 'Audit Log']
  }
]

export default function Sidebar({
  active = 'Dashboard',
  selectItem,
  expanded = {},
  setExpanded,
  sidebarCollapsed = false,
  notificationCount = 3,
  menuGroups = defaultSidebarMenuGroups
}) {
  const isMatchActive = (child) => {
    if (child === active) return true
    if ((child === 'Loans & Finance' || child === 'Loans') && (active === 'Loans' || active === 'Loans & Finance')) {
      return true
    }
    return false
  }

  const handleGroupClick = (group) => {
    if (group.children && group.children.length > 0) {
      if (setExpanded) {
        setExpanded((current) => ({
          ...current,
          [group.label]: !current[group.label]
        }))
      }
    } else {
      if (selectItem) {
        selectItem(group.label)
      }
    }
  }

  const handleSubmenuClick = (child) => {
    if (selectItem) {
      selectItem(child)
    }
  }

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* 1. Branding Header */}
      <div className="sidebar-brand-section">
        <a
          className="sidebar-brand"
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault()
            selectItem && selectItem('Dashboard')
          }}
          title="AGRIMAN - Farm Financial Management"
        >
          <img
            className="sidebar-logo"
            src="/agriman-logo.png"
            alt="AGRIMAN Logo"
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">
              AGRIMAN<sup>®</sup>
            </span>
            <span className="sidebar-brand-sub">Farm Financial Management</span>
          </div>
        </a>
      </div>

      <div className="sidebar-divider" />

      {/* 2. Workspace Label */}
      <div className="sidebar-workspace-header">
        <span className="workspace-text">WORKSPACE</span>
      </div>

      {/* 3. Main Navigation List */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {menuGroups.map((group) => {
          const hasChildren = Boolean(group.children && group.children.length > 0)
          const isOpen = Boolean(expanded[group.label])
          const MainIcon = getMainIcon(group.label)

          // Direct match or one of its children is active
          const isDirectActive = active === group.label
          const hasActiveChild = hasChildren && group.children.some(isMatchActive)

          // State classes
          const isActive = isDirectActive && !hasChildren
          const isExpandedOpen = hasChildren && isOpen

          return (
            <React.Fragment key={group.label}>
              {/* Subtle divider separating Notifications & Settings */}
              {group.label === 'Notifications' && (
                <div className="sidebar-group-divider" />
              )}

              <div className="sidebar-menu-group">
                <button
                  type="button"
                  className={`sidebar-menu-item${isActive ? ' active' : ''}${
                    isExpandedOpen ? ' expanded-open' : ''
                  }${hasActiveChild && !isOpen ? ' has-active-child' : ''}`}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onClick={() => handleGroupClick(group)}
                >
                  <span className="sidebar-item-icon" aria-hidden="true">
                    <MainIcon size={18} />
                  </span>

                  <span className="sidebar-item-label">{group.label}</span>

                  {/* Notifications Badge */}
                  {group.label === 'Notifications' && (
                    <span className="sidebar-badge">{notificationCount}</span>
                  )}

                  {/* Expand/Collapse Chevron */}
                  {hasChildren && (
                    <span className="sidebar-chevron" aria-hidden="true">
                      {isOpen ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                    </span>
                  )}
                </button>

                {/* Submenu Tree */}
                {hasChildren && isOpen && (
                  <div className="sidebar-submenu">
                    {group.children.map((child) => {
                      const isSelected = isMatchActive(child)
                      const ChildIcon = getChildIcon(group.label, child)

                      return (
                        <button
                          type="button"
                          key={child}
                          className={`sidebar-submenu-item${isSelected ? ' selected' : ''}`}
                          onClick={() => handleSubmenuClick(child)}
                        >
                          <span className="sidebar-submenu-icon" aria-hidden="true">
                            <ChildIcon size={18} />
                          </span>
                          <span className="sidebar-submenu-label">{child}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </nav>
    </aside>
  )
}
