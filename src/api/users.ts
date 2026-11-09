import { apiFetch } from "./client";

export interface CurrentUser {
  id: number;
  name: string;
  mustChangePassword?: boolean;
  reminderAgreed?: boolean;
}

export class CurrentUserApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CurrentUserApiError";
    this.status = status;
  }
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const response = await apiFetch("/api/users/me", { signal });
  if (!response.ok) {
    throw new CurrentUserApiError(response.status === 401
      ? "로그인 정보가 만료됐어요. 다시 로그인해 주세요."
      : `사용자 정보를 불러오지 못했습니다. (${response.status})`, response.status);
  }
  return response.json() as Promise<CurrentUser>;
}
