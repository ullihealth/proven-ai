import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostsForDay, getDayVisualSettings } from "@/lib/dailyflow";

const TuesdayFlow = () => {
  const posts = getPublishedPostsForDay('tuesday');
  const visualSettings = getDayVisualSettings('tuesday');

  return (
    <DailyFlowVideoPage 
      day="tuesday" 
      posts={posts} 
      visualSettings={visualSettings}
    />
  );
};

export default TuesdayFlow;
