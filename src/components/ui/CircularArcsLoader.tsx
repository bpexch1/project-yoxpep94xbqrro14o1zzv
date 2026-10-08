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
      <img src="/reference/loading.gif" width={size} height={size} alt="Loading" role="status" />
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

