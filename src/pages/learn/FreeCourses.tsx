import { AppLayout } from "@/components/layout/AppLayout";
import { AIPageHeader, LearningPathsSection, CourseGrid } from "@/components/courses";
import { courses, learningPaths } from "@/data/coursesData";

const FreeCourses = () => {
  return (
    <AppLayout>
      {/* Dark AI-native page wrapper */}
      <div className="min-h-screen -mx-6 -mt-6 px-6 bg-[hsl(var(--ai-page-bg))]">
        <AIPageHeader
          title="Free Courses"
          description="Structured learning paths to build your AI knowledge systematically. All courses are self-paced with no deadlines."
        />

        <div className="space-y-12 pb-12">
          {/* Suggested starting points - max 5 paths */}
          <LearningPathsSection paths={learningPaths} maxPaths={5} />

          {/* All courses grid - sorted by lifecycle state */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                All Courses
              </h2>
              <p className="mt-1 text-sm text-white/60">
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
