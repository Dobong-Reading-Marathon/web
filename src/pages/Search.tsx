import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import UserLayout from "../components/UserLayout";
import {
  EDIT_LABELS, READING_STATUS_ORDER, isEditableRecord, readingStatusChip, readingStatusLabel,
} from "../constants/readingStatus";
import { bookByline, useLibraryRecords, type LibraryRecord } from "../hooks/useLibraryRecords";
import "./Search.css";

/** 검색 범위. 전체는 도서명·저자·출판사·서평·글귀를 모두 찾습니다. */
const SCOPES = ["전체", "도서명", "저자", "서평", "글귀"] as const;
type Scope = (typeof SCOPES)[number];

const SORTS = [
  { value: "newest", label: "최근 읽은 순" },
  { value: "oldest", label: "오래된 순" },
  { value: "title", label: "도서명 순" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const PAGE_SIZE = 6;
const RECENT_KEY = "reading-marathon-recent-searches";
const RECENT_LIMIT = 8;
const REVIEW_TARGET = 500;

function readRecentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(words: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(words));
  } catch {
    // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 이번 방문 동안만 기억합니다.
  }
}

const includes = (text: string | null | undefined, word: string) => Boolean(text?.toLocaleLowerCase().includes(word));

/** 검색어와 같은 부분을 <mark>로 감쌉니다. 대소문자는 구분하지 않습니다. */
function highlight(text: string, query: string): ReactNode {
  const word = query.trim();
  if (!word) return text;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi")).map((part, index) =>
    part.toLocaleLowerCase() === word.toLocaleLowerCase() ? <mark key={index}>{part}</mark> : part,
  );
}

/** 서평에서 검색어가 처음 나오는 곳 앞뒤를 잘라 보여 줍니다. 검색어가 없으면 앞부분을 보여 줍니다. */
function reviewSnippet(review: string, query: string) {
  const word = query.trim().toLocaleLowerCase();
  const index = word ? review.toLocaleLowerCase().indexOf(word) : -1;
  if (index <= 40) return review;
  return `…${review.slice(index - 30)}`;
}

/**
 * 독서기록 통합 검색. 이번 회차의 내 기록 전체(GET /api/me/reading-logs)에서
 * 도서명·저자·출판사·서평·글귀를 찾아 기록 단위로 보여 줍니다.
 */
export default function Search() {
  const { records, loading, error } = useLibraryRecords();
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("전체");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);

  const results = useMemo(() => {
    const word = query.trim().toLocaleLowerCase();
    const matched = records.filter((record) => {
      if (status !== "ALL" && record.status !== status) return false;
      if (!word) return true;
      switch (scope) {
        case "도서명": return includes(record.bookTitle, word);
        case "저자": return includes(record.author, word);
        case "서평": return includes(record.review, word);
        case "글귀": return includes(record.quote, word);
        default:
          return [record.bookTitle, record.author, record.publisher, record.review, record.quote].some((text) => includes(text, word));
      }
    });
    if (sort === "title") return matched.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle, "ko") || b.readDate.localeCompare(a.readDate));
    if (sort === "oldest") return matched;
    return matched.reverse();
  }, [records, query, scope, status, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function saveRecent(next: string[]) {
    setRecentSearches(next);
    writeRecentSearches(next);
  }

  function runSearch(event?: FormEvent<HTMLFormElement>, term = inputValue) {
    event?.preventDefault();
    const trimmed = term.trim();
    setQuery(trimmed);
    setInputValue(trimmed);
    setPage(1);
    if (trimmed) {
      saveRecent([trimmed, ...recentSearches.filter((word) => word.toLocaleLowerCase() !== trimmed.toLocaleLowerCase())].slice(0, RECENT_LIMIT));
    }
  }

  function clearQuery() {
    setInputValue("");
    setQuery("");
    setPage(1);
  }

  return (
    <UserLayout active="search">
      <main className="search-page">
        <section className="search-hero">
          <div>
            <h1>통합 검색</h1>
            <p>내 독서기록을 도서명, 저자, 출판사, 서평, 글귀로 찾아요.</p>
          </div>
          <div className="search-hero-art" aria-hidden="true">
            <span className="search-book-back" />
            <span className="search-book-front" />
            <span className="search-book-small" />
          </div>
        </section>

        <section className="search-box" aria-label="검색">
          <form className="search-form" onSubmit={(event) => runSearch(event)} role="search">
            <span className="search-input">
              <Icon n="search" s={18} />
              <input
                type="search"
                placeholder="도서명, 저자, 서평, 글귀 검색"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                aria-label="검색어"
              />
              {inputValue && (
                <button type="button" className="search-clear" onClick={clearQuery} aria-label="검색어 지우기">
                  <Icon n="x" s={16} />
                </button>
              )}
            </span>
            <button className="search-submit" type="submit">검색</button>
          </form>

          {recentSearches.length > 0 && (
            <div className="recent-row">
              <span className="recent-label"><Icon n="clip" s={14} /> 최근 검색어</span>
              <ul>
                {recentSearches.map((word) => (
                  <li key={word}>
                    <button type="button" className="recent-word" onClick={() => runSearch(undefined, word)}>{word}</button>
                    <button type="button" className="recent-delete" aria-label={`최근 검색어 ${word} 지우기`} onClick={() => saveRecent(recentSearches.filter((item) => item !== word))}>
                      <Icon n="x" s={12} />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="recent-clear" onClick={() => saveRecent([])}>모두 지우기</button>
            </div>
          )}

          <div className="search-filters">
            <div className="scope-list" role="group" aria-label="검색 범위">
              {SCOPES.map((item) => (
                <button key={item} type="button" className={scope === item ? "is-active" : ""} aria-pressed={scope === item} onClick={() => { setScope(item); setPage(1); }}>
                  {item}
                </button>
              ))}
            </div>
            <div className="search-selects">
              <label>
                <span>기록 상태</span>
                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                  <option value="ALL">전체</option>
                  {READING_STATUS_ORDER.map((item) => <option key={item} value={item}>{readingStatusLabel(item)}</option>)}
                </select>
              </label>
              <label>
                <span>정렬</span>
                <select value={sort} onChange={(event) => { setSort(event.target.value as Sort); setPage(1); }}>
                  {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="results-panel" aria-busy={loading}>
          <div className="results-heading">
            <h2>{query ? <>“<em>{query}</em>” 검색 결과</> : "내 독서기록"} {!loading && !error && <span>총 {results.length}건</span>}</h2>
            {query && <button type="button" className="text-button" onClick={clearQuery}>검색어 초기화</button>}
          </div>

          {loading && <p className="search-empty">독서기록을 불러오는 중이에요.</p>}
          {error && <p className="search-empty is-error" role="alert">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p className="search-empty">{records.length === 0 ? "아직 독서기록이 없어요." : "검색 결과가 없어요. 다른 단어나 검색 범위로 찾아보세요."}</p>
          )}

          <div className="result-grid">
            {visible.map((record) => <ResultCard key={record.readingLogId} record={record} query={query} scope={scope} />)}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="검색 결과 페이지">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="이전 페이지"><Icon n="chl" s={16} /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button key={pageNumber} type="button" className={currentPage === pageNumber ? "current" : ""} aria-current={currentPage === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)}>
                  {pageNumber}
                </button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="다음 페이지"><Icon n="chr" s={16} /></button>
            </nav>
          )}
        </section>
      </main>
    </UserLayout>
  );
}

/** 검색 결과 카드 한 장 (독서기록 한 건). 검색어가 서평·글귀에 있으면 일치 표시를 붙입니다. */
function ResultCard({ record, query, scope }: { record: LibraryRecord; query: string; scope: Scope }) {
  const word = query.trim().toLocaleLowerCase();
  const quoteMatch = Boolean(word) && (scope === "전체" || scope === "글귀") && includes(record.quote, word);
  const reviewMatch = Boolean(word) && (scope === "전체" || scope === "서평") && includes(record.review, word);
  const review = record.review?.trim();
  const quote = record.quote?.trim();
  const met = record.reviewLength >= REVIEW_TARGET;
  return (
    <article className="result-card">
      <header className="result-card-top">
        <time dateTime={record.readDate}><Icon n="cal" s={13} /> {record.readDate}</time>
        <span className="result-card-chips">
          <Chip k={readingStatusChip(record.status)}>{readingStatusLabel(record.status)}</Chip>
          <Chip k="line">{record.libraryOwned ? "소장도서" : "소장 아님"}</Chip>
        </span>
      </header>
      <div>
        <h3>{highlight(record.bookTitle, query)}</h3>
        <p className="result-card-meta">{highlight(bookByline(record), query)} · {record.startPage}–{record.endPage}쪽</p>
      </div>
      {quote && (
        <blockquote className={`result-quote${quoteMatch ? " is-match" : ""}`}>
          <span className="result-block-label">마음에 드는 글귀 {quoteMatch && <b>글귀 일치</b>}</span>
          “{highlight(quote, query)}”
        </blockquote>
      )}
      {review && (
        <div className={`result-review${reviewMatch ? " is-match" : ""}`}>
          <span className="result-block-label">서평 ({record.reviewLength}자) {reviewMatch && <b>서평 일치</b>}</span>
          <p>{highlight(reviewMatch ? reviewSnippet(review, query) : review, query)}</p>
        </div>
      )}
      <footer className="result-card-footer">
        <span className={`result-length${met ? " is-met" : ""}`}>
          {met && <Icon n="check" s={14} />}서평 {record.reviewLength}자 <small>{met ? "(500자 충족)" : "(권장 500자)"}</small>
        </span>
        <span className="result-actions">
          <Link to={`/library/notes?log=${record.readingLogId}`}><Icon n="book" s={15} /> 수첩에서 보기</Link>
          {isEditableRecord(record.status) && (
            <Link to={`/records/${record.readingLogId}/edit`}><Icon n="pen" s={15} /> {EDIT_LABELS[record.status]}</Link>
          )}
        </span>
      </footer>
    </article>
  );
}
