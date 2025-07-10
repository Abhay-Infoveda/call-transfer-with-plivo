"use client";

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function LoadingSkeleton({ width = '100%', height = 24, className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 rounded-md ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-gray-200 via-[var(--accent-teal)] to-gray-200 opacity-60" />
    </div>
  );
}

// Add shimmer animation to globals.css:
// .animate-shimmer {
//   animation: shimmer 1.5s infinite linear;
// }
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// } 