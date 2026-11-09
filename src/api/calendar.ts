import { apiFetch } from "./client";

// SAVED: 서평 500자 미만으로 제출해서 심사 없이 저장된 기록
export type ReadingStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED" | "SAVED" | string;

export interface EnrollmentProgress {
  enrollmentId: number;
  round: { id: number; year: number; roundNo: number };
  course: { id: number; name: string; family: boolean; distanceKm: number };
  status: "IN_PROGRESS" | "PENDING_APPROVAL" | "COMPLETED";
  pages: { current: number; target: number; remaining: number; percent: number };
  reviews: { current: number; target: number; remaining: number; percent: number };
  books: { current: number; target: number; remaining: number; percent: number };
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

