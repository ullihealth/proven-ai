import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ToolSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionNumber: number;
}

export const ToolSection = ({
  title,
  children,
  defaultOpen = false,
  sectionNumber,
}: ToolSectionProps) => {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 px-4 text-left bg-card border border-border rounded-xl hover:border-primary/20 transition-colors data-[state=open]:rounded-b-none data-[state=open]:border-b-0 min-h-[56px] touch-manipulation">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
            {sectionNumber}
          </span>
          <span className="font-medium text-foreground text-base leading-snug">
            {title}
          </span>
        </div>
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 ml-2" />
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-card border border-t-0 border-border rounded-b-xl">
        <div className="px-4 py-4 sm:pl-[60px]">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
