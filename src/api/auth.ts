import { apiFetch, clearAuthToken } from "./client";

export interface AuthUser {
  id: number;
  name: string;
  mustChangePassword: boolean;
  reminderAgreed: boolean;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface SignupRequest {
  name: string;
  phone: string;
  password: string;
  loanMemberNo?: string;
  privacyAgreed: true;
  reminderAgreed: boolean;
  privacyPolicyVersion: number;
}

export interface PrivacyPolicy {
  version: number;
  effectiveFrom: string;
  sections: { title: string; body: string }[];
}

export interface PrivacyConsent {
  privacyPolicyVersion: number;
  privacyAgreedAt: string;
  latestPolicyVersion: number;
  reminderAgreed: boolean;
  reminderAgreedAt: string | null;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

interface ApiErrorBody {
  code?: string;
  message?: string;
  fieldErrors?: ApiFieldError[];
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors: ApiFieldError[];

  constructor(message: string, status: number, code?: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function readApiError(response: Response) {
  let body: ApiErrorBody = {};
  try {
    body = await response.json() as ApiErrorBody;
  } catch {
    // 상태 코드만 있는 응답도 처리합니다.
  }
  const fallback = response.status === 429
    ? "요청이 너무 많아요. 잠시 후 다시 시도해 주세요."
    : response.status >= 500
      ? "일시적인 오류입니다. 잠시 후 다시 시도해 주세요."
      : `요청을 처리하지 못했습니다. (${response.status})`;
  return new AuthApiError(body.message || fallback, response.status, body.code, body.fieldErrors ?? []);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, { authenticated: false });
  } catch {
    throw new Error("API 서버에 연결할 수 없어요. 서버 실행 상태와 주소를 확인해 주세요.");
  }
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<T>;
}

export function login(phone: string, password: string, rememberMe: boolean) {
  return postJson<AuthSession>("/api/auth/login", { phone, password, rememberMe });
}

export function signup(payload: SignupRequest) {
  return postJson<AuthSession>("/api/auth/signup", payload);
}

export async function getPrivacyPolicy(signal?: AbortSignal): Promise<PrivacyPolicy> {
  let response: Response;
  try {
    response = await apiFetch("/api/privacy-policy", { signal }, { authenticated: false });
  } catch {
    throw new Error("개인정보 처리방침을 불러오지 못했어요. API 서버 연결을 확인해 주세요.");
  }
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<PrivacyPolicy>;
}

export async function getPrivacyConsent(signal?: AbortSignal): Promise<PrivacyConsent> {
  const response = await apiFetch("/api/users/me/privacy-consent", { signal });
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<PrivacyConsent>;
}

export async function logout() {
  try {
    const response = await apiFetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw await readApiError(response);
  } finally {
    clearAuthToken();
  }
}
