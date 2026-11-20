import React from 'react'

export default function SidebarLandscape() {
  return (
    <div className="sidebar-landscape-wrap" aria-hidden="true">
      <svg
        className="sidebar-landscape-svg"
        viewBox="0 0 290 145"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* Subtle fade from ivory background into sky */}
          <linearGradient id="agriSkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDF8" stopOpacity="1" />
            <stop offset="35%" stopColor="#F9F8F0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EDF6E8" stopOpacity="0.4" />
          </linearGradient>

          {/* Far Hills */}
          <linearGradient id="agriFarHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DFEAD9" />
            <stop offset="100%" stopColor="#C9DDBF" />
          </linearGradient>

          {/* Mid Hills */}
          <linearGradient id="agriMidHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BBD7AF" />
            <stop offset="100%" stopColor="#9ECA8E" />
          </linearGradient>

          {/* Furrow Row Gradients */}
          <linearGradient id="agriRow1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64B663" />
            <stop offset="100%" stopColor="#4A9B48" />
          </linearGradient>
          <linearGradient id="agriRow2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3C8D3C" />
            <stop offset="100%" stopColor="#2E7530" />
          </linearGradient>
          <linearGradient id="agriRow3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#256429" />
            <stop offset="100%" stopColor="#1B4D20" />
          </linearGradient>
          <linearGradient id="agriRow4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16431A" />
            <stop offset="100%" stopColor="#0E3013" />
          </linearGradient>
        </defs>

        {/* Sky Background */}
        <rect x="0" y="0" width="290" height="145" fill="url(#agriSkyGrad)" />

        {/* Far background soft hills */}
        <path
          d="M0 62 Q75 46 155 56 Q225 66 290 50 L290 145 L0 145 Z"
          fill="url(#agriFarHill)"
        />

        {/* Mid-ground rolling hill */}
        <path
          d="M0 74 Q90 58 190 68 Q245 74 290 66 L290 145 L0 145 Z"
          fill="url(#agriMidHill)"
        />

        {/* Far Left Tree Canopy */}
        <g opacity="0.95">
          <circle cx="18" cy="70" r="14" fill="#3D7E3B" />
          <circle cx="34" cy="73" r="11" fill="#4B9448" />
          <circle cx="26" cy="65" r="10" fill="#5AA656" />
          <circle cx="10" cy="76" r="9" fill="#2F662E" />
          <rect x="23" y="74" width="4" height="13" fill="#5B4028" rx="1" />
        </g>

        {/* Right Farmhouse & Cluster of Trees */}
        <g>
          {/* Trees behind house */}
          <circle cx="212" cy="68" r="12" fill="#3A793A" />
          <circle cx="228" cy="63" r="14" fill="#4C964B" />
          <circle cx="242" cy="66" r="11" fill="#367237" />
          <circle cx="268" cy="64" r="15" fill="#438B42" />
          <circle cx="282" cy="70" r="12" fill="#529C50" />
          <circle cx="258" cy="60" r="13" fill="#5EAA5C" />

          {/* Farmhouse Main Body */}
          <rect x="232" y="70" width="28" height="15" fill="#FFFFFF" rx="1" />
          {/* Door */}
          <rect x="243" y="76" width="5.5" height="9" fill="#203E22" rx="0.5" />
          {/* Windows */}
          <rect x="235" y="73" width="4.5" height="4.5" fill="#3D6840" rx="0.5" />
          <rect x="252" y="73" width="4.5" height="4.5" fill="#3D6840" rx="0.5" />
          {/* Terracotta Gabled Roof */}
          <polygon points="229,70 246,60 263,70" fill="#B3533E" />
          {/* Chimney */}
          <rect x="255" y="59" width="3.5" height="7" fill="#8C3F2E" rx="0.5" />
        </g>

        {/* Mid-field green base */}
        <path
          d="M0 84 Q120 72 290 83 L290 145 L0 145 Z"
          fill="url(#agriRow1)"
        />

        {/* Working Green Tractor */}
        <g transform="translate(48, 75)">
          {/* Exhaust Stack */}
          <rect x="24" y="0" width="2" height="7" fill="#333333" />
          {/* Tractor Cabin */}
          <rect x="14" y="4" width="14" height="11" rx="1" fill="#2A7334" />
          {/* Engine Hood */}
          <rect x="22" y="8" width="13" height="7" rx="1.5" fill="#32883D" />
          {/* Cab Window */}
          <rect x="16" y="5.5" width="9" height="5.5" rx="0.8" fill="#E8F5E9" opacity="0.95" />
          <line x1="20.5" y1="5.5" x2="20.5" y2="11" stroke="#2A7334" strokeWidth="0.8" />
          {/* Rear Large Wheel */}
          <circle cx="12" cy="15" r="9" fill="#222222" />
          <circle cx="12" cy="15" r="7.5" fill="#1A1A1A" />
          <circle cx="12" cy="15" r="4" fill="#FACC15" />
          <circle cx="12" cy="15" r="1.5" fill="#A16207" />
          {/* Front Small Wheel */}
          <circle cx="33" cy="17" r="5.5" fill="#222222" />
          <circle cx="33" cy="17" r="4.2" fill="#1A1A1A" />
          <circle cx="33" cy="17" r="2.2" fill="#FACC15" />
          <circle cx="33" cy="17" r="1" fill="#A16207" />
        </g>

        {/* Curving Rolling Cultivated Furrow Rows */}
        {/* Row 1 */}
        <path
          d="M0 94 Q110 80 290 93 L290 145 L0 145 Z"
          fill="url(#agriRow1)"
        />
        <path
          d="M0 94 Q110 80 290 93"
          stroke="#7FD67C"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Row 2 */}
        <path
          d="M0 104 Q115 89 290 103 L290 145 L0 145 Z"
          fill="url(#agriRow2)"
        />
        <path
          d="M0 104 Q115 89 290 103"
          stroke="#5CB85A"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Row 3 */}
        <path
          d="M0 115 Q120 99 290 114 L290 145 L0 145 Z"
          fill="url(#agriRow2)"
        />
        <path
          d="M0 115 Q120 99 290 114"
          stroke="#4BA349"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Row 4 */}
        <path
          d="M0 126 Q125 110 290 125 L290 145 L0 145 Z"
          fill="url(#agriRow3)"
        />
        <path
          d="M0 126 Q125 110 290 125"
          stroke="#398A38"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Row 5 - Deep Bottom Field */}
        <path
          d="M0 137 Q130 121 290 136 L290 145 L0 145 Z"
          fill="url(#agriRow4)"
        />
        <path
          d="M0 137 Q130 121 290 136"
          stroke="#2A7329"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  )
}
