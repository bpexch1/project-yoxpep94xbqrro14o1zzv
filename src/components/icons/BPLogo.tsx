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
        backgroundColor: "#63e6d6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
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
        <circle cx="100" cy="100" r="100" fill="#63e6d6" />
        
        {/* Italic stylized 'BP' matching the screenshot */}
        <g transform="translate(100, 100) scale(1.05) translate(-100, -100)">
          <text
            x="100"
            y="134"
            textAnchor="middle"
            fill="#151922"
            fontSize="108"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Playfair Display', 'Baskerville', 'Georgia', 'Bodoni MT', 'Times New Roman', serif"
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

