import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../shared/api/client";
import { LIST_QUERY } from "../../shared/api/lists";
import type { components } from "../../shared/api/schema";

export type Lesson = components["schemas"]["LessonOut"];
export type LessonPage = components["schemas"]["Page_LessonOut_"];
export type RecordLessonRequest = components["schemas"]["RecordLessonRequest"];

export const LESSONS_QUERY_KEY = ["lessons"] as const;

export function listLessons(): Promise<LessonPage> {
  return apiRequest<LessonPage>("GET", `/api/lessons?${LIST_QUERY}`);
}

export function recordLesson(request: RecordLessonRequest): Promise<Lesson> {
  return apiRequest<Lesson>("POST", "/api/lessons", request);
}

/** The teacher's 500 most recent lessons, newest first. */
export function useLessons() {
  return useQuery({ queryKey: LESSONS_QUERY_KEY, queryFn: listLessons });
}
