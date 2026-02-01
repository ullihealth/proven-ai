import { cn } from "@/lib/utils";

interface AIPageHeaderProps {
  brandName?: string;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Dark immersive page header for AI course pages
 * Features subtle depth/gradient matching the dark theme
 */
export const AIPageHeader = ({ 
  brandName = "Proven AI", 
  title, 
  description,
  className 
}: AIPageHeaderProps) => {
  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        "-mx-6 -mt-6 px-6 pt-8 pb-10 mb-8",
        "bg-gradient-to-br from-[hsl(var(--ai-header-bg-from))] to-[hsl(var(--ai-header-bg-to))]",
        className
      )}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="header-dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#header-dots)" />
        </svg>
      </div>

      {/* Radial glow accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,hsl(var(--ai-card-glow)/0.06)_0%,transparent_60%)]" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--ai-card-glow)/0.04)_0%,transparent_50%)]" />

      {/* Signal line accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--ai-card-glow)/0.3)] to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        {/* Brand + Title row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Brand badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--ai-card-glow))] text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-sm font-medium">{brandName}</span>
          </div>
          
          <div className="w-px h-6 bg-white/20" />
          
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {title}
          </h1>
        </div>

        {/* Description */}
        {description && (
          <p className="text-base text-white/70 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
