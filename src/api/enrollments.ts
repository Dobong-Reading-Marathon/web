import { apiFetch } from "./client";

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
  createdAt?: string;
}

export class EnrollmentApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "EnrollmentApiError";
    this.status = status;
    this.code = code;
  }
}

async function readApiError(response: Response): Promise<EnrollmentApiError> {
  let body: { code?: string; message?: string } = {};
  try {
    body = await response.json() as typeof body;
  } catch {
    // Errors without JSON bodies still retain their HTTP status.
  }
  const fallback = response.status === 401
    ? "로그인 정보가 만료됐어요. 다시 로그인해 주세요."
    : `참가 정보를 처리하지 못했습니다. (${response.status})`;
  return new EnrollmentApiError(body.message || fallback, response.status, body.code);
}

export async function getCurrentEnrollment(signal?: AbortSignal): Promise<CurrentEnrollment | null> {
  const response = await apiFetch("/api/enrollments/current", { signal });
  if (response.status === 204) return null;
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<CurrentEnrollment>;
}

export async function applyForEnrollment(courseId: number): Promise<CurrentEnrollment> {
  const response = await apiFetch("/api/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId }),
  });
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<CurrentEnrollment>;
}
