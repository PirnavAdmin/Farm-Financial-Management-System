import React from 'react'
import { ChartNoAxesCombined } from 'lucide-react'

// Workspace Small Leaf Icon
export function LeafIcon({ className = '', size = 14, color = '#237A32' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={color}
      strokeWidth="0.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 4 13C4 8 8 3 19 3c0 11-5 15-8 17z" />
      <path d="M11 20c0-5 3-9 8-17" stroke="#FFFDF8" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

// ============================================================================
// MAIN SIDEBAR NAVIGATION ICONS (Outline Style, Stroke 1.8 - 2.0)
// ============================================================================

// 1. Dashboard: 2x2 Rounded Grid Icon
export function DashboardIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

// 2. Masters: Stacked Outline Layers
export function MastersIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

// 3. Agriculture: Outline Sprout / Shoot
export function AgricultureIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22v-9" />
      <path d="M12 13a6 6 0 0 0-6-6c0 3.5 2.5 6 6 6z" />
      <path d="M12 10a6 6 0 0 1 6-6c0 3.5-2.5 6-6 6z" />
    </svg>
  )
}

// 4. Finance: Indian Rupee ₹ Sign
export function FinanceIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 13l8.5 8" />
      <path d="M6 13h3a4 4 0 0 0 0-8" />
    </svg>
  )
}

// 5. Inventory: Archive / Package Box
export function InventoryIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="15" rx="3" />
      <path d="M3 10h18" />
      <path d="M10 14h4" />
    </svg>
  )
}

// 6. Sales: Shopping Cart
export function SalesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21.5 7H7" />
    </svg>
  )
}

// 7. Reports: Lucide ChartNoAxesCombined Icon
export function ReportsIcon({ className = '', size = 18 }) {
  return <ChartNoAxesCombined size={size} className={className} strokeWidth={1.8} aria-hidden="true" />
}

// 8. Notifications: Bell
export function NotificationsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// 9. Settings: Gear / Cog
export function SettingsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Chevrons
export function ChevronDownIcon({ className = '', size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function ChevronUpIcon({ className = '', size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

// ============================================================================
// SUBMENU OUTLINE ICONS (Consistent Minimal Outline Style, Stroke 1.8 - 2.0)
// ============================================================================

// ----------------------------------------------------
// Finance Submenu Icons (EXACT REFERENCE - UNCHANGED)
// ----------------------------------------------------

// Finance: Income (Wallet / Bill)
export function IncomeIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="13" rx="2.5" />
      <path d="M17 12.5a1.5 1.5 0 1 0 0 .1" fill="currentColor" />
      <path d="M2 10h20" />
    </svg>
  )
}

// Finance: Expenses (Stacked Coins)
export function ExpensesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="7" rx="8" ry="3" />
      <path d="M4 7v5c0 1.66 3.58 3 8 3s8-1.34 8-3V7" />
      <path d="M4 12v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" />
    </svg>
  )
}

// Finance: Payments (Curved Outgoing Arrow)
export function PaymentsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 17a9 9 0 0 1 13-7" />
      <polyline points="13 6 20 10 13 14" />
    </svg>
  )
}

// Finance: Receipts (Invoice / Receipt Document)
export function ReceiptsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

// Finance: Loans & Finance (Bank Temple Building)
export function LoansIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 2 7 22 7 12 2" />
      <line x1="5" y1="10" x2="5" y2="18" />
      <line x1="12" y1="10" x2="12" y2="18" />
      <line x1="19" y1="10" x2="19" y2="18" />
      <line x1="2" y1="18" x2="22" y2="18" />
      <line x1="1" y1="21" x2="23" y2="21" />
    </svg>
  )
}

// Finance: Bank Accounts (Card)
export function BankAccountsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  )
}

// ----------------------------------------------------
// Masters Submenu Icons
// ----------------------------------------------------

// Masters: Farmers
export function FarmersIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 11c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      <path d="M2 11h20" />
      <circle cx="12" cy="15" r="3" />
      <path d="M7 21v-1a5 5 0 0 1 10 0v1" />
    </svg>
  )
}

// Masters: Farms
export function FarmsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M9 21V12h6v9" />
      <path d="M9 8h6" />
    </svg>
  )
}

// Masters: Crops / Crop Master
export function CropsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2v20" />
      <path d="M8 6c0 2 2 3 4 3s4-1 4-3-2-3-4-3-4 1-4 3z" />
      <path d="M7 11c0 2 2 3 5 3s5-1 5-3-2-3-5-3-5 1-5 3z" />
      <path d="M8 16c0 2 2 3 4 3s4-1 4-3-2-3-4-3-4 1-4 3z" />
    </svg>
  )
}

// Masters: Crop Varieties
export function CropVarietiesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21V11" />
      <path d="M12 11a5 5 0 0 1 5-5c0 3-2 5-5 5Z" />
      <path d="M12 15a5 5 0 0 0-5-5c0 3 2 5 5 5Z" />
      <circle cx="12" cy="4" r="2" />
    </svg>
  )
}

// Masters: Expense Categories
export function ExpenseCategoriesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      <line x1="12" y1="14" x2="16" y2="14" />
    </svg>
  )
}

// Masters: Income Categories
export function IncomeCategoriesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      <line x1="14" y1="12" x2="14" y2="16" />
      <line x1="12" y1="14" x2="16" y2="14" />
    </svg>
  )
}

// Masters & Inventory: Products / Product Master
export function ProductsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

// Masters: Suppliers
export function SuppliersIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="5" width="13" height="11" rx="1.5" />
      <path d="M14 9h4l3 3v4h-7" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  )
}

// Masters: Buyers
export function BuyersIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 11V7a4 4 0 0 0-8 0v4" />
      <rect x="4" y="11" width="16" height="11" rx="2" />
      <path d="M10 15h4" />
    </svg>
  )
}

// Masters: Labour
export function LabourIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      <path d="M8 3.5h8" />
    </svg>
  )
}

// Masters: Machinery
export function MachineryIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="15" r="5" />
      <path d="M9 17h4l2-8h4v2" />
      <path d="M9 14V9h4" />
    </svg>
  )
}

// ----------------------------------------------------
// Agriculture Submenu Icons
// ----------------------------------------------------

// Agriculture: Crop Season / Crop Seasons
export function CropSeasonIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="16" r="2" />
    </svg>
  )
}

// Agriculture: Crop Activities
export function CropActivitiesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  )
}

// Agriculture: Labour Attendance
export function LabourAttendanceIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="15 11 17 13 21 9" />
    </svg>
  )
}

// Agriculture: Labour Management
export function LabourManagementIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// Agriculture: Machinery Usage
export function MachineryUsageIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ----------------------------------------------------
// Inventory Submenu Icons
// ----------------------------------------------------

// Inventory: Purchases
export function PurchasesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

// Inventory: Stock In
export function StockInIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M12 2v8" />
      <path d="m9 7 3 3 3-3" />
      <path d="M3 13h18" />
    </svg>
  )
}

// Inventory: Stock Out
export function StockOutIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M12 10V2" />
      <path d="m9 5 3-3 3 3" />
      <path d="M3 13h18" />
    </svg>
  )
}

// Inventory: Stock Transfer
export function StockTransferIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
}

// Inventory: Stock Adjustment
export function StockAdjustmentIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <circle cx="4" cy="12" r="2" />
      <circle cx="12" cy="10" r="2" />
      <circle cx="20" cy="14" r="2" />
    </svg>
  )
}

// Inventory: Stock Ledger
export function StockLedgerIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  )
}

// Inventory: Low Stock
export function LowStockIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

// ----------------------------------------------------
// Sales Submenu Icons
// ----------------------------------------------------

// Sales: Sales
export function SalesSubmenuIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

// Sales: Customers
export function CustomersIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// Sales: Receivables
export function ReceivablesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 8 8 12 12 16" />
      <line x1="16" y1="12" x2="8" y2="12" />
    </svg>
  )
}

// ----------------------------------------------------
// Reports Submenu Icons
// ----------------------------------------------------

// Reports: Income Report
export function IncomeReportIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <polyline points="6 10 12 4 18 8" />
    </svg>
  )
}

// Reports: Expense Report
export function ExpenseReportIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="8" y1="17" x2="8" y2="12" />
      <line x1="12" y1="17" x2="12" y2="9" />
      <line x1="16" y1="17" x2="16" y2="7" />
    </svg>
  )
}

// Reports: Crop Profit
export function CropProfitIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v-6" />
      <path d="M12 11a3 3 0 0 1 3-3c0 2-1.5 3-3 3z" />
      <path d="M12 9a3 3 0 0 0-3-3c0 2 1.5 3 3 3z" />
    </svg>
  )
}

// Reports: Farm Profit
export function FarmProfitIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M5 21V11l7-6 7 6v10" />
      <polyline points="9 15 12 12 15 14 18 10" />
    </svg>
  )
}

// Reports: Cash Flow
export function CashFlowIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M21 21v-5h-5" />
    </svg>
  )
}

// Reports: P&L
export function ProfitLossIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m16 16 3-8 3 8a3 3 0 0 1-6 0Z" />
      <path d="m2 16 3-8 3 8a3 3 0 0 1-6 0Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h18" />
    </svg>
  )
}

// Reports: Dashboard Reports
export function DashboardReportsIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}

// ----------------------------------------------------
// Settings Submenu Icons
// ----------------------------------------------------

// Settings: Users
export function UsersIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}

// Settings: Roles
export function RolesIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

// Settings: Company
export function CompanyIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="9.01" y2="6" />
      <line x1="15" y1="6" x2="15.01" y2="6" />
      <line x1="9" y1="10" x2="9.01" y2="10" />
      <line x1="15" y1="10" x2="15.01" y2="10" />
      <line x1="9" y1="14" x2="9.01" y2="14" />
      <line x1="15" y1="14" x2="15.01" y2="14" />
      <path d="M9 22v-4h6v4" />
    </svg>
  )
}

// Settings: Audit Log
export function AuditLogIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="11.5" cy="14.5" r="2.5" />
      <path d="m13.5 16.5 2.5 2.5" />
    </svg>
  )
}

// Generic Submenu Icon Fallback
export function DefaultSubmenuIcon({ className = '', size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Map main menu item to appropriate icon
export function getMainIcon(label) {
  switch (label) {
    case 'Dashboard':
      return DashboardIcon
    case 'Masters':
      return MastersIcon
    case 'Agriculture':
      return AgricultureIcon
    case 'Finance':
      return FinanceIcon
    case 'Inventory':
      return InventoryIcon
    case 'Sales':
      return SalesIcon
    case 'Reports':
      return ReportsIcon
    case 'Notifications':
      return NotificationsIcon
    case 'Settings':
      return SettingsIcon
    default:
      return DashboardIcon
  }
}

// Map child item to appropriate icon
export function getChildIcon(parentLabel, childLabel) {
  // 1. Finance (EXACT UNCHANGED REFERENCE)
  if (parentLabel === 'Finance') {
    switch (childLabel) {
      case 'Income':
        return IncomeIcon
      case 'Expenses':
        return ExpensesIcon
      case 'Payments':
        return PaymentsIcon
      case 'Receipts':
        return ReceiptsIcon
      case 'Loans':
      case 'Loans & Finance':
        return LoansIcon
      case 'Bank Accounts':
        return BankAccountsIcon
      default:
        return DefaultSubmenuIcon
    }
  }

  // 2. Masters
  if (parentLabel === 'Masters') {
    switch (childLabel) {
      case 'Farmers':
        return FarmersIcon
      case 'Farms':
        return FarmsIcon
      case 'Crop Management':
      case 'Crops':
      case 'Crop Master':
        return CropsIcon
      case 'Crop Varieties':
        return CropVarietiesIcon
      case 'Expense Categories':
        return ExpenseCategoriesIcon
      case 'Income Categories':
        return IncomeCategoriesIcon
      case 'Products':
      case 'Product Master':
        return ProductsIcon
      case 'Suppliers':
        return SuppliersIcon
      case 'Buyers':
        return BuyersIcon
      case 'Labour':
        return LabourIcon
      case 'Machinery':
        return MachineryIcon
      default:
        break
    }
  }

  // 3. Agriculture
  if (parentLabel === 'Agriculture') {
    switch (childLabel) {
      case 'Crop Season':
      case 'Crop Seasons':
        return CropSeasonIcon
      case 'Crop Activities':
        return CropActivitiesIcon
      case 'Labour Attendance':
        return LabourAttendanceIcon
      case 'Labour Management':
        return LabourManagementIcon
      case 'Machinery Usage':
        return MachineryUsageIcon
      default:
        break
    }
  }

  // 4. Inventory
  if (parentLabel === 'Inventory') {
    switch (childLabel) {
      case 'Purchases':
        return PurchasesIcon
      case 'Product Master':
      case 'Products':
        return ProductsIcon
      case 'Stock In':
        return StockInIcon
      case 'Stock Out':
        return StockOutIcon
      case 'Stock Transfer':
        return StockTransferIcon
      case 'Stock Adjustment':
        return StockAdjustmentIcon
      case 'Stock Ledger':
        return StockLedgerIcon
      case 'Low Stock':
        return LowStockIcon
      default:
        break
    }
  }

  // 5. Sales
  if (parentLabel === 'Sales') {
    switch (childLabel) {
      case 'Sales':
        return SalesSubmenuIcon
      case 'Customers':
        return CustomersIcon
      case 'Receivables':
        return ReceivablesIcon
      default:
        break
    }
  }

  // 6. Reports
  if (parentLabel === 'Reports') {
    switch (childLabel) {
      case 'Income Report':
        return IncomeReportIcon
      case 'Expense Report':
        return ExpenseReportIcon
      case 'Crop Profit':
        return CropProfitIcon
      case 'Farm Profit':
        return FarmProfitIcon
      case 'Cash Flow':
        return CashFlowIcon
      case 'P&L':
        return ProfitLossIcon
      case 'Dashboard Reports':
        return DashboardReportsIcon
      default:
        break
    }
  }

  // 7. Settings
  if (parentLabel === 'Settings') {
    switch (childLabel) {
      case 'Users':
        return UsersIcon
      case 'Roles':
        return RolesIcon
      case 'Company':
        return CompanyIcon
      case 'Audit Log':
        return AuditLogIcon
      default:
        break
    }
  }

  // Fallback direct match by child name
  switch (childLabel) {
    case 'Farmers': return FarmersIcon
    case 'Farms': return FarmsIcon
    case 'Crops':
    case 'Crop Master': return CropsIcon
    case 'Crop Varieties': return CropVarietiesIcon
    case 'Expense Categories': return ExpenseCategoriesIcon
    case 'Income Categories': return IncomeCategoriesIcon
    case 'Products':
    case 'Product Master': return ProductsIcon
    case 'Suppliers': return SuppliersIcon
    case 'Buyers': return BuyersIcon
    case 'Labour': return LabourIcon
    case 'Machinery': return MachineryIcon
    case 'Crop Season':
    case 'Crop Seasons': return CropSeasonIcon
    case 'Crop Activities': return CropActivitiesIcon
    case 'Labour Attendance': return LabourAttendanceIcon
    case 'Labour Management': return LabourManagementIcon
    case 'Machinery Usage': return MachineryUsageIcon
    case 'Purchases': return PurchasesIcon
    case 'Stock In': return StockInIcon
    case 'Stock Out': return StockOutIcon
    case 'Stock Transfer': return StockTransferIcon
    case 'Stock Adjustment': return StockAdjustmentIcon
    case 'Stock Ledger': return StockLedgerIcon
    case 'Low Stock': return LowStockIcon
    case 'Sales': return SalesSubmenuIcon
    case 'Customers': return CustomersIcon
    case 'Receivables': return ReceivablesIcon
    case 'Income Report': return IncomeReportIcon
    case 'Expense Report': return ExpenseReportIcon
    case 'Crop Profit': return CropProfitIcon
    case 'Farm Profit': return FarmProfitIcon
    case 'Cash Flow': return CashFlowIcon
    case 'P&L': return ProfitLossIcon
    case 'Dashboard Reports': return DashboardReportsIcon
    case 'Users': return UsersIcon
    case 'Roles': return RolesIcon
    case 'Company': return CompanyIcon
    case 'Audit Log': return AuditLogIcon
    case 'Income': return IncomeIcon
    case 'Expenses': return ExpensesIcon
    case 'Payments': return PaymentsIcon
    case 'Receipts': return ReceiptsIcon
    case 'Loans':
    case 'Loans & Finance': return LoansIcon
    case 'Bank Accounts': return BankAccountsIcon
    default: return DefaultSubmenuIcon
  }
}
