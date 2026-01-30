import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";
import { Lock } from "lucide-react";

const paidCourses = [
  {
    title: "AI Mastery Program",
    description: "Our flagship comprehensive program covering everything from basics to advanced applications.",
    whoFor: "Committed learners ready for deep expertise",
    whyMatters: "The complete path from beginner to proficient",
    href: "/courses/paid/ai-mastery",
    lastUpdated: "January 25, 2026",
  },
  {
    title: "AI for Business Leaders",
    description: "Strategic AI knowledge for decision-makers and team leads.",
    whoFor: "Managers and executives",
    whyMatters: "Lead your team through AI adoption with confidence",
    href: "/courses/paid/business-leaders",
    lastUpdated: "January 20, 2026",
  },
  {
    title: "Advanced Prompt Engineering",
    description: "Master the art and science of getting exactly what you need from AI.",
    whoFor: "Power users ready to go beyond basics",
    whyMatters: "Unlock the full potential of AI tools",
    href: "/courses/paid/advanced-prompts",
    lastUpdated: "January 15, 2026",
  },
];

const PaidCourses = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Paid Courses"
        description="Premium courses for those ready to go deeper. Comprehensive, structured learning with enhanced support."
        badge="Premium"
      />

      <div className="p-4 rounded-lg bg-pai-surface border border-pai-border-subtle mb-6">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Premium Content</p>
            <p className="mt-1 text-sm text-pai-text-secondary">
              These courses require a paid membership. Upgrade your account to access.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {paidCourses.map((course) => (
          <ContentItem
            key={course.title}
            {...course}
            variant="list"
          />
        ))}
      </div>
    </AppLayout>
  );
};

export default PaidCourses;
