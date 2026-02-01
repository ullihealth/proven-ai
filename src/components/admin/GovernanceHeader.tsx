import { FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface GovernanceHeaderProps {
  title: string;
  description?: string;
  version?: string;
  showBackButton?: boolean;
}

export function GovernanceHeader({ title, description, version = "v1.0", showBackButton = false }: GovernanceHeaderProps) {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">Internal Playbook — Admin Only</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Version {version}</span>
        <span>•</span>
        <span>Last updated: {today}</span>
      </div>
    </div>
  );
}