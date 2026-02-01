import { cn } from "@/lib/utils";
import type { CardOverlayEffect } from "@/lib/courses/types";

interface AIOverlayEffectsProps {
  effect: CardOverlayEffect;
  className?: string;
}

/**
 * AI-themed overlay effects for course cards
 * Renders at low opacity to not interfere with text readability
 */
export const AIOverlayEffects = ({ effect, className }: AIOverlayEffectsProps) => {
  if (effect === 'none') return null;

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none z-0", className)}>
      {effect === 'grid' && <GridEffect />}
      {effect === 'particles' && <ParticlesEffect />}
      {effect === 'circuit' && <CircuitEffect />}
      {effect === 'waves' && <WavesEffect />}
      {effect === 'matrix' && <MatrixEffect />}
    </div>
  );
};

// Tech Grid - dots and crossing lines
const GridEffect = () => (
  <>
    <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-dots" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="1.5" fill="white" />
        </pattern>
        <pattern id="grid-lines" width="64" height="64" patternUnits="userSpaceOnUse">
          <line x1="0" y1="32" x2="64" y2="32" stroke="white" strokeWidth="0.5" opacity="0.4" />
          <line x1="32" y1="0" x2="32" y2="64" stroke="white" strokeWidth="0.5" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-dots)" />
      <rect width="100%" height="100%" fill="url(#grid-lines)" />
    </svg>
    {/* Corner accents */}
    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/10 rounded-tl" />
    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/10 rounded-br" />
  </>
);

// Particles - scattered glowing dots
const ParticlesEffect = () => (
  <>
    <div className="absolute inset-0 opacity-[0.12]">
      {/* Static particles */}
      <div className="absolute w-1 h-1 bg-white rounded-full top-[15%] left-[20%] shadow-[0_0_6px_2px_rgba(255,255,255,0.4)]" />
      <div className="absolute w-1.5 h-1.5 bg-white rounded-full top-[25%] right-[15%] shadow-[0_0_8px_2px_rgba(255,255,255,0.3)]" />
      <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[40%] left-[60%] shadow-[0_0_4px_1px_rgba(255,255,255,0.5)]" />
      <div className="absolute w-1 h-1 bg-white rounded-full top-[55%] left-[10%] shadow-[0_0_6px_2px_rgba(255,255,255,0.4)]" />
      <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[70%] right-[25%] shadow-[0_0_4px_1px_rgba(255,255,255,0.5)]" />
      <div className="absolute w-1 h-1 bg-white rounded-full bottom-[20%] left-[40%] shadow-[0_0_6px_2px_rgba(255,255,255,0.4)]" />
      <div className="absolute w-1.5 h-1.5 bg-white rounded-full bottom-[30%] right-[40%] shadow-[0_0_8px_2px_rgba(255,255,255,0.3)]" />
      <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-[10%] left-[80%] shadow-[0_0_4px_1px_rgba(255,255,255,0.5)]" />
    </div>
    {/* Connecting lines between some particles */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <line x1="20%" y1="15%" x2="60%" y2="40%" stroke="white" strokeWidth="1" />
      <line x1="85%" y1="25%" x2="60%" y2="40%" stroke="white" strokeWidth="1" />
      <line x1="40%" y1="80%" x2="10%" y2="55%" stroke="white" strokeWidth="1" />
    </svg>
  </>
);

// Circuit Lines - tech pathway pattern
const CircuitEffect = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
    {/* Horizontal lines with nodes */}
    <line x1="0" y1="30%" x2="40%" y2="30%" stroke="white" strokeWidth="1" />
    <circle cx="40%" cy="30%" r="3" fill="white" />
    <line x1="40%" y1="30%" x2="40%" y2="50%" stroke="white" strokeWidth="1" />
    <circle cx="40%" cy="50%" r="2" fill="white" />
    <line x1="40%" y1="50%" x2="70%" y2="50%" stroke="white" strokeWidth="1" />
    <circle cx="70%" cy="50%" r="3" fill="white" />
    <line x1="70%" y1="50%" x2="70%" y2="70%" stroke="white" strokeWidth="1" />
    <line x1="70%" y1="70%" x2="100%" y2="70%" stroke="white" strokeWidth="1" />
    
    {/* Secondary path */}
    <line x1="60%" y1="0" x2="60%" y2="20%" stroke="white" strokeWidth="1" />
    <circle cx="60%" cy="20%" r="2" fill="white" />
    <line x1="60%" y1="20%" x2="85%" y2="20%" stroke="white" strokeWidth="1" />
    <circle cx="85%" cy="20%" r="3" fill="white" />
    <line x1="85%" y1="20%" x2="85%" y2="35%" stroke="white" strokeWidth="1" />
    
    {/* Bottom path */}
    <line x1="0" y1="85%" x2="25%" y2="85%" stroke="white" strokeWidth="1" />
    <circle cx="25%" cy="85%" r="2" fill="white" />
    <line x1="25%" y1="85%" x2="25%" y2="100%" stroke="white" strokeWidth="1" />
  </svg>
);

// Waves - flowing horizontal lines
const WavesEffect = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="wave-fade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="20%" stopColor="white" stopOpacity="1" />
        <stop offset="80%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0,25 Q25,15 50,25 T100,25 T150,25"
      fill="none"
      stroke="url(#wave-fade)"
      strokeWidth="1.5"
      transform="translate(0, 40)"
    />
    <path
      d="M0,25 Q25,35 50,25 T100,25 T150,25"
      fill="none"
      stroke="url(#wave-fade)"
      strokeWidth="1"
      transform="translate(-20, 80)"
    />
    <path
      d="M0,25 Q25,15 50,25 T100,25 T150,25"
      fill="none"
      stroke="url(#wave-fade)"
      strokeWidth="1.5"
      transform="translate(10, 120)"
    />
    <path
      d="M0,25 Q25,35 50,25 T100,25 T150,25"
      fill="none"
      stroke="url(#wave-fade)"
      strokeWidth="1"
      transform="translate(-10, 160)"
    />
  </svg>
);

// Matrix Rain - vertical streaming characters/lines
const MatrixEffect = () => (
  <div className="absolute inset-0 opacity-[0.08]">
    {/* Vertical streaming lines at different positions */}
    <div className="absolute top-0 left-[10%] w-px h-full bg-gradient-to-b from-white via-white/50 to-transparent" />
    <div className="absolute top-[20%] left-[25%] w-px h-[60%] bg-gradient-to-b from-transparent via-white/60 to-transparent" />
    <div className="absolute top-0 left-[40%] w-px h-[80%] bg-gradient-to-b from-white/30 via-white to-transparent" />
    <div className="absolute top-[10%] left-[55%] w-px h-[70%] bg-gradient-to-b from-transparent via-white/50 to-white/20" />
    <div className="absolute top-0 left-[70%] w-px h-full bg-gradient-to-b from-white/40 via-white/60 to-transparent" />
    <div className="absolute top-[30%] left-[85%] w-px h-[50%] bg-gradient-to-b from-transparent via-white to-transparent" />
    
    {/* Small glowing nodes on some lines */}
    <div className="absolute w-1 h-1 bg-white rounded-full top-[30%] left-[10%] shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]" />
    <div className="absolute w-1 h-1 bg-white rounded-full top-[50%] left-[40%] shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]" />
    <div className="absolute w-1 h-1 bg-white rounded-full top-[60%] left-[70%] shadow-[0_0_4px_1px_rgba(255,255,255,0.6)]" />
  </div>
);
