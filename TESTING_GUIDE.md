# INTELLIGENCE LAYER - TESTING & DEPLOYMENT GUIDE

## OVERVIEW
This guide covers testing the upgraded Intelligence Layer system with:
- Structured summaries ("Our Briefing")
- Configurable display settings
- AI SOFTWARE as first category (not AI News)
- Featured Courses in Control Centre
- Professional briefing view page

---

## PRE-DEPLOYMENT CHECKLIST

### 1. DATABASE MIGRATION
```bash
# Apply the new migration to D1
wrangler d1 execute PROVENAI_DB --file=migrations/0008_intelligence_layer_upgrade.sql --remote

# Verify columns were added
wrangler d1 execute PROVENAI_DB --command="PRAGMA table_info(briefing_items)" --remote
wrangler d1 execute PROVENAI_DB --command="PRAGMA table_info(briefing_sources)" --remote
wrangler d1 execute PROVENAI_DB --command="SELECT * FROM app_config WHERE key LIKE 'INTEL_%'" --remote
```

### 2. BUILD & DEPLOY
```bash
# Build the app
npm run build

# Deploy to Cloudflare Pages
git add .
git commit -m "feat: intelligence layer upgrade - structured summaries + admin controls"
git push origin main

# Cloudflare Pages will auto-deploy from main branch
```

---

## TESTING CHECKLIST

### TEST 1: Database Schema
**Goal**: Verify all new columns exist

```bash
# Check briefing_sources
wrangler d1 execute PROVENAI_DB --command="SELECT allow_inline_reading, fetch_mode, summary_mode_v2 FROM briefing_sources LIMIT 1" --remote

# Check briefing_items  
wrangler d1 execute PROVENAI_DB --command="SELECT summary_what_changed, reading_status, reading_time_min FROM briefing_items LIMIT 1" --remote

# Check app_config
wrangler d1 execute PROVENAI_DB --command="SELECT key, value FROM app_config WHERE key='INTEL_ITEMS_PER_CATEGORY'" --remote
```

**Expected**: No errors, columns return (even if NULL)

---

### TEST 2: Add RSS Sources
**Goal**: Add sources for all 4 categories

1. Go to `/admin/briefing/sources`
2. Add sources:

```
AI SOFTWARE:
- Name: TechCrunch AI
- URL: https://techcrunch.com/category/artificial-intelligence/feed/
- Category: ai_software

AI ROBOTICS:
- Name: IEEE Spectrum Robotics
- URL: https://spectrum.ieee.org/feeds/topic/robotics
- Category: ai_robotics

AI MEDICINE:
- Name: Healthcare IT News
- URL: https://www.healthcareitnews.com/feed
- Category: ai_medicine

AI BUSINESS:
- Name: VentureBeat AI
- URL: https://venturebeat.com/category/ai/feed/
- Category: ai_business
```

**Expected**: Sources save without errors

---

### TEST 3: Run Briefing Manually
**Goal**: Fetch RSS and generate structured summaries

1. Go to `/admin/briefing/settings` or Control Centre
2. Click "Run" button (Play icon in right column if admin)
3. Wait 10-30 seconds
4. Check response

**Expected**:
- Status: "success" or "partial"
- Items created: > 0
- No critical errors

**Verify in database**:
```bash
wrangler d1 execute PROVENAI_DB --command="SELECT title, category, summary_what_changed, reading_time_min FROM briefing_items WHERE status='published' ORDER BY fetched_at DESC LIMIT 5" --remote
```

---

### TEST 4: Control Centre Display
**Goal**: Verify right column shows exactly 4 categories in correct order

1. Go to `/control-centre` (or `/dashboard`)
2. Check RIGHT COLUMN

**Expected**:
- Section title: "AI INTELLIGENCE" (not "AI Signals")
- Exactly 4 categories in this order:
  1. AI SOFTWARE (blue pill)
  2. AI ROBOTICS (purple pill)
  3. AI MEDICINE (red pill)
  4. AI BUSINESS (green pill)
- Each category shows 1-2 items (configurable)
- Each item shows:
  - Category pill
  - Title (clickable)
  - Source name + date
  - Summary snippet

**Expected in MAIN COLUMN**:
- Featured Courses (2 tiles)
- Editor's Picks
- Your Focus
- Platform Updates
- NO RSS content anywhere in main column

---

### TEST 5: Briefing View Page
**Goal**: Verify in-app article view is valuable

1. From Control Centre, click any intelligence item
2. Should navigate to `/intelligence/:id`

**Expected PAGE STRUCTURE**:
```
Back to Control Centre
[Category Pill] [Date]

[TITLE]

Source: [Source Name]

────────────────────────────

OUR BRIEFING
What changed
[1-2 sentences]

Why it matters
[1-2 sentences]

Key takeaway
• [1 bullet point]

────────────────────────────

Excerpt
[300-900 chars of clean text]

────────────────────────────

[Full article content if available]
OR
[Message: "This source does not allow inline reading"]

────────────────────────────

[Read original at Source Name] (button)
```

**Critical checks**:
- "Our Briefing" section ALWAYS shows (even if placeholder text)
- Excerpt shows if available
- "Read original" button ALWAYS present
- Page feels valuable even if full content blocked

---

### TEST 6: Admin Settings
**Goal**: Verify admin can control display options

1. Go to `/admin/briefing/settings` (new intelligence settings)
2. Test each control:

**Items per category**: Change from 2 → 3
- Save
- Go to Control Centre
- Verify right column now shows 3 items per category

**Show thumbnails**: Toggle OFF
- Save
- Refresh Control Centre
- Verify no images show in right column

**Summary length**: Change to "short"
- Save
- Run briefing again
- Check new items have shorter summaries

**Excerpt length**: Change from 400 → 600
- Save
- Run briefing
- New items should have longer excerpts

**Article view**: Change to "off"
- Save
- Click intelligence item from Control Centre
- Should go DIRECTLY to external site (not /intelligence/:id)

**Expected**: All toggles work without errors

---

### TEST 7: Sources That Block Inline Reading
**Goal**: Verify fallback experience is still valuable

1. Add a source known to block scraping (e.g., NY Times)
2. Run briefing
3. Click item from that source

**Expected**:
- "Our Briefing" section still shows
- Excerpt shows if RSS provided one
- Message: "This source does not allow inline reading"
- "Read original" button prominent
- Overall page still feels professional and valuable

---

### TEST 8: Mobile Responsiveness
**Goal**: Ensure layout works on mobile

1. Open Control Centre on mobile (or resize browser)

**Expected**:
- Main column content stacks vertically
- Right column (AI Intelligence) moves BELOW main column
- Featured Courses tiles stack (not side-by-side)
- Everything readable, no horizontal scroll

---

### TEST 9: Category Migration
**Goal**: Verify old ai_news items migrated to ai_software

```bash
# Check for any remaining ai_news
wrangler d1 execute PROVENAI_DB --command="SELECT COUNT(*) as count FROM briefing_items WHERE category='ai_news'" --remote

# Should return 0

# Check ai_software count
wrangler d1 execute PROVENAI_DB --command="SELECT COUNT(*) as count FROM briefing_items WHERE category='ai_software'" --remote

# Should be > 0 if you had ai_news items before
```

---

## COMMON ISSUES & FIXES

### Issue: Migration fails with "duplicate column"
**Cause**: Column already exists from partial migration
**Fix**:
```bash
# Check what exists
wrangler d1 execute PROVENAI_DB --command="PRAGMA table_info(briefing_items)" --remote

# Manually add only missing columns
# Edit migration file to comment out existing columns
```

### Issue: No items showing in right column
**Check**:
1. Items exist: `SELECT COUNT(*) FROM briefing_items WHERE status='published'`
2. Categories correct: `SELECT DISTINCT category FROM briefing_items`
3. API returns data: `curl https://provenai.app/api/briefing?limit=20`

### Issue: Structured summaries are NULL
**Cause**: Old items don't have summaries (only new items from upgraded worker)
**Fix**: Run briefing again to fetch new items, or manually update:
```bash
wrangler d1 execute PROVENAI_DB --command="UPDATE briefing_items SET summary_what_changed='Placeholder summary' WHERE summary_what_changed IS NULL AND status='published'" --remote
```

### Issue: Wrong category order in UI
**Check**: IntelligenceBriefing.tsx uses correct array:
```typescript
const INTEL_CATEGORIES = ["ai_software", "ai_robotics", "ai_medicine", "ai_business"]
```

---

## POST-DEPLOYMENT VERIFICATION

### Quick Smoke Test (5 minutes)
1. ✅ Visit `/control-centre`
2. ✅ Right column shows "AI INTELLIGENCE" with 4 categories
3. ✅ Click any item → goes to `/intelligence/:id`
4. ✅ "Our Briefing" section shows on detail page
5. ✅ Main column shows Featured Courses at top
6. ✅ No RSS content in main column

### Full Test (15 minutes)
- All tests 1-9 above pass

---

## ROLLBACK PROCEDURE

If major issues occur:

```bash
# Option 1: Revert Git commit
git revert HEAD
git push origin main

# Option 2: Revert specific migration
wrangler d1 execute PROVENAI_DB --file=migrations/rollback_0008.sql --remote

# Create rollback_0008.sql with:
# ALTER TABLE briefing_items DROP COLUMN summary_what_changed;
# ALTER TABLE briefing_items DROP COLUMN summary_why_matters;
# etc. for each new column
```

---

## NEXT STEPS (Future Enhancements)

### 1. LLM-Powered Summaries
Replace `generateStructuredSummary()` placeholder with actual LLM API:
- Anthropic Claude API
- OpenAI GPT-4
- Ensure calm, professional tone

### 2. Readability Extraction
Implement full article fetch for `allow_inline_reading` sources:
- Server-side fetch with readability.js
- Sanitize HTML
- Store in `content_html`

### 3. Per-Source Configuration
Add UI in Sources admin page to set:
- `allow_inline_reading` toggle
- `fetch_mode` dropdown
- `summary_mode` dropdown

### 4. Per-Item Manual Overrides
Add admin edit page for individual items:
- Manually write structured summaries
- Override reading_status
- Add custom commentary

---

## CONTACT & SUPPORT

**If you encounter issues**:
1. Check browser console for errors
2. Check Cloudflare Pages logs
3. Check D1 database directly via wrangler
4. Verify API endpoints return expected data structure

**Key Files Modified**:
- `migrations/0008_intelligence_layer_upgrade.sql`
- `functions/api/briefing/_helpers.ts`
- `functions/api/briefing/index.ts`
- `functions/api/briefing/[itemId].ts`
- `functions/api/admin/briefing/run.ts`
- `functions/api/admin/briefing/settings.ts`
- `src/components/briefing/IntelligenceBriefing.tsx`
- `src/components/dashboard/FeaturedCourses.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/intelligence/ArticleReader.tsx`
- `src/pages/admin/briefing/IntelligenceSettingsNew.tsx`
