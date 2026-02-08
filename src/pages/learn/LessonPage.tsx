import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  seedDemoLessons 
} from "@/lib/courses/lessonStore";
import {
  getCourseProgress,
  getOrCreateProgress,
  getCourseCompletionPercent,
  isLessonAccessible,
  canCompleteLesson,
  completeLesson,
  recordQuizAttempt,
} from "@/lib/courses/progressStore";
import { defaultCourseControlsSettings } from "@/lib/courses/lessonTypes";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const LessonPage = () => {
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, forceUpdate] = useState({});

  // Find the course
  const courses = getCourses();
  const course = courses.find((c) => c.slug === courseSlug);

  if (!course) {
    return <Navigate to="/learn/courses" replace />;
  }

  // Get lessons
  let lessons = getLessonsByCourse(course.id);
  if (lessons.length === 0) {
    lessons = seedDemoLessons(course.id);
  }

  // Find current lesson
  const currentLesson = lessonId ? getLesson(lessonId) : undefined;
  if (!currentLesson) {
    // Redirect to course landing if lesson not found
    return <Navigate to={`/learn/courses/${courseSlug}`} replace />;
  }

  // Get progress
  const progress = getOrCreateProgress(course.id);
  const progressPercent = getCourseCompletionPercent(course.id);
  const completedLessonIds = progress.completedLessonIds;

  // Check if lesson is accessible
  const isAccessible = isLessonAccessible(course.id, currentLesson.id);

  // Find previous lesson for locked gate
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const currentIndex = sortedLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : undefined;
  const isLastLesson = currentIndex === sortedLessons.length - 1;

  // Check completion status
  const isCompleted = completedLessonIds.includes(currentLesson.id);
  const hasQuiz = !!currentLesson.quiz;
  const quizAttempt = progress.quizScores[currentLesson.id];
  const quizPassed = quizAttempt?.passed === true;
  const canComplete = canCompleteLesson(currentLesson, course.id);

  // Course controls (would come from admin settings)
  const courseControls = defaultCourseControlsSettings;

  // Handle quiz submission
  const handleQuizSubmit = (score: number, passed: boolean, answers: number[]) => {
    recordQuizAttempt(course.id, currentLesson.id, score, passed, answers);
    forceUpdate({}); // Trigger re-render
  };

  // Handle lesson completion
  const handleComplete = () => {
    completeLesson(course.id, currentLesson.id);
    
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
    const needsQuizPass = previousLesson.quiz && !progress.quizScores[previousLesson.id]?.passed;
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
