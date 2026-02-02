import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCardCustomizer } from "./CourseCardCustomizer";
import { LearningPathCardCustomizer } from "./LearningPathCardCustomizer";

interface CardCustomizerTabsProps {
  onClose: () => void;
  defaultTab?: "course-cards" | "learning-paths";
}

export function CardCustomizerTabs({ onClose, defaultTab = "course-cards" }: CardCustomizerTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "course-cards" | "learning-paths")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="course-cards">Course Cards</TabsTrigger>
          <TabsTrigger value="learning-paths">Learning Path Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="course-cards" className="mt-4">
          <CourseCardCustomizer onClose={onClose} />
        </TabsContent>

        <TabsContent value="learning-paths" className="mt-4">
          <LearningPathCardCustomizer onClose={onClose} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
