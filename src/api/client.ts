const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const apiToken = import.meta.env.VITE_API_TOKEN;
const AUTH_TOKEN_KEY = "dobonglibrary-auth-token";

function readStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeAuthToken(token: string, rememberMe: boolean) {
  clearAuthToken();
  try {
    (rememberMe ? localStorage : sessionStorage).setItem(AUTH_TOKEN_KEY, token);
  } catch {
    throw new Error("로그인 정보를 이 브라우저에 저장할 수 없어요. 브라우저 저장 설정을 확인해 주세요.");
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // 브라우저 저장소에 접근할 수 없어도 로그아웃 요청은 진행합니다.
  }
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
    const token = readStoredAuthToken() ?? apiToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}
