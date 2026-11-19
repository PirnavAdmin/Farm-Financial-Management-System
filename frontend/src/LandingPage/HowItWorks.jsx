import React from 'react';
import './HowItWorks.css';

/* ==========================================================================
   VECTOR BACKGROUND ELEMENTS
   High-fidelity vector illustrations recreating the approved reference image:
   - Top-left hanging green foliage
   - Top-right soft concentric green wave arcs
   - Bottom-left illustrated farm scenery (crop furrows, farmhouse, windmill, trees)
   - Bottom full-width layered rolling waves
   - Bottom-right corner leaves
   ========================================================================== */

/**
 * Top-Left Hanging Foliage
 */
function TopLeftLeaves() {
  return (
    <div className="hiw-corner-leaves-tl" aria-hidden="true">
      <svg width="220" height="140" viewBox="0 0 260 200" preserveAspectRatio="xMinYMin meet" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hiw-leaf-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id="hiw-leaf-grad-mid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="hiw-leaf-grad-bright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        {/* Main vine stem */}
        <path d="M-20 -10 Q50 35 110 80 Q150 110 200 95" stroke="#14532D" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        <path d="M40 30 Q70 65 85 110" stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
        <path d="M100 75 Q125 115 130 150" stroke="#166534" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />

        {/* Leaves Cluster */}
        <path d="M-15 -10 C25 20 40 60 30 90 C50 55 55 20 20 -5 Z" fill="url(#hiw-leaf-grad-dark)" />
        <path d="M-5 -2 Q25 35 30 90" stroke="#14532D" strokeWidth="1" opacity="0.4" />

        <path d="M25 15 C45 45 42 95 20 130 C48 105 60 60 45 20 Z" fill="url(#hiw-leaf-grad-mid)" />
        <path d="M30 20 Q42 70 20 130" stroke="#14532D" strokeWidth="1" opacity="0.4" />

        <path d="M42 25 C80 45 105 85 95 115 C118 78 120 35 80 12 Z" fill="url(#hiw-leaf-grad-bright)" />
        <path d="M46 26 Q85 62 95 115" stroke="#15803D" strokeWidth="1.2" opacity="0.5" />

        <path d="M75 55 C98 85 95 140 70 175 C102 145 116 95 95 60 Z" fill="url(#hiw-leaf-grad-dark)" />
        <path d="M80 60 Q94 115 70 175" stroke="#14532D" strokeWidth="1" opacity="0.4" />

        <path d="M95 70 C140 85 170 125 160 148 C180 115 175 75 135 60 Z" fill="url(#hiw-leaf-grad-mid)" />
        <path d="M100 72 Q142 105 160 148" stroke="#15803D" strokeWidth="1.2" opacity="0.5" />

        <path d="M120 105 C145 130 145 170 128 195 C152 170 160 135 140 108 Z" fill="url(#hiw-leaf-grad-bright)" />
        <path d="M150 90 C185 95 210 115 205 130 C218 112 210 88 185 82 Z" fill="url(#hiw-leaf-grad-mid)" />
        <path d="M180 92 C205 95 228 108 226 120 C234 105 224 88 205 84 Z" fill="url(#hiw-leaf-grad-bright)" />
      </svg>
    </div>
  );
}

/**
 * Top-Right Concentric Arcs / Rings
 */
function TopRightRings() {
  return (
    <div className="hiw-corner-rings-tr" aria-hidden="true">
      <svg width="450" height="350" viewBox="0 0 450 350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="450" cy="0" r="160" fill="rgba(167, 243, 208, 0.35)" />
        <circle cx="450" cy="0" r="230" fill="none" stroke="rgba(187, 247, 208, 0.45)" strokeWidth="48" />
        <circle cx="450" cy="0" r="310" fill="none" stroke="rgba(220, 252, 231, 0.6)" strokeWidth="36" />
        <circle cx="450" cy="0" r="390" fill="none" stroke="rgba(240, 253, 244, 0.75)" strokeWidth="24" />
      </svg>
    </div>
  );
}

/**
 * Bottom-Left Illustrated Farm Landscape
 * Rolling hills with yellow-green furrowed crop rows, farmhouse, windmill, and orchard trees.
 */
function BottomLeftLandscape() {
  return (
    <div className="hiw-farm-landscape-bl" aria-hidden="true">
      <svg width="480" height="240" viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hiw-hill-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="45%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="hiw-furrow-row" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#FACC15" />
            <stop offset="80%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="hiw-roof-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <radialGradient id="hiw-tree-crown-1" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="65%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </radialGradient>
          <radialGradient id="hiw-tree-crown-2" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="55%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </radialGradient>
        </defs>

        {/* Soft background green mound behind house */}
        <ellipse cx="260" cy="190" rx="36" ry="14" fill="#86EFAC" opacity="0.6" />
        <ellipse cx="110" cy="188" rx="42" ry="16" fill="#86EFAC" opacity="0.5" />

        {/* Rolling Cultivated Hill with Crop Furrows */}
        <path
          d="M-20 185 Q100 160 220 178 Q340 195 480 235 L480 240 L-20 240 Z"
          fill="url(#hiw-hill-base)"
        />

        {/* Curved Yellow-Green Crop Furrow Lines */}
        <path d="M-10 198 Q100 174 230 192 Q340 208 460 238" stroke="url(#hiw-furrow-row)" strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
        <path d="M-10 209 Q95 186 220 204 Q330 220 440 240" stroke="url(#hiw-furrow-row)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        <path d="M-10 220 Q90 198 210 216 Q310 230 420 240" stroke="url(#hiw-furrow-row)" strokeWidth="2.8" strokeLinecap="round" opacity="0.75" />
        <path d="M-10 230 Q85 210 190 226 Q280 238 380 240" stroke="url(#hiw-furrow-row)" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />

        {/* Trees on the left */}
        <rect x="22" y="156" width="6" height="28" rx="2" fill="#78350F" />
        <circle cx="25" cy="148" r="17" fill="url(#hiw-tree-crown-1)" />
        <circle cx="21" cy="142" r="11" fill="url(#hiw-tree-crown-2)" opacity="0.85" />

        <rect x="74" y="148" width="7" height="34" rx="2" fill="#78350F" />
        <path d="M72 165 Q66 174 58 178" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="78" cy="136" r="23" fill="url(#hiw-tree-crown-1)" />
        <circle cx="64" cy="144" r="16" fill="url(#hiw-tree-crown-2)" />
        <circle cx="92" cy="144" r="15" fill="url(#hiw-tree-crown-1)" />
        <circle cx="76" cy="128" r="14" fill="url(#hiw-tree-crown-2)" opacity="0.9" />

        {/* Country Farmhouse */}
        <rect x="122" y="152" width="60" height="30" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
        <rect x="166" y="152" width="16" height="30" rx="1" fill="#FDE68A" />

        <rect x="132" y="130" width="7" height="15" rx="1" fill="#B45309" />
        <rect x="130" y="129" width="11" height="3" rx="1" fill="#78350F" />

        <polygon points="115,152 152,130 189,152" fill="url(#hiw-roof-grad)" />
        <polygon points="152,130 189,152 184,154 152,133" fill="#9A3412" />

        <rect x="129" y="158" width="9" height="9" rx="1" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" />
        <line x1="133.5" y1="158" x2="133.5" y2="167" stroke="#D97706" strokeWidth="0.8" />
        <line x1="129" y1="162.5" x2="138" y2="162.5" stroke="#D97706" strokeWidth="0.8" />

        <rect x="167" y="158" width="8" height="9" rx="1" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" />
        <line x1="171" y1="158" x2="171" y2="167" stroke="#D97706" strokeWidth="0.8" />

        <rect x="146" y="162" width="10" height="20" rx="1.5" fill="#FFFFFF" stroke="#B45309" strokeWidth="1" />
        <circle cx="153" cy="172" r="1" fill="#B45309" />
        <circle cx="152" cy="144" r="3.5" fill="#FFFFFF" stroke="#B45309" strokeWidth="0.8" />

        {/* Tree right of house */}
        <rect x="204" y="154" width="6" height="26" rx="2" fill="#78350F" />
        <circle cx="207" cy="145" r="19" fill="url(#hiw-tree-crown-1)" />
        <circle cx="203" cy="140" r="13" fill="url(#hiw-tree-crown-2)" opacity="0.9" />

        {/* Small shrub on right */}
        <ellipse cx="230" cy="176" rx="14" ry="9" fill="#16A34A" />
        <ellipse cx="242" cy="178" rx="11" ry="7" fill="#22C55E" />

        {/* Windmill / Windpump Tower */}
        <line x1="228" y1="176" x2="235" y2="128" stroke="#475569" strokeWidth="1.8" />
        <line x1="246" y1="176" x2="239" y2="128" stroke="#475569" strokeWidth="1.8" />
        <line x1="229.5" y1="166" x2="244.5" y2="166" stroke="#64748B" strokeWidth="1.2" />
        <line x1="231.5" y1="152" x2="242.5" y2="152" stroke="#64748B" strokeWidth="1.2" />
        <line x1="233.5" y1="138" x2="240.5" y2="138" stroke="#64748B" strokeWidth="1.2" />
        <line x1="229.5" y1="166" x2="242.5" y2="152" stroke="#94A3B8" strokeWidth="1" />
        <line x1="244.5" y1="166" x2="231.5" y2="152" stroke="#94A3B8" strokeWidth="1" />
        <line x1="231.5" y1="152" x2="240.5" y2="138" stroke="#94A3B8" strokeWidth="1" />
        <line x1="242.5" y1="152" x2="233.5" y2="138" stroke="#94A3B8" strokeWidth="1" />
        <rect x="233" y="126" width="8" height="3" rx="0.5" fill="#334155" />

        {/* Rotating Fan Turbine Blades */}
        <circle cx="237" cy="120" r="14" fill="none" stroke="#EA580C" strokeWidth="1.2" opacity="0.4" />
        <circle cx="237" cy="120" r="3" fill="#C2410C" />
        <line x1="237" y1="106" x2="237" y2="134" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="223" y1="120" x2="251" y2="120" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="227" y1="110" x2="247" y2="130" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="247" y1="110" x2="227" y2="130" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M240 120 L256 116 L256 124 Z" fill="#C2410C" stroke="#9A3412" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

/**
 * Bottom Full-Width Layered Rolling Waves
 */
function BottomRollingWaves() {
  return (
    <div className="hiw-bottom-rolling-waves" aria-hidden="true">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hiw-wave-grad-front" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#137C20" />
          </linearGradient>
          <linearGradient id="hiw-wave-grad-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        {/* Back wave with translucent highlight */}
        <path
          d="M0 65 C260 20 540 85 860 45 C1100 15 1300 50 1440 60 L1440 120 L0 120 Z"
          fill="rgba(167, 243, 208, 0.45)"
        />
        {/* Middle vibrant wave */}
        <path
          d="M0 78 C300 35 600 95 920 55 C1150 25 1320 62 1440 72 L1440 120 L0 120 Z"
          fill="url(#hiw-wave-grad-mid)"
        />
        {/* Front deep wave */}
        <path
          d="M0 90 C340 55 640 102 960 70 C1180 42 1340 75 1440 82 L1440 120 L0 120 Z"
          fill="url(#hiw-wave-grad-front)"
        />
      </svg>
    </div>
  );
}

/**
 * Bottom-Right Corner Leaves
 */
function BottomRightLeaves() {
  return (
    <div className="hiw-corner-leaves-br" aria-hidden="true">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hiw-br-leaf-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="hiw-br-leaf-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>
        <path d="M210 170 Q160 130 130 80" stroke="#166534" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M185 145 C150 110 125 50 130 20 C155 45 185 95 195 135 Z" fill="url(#hiw-br-leaf-2)" />
        <path d="M185 145 Q150 75 130 20" stroke="#14532D" strokeWidth="1.2" opacity="0.4" />
        <path d="M190 120 C140 95 100 65 85 45 C115 50 155 75 185 105 Z" fill="url(#hiw-br-leaf-1)" />
        <path d="M195 150 C165 135 145 120 135 110 C155 115 180 130 195 145 Z" fill="url(#hiw-br-leaf-2)" />
      </svg>
    </div>
  );
}

/* ==========================================================================
   CARD DECORATIVE ELEMENTS: Wave & Sprout
   ========================================================================== */

function CardBottomWave() {
  return (
    <div className="hiw-card-wave" aria-hidden="true">
      <svg viewBox="0 0 255 46" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 24 C60 10 130 36 195 18 C225 10 245 22 255 22 L255 46 L0 46 Z" fill="rgba(167, 243, 208, 0.55)" />
        <path d="M0 30 C70 18 140 38 205 26 C230 20 245 30 255 30 L255 46 L0 46 Z" fill="#22C55E" opacity="0.8" />
        <path d="M0 36 C80 24 150 42 215 34 C235 28 250 36 255 36 L255 46 L0 46 Z" fill="#15803D" />
      </svg>
    </div>
  );
}

function CardSprout() {
  return (
    <div className="hiw-card-sprout" aria-hidden="true">
      <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 32 Q16 22 22 14" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 20 C10 16 2 20 6 28 C12 30 18 24 18 20 Z" fill="#22C55E" />
        <path d="M22 14 C28 6 38 10 36 20 C30 24 23 18 22 14 Z" fill="#4ADE80" />
        <path d="M22 14 C20 8 26 8 24 4 C20 8 24 10 22 14 Z" fill="#86EFAC" />
      </svg>
    </div>
  );
}

function ConnectingArrow() {
  return (
    <div className="hiw-connecting-arrow-badge" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </div>
  );
}

/**
 * Sub-Component: WorkflowCard
 * Recreated exactly to match the approved reference design:
 * - 255px wide × 370px tall, 28px rounded corners, pure white background
 * - 54px dark forest-green circular badge overlapping top center with thick white border
 * - 68px × 68px light-green rounded icon square with outline green icon
 * - Centered bold navy title & regular grey description
 * - Dual-layer green bottom wave + small sprout on bottom-right
 */
function WorkflowCard({ stepNumber, icon, title, description }) {
  return (
    <div className="hiw-workflow-card">
      {/* Top Numbered Circle Badge overlapping top edge */}
      <div className="hiw-card-badge" aria-label={`Step ${stepNumber}`}>
        <span>{stepNumber}</span>
      </div>

      {/* Light-green rounded square icon container */}
      <div className="hiw-icon-container" aria-hidden="true">
        {icon}
      </div>

      {/* Titles: bold navy */}
      <h3 className="hiw-card-title">{title}</h3>

      {/* Description */}
      <p className="hiw-card-desc">{description}</p>

      {/* Custom light-green dual wave at bottom of card */}
      <CardBottomWave />

      {/* Decorative sprout at bottom right */}
      <CardSprout />
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT: HowItWorks
   Recreating the approved reference image with pure vector fidelity:
   - Soft cream/pale-green gradient background
   - Vector farm landscape, leaves, waves & concentric circles
   - Left intro section & 3 workflow cards with connecting arrows
   ========================================================================== */
export default function HowItWorks({ onNavigateToLogin }) {
  return (
    <section id="how-it-works" className="how-it-works-section" aria-label="How AGRIMAN Works">
      {/* Scalable Vector Backdrop (Leaves, Rings, Landscape, Rolling Waves) */}
      <div className="hiw-svg-backdrop" aria-hidden="true">
        <TopLeftLeaves />
        <TopRightRings />
        <BottomLeftLandscape />
        <BottomRollingWaves />
        <BottomRightLeaves />
      </div>

      <div className="section-container hiw-relative-container">
        <div className="hiw-layout-grid">
          {/* Left Column: Introduction */}
          <div className="hiw-left-column">
            <div className="hiw-kicker-wrap">
              <span className="hiw-kicker-text">THE AGRIMAN PROCESS</span>
              <span className="hiw-kicker-line" aria-hidden="true" />
            </div>

            <h2 className="hiw-main-heading">
              How <span className="hiw-brand-highlight">AGRIMAN</span> Works
            </h2>

            <p className="hiw-description">
              Get started in three simple steps and bring your farm operations online.
            </p>
          </div>

          {/* Right Column: Three Workflow Cards & Connecting Arrows */}
          <div className="hiw-right-column">
            {/* CARD 1: Register */}
            <WorkflowCard
              stepNumber="1"
              title="Register"
              description="Create your AGRIMAN account and set up your farm profile."
              icon={
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />

            {/* Connecting Arrow 1 -> 2 */}
            <ConnectingArrow />

            {/* CARD 2: Add Farm Details */}
            <WorkflowCard
              stepNumber="2"
              title="Add Farm Details"
              description="Add your farm information, land details, crops and operational records."
              icon={
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              }
            />

            {/* Connecting Arrow 2 -> 3 */}
            <ConnectingArrow />

            {/* CARD 3: Manage & View Reports */}
            <WorkflowCard
              stepNumber="3"
              title="Manage & View Reports"
              description="Track farm activities, financial transactions and performance reports."
              icon={
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="14" width="4" height="7" rx="1" />
                  <rect x="10" y="10" width="4" height="11" rx="1" />
                  <rect x="17" y="6" width="4" height="15" rx="1" />
                  <path d="M3 10L10 5L17 3L21 3" />
                  <path d="M18 3L21 3L21 6" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
