import { LearningPathCard } from "./LearningPathCard";
import type { LearningPath } from "@/lib/courses/types";

interface LearningPathsSectionProps {
  paths: LearningPath[];
  maxPaths?: number;
}

export const LearningPathsSection = ({ paths, maxPaths = 5 }: LearningPathsSectionProps) => {
  const displayPaths = paths.slice(0, maxPaths);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Suggested starting points
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Not sure where to begin? Choose a path based on your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPaths.map((path, index) => (
          <LearningPathCard
            key={path.id}
            path={path}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </section>
  );
};
