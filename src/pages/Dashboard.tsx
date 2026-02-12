import { AppLayout } from "@/components/layout/AppLayout";
import { FeaturedIntelligence, AISignals, BriefingStatusBar } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";
import { QuickAccess } from "@/components/dashboard/QuickAccess";

const Dashboard = () => {
  return (
    <AppLayout wide>
      {/* 12-column grid — left 8 / right 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* ─── Left column (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-5">
          <YourFocus />
          <BriefingStatusBar />
          <FeaturedIntelligence />
        </div>

        {/* ─── Right column (4 cols) ─── */}
        <aside className="lg:col-span-4 space-y-5">
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
