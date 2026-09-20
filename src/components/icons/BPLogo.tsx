import React from "react";

interface BPLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function BPLogo({ className = "", size = 120, style = {} }: BPLogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#61e0d8",
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
        <circle cx="100" cy="100" r="100" fill="#61e0d8" />
        
        {/* Stylized Italic Calligraphic BP matching the reference video */}
        <g fill="#141a29">
          <text
            x="96"
            y="138"
            textAnchor="middle"
            fill="#141a29"
            fontSize="116"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Playfair Display', 'Bodoni MT', 'Didot', 'Baskerville', 'Georgia', serif"
            letterSpacing="-5px"
          >
            BP
          </text>
        </g>
      </svg>
    </div>
  );
}

export default BPLogo;
