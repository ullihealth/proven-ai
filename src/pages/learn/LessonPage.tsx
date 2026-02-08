import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { LessonContent } from "@/components/courses/LessonContent";
import { LessonQuiz } from "@/components/courses/LessonQuiz";
import { LessonNavigation, LockedLessonGate } from "@/components/courses/LessonNavigation";
import { getCourses } from "@/lib/courses";
import { 
  getLessonsByCourse, 
  getLesson, 
  seedDemoLessons,
  initLessonStore,
} from "@/lib/courses/lessonStore";
import {
  getCourseProgress,
  getCourseCompletionPercent,
  isLessonAccessible,
  canCompleteLesson,
  completeLesson,
  recordQuizAttempt,
  initProgressStore,
} from "@/lib/courses/progressStore";
import { defaultCourseControlsSettings } from "@/lib/courses/lessonTypes";
import type { Lesson, CourseProgress, QuizAttempt } from "@/lib/courses/lessonTypes";
import { useIsMobile } from "@/hooks/use-mobile";

const LessonPage = () => {
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | undefined>(undefined);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Find the course
  const courses = getCourses();
  const course = courses.find((c) => c.slug === courseSlug);

  // Initialize stores and load data
  useEffect(() => {
    const init = async () => {
      if (!course) return;
      
      await Promise.all([initLessonStore(), initProgressStore()]);
      
      let courseLessons = getLessonsByCourse(course.id);
      if (courseLessons.length === 0) {
        courseLessons = await seedDemoLessons(course.id);
      }
      
      setLessons(courseLessons);
      setProgress(getCourseProgress(course.id));
      setLoading(false);
    };
    
    init();
  }, [course, updateTrigger]);

  // Refresh progress data
  const refreshProgress = useCallback(() => {
    if (course) {
      setProgress(getCourseProgress(course.id));
    }
  }, [course]);

  if (!course) {
    return <Navigate to="/learn/courses" replace />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Find current lesson
  const currentLesson = lessonId ? getLesson(lessonId) : undefined;
  if (!currentLesson) {
    return <Navigate to={`/learn/courses/${courseSlug}`} replace />;
  }

  // Get progress values (sync since cache is initialized)
  const progressPercent = getCourseCompletionPercent(course.id);
  const completedLessonIds = progress?.completedLessonIds || [];

  // Check if lesson is accessible
  const isAccessible = isLessonAccessible(course.id, currentLesson.id);

  // Find previous/next lessons
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const currentIndex = sortedLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : undefined;
  const isLastLesson = currentIndex === sortedLessons.length - 1;

  // Check completion status
  const isCompleted = completedLessonIds.includes(currentLesson.id);
  const hasQuiz = !!currentLesson.quiz;
  const quizAttempt: QuizAttempt | undefined = progress?.quizScores[currentLesson.id];
  const canComplete = canCompleteLesson(currentLesson, course.id);

  // Course controls (would come from admin settings)
  const courseControls = defaultCourseControlsSettings;

  // Handle quiz submission
  const handleQuizSubmit = async (score: number, passed: boolean, answers: number[]) => {
    await recordQuizAttempt(course.id, currentLesson.id, score, passed, answers);
    refreshProgress();
    setUpdateTrigger((t) => t + 1);
  };

  // Handle lesson completion
  const handleComplete = async () => {
    await completeLesson(course.id, currentLesson.id);
    
    // Navigate to next lesson if available
    if (nextLesson) {
      navigate(`/learn/courses/${courseSlug}/lesson/${nextLesson.id}`);
    } else {
      // Course complete - go back to landing
      navigate(`/learn/courses/${courseSlug}`);
    }
  };

  // If lesson is locked, show gate
  if (!isAccessible && previousLesson) {
    const needsQuizPass = previousLesson.quiz && !progress?.quizScores[previousLesson.id]?.passed;
    return (
      <div className="min-h-screen bg-background">
        <LockedLessonGate
          courseSlug={courseSlug!}
          previousLesson={previousLesson}
          needsQuizPass={!!needsQuizPass}
        />
      </div>
    );
  }

  // Sidebar component
  const sidebarContent = (
    <CourseSidebar
      course={course}
      lessons={lessons}
      completedLessonIds={completedLessonIds}
      currentLessonId={currentLesson.id}
      progressPercent={progressPercent}
      onMobileClose={() => setMobileMenuOpen(false)}
    />
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-72 flex-shrink-0 border-r border-border">
          {sidebarContent}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                {sidebarContent}
              </SheetContent>
            </Sheet>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {course.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {progressPercent}% complete
              </p>
            </div>
          </header>
        )}

        {/* Lesson Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Lesson Header */}
            <header className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                Lesson {currentLesson.order} of {lessons.length}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {currentLesson.title}
              </h1>
            </header>

            {/* Content Blocks */}
            <div className="mb-8">
              <LessonContent blocks={currentLesson.contentBlocks} />
            </div>

            {/* Quiz Section */}
            {hasQuiz && currentLesson.quiz && (
              <div className="mb-8">
                <LessonQuiz
                  quiz={currentLesson.quiz}
                  previousAttempt={quizAttempt}
                  allowRetakes={courseControls.allowRetakes}
                  showCorrectAnswers={courseControls.showCorrectAnswersAfterQuiz}
                  onSubmit={handleQuizSubmit}
                />
              </div>
            )}

            {/* Navigation */}
            <LessonNavigation
              courseSlug={courseSlug!}
              currentLesson={currentLesson}
              previousLesson={previousLesson}
              nextLesson={nextLesson}
              canComplete={canComplete}
              isCompleted={isCompleted}
              isLastLesson={isLastLesson}
              onComplete={handleComplete}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonPage;
