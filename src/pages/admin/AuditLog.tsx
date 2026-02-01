import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Info, Database } from "lucide-react";

const AuditLog = () => {
  const columns = [
    { header: "Date", width: "w-32" },
    { header: "Admin", width: "w-40" },
    { header: "Action", width: "w-32" },
    { header: "Tool/Entity", width: "flex-1" },
    { header: "From → To", width: "w-40" },
    { header: "Notes", width: "w-48" },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Audit Log"
        description="Track all admin actions and changes across the platform."
      />

      {/* Table Header (desktop) */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/30 border-b border-border text-sm font-medium text-muted-foreground">
          {columns.map((col) => (
            <div key={col.header} className={col.width}>
              {col.header}
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Audit logging will populate once the backend is connected. All admin actions will be recorded here.
          </p>
        </div>
      </div>

      {/* Mobile Empty State */}
      <div className="md:hidden">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs yet</h3>
          <p className="text-muted-foreground">
            Audit logging will populate once the backend is connected.
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg flex gap-3">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">What will be logged</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tool trust level changes (promotions/demotions)</li>
            <li>• Tool additions and edits</li>
            <li>• User role changes</li>
            <li>• Admin access to protected areas</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLog;
