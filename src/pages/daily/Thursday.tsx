import { DailyFlowPage } from "@/components/daily/DailyFlowPage";

const thursdayItems = [
  {
    title: "This Week in AI: January 30, 2026",
    description: "Curated summary of meaningful AI developments, filtered for noise.",
    whoFor: "Everyone who wants to stay informed without overwhelm",
    whyMatters: "Know what matters without drowning in hype",
    href: "/content/weekly-ai-jan-30",
    lastUpdated: "January 30, 2026",
  },
  {
    title: "New AI Regulations: What They Mean for You",
    description: "Plain-language breakdown of recent policy changes affecting AI use.",
    whoFor: "Anyone using AI in a professional context",
    whyMatters: "Compliance matters, but shouldn't be scary",
    href: "/content/ai-regulations-2026",
    lastUpdated: "January 23, 2026",
  },
  {
    title: "Trend Watch: Multimodal AI Goes Mainstream",
    description: "Why AI that understands images, audio, and text together is becoming standard.",
    whoFor: "Those curious about where AI is heading",
    whyMatters: "Understanding trends helps you prepare, not panic",
    href: "/content/multimodal-trend",
    lastUpdated: "January 16, 2026",
  },
];

const ThursdayFlow = () => {
  return (
    <DailyFlowPage
      day="Thursday"
      theme="What's Changing"
      description="Stay informed about meaningful developments in AI. Curated news filtered for relevance, not hype."
      items={thursdayItems}
    />
  );
};

export default ThursdayFlow;
