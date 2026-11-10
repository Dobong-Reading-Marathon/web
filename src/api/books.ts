import { apiFetch } from "./client";

export type LibraryBookStatus =
  | "NO_RECORD"
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "SAVED";

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
  coverUrl: string | null;
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

export interface BookRegistrationRequest {
  enrollmentId: number;
  title: string;
  author: string;
  totalPages: number;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  children: boolean;
  libraryOwned: boolean;
  registrationNo?: string;
  loanDate?: string;
  returnDate?: string;
  coverUrl?: string | null;
}

export interface RegisteredBook {
  id: number;
  bookId: number;
  title: string;
  author: string;
  publisher: string | null;
  publishYear: number | null;
  totalPages: number;
  isbn: string | null;
  libraryOwned: boolean;
  registrationNo: string | null;
  loanDate: string | null;
  returnDate: string | null;
  children: boolean;
  coverUrl: string | null;
}

export interface BookSearchResult {
  title: string;
  author: string;
  publisher: string | null;
  publishYear: number | null;
  totalPages: number | null;
  isbn: string;
  coverUrl: string | null;
  sourceLink: string | null;
}

interface ApiErrorBody {
  code?: string;
  message?: string;
  fieldErrors?: { field: string; message: string }[];
}

export class BookApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors: { field: string; message: string }[];

  constructor(message: string, status: number, code?: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.name = "BookApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function readApiError(response: Response): Promise<BookApiError> {
  let body: ApiErrorBody = {};
  try {
    body = await response.json() as ApiErrorBody;
  } catch {
    // 오류 응답 본문이 없는 경우 상태 코드로 안내합니다.
  }

  const fallback = response.status === 401
    ? "로그인이 필요하거나 로그인 정보가 만료됐어요. 다시 로그인해 주세요."
    : response.status === 409
      ? "이미 내서재에 등록한 도서입니다."
      : response.status >= 500
        ? "도서 등록 서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요."
        : `도서를 등록하지 못했습니다. (${response.status})`;

  return new BookApiError(body.message || fallback, response.status, body.code, body.fieldErrors ?? []);
}

export async function registerBook(payload: BookRegistrationRequest): Promise<RegisteredBook> {
  let response: Response;
  try {
    response = await apiFetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("도서 등록 서버에 연결할 수 없어요. 서버 실행 상태와 주소를 확인해 주세요.");
  }

  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<RegisteredBook>;
}

async function getBookSearchResponse<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(path);
  } catch {
    throw new Error("도서 검색 서버에 연결할 수 없어요. 서버 실행 상태와 주소를 확인해 주세요.");
  }

  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<T>;
}

export function lookupBookByIsbn(isbn: string): Promise<BookSearchResult> {
  return getBookSearchResponse<BookSearchResult>(`/api/books/lookup?isbn=${encodeURIComponent(isbn)}`);
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const response = await getBookSearchResponse<{ items: BookSearchResult[] }>(
    `/api/books/search?query=${encodeURIComponent(query)}`,
  );
  return response.items;
}
