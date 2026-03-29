import { useParams, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, BookOpen, Play, Loader2, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { getCourses, courseTypeLabels, difficultyLabels, loadCourses } from "@/lib/courses";
import { getLessonsByCourse, loadCourseLessons } from "@/lib/courses/lessonStore";
import { getCourseCompletionPercent, getNextAvailableLesson, resetCourseProgress, initProgressStore } from "@/lib/courses/progressStore";
import type { Lesson } from "@/lib/courses/lessonTypes";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getCourseAccess, formatCoursePrice } from "@/utils/courseAccess";

const CourseLandingPage = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Find the course
  const courses = getCourses();
  const course = courses.find((c) => c.slug === courseSlug);
  const courseId = course?.id;

  // Premium access check
  const access = course ? getCourseAccess(course, user?.role ?? null) : null;

  // Initialize stores and load lessons
  useEffect(() => {
    const init = async () => {
      if (!courseId || !course) return;
      
      await Promise.all([loadCourses(), loadCourseLessons(courseId), initProgressStore()]);
      
      setLessons(getLessonsByCourse(courseId));
      setLoading(false);
    };
    
    init();
  }, [courseId, updateTrigger]);

  if (!course) {
    return <Navigate to="/learn/courses" replace />;
  }

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

  // If course has no lessons yet, show placeholder
  if (lessons.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/learn/courses"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <header className="mb-8">
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
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.estimatedTime}
              </span>
            </div>
          </header>

          {course.capabilityTags && course.capabilityTags.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                What You'll Learn
              </h2>
              <div className="flex flex-wrap gap-2">
                {course.capabilityTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <div className="p-6 rounded-lg bg-muted/50 border border-border text-center">
            <p className="text-muted-foreground">
              Lessons for this course are being prepared. Check back soon!
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Get progress (sync - cache is already initialized)
  const progressPercent = getCourseCompletionPercent(course.id);
  const nextLesson = getNextAvailableLesson(course.id);
  const hasStarted = progressPercent > 0;

  const handleResetCourse = async () => {
    await resetCourseProgress(course.id);
    setUpdateTrigger((t) => t + 1);
    toast.success("Course progress reset");
  };

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
            {access?.phase === 'premium_launch' && (
              <Badge className="bg-amber-500 text-white border-0">Premium Course</Badge>
            )}
            {access?.phase === 'premium_reduced' && (
              <Badge className="bg-amber-500 text-white border-0">Premium Course</Badge>
            )}
            {access?.phase === 'premium_included' && (
              <Badge className="bg-green-600 text-white border-0">Included in Membership</Badge>
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

        {/* Premium access banner */}
        {access?.requiresPurchase && (
          <div className="mb-8 p-5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  {access.phase === 'premium_reduced'
                    ? `This course is now ${access.priceCents ? formatCoursePrice(access.priceCents) : ''} — reduced from launch price`
                    : `This is a premium course — ${access.priceCents ? formatCoursePrice(access.priceCents) : ''}`}
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  {user?.role === 'member'
                    ? 'Upgrade to a paid membership to unlock — or purchase this course individually below.'
                    : 'Purchase this course to get full access to all lessons.'}
                </p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <Link to="/courses/paid">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                      Purchase This Course
                    </Button>
                  </Link>
                  <Link to="/membership">
                    <Button size="sm" variant="outline">
                      View Membership
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership included banner */}
        {access?.phase === 'premium_included' && (
          <div className="mb-8 p-4 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              This course is now included free with your membership.
            </p>
          </div>
        )}

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
        {!access?.requiresPurchase && (
        <div className="mb-8 flex items-center gap-3">
          {nextLesson && (
            <Link to={`/learn/courses/${courseSlug}/lesson/${nextLesson.id}`}>
              <Button size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                {hasStarted ? "Continue Learning" : "Start Course"}
              </Button>
            </Link>
          )}
          {hasStarted && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" />
                  Reset Course
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset course progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all your progress, quiz scores, and completion status for this course. You'll start from the beginning. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleResetCourse}
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        )}

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
              access?.requiresPurchase ? (
              <div
                key={lesson.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border opacity-50"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-muted-foreground truncate">
                    {lesson.title}
                  </p>
                </div>
              </div>
              ) : (
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
              )
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default CourseLandingPage;
