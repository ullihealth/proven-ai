
# Daily Flow Video Pages & Admin Posting System

## Overview

This plan transforms the existing Daily Flow pages (Monday-Friday) from static content lists into a video-first posting system with admin-controlled publishing and visual customization. The system will mirror the architecture of the existing Course Management system for consistency.

---

## Architecture Summary

```text
+-------------------+       +-------------------+       +-------------------+
|   Admin Console   | ----> |  Daily Flow Store | ----> | Daily Flow Pages  |
|   (CRUD + Visual) |       |   (localStorage)  |       |   (Mon-Fri)       |
+-------------------+       +-------------------+       +-------------------+
         |                          |
         v                          v
+-------------------+       +-------------------+
|  Visual Presets   |       |  Published Posts  |
|  (Shared w/Courses)|       |  (1 per day)     |
+-------------------+       +-------------------+
```

---

## Detailed Implementation Plan

### 1. Data Layer (`src/lib/dailyflow/`)

**New Files:**
- `types.ts` - TypeScript interfaces
- `dailyFlowStore.ts` - localStorage persistence
- `index.ts` - Public exports

**Types to Define:**

```text
DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

DailyFlowPost {
  id: string
  day: DayOfWeek
  title: string
  description: string
  videoType: 'upload' | 'url'
  videoUrl: string           // MP4 URL or external embed
  caption?: string           // Optional context text
  status: 'draft' | 'published'
  publishedAt?: string       // ISO timestamp
  createdAt: string
  updatedAt: string
}

DailyFlowVisualSettings {
  backgroundMode: 'plain' | 'gradient' | 'image'
  backgroundImage?: string
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
  accentColor?: string
  badgeIcon?: string
}
```

**Store Functions:**
- `getAllPosts()` - Retrieve all posts
- `getPostsByDay(day)` - Get all posts for a day
- `getPublishedPostForDay(day)` - Get the current active post
- `getPostById(id)` - Get specific post
- `savePost(post)` - Create or update
- `deletePost(id)` - Remove post
- `publishPost(id)` - Set as published, auto-unpublish previous
- `getDayVisualSettings(day)` - Get visual settings for a day
- `saveDayVisualSettings(day, settings)` - Save visual settings

---

### 2. Day Configuration Constants

**File:** `src/lib/dailyflow/types.ts`

```text
DAY_CONFIG = {
  monday: {
    label: 'Monday',
    theme: 'Foundations',
    description: 'Build your understanding...',
    icon: Target
  },
  tuesday: { theme: 'Tools & Tips', ... },
  wednesday: { theme: 'Work & Wealth', ... },
  thursday: { theme: 'AI News & Updates', ... },
  friday: { theme: 'Feedback & Questions', ... }
}
```

This ensures sidebar labels and page headings always match.

---

### 3. Frontend: Daily Flow Video Page Component

**File:** `src/components/daily/DailyFlowVideoPage.tsx`

**Layout (Single Column):**
```text
+------------------------------------------+
| Page Header: "Monday - Foundations"      |
| Description text                          |
+------------------------------------------+
|                                          |
|   +----------------------------------+   |
|   |                                  |   |
|   |     VIDEO PLAYER                 |   |
|   |     (16:9 aspect ratio)          |   |
|   |     Autoplay: OFF                |   |
|   |                                  |   |
|   +----------------------------------+   |
|                                          |
|   Post Title                             |
|   Short description text                 |
|   Optional caption (if provided)         |
|                                          |
+------------------------------------------+
```

**Key Features:**
- Uses `<AspectRatio ratio={16/9}>` for consistent sizing
- Native HTML5 video with `controls`, no `autoplay`
- Supports external URLs (iframe fallback for HeyGen, YouTube, etc.)
- Fully responsive (stacked layout on mobile)
- No social interactions (likes, comments, etc.)

**Empty State:**
When no published post exists for a day, display:
```text
"No video posted yet. Check back soon."
```

---

### 4. Refactor Existing Daily Pages

**Files to Modify:**
- `src/pages/daily/Monday.tsx`
- `src/pages/daily/Tuesday.tsx`
- `src/pages/daily/Wednesday.tsx`
- `src/pages/daily/Thursday.tsx`
- `src/pages/daily/Friday.tsx`

**Change:** Each page becomes a thin wrapper that:
1. Reads the published post from the store
2. Reads visual settings from the store
3. Renders `DailyFlowVideoPage` with the data

The current `DailyFlowPage.tsx` component will be deprecated and can be removed later.

---

### 5. Admin Sidebar Addition

**File:** `src/components/layout/AppSidebar.tsx`

Add to the `adminNavigation` subGroups under "Content":

```text
{ 
  title: "Daily Flow Posts", 
  href: "/admin/content/daily-flow", 
  icon: Video 
}
```

---

### 6. Admin: Daily Flow Management Page

**File:** `src/pages/admin/content/DailyFlowManagement.tsx`

**Layout:**
- Tab bar: Monday | Tuesday | Wednesday | Thursday | Friday
- For each day tab:
  - Published post card (if exists)
  - Drafts list
  - "Create New Post" button

**Features:**
- Create new post for selected day
- Edit existing post
- Upload MP4 or enter video URL
- Add title + description + optional caption
- Visual settings editor (same pattern as Course Management)
- Publish button (replaces current post)
- Save as draft

---

### 7. Post Editor Dialog

**Component:** `DailyFlowPostEditor` (inside DailyFlowManagement.tsx)

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Day | Select (Mon-Fri) | Yes |
| Title | Text input | Yes |
| Description | Textarea | Yes |
| Video Type | Radio: Upload / URL | Yes |
| Video URL | Text input | Conditional |
| Video File | File upload (MP4) | Conditional |
| Caption | Textarea | No |
| Status | Draft / Publish | Yes |

**Video Handling:**
- For URL: Accept any valid URL (HeyGen, YouTube, Vimeo, direct MP4)
- For Upload: Accept MP4 files, store as base64 in localStorage (development phase)
  - Note: Production would use Supabase Storage

---

### 8. Visual Settings for Daily Flow

**Reuse existing preset system** from Course Management:
- Same `VisualPreset` type
- Same preset picker UI
- Settings stored per-day (not per-post)

**Visual Settings Editor** mirrors Course Management:
- Background mode: Plain / Gradient / Image
- Gradient colors (3-color picker)
- Accent color
- Optional icon/badge per day
- Save as preset / Apply preset

---

### 9. Routing Updates

**File:** `src/App.tsx`

Add new admin route:
```text
/admin/content/daily-flow -> DailyFlowManagement
```

Wrapped with `<RequireAdmin>`.

---

### 10. Publishing Logic

When a post is published:
1. Find any existing published post for that day
2. Set its status to 'draft' (or 'archived')
3. Set the new post's status to 'published'
4. Record `publishedAt` timestamp
5. Save to localStorage

The public page always shows the single published post for that day.

---

## File Creation Summary

| File | Purpose |
|------|---------|
| `src/lib/dailyflow/types.ts` | Type definitions and day config |
| `src/lib/dailyflow/dailyFlowStore.ts` | localStorage CRUD + visual settings |
| `src/lib/dailyflow/index.ts` | Public exports |
| `src/components/daily/DailyFlowVideoPage.tsx` | Video page template |
| `src/components/daily/VideoPlayer.tsx` | Reusable video component |
| `src/pages/admin/content/DailyFlowManagement.tsx` | Admin management page |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add admin route for Daily Flow |
| `src/components/layout/AppSidebar.tsx` | Add admin nav item |
| `src/pages/daily/Monday.tsx` | Refactor to use video page |
| `src/pages/daily/Tuesday.tsx` | Refactor to use video page |
| `src/pages/daily/Wednesday.tsx` | Refactor to use video page |
| `src/pages/daily/Thursday.tsx` | Refactor to use video page |
| `src/pages/daily/Friday.tsx` | Refactor to use video page |

---

## Technical Notes

### Video URL Detection
The VideoPlayer component will auto-detect URL types:
- Direct MP4: Use native `<video>` element
- YouTube/Vimeo: Use iframe embed
- HeyGen or other: Use iframe with provided URL

### Aspect Ratio
All videos use 16:9 aspect ratio via Radix's `AspectRatio` component (already installed).

### Mobile Responsiveness
- Desktop: Generous padding, readable text
- Mobile: Full-width video, stacked layout, reduced spacing
- Touch-friendly controls (56px+ tap targets per design system)

### No Social Features
Per requirements, no likes, comments, shares, or reactions will be implemented.

### Data Persistence
Currently using localStorage (matching existing patterns). The store structure allows easy migration to Supabase when ready.

---

## Out of Scope (Confirmed)

- Feed / dashboard view
- Comments, likes, reactions
- Saturday or Sunday pages
- Member posting
- Video archival system

---

## Implementation Order

1. Data layer (types + store)
2. VideoPlayer component
3. DailyFlowVideoPage component
4. Admin management page with post editor
5. Visual settings integration
6. Refactor existing daily pages
7. Routing and sidebar updates
8. Testing and polish

