import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { BooksApiError, getBooks, type LibraryBook, type LibraryBookStatus } from "../api/books";
import "./Search.css";

// 검색 범위. 서버의 keyword는 제목과 저자를 함께 찾으므로, 도서명/저자는 받아 온 결과에서 나눠 보여준다.
// 서평·글귀를 검색하는 서버 API는 아직 없어서 선택할 수 없게 막아 둔다.
const TYPES = ["전체", "도서명", "저자", "서평", "글귀"] as const;
const UNAVAILABLE_TYPES: readonly (typeof TYPES)[number][] = ["서평", "글귀"];

// 서버 status 값을 화면 라벨로 바꾼다 (표시 변환만 한다)
const STATUS_LABELS: Record<LibraryBookStatus, string> = {
  APPROVED: "승인",
  SUBMITTED: "심사 대기",
  REVISION_REQUESTED: "보완 요청",
  DRAFT: "임시저장",
  SAVED: "저장",
  NO_RECORD: "기록 전",
};
const STATUS_CLASSES: Partial<Record<LibraryBookStatus, string>> = {
  APPROVED: "tag-green",
  SUBMITTED: "tag-yellow",
  REVISION_REQUESTED: "tag-pink",
  DRAFT: "tag-pink",
};
const STATUS_ORDER: LibraryBookStatus[] = [
  "APPROVED",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "DRAFT",
  "SAVED",
  "NO_RECORD",
];

// 기록 상태 필터. 서버 status 파라미터로 보낸다.
type Target = "ALL" | LibraryBookStatus;
const TARGETS: Target[] = ["ALL", ...STATUS_ORDER];

// 정렬. "최근 등록순"은 서버가 내려준 순서 그대로다.
const SORTS = ["최근 등록순", "도서명순"] as const;
const PAGE_SIZE = 4;

type Sort = (typeof SORTS)[number];

type SearchResponse = {
  key: string;
  books: LibraryBook[];
  error: string;
};

function getTargetLabel(target: Target) {
  return target === "ALL" ? "전체" : STATUS_LABELS[target];
}

function getRecentSearches(): string[] {
  try {
    const saved = localStorage.getItem("reading-marathon-recent-searches");
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

function highlightText(text: string, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return text;

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return parts.map((part, index) =>
    part.toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase() ? (
      <mark key={`${index}-${part}`}>{part}</mark>
    ) : (
      part
    ),
  );
}

export default function Search() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<(typeof TYPES)[number]>("전체");
  const [target, setTarget] = useState<Target>("ALL");
  const [sort, setSort] = useState<Sort>("최근 등록순");
  const [page, setPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const [response, setResponse] = useState<SearchResponse | null>(null);

  // 검색어나 상태 필터가 바뀌면 서버에 다시 요청한다. 이전 요청은 취소한다.
  const requestKey = `${query}\u0000${target}`;
  useEffect(() => {
    const controller = new AbortController();
    getBooks({
      keyword: query,
      status: target === "ALL" ? undefined : target,
      signal: controller.signal,
    })
      .then((books) => setResponse({ key: requestKey, books, error: "" }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setResponse({
          key: requestKey,
          books: [],
          error:
            reason instanceof BooksApiError
              ? reason.message
              : "검색 결과를 불러오지 못했어요. 서버 연결을 확인해 주세요.",
        });
      });
    return () => controller.abort();
  }, [query, target, requestKey]);

  const loading = response?.key !== requestKey;
  const error = loading ? "" : response?.error ?? "";
  const loadedBooks = useMemo(() => response?.books ?? [], [response]);

  // 음성 인식 힌트는 불러온 책의 제목·저자로 만든다
  const speechHints = useMemo(
    () => loadedBooks.flatMap((book) => [book.title, book.author]),
    [loadedBooks],
  );
  const appendSpeechToSearch = useCallback((text: string) => {
    setInputValue((current) => `${current.trim()}${current.trim() ? " " : ""}${text}`);
  }, []);
  const { isListening, interimTranscript, speechError, startListening, stopListening } =
    useSpeechRecognition(appendSpeechToSearch, speechHints);

  const matchingResults = useMemo(() => {
    if (loading || error) return [];
    const word = query.trim().toLocaleLowerCase();

    const filtered = loadedBooks.filter((book) => {
      if (!word) return true;
      if (selectedType === "도서명") return book.title.toLocaleLowerCase().includes(word);
      if (selectedType === "저자") return book.author.toLocaleLowerCase().includes(word);
      return true;
    });

    if (sort === "도서명순") {
      filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    }

    return filtered;
  }, [loadedBooks, loading, error, query, selectedType, sort]);

  const totalPages = Math.max(1, Math.ceil(matchingResults.length / PAGE_SIZE));
  const visibleResults = matchingResults.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function saveRecentSearches(next: string[]) {
    setRecentSearches(next);
    localStorage.setItem(
      "reading-marathon-recent-searches",
      JSON.stringify(next),
    );
  }

  function runSearch(event?: FormEvent<HTMLFormElement>, searchTerm = inputValue) {
    event?.preventDefault();

    const trimmed = searchTerm.trim();
    setQuery(trimmed);
    setInputValue(trimmed);
    setPage(1);

    if (trimmed) {
      const next = [
        trimmed,
        ...recentSearches.filter(
          (word) => word.toLocaleLowerCase() !== trimmed.toLocaleLowerCase(),
        ),
      ].slice(0, 3);
      saveRecentSearches(next);
    }
  }

  function removeRecentSearch(wordToRemove: string) {
    saveRecentSearches(recentSearches.filter((word) => word !== wordToRemove));
  }

  function clearRecentSearches() {
    saveRecentSearches([]);
  }

  function selectType(type: (typeof TYPES)[number]) {
    setSelectedType(type);
    setPage(1);
  }

  function selectTarget(nextTarget: Target) {
    setTarget(nextTarget);
    setPage(1);
  }

  function selectSort(nextSort: Sort) {
    setSort(nextSort);
    setPage(1);
  }

  return (
    <UserLayout active="search">
      <main className="search-page">
        <section className="search-hero">
          <div>
            <h1>통합 검색</h1>
            <p>내 서재에 등록한 도서를 도서명과 저자로 찾아요.</p>
          </div>
          <div className="search-hero-art" aria-hidden="true">
            <span className="search-book-back" />
            <span className="search-book-front" />
            <span className="search-book-small" />
          </div>
        </section>

        <section className="search-box" aria-label="검색">
          <form className="search-form" onSubmit={(event) => runSearch(event)}>
            <label className="visually-hidden" htmlFor="search-input">
              검색어
            </label>
            <input
              id="search-input"
              type="search"
              placeholder="검색어를 입력하세요"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <button
              className={`mic-button${isListening ? " is-listening" : ""}`}
              type="button"
              aria-label={isListening ? "음성 검색 중지" : "음성 검색 시작"}
              aria-pressed={isListening}
              onClick={isListening ? stopListening : startListening}
            >
              🎙
            </button>
            <button className="primary-button" type="submit">
              검색
            </button>
          </form>

          <div className="filter-list" aria-label="검색 범위">
            {TYPES.map((type) => {
              const unavailable = UNAVAILABLE_TYPES.includes(type);
              return (
                <button
                  className={`filter-chip${selectedType === type ? " selected" : ""}`}
                  type="button"
                  key={type}
                  disabled={unavailable}
                  title={unavailable ? "준비 중이에요" : undefined}
                  aria-pressed={selectedType === type}
                  onClick={() => selectType(type)}
                >
                  {type}
                  {unavailable && " (준비 중)"}
                </button>
              );
            })}
          </div>

          <div className={`notice${speechError ? " has-error" : ""}`} role="status" aria-live="polite">
            <span aria-hidden="true">🎙</span>
            <p>
              <strong>{speechError ? "음성 검색 안내" : isListening ? "듣고 있어요" : "음성 검색 안내"}</strong>
              <br />
              {speechError || (isListening
                ? interimTranscript ? `인식 중: “${interimTranscript}”` : "검색어를 말씀해 주세요."
                : "마이크 권한이 필요해요. 인식된 글자는 검색어에 입력되며, 음성 처리 방식은 브라우저 음성인식 서비스 설정을 따릅니다.")}
            </p>
          </div>
        </section>

        <div className="search-content-grid">
          <section className="results-panel" aria-busy={loading}>
            <div className="results-heading">
              <h2>
                {query ? `“${query}” 검색 결과` : "검색 결과"}{" "}
                {!loading && !error && <span>{matchingResults.length}건</span>}
              </h2>
              <div className="sort-list" aria-label="정렬">
                {SORTS.map((item) => (
                  <button
                    className={`sort-chip${sort === item ? " selected" : ""}`}
                    type="button"
                    key={item}
                    aria-pressed={sort === item}
                    onClick={() => selectSort(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {loading && <p className="search-empty">검색 결과를 불러오는 중이에요.</p>}
            {error && (
              <div className="notice has-error" role="alert">
                <p>{error}</p>
              </div>
            )}

            {visibleResults.map((book) => (
              <article className="result-item" key={book.enrollmentBookId}>
                <div className="result-content">
                  <div className="tags">
                    <span className={STATUS_CLASSES[book.status]}>
                      {STATUS_LABELS[book.status] ?? book.status}
                    </span>
                    {book.completed && <span>완독</span>}
                    {book.children && <span>아동도서</span>}
                  </div>
                  <h3>{highlightText(book.title, query)}</h3>
                  <p>
                    {highlightText(book.author, query)}
                    {` · ${book.libraryOwned ? "소장도서 · " : ""}읽은 쪽 ${book.readPages} / ${book.totalPages}`}
                  </p>
                </div>
                <Link className="view-link" to="/library">
                  보기
                </Link>
              </article>
            ))}

            {!loading && !error && matchingResults.length === 0 && (
              <p className="search-empty">검색 결과가 없어요.</p>
            )}

            {matchingResults.length > PAGE_SIZE && (
              <nav className="pagination" aria-label="검색 결과 페이지">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      className={page === pageNumber ? "current" : ""}
                      type="button"
                      key={pageNumber}
                      aria-current={page === pageNumber ? "page" : undefined}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  다음 ›
                </button>
              </nav>
            )}
          </section>

          <aside className="search-side-column">
            <section className="side-card">
              <h2>기록 상태</h2>
              <div className="side-chips">
                {TARGETS.map((item) => (
                  <button
                    className={target === item ? "selected" : ""}
                    type="button"
                    key={item}
                    aria-pressed={target === item}
                    onClick={() => selectTarget(item)}
                  >
                    {getTargetLabel(item)}
                  </button>
                ))}
              </div>
              <p className="helper-text">
                내 기록만 검색돼요. 다른 참가자의 기록은 보이지 않아요.
              </p>
            </section>

            <section className="side-card">
              <div className="side-title-row">
                <h2>최근 검색어</h2>
                <button
                  className="text-button"
                  type="button"
                  onClick={clearRecentSearches}
                  disabled={recentSearches.length === 0}
                >
                  모두 지우기
                </button>
              </div>

              {recentSearches.length > 0 ? (
                <ul className="recent-list">
                  {recentSearches.map((word) => (
                    <li key={word}>
                      <button
                        className="recent-word"
                        type="button"
                        onClick={() => runSearch(undefined, word)}
                      >
                        <span aria-hidden="true">⌕</span>
                        {word}
                      </button>
                      <button
                        className="recent-delete"
                        type="button"
                        aria-label={`${word} 삭제`}
                        onClick={() => removeRecentSearch(word)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="helper-text">최근 검색어가 없어요.</p>
              )}
            </section>

            <section className="side-card bookshelf-card">
              <h2>내 서재만 훑어보고 싶다면</h2>
              <p>상태 필터와 카드·수첩형 보기는 내 서재에서 쓸 수 있어요.</p>
              <Link className="outline-button" to="/library">
                내 서재로 가기
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </UserLayout>
  );
}
