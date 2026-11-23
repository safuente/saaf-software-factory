import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../shared/api/client";
import { LIST_QUERY } from "../../shared/api/lists";
import type { components } from "../../shared/api/schema";

export type Student = components["schemas"]["StudentOut"];
export type StudentPage = components["schemas"]["Page_StudentOut_"];

export const STUDENTS_QUERY_KEY = ["students"] as const;

export function listStudents(): Promise<StudentPage> {
  return apiRequest<StudentPage>("GET", `/api/students?${LIST_QUERY}`);
}

export function addStudent(name: string): Promise<Student> {
  return apiRequest<Student>("POST", "/api/students", { name });
}

/** The teacher's first 500 students in name order, shared by /students and /lessons. */
export function useStudents() {
  return useQuery({ queryKey: STUDENTS_QUERY_KEY, queryFn: listStudents });
}
