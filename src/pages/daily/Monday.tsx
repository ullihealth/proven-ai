import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostForDay, getDayVisualSettings } from "@/lib/dailyflow";

const MondayFlow = () => {
  const post = getPublishedPostForDay('monday');
  const visualSettings = getDayVisualSettings('monday');

  return (
    <DailyFlowVideoPage 
      day="monday" 
      post={post} 
      visualSettings={visualSettings}
    />
  );
};

export default MondayFlow;
