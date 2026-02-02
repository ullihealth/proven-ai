import { DailyFlowVideoPage } from "@/components/daily";
import { getPublishedPostForDay, getDayVisualSettings } from "@/lib/dailyflow";

const FridayFlow = () => {
  const post = getPublishedPostForDay('friday');
  const visualSettings = getDayVisualSettings('friday');

  return (
    <DailyFlowVideoPage 
      day="friday" 
      post={post} 
      visualSettings={visualSettings}
    />
  );
};

export default FridayFlow;
