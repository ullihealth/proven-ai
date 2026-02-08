import { useParams, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, BookOpen, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { getCourses, courseTypeLabels, difficultyLabels } from "@/lib/courses";
import { getLessonsByCourse, seedDemoLessons, initLessonStore } from "@/lib/courses/lessonStore";
import { getCourseCompletionPercent, getNextAvailableLesson, initProgressStore } from "@/lib/courses/progressStore";
import type { Lesson } from "@/lib/courses/lessonTypes";

const CourseLandingPage = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Find the course
  const courses = getCourses();
  const course = courses.find((c) => c.slug === courseSlug);

  // Initialize stores and load lessons
  useEffect(() => {
    const init = async () => {
      if (!course) return;
      
      await Promise.all([initLessonStore(), initProgressStore()]);
      
      let courseLessons = getLessonsByCourse(course.id);
      
      // Seed demo lessons for testing if none exist
      const isLessonBased = course.isLessonBased || course.courseType === 'deep';
      if (isLessonBased && courseLessons.length === 0) {
        courseLessons = await seedDemoLessons(course.id);
      }
      
      setLessons(courseLessons);
      setLoading(false);
    };
    
    init();
  }, [course]);

  if (!course) {
    return <Navigate to="/learn/courses" replace />;
  }

  // Check if this is a lesson-based course
  const isLessonBased = course.isLessonBased || course.courseType === 'deep';

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // If not lesson-based, redirect to the old course page
  if (!isLessonBased || lessons.length === 0) {
    return <Navigate to={course.href} replace />;
  }

  // Get progress (sync - cache is already initialized)
  const progressPercent = getCourseCompletionPercent(course.id);
  const nextLesson = getNextAvailableLesson(course.id);
  const hasStarted = progressPercent > 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/learn/courses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        {/* Course Header */}
        <header className="mb-8">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline">
              {courseTypeLabels[course.courseType]}
            </Badge>
            {course.difficulty && (
              <Badge variant="secondary">
                {difficultyLabels[course.difficulty]}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            {course.title}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-4">
            {course.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {course.estimatedTime}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
            </span>
          </div>
        </header>

        {/* Progress Section */}
        {hasStarted && (
          <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Your Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {progressPercent}% Complete
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Start/Continue Button */}
        <div className="mb-8">
          {nextLesson && (
            <Link to={`/learn/courses/${courseSlug}/lesson/${nextLesson.id}`}>
              <Button size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                {hasStarted ? "Continue Learning" : "Start Course"}
              </Button>
            </Link>
          )}
        </div>

        {/* Course Content Overview */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            What You'll Learn
          </h2>

          {/* Capability Tags */}
          {course.capabilityTags && course.capabilityTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {course.capabilityTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Lessons List */}
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {lesson.title}
                  </p>
                  {lesson.chapterTitle && (
                    <p className="text-xs text-muted-foreground">
                      {lesson.chapterTitle}
                    </p>
                  )}
                </div>
                {lesson.quiz && (
                  <Badge variant="outline" className="text-xs">
                    Quiz
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default CourseLandingPage;
