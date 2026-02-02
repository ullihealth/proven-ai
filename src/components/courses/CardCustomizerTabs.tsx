import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCardCustomizer } from "./CourseCardCustomizer";
import { LearningPathCardCustomizer } from "./LearningPathCardCustomizer";
import { LearningPathManagement } from "./LearningPathManagement";

interface CardCustomizerTabsProps {
  onClose: () => void;
  defaultTab?: "course-cards" | "learning-path-style" | "learning-path-content";
}

export function CardCustomizerTabs({ onClose, defaultTab = "course-cards" }: CardCustomizerTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof defaultTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="course-cards">Course Cards</TabsTrigger>
          <TabsTrigger value="learning-path-style">Path Cards Style</TabsTrigger>
          <TabsTrigger value="learning-path-content">Path Content</TabsTrigger>
        </TabsList>

        <TabsContent value="course-cards" className="mt-4">
          <CourseCardCustomizer onClose={onClose} />
        </TabsContent>

        <TabsContent value="learning-path-style" className="mt-4">
          <LearningPathCardCustomizer onClose={onClose} />
        </TabsContent>

        <TabsContent value="learning-path-content" className="mt-4">
          <LearningPathManagement onClose={onClose} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

