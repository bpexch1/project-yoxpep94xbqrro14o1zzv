import React from "react";

// Betfair Inverted triangle "B" Logo
export function BLogoIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 18C11.5 18 10 20.7 11.3 22.8L48 88C49 90 51 90 52 88L88.7 22.8C90 20.7 88.5 18 86 18H14Z"
        stroke={color}
        strokeWidth="9"
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

// 1. Dashboard Speedometer / Gauge
export function DashboardIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.34 16a10 10 0 1 1 17.32 0" />
      <path d="M12 14v-4" strokeWidth="2.2" />
      <circle cx="12" cy="14" r="1.5" fill={color} />
      <path d="M5.5 13h1.5" />
      <path d="M7.8 8.8l1.1 1.1" />
      <path d="M12 6v1.5" />
      <path d="M16.2 8.8l-1.1 1.1" />
      <path d="M18.5 13h-1.5" />
    </svg>
  );
}

// 2. Users Group Icon
export function UsersIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

// 3. Current Position Icon (Funnel with $ badge)
export function CurrentPositionIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4c0-.55.45-1 1-1h16c.55 0 1 .45 1 1 0 .28-.11.53-.29.71L14 11.5V19l-4 2v-9.5L3.29 4.71A1 1 0 0 1 3 4z" />
      {/* Coin badge overlay */}
      <circle cx="7.5" cy="16.5" r="4" fill="#2b343d" stroke={color} strokeWidth="1.5" />
      <text x="7.5" y="19.2" fill={color} fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
    </svg>
  );
}

// 4. Reports Document / Ledger Card Icon
export function ReportsIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="14" rx="2" fill={color} fillOpacity="0.15" />
      <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2.2" />
      <line x1="6" y1="13" x2="11" y2="13" strokeWidth="1.6" />
      <line x1="6" y1="16" x2="15" y2="16" strokeWidth="1.6" />
    </svg>
  );
}

// 5. Bet Lock Padlock Icon
export function BetLockIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}

// 6. Star Casino Star Icon
export function StarCasinoIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l2.83 6.91L22 9.75l-5.36 4.73L18.18 22 12 18.25 5.82 22l1.54-7.52L2 9.75l7.17-.84L12 2z" />
    </svg>
  );
}

// 7. World Casino & Betfair Games Globe Icon
export function GlobeIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
    </svg>
  );
}

// 8. Soccer Ball Icon
export function SoccerIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" strokeWidth="1.7" />
      <polygon points="12 7.5 15.8 10.3 14.3 14.8 9.7 14.8 8.2 10.3" fill={color} stroke="none" />
      <line x1="12" y1="7.5" x2="12" y2="2" strokeWidth="1.4" />
      <line x1="15.8" y1="10.3" x2="20.8" y2="8.5" strokeWidth="1.4" />
      <line x1="14.3" y1="14.8" x2="17.9" y2="19.3" strokeWidth="1.4" />
      <line x1="9.7" y1="14.8" x2="6.1" y2="19.3" strokeWidth="1.4" />
      <line x1="8.2" y1="10.3" x2="3.2" y2="8.5" strokeWidth="1.4" />
    </svg>
  );
}

// 9. Tennis Racket Icon
export function TennisIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14.5" cy="8.5" rx="5.5" ry="6.5" transform="rotate(25 14.5 8.5)" strokeWidth="1.8" />
      <line x1="10" y1="13.5" x2="4" y2="20.5" strokeWidth="2.4" />
      <line x1="11.5" y1="8" x2="17.5" y2="9" strokeWidth="1" />
      <line x1="13.5" y1="5.5" x2="15.5" y2="11.5" strokeWidth="1" />
      <circle cx="5.5" cy="6.5" r="2.8" fill={color} stroke="none" />
    </svg>
  );
}

// 10. Cricket Bat, Ball and Wickets Icon
export function CricketIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4l3-2 3.5 10-3 2.5L6 4z" fill={color} fillOpacity="0.2" strokeWidth="1.6" />
      <line x1="12" y1="12" x2="16.5" y2="18" strokeWidth="2.2" />
      <circle cx="17.5" cy="6.5" r="2.5" fill={color} stroke="none" />
      <line x1="3" y1="14" x2="3" y2="21" strokeWidth="1.4" />
      <line x1="5.5" y1="14" x2="5.5" y2="21" strokeWidth="1.4" />
      <line x1="8" y1="14" x2="8" y2="21" strokeWidth="1.4" />
      <line x1="2" y1="14" x2="9" y2="14" strokeWidth="1.4" />
    </svg>
  );
}

// 11. Horse Race silhouette Icon
export function HorseRaceIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M20.5 8.5c-.8 0-1.6-.4-2-.9L16 4.5h-3.5l-2.8 3-2.7 1.2V11l2.5 1.8V16l-2 4h3l1.8-4h1.8l1.8 4h3L19 14.5c.7-.6 1.5-1.5 1.5-3 0-1.5-.6-3-.5-3zM13 3c.8 0 1.5.7 1.5 1.5S13.8 6 13 6s-1.5-.7-1.5-1.5S12.2 3 13 3z" />
    </svg>
  );
}

// 12. Greyhound dog silhouette Icon
export function GreyhoundIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M21.5 9c-.6 0-1.4-.4-1.8-.7L17 6.2h-3l-2.8 2.6-3.8 1.4-3.5 1v1.8l2.6 1.3 1.8 4-1.3 3h2.2l1.8-3.6 2.6-.4 1.8 4h2.2l-1.8-5.3c1.3-.4 2.6-1.3 3.9-3.1.7-1 1.3-2.1 1.3-3z" />
    </svg>
  );
}

// Galaxy Casino Rocket / G logo
export function GalaxyCasinoIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill={color} fillOpacity="0.2" />
      <circle cx="15.5" cy="8.5" r="1.5" fill={color} stroke="none" />
      <text x="5" y="19" fill={color} stroke="none" fontSize="8" fontWeight="bold">G</text>
    </svg>
  );
}

// Teen Patti Studio (TPS) Playing Cards
export function TeenPattiCardsIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="11" height="15" rx="1.5" transform="rotate(-15 8.5 10.5)" />
      <rect x="8" y="5" width="12" height="16" rx="1.5" fill="#e51c23" />
      <text x="10.5" y="10.5" fill={color} stroke="none" fontSize="5" fontWeight="bold">A</text>
      <path d="M14 13c.8-1 2.2-1 2.2 0 0 1.2-1.5 2.2-2.2 2.8-.7-.6-2.2-1.6-2.2-2.8 0-1 1.4-1 2.2 0z" fill={color} stroke="none" />
      <text x="16.5" y="19.5" fill={color} stroke="none" fontSize="5" fontWeight="bold">A</text>
    </svg>
  );
}

// Sports Book oval emblem
export function SportsBookIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="12" rx="5" ry="9" />
      <path d="M12 3v18" />
      <path d="M7 10h10M7 14h10" />
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

// Digital Bookmaker Badge (.svg-DBM)
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

// Digital Fancy Badge (.svg-DF)
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

// Digital TV Badge (.svg-DTV)
export function DTVIcon({ className = "w-4 h-4", color = "#00b894" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M17 2l-5 5-5-5" />
      <polygon points="10 11 15 14 10 17 10 11" fill={color} stroke="none" />
    </svg>
  );
}

// Responsible Gaming 18+ Badge (.svg-18plus)
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

// Green Clock (.svg-clock-green)
export function ClockGreenIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#00b894" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Exposure Tracker Icon (.svg-exposure-icon)
export function ExposureSpriteIcon({ className = "w-4 h-4", color = "#ff5252" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  );
}
