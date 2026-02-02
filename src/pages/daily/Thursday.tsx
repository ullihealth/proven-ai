import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostsForDay, getDayVisualSettings } from "@/lib/dailyflow";

const ThursdayFlow = () => {
  const posts = getPublishedPostsForDay('thursday');
  const visualSettings = getDayVisualSettings('thursday');

  return (
    <DailyFlowVideoPage 
      day="thursday" 
      posts={posts} 
      visualSettings={visualSettings}
    />
  );
};

export default ThursdayFlow;
