const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const AUTH_TOKEN_KEY = "dobonglibrary-auth-token";
const ADMIN_AUTH_TOKEN_KEY = "dobonglibrary-admin-auth-token";
export const AUTH_STATE_CHANGED_EVENT = "dobonglibrary:auth-state-changed";
export const AUTHENTICATION_REQUIRED_EVENT = "dobonglibrary:authentication-required";

function notifyAuthStateChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

function removeStoredTokens() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  } catch {
    // 브라우저 저장소에 접근할 수 없어도 인증 상태 변경은 계속 진행합니다.
  }
}

function readStoredAuthToken(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storeAuthToken(token: string, rememberMe: boolean) {
  removeStoredTokens();
  try {
    (rememberMe ? localStorage : sessionStorage).setItem(AUTH_TOKEN_KEY, token);
  } catch {
    throw new Error("로그인 정보를 이 브라우저에 저장할 수 없어요. 브라우저 저장 설정을 확인해 주세요.");
  }
  notifyAuthStateChanged();
}

export function storeAdminAuthToken(token: string) {
  removeStoredTokens();
  try {
    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
  } catch {
    throw new Error("관리자 로그인 정보를 이 브라우저에 저장할 수 없어요. 브라우저 저장 설정을 확인해 주세요.");
  }
  notifyAuthStateChanged();
}

export function clearAuthToken() {
  removeStoredTokens();
  notifyAuthStateChanged();
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (options.authenticated !== false && !headers.has("Authorization")) {
    const isAdminRequest = path.startsWith("/api/admin/");
    const token = isAdminRequest
      ? readStoredAuthToken(ADMIN_AUTH_TOKEN_KEY)
      : readStoredAuthToken(AUTH_TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  }).then((response) => {
    if (response.status === 401 && options.authenticated !== false && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTHENTICATION_REQUIRED_EVENT, {
        detail: { path, admin: path.startsWith("/api/admin/") },
      }));
    }
    return response;
  });
}
