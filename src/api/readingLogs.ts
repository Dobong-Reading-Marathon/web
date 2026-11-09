import { apiFetch } from "./client";
import type { ReadingStatus } from "./calendar";

/** 저장한 독서기록 (POST /api/reading-logs, PATCH /api/reading-logs/{id} 응답) */
export interface ReadingLog {
  id: number;
  enrollmentBookId: number;
  startPage: number;
  endPage: number;
  readDate: string;
  quote: string | null;
  review: string | null;
  status: ReadingStatus;
}

export interface ReadingLogInput {
  enrollmentBookId: number;
  startPage: number;
  endPage: number;
  readDate: string;
  quote?: string;
  review?: string;
}

export class ReadingLogApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors: { field: string; message: string }[];

  constructor(message: string, status: number, code?: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ReadingLogApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function readApiError(response: Response): Promise<ReadingLogApiError> {
  let body: { code?: string; message?: string; fieldErrors?: { field: string; message: string }[] } = {};
  try {
    body = await response.json() as typeof body;
  } catch {
    // 오류 응답 본문이 없으면 상태 코드로 안내합니다.
  }
  const fallback = response.status === 401
    ? "로그인이 필요하거나 로그인 정보가 만료됐어요. 다시 로그인해 주세요."
    : response.status >= 500
      ? "독서기록 서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요."
      : `독서기록을 처리하지 못했습니다. (${response.status})`;
  const fieldErrors = body.fieldErrors ?? [];
  // 형식 오류(400)는 칸별 메시지가 더 구체적입니다.
  const message = fieldErrors.length > 0
    ? fieldErrors.map((error) => error.message).join(" ")
    : body.message || fallback;
  return new ReadingLogApiError(message, response.status, body.code, fieldErrors);
}

async function send<T>(path: string, method: string, payload?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(path, {
      method,
      ...(payload === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
    });
  } catch {
    throw new Error("독서기록 서버에 연결할 수 없어요. 서버 실행 상태와 주소를 확인해 주세요.");
  }
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<T>;
}

/** 독서기록 작성 (F-0401). 새 기록은 임시저장(DRAFT) 상태입니다. */
export function createReadingLog(input: ReadingLogInput): Promise<ReadingLog> {
  return send<ReadingLog>("/api/reading-logs", "POST", input);
}

/** 독서기록 수정 (F-0406). 임시저장·보완요청 상태일 때만 됩니다. 도서는 바꿀 수 없습니다. */
export function updateReadingLog(id: number, input: Omit<ReadingLogInput, "enrollmentBookId">): Promise<ReadingLog> {
  return send<ReadingLog>(`/api/reading-logs/${id}`, "PATCH", input);
}

/**
 * 독서기록 제출 (F-0405). 서버가 서평 길이로 상태를 정합니다.
 * - submittedIds: 서평 500자 이상이라 심사 대기(SUBMITTED)로 간 기록
 * - savedIds: 서평이 없거나 500자 미만이라 심사 없이 저장(SAVED)된 기록
 */
export function submitReadingLogs(readingLogIds: number[]): Promise<{ submittedIds: number[]; savedIds: number[] }> {
  return send("/api/reading-logs/submit", "POST", { readingLogIds });
}

/** 독서기록 삭제 (F-0406). 임시저장·보완요청 상태일 때만 됩니다. 성공하면 본문 없이 204로 응답합니다. */
export async function deleteReadingLog(id: number): Promise<void> {
  let response: Response;
  try {
    response = await apiFetch(`/api/reading-logs/${id}`, { method: "DELETE" });
  } catch {
    throw new Error("독서기록 서버에 연결할 수 없어요. 서버 실행 상태와 주소를 확인해 주세요.");
  }
  if (!response.ok) throw await readApiError(response);
}
