/** Cricket practice net, drawn to match the lucide line icons (24x24, currentColor). */
export default function NetIcon({ size = 24, strokeWidth = 1.75, className }: { size?: number; strokeWidth?: number; className?: string }) {
  const thin = Math.max(0.8, strokeWidth * 0.55);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {/* open front, roof rails, far wall and back */}
      <path d="M1.5 21.5V10L17 3l5.5 2v11" />
      <path d="M1.5 10l6 2.5v10L22.5 16" />
      <path d="M7.5 12.5L22.5 5" />
      {/* netting on the far wall */}
      <path d="M7.5 17.5l15-7M15 8.8v10.4" strokeWidth={thin} />
      {/* stumps */}
      <path d="M3.5 16v4.5M5.3 16.7v4.5" strokeWidth={thin * 1.4} />
    </svg>
  );
}
