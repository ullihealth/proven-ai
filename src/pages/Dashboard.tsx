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

      {/* Two-column grid: 70% / 30% */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-0">
        {/* ─── Left column ─── */}
        <div>
          <div className="mb-10">
            <IntelligenceSection />
          </div>
          <div className="mb-10">
            <YourFocus />
          </div>
          <PlatformUpdates />
        </div>

        {/* ─── Right column ─── */}
        <aside className="lg:pt-0">
          <AISignals />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
