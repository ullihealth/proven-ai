import { CustomizableCourseCard } from "./CustomizableCourseCard";
import type { Course } from "@/lib/courses/types";
import { sortCoursesByLifecycle, getCoursesWithVisualSettings } from "@/lib/courses/coursesStore";

interface CourseGridProps {
  courses: Course[];
  sortByLifecycle?: boolean;
}

export const CourseGrid = ({ courses, sortByLifecycle = true }: CourseGridProps) => {
  // Apply stored visual settings from localStorage
  const coursesWithSettings = getCoursesWithVisualSettings(courses);
  const displayCourses = sortByLifecycle ? sortCoursesByLifecycle(coursesWithSettings) : coursesWithSettings;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {displayCourses.map((course) => (
        <CustomizableCourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};
