import { AppLayout } from "@/components/layout/AppLayout";
import { FeaturedIntelligence, AISignals, BriefingStatusBar } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";

const Dashboard = () => {
  return (
    <AppLayout wide>
      {/* 12-col grid — left 8 / right 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* ─── Left column ─── */}
        <div className="lg:col-span-8">
          <div className="mb-8">
            <YourFocus />
          </div>
          <BriefingStatusBar />
          <div className="mt-3 mb-7">
            <FeaturedIntelligence />
          </div>
          <PlatformUpdates />
        </div>

        {/* ─── Right column ─── */}
        <aside className="lg:col-span-4">
          <AISignals />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
