export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id="d-curve">
          <path d="M 0 0 L 50 0 C 85 0 95 20 95 45 C 95 70 85 90 50 90 L 0 90 Z" />
        </clipPath>
        <mask id="folder-gaps">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <line x1="25" y1="55" x2="100" y2="20" stroke="black" strokeWidth="3" />
          <line x1="15" y1="75" x2="100" y2="35" stroke="black" strokeWidth="3" />
        </mask>
        <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="gradMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="gradBot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      
      <g clipPath="url(#d-curve)" mask="url(#folder-gaps)">
        {/* Top Folder */}
        <path d="M45 15 h12 l4 6 h40 v70 H45 Z" fill="url(#gradTop)" />
        {/* Middle Folder */}
        <path d="M35 35 h12 l4 6 h50 v60 H35 Z" fill="url(#gradMid)" />
        {/* Bottom Folder */}
        <path d="M25 55 h12 l4 6 h60 v40 H25 Z" fill="url(#gradBot)" />
      </g>
    </svg>
  );
}
