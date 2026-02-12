import { AppLayout } from "@/components/layout/AppLayout";
import { FeaturedIntelligence, AISignals } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";
import { QuickAccess } from "@/components/dashboard/QuickAccess";

const Dashboard = () => {
  return (
    <AppLayout wide>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-[32px] font-medium text-foreground tracking-tight leading-tight">
          Control Centre
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground/60">
          Your command hub for focused AI progress.
        </p>
      </div>

      {/* 12-column grid — left 8 / right 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* ─── Left column (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-8">
          <YourFocus />
          <FeaturedIntelligence />
        </div>

        {/* ─── Right column (4 cols) ─── */}
        <aside className="lg:col-span-4 space-y-6">
          <AISignals />
          <hr className="border-border/30" />
          <PlatformUpdates />
          <hr className="border-border/30" />
          <QuickAccess />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
