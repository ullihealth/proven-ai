import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    // Count correct answers
    let correctCount = 0;
    const answerValues = answers.map((a) => a ?? -1);

    quiz.questions.forEach((question, index) => {
      if (answerValues[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passThreshold;

    setResult({ score, passed, correctCount });
    setSubmitted(true);
    onSubmit(score, passed, answerValues);
  };

  const handleRetake = () => {
    setAnswers(quiz.questions.map(() => null));
    setSubmitted(false);
    setResult(null);
  };

  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Quiz Header */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <h3 className="font-medium text-foreground">
          Knowledge Check
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Answer {quiz.questions.length} question{quiz.questions.length > 1 ? "s" : ""} 
          {" "}• Score {quiz.passThreshold}% to continue
        </p>
      </div>

      {/* Result Banner */}
      {result && (
        <div
          className={cn(
            "px-4 py-3 border-b border-border flex items-center justify-between",
            result.passed
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {result.passed ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <span className="font-medium">
              {result.passed ? "Passed!" : "Not quite..."}
            </span>
            <span className="text-sm opacity-80">
              {result.correctCount}/{quiz.questions.length} correct ({result.score}%)
            </span>
          </div>
          {!result.passed && allowRetakes && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="p-4 space-y-6">
        {quiz.questions.map((question, qIndex) => {
          const userAnswer = answers[qIndex];
          const isCorrect =
            submitted && userAnswer === question.correctOptionIndex;
          const isWrong =
            submitted &&
            userAnswer !== null &&
            userAnswer !== question.correctOptionIndex;

          return (
            <div key={question.id} className="space-y-3">
              <p className="font-medium text-foreground">
                {qIndex + 1}. {question.text}
              </p>

              <RadioGroup
                value={userAnswer?.toString() ?? ""}
                onValueChange={(value) =>
                  handleAnswerChange(qIndex, parseInt(value))
                }
                disabled={submitted}
              >
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => {
                    const isSelected = userAnswer === oIndex;
                    const isCorrectOption =
                      oIndex === question.correctOptionIndex;
                    const showAsCorrect =
                      submitted && showCorrectAnswers && isCorrectOption;
                    const showAsWrong =
                      submitted && isSelected && !isCorrectOption;

                    return (
                      <div
                        key={oIndex}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-md border transition-colors",
                          !submitted && "hover:bg-muted/50",
                          isSelected && !submitted && "border-primary bg-primary/5",
                          showAsCorrect && "border-green-500 bg-green-500/10",
                          showAsWrong && "border-destructive bg-destructive/10",
                          !isSelected && !showAsCorrect && "border-border"
                        )}
                      >
                        <RadioGroupItem
                          value={oIndex.toString()}
                          id={`q${qIndex}-o${oIndex}`}
                        />
                        <Label
                          htmlFor={`q${qIndex}-o${oIndex}`}
                          className={cn(
                            "flex-1 cursor-pointer text-sm",
                            submitted && "cursor-default"
                          )}
                        >
                          {option}
                        </Label>
                        {showAsCorrect && (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                        {showAsWrong && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="px-4 py-3 border-t border-border bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full sm:w-auto"
          >
            Submit Answers
          </Button>
          {!allAnswered && (
            <p className="text-xs text-muted-foreground mt-2">
              Answer all questions to submit
            </p>
          )}
        </div>
      )}
    </div>
  );
};
