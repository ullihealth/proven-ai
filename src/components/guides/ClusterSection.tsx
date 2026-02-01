import { GuideCluster, Guide } from "@/lib/guides/types";
import { GuideCard } from "./GuideCard";

interface ClusterSectionProps {
  cluster: GuideCluster;
  guides: Guide[];
}

export function ClusterSection({ cluster, guides }: ClusterSectionProps) {
  if (guides.length === 0) return null;
  
  return (
    <section className="mb-10">
      {/* Cluster header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">{cluster.title}</h2>
        <p className="text-sm text-muted-foreground">{cluster.description}</p>
      </div>
      
      {/* Guides grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map(guide => (
          <GuideCard key={guide.id} guide={guide} variant="cluster" />
        ))}
      </div>
    </section>
  );
}
