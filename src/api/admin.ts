import { apiFetch } from "./client";
import type { CurrentRound } from "./currentRound";

export type AdminCompletionStatus = "IN_PROGRESS" | "PENDING_APPROVAL" | "COMPLETED";
export type AdminLogStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
export interface ProgressMeasure { current: number; target: number; remaining: number; percent: number }
export interface AdminProgress {
  pages: ProgressMeasure;
  reviews: ProgressMeasure;
  books: ProgressMeasure;
  readKm: number;
  completedBooks: number;
}
export interface AdminParticipant {
  enrollmentId: number;
  userId: number;
  name: string;
  phone: string;
  course: { id: number; name: string; family: boolean };
  status: AdminCompletionStatus;
  pages: ProgressMeasure;
  reviews: ProgressMeasure;
  books: ProgressMeasure;
  readKm: number;
  completedBooks: number;
  certificateNo: string | null;
  enrolledAt: string;
}
export interface AdminParticipantPage {
  roundId: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: AdminParticipant[];
}
export interface AdminReadingLog {
  readingLogId: number;
  readDate: string;
  startPage: number;
  endPage: number;
  status: AdminLogStatus;
  quote: string | null;
  review: string | null;
  reviewLength: number;
  librarianComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  counted: boolean;
}
export interface AdminEnrollmentBook {
  enrollmentBookId: number;
  bookId: number;
  title: string;
  author: string;
  totalPages: number;
  libraryOwned: boolean;
  children: boolean;
  registrationNo: string | null;
  loanDate: string | null;
  returnDate: string | null;
  readPages: number;
  completed: boolean;
  reviewCounted: boolean;
  logs: AdminReadingLog[];
}
export interface AdminEnrollmentDetail {
  enrollmentId: number;
  round: { id: number; year: number; roundNo: number };
  user: { id: number; name: string; phone: string; loanMemberNo: string | null };
  course: { id: number; name: string; family: boolean };
  status: AdminCompletionStatus;
  certificateNo: string | null;
  approvedAt: string | null;
  enrolledAt: string;
  progress: AdminProgress;
  books: AdminEnrollmentBook[];
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await apiFetch(path, { signal });
  if (!response.ok) {
    let message = response.status === 401 ? "관리자 로그인이 필요합니다." : `관리자 데이터를 불러오지 못했습니다. (${response.status})`;
    try { const body = await response.json() as { message?: string }; if (body.message) message = body.message; } catch { /* Keep status fallback. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getAdminCurrentRound(signal?: AbortSignal): Promise<CurrentRound> {
  return requestJson<CurrentRound>("/api/rounds/current", signal);
}

export function getAdminParticipants(options: {
  roundId: number;
  page?: number;
  size?: number;
  keyword?: string;
  courseId?: number;
  status?: AdminCompletionStatus | "";
  signal?: AbortSignal;
}): Promise<AdminParticipantPage> {
  const params = new URLSearchParams({ page: String(options.page ?? 0), size: String(options.size ?? 8) });
  if (options.keyword?.trim()) params.set("keyword", options.keyword.trim());
  if (options.courseId) params.set("courseId", String(options.courseId));
  if (options.status) params.set("status", options.status);
  return requestJson<AdminParticipantPage>(`/api/admin/rounds/${options.roundId}/enrollments?${params}`, options.signal);
}

export function getAdminEnrollmentDetail(enrollmentId: number, signal?: AbortSignal): Promise<AdminEnrollmentDetail> {
  return requestJson<AdminEnrollmentDetail>(`/api/admin/enrollments/${enrollmentId}`, signal);
}
