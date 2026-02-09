import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Save,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Video,
  FileUp,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import type { Course } from "@/lib/courses/types";
import type {
  ContentBlock,
  ContentBlockType,
  CourseControlsSettings,
  Lesson,
  QuizQuestion,
} from "@/lib/courses/lessonTypes";
import {
  defaultCourseControlsSettings,
} from "@/lib/courses/lessonTypes";
import {
  addContentBlock,
  createLesson,
  deleteContentBlock,
  deleteLesson,
  getLessonsByCourse,
  initLessonStore,
  reorderContentBlocks,
  reorderLessons,
  setLessonQuiz,
  updateContentBlock,
  updateLesson,
  removeLessonQuiz,
} from "@/lib/courses/lessonStore";
import { getCourses } from "@/lib/courses";
import {
  getCourseControls,
  initCourseControlsStore,
  saveCourseControls,
} from "@/lib/courses/courseControlsStore";

const blockTypeLabels: Record<ContentBlockType, string> = {
  video: "Video",
  text: "Text",
  image: "Image",
  pdf: "PDF",
};

const blockTypeIcons: Record<ContentBlockType, JSX.Element> = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  pdf: <FileUp className="h-4 w-4" />,
};

const reorderList = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const LessonManagement = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [dragLessonId, setDragLessonId] = useState<string | null>(null);
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);

  const [lessonDraft, setLessonDraft] = useState<{ title: string; chapterTitle: string } | null>(null);

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDraft, setBlockDraft] = useState<{
    id?: string;
    type: ContentBlockType;
    title: string;
    content: string;
  } | null>(null);

  const [quizDraft, setQuizDraft] = useState<{
    passThreshold: number;
    questions: QuizQuestion[];
  } | null>(null);

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<{
    id?: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
  } | null>(null);

  const [courseControlsDraft, setCourseControlsDraft] = useState<CourseControlsSettings>(
    defaultCourseControlsSettings
  );
  const autosaveTimerRef = useRef<number | null>(null);
  const lastSavedLessonRef = useRef<{ title: string; chapterTitle: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([initLessonStore(), initCourseControlsStore()]);
      const allCourses = getCourses();
      setCourses(allCourses);
      const defaultCourse = allCourses.find((course) => course.isLessonBased) || allCourses[0];
      if (defaultCourse) {
        setSelectedCourseId(defaultCourse.id);
      }
      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    const courseLessons = getLessonsByCourse(selectedCourseId);
    setLessons(courseLessons);
    const nextSelected = courseLessons.find((lesson) => lesson.id === selectedLessonId) || courseLessons[0];
    setSelectedLessonId(nextSelected?.id || null);
    setCourseControlsDraft(getCourseControls(selectedCourseId));
  }, [selectedCourseId]);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  useEffect(() => {
    if (!selectedLesson) {
      setLessonDraft(null);
      setQuizDraft(null);
      return;
    }

    setLessonDraft({
      title: selectedLesson.title,
      chapterTitle: selectedLesson.chapterTitle || "",
    });
    lastSavedLessonRef.current = {
      title: selectedLesson.title,
      chapterTitle: selectedLesson.chapterTitle || "",
    };

    if (selectedLesson.quiz) {
      setQuizDraft({
        passThreshold: selectedLesson.quiz.passThreshold,
        questions: selectedLesson.quiz.questions.map((question) => ({ ...question })),
      });
    } else {
      setQuizDraft(null);
    }
  }, [selectedLesson]);

  useEffect(() => {
    if (!selectedLesson || !lessonDraft) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      const trimmedTitle = lessonDraft.title.trim();
      const trimmedChapter = lessonDraft.chapterTitle.trim();
      if (!trimmedTitle) return;

      const lastSaved = lastSavedLessonRef.current;
      if (
        lastSaved &&
        lastSaved.title === trimmedTitle &&
        lastSaved.chapterTitle === trimmedChapter
      ) {
        return;
      }

      await updateLesson(selectedLesson.id, {
        title: trimmedTitle,
        chapterTitle: trimmedChapter || undefined,
      });

      lastSavedLessonRef.current = {
        title: trimmedTitle,
        chapterTitle: trimmedChapter,
      };
      refreshLessons();
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [lessonDraft, selectedLesson]);

  const refreshLessons = () => {
    if (!selectedCourseId) return;
    const updated = getLessonsByCourse(selectedCourseId);
    setLessons(updated);
    if (selectedLessonId && !updated.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(updated[0]?.id || null);
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedCourseId) return;
    const newLesson = await createLesson(selectedCourseId, "Untitled Lesson");
    refreshLessons();
    setSelectedLessonId(newLesson.id);
    toast.success("Lesson created");
  };

  const handleSaveLesson = async () => {
    if (!selectedLesson || !lessonDraft) return;
    if (!lessonDraft.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    await updateLesson(selectedLesson.id, {
      title: lessonDraft.title.trim(),
      chapterTitle: lessonDraft.chapterTitle.trim() || undefined,
    });
    refreshLessons();
    toast.success("Lesson saved");
  };

  const handleDeleteLesson = async (lessonId: string) => {
    await deleteLesson(lessonId);
    refreshLessons();
    toast.success("Lesson deleted");
  };

  const handleLessonDrop = async (targetId: string) => {
    if (!dragLessonId || !selectedCourseId || dragLessonId === targetId) return;

    const fromIndex = lessons.findIndex((lesson) => lesson.id === dragLessonId);
    const toIndex = lessons.findIndex((lesson) => lesson.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = reorderList(lessons, fromIndex, toIndex).map((lesson, index) => ({
      ...lesson,
      order: index + 1,
    }));
    setLessons(reordered);
    await reorderLessons(selectedCourseId, reordered.map((lesson) => lesson.id));
    setDragLessonId(null);
  };

  const handleBlockDrop = async (targetId: string) => {
    if (!dragBlockId || !selectedLesson || dragBlockId === targetId) return;

    const blocks = [...selectedLesson.contentBlocks].sort((a, b) => a.order - b.order);
    const fromIndex = blocks.findIndex((block) => block.id === dragBlockId);
    const toIndex = blocks.findIndex((block) => block.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = reorderList(blocks, fromIndex, toIndex).map((block, index) => ({
      ...block,
      order: index + 1,
    }));

    await reorderContentBlocks(selectedLesson.id, reordered.map((block) => block.id));
    refreshLessons();
    setDragBlockId(null);
  };

  const openNewBlockDialog = () => {
    setBlockDraft({
      type: "text",
      title: "",
      content: "",
    });
    setBlockDialogOpen(true);
  };

  const openEditBlockDialog = (block: ContentBlock) => {
    setBlockDraft({
      id: block.id,
      type: block.type,
      title: block.title || "",
      content: block.content,
    });
    setBlockDialogOpen(true);
  };

  const handleSaveBlock = async () => {
    if (!selectedLesson || !blockDraft) return;
    if (!blockDraft.content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (blockDraft.id) {
      await updateContentBlock(selectedLesson.id, blockDraft.id, {
        type: blockDraft.type,
        title: blockDraft.title.trim() || undefined,
        content: blockDraft.content,
      });
      toast.success("Content block updated");
    } else {
      await addContentBlock(
        selectedLesson.id,
        blockDraft.type,
        blockDraft.content,
        blockDraft.title.trim() || undefined
      );
      toast.success("Content block added");
    }

    setBlockDialogOpen(false);
    refreshLessons();
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedLesson) return;
    await deleteContentBlock(selectedLesson.id, blockId);
    refreshLessons();
    toast.success("Content block deleted");
  };

  const handleCreateQuiz = () => {
    if (!quizDraft) {
      setQuizDraft({
        passThreshold: courseControlsDraft.defaultQuizPassThreshold,
        questions: [],
      });
    }
  };

  const handleSaveQuiz = async () => {
    if (!selectedLesson || !quizDraft) return;

    await setLessonQuiz(selectedLesson.id, quizDraft.questions, quizDraft.passThreshold);
    refreshLessons();
    toast.success("Quiz saved");
  };

  const handleRemoveQuiz = async () => {
    if (!selectedLesson) return;
    await removeLessonQuiz(selectedLesson.id);
    refreshLessons();
    toast.success("Quiz removed");
  };

  const openNewQuestionDialog = () => {
    setQuestionDraft({
      text: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
    });
    setQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (question: QuizQuestion) => {
    setQuestionDraft({
      id: question.id,
      text: question.text,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
    });
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!questionDraft || !quizDraft) return;
    if (!questionDraft.text.trim()) {
      toast.error("Question text is required");
      return;
    }

    const options = questionDraft.options.map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) {
      toast.error("Add at least two options");
      return;
    }

    const correctedIndex = Math.min(questionDraft.correctOptionIndex, options.length - 1);
    const updatedQuestion: QuizQuestion = {
      id: questionDraft.id || crypto.randomUUID(),
      text: questionDraft.text.trim(),
      options,
      correctOptionIndex: correctedIndex,
    };

    setQuizDraft((prev) => {
      if (!prev) return prev;
      const existingIndex = prev.questions.findIndex((q) => q.id === updatedQuestion.id);
      if (existingIndex === -1) {
        return { ...prev, questions: [...prev.questions, updatedQuestion] };
      }
      const nextQuestions = [...prev.questions];
      nextQuestions[existingIndex] = updatedQuestion;
      return { ...prev, questions: nextQuestions };
    });

    setQuestionDialogOpen(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuizDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((question) => question.id !== questionId),
      };
    });
  };

  const handleSaveCourseControls = async () => {
    if (!selectedCourseId) return;
    await saveCourseControls(selectedCourseId, courseControlsDraft);
    toast.success("Course controls saved");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading lesson management...</div>
      </AppLayout>
    );
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const lessonBlocks = selectedLesson?.contentBlocks
    ? [...selectedLesson.contentBlocks].sort((a, b) => a.order - b.order)
    : [];

  return (
    <AppLayout>
      <div className="p-6">
        <GovernanceHeader
          title="Lesson Management"
          description="Build lessons, content blocks, and quizzes for lesson-based courses."
          showBackButton
        />

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Courses & Lessons
              </CardTitle>
              <CardDescription>Select a course and manage its lessons.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                        {!course.isLessonBased ? " (not lesson-based)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Lessons</Label>
                <Button size="sm" onClick={handleCreateLesson}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {lessons.length === 0 && (
                  <div className="text-sm text-muted-foreground">No lessons yet.</div>
                )}
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    draggable
                    onDragStart={() => setDragLessonId(lesson.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleLessonDrop(lesson.id)}
                    className={
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer " +
                      (lesson.id === selectedLessonId
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted")
                    }
                    onClick={() => setSelectedLessonId(lesson.id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{lesson.title}</p>
                      {lesson.chapterTitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lesson.chapterTitle}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{lesson.order}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
                <CardDescription>Title and chapter grouping for the sidebar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLesson && lessonDraft ? (
                  <>
                    <div className="space-y-2">
                      <Label>Lesson Title</Label>
                      <Input
                        value={lessonDraft.title}
                        onChange={(event) =>
                          setLessonDraft({
                            ...lessonDraft,
                            title: event.target.value,
                          })
                        }
                        placeholder="Lesson title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chapter Title</Label>
                      <Input
                        value={lessonDraft.chapterTitle}
                        onChange={(event) =>
                          setLessonDraft({
                            ...lessonDraft,
                            chapterTitle: event.target.value,
                          })
                        }
                        placeholder="Optional grouping title"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button onClick={handleSaveLesson}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Lesson
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Lesson
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the lesson, its content blocks, and quiz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteLesson(selectedLesson.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Select a lesson to edit.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Blocks</CardTitle>
                    <CardDescription>Ordered lesson content (drag to reorder).</CardDescription>
                  </div>
                  <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={openNewBlockDialog} disabled={!selectedLesson}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Block
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {blockDraft?.id ? "Edit Content Block" : "Add Content Block"}
                        </DialogTitle>
                      </DialogHeader>
                      {blockDraft && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Block Type</Label>
                            <Select
                              value={blockDraft.type}
                              onValueChange={(value) =>
                                setBlockDraft({
                                  ...blockDraft,
                                  type: value as ContentBlockType,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(blockTypeLabels).map(([type, label]) => (
                                  <SelectItem key={type} value={type}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={blockDraft.title}
                              onChange={(event) =>
                                setBlockDraft({
                                  ...blockDraft,
                                  title: event.target.value,
                                })
                              }
                              placeholder="Optional block title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                              value={blockDraft.content}
                              onChange={(event) =>
                                setBlockDraft({
                                  ...blockDraft,
                                  content: event.target.value,
                                })
                              }
                              placeholder="Paste URL or markdown"
                              rows={5}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveBlock}>Save Block</Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedLesson && (
                  <div className="text-sm text-muted-foreground">Select a lesson to manage content.</div>
                )}
                {selectedLesson && lessonBlocks.length === 0 && (
                  <div className="text-sm text-muted-foreground">No blocks yet.</div>
                )}
                {selectedLesson && lessonBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => setDragBlockId(block.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleBlockDrop(block.id)}
                    className="flex items-start gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {blockTypeIcons[block.type]}
                        {block.title || blockTypeLabels[block.type]}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {block.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditBlockDialog(block)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteBlock(block.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5" />
                      Lesson Quiz
                    </CardTitle>
                    <CardDescription>Build quiz questions and pass threshold.</CardDescription>
                  </div>
                  {selectedLesson && !quizDraft && (
                    <Button size="sm" onClick={handleCreateQuiz}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Quiz
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedLesson && (
                  <div className="text-sm text-muted-foreground">Select a lesson to manage quizzes.</div>
                )}
                {selectedLesson && quizDraft && (
                  <>
                    <div className="space-y-2">
                      <Label>Pass Threshold ({quizDraft.passThreshold}%)</Label>
                      <Slider
                        value={[quizDraft.passThreshold]}
                        onValueChange={(value) =>
                          setQuizDraft({
                            ...quizDraft,
                            passThreshold: value[0],
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <Label>Questions</Label>
                      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={openNewQuestionDialog}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Question
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle>
                              {questionDraft?.id ? "Edit Question" : "Add Question"}
                            </DialogTitle>
                          </DialogHeader>
                          {questionDraft && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Question Text</Label>
                                <Textarea
                                  value={questionDraft.text}
                                  onChange={(event) =>
                                    setQuestionDraft({
                                      ...questionDraft,
                                      text: event.target.value,
                                    })
                                  }
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Options</Label>
                                {questionDraft.options.map((option, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="correct-option"
                                      checked={questionDraft.correctOptionIndex === index}
                                      onChange={() =>
                                        setQuestionDraft({
                                          ...questionDraft,
                                          correctOptionIndex: index,
                                        })
                                      }
                                    />
                                    <Input
                                      value={option}
                                      onChange={(event) => {
                                        const nextOptions = [...questionDraft.options];
                                        nextOptions[index] = event.target.value;
                                        setQuestionDraft({
                                          ...questionDraft,
                                          options: nextOptions,
                                        });
                                      }}
                                      placeholder={`Option ${index + 1}`}
                                    />
                                    {questionDraft.options.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const nextOptions = questionDraft.options.filter((_, i) => i !== index);
                                          const nextCorrect = Math.max(
                                            0,
                                            Math.min(questionDraft.correctOptionIndex, nextOptions.length - 1)
                                          );
                                          setQuestionDraft({
                                            ...questionDraft,
                                            options: nextOptions,
                                            correctOptionIndex: nextCorrect,
                                          });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setQuestionDraft({
                                      ...questionDraft,
                                      options: [...questionDraft.options, ""],
                                    })
                                  }
                                >
                                  Add Option
                                </Button>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveQuestion}>Save Question</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="space-y-3">
                      {quizDraft.questions.length === 0 && (
                        <div className="text-sm text-muted-foreground">No questions yet.</div>
                      )}
                      {quizDraft.questions.map((question, index) => (
                        <div key={question.id} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {index + 1}. {question.text}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Correct: {question.options[question.correctOptionIndex]}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditQuestionDialog(question)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {question.options.map((option, optionIndex) => (
                              <Badge
                                key={optionIndex}
                                variant={optionIndex === question.correctOptionIndex ? "default" : "secondary"}
                              >
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button onClick={handleSaveQuiz}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Quiz
                      </Button>
                      <Button variant="outline" onClick={handleRemoveQuiz}>
                        Remove Quiz
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Controls</CardTitle>
                <CardDescription>Global quiz behavior for this course.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCourse ? (
                  <>
                    <div className="space-y-2">
                      <Label>Default Pass Threshold ({courseControlsDraft.defaultQuizPassThreshold}%)</Label>
                      <Slider
                        value={[courseControlsDraft.defaultQuizPassThreshold]}
                        onValueChange={(value) =>
                          setCourseControlsDraft({
                            ...courseControlsDraft,
                            defaultQuizPassThreshold: value[0],
                          })
                        }
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Allow Retakes</p>
                        <p className="text-xs text-muted-foreground">Let learners retry quizzes.</p>
                      </div>
                      <Switch
                        checked={courseControlsDraft.allowRetakes}
                        onCheckedChange={(checked) =>
                          setCourseControlsDraft({
                            ...courseControlsDraft,
                            allowRetakes: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Show Correct Answers</p>
                        <p className="text-xs text-muted-foreground">Reveal answers after submission.</p>
                      </div>
                      <Switch
                        checked={courseControlsDraft.showCorrectAnswersAfterQuiz}
                        onCheckedChange={(checked) =>
                          setCourseControlsDraft({
                            ...courseControlsDraft,
                            showCorrectAnswersAfterQuiz: checked,
                          })
                        }
                      />
                    </div>
                    <Button onClick={handleSaveCourseControls}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Course Controls
                    </Button>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Select a course to edit controls.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LessonManagement;
