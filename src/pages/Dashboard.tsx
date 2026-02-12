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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-0">
        {/* ─── Left column — white surface ─── */}
        <div className="bg-white rounded-lg p-5 border border-border/60">
          <div className="mb-5">
            <IntelligenceSection />
          </div>
          <div className="mb-5">
            <YourFocus />
          </div>
          <PlatformUpdates />
        </div>

        {/* ─── Right column — tinted surface ─── */}
        <aside className="lg:pt-0 bg-slate-50/80 rounded-lg p-4 border border-border/40">
          <AISignals />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
