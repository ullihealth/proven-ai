import { LearningPathCard } from "./LearningPathCard";
import type { LearningPath } from "@/lib/courses/types";
import { getLearningPaths } from "@/lib/courses/learningPathStore";

interface LearningPathsSectionProps {
  paths: LearningPath[];
  maxPaths?: number;
}

export const LearningPathsSection = ({ paths, maxPaths = 5 }: LearningPathsSectionProps) => {
  // Get the stored paths with their defaultOpen settings
  const storedPaths = getLearningPaths();
  const displayPaths = paths.slice(0, maxPaths);

  // Check if a path should be auto-expanded based on stored settings
  const shouldAutoExpand = (pathId: string): boolean => {
    const storedPath = storedPaths.find(p => p.id === pathId);
    return storedPath?.defaultOpen ?? false;
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Suggested Starting Points
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated learning paths based on your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPaths.map((path) => (
          <LearningPathCard
            key={path.id}
            path={path}
            defaultOpen={shouldAutoExpand(path.id)}
          />
        ))}
      </div>
    </section>
  );
};
