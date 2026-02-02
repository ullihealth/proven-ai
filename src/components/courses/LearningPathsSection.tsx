import { useState, useEffect } from "react";
import { LearningPathCard } from "./LearningPathCard";
import { LearningPathCardCustomizer } from "./LearningPathCardCustomizer";
import type { LearningPath } from "@/lib/courses/types";
import { getLearningPaths } from "@/lib/courses/coursesStore";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LearningPathsSectionProps {
  paths?: LearningPath[];
  maxPaths?: number;
  showCustomize?: boolean;
}

export const LearningPathsSection = ({ paths: propPaths, maxPaths = 5, showCustomize = true }: LearningPathsSectionProps) => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Use prop paths if provided, otherwise load from store
    if (propPaths) {
      setPaths(propPaths.slice(0, maxPaths));
    } else {
      setPaths(getLearningPaths().slice(0, maxPaths));
    }
  }, [propPaths, maxPaths, refreshKey]);

  const handleCustomizerClose = () => {
    setShowCustomizer(false);
    // Force re-render to apply new settings
    setRefreshKey(prev => prev + 1);
  };

  if (paths.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Suggested Starting Points
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated learning paths based on your goals.
          </p>
        </div>
        {showCustomize && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomizer(true)}
            className="gap-1"
          >
            <Settings2 className="h-4 w-4" />
            Customize
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" key={refreshKey}>
        {paths.map((path) => (
          <LearningPathCard
            key={path.id}
            path={path}
            defaultOpen={path.defaultOpen}
          />
        ))}
      </div>

      {/* Customizer Dialog */}
      <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Learning Path Cards</DialogTitle>
          </DialogHeader>
          <LearningPathCardCustomizer onClose={handleCustomizerClose} />
        </DialogContent>
      </Dialog>
    </section>
  );
};
