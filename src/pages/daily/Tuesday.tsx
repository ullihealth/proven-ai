import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostForDay, getDayVisualSettings } from "@/lib/dailyflow";

const TuesdayFlow = () => {
  const post = getPublishedPostForDay('tuesday');
  const visualSettings = getDayVisualSettings('tuesday');

  return (
    <DailyFlowVideoPage 
      day="tuesday" 
      post={post} 
      visualSettings={visualSettings}
    />
  );
};

export default TuesdayFlow;
