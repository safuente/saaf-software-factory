import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../shared/api/client";
import { LESSONS_QUERY_KEY, type LessonPage } from "../lessons/api";
import { PENDING_QUERY_KEY, type PendingLessons } from "../payments/api";
import { STUDENTS_QUERY_KEY, type StudentPage } from "../students/api";

/** Rows of each Home list (F07 AC-2). */
export const HOME_ROWS = 5;

const firstPage = (size: number) => `page=1&page_size=${size}`;

/** Under the pending, lessons and students keys, so every change that refreshes those lists
 * (mark as paid, record a lesson, add a student) refreshes Home's too. */
export const homePendingKey = [...PENDING_QUERY_KEY, { size: HOME_ROWS }] as const;
export const homeLessonsKey = [...LESSONS_QUERY_KEY, { size: HOME_ROWS }] as const;
export const homeStudentsKey = [...STUDENTS_QUERY_KEY, { size: 1 }] as const;

/** The 5 oldest unpaid lessons, and the count and amount pending over all of them. */
export function useOldestUnpaid() {
  return useQuery({
    queryKey: homePendingKey,
    queryFn: () =>
      apiRequest<PendingLessons>("GET", `/api/pending-lessons?${firstPage(HOME_ROWS)}`),
  });
}

/** The 5 latest lessons, and the teacher's lesson count. */
export function useLatestLessons() {
  return useQuery({
    queryKey: homeLessonsKey,
    queryFn: () => apiRequest<LessonPage>("GET", `/api/lessons?${firstPage(HOME_ROWS)}`),
  });
}

/** Only the teacher's student count is used (`total`), so one row is enough. */
export function useStudentCount() {
  return useQuery({
    queryKey: homeStudentsKey,
    queryFn: () => apiRequest<StudentPage>("GET", `/api/students?${firstPage(1)}`),
  });
}
