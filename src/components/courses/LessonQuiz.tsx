import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quiz, QuizAttempt } from "@/lib/courses/lessonTypes";

interface LessonQuizProps {
  quiz: Quiz;
  previousAttempt?: QuizAttempt;
  allowRetakes: boolean;
  showCorrectAnswers: boolean;
  onSubmit: (score: number, passed: boolean, answers: number[]) => void;
}

export const LessonQuiz = ({
  quiz,
  previousAttempt,
  allowRetakes,
  showCorrectAnswers,
  onSubmit,
}: LessonQuizProps) => {
  const [answers, setAnswers] = useState<(number | null)[]>(
    quiz.questions.map(() => null)
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(!!previousAttempt);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
  } | null>(
    previousAttempt
      ? {
          score: previousAttempt.score,
          passed: previousAttempt.passed,
          correctCount: Math.round(
            (previousAttempt.score / 100) * quiz.questions.length
          ),
        }
      : null
  );

  const total = quiz.questions.length;
  const q = quiz.questions[currentQ];

  const handleAnswer = (optionIndex: number) => {
    if (submitted) return;
    const next = [...answers];
    next[currentQ] = optionIndex;
    setAnswers(next);
    // Auto-advance after a short delay
    if (currentQ < total - 1) {
      setTimeout(() => setCurrentQ((prev) => Math.min(prev + 1, total - 1)), 350);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    const answerValues = answers.map((a) => a ?? -1);

    quiz.questions.forEach((question, index) => {
      if (answerValues[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / total) * 100);
    const passed = score >= quiz.passThreshold;

    setResult({ score, passed, correctCount });
    setSubmitted(true);
    onSubmit(score, passed, answerValues);
  };

  const handleRetake = () => {
    setAnswers(quiz.questions.map(() => null));
    setCurrentQ(0);
    setSubmitted(false);
    setResult(null);
  };

  const allAnswered = answers.every((a) => a !== null);

  // Results view
  if (submitted && result) {
    return (
      <div className="border border-border rounded-lg bg-card p-5 space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Check</h3>
        </div>

        {/* Result banner */}
        <div
          className={cn(
            "rounded-md px-4 py-4 text-sm",
            result.passed
              ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
          )}
        >
          <p className="text-lg font-semibold">
            {result.passed ? "Passed!" : "Not quite"} — {result.score}%
          </p>
          <p className="mt-1">
            {result.correctCount} of {total} correct
          </p>
        </div>

        {/* Review answers */}
        {showCorrectAnswers && (
          <div className="space-y-4">
            {quiz.questions.map((rq, ri) => {
              const userAnswer = previousAttempt?.answers?.[ri] ?? answers[ri];
              const isCorrect = userAnswer === rq.correctOptionIndex;
              return (
                <div key={rq.id} className="space-y-1.5">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white",
                        isCorrect ? "bg-green-500" : "bg-red-500"
                      )}
                    >
                      {ri + 1}
                    </span>
                    {rq.text}
                  </p>
                  <div className="space-y-1 pl-7">
                    {rq.options.map((opt, oi) => {
                      const wasSelected = userAnswer === oi;
                      const isCorrectOpt = oi === rq.correctOptionIndex;
                      let cls = "border-border text-muted-foreground";
                      if (isCorrectOpt)
                        cls =
                          "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300";
                      else if (wasSelected)
                        cls =
                          "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300";
                      return (
                        <div
                          key={oi}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-sm flex items-center gap-2",
                            cls
                          )}
                        >
                          <span className="flex-1">{opt}</span>
                          {isCorrectOpt && (
                            <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                          {wasSelected && !isCorrectOpt && (
                            <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!result.passed && allowRetakes && (
          <Button onClick={handleRetake} variant="outline" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Question-by-question view
  return (
    <div className="border border-border rounded-lg bg-card p-5 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Knowledge Check</h3>
        <p className="text-sm text-muted-foreground">
          Question {currentQ + 1} of {total} · {quiz.passThreshold}% to pass
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {quiz.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === currentQ
                ? "w-6 bg-primary"
                : answers[i] !== null
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Current question */}
      {q && (
        <div className="space-y-3">
          <p className="text-base font-medium">{q.text}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const isSelected = answers[currentQ] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(oi)}
                  className={cn(
                    "w-full text-left rounded-md border px-4 py-3 text-sm transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ((prev) => Math.max(prev - 1, 0))}
          disabled={currentQ === 0}
          className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            currentQ === 0
              ? "text-muted-foreground cursor-not-allowed"
              : "text-foreground hover:bg-muted"
          )}
        >
          ← Back
        </button>

        <span className="text-xs text-muted-foreground">
          {answers.filter((a) => a !== null).length} / {total} answered
        </span>

        {allAnswered ? (
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ((prev) => Math.min(prev + 1, total - 1))}
            disabled={currentQ === total - 1 || answers[currentQ] === null}
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              currentQ === total - 1 || answers[currentQ] === null
                ? "text-muted-foreground cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            )}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};
