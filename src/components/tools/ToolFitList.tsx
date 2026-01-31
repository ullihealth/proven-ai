import { Check, X } from "lucide-react";

interface ToolFitListProps {
  goodFit: string[];
  notGoodFit: string[];
}

export const ToolFitList = ({ goodFit, notGoodFit }: ToolFitListProps) => {
  return (
    <div className="space-y-6">
      {/* Good fit section */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">
          Good fit if you:
        </h4>
        <ul className="space-y-3">
          {goodFit.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Not a good fit section */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">
          Not a good fit if you:
        </h4>
        <ul className="space-y-3">
          {notGoodFit.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted flex-shrink-0 mt-0.5">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
