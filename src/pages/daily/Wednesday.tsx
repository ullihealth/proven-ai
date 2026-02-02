import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostForDay, getDayVisualSettings } from "@/lib/dailyflow";

const WednesdayFlow = () => {
  const post = getPublishedPostForDay('wednesday');
  const visualSettings = getDayVisualSettings('wednesday');

  return (
    <DailyFlowVideoPage 
      day="wednesday" 
      post={post} 
      visualSettings={visualSettings}
    />
  );
};

export default WednesdayFlow;
