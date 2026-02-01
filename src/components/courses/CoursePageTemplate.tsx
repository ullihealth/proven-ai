import { Link } from "react-router-dom";
import { Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/courses/types";
import { courseTypeLabels, lifecycleStateLabels } from "@/lib/courses/types";
import { useAuth } from "@/lib/auth";

interface CoursePageTemplateProps {
  course: Course;
  children: React.ReactNode;
}

export const CoursePageTemplate = ({ course, children }: CoursePageTemplateProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    title,
    description,
    estimatedTime,
    courseType,
    lifecycleState,
    capabilityTags = [],
    lastUpdated,
    sections = [],
    toolsUsed = [],
  } = course;

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back navigation */}
      <Link
        to="/learn/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      {/* Header */}
      <header className="pb-6 border-b border-border mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Lifecycle state badge */}
          <Badge
            variant={lifecycleState === 'current' ? 'default' : 'secondary'}
            className={cn(
              "text-xs",
              lifecycleState === 'legacy' && "bg-muted text-muted-foreground"
            )}
          >
            {lifecycleStateLabels[lifecycleState]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {courseTypeLabels[courseType]}
          </Badge>
          {isAdmin && (
            <Badge variant="outline" className="text-xs border-primary/50 text-primary">
              Admin editable
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {estimatedTime}
          </span>
          <span>Updated {lastUpdated}</span>
        </div>

        {/* Capability tags */}
        {capabilityTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {capabilityTags.slice(0, 6).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-2 py-0.5 font-normal bg-muted text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {/* Section navigation (for deep courses with sections) */}
      {sections.length > 0 && (
        <nav className="mb-8 p-4 bg-muted/50 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-foreground mb-3">In this course</h2>
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.anchor}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Main content */}
      <div className="prose prose-slate max-w-none">
        {children}
      </div>

      {/* Tools used in this course */}
      {toolsUsed.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-medium text-foreground mb-4">
            Tools used in this course
          </h2>
          <div className="flex flex-wrap gap-2">
            {toolsUsed.map((toolId) => (
              <Link
                key={toolId}
                to={`/tools/${toolId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md text-sm text-foreground hover:bg-muted/80 transition-colors"
              >
                {toolId}
                <ExternalLink className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
