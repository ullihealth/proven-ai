import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Star } from "lucide-react";

const ToolsReviews = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Tool Reviews"
        description="In-depth, honest reviews of AI tools. Tested in real workflows — no affiliate links, no fluff."
        badge="Coming Soon"
      />

      <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
        <Star className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-sm font-medium text-foreground">Reviews coming soon</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Detailed breakdowns of the tools we use most — what works, what doesn't, and who each one is actually for.
        </p>
      </div>
    </AppLayout>
  );
};

export default ToolsReviews;
