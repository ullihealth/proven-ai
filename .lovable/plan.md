

# Option B Hybrid: Course Lessons with Progress Gating & Quiz System

## Overview

This plan implements a structured lesson-based course system with:
- **Sequential lesson locking** - next lesson only accessible after previous is completed
- **Rich content blocks** - video, text, images, PDFs
- **Quiz questions** - with configurable pass threshold (e.g., 70%)
- **Sidebar navigation** - showing lessons with progress indicators (like the Teachable reference)
- **Hybrid approach** - short courses remain single-page; deep courses get the full lesson structure

---

## What You'll Get

### For Learners
- Clear sidebar showing all lessons with completion checkmarks
- Progress bar at top (e.g., "61% COMPLETE")
- "Complete and Continue" button to advance
- Locked lessons show a subtle indicator until previous is done
- Quizzes embedded within lessons; must score 70%+ (configurable) to proceed

### For Admins
- New "Course Controls" section in Admin to set quiz pass threshold
- Lesson editor to add/reorder lessons within courses
- Content block editor (add video, text, image, or PDF blocks)
- Quiz builder with multiple-choice questions and correct answer marking

---

## Data Architecture

### New Types (extend `src/lib/courses/types.ts`)

```text
┌─────────────────────────────────────────────────────────────┐
│                         COURSE                              │
│  id, title, description, courseType, lessonIds[]           │
│  isLessonBased: boolean (true = sidebar view)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         LESSON                              │
│  id, courseId, title, order, contentBlocks[]               │
│  quiz?: Quiz (optional)                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTENT BLOCK                           │
│  id, type: 'video' | 'text' | 'image' | 'pdf'              │
│  content: string (URL, markdown, base64)                    │
│  order: number                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          QUIZ                               │
│  id, lessonId, questions[], passThreshold: number (0-100)  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      QUIZ QUESTION                          │
│  id, text, options[], correctOptionIndex: number           │
└─────────────────────────────────────────────────────────────┘
```

### User Progress (stored per-user in localStorage, ready for DB migration)

```text
┌─────────────────────────────────────────────────────────────┐
│                    USER PROGRESS                            │
│  userId, courseId, completedLessonIds[], quizScores{}      │
│  currentLessonId, lastAccessedAt                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### New Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/learn/courses/:courseSlug` | `CourseLandingPage` | Course overview, "Start Course" button |
| `/learn/courses/:courseSlug/lesson/:lessonId` | `LessonPage` | Sidebar + lesson content + quiz |

### New Components

| Component | Purpose |
|-----------|---------|
| `CourseSidebar` | Left sidebar with course title, progress %, lesson list with checkmarks |
| `LessonContent` | Renders content blocks (video, text, image, PDF) |
| `LessonQuiz` | Quiz UI with questions, submit, score display |
| `LessonNavigation` | "Previous Lesson" and "Complete and Continue" buttons |
| `LockedLessonGate` | Shown when trying to access a locked lesson |

### Admin Components

| Component | Purpose |
|-----------|---------|
| `LessonEditor` | Add/edit/reorder lessons within a course |
| `ContentBlockEditor` | WYSIWYG-style block editor for lesson content |
| `QuizBuilder` | Add questions, set correct answers, configure pass % |
| `CourseControlsPanel` | Global settings (default quiz threshold, etc.) |

---

## Implementation Phases

### Phase 1: Data Layer
- Extend `types.ts` with Lesson, ContentBlock, Quiz, QuizQuestion, UserProgress interfaces
- Create `lessonStore.ts` for CRUD operations
- Create `userProgressStore.ts` for tracking completions

### Phase 2: Lesson Display
- Build `CourseSidebar` component matching the Teachable reference
- Build `LessonContent` to render content blocks
- Build `LessonPage` with sidebar layout
- Add routes to App.tsx

### Phase 3: Progress & Locking
- Implement `UserProgressContext` for state management
- Add "Complete and Continue" logic
- Implement lesson locking based on previous completion

### Phase 4: Quiz System
- Build `LessonQuiz` component with question display
- Implement scoring and pass/fail logic
- Store quiz attempts in progress

### Phase 5: Admin Interface
- Add "Lessons" tab to Course Management
- Build lesson and content block editors
- Build quiz builder UI
- Add Course Controls page/section for global settings

---

## Lesson Page Layout (Desktop)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Previous Lesson                         Complete and Continue →       │
├─────────────────┬────────────────────────────────────────────────────────┤
│                 │                                                        │
│  Course Title   │  10.3. Lesson Title                                   │
│  ─────────────  │                                                        │
│  ████████░░ 61% │  ┌────────────────────────────────────────────────┐   │
│                 │  │                                                │   │
│  Chapter 1      │  │              VIDEO PLAYER                      │   │
│  ☑ 1.1 Lesson   │  │                                                │   │
│  ☑ 1.2 Lesson   │  └────────────────────────────────────────────────┘   │
│  ☑ 1.3 Lesson   │                                                        │
│  ○ 1.4 Lesson   │  Text content block here...                           │
│  🔒 1.5 Lesson  │                                                        │
│                 │  ┌──────────────────────────────────────────────────┐ │
│  Chapter 2      │  │ Quiz: Answer 3 questions (70% to pass)          │ │
│  🔒 2.1 Lesson  │  │                                                  │ │
│  🔒 2.2 Lesson  │  │ Q1: What is the best approach?                  │ │
│                 │  │    ○ Option A                                    │ │
│                 │  │    ○ Option B                                    │ │
│                 │  │    ○ Option C                                    │ │
│                 │  │                                                  │ │
│                 │  │           [Submit Quiz]                          │ │
│                 │  └──────────────────────────────────────────────────┘ │
│                 │                                                        │
│                 │         [Complete and Continue →]                      │
└─────────────────┴────────────────────────────────────────────────────────┘
```

---

## Mobile Considerations

- Sidebar becomes a collapsible drawer (hamburger menu)
- Progress bar always visible at top
- Quiz questions stack vertically
- Large touch targets for options and buttons

---

## Hybrid Logic

The system decides which view to use based on course metadata:

| Condition | View |
|-----------|------|
| `courseType === 'short'` AND no lessons defined | Single-page scroll (current behavior) |
| `courseType === 'deep'` OR `isLessonBased === true` | Sidebar lesson view |
| Lessons array exists and has items | Sidebar lesson view (regardless of type) |

This allows gradual migration without breaking existing courses.

---

## Cost & Complexity Analysis

| Item | Cost | Notes |
|------|------|-------|
| Data storage | Zero | localStorage now, D1/Postgres later |
| Video hosting | Zero | Uses existing YouTube/Vimeo embeds or user-provided URLs |
| PDF viewer | Zero | Native browser PDF rendering or simple iframe |
| Quiz grading | Zero | Client-side JavaScript |
| Progress tracking | Zero | localStorage, no server calls |
| Additional dependencies | Zero | Uses existing React/Radix components |

**No third-party LMS tools required.**

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/courses/lessonTypes.ts` | Lesson, ContentBlock, Quiz type definitions |
| `src/lib/courses/lessonStore.ts` | CRUD for lessons and content blocks |
| `src/lib/courses/progressStore.ts` | User progress tracking |
| `src/lib/courses/quizStore.ts` | Quiz data management |
| `src/components/courses/CourseSidebar.tsx` | Sidebar with progress and lessons |
| `src/components/courses/LessonContent.tsx` | Content block renderer |
| `src/components/courses/LessonQuiz.tsx` | Quiz UI component |
| `src/components/courses/LessonNavigation.tsx` | Nav buttons |
| `src/pages/learn/CourseLandingPage.tsx` | Course overview page |
| `src/pages/learn/LessonPage.tsx` | Full lesson view |
| `src/pages/admin/content/LessonManagement.tsx` | Admin lesson editor |
| `src/pages/admin/content/QuizBuilder.tsx` | Admin quiz editor |
| `src/pages/admin/CourseControls.tsx` | Global quiz settings |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/courses/types.ts` | Add lesson-related fields to Course interface |
| `src/App.tsx` | Add new routes for lesson pages |
| `src/pages/admin/content/CourseManagement.tsx` | Add "Lessons" tab |
| `src/components/layout/AppSidebar.tsx` | (Optional) Show current course progress |

---

## Recommended Implementation Order

1. **Data types and stores** - Foundation for everything
2. **Lesson display components** - See the structure working
3. **Progress tracking** - Enable completion flow
4. **Quiz system** - Add gating mechanism
5. **Admin interfaces** - Allow content creation

This phased approach lets you test each layer before building the next.

