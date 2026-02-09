import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GovernanceHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Music,
  Eye,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Course, CoursePageStyle, LessonFontFamily } from "@/lib/courses/types";
import { defaultCoursePageStyle } from "@/lib/courses/types";
import type {
  ContentBlock,
  ContentBlockType,
  CourseControlsSettings,
  Lesson,
  QuizQuestion,
} from "@/lib/courses/lessonTypes";
import { defaultCourseControlsSettings } from "@/lib/courses/lessonTypes";
import {
  addContentBlock,
  createLesson,
  deleteContentBlock,
  deleteLesson,
  getLesson,
  getLessonsByCourse,
  initLessonStore,
  reorderContentBlocks,
  reorderLessons,
  setLessonQuiz,
  updateContentBlock,
  updateLesson,
  removeLessonQuiz,
} from "@/lib/courses/lessonStore";
import { getCourses, saveCourse } from "@/lib/courses";
import { LessonContent } from "@/components/courses/LessonContent";
import {
  getCourseControls,
  initCourseControlsStore,
  saveCourseControls,
} from "@/lib/courses/courseControlsStore";
import {
  deleteLessonTemplate,
  getLessonTemplateById,
  getLessonTemplates,
  initLessonTemplateStore,
  saveLessonTemplate,
  type LessonTemplate,
} from "@/lib/courses/lessonTemplateStore";
import { cn } from "@/lib/utils";

const blockTypeLabels: Record<ContentBlockType, string> = {
  video: "Video",
  text: "Text",
  image: "Image",
  pdf: "PDF",
  audio: "Audio",
};

const blockTypeIcons: Record<ContentBlockType, JSX.Element> = {
  video: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  pdf: <FileUp className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
};

const reorderList = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const fontFamilyOptions: Array<{ value: LessonFontFamily; label: string; css: string }> = [
  { value: "inter", label: "Inter", css: "Inter, system-ui, -apple-system, sans-serif" },
  { value: "georgia", label: "Georgia", css: "Georgia, 'Times New Roman', serif" },
  { value: "merriweather", label: "Merriweather", css: "Merriweather, Georgia, serif" },
  { value: "mono", label: "Mono", css: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace" },
];

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "210 20% 98%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const hslToHex = (hsl: string): string => {
  const clean = hsl.split("/")[0].trim();
  const parts = clean.split(" ").map((part) => parseFloat(part));
  if (parts.length < 3 || parts.some(Number.isNaN)) return "#f8fafc";

  const h = parts[0];
  const s = parts[1] / 100;
  const l = parts[2] / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value: number) => Math.round((value + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getFileNameFromUrl = (url: string) => {
  if (!url) return "";
  return url.split("/").pop() || "";
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
  const [blockEdits, setBlockEdits] = useState<ContentBlock[]>([]);
  const [openBlockIds, setOpenBlockIds] = useState<Record<string, boolean>>({});
  const [textPreviewMode, setTextPreviewMode] = useState<Record<string, boolean>>({});
  const blockAutosaveRef = useRef<Record<string, number>>({});
  const [blockTypePickerOpen, setBlockTypePickerOpen] = useState(false);

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
  const [pageStyleDraft, setPageStyleDraft] = useState<CoursePageStyle>(defaultCoursePageStyle);
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loadTemplateDialogOpen, setLoadTemplateDialogOpen] = useState(false);
  const [createLessonDialogOpen, setCreateLessonDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [loadTemplateId, setLoadTemplateId] = useState<string>("");
  const [activePanel, setActivePanel] = useState<"editor" | "preview">("editor");
  const autosaveTimerRef = useRef<number | null>(null);
  const lastSavedLessonRef = useRef<{ title: string; chapterTitle: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initLessonStore(),
        initCourseControlsStore(),
        initLessonTemplateStore(),
      ]);
      const allCourses = getCourses();
      setCourses(allCourses);
      setTemplates(getLessonTemplates());
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
    const selectedCourse = courses.find((course) => course.id === selectedCourseId);
    setPageStyleDraft(selectedCourse?.pageStyle || defaultCoursePageStyle);
  }, [selectedCourseId, courses]);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  useEffect(() => {
    if (!selectedLesson) {
      setLessonDraft(null);
      setQuizDraft(null);
      setBlockEdits([]);
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

    const sortedBlocks = [...selectedLesson.contentBlocks].sort((a, b) => a.order - b.order);
    setBlockEdits(sortedBlocks);
    setOpenBlockIds((prev) => {
      const next: Record<string, boolean> = { ...prev };
      sortedBlocks.forEach((block) => {
        if (next[block.id] === undefined) {
          next[block.id] = true;
        }
      });
      return next;
    });

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

  useEffect(() => {
    if (loadTemplateDialogOpen && templates.length > 0 && !loadTemplateId) {
      setLoadTemplateId(templates[0].id);
    }
  }, [loadTemplateDialogOpen, templates, loadTemplateId]);

  const refreshLessons = () => {
    if (!selectedCourseId) return;
    const updated = getLessonsByCourse(selectedCourseId);
    setLessons(updated);
    if (selectedLessonId && !updated.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(updated[0]?.id || null);
    }
  };

  const handleCreateLesson = () => {
    if (!selectedCourseId) return;
    setSelectedTemplateId("none");
    setCreateLessonDialogOpen(true);
  };

  const applyTemplateToLesson = async (lessonId: string, template: LessonTemplate) => {
    const existingBlocks = getLesson(lessonId)?.contentBlocks || [];
    await Promise.all(existingBlocks.map((block) => deleteContentBlock(lessonId, block.id)));

    const sortedBlocks = [...template.blocks].sort((a, b) => a.order - b.order);
    const createdBlocks: ContentBlock[] = [];
    for (const block of sortedBlocks) {
      const created = await addContentBlock(
        lessonId,
        block.type,
        block.content,
        block.title,
        block.altText
      );
      if (created) createdBlocks.push(created);
    }

    await reorderContentBlocks(
      lessonId,
      createdBlocks.sort((a, b) => a.order - b.order).map((block) => block.id)
    );
  };

  const handleConfirmCreateLesson = async () => {
    if (!selectedCourseId) return;
    const newLesson = await createLesson(selectedCourseId, "Untitled Lesson");
    if (selectedTemplateId !== "none") {
      const template = getLessonTemplateById(selectedTemplateId);
      if (template) {
        await applyTemplateToLesson(newLesson.id, template);
        const course = courses.find((item) => item.id === selectedCourseId);
        if (course) {
          const updatedCourse = { ...course, pageStyle: template.pageStyle };
          saveCourse(updatedCourse);
          setCourses((prev) => prev.map((item) => (item.id === course.id ? updatedCourse : item)));
          setPageStyleDraft(template.pageStyle);
        }
      }
    }
    refreshLessons();
    setSelectedLessonId(newLesson.id);
    setCreateLessonDialogOpen(false);
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

    const blocks = [...blockEdits].sort((a, b) => a.order - b.order);
    const fromIndex = blocks.findIndex((block) => block.id === dragBlockId);
    const toIndex = blocks.findIndex((block) => block.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = reorderList(blocks, fromIndex, toIndex).map((block, index) => ({
      ...block,
      order: index + 1,
    }));

    setBlockEdits(reordered);
    await reorderContentBlocks(selectedLesson.id, reordered.map((block) => block.id));
    refreshLessons();
    setDragBlockId(null);
  };

  const scheduleBlockSave = (blockId: string, updates: Partial<ContentBlock>) => {
    if (!selectedLesson) return;
    const timers = blockAutosaveRef.current;
    if (timers[blockId]) {
      window.clearTimeout(timers[blockId]);
    }

    timers[blockId] = window.setTimeout(async () => {
      await updateContentBlock(selectedLesson.id, blockId, updates);
      refreshLessons();
    }, 600);
  };

  const handleBlockFieldChange = (blockId: string, updates: Partial<ContentBlock>) => {
    setBlockEdits((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, ...updates } : block))
    );
    scheduleBlockSave(blockId, updates);
  };

  const handleAddBlock = async (type: ContentBlockType) => {
    if (!selectedLesson) return;

    const placeholders: Record<ContentBlockType, string> = {
      text: "# New section\n\nWrite your lesson content here.",
      video: "",
      image: "",
      pdf: "",
      audio: "",
    };

    const newBlock = await addContentBlock(
      selectedLesson.id,
      type,
      placeholders[type],
      undefined,
      type === "image" ? "" : undefined
    );

    if (newBlock) {
      setOpenBlockIds((prev) => ({ ...prev, [newBlock.id]: true }));
      setTextPreviewMode((prev) => ({ ...prev, [newBlock.id]: false }));
    }
    refreshLessons();
    setBlockTypePickerOpen(false);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedLesson) return;
    await deleteContentBlock(selectedLesson.id, blockId);
    setBlockEdits((prev) => prev.filter((block) => block.id !== blockId));
    setOpenBlockIds((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
    refreshLessons();
    toast.success("Content block deleted");
  };

  const toggleBlockOpen = (blockId: string) => {
    setOpenBlockIds((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
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

  const handleSaveTemplate = async () => {
    if (!selectedLesson) return;
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    const saved = await saveLessonTemplate(
      templateName.trim(),
      blockEdits,
      pageStyleDraft
    );
    setTemplates((prev) => [...prev, saved]);
    setTemplateName("");
    setTemplateDialogOpen(false);
    toast.success("Template saved");
  };

  const handleLoadTemplate = async () => {
    if (!selectedLesson) return;
    const template = getLessonTemplateById(loadTemplateId);
    if (!template) return;

    await applyTemplateToLesson(selectedLesson.id, template);
    const selectedCourse = courses.find((course) => course.id === selectedCourseId);
    if (selectedCourse) {
      const updatedCourse = { ...selectedCourse, pageStyle: template.pageStyle };
      saveCourse(updatedCourse);
      setCourses((prev) => prev.map((course) => (course.id === updatedCourse.id ? updatedCourse : course)));
      setPageStyleDraft(template.pageStyle);
    }
    refreshLessons();
    setLoadTemplateDialogOpen(false);
    toast.success("Template loaded");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteLessonTemplate(templateId);
    setTemplates((prev) => prev.filter((template) => template.id !== templateId));
    toast.success("Template deleted");
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

  const handleSavePageStyle = () => {
    if (!selectedCourseId) return;
    const selectedCourse = courses.find((course) => course.id === selectedCourseId);
    if (!selectedCourse) return;
    const updatedCourse: Course = {
      ...selectedCourse,
      pageStyle: pageStyleDraft,
    };
    saveCourse(updatedCourse);
    setCourses((prev) => prev.map((course) => (course.id === updatedCourse.id ? updatedCourse : course)));
    toast.success("Page style saved");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading lesson management...</div>
      </AppLayout>
    );
  }

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const activeFont =
    fontFamilyOptions.find((option) => option.value === pageStyleDraft.fontFamily) ||
    fontFamilyOptions[0];
  const lessonBlocks = blockEdits.length
    ? [...blockEdits].sort((a, b) => a.order - b.order)
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
                <Dialog open={createLessonDialogOpen} onOpenChange={setCreateLessonDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={handleCreateLesson}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Lesson</DialogTitle>
                      <DialogDescription>Start from scratch or a template.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Blank lesson</SelectItem>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateLessonDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleConfirmCreateLesson}>Create</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                    <CardDescription>Build the lesson page and preview it live.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={blockTypePickerOpen} onOpenChange={setBlockTypePickerOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" disabled={!selectedLesson}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Block
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Content Block</DialogTitle>
                          <DialogDescription>Select a block type to insert.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(blockTypeLabels).map(([type, label]) => (
                            <Button
                              key={type}
                              variant="outline"
                              className="justify-start gap-2"
                              onClick={() => handleAddBlock(type as ContentBlockType)}
                            >
                              {blockTypeIcons[type as ContentBlockType]}
                              {label}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!selectedLesson}>
                          <LayoutTemplate className="h-4 w-4 mr-1" />
                          Save Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Save as Template</DialogTitle>
                          <DialogDescription>Store blocks and page style as a reusable template.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                              value={templateName}
                              onChange={(event) => setTemplateName(event.target.value)}
                              placeholder="e.g. Standard Lesson"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveTemplate}>Save</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={loadTemplateDialogOpen} onOpenChange={setLoadTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!selectedLesson || templates.length === 0}>
                          <LayoutTemplate className="h-4 w-4 mr-1" />
                          Load Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Load Template</DialogTitle>
                          <DialogDescription>Replace blocks with a saved template.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Template</Label>
                            <Select value={loadTemplateId} onValueChange={setLoadTemplateId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            {templates.map((template) => (
                              <div key={template.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{template.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDeleteTemplate(template.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setLoadTemplateDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleLoadTemplate} disabled={!loadTemplateId}>
                              Load
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedLesson && (
                  <div className="text-sm text-muted-foreground">Select a lesson to manage content.</div>
                )}
                {selectedLesson && (
                  <>
                    <Tabs
                      value={activePanel}
                      onValueChange={(value) => setActivePanel(value as "editor" | "preview")}
                      className="lg:hidden"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div
                        className={cn(
                          "space-y-3",
                          activePanel === "preview" && "hidden lg:block"
                        )}
                      >
                        {lessonBlocks.length === 0 && (
                          <div className="text-sm text-muted-foreground">No blocks yet.</div>
                        )}
                        {lessonBlocks.map((block, index) => (
                          <div
                            key={block.id}
                            draggable
                            onDragStart={() => setDragBlockId(block.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleBlockDrop(block.id)}
                            className="rounded-lg border border-border bg-card"
                          >
                            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="secondary">{index + 1}</Badge>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  {blockTypeIcons[block.type]}
                                  {blockTypeLabels[block.type]}
                                </div>
                                {block.title && (
                                  <span className="text-xs text-muted-foreground">{block.title}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleBlockOpen(block.id)}
                                >
                                  {openBlockIds[block.id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
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

                            {openBlockIds[block.id] && (
                              <div className="space-y-4 px-3 py-3">
                                <div className="grid gap-3 sm:grid-cols-[180px,1fr]">
                                  <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={block.type}
                                      onValueChange={(value) =>
                                        handleBlockFieldChange(block.id, { type: value as ContentBlockType })
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
                                      value={block.title || ""}
                                      onChange={(event) =>
                                        handleBlockFieldChange(block.id, { title: event.target.value })
                                      }
                                      placeholder="Optional title"
                                    />
                                  </div>
                                </div>

                                {block.type === "text" && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label>Markdown Content</Label>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setTextPreviewMode((prev) => ({
                                            ...prev,
                                            [block.id]: !prev[block.id],
                                          }))
                                        }
                                      >
                                        {textPreviewMode[block.id] ? "Edit" : "Preview"}
                                      </Button>
                                    </div>
                                    {textPreviewMode[block.id] ? (
                                      <div className="rounded-lg border border-border bg-muted/40 p-4">
                                        <LessonContent blocks={[block]} />
                                      </div>
                                    ) : (
                                      <Textarea
                                        value={block.content}
                                        onChange={(event) =>
                                          handleBlockFieldChange(block.id, { content: event.target.value })
                                        }
                                        rows={6}
                                        placeholder="Write lesson content with markdown"
                                      />
                                    )}
                                  </div>
                                )}

                                {block.type !== "text" && (
                                  <div className="space-y-2">
                                    <Label>Source URL</Label>
                                    <Input
                                      value={block.content}
                                      onChange={(event) =>
                                        handleBlockFieldChange(block.id, { content: event.target.value })
                                      }
                                      placeholder="https://"
                                    />
                                  </div>
                                )}

                                {block.type === "image" && (
                                  <div className="space-y-2">
                                    <Label>Alt Text</Label>
                                    <Input
                                      value={block.altText || ""}
                                      onChange={(event) =>
                                        handleBlockFieldChange(block.id, { altText: event.target.value })
                                      }
                                      placeholder="Describe the image"
                                    />
                                  </div>
                                )}

                                {block.type === "pdf" && block.content && (
                                  <p className="text-xs text-muted-foreground">
                                    File: {getFileNameFromUrl(block.content)}
                                  </p>
                                )}

                                {block.content && block.type !== "text" && (
                                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                                    <LessonContent blocks={[block]} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div
                        className={cn(
                          "rounded-lg border border-border bg-card p-4",
                          activePanel === "editor" && "hidden lg:block"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                          <Eye className="h-4 w-4" />
                          Live Preview
                        </div>
                        <div
                          className="rounded-lg border border-border bg-background p-4"
                          style={{
                            backgroundColor: `hsl(${pageStyleDraft.backgroundColor})`,
                            fontFamily: activeFont.css,
                            fontSize: `${pageStyleDraft.bodyFontSize}px`,
                            ['--lesson-heading-weight' as string]: pageStyleDraft.headingFontWeight,
                            ['--lesson-font-family' as string]: activeFont.css,
                            ['--lesson-font-size' as string]: `${pageStyleDraft.bodyFontSize}px`,
                          }}
                        >
                          <div
                            className="lesson-content"
                            style={{ maxWidth: `${pageStyleDraft.contentMaxWidth}px` }}
                          >
                            <LessonContent blocks={lessonBlocks} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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

                    <Separator />

                    <div className="space-y-4">
                      <div>
                        <CardTitle className="text-base">Page Style</CardTitle>
                        <CardDescription>Control typography and layout for lesson pages.</CardDescription>
                      </div>
                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select
                          value={pageStyleDraft.fontFamily}
                          onValueChange={(value) =>
                            setPageStyleDraft({
                              ...pageStyleDraft,
                              fontFamily: value as LessonFontFamily,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontFamilyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Body Font Size ({pageStyleDraft.bodyFontSize}px)</Label>
                        <Slider
                          value={[pageStyleDraft.bodyFontSize]}
                          onValueChange={(value) =>
                            setPageStyleDraft({
                              ...pageStyleDraft,
                              bodyFontSize: value[0],
                            })
                          }
                          min={14}
                          max={20}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Heading Weight ({pageStyleDraft.headingFontWeight})</Label>
                        <Slider
                          value={[pageStyleDraft.headingFontWeight]}
                          onValueChange={(value) =>
                            setPageStyleDraft({
                              ...pageStyleDraft,
                              headingFontWeight: value[0],
                            })
                          }
                          min={400}
                          max={800}
                          step={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            value={hslToHex(pageStyleDraft.backgroundColor)}
                            onChange={(event) =>
                              setPageStyleDraft({
                                ...pageStyleDraft,
                                backgroundColor: hexToHsl(event.target.value),
                              })
                            }
                            className="h-10 w-16 p-1"
                          />
                          <Input
                            value={hslToHex(pageStyleDraft.backgroundColor)}
                            onChange={(event) =>
                              setPageStyleDraft({
                                ...pageStyleDraft,
                                backgroundColor: hexToHsl(event.target.value),
                              })
                            }
                            placeholder="#f8fafc"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Content Max Width ({pageStyleDraft.contentMaxWidth}px)</Label>
                        <Slider
                          value={[pageStyleDraft.contentMaxWidth]}
                          onValueChange={(value) =>
                            setPageStyleDraft({
                              ...pageStyleDraft,
                              contentMaxWidth: value[0],
                            })
                          }
                          min={640}
                          max={960}
                          step={20}
                        />
                      </div>
                      <Button onClick={handleSavePageStyle}>
                        <Save className="h-4 w-4 mr-1" />
                        Save Page Style
                      </Button>
                    </div>
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
