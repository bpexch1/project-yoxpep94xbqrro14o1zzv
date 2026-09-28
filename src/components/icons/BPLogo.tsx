import React from "react";

interface BPLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function BPLogo({ className = "", size = 125, style = {} }: BPLogoProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
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
        {/* Bright Aqua-Turquoise Circle */}
        <circle cx="100" cy="100" r="100" fill="#4fe2d0" />

        {/* Crisp Bold Italic 'BP' Lettering - High Contrast Dark Navy */}
        <text
          x="98"
          y="138"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="108"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="'Playfair Display', 'Bodoni MT', 'Didot', 'Times New Roman', 'Georgia', serif"
          letterSpacing="-3px"
          style={{
            fontWeight: 900,
            fontStyle: "italic",
            textRendering: "geometricPrecision",
          }}
        >
          BP
        </text>
      </svg>
    </div>
  );
}

export default BPLogo;
