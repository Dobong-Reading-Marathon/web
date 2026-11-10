import { apiFetch } from "./client";

export interface PrivacyPolicySection {
  title: string;
  body: string;
}

export interface PrivacyPolicy {
  version: number;
  effectiveFrom: string;
  sections: PrivacyPolicySection[];
}

export async function getPrivacyPolicy(signal?: AbortSignal): Promise<PrivacyPolicy> {
  const response = await apiFetch("/api/privacy-policy", { signal });
  if (!response.ok) {
    let message = response.status === 404
      ? "현재 시행 중인 개인정보 처리방침이 없습니다."
      : "개인정보 처리방침을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Use the status-specific message when the response has no JSON body.
    }
    throw new Error(message);
  }
  return response.json() as Promise<PrivacyPolicy>;
}
