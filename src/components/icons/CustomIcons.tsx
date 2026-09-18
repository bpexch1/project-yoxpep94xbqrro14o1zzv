import React from "react";

// Inverted triangle "B" Logo
export function BLogoIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 18C9.5 18 8 20.7 9.3 22.8L47.3 88.2C48.5 90.3 51.5 90.3 52.7 88.2L90.7 22.8C92 20.7 90.5 18 88 18H12Z"
        stroke={color}
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="44"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        B
      </text>
    </svg>
  );
}

// 5-Point Pinwheel Star (Live Gaming / Star Casino)
export function LiveGamingStarIcon({ className = "w-5 h-5", color = "currentColor", spin = false }: { className?: string; color?: string; spin?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${spin ? "animate-spin" : ""}`}
      style={spin ? { animationDuration: "6s" } : undefined}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="50,50 50,5 30,28" />
      <polygon points="50,50 93,36 78,57" />
      <polygon points="50,50 76,86 52,95" />
      <polygon points="50,50 24,86 16,63" />
      <polygon points="50,50 7,36 30,28" />
    </svg>
  );
}

// Teen Patti Studio (TPS) Playing Cards
export function TeenPattiCardsIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="10" width="46" height="66" rx="6" transform="rotate(-15 35 43)" />
      <text x="25" y="32" fill={color} stroke="none" fontSize="14" fontWeight="900" transform="rotate(-15 25 32)">A</text>
      <rect x="36" y="20" width="52" height="72" rx="6" fill="#1e3a5f" />
      <text x="44" y="36" fill={color} stroke="none" fontSize="16" fontWeight="bold">A</text>
      <path
        d="M62 48 C62 42, 54 42, 54 50 C54 58, 62 64, 62 66 C62 64, 70 58, 70 50 C70 42, 62 42, 62 48 Z"
        fill={color}
        stroke="none"
      />
      <text x="80" y="84" fill={color} stroke="none" fontSize="16" fontWeight="bold" transform="rotate(180 80 84)">A</text>
    </svg>
  );
}

// === BPEXCH SPRITE BADGES & ICONS ===

// 1. Digital Bookmaker Badge (.svg-DBM)
export function DBMBadge({ className = "h-4" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-[#0088cc] text-white text-[10px] font-black px-1.5 py-0.5 rounded-[2px] leading-none select-none tracking-tight ${className}`}
      title="Bookmaker Available"
    >
      BM
    </span>
  );
}

// 2. Digital Fancy Badge (.svg-DF)
export function DFBadge({ className = "h-4" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-[#e65100] text-white text-[10px] font-black px-1.5 py-0.5 rounded-[2px] leading-none select-none tracking-tight ${className}`}
      title="Fancy Market Available"
    >
      F
    </span>
  );
}

// 3. Digital TV Badge (.svg-DTV)
export function DTVIcon({ className = "w-4 h-4", color = "#00b894" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M17 2l-5 5-5-5" />
      <polygon points="10 11 15 14 10 17 10 11" fill={color} stroke="none" />
    </svg>
  );
}

// 4. Responsible Gaming 18+ Badge (.svg-18plus)
export function Plus18Badge({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#d9534f" stroke="#fff" strokeWidth="4" />
      <text x="50" y="58" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="900" fontFamily="sans-serif">
        18+
      </text>
    </svg>
  );
}

// 5. Green Clock (.svg-clock-green)
export function ClockGreenIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#00b894" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// 6. Cricket Icon (.svg-cricket)
export function CricketSpriteIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 21L19 7" />
      <path d="M14 4l6 6" />
      <circle cx="6" cy="6" r="3" fill={color} stroke="none" />
    </svg>
  );
}

// 7. Soccer Icon (.svg-soccer)
export function SoccerSpriteIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 6 15 9 14 13 10 13 9 9" fill={color} stroke="none" />
    </svg>
  );
}

// 8. Tennis Icon (.svg-tennis)
export function TennisSpriteIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M6 6c3 3 3 9 0 12" />
      <path d="M18 6c-3 3-3 9 0 12" />
    </svg>
  );
}

// 9. Horse Racing Icon (.svg-horse)
export function HorseSpriteIcon({ className = "w-4 h-4", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M19 8c-.6 0-1.1-.3-1.4-.8L16 4h-3.5L10 6.5l-2 1V10l3 2v4l-2 4h3l2-4h2l2 4h3l-2.5-6.5C21.8 12.3 22 10.7 22 9c0-1.7-1.3-3-3-1z" />
    </svg>
  );
}

// 10. Exposure Tracker Icon (.svg-exposure-icon)
export function ExposureSpriteIcon({ className = "w-4 h-4", color = "#ff5252" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  );
}

