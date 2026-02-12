import { AppLayout } from "@/components/layout/AppLayout";
import { IntelligenceSection, AISignals } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";
import { CommandStrip } from "@/components/dashboard/CommandStrip";

const Dashboard = () => {
  return (
    <AppLayout wide>
      {/* Command Strip */}
      <CommandStrip />

      {/* 12-col grid: 8 cols / 4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-0">
        {/* ─── Main column (8 cols) ─── */}
        <div className="lg:col-span-8">
          <IntelligenceSection />
          <div className="mt-6">
            <YourFocus />
          </div>
          <div className="mt-6">
            <PlatformUpdates />
          </div>
        </div>

        {/* ─── Right column (4 cols) with left separator ─── */}
        <aside className="lg:col-span-4 lg:border-l lg:border-[#E5E7EB] lg:pl-8">
          <AISignals />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
