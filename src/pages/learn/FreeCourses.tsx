import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { LearningPathsSection, CourseGrid } from "@/components/courses";
import { courses, learningPaths } from "@/data/coursesData";

const FreeCourses = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Free Courses"
        description="Structured learning paths to build your AI knowledge systematically. All courses are self-paced with no deadlines."
      />

      <div className="space-y-12">
        {/* Suggested starting points - max 5 paths */}
        <LearningPathsSection paths={learningPaths} maxPaths={5} />

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
    </AppLayout>
  );
};

export default FreeCourses;
