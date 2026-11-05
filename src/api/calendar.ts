import { apiFetch } from "./client";

export type ReadingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED" | string;

export interface CurrentEnrollment {
  id: number;
  roundId: number;
  year: number;
  roundNo: number;
  status: string;
  course: {
    id: number;
    name: string;
    family: boolean;
    targetPages: number;
    targetBooks: number;
    targetReviews: number;
    distanceKm: number;
  };
}

export interface EnrollmentProgress {
  enrollmentId: number;
  readKm: number;
  completedBooks: number;
}

export interface CalendarLog {
  readingLogId: number;
  enrollmentBookId: number;
  bookTitle: string;
  startPage: number;
  endPage: number;
  status: ReadingStatus;
  counted: boolean;
}

export interface CalendarDay {
  date: string;
  pages: number;
  logs: CalendarLog[];
}

export interface ReadingCalendar {
  enrollmentId: number;
  roundId: number;
  year: number;
  month: number;
  summary: { readDays: number; books: number; pages: number };
  days: CalendarDay[];
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await apiFetch(path, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`정보를 불러오지 못했습니다. (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function getCurrentEnrollment(signal: AbortSignal): Promise<CurrentEnrollment | null> {
  const response = await apiFetch("/api/enrollments/current", { signal });
  if (response.status === 204 || response.status === 404) return null;
  if (!response.ok) throw new Error(`참가 정보를 불러오지 못했습니다. (${response.status})`);
  return response.json() as Promise<CurrentEnrollment>;
}

export interface CurrentUser {
  id: number;
  name: string;
}

export async function getCurrentUser(signal: AbortSignal): Promise<CurrentUser> {
  const response = await apiFetch("/api/users/me", { signal });
  if (!response.ok) throw new Error(`사용자 정보를 불러오지 못했습니다. (${response.status})`);
  return response.json() as Promise<CurrentUser>;
}

export const getEnrollmentProgress = (enrollmentId: number, signal: AbortSignal) =>
  getJson<EnrollmentProgress>(`/api/enrollments/${enrollmentId}/progress`, signal);

export const getReadingCalendar = (year: number, month: number, signal: AbortSignal) =>
  getJson<ReadingCalendar>(`/api/me/calendar?year=${year}&month=${month}`, signal);

