import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 px-5 text-left bg-card border border-border rounded-lg hover:border-primary/20 transition-colors data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {sectionNumber}
          </span>
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="bg-card border border-t-0 border-border rounded-b-lg">
        <div className="px-5 py-4 pl-16">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
