import React from 'react';
import './Footer.css';

/* ==========================================================================
   VECTOR BACKGROUND & LANDSCAPE ILLUSTRATIONS
   Recreating the reference visual target:
   - CTA Banner right-side agricultural landscape (sunrise, farmhouse, windmill, furrows)
   - CTA Banner corner foliage & center leaf accent
   - CTA Banner layered bottom waves
   - Column 3 Agricultural Operations landscape panel with small green tractor
   ========================================================================== */

/**
 * Top-Left Foliage branch on CTA Banner
 */
function CtaTopLeftLeaves() {
  return (
    <div className="cta-corner-leaves-tl" aria-hidden="true">
      <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cta-leaf-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="cta-leaf-mid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="cta-leaf-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BBF7D0" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
        {/* Vine stem */}
        <path d="M-20 -10 Q50 35 110 80 Q150 110 200 95" stroke="#14532D" strokeWidth="2.8" strokeLinecap="round" opacity="0.8" />
        {/* Leaves */}
        <path d="M-10 -15 C25 15 42 50 36 72 C52 45 58 15 28 -5 Z" fill="url(#cta-leaf-dark)" />
        <path d="M36 10 C68 28 88 60 80 82 C98 55 100 22 70 6 Z" fill="url(#cta-leaf-mid)" />
        <path d="M78 30 C114 42 140 75 134 94 C150 70 148 35 116 22 Z" fill="url(#cta-leaf-light)" />
        <path d="M125 58 C155 68 174 92 170 108 C182 88 174 62 148 52 Z" fill="url(#cta-leaf-mid)" />
        <path d="M152 64 C175 68 194 84 192 96 C200 82 192 62 172 58 Z" fill="url(#cta-leaf-light)" />
      </svg>
    </div>
  );
}

/**
 * Centered decorative foliage accent above the CTA heading: — 🍃 —
 */
function CtaCenterFoliage() {
  return (
    <div className="cta-center-foliage-wrap" aria-hidden="true">
      <span className="cta-foliage-line" />
      <svg className="cta-foliage-leaves" width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left leaf */}
        <path d="M18 18 C14 10 6 6 2 10 C2 18 10 20 18 18 Z" fill="#4ADE80" />
        <path d="M18 18 Q10 12 2 10" stroke="#166534" strokeWidth="1.2" strokeLinecap="round" />
        {/* Right leaf */}
        <path d="M18 18 C22 8 30 4 34 8 C34 16 26 20 18 18 Z" fill="#86EFAC" />
        <path d="M18 18 Q26 10 34 8" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span className="cta-foliage-line" />
    </div>
  );
}

/**
 * CTA Banner Right-Side Agricultural Landscape Illustration
 * Glowing sunrise, fluffy cloud, rolling hills with yellow-green furrow rows,
 * country farmhouse, trees, and windpump tower.
 */
function CtaLandscapeIllustration() {
  return (
    <div className="cta-landscape-backdrop" aria-hidden="true">
      <svg width="540" height="320" viewBox="0 0 540 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glowing sunrise radial gradient */}
          <radialGradient id="cta-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="35%" stopColor="#FDE047" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#FACC15" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>
          {/* Rolling hills gradients */}
          <linearGradient id="cta-hill-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="cta-hill-fore" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="60%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          {/* Furrow row stroke colors */}
          <linearGradient id="cta-furrow-row" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#84CC16" />
          </linearGradient>
        </defs>

        {/* ----------------- SUNRISE AURA & DISC ----------------- */}
        <circle cx="360" cy="145" r="115" fill="url(#cta-sun-glow)" />
        <circle cx="360" cy="145" r="54" fill="#FEF08A" />

        {/* ----------------- FLUFFY CLOUD ----------------- */}
        <g opacity="0.95">
          <ellipse cx="445" cy="78" rx="28" ry="14" fill="#FFFFFF" />
          <ellipse cx="468" cy="74" rx="20" ry="16" fill="#FFFFFF" />
          <ellipse cx="430" cy="80" rx="18" ry="12" fill="#FFFFFF" />
          <rect x="415" y="78" width="68" height="14" rx="7" fill="#FFFFFF" />
        </g>

        {/* ----------------- DISTANT BACKGROUND HILL ----------------- */}
        <path
          d="M160 210 Q260 140 380 160 Q460 175 540 210 L540 320 L160 320 Z"
          fill="url(#cta-hill-back)"
          opacity="0.85"
        />

        {/* ----------------- FOREGROUND CULTIVATED HILL & FURROWS ----------------- */}
        <path
          d="M60 260 Q190 185 340 205 Q440 220 540 255 L540 320 L60 320 Z"
          fill="url(#cta-hill-fore)"
        />

        {/* Curved Yellow-Green Furrow Rows sweeping into the foreground */}
        <path d="M70 274 Q200 200 350 218 Q450 232 540 262" stroke="url(#cta-furrow-row)" strokeWidth="3.6" strokeLinecap="round" opacity="0.9" />
        <path d="M70 288 Q205 214 360 232 Q460 245 540 274" stroke="url(#cta-furrow-row)" strokeWidth="3.4" strokeLinecap="round" opacity="0.85" />
        <path d="M70 302 Q210 228 370 246 Q470 258 540 286" stroke="url(#cta-furrow-row)" strokeWidth="3.2" strokeLinecap="round" opacity="0.75" />
        <path d="M70 316 Q215 242 380 260 Q480 272 540 298" stroke="url(#cta-furrow-row)" strokeWidth="3" strokeLinecap="round" opacity="0.65" />

        {/* ----------------- TREES LEFT OF HOUSE ----------------- */}
        <rect x="252" y="166" width="6" height="24" rx="2" fill="#78350F" />
        <circle cx="255" cy="158" r="16" fill="#15803D" />
        <circle cx="251" cy="152" r="11" fill="#4ADE80" opacity="0.85" />

        <rect x="294" y="160" width="7" height="28" rx="2" fill="#78350F" />
        <circle cx="297" cy="150" r="21" fill="#15803D" />
        <circle cx="286" cy="155" r="14" fill="#22C55E" />
        <circle cx="308" cy="155" r="13" fill="#16A34A" />
        <circle cx="297" cy="142" r="12" fill="#86EFAC" opacity="0.9" />

        {/* ----------------- COUNTRY FARMHOUSE ----------------- */}
        {/* House Walls */}
        <rect x="338" y="162" width="54" height="26" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
        <rect x="376" y="162" width="16" height="26" rx="1" fill="#FDE68A" />

        {/* Chimney */}
        <rect x="346" y="142" width="6" height="14" rx="1" fill="#B45309" />
        <rect x="344" y="141" width="10" height="3" rx="1" fill="#78350F" />

        {/* Terracotta Gabled Roof */}
        <polygon points="332,162 365,142 398,162" fill="#EA580C" />
        <polygon points="365,142 398,162 394,164 365,145" fill="#9A3412" />

        {/* Windows */}
        <rect x="344" y="168" width="8" height="8" rx="1" fill="#FFFFFF" stroke="#D97706" strokeWidth="0.9" />
        <line x1="348" y1="168" x2="348" y2="176" stroke="#D97706" strokeWidth="0.8" />
        <line x1="344" y1="172" x2="352" y2="172" stroke="#D97706" strokeWidth="0.8" />

        <rect x="378" y="168" width="7" height="8" rx="1" fill="#FFFFFF" stroke="#D97706" strokeWidth="0.9" />

        {/* Door */}
        <rect x="358" y="172" width="9" height="16" rx="1.5" fill="#FFFFFF" stroke="#B45309" strokeWidth="1" />
        <circle cx="364" cy="180" r="0.9" fill="#B45309" />

        {/* Attic small circular window */}
        <circle cx="365" cy="154" r="3" fill="#FFFFFF" stroke="#B45309" strokeWidth="0.8" />

        {/* ----------------- TREES RIGHT OF HOUSE ----------------- */}
        <rect x="408" y="165" width="6" height="22" rx="2" fill="#78350F" />
        <circle cx="411" cy="156" r="16" fill="#15803D" />
        <circle cx="407" cy="151" r="11" fill="#4ADE80" opacity="0.9" />

        {/* ----------------- WINDMILL / WINDPUMP TOWER ----------------- */}
        {/* Lattice Truss Legs */}
        <line x1="430" y1="184" x2="437" y2="136" stroke="#475569" strokeWidth="1.8" />
        <line x1="448" y1="184" x2="441" y2="136" stroke="#475569" strokeWidth="1.8" />
        {/* Horizontal Struts */}
        <line x1="431.5" y1="174" x2="446.5" y2="174" stroke="#64748B" strokeWidth="1.2" />
        <line x1="433.5" y1="160" x2="444.5" y2="160" stroke="#64748B" strokeWidth="1.2" />
        <line x1="435.5" y1="146" x2="442.5" y2="146" stroke="#64748B" strokeWidth="1.2" />
        {/* Cross Bracing */}
        <line x1="431.5" y1="174" x2="444.5" y2="160" stroke="#94A3B8" strokeWidth="1" />
        <line x1="446.5" y1="174" x2="433.5" y2="160" stroke="#94A3B8" strokeWidth="1" />
        <line x1="433.5" y1="160" x2="442.5" y2="146" stroke="#94A3B8" strokeWidth="1" />
        <line x1="444.5" y1="160" x2="435.5" y2="146" stroke="#94A3B8" strokeWidth="1" />
        {/* Platform */}
        <rect x="435" y="134" width="8" height="3" rx="0.5" fill="#334155" />

        {/* Turbine Blades & Wheel */}
        <circle cx="439" cy="128" r="14" fill="none" stroke="#EA580C" strokeWidth="1.2" opacity="0.4" />
        <circle cx="439" cy="128" r="3" fill="#C2410C" />
        <line x1="439" y1="114" x2="439" y2="142" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="425" y1="128" x2="453" y2="128" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="429" y1="118" x2="449" y2="138" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="449" y1="118" x2="429" y2="138" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
        {/* Tail Vane */}
        <path d="M442 128 L458 124 L458 132 Z" fill="#C2410C" stroke="#9A3412" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

/**
 * Layered Bottom Waves of CTA Banner
 */
function CtaBottomWaves() {
  return (
    <div className="cta-bottom-waves" aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0 40 C320 12 720 55 1100 24 C1260 12 1360 22 1440 28 L1440 80 L0 80 Z"
          fill="rgba(167, 243, 208, 0.45)"
        />
        <path
          d="M0 52 C360 24 760 62 1140 34 C1290 22 1380 32 1440 38 L1440 80 L0 80 Z"
          fill="#22C55E"
          opacity="0.85"
        />
        <path
          d="M0 64 C400 36 800 68 1180 44 C1310 34 1390 42 1440 48 L1440 80 L0 80 Z"
          fill="#16A34A"
        />
      </svg>
    </div>
  );
}

/**
 * Column 3 Landscape Panel: Farmland with green tractor in center
 * Optimized compact height (105px, ~19% reduction)
 */
function OperationsLandscapePanel() {
  return (
    <div className="footer-operations-card" aria-hidden="true">
      <svg width="100%" height="105" viewBox="0 0 360 105" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="op-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="70%" stopColor="#F0FDF4" />
            <stop offset="100%" stopColor="#DCFCE7" />
          </linearGradient>
          <linearGradient id="op-hill-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="op-field" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="360" height="105" fill="url(#op-sky)" />

        {/* Distant Hills */}
        <path d="M0 64 Q90 42 180 54 Q270 38 360 60 L360 105 L0 105 Z" fill="url(#op-hill-back)" opacity="0.6" />

        {/* Foreground Cultivated Farmland */}
        <path d="M0 72 Q90 58 180 65 Q270 54 360 70 L360 105 L0 105 Z" fill="url(#op-field)" />

        {/* Yellow-Green Crop Furrows */}
        <path d="M0 80 Q90 67 180 74 Q270 63 360 80" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        <path d="M0 89 Q90 76 180 83 Q270 72 360 89" stroke="#FACC15" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
        <path d="M0 98 Q90 85 180 92 Q270 81 360 98" stroke="#84CC16" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />

        {/* Left Orchard Tree */}
        <rect x="42" y="62" width="3.5" height="14" rx="1" fill="#78350F" />
        <circle cx="44" cy="57" r="12" fill="#15803D" />
        <circle cx="41" cy="53" r="8" fill="#4ADE80" opacity="0.85" />

        {/* Right Orchard Tree */}
        <rect x="312" y="62" width="3.5" height="14" rx="1" fill="#78350F" />
        <circle cx="314" cy="57" r="12" fill="#15803D" />
        <circle cx="311" cy="53" r="8" fill="#4ADE80" opacity="0.85" />

        {/* ----------------- SMALL GREEN TRACTOR IN CENTER ----------------- */}
        <g transform="translate(162, 53)">
          {/* Tractor Engine Hood & Cabin */}
          <rect x="14" y="10" width="16" height="11" rx="2" fill="#16A34A" />
          <path d="M30 14h2v7h-2z" fill="#15803D" />
          {/* Exhaust Pipe */}
          <rect x="25" y="4" width="2" height="7" rx="0.5" fill="#334155" />
          {/* Cabin Framework */}
          <path d="M4 8 L14 8 L14 19 L4 19 Z" fill="#22C55E" opacity="0.85" />
          <rect x="2" y="7" width="13" height="2" rx="0.5" fill="#14532D" />
          {/* Cabin Window */}
          <rect x="6" y="9.5" width="6.5" height="6.5" rx="1" fill="#E0F2FE" />
          {/* Driver Silhouette */}
          <circle cx="9" cy="13" r="2" fill="#166534" />
          {/* Steering Wheel */}
          <line x1="12" y1="12" x2="13.5" y2="15" stroke="#1F2937" strokeWidth="1" />
          {/* Chassis Base */}
          <rect x="2" y="18" width="30" height="3" rx="1" fill="#14532D" />

          {/* Large Rear Yellow Wheel with Dark Tire */}
          <circle cx="8" cy="20" r="10" fill="#FACC15" stroke="#1F2937" strokeWidth="3" />
          <circle cx="8" cy="20" r="4.5" fill="#CA8A04" />
          <circle cx="8" cy="20" r="2" fill="#1F2937" />

          {/* Small Front Yellow Wheel with Dark Tire */}
          <circle cx="26" cy="22" r="7" fill="#FACC15" stroke="#1F2937" strokeWidth="2.5" />
          <circle cx="26" cy="22" r="3" fill="#CA8A04" />
          <circle cx="26" cy="22" r="1.5" fill="#1F2937" />
        </g>
      </svg>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT: Footer
   - Top: Dark-green agricultural CTA banner
   - Middle: Spacious white 3-column footer with dividers
   - Bottom: Full-width copyright bar with leaf and tagline
   ========================================================================== */

export default function Footer({ onNavigateToLogin, onNavClick }) {
  return (
    <footer className="footer-wrapper">
      {/* ====================================================================
          1. TOP CTA BANNER: Ready to Manage Your Farm Better?
          ==================================================================== */}
      <section className="cta-banner-section" aria-label="Call to Action">
        {/* Decorative corner leaves & center accent */}
        <CtaTopLeftLeaves />
        <CtaLandscapeIllustration />

        <div className="cta-banner-content-container">
          <CtaCenterFoliage />

          <h2 className="cta-banner-heading">
            <span>Ready to Manage Your Farm</span>{' '}
            <span className="cta-highlight-better">Better?</span>
          </h2>

          <p className="cta-banner-subtext">
            Bring your agricultural operations together with AGRIMAN.
          </p>

          <div className="cta-banner-actions">
            {/* White filled button with dark-green text & arrow */}
            <button
              type="button"
              className="cta-btn-white"
              onClick={onNavigateToLogin}
              aria-label="Get Started with AGRIMAN"
            >
              <span>Get Started</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>

        {/* Layered curved waves along bottom edge */}
        <CtaBottomWaves />
      </section>

      {/* ====================================================================
          2. MAIN FOOTER: Three Columns with Vertical Separators
          ==================================================================== */}
      <section className="main-footer-section">
        <div className="main-footer-container">
          {/* COLUMN 1: Branding, Description & Social Icons */}
          <div className="footer-col footer-col-brand">
            <img
              src="/agriman-logo.png"
              alt="AGRIMAN Farm Management"
              className="footer-brand-logo"
            />

            <p className="footer-brand-description">
              A comprehensive farm management platform to organize crops, land, finance, inventory and daily farming operations.
            </p>

            {/* Social media placeholder buttons */}
            <div className="footer-social-links" aria-label="Social Links">
              {/* Facebook */}
              <a href="#facebook" className="footer-social-btn" aria-label="Facebook" onClick={(e) => e.preventDefault()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a href="#instagram" className="footer-social-btn" aria-label="Instagram" onClick={(e) => e.preventDefault()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* YouTube */}
              <a href="#youtube" className="footer-social-btn" aria-label="YouTube" onClick={(e) => e.preventDefault()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="#linkedin" className="footer-social-btn" aria-label="LinkedIn" onClick={(e) => e.preventDefault()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN SEPARATOR 1 */}
          <div className="footer-col-divider" aria-hidden="true" />

          {/* COLUMN 2: Quick Links */}
          <div className="footer-col footer-col-links">
            <h4 className="footer-col-title">Quick Links</h4>
            <div className="footer-title-bar" aria-hidden="true" />

            <ul className="footer-quick-links-list">
              <li>
                <button
                  type="button"
                  className="footer-nav-link-btn"
                  onClick={() => onNavClick && onNavClick('about')}
                >
                  <span className="footer-link-chevron" aria-hidden="true">›</span>
                  <span>About</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className="footer-nav-link-btn"
                  onClick={() => onNavClick && onNavClick('features')}
                >
                  <span className="footer-link-chevron" aria-hidden="true">›</span>
                  <span>Features</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className="footer-nav-link-btn"
                  onClick={() => onNavClick && onNavClick('how-it-works')}
                >
                  <span className="footer-link-chevron" aria-hidden="true">›</span>
                  <span>How It Works</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN SEPARATOR 2 */}
          <div className="footer-col-divider" aria-hidden="true" />

          {/* COLUMN 3: Agricultural Operations Illustration */}
          <div className="footer-col footer-col-operations">
            <h4 className="footer-col-title">Agricultural Operations</h4>
            <div className="footer-title-bar" aria-hidden="true" />

            {/* Farmland Illustration Panel with Small Green Tractor */}
            <OperationsLandscapePanel />

            <p className="footer-operations-caption">
              Built for farmers, landowners, and agricultural managers across India.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. BOTTOM COPYRIGHT BAR
          ==================================================================== */}
      <section className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p className="footer-copyright-text">
            © 2026 AGRIMAN Farm Management. All rights reserved.
          </p>

          <div className="footer-tagline-wrap">
            <svg className="footer-tagline-leaf" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 18 C8 8, 18 4, 22 4 C22 14, 14 20, 4 18 Z" fill="#22C55E" />
              <path d="M4 18 Q12 12 22 4" stroke="#15803D" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12 20 C16 14, 21 12, 23 10 C23 16, 18 21, 12 20 Z" fill="#86EFAC" />
            </svg>
            <span className="footer-tagline-text">
              From Traditional Wisdom to Modern Management.
            </span>
          </div>
        </div>
      </section>
    </footer>
  );
}
