/**
 * useCourses — React hook that loads courses from D1 and returns them.
 *
 * First render returns cached/seed data instantly (no blank screen).
 * After D1 fetch completes, re-renders with live data.
 * Also loads card settings and learning paths as they're shared visual data.
 */
import { useState, useEffect } from 'react';
import { getCourses, loadCourses } from '@/lib/courses/coursesStore';
import { loadCardSettings } from '@/lib/courses/courseCardCustomization';
import { loadLPCardSettings } from '@/lib/courses/learningPathCardCustomization';
import { loadLearningPaths } from '@/lib/courses/learningPathStore';
import type { Course } from '@/lib/courses/types';

export function useCourses(): { courses: Course[]; coursesLoaded: boolean } {
  const [courses, setCourses] = useState<Course[]>(getCourses());
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadCourses(), loadCardSettings(), loadLPCardSettings(), loadLearningPaths()]).then(() => {
      setCourses(getCourses());
      setCoursesLoaded(true);
    });
  }, []);

  return { courses, coursesLoaded };
}
