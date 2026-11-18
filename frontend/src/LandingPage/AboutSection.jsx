import React from 'react';
import './AboutSection.css';

/* ==========================================================================
   BOTANICAL & BACKGROUND VECTOR DECORATIONS
   - Upper-left and upper-right decorative foliage
   - Layered green curved waves across the bottom
   - Light green organic shape behind the agricultural photograph
   ========================================================================== */

function TopLeftBotanical() {
  return (
    <div className="about-corner-leaves-tl" aria-hidden="true">
      <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ab-leaf-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id="ab-leaf-mid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="ab-leaf-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <path d="M-20 -10 Q50 35 110 80 Q150 110 200 95" stroke="#166534" strokeWidth="2.8" strokeLinecap="round" opacity="0.65" />
        <path d="M-10 -15 C25 15 42 50 36 72 C52 45 58 15 28 -5 Z" fill="url(#ab-leaf-dark)" />
        <path d="M36 10 C68 28 88 60 80 82 C98 55 100 22 70 6 Z" fill="url(#ab-leaf-mid)" />
        <path d="M78 30 C114 42 140 75 134 94 C150 70 148 35 116 22 Z" fill="url(#ab-leaf-light)" />
        <path d="M125 58 C155 68 174 92 170 108 C182 88 174 62 148 52 Z" fill="url(#ab-leaf-mid)" />
        <path d="M152 64 C175 68 194 84 192 96 C200 82 192 62 172 58 Z" fill="url(#ab-leaf-light)" />
        <circle cx="20" cy="18" r="3" fill="#86EFAC" opacity="0.8" />
        <circle cx="70" cy="35" r="2.5" fill="#86EFAC" opacity="0.8" />
      </svg>
    </div>
  );
}

function TopRightBotanical() {
  return (
    <div className="about-corner-leaves-tr" aria-hidden="true">
      <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ab-leaf-dark-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id="ab-leaf-mid-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="ab-leaf-light-r" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <g transform="scale(-1, 1) translate(-220, 0)">
          <path d="M-20 -10 Q50 35 110 80 Q150 110 200 95" stroke="#166534" strokeWidth="2.8" strokeLinecap="round" opacity="0.65" />
          <path d="M-10 -15 C25 15 42 50 36 72 C52 45 58 15 28 -5 Z" fill="url(#ab-leaf-dark-r)" />
          <path d="M36 10 C68 28 88 60 80 82 C98 55 100 22 70 6 Z" fill="url(#ab-leaf-mid-r)" />
          <path d="M78 30 C114 42 140 75 134 94 C150 70 148 35 116 22 Z" fill="url(#ab-leaf-light-r)" />
          <path d="M125 58 C155 68 174 92 170 108 C182 88 174 62 148 52 Z" fill="url(#ab-leaf-mid-r)" />
          <path d="M152 64 C175 68 194 84 192 96 C200 82 192 62 172 58 Z" fill="url(#ab-leaf-light-r)" />
          <circle cx="20" cy="18" r="3" fill="#86EFAC" opacity="0.8" />
          <circle cx="70" cy="35" r="2.5" fill="#86EFAC" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

function AgriculturalBottomWaves() {
  return (
    <div className="about-bottom-waves" aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ab-wave-front" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#137C20" />
          </linearGradient>
          <linearGradient id="ab-wave-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <path
          d="M0 45 C320 15 680 65 1040 30 C1220 15 1360 38 1440 45 L1440 90 L0 90 Z"
          fill="rgba(167, 243, 208, 0.45)"
        />
        <path
          d="M0 58 C360 25 720 75 1100 40 C1260 25 1380 48 1440 55 L1440 90 L0 90 Z"
          fill="url(#ab-wave-mid)"
        />
        <path
          d="M0 70 C400 38 780 82 1160 52 C1290 38 1390 58 1440 65 L1440 90 L0 90 Z"
          fill="url(#ab-wave-front)"
        />
      </svg>
    </div>
  );
}

/* ==========================================================================
   LEFT SIDE: Realistic Agricultural Image
   ========================================================================== */

function AboutImageWithFloatingIcons() {
  return (
    <div className="about-image-column">
      {/* Light green organic backdrop glow */}
      <div className="about-organic-blob" aria-hidden="true" />

      {/* Main Agricultural Image Frame */}
      <div className="about-image-frame">
        <img
          src="/about-farm-landscape.jpg"
          alt="Realistic green cultivated crop rows with tractor, farmhouse, and hills at golden sunrise"
          className="about-farm-photo"
          loading="lazy"
        />

        {/* Small translucent dark-green label near bottom-left */}
        <div className="about-image-badge">
          <svg className="badge-leaf-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 18 C8 8, 18 4, 22 4 C22 14, 14 20, 4 18 Z" fill="#4ADE80" />
            <path d="M4 18 Q12 12 22 4" stroke="#15803D" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>Organized Farm Management</span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   RIGHT SIDE: Feature Information Card
   ========================================================================== */

function AboutFeatureCard({ icon, title, description }) {
  return (
    <div className="about-feature-card">
      {/* Light-green rounded square icon container */}
      <div className="about-card-icon-wrap" aria-hidden="true">
        {icon}
      </div>

      {/* Card Content */}
      <div className="about-card-content">
        <h4 className="about-card-title">{title}</h4>
        <p className="about-card-desc">{description}</p>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT: AboutSection
   ========================================================================== */

export default function AboutSection() {
  return (
    <section id="about" className="about-platform-section" aria-label="About AGRIMAN Platform">
      {/* Botanical Corner Foliage */}
      <TopLeftBotanical />
      <TopRightBotanical />

      <div className="about-container">
        <div className="about-split-layout">
          {/* Left Column: Agricultural Image with Floating Icons */}
          <AboutImageWithFloatingIcons />

          {/* Right Column: Heading, Introduction and 3 Feature Cards */}
          <div className="about-content-column">
            {/* Small Kicker with thin green horizontal accent lines */}
            <div className="about-kicker-wrap">
              <span className="about-kicker-line" aria-hidden="true" />
              <span className="about-kicker-text">ABOUT PLATFORM</span>
              <span className="about-kicker-line" aria-hidden="true" />
            </div>

            {/* Main Heading with leaf beside it */}
            <h2 className="about-main-heading">
              <span>About</span>{' '}
              <span className="about-brand-highlight">AGRIMAN</span>
              <svg className="about-heading-leaf" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 18 C8 8, 18 4, 22 4 C22 14, 14 20, 4 18 Z" fill="#22C55E" />
                <path d="M4 18 Q12 12 22 4" stroke="#15803D" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M12 20 C16 14, 21 12, 23 10 C23 16, 18 21, 12 20 Z" fill="#86EFAC" />
              </svg>
            </h2>

            {/* Primary bold introduction */}
            <p className="about-lead-intro">
              AGRIMAN is a farm management platform designed to organize everyday agricultural operations.
            </p>

            {/* Supporting description */}
            <p className="about-sub-intro">
              It brings essential farming activities, financial records and resource management together in one centralized platform.
            </p>

            {/* Three Feature Information Cards */}
            <div className="about-feature-cards-list">
              {/* CARD 1: Organized Farm Records */}
              <AboutFeatureCard
                title="Organized Farm Records."
                description="Maintain structured registries for farmers, land survey numbers, and ownership."
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="4" width="14" height="17" rx="2.5" />
                    <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1Z" fill="#E8F8ED" />
                    <path d="M9 11l2 2 4-4" />
                    <path d="M9 16l2 2 4-4" />
                  </svg>
                }
              />

              {/* CARD 2: Simplified Operational Management */}
              <AboutFeatureCard
                title="Simplified Operational Management."
                description="Coordinate daily labor attendance, machinery maintenance, and seasonal activities."
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3.2" fill="#E8F8ED" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </svg>
                }
              />

              {/* CARD 3: Better Financial Visibility */}
              <AboutFeatureCard
                title="Better Financial Visibility."
                description="Track crop input costs, harvest income, supplier vouchers, and profitability."
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#137C20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="6" rx="8" ry="3" fill="#E8F8ED" />
                    <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                    <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" />
                    <path d="M4 16v3c0 1.66 3.58 3 8 3s8-1.34 8-3v-3" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layered Green Waves at Bottom */}
      <AgriculturalBottomWaves />
    </section>
  );
}
