import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";
import { Compass, BookOpen, Target, Calendar } from "lucide-react";

const quickStartItems = [
  {
    title: "Orientation",
    description: "Get your bearings and understand what Proven AI offers.",
    whoFor: "New members just getting started",
    whyMatters: "Sets the foundation for everything else",
    href: "/orientation",
    lastUpdated: "January 28, 2026",
  },
  {
    title: "How Proven AI Works",
    description: "Understand the structure, rhythm, and philosophy behind our approach.",
    whoFor: "Anyone wanting to understand the methodology",
    whyMatters: "Helps you get the most from your membership",
    href: "/how-it-works",
    lastUpdated: "January 25, 2026",
  },
  {
    title: "Free vs Paid",
    description: "Clear explanation of what's included at each level.",
    whoFor: "Members considering an upgrade",
    whyMatters: "Make an informed decision about your investment",
    href: "/free-vs-paid",
    lastUpdated: "January 20, 2026",
  },
];

const Dashboard = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Welcome to Proven AI"
        description="Your calm, structured path to understanding and using AI effectively. Start with orientation, follow the daily flow, and learn at your own pace."
      />

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Compass, label: "Getting Started", value: "3 items", color: "text-primary" },
          { icon: Calendar, label: "Daily Content", value: "5 days", color: "text-primary" },
          { icon: BookOpen, label: "Free Courses", value: "12 available", color: "text-primary" },
          { icon: Target, label: "Tools", value: "8 tools", color: "text-primary" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-lg bg-card border border-border"
          >
            <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-sm text-pai-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Start Here Section */}
      <section className="pai-section">
        <h2 className="mb-4">Start Here</h2>
        <p className="text-pai-text-secondary mb-6">
          New to Proven AI? Begin with these foundational resources to get oriented.
        </p>
        
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          {quickStartItems.map((item) => (
            <ContentItem
              key={item.title}
              {...item}
              variant="list"
            />
          ))}
        </div>
      </section>

      {/* Today's Focus */}
      <section className="pai-section mt-10">
        <h2 className="mb-4">Today's Focus</h2>
        <p className="text-pai-text-secondary mb-6">
          It's Thursday — time to explore what's changing in the AI landscape.
        </p>

        <div className="p-6 rounded-lg bg-accent/50 border border-accent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📰</span>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Thursday – What's Changing</h3>
              <p className="mt-1 text-sm text-pai-text-secondary">
                Stay informed about the latest developments in AI without the hype. 
                Curated updates that matter for your work and life.
              </p>
              <a
                href="/daily/thursday"
                className="inline-flex items-center mt-3 text-sm font-medium text-primary hover:underline"
              >
                View today's content →
              </a>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
};

export default Dashboard;
