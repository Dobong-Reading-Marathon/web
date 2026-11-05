const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
const apiToken = import.meta.env.VITE_API_TOKEN;

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (apiToken) headers.set("Authorization", `Bearer ${apiToken}`);

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}
