import { CourseCard } from "./CourseCard";
import type { Course } from "@/lib/courses/types";
import { sortCoursesByLifecycle } from "@/data/coursesData";

interface CourseGridProps {
  courses: Course[];
  sortByLifecycle?: boolean;
}

export const CourseGrid = ({ courses, sortByLifecycle = true }: CourseGridProps) => {
  const displayCourses = sortByLifecycle ? sortCoursesByLifecycle(courses) : courses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayCourses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
};
