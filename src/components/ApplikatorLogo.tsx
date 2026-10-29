import React from "react";

interface ApplikatorLogoProps {
  size?: number;
  className?: string;
}

export function ApplikatorLogo({ size = 28, className = "" }: ApplikatorLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="applikatorApexSidebarGrad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#090D16" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="white" strokeOpacity="0.12" />
      <path d="M16 4.8L5 26.5H11.5L16 17.5L20.5 26.5H27L16 4.8Z" fill="url(#applikatorApexSidebarGrad)" />
      <rect x="12" y="18.5" width="8" height="2.5" rx="1.25" fill="#FFFFFF" />
      <circle cx="16" cy="12.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}
