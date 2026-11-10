import { apiFetch, clearAuthToken, storeAdminAuthToken } from "./client";

export interface AdminUser { id: number; name: string }
interface AdminSession { token: string; expiresAt: string; admin: AdminUser }

export async function adminLogin(loginId: string, password: string): Promise<AdminUser> {
  const response = await apiFetch("/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, password }),
  }, { authenticated: false });
  if (!response.ok) {
    let message = "관리자 로그인을 할 수 없어요. 아이디와 비밀번호를 확인해 주세요.";
    try { const body = await response.json() as { message?: string }; if (body.message) message = body.message; } catch { /* Keep fallback. */ }
    throw new Error(message);
  }
  const session = await response.json() as AdminSession;
  storeAdminAuthToken(session.token);
  return session.admin;
}

export async function getAdminMe(signal?: AbortSignal): Promise<AdminUser> {
  const response = await apiFetch("/api/admin/me", { signal });
  if (!response.ok) throw new Error(response.status === 401 ? "관리자 로그인이 필요합니다." : `관리자 정보를 확인하지 못했습니다. (${response.status})`);
  return response.json() as Promise<AdminUser>;
}

export async function adminLogout() {
  try {
    const response = await apiFetch("/api/admin/auth/logout", { method: "POST" });
    if (!response.ok && response.status !== 401) throw new Error(`로그아웃하지 못했습니다. (${response.status})`);
  } finally { clearAuthToken(); }
}
