import { AppLayout } from "@/components/layout/AppLayout";
import { IntelligenceBriefing } from "@/components/briefing/IntelligenceBriefing";
import { YourFocus } from "@/components/dashboard/YourFocus";
import { PlatformUpdates } from "@/components/dashboard/PlatformUpdates";

const Dashboard = () => {
  return (
    <AppLayout>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-foreground">Control Centre</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your command hub for focused AI progress.
        </p>
      </div>

      {/* Your Focus */}
      <YourFocus />

      {/* AI Intelligence Briefing */}
      <IntelligenceBriefing />

      {/* Platform Updates */}
      <PlatformUpdates />
    </AppLayout>
  );
};

export default Dashboard;
