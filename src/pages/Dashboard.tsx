import { AppLayout } from "@/components/layout/AppLayout";
import { AIIntelligence } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";
import { CommandStrip } from "@/components/dashboard/CommandStrip";
import { CommandBlock } from "@/components/dashboard/CommandBlock";
import { EditorsPicks } from "@/components/dashboard/EditorsPicks";

const Dashboard = () => {
  return (
    <AppLayout wide>
      {/* Command Strip */}
      <CommandStrip />

      {/* 12-col grid: 8 cols / 4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-0">
        {/* ─── Main column (8 cols) — owned content only, no RSS ─── */}
        <div className="lg:col-span-8">
          <CommandBlock />
          <EditorsPicks />
          <PlatformUpdates />
          <YourFocus />
        </div>

        {/* ─── Right column (4 cols) — intelligence feed only ─── */}
        <aside className="lg:col-span-4 lg:border-l lg:border-[#E5E7EB] lg:pl-8">
          <AIIntelligence />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
