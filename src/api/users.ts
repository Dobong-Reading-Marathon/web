import { apiFetch } from "./client";

export interface CurrentUser {
  id: number;
  name: string;
  mustChangePassword?: boolean;
  reminderAgreed?: boolean;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const response = await apiFetch("/api/users/me", { signal });
  if (!response.ok) {
    throw new Error(response.status === 401
      ? "로그인 정보가 만료됐어요. 다시 로그인해 주세요."
      : `사용자 정보를 불러오지 못했습니다. (${response.status})`);
  }
  return response.json() as Promise<CurrentUser>;
}
