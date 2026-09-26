import React from "react";

interface BPLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function BPLogo({ className = "", size = 115, style = {} }: BPLogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#20c9c9",
        boxShadow: "0 10px 25px rgba(32, 201, 201, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3)",
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
        <circle cx="100" cy="100" r="100" fill="#20c9c9" />
        
        {/* Stylized Modern Display BP Letters */}
        <g fill="#0a1a2e">
          <text
            x="98"
            y="138"
            textAnchor="middle"
            fill="#0a1a2e"
            fontSize="114"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Playfair Display', 'Bodoni MT', 'Didot', 'Georgia', serif"
            letterSpacing="-4px"
          >
            BP
          </text>
        </g>
      </svg>
    </div>
  );
}

export default BPLogo;
