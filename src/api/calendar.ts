import { apiFetch } from "./client";

export type ReadingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED" | string;

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

export interface ReadingLogDetail {
  id: number;
  enrollmentBookId: number;
  startPage: number;
  endPage: number;
  readDate: string;
  quote: string | null;
  review: string | null;
  status: ReadingStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  librarianComment: string | null;
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

export const getEnrollmentProgress = (enrollmentId: number, signal: AbortSignal) =>
  getJson<EnrollmentProgress>(`/api/enrollments/${enrollmentId}/progress`, signal);

export const getReadingCalendar = (year: number, month: number, signal: AbortSignal) =>
  getJson<ReadingCalendar>(`/api/me/calendar?year=${year}&month=${month}`, signal);

export const getReadingLogDetail = (readingLogId: number, signal: AbortSignal) =>
  getJson<ReadingLogDetail>(`/api/reading-logs/${readingLogId}`, signal);

