import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/courses/lessonTypes";

interface LessonNavigationProps {
  courseSlug: string;
  currentLesson: Lesson;
  previousLesson?: Lesson;
  nextLesson?: Lesson;
  canComplete: boolean;
  isCompleted: boolean;
  isLastLesson: boolean;
  onComplete: () => void;
}

export const LessonNavigation = ({
  courseSlug,
  currentLesson,
  previousLesson,
  nextLesson,
  canComplete,
  isCompleted,
  isLastLesson,
  onComplete,
}: LessonNavigationProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-border">
      {/* Previous Lesson */}
      <div className="flex-1">
        {previousLesson ? (
          <Link to={`/learn/courses/${courseSlug}/lesson/${previousLesson.id}`}>
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous:</span>
              <span className="truncate max-w-[150px]">
                {previousLesson.title}
              </span>
            </Button>
          </Link>
        ) : (
          <div /> // Spacer
        )}
      </div>

      {/* Complete/Continue Button */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          // Already completed - show next button
          nextLesson ? (
            <Link to={`/learn/courses/${courseSlug}/lesson/${nextLesson.id}`}>
              <Button className="w-full sm:w-auto gap-2">
                Continue to Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to={`/learn/courses/${courseSlug}`}>
              <Button className="w-full sm:w-auto gap-2">
                <Check className="h-4 w-4" />
                Course Complete!
              </Button>
            </Link>
          )
        ) : canComplete ? (
          // Can complete - show complete button
          <Button 
            onClick={onComplete} 
            className="w-full sm:w-auto gap-2"
          >
            {isLastLesson ? (
              <>
                <Check className="h-4 w-4" />
                Complete Course
              </>
            ) : (
              <>
                Complete & Continue
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          // Cannot complete yet (quiz not passed)
          <Button disabled className="w-full sm:w-auto gap-2">
            Pass the quiz to continue
          </Button>
        )}
      </div>

      {/* Next Lesson Preview (if completed) */}
      <div className="flex-1 text-right hidden sm:block">
        {isCompleted && nextLesson && (
          <span className="text-sm text-muted-foreground">
            Next: {nextLesson.title}
          </span>
        )}
      </div>
    </div>
  );
};

// Locked lesson gate component
interface LockedLessonGateProps {
  courseSlug: string;
  previousLesson: Lesson;
  needsQuizPass: boolean;
}

export const LockedLessonGate = ({
  courseSlug,
  previousLesson,
  needsQuizPass,
}: LockedLessonGateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        This lesson is locked
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {needsQuizPass
          ? `Complete the quiz in "${previousLesson.title}" to unlock this lesson.`
          : `Complete "${previousLesson.title}" first to unlock this lesson.`}
      </p>
      <Link to={`/learn/courses/${courseSlug}/lesson/${previousLesson.id}`}>
        <Button>
          Go to {previousLesson.title}
        </Button>
      </Link>
    </div>
  );
};

// Need to import Lock for LockedLessonGate
import { Lock } from "lucide-react";
