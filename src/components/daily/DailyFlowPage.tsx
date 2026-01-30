import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";

interface DailyPageProps {
  day: string;
  theme: string;
  description: string;
  items: Array<{
    title: string;
    description: string;
    whoFor: string;
    whyMatters: string;
    href: string;
    lastUpdated: string;
  }>;
}

export const DailyFlowPage = ({ day, theme, description, items }: DailyPageProps) => {
  return (
    <AppLayout>
      <PageHeader
        title={`${day} – ${theme}`}
        description={description}
        badge={day}
      />

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {items.map((item) => (
          <ContentItem
            key={item.title}
            {...item}
            variant="list"
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-pai-text-muted">
            No content available yet. Check back soon.
          </p>
        </div>
      )}
    </AppLayout>
  );
};
