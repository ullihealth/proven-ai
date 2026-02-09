import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Menu, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { defaultCoursePageStyle } from "@/lib/courses/types";
import {
  getCourseControls,
  initCourseControlsStore,
} from "@/lib/courses/courseControlsStore";
import type { Lesson, CourseProgress, QuizAttempt, ContentBlock } from "@/lib/courses/lessonTypes";
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
  const [courseControls, setCourseControls] = useState(defaultCourseControlsSettings);
  const [contentPage, setContentPage] = useState(0);

  // Find the course (stable by slug)
  const courses = getCourses();
  const course = courses.find((c) => c.slug === courseSlug);
  const courseId = course?.id;

  // Initialize stores and load data
  useEffect(() => {
    const init = async () => {
      if (!courseId) return;
      
      await Promise.all([
        initLessonStore(),
        initProgressStore(),
        initCourseControlsStore(),
      ]);
      
      let courseLessons = getLessonsByCourse(courseId);
      if (courseLessons.length === 0) {
        courseLessons = await seedDemoLessons(courseId);
      }
      
      setLessons(courseLessons);
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
  }, [currentLesson?.id]);

  // Build content pages: each block is its own "page"
  const contentPages = useMemo(() => {
    if (!currentLesson) return [{ type: "nav" as const }];
    const pages: Array<{ type: "stream" | "block" | "quiz" | "nav"; block?: ContentBlock }> = [];
    if (currentLesson.streamVideoId) {
      pages.push({ type: "stream" });
    }
    const sorted = [...currentLesson.contentBlocks].sort((a, b) => a.order - b.order);
    for (const block of sorted) {
      if (block.type === "video" && (!block.content || !block.content.trim())) continue;
      pages.push({ type: "block", block });
    }
    if (currentLesson.quiz && currentLesson.quiz.questions.length > 0) {
      pages.push({ type: "quiz" });
    }
    pages.push({ type: "nav" });
    return pages;
  }, [currentLesson]);

  // --- All hooks are above. Conditional returns below. ---

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
  const totalPages = contentPages.length;
  const currentPageData = contentPages[contentPage] || contentPages[0];
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
  const quizAttempt: QuizAttempt | undefined = progress?.quizScores[currentLesson.id];
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
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                  <iframe
                    src={`https://iframe.videodelivery.net/${currentLesson.streamVideoId}`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Lesson video"
                  />
                </div>
              )}

              {currentPageData.type === "block" && currentPageData.block && (
                <LessonContent blocks={[currentPageData.block]} />
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
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={contentPage === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1.5">
                  {contentPages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setContentPage(i);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-2 rounded-full transition-all ${
                        i === contentPage ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant={contentPage < totalPages - 1 ? "default" : "outline"}
                  onClick={() => {
                    setContentPage((p) => Math.min(p + 1, totalPages - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={contentPage === totalPages - 1}
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
