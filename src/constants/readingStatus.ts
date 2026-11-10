import type { ChipKind } from "../components/Chip";

/** 독서기록 상태 이름 */
export const READING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  SUBMITTED: "심사 대기",
  APPROVED: "승인",
  REVISION_REQUESTED: "보완요청",
  SAVED: "저장",
};

/** 독서기록 상태 칩 색 */
export const READING_STATUS_CHIPS: Record<string, ChipKind> = {
  DRAFT: "draft",
  SUBMITTED: "wait",
  APPROVED: "ok",
  REVISION_REQUESTED: "fix",
  SAVED: "ok", // 승인과 같은 초록색
};

/** 상태 필터와 점 범례에 쓰는 순서 */
export const READING_STATUS_ORDER = ["DRAFT", "SUBMITTED", "SAVED", "APPROVED", "REVISION_REQUESTED"] as const;

export const readingStatusLabel = (status: string) => READING_STATUS_LABELS[status] ?? status;
export const readingStatusChip = (status: string): ChipKind => READING_STATUS_CHIPS[status] ?? "line";

/** 수정은 임시저장·보완요청·저장 상태에서 됩니다 (서버 규칙과 같음). */
export const isEditableRecord = (status: string) => status === "DRAFT" || status === "REVISION_REQUESTED" || status === "SAVED";

/** 삭제는 제출 전(임시저장) 기록만 됩니다 (서버 규칙과 같음). */
export const isDeletableRecord = (status: string) => status === "DRAFT";

/** 수정 버튼 이름 */
export const EDIT_LABELS: Record<string, string> = {
  REVISION_REQUESTED: "고쳐서 다시 제출",
  SAVED: "수정 · 서평 제출",
  DRAFT: "이어서 작성",
};

/** 2026-11-10 → 11월 10일 */
export function formatMonthDay(date: string) {
  const [, month, day] = date.slice(0, 10).split("-").map(Number);
  return `${month}월 ${day}일`;
}
