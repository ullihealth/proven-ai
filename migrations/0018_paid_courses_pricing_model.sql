-- Migration 0018: Paid course pricing model + seed paid courses into DB

-- price_model: 'tiered' (auto from release date) or 'fixed' (admin-set price)
ALTER TABLE courses ADD COLUMN price_model TEXT NOT NULL DEFAULT 'tiered';

-- fixed_price: dollar amount (integer cents-free), used when price_model = 'fixed'
ALTER TABLE courses ADD COLUMN fixed_price INTEGER;

-- is_lesson_based: flag to enable sidebar lesson navigation view
ALTER TABLE courses ADD COLUMN is_lesson_based INTEGER NOT NULL DEFAULT 0;

-- Seed the three paid courses that were previously hardcoded in PaidCourses.tsx
INSERT OR IGNORE INTO courses (
  id, slug, title, description, estimated_time, course_type, lifecycle_state,
  href, last_updated, price_model, fixed_price, is_lesson_based, "order",
  capability_tags, sections, tools_used
) VALUES
  (
    'membership_lifetime',
    'ai-mastery',
    'AI Mastery Program',
    'Our flagship comprehensive program covering everything from basics to advanced applications.',
    '',
    'deep',
    'current',
    '/courses/paid/ai-mastery',
    'January 25, 2026',
    'fixed',
    497,
    1,
    100,
    '[]', '[]', '[]'
  ),
  (
    'course_business_leaders',
    'business-leaders',
    'AI for Business Leaders',
    'Strategic AI knowledge for decision-makers and team leads.',
    '',
    'deep',
    'current',
    '/courses/paid/business-leaders',
    'January 20, 2026',
    'fixed',
    297,
    1,
    101,
    '[]', '[]', '[]'
  ),
  (
    'course_advanced_prompts',
    'advanced-prompts',
    'Advanced Prompt Engineering',
    'Master the art and science of getting exactly what you need from AI.',
    '',
    'deep',
    'current',
    '/courses/paid/advanced-prompts',
    'January 15, 2026',
    'fixed',
    197,
    1,
    102,
    '[]', '[]', '[]'
  );
