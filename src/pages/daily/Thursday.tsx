import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostForDay, getDayVisualSettings } from "@/lib/dailyflow";

const ThursdayFlow = () => {
  const post = getPublishedPostForDay('thursday');
  const visualSettings = getDayVisualSettings('thursday');

  return (
    <DailyFlowVideoPage 
      day="thursday" 
      post={post} 
      visualSettings={visualSettings}
    />
  );
};

export default ThursdayFlow;
