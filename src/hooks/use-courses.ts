/**
 * useCourses — React hook that loads courses from D1 and returns them.
 *
 * First render returns cached/seed data instantly (no blank screen).
 * After D1 fetch completes, re-renders with live data.
 */
import { useState, useEffect } from 'react';
import { getCourses, loadCourses } from '@/lib/courses/coursesStore';
import type { Course } from '@/lib/courses/types';

export function useCourses(): { courses: Course[]; coursesLoaded: boolean } {
  const [courses, setCourses] = useState<Course[]>(getCourses());
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  useEffect(() => {
    loadCourses().then(() => {
      setCourses(getCourses());
      setCoursesLoaded(true);
    });
  }, []);

  return { courses, coursesLoaded };
}
