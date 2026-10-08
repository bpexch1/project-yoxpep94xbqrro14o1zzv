import type { CSSProperties } from "react";

type IconProps = { className?: string; color?: string; style?: CSSProperties };
export function SoccerIcon({className, color = "currentColor", style}: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 40 40" fill={color} aria-hidden="true">
    <path d="m17 3-9 4 5 5 6-3 1-6Zm6 0 8 4-4 5-6-3 2-6ZM6 10 2 19l7 1 3-6-6-4Zm28 0 4 9-7 1-3-6 6-4ZM15 13l-4 8 5 7h9l5-7-5-8H15ZM2 22l4 10 6-4-4-6H2Zm36 0-4 10-6-4 4-6h6ZM9 34l9 4 1-7-5-2-5 5Zm22 0-9 4-1-7 5-2 5 5Z" />
  </svg>;
}
export function TennisIcon({className, color = "currentColor", style}: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
    <g transform="rotate(-42 14 14)"><ellipse cx="14" cy="13" rx="9" ry="12" strokeWidth="2.4"/><path d="M9 3v20m5-22v24m5-22v20M5 8h18M5 13h18M5 18h18"/></g>
    <path d="m21 23 6 6" strokeWidth="4"/><path d="m26 28 10 9" strokeWidth="7"/>
    <circle cx="25" cy="12" r="4" fill={color} stroke="#254465" strokeWidth=".8"/>
  </svg>;
}
export function CricketIcon({className, color = "currentColor", style}: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M7 3v33m5-34v34m5-33v33M6 4h12M6 36h12"/>
    <path d="M6 4q3-4 6 0m0 0q3-4 6 0"/>
    <path d="m12 32 16-19 4 4-16 19Z" fill={color}/><path d="m30 15 6-8" strokeWidth="2.3"/>
    <circle cx="29" cy="31" r="2.7" fill={color} stroke="none"/>
  </svg>;
}
export function HorseRaceIcon({className, color = "currentColor", style}: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 48 32" fill={color} aria-hidden="true">
    <path d="m1 20 5-2 6-6 10 1 6-4 3-6 4 1 2 5 5 1 3 4-3 2-5-2-3 5-5 3 7 4 5 1-1 2-7-1-9-5-7 2-5 5-5 1v-2l5-2 4-6-4-3-3 4-8 2-1-2Zm21-9-1-5 4-3 4 1-1 3-4 1 1 4Z"/>
    <circle cx="26" cy="2.7" r="2.4"/>
    <path d="m18 23 3 4-1 5h-2l1-4-4-4m13-5 5 4 4-3h3l-5 6-8-5Z"/>
  </svg>;
}
export function GreyhoundIcon({className, color = "currentColor", style}: IconProps) {
  return <svg className={className} style={style} viewBox="0 0 48 32" fill={color} aria-hidden="true">
    <path d="m1 18 6 1 8-7 12 1 6-5 3-4 5 1 2 3 4 1-1 3-5-1-3 6-9 6-8-1-5 5-7 1-1-2 7-2 3-5-5-3-6 4-6-1Zm21 5 4 4-2 3h-3l2-3-4-3m10-4 7 4 6-1v2l-7 2-10-5Z"/>
  </svg>;
}
