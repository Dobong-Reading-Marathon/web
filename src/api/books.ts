import { apiFetch } from "./client";

export type LibraryBookStatus =
  | "NO_RECORD"
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION_REQUESTED";

export interface LibraryBook {
  enrollmentBookId: number;
  title: string;
  author: string;
  totalPages: number;
  readPages: number;
  completed: boolean;
  libraryOwned: boolean;
  children: boolean;
  status: LibraryBookStatus;
}

export class BooksApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BooksApiError";
    this.status = status;
  }
}

export async function getBooks(options: {
  keyword?: string;
  status?: LibraryBookStatus;
  signal?: AbortSignal;
} = {}): Promise<LibraryBook[]> {
  const params = new URLSearchParams();
  if (options.keyword?.trim()) params.set("keyword", options.keyword.trim());
  if (options.status) params.set("status", options.status);

  const query = params.size ? `?${params.toString()}` : "";
  const response = await apiFetch(`/api/books${query}`, { signal: options.signal });
  if (!response.ok) {
    let message = response.status === 401
      ? "로그인 정보가 만료됐어요. 다시 로그인해 주세요."
      : `내 서재를 불러오지 못했습니다. (${response.status})`;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the status-specific message when the response has no JSON body.
    }
    throw new BooksApiError(message, response.status);
  }

  const body: unknown = await response.json();
  if (Array.isArray(body)) return body as LibraryBook[];
  // Also tolerate a single-item response while the endpoint contract is being finalized.
  if (body && typeof body === "object" && "enrollmentBookId" in body) {
    return [body as LibraryBook];
  }
  return [];
}
