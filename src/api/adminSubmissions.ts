import { apiFetch } from "./client";

export type SubmissionStatus = "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
export interface AdminSubmission {
  id: number;
  participantName: string;
  bookTitle: string;
  startPage: number;
  endPage: number;
  readDate: string;
  status: SubmissionStatus;
  submittedAt: string | null;
}
export interface AdminSubmissionInbox {
  pendingCount: number;
  items: AdminSubmission[];
}

async function readError(response: Response) {
  let message = response.status === 401 ? "관리자 로그인이 필요합니다." : `기록 심사 요청에 실패했습니다. (${response.status})`;
  try { const body = await response.json() as { message?: string }; if (body.message) message = body.message; } catch { /* Keep status fallback. */ }
  return new Error(message);
}

export async function getAdminSubmissions(options: { status?: SubmissionStatus | ""; keyword?: string; signal?: AbortSignal } = {}): Promise<AdminSubmissionInbox> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.keyword?.trim()) params.set("keyword", options.keyword.trim());
  const query = params.size ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/admin/submissions${query}`, { signal: options.signal });
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<AdminSubmissionInbox>;
}

async function postAction(path: string, body?: unknown) {
  const response = await apiFetch(path, {
    method: "POST",
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  if (!response.ok) throw await readError(response);
}

export const approveSubmission = (id: number) => postAction(`/api/admin/submissions/${id}/approve`);
export const requestSubmissionRevision = (id: number, comment: string) => postAction(`/api/admin/submissions/${id}/revision-request`, { comment });
export const cancelSubmissionApproval = (id: number) => postAction(`/api/admin/submissions/${id}/cancel-approval`);
