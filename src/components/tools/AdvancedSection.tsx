import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdvancedSectionProps {
  title: string;
  children: React.ReactNode;
}

export const AdvancedSection = ({ title, children }: AdvancedSectionProps) => {
  return (
    <Collapsible className="group">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 text-left bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors data-[state=open]:rounded-b-none data-[state=open]:border-b-0 min-h-[48px] touch-manipulation">
        <span className="font-medium text-foreground text-sm leading-snug">
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 ml-2" />
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-muted/30 border border-t-0 border-border rounded-b-lg">
        <div className="px-4 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
