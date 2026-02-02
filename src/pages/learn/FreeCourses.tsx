import { AppLayout } from "@/components/layout/AppLayout";
import { LearningPathsSection, CourseGrid } from "@/components/courses";
import { getCourses, learningPaths } from "@/lib/courses/coursesStore";

const FreeCourses = () => {
  const courses = getCourses();
  return (
    <AppLayout>
      {/* Clean white page canvas - cards are the visual focus */}
      <div className="min-h-screen">
        {/* Page header - simple, calm */}
        <div className="pb-6 border-b border-border mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Free Courses
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Structured learning paths to build your AI knowledge systematically. All courses are self-paced with no deadlines.
          </p>
        </div>

        <div className="space-y-12 pb-12">
          {/* Suggested starting points - max 5 paths */}
          <LearningPathsSection paths={learningPaths} maxPaths={5} showCustomize={false} />

          {/* All courses grid - sorted by lifecycle state */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                All Courses
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse all available courses, organized by status.
              </p>
            </div>

            <CourseGrid courses={courses} sortByLifecycle />
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default FreeCourses;
