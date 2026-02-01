import { FileText } from "lucide-react";

interface GovernanceHeaderProps {
  title: string;
  description?: string;
  version?: string;
}

export function GovernanceHeader({ title, description, version = "v1.0" }: GovernanceHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
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