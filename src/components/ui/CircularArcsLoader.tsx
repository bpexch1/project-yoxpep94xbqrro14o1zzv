import React from "react";

interface CircularArcsLoaderProps {
  size?: number;
  className?: string;
  fullScreen?: boolean;
}

export function CircularArcsLoader({
  size = 135,
  className = "",
  fullScreen = false,
}: CircularArcsLoaderProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="circular-arcs-spinner"
        style={{ overflow: "visible" }}
      >
        {/* Arc 1: Outermost Vibrant Purple/Magenta (Top-Right sweep in screenshot) */}
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="#b83eba"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="145 270"
          className="arc-outer"
        />

        {/* Arc 2: Mid-Outer Rose / Pink-Crimson (Bottom sweep in screenshot) */}
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke="#c83f6f"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="115 207"
          className="arc-mid-outer"
        />

        {/* Arc 3: Mid-Inner Teal / Mint Green (Bottom-Left sweep in screenshot) */}
        <circle
          cx="50"
          cy="50"
          r="23"
          fill="none"
          stroke="#2ec4b6"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeDasharray="85 145"
          className="arc-mid-inner"
        />

        {/* Arc 4: Innermost Lavender/Indigo (Left sweep in screenshot) */}
        <circle
          cx="50"
          cy="50"
          r="14"
          fill="none"
          stroke="#7f77dd"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeDasharray="50 88"
          className="arc-innermost"
        />
      </svg>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-transparent transition-all pointer-events-none select-none">
        <div className="relative -mt-20 sm:-mt-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

