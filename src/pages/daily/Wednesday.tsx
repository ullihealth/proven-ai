import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostsForDay, getDayVisualSettings } from "@/lib/dailyflow";

const WednesdayFlow = () => {
  const posts = getPublishedPostsForDay('wednesday');
  const visualSettings = getDayVisualSettings('wednesday');

  return (
    <DailyFlowVideoPage 
      day="wednesday" 
      posts={posts} 
      visualSettings={visualSettings}
    />
  );
};

export default WednesdayFlow;
