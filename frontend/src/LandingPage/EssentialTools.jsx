import React from 'react';
import './EssentialTools.css';

/* ==========================================================================
   AGRICULTURAL VECTOR ILLUSTRATIONS
   Consistent, premium agricultural vector illustrations with soft halos.
   ========================================================================== */

/**
 * Card 1: Crop Management
 * Green seedling growing from cultivated soil.
 */
function CropManagementIllustration() {
  return (
    <div className="et-illustration-wrapper" aria-hidden="true">
      <svg viewBox="0 0 160 110" width="118" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="halo-crop-inf" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#DCFCE7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mound-grad-inf" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="60%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id="leaf-grad-1-inf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="leaf-grad-2-inf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>

        {/* Soft glowing oval halo */}
        <ellipse cx="80" cy="58" rx="66" ry="34" fill="url(#halo-crop-inf)" />

        {/* Soil mounds and furrow rows */}
        <path d="M16 88 C32 68, 60 56, 80 56 C100 56, 128 68, 144 88 C120 98, 40 98, 16 88 Z" fill="url(#mound-grad-inf)" />
        <path d="M26 86 C40 74, 62 66, 80 66 C98 66, 120 74, 134 86" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        <path d="M38 88 C50 80, 66 74, 80 74 C94 74, 110 80, 122 88" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
        <path d="M48 90 C60 85, 70 82, 80 82 C90 82, 100 85, 112 90" stroke="#CA8A04" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

        {/* Sprout Stem */}
        <path d="M80 62 Q80.5 44 80 28" stroke="#15803D" strokeWidth="4.5" strokeLinecap="round" />

        {/* Left Leaf */}
        <path d="M80 44 C62 36, 44 46, 52 60 C62 68, 77 54, 80 44 Z" fill="url(#leaf-grad-1-inf)" />
        <path d="M80 44 C67 44, 58 52, 54 58" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Right Leaf */}
        <path d="M80 34 C98 24, 118 32, 114 48 C105 58, 88 46, 80 34 Z" fill="url(#leaf-grad-2-inf)" />
        <path d="M80 34 C94 36, 104 42, 110 47" stroke="#14532D" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Center fresh bud */}
        <path d="M80 28 C76 20, 84 20, 80 14 C76 20, 84 20, 80 28 Z" fill="#86EFAC" />
      </svg>
    </div>
  );
}

/**
 * Card 2: Farm & Land Management
 * Farmhouse, trees and cultivated farmland.
 */
function FarmLandIllustration() {
  return (
    <div className="et-illustration-wrapper" aria-hidden="true">
      <svg viewBox="0 0 160 110" width="118" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="halo-land-inf" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#DCFCE7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft glowing oval halo */}
        <ellipse cx="80" cy="58" rx="66" ry="34" fill="url(#halo-land-inf)" />

        {/* Curved Green Farmland plot */}
        <ellipse cx="80" cy="78" rx="60" ry="18" fill="#4ADE80" />
        <ellipse cx="80" cy="81" rx="56" ry="14" fill="#22C55E" />

        {/* Left Tree */}
        <rect x="36" y="56" width="6" height="18" rx="2" fill="#78350F" />
        <circle cx="39" cy="48" r="16" fill="#15803D" />
        <circle cx="37" cy="44" r="12" fill="#22C55E" />

        {/* Right Tree */}
        <rect x="118" y="52" width="7" height="22" rx="2" fill="#78350F" />
        <circle cx="122" cy="42" r="18" fill="#15803D" />
        <circle cx="120" cy="38" r="14" fill="#22C55E" />

        {/* Country Farmhouse */}
        <rect x="52" y="52" width="46" height="24" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
        {/* Door */}
        <rect x="70" y="60" width="10" height="16" rx="1.5" fill="#B45309" />
        <circle cx="78" cy="68" r="1" fill="#FEF3C7" />
        {/* Windows */}
        <rect x="56" y="56" width="9" height="9" rx="1" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="0.8" />
        <line x1="60.5" y1="56" x2="60.5" y2="65" stroke="#1E3A8A" strokeWidth="0.8" />
        <line x1="56" y1="60.5" x2="65" y2="60.5" stroke="#1E3A8A" strokeWidth="0.8" />
        <rect x="85" y="56" width="9" height="9" rx="1" fill="#93C5FD" stroke="#1E3A8A" strokeWidth="0.8" />
        <line x1="89.5" y1="56" x2="89.5" y2="65" stroke="#1E3A8A" strokeWidth="0.8" />
        <line x1="85" y1="60.5" x2="94" y2="60.5" stroke="#1E3A8A" strokeWidth="0.8" />

        {/* Chimney */}
        <rect x="86" y="34" width="6" height="12" rx="1" fill="#DC2626" />
        <path d="M89 32 Q91 26 95 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* Roof */}
        <polygon points="48,52 75,34 102,52" fill="#EA580C" />
        <polygon points="50,52 75,36 100,52" fill="#F97316" />
      </svg>
    </div>
  );
}

/**
 * Card 3: Income & Expenditure
 * Green wallet, gold coins and Indian Rupee symbol (₹).
 */
function IncomeExpenditureIllustration() {
  return (
    <div className="et-illustration-wrapper" aria-hidden="true">
      <svg viewBox="0 0 160 110" width="118" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="halo-income-inf" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#DCFCE7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wallet-grad-inf" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="coin-grad-inf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
        </defs>

        {/* Soft glowing oval halo */}
        <ellipse cx="80" cy="58" rx="66" ry="34" fill="url(#halo-income-inf)" />

        {/* Peeking currency bills */}
        <rect x="44" y="32" width="56" height="20" rx="3" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1" />
        <rect x="48" y="27" width="52" height="20" rx="3" fill="#86EFAC" stroke="#15803D" strokeWidth="1" />

        {/* Green Leather Wallet */}
        <rect x="40" y="36" width="68" height="46" rx="8" fill="url(#wallet-grad-inf)" stroke="#14532D" strokeWidth="1.5" />
        <path d="M40 44 C40 38 46 36 52 36 L96 36 C102 36 108 38 108 44 L108 50 C108 55 102 58 96 58 L52 58 C46 58 40 55 40 50 Z" fill="#16A34A" />
        <line x1="44" y1="40" x2="104" y2="40" stroke="#86EFAC" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
        <circle cx="98" cy="47" r="3.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />

        {/* Back coin */}
        <ellipse cx="106" cy="68" rx="14" ry="14" fill="#CA8A04" />
        <circle cx="106" cy="67" r="13" fill="url(#coin-grad-inf)" stroke="#A16207" strokeWidth="1" />

        {/* Front Golden Rupee Coin */}
        <ellipse cx="116" cy="64" rx="18" ry="18" fill="#B45309" />
        <circle cx="116" cy="63" r="17" fill="url(#coin-grad-inf)" stroke="#A16207" strokeWidth="1.2" />
        <circle cx="116" cy="63" r="14.5" stroke="#FEF08A" strokeWidth="1" strokeDasharray="2 1.5" fill="none" opacity="0.8" />
        <text x="116" y="69" fontSize="18" fontWeight="800" fill="#78350F" textAnchor="middle" fontFamily="sans-serif">₹</text>

        {/* Little green leaves */}
        <path d="M128 36 C136 32 142 36 140 44 C132 46 126 42 128 36 Z" fill="#22C55E" />
        <path d="M34 50 C26 48 24 54 28 60 C34 58 36 54 34 50 Z" fill="#4ADE80" />
      </svg>
    </div>
  );
}

/**
 * Card 4: Purchase & Sales
 * Shopping cart containing agricultural produce and produce sack.
 */
function PurchaseSalesIllustration() {
  return (
    <div className="et-illustration-wrapper" aria-hidden="true">
      <svg viewBox="0 0 160 110" width="118" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="halo-cart-inf" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#DCFCE7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sack-grad-inf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Soft glowing oval halo */}
        <ellipse cx="80" cy="58" rx="66" ry="34" fill="url(#halo-cart-inf)" />

        {/* Green Shopping Cart */}
        <path d="M30 36 L40 36 L52 68 L86 68 L94 44 L44 44" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="50" y1="52" x2="90" y2="52" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        <line x1="53" y1="60" x2="84" y2="60" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        <line x1="62" y1="44" x2="60" y2="68" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        <line x1="74" y1="44" x2="72" y2="68" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        <line x1="86" y1="44" x2="82" y2="68" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        <circle cx="56" cy="76" r="5" fill="#14532D" />
        <circle cx="56" cy="76" r="2" fill="#86EFAC" />
        <circle cx="82" cy="76" r="5" fill="#14532D" />
        <circle cx="82" cy="76" r="2" fill="#86EFAC" />

        {/* Harvest Burlap Sack */}
        <path d="M96 52 C92 42 100 36 108 34 C116 36 124 42 120 52 C124 64 126 78 122 82 C116 86 100 86 94 82 C90 78 92 64 96 52 Z" fill="url(#sack-grad-inf)" stroke="#92400E" strokeWidth="1.2" />
        <ellipse cx="108" cy="44" rx="8" ry="3" fill="#78350F" />
        <path d="M106 46 L104 52 M110 46 L112 52" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M108 58 V72" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M108 62 C104 60 102 62 104 65 C106 64 108 63 108 62 Z" fill="#FFFFFF" />
        <path d="M108 62 C112 60 114 62 112 65 C110 64 108 63 108 62 Z" fill="#FFFFFF" />
        <path d="M108 66 C104 64 102 66 104 69 C106 68 108 67 108 66 Z" fill="#FFFFFF" />
        <path d="M108 66 C112 64 114 66 112 69 C110 68 108 67 108 66 Z" fill="#FFFFFF" />

        {/* Small leaf */}
        <path d="M124 50 C130 46 136 48 134 54 C128 56 124 54 124 50 Z" fill="#22C55E" />
      </svg>
    </div>
  );
}

/**
 * Card 5: Inventory & Machinery
 * Green tractor with yellow wheels and machinery gear.
 */
function InventoryMachineryIllustration() {
  return (
    <div className="et-illustration-wrapper" aria-hidden="true">
      <svg viewBox="0 0 160 110" width="118" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="halo-tractor-inf" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#DCFCE7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft glowing oval halo */}
        <ellipse cx="80" cy="58" rx="66" ry="34" fill="url(#halo-tractor-inf)" />

        {/* Machinery Gear in background */}
        <g transform="translate(108, 40)" opacity="0.85">
          <circle cx="0" cy="0" r="14" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="6" fill="#FFFFFF" stroke="#16A34A" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="-2.5"
              y="-18"
              width="5"
              height="5"
              rx="1"
              fill="#16A34A"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>

        {/* Green Agricultural Tractor */}
        <rect x="52" y="32" width="3" height="14" rx="1" fill="#1E293B" />
        <path d="M52 32 Q50 28 46 28" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 54 L72 54 L72 44 L50 44 Q46 44 46 54 Z" fill="#16A34A" stroke="#14532D" strokeWidth="1" />
        <rect x="46" y="48" width="6" height="5" rx="1" fill="#FDE047" />

        {/* Cabin */}
        <path d="M72 54 L94 54 L92 36 L74 36 Z" fill="#BAE6FD" stroke="#14532D" strokeWidth="1.5" opacity="0.85" />
        <rect x="70" y="33" width="26" height="4" rx="2" fill="#16A34A" stroke="#14532D" strokeWidth="1" />
        <path d="M76 56 C76 46 98 46 98 56" stroke="#15803D" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Wheels */}
        <circle cx="54" cy="68" r="11" fill="#1E293B" />
        <circle cx="54" cy="68" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
        <circle cx="54" cy="68" r="3" fill="#1E293B" />

        <circle cx="88" cy="64" r="17" fill="#1E293B" />
        <circle cx="88" cy="64" r="11" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
        <circle cx="88" cy="64" r="4.5" fill="#1E293B" />
      </svg>
    </div>
  );
}

/**
 * Card 6: Farm Analytics
 * Green analytics bar chart with upward growth arrow and leaf.
 */
function FarmAnalyticsIllustration() {
  return (
    <div className="et-illustration-wrapper" aria-hidden="true">
      <svg viewBox="0 0 160 110" width="118" height="78" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="halo-chart-inf" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#DCFCE7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft glowing oval halo */}
        <ellipse cx="80" cy="58" rx="66" ry="34" fill="url(#halo-chart-inf)" />

        {/* Baseline */}
        <line x1="42" y1="84" x2="118" y2="84" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

        {/* Ascending Green Bars */}
        <rect x="48" y="66" width="11" height="18" rx="2.5" fill="#86EFAC" stroke="#4ADE80" strokeWidth="1" />
        <rect x="64" y="54" width="11" height="30" rx="2.5" fill="#4ADE80" stroke="#22C55E" strokeWidth="1" />
        <rect x="80" y="42" width="11" height="42" rx="2.5" fill="#22C55E" stroke="#16A34A" strokeWidth="1" />
        <rect x="96" y="28" width="11" height="56" rx="2.5" fill="#15803D" stroke="#14532D" strokeWidth="1" />

        {/* Upward Growth Arrow */}
        <path d="M44 68 Q72 52 108 22" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M100 21 L112 20 L110 32" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Leaf */}
        <path d="M112 18 C120 14 126 18 124 24 C118 26 114 22 112 18 Z" fill="#22C55E" />
      </svg>
    </div>
  );
}

/* ==========================================================================
   FEATURE CARD DATA (Showcase Only)
   ========================================================================== */
const FEATURE_CARDS = [
  {
    id: 'crop-management',
    title: 'Crop Management',
    description: 'Manage crop details, cultivation activities and crop-related records.',
    illustration: <CropManagementIllustration />,
  },
  {
    id: 'farm-land',
    title: 'Farm & Land Management',
    description: 'Maintain farm information, land details and property records.',
    illustration: <FarmLandIllustration />,
  },
  {
    id: 'income-expenditure',
    title: 'Income & Expenditure',
    description: 'Record farming income and expenses and monitor financial transactions.',
    illustration: <IncomeExpenditureIllustration />,
  },
  {
    id: 'purchase-sales',
    title: 'Purchase & Sales',
    description: 'Organize agricultural purchases, sales and transaction records.',
    illustration: <PurchaseSalesIllustration />,
  },
  {
    id: 'inventory-machinery',
    title: 'Inventory & Machinery',
    description: 'Maintain inventory records and organize agricultural machinery details.',
    illustration: <InventoryMachineryIllustration />,
  },
  {
    id: 'farm-analytics',
    title: 'Farm Analytics',
    description: 'Review farm performance through organized summaries, charts and reports.',
    illustration: <FarmAnalyticsIllustration />,
  },
];

/* ==========================================================================
   SUB-COMPONENT: FeatureCard (Non-Clickable Promotional Showcase Card)
   - Dimensions: 230px wide × 310px tall, 24px border radius
   - Wrapped in dedicated outer .et-card-item for separate transform layers
   - Scales smoothly to scale(1.06) on hover without pausing the carousel
   ========================================================================== */
/* ==========================================================================
   DECORATIVE ELEMENTS: Corner Foliage & Bottom Waves
   Matching the reference banner styling with subtle agricultural accents.
   ========================================================================== */

function CornerLeavesLeft() {
  return (
    <div className="et-corner-leaves-left" aria-hidden="true">
      <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="et-leaf-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id="et-leaf-med" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="et-leaf-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        {/* Vine stem */}
        <path d="M-20 -10 Q50 30 100 65 Q140 85 180 75" stroke="#166534" strokeWidth="2.8" strokeLinecap="round" opacity="0.65" />
        {/* Leaves cluster */}
        <path d="M-10 -15 C25 15 42 50 36 72 C52 45 58 15 28 -5 Z" fill="url(#et-leaf-dark)" />
        <path d="M36 10 C68 28 88 60 80 82 C98 55 100 22 70 6 Z" fill="url(#et-leaf-med)" />
        <path d="M78 30 C114 42 140 75 134 94 C150 70 148 35 116 22 Z" fill="url(#et-leaf-light)" />
        <path d="M125 58 C155 68 174 92 170 108 C182 88 174 62 148 52 Z" fill="url(#et-leaf-med)" />
        <path d="M152 64 C175 68 194 84 192 96 C200 82 192 62 172 58 Z" fill="url(#et-leaf-light)" />
        <circle cx="20" cy="18" r="3" fill="#86EFAC" opacity="0.8" />
        <circle cx="70" cy="35" r="2.5" fill="#86EFAC" opacity="0.8" />
      </svg>
    </div>
  );
}

function CornerLeavesRight() {
  return (
    <div className="et-corner-leaves-right" aria-hidden="true">
      <svg width="220" height="140" viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="et-leaf-dark-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id="et-leaf-med-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="et-leaf-light-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <g transform="scale(-1, 1) translate(-220, 0)">
          {/* Vine stem */}
          <path d="M-20 -10 Q50 30 100 65 Q140 85 180 75" stroke="#166534" strokeWidth="2.8" strokeLinecap="round" opacity="0.65" />
          {/* Leaves cluster */}
          <path d="M-10 -15 C25 15 42 50 36 72 C52 45 58 15 28 -5 Z" fill="url(#et-leaf-dark-r)" />
          <path d="M36 10 C68 28 88 60 80 82 C98 55 100 22 70 6 Z" fill="url(#et-leaf-med-r)" />
          <path d="M78 30 C114 42 140 75 134 94 C150 70 148 35 116 22 Z" fill="url(#et-leaf-light-r)" />
          <path d="M125 58 C155 68 174 92 170 108 C182 88 174 62 148 52 Z" fill="url(#et-leaf-med-r)" />
          <path d="M152 64 C175 68 194 84 192 96 C200 82 192 62 172 58 Z" fill="url(#et-leaf-light-r)" />
          <circle cx="20" cy="18" r="3" fill="#86EFAC" opacity="0.8" />
          <circle cx="70" cy="35" r="2.5" fill="#86EFAC" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

function SectionBottomWaves() {
  return (
    <div className="et-section-bottom-waves" aria-hidden="true">
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 32 C320 12 720 52 1120 22 C1260 12 1360 20 1440 26 L1440 64 L0 64 Z" fill="rgba(167, 243, 208, 0.45)" />
        <path d="M0 40 C360 22 760 56 1160 30 C1290 20 1380 28 1440 34 L1440 64 L0 64 Z" fill="#22C55E" opacity="0.85" />
        <path d="M0 46 C400 32 800 58 1200 38 C1310 32 1390 36 1440 42 L1440 64 L0 64 Z" fill="#16A34A" />
      </svg>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: FeatureCard (Non-Clickable Promotional Showcase Card)
   - Width: 230px, Height: 310px, Border Radius: 24px
   - Wrapped in dedicated outer .et-card-item for separate transform layers
   - Scales smoothly to scale(1.06) on hover without pausing the carousel
   ========================================================================== */
function FeatureCard({ card }) {
  return (
    <div className="et-card-item">
      <article className="et-card" aria-label={card.title}>
        {/* Agricultural Illustration with soft halo platform */}
        <div className="et-card-top-visual">
          {card.illustration}
        </div>

        {/* Card Content */}
        <div className="et-card-body">
          <h3 className="et-card-title">{card.title}</h3>
          <p className="et-card-desc">{card.description}</p>
        </div>

        {/* Layered Green Decorative Wave at bottom */}
        <div className="et-card-wave" aria-hidden="true">
          <svg viewBox="0 0 230 40" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 20 C60 6 120 32 175 16 C200 10 220 20 230 20 L230 40 L0 40 Z" fill="rgba(167, 243, 208, 0.65)" />
            <path d="M0 26 C55 14 115 34 170 24 C195 18 215 26 230 26 L230 40 L0 40 Z" fill="#22C55E" />
            <path d="M0 33 C70 24 140 36 200 30 L230 32 L230 40 L0 40 Z" fill="#16A34A" />
          </svg>
        </div>
      </article>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT: EssentialTools
   - Continuous seamless infinite horizontal carousel from Right to Left
   - Constant linear movement (never pauses or stops on hover)
   - Individual cards scale independently (scale(1.06)) when hovered
   - Original clean luminous background (no farmland/tractor photo)
   - Decorative corner leaves & bottom waves
   - No individual card buttons, no carousel arrows
   ========================================================================== */
export default function EssentialTools() {
  return (
    <section id="features" className="essential-tools-section" aria-label="Essential Tools">
      {/* Decorative foliage in top corners */}
      <CornerLeavesLeft />
      <CornerLeavesRight />

      <div className="et-content-container">
        {/* ====================================================================
            SECTION HEADER
            ==================================================================== */}
        <div className="et-section-header">
          {/* Small label with horizontal green accent lines: — ESSENTIAL TOOLS — */}
          <div className="et-kicker-wrap">
            <span className="et-kicker-line" aria-hidden="true" />
            <span className="et-kicker-text">ESSENTIAL TOOLS</span>
            <span className="et-kicker-line" aria-hidden="true" />
          </div>

          {/* Main Heading with "Farm Needs" highlighted and subtle leaf accent */}
          <h2 className="et-main-heading">
            <span>Everything Your</span>{' '}
            <span className="et-heading-highlight">Farm Needs</span>
            <svg className="et-heading-leaf-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 18 C8 8, 18 4, 22 4 C22 14, 14 20, 4 18 Z" fill="#22C55E" />
              <path d="M4 18 Q12 12 22 4" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 20 C16 14, 21 12, 23 10 C23 16, 18 21, 12 20 Z" fill="#86EFAC" />
            </svg>
          </h2>

          {/* Description */}
          <p className="et-subtitle">
            Essential tools to manage your agricultural operations in one place.
          </p>
        </div>

        {/* ====================================================================
            CONTINUOUS INFINITE MARQUEE CAROUSEL
            - Seamless right-to-left linear movement (42s duration)
            - Continues moving without interruption during card hover
            - Buffer groups guarantee seamless infinite looping across all screens
            ==================================================================== */}
        <div className="et-marquee-viewport" role="region" aria-label="Continuous Essential Tools Showcase">
          <div className="et-marquee-track">
            {/* Group 1: Base Sequence */}
            <div className="et-marquee-group">
              {FEATURE_CARDS.map((card, idx) => (
                <FeatureCard key={`g1-${card.id}-${idx}`} card={card} />
              ))}
            </div>

            {/* Group 2: Seamless Duplicate */}
            <div className="et-marquee-group" aria-hidden="true">
              {FEATURE_CARDS.map((card, idx) => (
                <FeatureCard key={`g2-${card.id}-${idx}`} card={card} />
              ))}
            </div>

            {/* Group 3: Extra Wide Screen Buffer */}
            <div className="et-marquee-group" aria-hidden="true">
              {FEATURE_CARDS.map((card, idx) => (
                <FeatureCard key={`g3-${card.id}-${idx}`} card={card} />
              ))}
            </div>

            {/* Group 4: Ultra-Wide Screen Buffer */}
            <div className="et-marquee-group" aria-hidden="true">
              {FEATURE_CARDS.map((card, idx) => (
                <FeatureCard key={`g4-${card.id}-${idx}`} card={card} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Layered decorative waves at the bottom of the section */}
      <SectionBottomWaves />
    </section>
  );
}
