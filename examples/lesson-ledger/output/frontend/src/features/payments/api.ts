import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../shared/api/client";
import { LIST_QUERY } from "../../shared/api/lists";
import type { components } from "../../shared/api/schema";
import { LESSONS_QUERY_KEY, type Lesson, type LessonPage } from "../lessons/api";

export type MonthlySummary = components["schemas"]["MonthlySummary"];

export const SUMMARY_QUERY_KEY = ["monthly-summary"] as const;

/** Under the lessons key, so changes to lessons refresh every lesson list. */
export const monthLessonsKey = (month: string) => [...LESSONS_QUERY_KEY, { month }] as const;

export const summaryKey = (month: string) => [...SUMMARY_QUERY_KEY, month] as const;

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: summaryKey(month),
    queryFn: () => apiRequest<MonthlySummary>("GET", `/api/monthly-summaries/${month}`),
  });
}

/** The month's 500 most recent lessons, newest first. */
export function useMonthLessons(month: string) {
  return useQuery({
    queryKey: monthLessonsKey(month),
    queryFn: () => apiRequest<LessonPage>("GET", `/api/lessons?month=${month}&${LIST_QUERY}`),
  });
}

export type PendingLessons = components["schemas"]["PendingLessons"];

export const PENDING_QUERY_KEY = ["pending-lessons"] as const;

/** The teacher's 500 oldest unpaid lessons and the amount pending over all of them. */
export function usePendingLessons() {
  return useQuery({
    queryKey: PENDING_QUERY_KEY,
    queryFn: () => apiRequest<PendingLessons>("GET", `/api/pending-lessons?${LIST_QUERY}`),
  });
}

/** Mark as paid (`true`) or undo it (`false`); the only change to a lesson. */
export function setLessonPaid(lesson: Lesson, paid: boolean): Promise<Lesson> {
  return apiRequest<Lesson>("PATCH", `/api/lessons/${lesson.id}`, { paid });
}

/** Every list and total a paid change can affect: lessons, summaries and the pending list. */
const PAYMENT_QUERY_KEYS = [LESSONS_QUERY_KEY, SUMMARY_QUERY_KEY, PENDING_QUERY_KEY];

export function invalidatePayments(queryClient: QueryClient): void {
  for (const queryKey of PAYMENT_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/** Drops every in-flight read of those lists and totals, so a response that may or may not
 * include a paid change cannot land on top of the cache the change is applied to. */
export async function cancelPaymentReads(queryClient: QueryClient): Promise<void> {
  await Promise.all(PAYMENT_QUERY_KEYS.map((queryKey) => queryClient.cancelQueries({ queryKey })));
}
