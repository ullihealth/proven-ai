import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ClusterSection } from "@/components/guides";
import { getClustersWithGuides } from "@/lib/guides";
import { Button } from "@/components/ui/button";
import { Grid3X3, Compass } from "lucide-react";

const Guides = () => {
  const clustersWithGuides = getClustersWithGuides();

  return (
    <AppLayout>
      <PageHeader
        title="Guides & Resources"
        description="Curated guides to help you navigate AI with confidence. Each cluster is designed to take you from uncertainty to clarity."
      />

      {/* Secondary action: Discovery mode */}
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing curated guides organized by topic
        </p>
        <Link to="/learn/guides/discover">
          <Button variant="outline" size="sm" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Browse all guides
          </Button>
        </Link>
      </div>

      {/* Clusters */}
      {clustersWithGuides.length > 0 ? (
        <div className="space-y-8">
          {clustersWithGuides.map(({ cluster, guides }) => (
            <ClusterSection key={cluster.id} cluster={cluster} guides={guides} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
          <Compass className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-medium text-foreground">No guides yet</h3>
          <p className="text-sm text-muted-foreground">
            Guides will appear here once they are created and assigned to clusters.
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default Guides;
