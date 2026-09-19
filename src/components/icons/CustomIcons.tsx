import React from "react";

// Inverted triangle "B" Logo for Betfair
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

// Soccer icon matching sidebar
export function SoccerIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 6.5 15.5 9 14.2 13 9.8 13 8.5 9" fill={color} stroke="none" />
      <path d="M12 6.5L12 2" />
      <path d="M15.5 9L19.5 7.5" />
      <path d="M14.2 13L17 16.5" />
      <path d="M9.8 13L7 16.5" />
      <path d="M8.5 9L4.5 7.5" />
    </svg>
  );
}

// Tennis crossed rackets / racket icon matching sidebar
export function TennisIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="9" rx="6" ry="7" />
      <path d="M9.8 14L4 20" strokeWidth="2.5" />
      <path d="M11 9h6M14 4v10" strokeWidth="1" />
      <circle cx="6" cy="7" r="2.5" fill={color} stroke="none" />
    </svg>
  );
}

// Cricket bat and ball / wickets matching sidebar
export function CricketIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="3" width="4" height="12" rx="1.5" transform="rotate(-30 9 9)" strokeWidth="1.5" />
      <path d="M14 16l5 5" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="18" cy="7" r="3" fill={color} stroke="none" />
      <path d="M4 14v7M7 14v7M10 14v7M3 14h8" strokeWidth="1.2" />
    </svg>
  );
}

// Horse Race silhouette icon
export function HorseRaceIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M21 7.5c-.8 0-1.5-.4-1.8-1L17 3.5h-4l-3 3-3 1.5v3l3 2v4.5l-2.5 4.5h3.5l2-4.5h2l2 4.5h3.5L20 15c.8-.7 1.5-1.8 1.5-3.5 0-1.8-.7-3.5-.5-4z" />
    </svg>
  );
}

// Greyhound running dog silhouette icon
export function GreyhoundIcon({ className = "w-4 h-4", color = "#ffffff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M22 8c-.6 0-1.5-.4-2-.8l-3-2.2h-3.5l-3 3-4 1.5-4 1v2l3 1.5 2 4.5-1.5 3.5h2.5l2-4 3-.5 2 4.5h2.5l-2-6c1.5-.5 3-1.5 4.5-3.5.8-1.2 1.5-2.5 1.5-3.5z" />
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
      {/* Background card tilted */}
      <rect x="3" y="3" width="11" height="15" rx="1.5" transform="rotate(-15 8.5 10.5)" />
      {/* Foreground card */}
      <rect x="8" y="5" width="12" height="16" rx="1.5" fill="#e51c23" />
      <text x="10.5" y="10.5" fill={color} stroke="none" fontSize="5" fontWeight="bold">A</text>
      <path d="M14 13c.8-1 2.2-1 2.2 0 0 1.2-1.5 2.2-2.2 2.8-.7-.6-2.2-1.6-2.2-2.8 0-1 1.4-1 2.2 0z" fill={color} stroke="none" />
      <text x="16.5" y="19.5" fill={color} stroke="none" fontSize="5" fontWeight="bold">A</text>
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

// 6. Exposure Tracker Icon (.svg-exposure-icon)
export function ExposureSpriteIcon({ className = "w-4 h-4", color = "#ff5252" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  );
}

