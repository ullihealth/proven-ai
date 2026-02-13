import { AppLayout } from "@/components/layout/AppLayout";
import { AIIntelligence } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";
import { CommandStrip } from "@/components/dashboard/CommandStrip";
import { EditorsPicks } from "@/components/dashboard/EditorsPicks";
import { FeaturedCourses } from "@/components/dashboard/FeaturedCourses";

const Dashboard = () => {
  return (
    <AppLayout wide>
      {/* 12-col grid: 8 cols / 4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-0">
        {/* ─── Main column (8 cols) — OWNED CONTENT ONLY, NO RSS ─── */}
        <div className="lg:col-span-8 pt-2">
          {/* 1. Featured Courses (2 tiles) */}
          <FeaturedCourses />
          
          {/* 2. Editor's Picks (2 tiles - repurpose marketing videos/internal content) */}
          <EditorsPicks />
          
          {/* 3. Platform Updates (ticker rows) */}
          <PlatformUpdates />
          
          {/* 4. Your Focus (course progress) */}
          <YourFocus />
        </div>

        {/* ─── Right column (4 cols) — CTA + AI INTELLIGENCE ─── */}
        <aside className="lg:col-span-4 lg:border-l lg:border-[#D1D5DB] lg:pl-6">
          <CommandStrip />
          <AIIntelligence />
        </aside>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
