import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { ContentItem } from "@/components/content/ContentItem";

const courses = [
  {
    title: "AI Foundations for Professionals",
    description: "A comprehensive introduction to AI concepts, tools, and practical applications for your work.",
    whoFor: "Complete beginners to AI",
    whyMatters: "Build a solid foundation before exploring specific tools",
    href: "/learn/courses/ai-foundations",
    lastUpdated: "January 25, 2026",
  },
  {
    title: "Mastering ChatGPT",
    description: "Go from basic prompts to advanced techniques that get consistently better results.",
    whoFor: "Anyone using ChatGPT who wants to improve",
    whyMatters: "Most people only use 10% of ChatGPT's capabilities",
    href: "/learn/courses/mastering-chatgpt",
    lastUpdated: "January 20, 2026",
  },
  {
    title: "AI for Email & Communication",
    description: "Practical course on using AI to write better emails, messages, and professional communications.",
    whoFor: "Professionals who communicate via email daily",
    whyMatters: "Save hours weekly while improving quality",
    href: "/learn/courses/ai-email",
    lastUpdated: "January 15, 2026",
  },
  {
    title: "Understanding AI Safety & Ethics",
    description: "What you need to know about using AI responsibly and safely in personal and professional contexts.",
    whoFor: "Everyone using AI tools",
    whyMatters: "Responsible use protects you and others",
    href: "/learn/courses/ai-safety",
    lastUpdated: "January 10, 2026",
  },
];

const FreeCourses = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Free Courses"
        description="Structured learning paths to build your AI knowledge systematically. All courses are self-paced with no deadlines."
      />

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {courses.map((course) => (
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

export default FreeCourses;
