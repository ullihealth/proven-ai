import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { StreamPlayer } from "@/components/courses/StreamPlayer";
import { LessonContent } from "@/components/courses/LessonContent";
import { LessonQuiz } from "@/components/courses/LessonQuiz";
import { LessonNavigation, LockedLessonGate } from "@/components/courses/LessonNavigation";
import { getCourses, loadCourses } from "@/lib/courses";
import { 
  getLessonsByCourse, 
  getLesson, 
  loadCourseLessons,
  getModulesByCourse,
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
import { defaultCoursePageStyle } from "@/lib/courses/types";
import {
  getCourseControls,
  initCourseControlsStore,
} from "@/lib/courses/courseControlsStore";
import type { Lesson, CourseProgress, QuizAttempt, ContentBlock, Module } from "@/lib/courses/lessonTypes";
import { useIsMobile } from "@/hooks/use-mobile";

const LessonPage = () => {
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<CourseProgress | undefined>(undefined);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [courseControls, setCourseControls] = useState(defaultCourseControlsSettings);
  const [contentPage, setContentPage] = useState(0);
  const [quizPageCompleted, setQuizPageCompleted] = useState(false);

  // Find the course (stable by slug)
  const courses = getCourses();
  const course = courses.find((c) => c.slug === courseSlug);
  const courseId = course?.id;

  // Initialize stores and load data
  useEffect(() => {
    const init = async () => {
      if (!courseId) return;
      
      await Promise.all([
        loadCourses(),
        loadCourseLessons(courseId),
        initProgressStore(),
        initCourseControlsStore(),
      ]);
      
      setLessons(getLessonsByCourse(courseId));
      setModules(getModulesByCourse(courseId));
      setProgress(getCourseProgress(courseId));
      setCourseControls(getCourseControls(courseId));
      setLoading(false);
    };
    
    init();
  }, [courseId, updateTrigger]);

  // Refresh progress data
  const refreshProgress = useCallback(() => {
    if (courseId) {
      setProgress(getCourseProgress(courseId));
    }
  }, [courseId]);

  // Find current lesson (always call, never conditional)
  const currentLesson = useMemo(() => {
    if (!lessonId || loading) return undefined;
    return getLesson(lessonId);
  }, [lessonId, loading]);

  // Reset content page when lesson changes
  useEffect(() => {
    setContentPage(0);
    setQuizPageCompleted(false);
  }, [currentLesson?.id]);

  // Build content pages: each block is its own "page", quiz interleaved by order
  const contentPages = useMemo(() => {
    if (!currentLesson) return [{ type: "nav" as const }];
    const pages: Array<{ type: "stream" | "block" | "quiz" | "nav"; block?: ContentBlock }> = [];
    const sorted = [...(currentLesson.contentBlocks || [])].sort((a, b) => a.order - b.order);
    // Lesson-level streamVideoId is legacy — only use it as page 1 when no video content
    // blocks with content exist. New lessons store the stream ID inside the block's content
    // field so ordering is fully controlled by block.order.
    const hasVideoContentBlocks = sorted.some((b) => b.type === "video" && b.content && b.content.trim());
    if (currentLesson.streamVideoId && !hasVideoContentBlocks) {
      pages.push({ type: "stream" });
    }
    const hasQuiz = currentLesson.quiz && currentLesson.quiz.questions.length > 0;
    const quizOrder = currentLesson.quiz?.order;

    // If quiz has an explicit order, interleave it among blocks
    let quizInserted = false;
    for (const block of sorted) {
      if (block.type === "video" && (!block.content || !block.content.trim())) continue;
      if (hasQuiz && !quizInserted && quizOrder != null && quizOrder <= block.order) {
        pages.push({ type: "quiz" });
        quizInserted = true;
      }
      pages.push({ type: "block", block });
    }
    // Append quiz at end if not yet inserted (no order set, or order > all blocks)
    if (hasQuiz && !quizInserted) {
      pages.push({ type: "quiz" });
    }
    pages.push({ type: "nav" });
    return pages;
  }, [currentLesson]);

  // --- All hooks are above. Conditional returns below. ---

  // These must be computed before any conditional return so the useEffect hook
  // order is stable on every render (React rules of hooks).
  const currentPageData = contentPages[contentPage] || contentPages[0];
  const isQuizPage = currentPageData.type === "quiz" || (currentPageData.type === "block" && currentPageData.block?.type === "quiz");
  const quizAttempt: QuizAttempt | undefined = progress?.quizScores[lessonId || ""];

  // Auto-unlock Next when revisiting a lesson whose quiz was already passed.
  useEffect(() => {
    if (isQuizPage && quizAttempt?.passed) {
      setQuizPageCompleted(true);
    }
  }, [isQuizPage, quizAttempt?.passed]);

  if (!course) {
    return <Navigate to="/learn/courses" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentLesson) {
    return <Navigate to={`/learn/courses/${courseSlug}`} replace />;
  }

  // Derived values (safe — course and currentLesson are guaranteed non-null below)
  // Note: currentPageData, isQuizPage, quizAttempt are computed before the conditional
  // returns above to satisfy React's rules of hooks.
  const totalPages = contentPages.length;
  const nextDisabled = contentPage === totalPages - 1 || (isQuizPage && !quizPageCompleted);
  const progressPercent = getCourseCompletionPercent(course.id);
  const completedLessonIds = progress?.completedLessonIds || [];
  const isAccessible = isLessonAccessible(course.id, currentLesson.id);
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const currentIndex = sortedLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : undefined;
  const isLastLesson = currentIndex === sortedLessons.length - 1;
  const isCompleted = completedLessonIds.includes(currentLesson.id);
  const hasQuiz = !!currentLesson.quiz;
  const canComplete = canCompleteLesson(currentLesson, course.id);

  // Course controls (would come from admin settings)
  const activeCourseControls = courseControls;
  const pageStyle = course.pageStyle || defaultCoursePageStyle;
  const fontFamilies: Record<string, string> = {
    inter: "Inter, system-ui, -apple-system, sans-serif",
    georgia: "Georgia, 'Times New Roman', serif",
    merriweather: "Merriweather, Georgia, serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  };

  // Handle quiz submission
  const handleQuizSubmit = async (score: number, passed: boolean, answers: number[]) => {
    await recordQuizAttempt(course.id, currentLesson.id, score, passed, answers);
    setQuizPageCompleted(true);
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
      modules={modules}
      completedLessonIds={completedLessonIds}
      currentLessonId={currentLesson.id}
      progressPercent={progressPercent}
      onMobileClose={() => setMobileMenuOpen(false)}
    />
  );

  return (
    <div
      className="min-h-screen bg-background flex"
      style={{ backgroundColor: `hsl(${pageStyle.backgroundColor})` }}
    >
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
        <main className="flex-1 overflow-auto flex flex-col">
          <div
            className="mx-auto w-full flex-1 px-4 sm:px-6 py-6 sm:py-8 lesson-content"
            style={{
              maxWidth: `${pageStyle.contentMaxWidth}px`,
              fontFamily: fontFamilies[pageStyle.fontFamily],
              fontSize: `${pageStyle.bodyFontSize}px`,
              ['--lesson-font-family' as string]: fontFamilies[pageStyle.fontFamily],
              ['--lesson-font-size' as string]: `${pageStyle.bodyFontSize}px`,
              ['--lesson-heading-weight' as string]: pageStyle.headingFontWeight,
            }}
          >
            {/* Lesson Header */}
            <header className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">
                  Lesson {currentLesson.order} of {lessons.length}
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {contentPage + 1} / {totalPages}
                  </p>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {currentLesson.title}
              </h1>
              {/* Progress bar across pages */}
              {totalPages > 1 && (
                <div className="mt-3 flex gap-1">
                  {contentPages.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= contentPage ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              )}
            </header>

            {/* Current Page Content */}
            <div className="mb-8 min-h-[200px]">
              {currentPageData.type === "stream" && currentLesson.streamVideoId && (
                <StreamPlayer
                  videoId={currentLesson.streamVideoId}
                  lessonId={currentLesson.id}
                  title={currentLesson.title}
                />
              )}

              {currentPageData.type === "block" && currentPageData.block && (
                <LessonContent
                  blocks={[currentPageData.block]}
                  onQuizComplete={() => setQuizPageCompleted(true)}
                />
              )}

              {currentPageData.type === "quiz" && hasQuiz && currentLesson.quiz && (
                <LessonQuiz
                  quiz={currentLesson.quiz}
                  previousAttempt={quizAttempt}
                  allowRetakes={activeCourseControls.allowRetakes}
                  showCorrectAnswers={activeCourseControls.showCorrectAnswersAfterQuiz}
                  onSubmit={handleQuizSubmit}
                />
              )}

              {currentPageData.type === "nav" && (
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
              )}
            </div>

            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setContentPage((p) => Math.max(p - 1, 0));
                    setQuizPageCompleted(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={contentPage === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1.5">
                  {contentPages.map((_, i) => {
                    const forwardBlocked = isQuizPage && !quizPageCompleted && i > contentPage;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (forwardBlocked) return;
                          setContentPage(i);
                          if (i !== contentPage) setQuizPageCompleted(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`h-2 rounded-full transition-all ${
                          i === contentPage
                            ? "w-6 bg-primary"
                            : forwardBlocked
                              ? "w-2 bg-muted-foreground/20 cursor-not-allowed"
                              : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        }`}
                      />
                    );
                  })}
                </div>

                <Button
                  variant={contentPage < totalPages - 1 ? "default" : "outline"}
                  onClick={() => {
                    setContentPage((p) => Math.min(p + 1, totalPages - 1));
                    setQuizPageCompleted(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={nextDisabled}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonPage;
