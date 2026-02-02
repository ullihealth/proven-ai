import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostsForDay, getDayVisualSettings } from "@/lib/dailyflow";

const FridayFlow = () => {
  const posts = getPublishedPostsForDay('friday');
  const visualSettings = getDayVisualSettings('friday');

  return (
    <DailyFlowVideoPage 
      day="friday" 
      posts={posts} 
      visualSettings={visualSettings}
    />
  );
};

export default FridayFlow;
