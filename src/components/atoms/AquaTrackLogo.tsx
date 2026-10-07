import React from 'react';

export interface AquaTrackLogoProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'full';
  showSubtitle?: boolean;
}

export const AquaTrackLogo: React.FC<AquaTrackLogoProps> = ({
  size = 32,
  className = '',
  variant = 'mark',
  showSubtitle = true,
}) => {
  // Concept 4: Modern Minimalist 'A' + Hydro Droplet & Ascending Tracking Arrow
  const Mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer Structural Shadow / Border Geometry */}
      <g stroke="#000000" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {/* Left Leg of Architectural 'A' */}
        <path
          d="M 24 100 L 48 30 C 52 18, 64 18, 68 30 L 76 52 C 72 52, 67 54, 63 58 L 58 38 L 44 80 L 52 80 C 49 86, 47 93, 47 100 Z"
          fill="#1E6FD9"
        />

        {/* Right Leg of Architectural 'A' */}
        <path
          d="M 72 64 L 92 100 L 76 100 L 64 78 C 66 73, 69 68, 72 64 Z"
          fill="#1E6FD9"
        />

        {/* The Hydro Water Droplet Core (Center Aperture) */}
        <path
          d="M 58 42 C 58 42, 68 56, 68 64 C 68 70, 63 74, 58 74 C 53 74, 48 70, 48 64 C 48 56, 58 42, 58 42 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 58 46 C 58 46, 65 57, 65 63 C 65 67, 62 70, 58 70 C 54 70, 51 67, 51 63 C 51 57, 58 46, 58 46 Z"
          fill="#1E6FD9"
        />
        {/* Droplet Light Reflection Highlight */}
        <path
          d="M 55 58 C 55 55, 57 52, 59 52"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Dynamic Ascending Tracking Arrow & Flow Track */}
        <path
          d="M 28 88 C 38 88, 52 84, 60 76 C 68 68, 74 54, 76 46 L 70 44 L 94 30 L 92 56 L 86 52 C 84 62, 76 78, 64 88 C 52 98, 38 98, 28 94 Z"
          fill="#1E6FD9"
        />
      </g>

      {/* Crisp White Inner Track Highlight */}
      <path
        d="M 32 91 C 42 91, 54 87, 62 80 C 70 72, 76 60, 78 52"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  if (variant === 'mark') {
    return Mark;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {Mark}
      <div className="flex flex-col leading-tight">
        <span className="font-bold uppercase tracking-wider text-black text-[14px]">
          AquaTrack
        </span>
        {showSubtitle && (
          <span className="text-black/60 font-normal text-[14px]">
            Sinacaban Water Supply System (SIWASS)
          </span>
        )}
      </div>
    </div>
  );
};

export default AquaTrackLogo;

