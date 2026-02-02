import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostsForDay, getDayVisualSettings } from "@/lib/dailyflow";

const MondayFlow = () => {
  const posts = getPublishedPostsForDay('monday');
  const visualSettings = getDayVisualSettings('monday');

  return (
    <DailyFlowVideoPage 
      day="monday" 
      posts={posts} 
      visualSettings={visualSettings}
    />
  );
};

export default MondayFlow;
