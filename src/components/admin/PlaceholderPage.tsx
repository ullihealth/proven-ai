import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AppLayout>
      <PageHeader title={title} description={description} />
      
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Construction className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-muted-foreground max-w-md">
          This feature is part of the Admin Console roadmap and will be available in a future update.
        </p>
      </div>
    </AppLayout>
  );
}
