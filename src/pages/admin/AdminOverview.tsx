import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { useTools } from "@/lib/tools";
import { 
  ListChecks, 
  Plus, 
  BookOpen, 
  Clock, 
  FileText,
  ArrowRight 
} from "lucide-react";

const AdminOverview = () => {
  const { tools } = useTools();
  
  // Calculate pending review count
  const pendingCount = tools.filter(
    t => t.trustLevel === 'unreviewed' || t.trustLevel === 'reviewed'
  ).length;

  const quickLinks = [
    {
      title: "Add Tool",
      description: "Capture a new tool for review",
      href: "/admin/tools/add",
      icon: Plus,
    },
    {
      title: "Review Queue",
      description: "Assess and promote tools",
      href: "/admin/tools/review-queue",
      icon: ListChecks,
    },
    {
      title: "Governance",
      description: "Review standards and rules",
      href: "/admin/governance/trust-ladder",
      icon: BookOpen,
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Admin Console"
        description="Manage tools, governance, and platform settings."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Tools pending review</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">Reviews overdue</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">New submissions this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{link.title}</h3>
            <p className="text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
};

export default AdminOverview;
