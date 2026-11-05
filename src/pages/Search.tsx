import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import "./Search.css";

type SearchType = "도서명" | "저자" | "서평" | "글귀";

type SearchResult = {
  id: number;
  type: SearchType;
  status: "승인" | "심사 대기" | "보완 요청" | "임시저장";
  statusClass: string;
  cover: string;
  coverClass: string;
  title: string;
  author: string;
  detail: string;
  note: string;
  readDate: string; // YYYY-MM-DD 형식: 날짜 최신순 정렬용
};

const ALL_RESULTS: SearchResult[] = [
  {
    id: 1,
    type: "도서명",
    status: "승인",
    statusClass: "tag-green",
    cover: "소",
    coverClass: "cover-peach",
    title: "소년이 온다",
    author: "한강",
    detail: "소장도서 · 읽은 쪽 215 / 215",
    note: "내서재에서 보기",
    readDate: "2026-10-11",
  },
  {
    id: 2,
    type: "도서명",
    status: "심사 대기",
    statusClass: "tag-yellow",
    cover: "작",
    coverClass: "cover-mint",
    title: "작별하지 않는다",
    author: "한강",
    detail: "소장도서 · 읽은 쪽 210 / 332",
    note: "내서재에서 보기",
    readDate: "2026-10-10",
  },
  {
    id: 3,
    type: "서평",
    status: "승인",
    statusClass: "tag-green",
    cover: "소",
    coverClass: "cover-peach",
    title: "소년이 온다 · 서평",
    author: "한강",
    detail:
      "아직 정돈된 전체의 일부를 오래 남겼다. 한강을 읽고 나서 마음을 고르게 되는 책이었습니다…",
    note: "10월 8일 작성 · 서평 536자",
    readDate: "2026-10-08",
  },
  {
    id: 4,
    type: "글귀",
    status: "심사 대기",
    statusClass: "tag-yellow",
    cover: "작",
    coverClass: "cover-mint",
    title: "작별하지 않는다 · 글귀",
    author: "한강",
    detail: "[글귀] 한강이 들려준 문장",
    note: "10월 10일 작성",
    readDate: "2026-10-10",
  },
  {
    id: 5,
    type: "서평",
    status: "보완 요청",
    statusClass: "tag-pink",
    cover: "불",
    coverClass: "cover-sage",
    title: "불편한 편의점 · 서평",
    author: "김호연",
    detail:
      "오늘은 책을 통해 한강의 소설과 나란히 놓고 싶은 따뜻한 이야기를…",
    note: "10월 6일 작성 · 서평 412자",
    readDate: "2026-10-06",
  },
  {
    id: 6,
    type: "도서명",
    status: "임시저장",
    statusClass: "tag-pink",
    cover: "데",
    coverClass: "cover-sage",
    title: "데미안",
    author: "헤르만 헤세",
    detail: "소장도서 · 읽은 쪽 1 / 248",
    note: "임시저장 기록 포함",
    readDate: "2026-10-05",
  },
];

const TYPES = ["전체", "도서명", "저자", "서평", "글귀"] as const;
const TARGETS = [
  "내가 등록한 도서·기록",
  "임시저장 기록 포함",
  "승인된 기록만",
] as const;
const SORTS = ["정확도순", "읽은 날짜 최신순", "도서명순"] as const;
const PAGE_SIZE = 4;

type Target = (typeof TARGETS)[number];
type Sort = (typeof SORTS)[number];

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

function getStatusClass(status: SearchResult["status"]) {
  if (status === "승인") return "tag-green";
  if (status === "심사 대기") return "tag-yellow";
  return "tag-pink";
}

export default function Search() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<(typeof TYPES)[number]>("전체");
  const [target, setTarget] = useState<Target>(TARGETS[0]);
  const [sort, setSort] = useState<Sort>("정확도순");
  const [page, setPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);

  const matchingResults = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    const filtered = ALL_RESULTS.filter((result) => {
      const isIncludedByTarget =
        target === "임시저장 기록 포함"
          ? true
          : target === "승인된 기록만"
            ? result.status === "승인"
            : result.status !== "임시저장";

      const isIncludedByType =
        selectedType === "전체" ||
        (selectedType === "저자"
          ? result.author.toLocaleLowerCase().includes(normalizedQuery)
          : result.type === selectedType);

      const searchableText = [
        result.title,
        result.author,
        result.type,
        result.status,
        result.detail,
        result.note,
      ]
        .join(" ")
        .toLocaleLowerCase();

      const isIncludedByQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return isIncludedByTarget && isIncludedByType && isIncludedByQuery;
    });

    if (sort === "읽은 날짜 최신순") {
      filtered.sort((a, b) => b.readDate.localeCompare(a.readDate));
    } else if (sort === "도서명순") {
      filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    } else if (query.trim()) {
      // 데모용: 검색어가 제목 앞쪽에 있을수록 정확도순으로 먼저 보여줘요.
      filtered.sort((a, b) => {
        const aStarts = a.title.toLocaleLowerCase().startsWith(normalizedQuery);
        const bStarts = b.title.toLocaleLowerCase().startsWith(normalizedQuery);
        return Number(bStarts) - Number(aStarts);
      });
    }

    return filtered;
  }, [query, selectedType, sort, target]);

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
            <p>도서명, 저자, 서평, 글귀를 한 번에 찾아요.</p>
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
            <button className="mic-button" type="button" aria-label="음성 검색">
              🎙
            </button>
            <button className="primary-button" type="submit">
              검색
            </button>
          </form>

          <div className="filter-list" aria-label="검색 범위">
            {TYPES.map((type) => (
              <button
                className={`filter-chip${selectedType === type ? " selected" : ""}`}
                type="button"
                key={type}
                aria-pressed={selectedType === type}
                onClick={() => selectType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {query && (
            <p className="search-query-note">
              “{query}”로 검색 중
            </p>
          )}
        </section>

        <div className="search-content-grid">
          <section className="results-panel">
            <div className="results-heading">
              <h2>
                {query ? `“${query}” 검색 결과` : "검색 결과"}{" "}
                <span>{matchingResults.length}건</span>
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

            {visibleResults.length > 0 ? (
              visibleResults.map((result) => (
                <article className="result-item" key={result.id}>
                  <div className={`book-cover ${result.coverClass}`}>
                    {result.cover}
                  </div>
                  <div className="result-content">
                    <div className="tags">
                      <span>{result.type}</span>
                      <span className={getStatusClass(result.status)}>
                        {result.status}
                      </span>
                    </div>
                    <h3>{result.title}</h3>
                    <p>
                      {result.author} · {result.detail}
                    </p>
                    <small>{result.note}</small>
                  </div>
                  <Link className="view-link" to="/library">
                    보기
                  </Link>
                </article>
              ))
            ) : (
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
              <h2>검색 대상</h2>
              <div className="side-chips">
                {TARGETS.map((item) => (
                  <button
                    className={target === item ? "selected" : ""}
                    type="button"
                    key={item}
                    aria-pressed={target === item}
                    onClick={() => selectTarget(item)}
                  >
                    {item}
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
              <h2>내서재만 훑어보고 싶다면</h2>
              <p>상태 필터와 카드·수첩형 보기는 내서재에서 쓸 수 있어요.</p>
              <Link className="outline-button" to="/library">
                내서재로 가기
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </UserLayout>
  );
}