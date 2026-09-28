import React from "react";

interface BPLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function BPLogo({ className = "", size = 130, style = {} }: BPLogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#56e2ce",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <circle cx="100" cy="100" r="100" fill="#56e2ce" />
        
        {/* Exact Italic Script BP Matching bpexch Original */}
        <g fill="#111822">
          <text
            x="98"
            y="135"
            textAnchor="middle"
            fill="#111822"
            fontSize="108"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Brush Script MT', 'Playfair Display', 'Bodoni MT', 'Times New Roman', 'Georgia', cursive, serif"
            letterSpacing="-3px"
          >
            BP
          </text>
        </g>
      </svg>
    </div>
  );
}

export default BPLogo;
