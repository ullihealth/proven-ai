import { Check, X } from "lucide-react";

interface ToolFitListProps {
  goodFit: string[];
  notGoodFit: string[];
}

export const ToolFitList = ({ goodFit, notGoodFit }: ToolFitListProps) => {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">
          Good fit if you:
        </h4>
        <ul className="space-y-2">
          {goodFit.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">
          Not a good fit if you:
        </h4>
        <ul className="space-y-2">
          {notGoodFit.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
