import { cn } from "@/lib/utils";

interface AICardBackgroundProps {
  className?: string;
}

/**
 * Subtle futuristic texture overlay for AI cards
 * Renders nodes and connection lines at low opacity
 */
export const AICardBackground = ({ className }: AICardBackgroundProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--ai-card-bg-from))] via-[hsl(var(--ai-card-bg-via))] to-[hsl(var(--ai-card-bg-to))]" />
      
      {/* Subtle radial glow */}
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,hsl(var(--ai-card-glow)/0.08)_0%,transparent_70%)]" />
      <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 bg-[radial-gradient(ellipse_at_center,hsl(var(--ai-card-glow)/0.05)_0%,transparent_60%)]" />
      
      {/* Particle/node pattern - SVG overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="ai-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="white" />
          </pattern>
          <pattern
            id="ai-lines"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="40" x2="80" y2="40" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="40" y1="0" x2="40" y2="80" stroke="white" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ai-grid)" />
        <rect width="100%" height="100%" fill="url(#ai-lines)" />
      </svg>

      {/* Diagonal signal lines */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent transform -rotate-12" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent transform rotate-12" />
      </div>
    </div>
  );
};
