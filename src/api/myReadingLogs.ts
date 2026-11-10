import { apiFetch } from "./client";
import type { ReadingStatus } from "./calendar";

/** 내 독서기록 한 건 (GET /api/me/reading-logs) */
export interface MyReadingLog {
  readingLogId: number;
  enrollmentBookId: number;
  bookTitle: string;
  author: string;
  publisher: string | null;
  publishYear: number | null;
  totalPages: number;
  libraryOwned: boolean;
  startPage: number;
  endPage: number;
  /** 읽은 날짜 (YYYY-MM-DD) */
  readDate: string;
  status: ReadingStatus;
  quote: string | null;
  review: string | null;
  /** 서평 글자 수 (공백·줄바꿈 포함, 이모지 1자). 서평이 없으면 0 */
  reviewLength: number;
  librarianComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  counted: boolean;
}

export interface MyReadingLogs {
  enrollmentId: number;
  roundId: number;
  /** 읽은 날짜가 빠른 순서, 같은 날은 작성 순서 */
  logs: MyReadingLog[];
}

/**
 * 이번 회차 내 독서기록 전체 (서평 본문, 글자 수 포함).
 * 참가 신청이 없으면 null을 돌려줍니다.
 */
export async function getMyReadingLogs(signal?: AbortSignal): Promise<MyReadingLogs | null> {
  const response = await apiFetch("/api/me/reading-logs", { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`독서기록을 불러오지 못했습니다. (${response.status})`);
  return response.json() as Promise<MyReadingLogs>;
}
