import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import { COVER_FALLBACK_CHAR } from "../constants/cover";
import Icon from "../components/Icon";
import LibraryHeader from "../components/LibraryHeader";
import UserLayout from "../components/UserLayout";
import { getBooks, type LibraryBook, type LibraryBookStatus } from "../api/books";
import {
  EDIT_LABELS, isEditableRecord, readingStatusChip, readingStatusLabel,
} from "../constants/readingStatus";
import { useLibraryRecords, type LibraryRecord } from "../hooks/useLibraryRecords";
import "./Library.css";

const filters: { label: string; value?: LibraryBookStatus }[] = [
  { label: "전체" },
  { label: "임시저장", value: "DRAFT" },
  { label: "심사 대기", value: "SUBMITTED" },
  { label: "승인", value: "APPROVED" },
  { label: "저장", value: "SAVED" },
  { label: "보완요청", value: "REVISION_REQUESTED" },
  { label: "기록 전", value: "NO_RECORD" },
];

/** 펼친 책에서 처음 보여 주는 기록 수. "전체 보기"를 누르면 모두 보여 줍니다. */
const PREVIEW_COUNT = 5;

/** 펼친 책 안의 기록 한 건. 수첩형 한 장과 같은 내용을 보여 줍니다. */
function BookRecordEntry({ record }: { record: LibraryRecord }) {
  return (
    <article className="book-record">
      <header className="book-record-head">
        <span className="book-record-pages">{record.startPage}–{record.endPage}쪽</span>
        <time className="book-record-date" dateTime={record.readDate}>{record.readDate}</time>
        <span className="book-record-links">
          <Chip k={readingStatusChip(record.status)}>{readingStatusLabel(record.status)}</Chip>
          <Link to={`/library/notes?log=${record.readingLogId}`}><Icon n="book" s={14} /> 수첩에서 보기</Link>
          {isEditableRecord(record.status) && (
            <Link to={`/records/${record.readingLogId}/edit`}><Icon n="pen" s={14} /> {EDIT_LABELS[record.status]}</Link>
          )}
        </span>
      </header>
      {record.librarianComment && (
        <p className="notebook-comment"><b>사서 코멘트</b>{record.librarianComment}</p>
      )}
      {record.quote?.trim() && (
        <blockquote className="notebook-quote"><b>[마음에 드는 글귀]</b> “{record.quote.trim()}”</blockquote>
      )}
      {/* 서평이 있는 기록만 독서 소감 / 서평을 보여 줍니다. */}
      {record.review?.trim() && (
        <section className="notebook-review">
          <h3>[독서 소감 / 서평] <span>({record.reviewLength}자)</span></h3>
          <p>{record.review.trim()}</p>
        </section>
      )}
    </article>
  );
}

/** 책 블록 안의 책 정보: 왼쪽 표지, 오른쪽 표시·제목·저자, 아래 읽은 쪽 진행 막대 */
function BookSummary({ book }: { book: LibraryBook }) {
  const percent = book.totalPages > 0 ? Math.min(100, book.readPages / book.totalPages * 100) : 0;
  return (
    <>
      <Cover ch={book.title.slice(0, 1) || COVER_FALLBACK_CHAR} src={book.coverUrl} className="book-tile-cover" />
      <span className="book-tile-info">
        <span className="chip-list book-tile-chips">
          {book.completed && <Chip k="info">완독</Chip>}
          <Chip k="line">{book.libraryOwned ? "소장도서" : "소장 아님"}</Chip>
          {book.children && <Chip k="info">아동도서</Chip>}
        </span>
        <span className="book-tile-title">{book.title}</span>
        <span className="book-tile-author">{book.author}</span>
        <span className="book-tile-progress">
          <small>{book.readPages} / {book.totalPages}쪽</small>
          <span className="progress-bar"><i style={{ width: `${percent}%` }} /></span>
        </span>
      </span>
    </>
  );
}

/**
 * 책별로 모아보기: 등록한 책을 블록으로 모아 보여 줍니다.
 * 블록을 누르면 가로로 길게 펼쳐지고, 그 책의 기록을 수첩형 상세와 같은 형식으로 보여 줍니다 (처음 5건, 전체 보기로 모두).
 */
export default function LibraryBooks() {
  const location = useLocation();
  const navigationNotice = (location.state as { notice?: string } | null)?.notice;
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openBookId, setOpenBookId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  // 펼친 책의 기록 순서. true면 최근 기록부터, false면 오래된 기록부터
  const [newestFirst, setNewestFirst] = useState(true);
  const openRef = useRef<HTMLLIElement>(null);
  const { records, loading: recordsLoading, error: recordsError } = useLibraryRecords();
  const selectedStatus = filters.find((filter) => filter.label === statusFilter)?.value;

  // 책별 기록 (최근 기록이 먼저)
  const recordsByBook = useMemo(() => {
    const map = new Map<number, LibraryRecord[]>();
    for (const record of [...records].reverse()) {
      const list = map.get(record.enrollmentBookId) ?? [];
      list.push(record);
      map.set(record.enrollmentBookId, list);
    }
    return map;
  }, [records]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getBooks({ keyword: searchQuery, status: selectedStatus, signal: controller.signal })
        .then(setBooks)
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setError(reason instanceof Error ? reason.message : "내 서재를 불러오지 못했습니다.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedStatus]);

  // 펼친 블록이 화면 밖이면 보이는 곳으로 스크롤합니다.
  useEffect(() => {
    const element = openRef.current;
    if (!element) return;
    const { top, bottom } = element.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openBookId]);

  function toggle(bookId: number) {
    setOpenBookId((current) => (current === bookId ? null : bookId));
    setShowAll(false);
  }

  return (
    <UserLayout active="lib">
      <section className="content-section is-top">
        {navigationNotice && <p className="notice notice--success" role="status">{navigationNotice}</p>}
        <LibraryHeader active="books" />
        <div className="library-toolbar">
          <input
            className="text-input"
            type="search"
            placeholder="내서재에서 도서·기록 검색"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="내서재 도서 검색"
          />
          <div className="chip-list" aria-label="도서 상태 필터">
            {filters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                className={`status-filter${statusFilter === filter.label ? " is-active" : ""}`}
                aria-pressed={statusFilter === filter.label}
                onClick={() => setStatusFilter(filter.label)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        {(error || recordsError) && <div className="notice notice--danger" role="alert">{error || recordsError}</div>}

        {loading && books.length === 0 ? (
          <p className="text-muted">내 서재를 불러오는 중이에요.</p>
        ) : books.length === 0 ? (
          <p className="text-muted">조건에 맞는 도서가 없어요.</p>
        ) : (
          <ul className="book-tiles" aria-busy={loading}>
            {books.map((book) => {
              const open = openBookId === book.enrollmentBookId;
              const bookRecords = recordsByBook.get(book.enrollmentBookId) ?? [];
              const ordered = newestFirst ? bookRecords : [...bookRecords].reverse();
              const shown = open && !showAll ? ordered.slice(0, PREVIEW_COUNT) : ordered;
              return (
                <li key={book.enrollmentBookId} ref={open ? openRef : undefined} className={`book-tile${open ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="book-tile-main"
                    aria-expanded={open}
                    aria-controls={`book-records-${book.enrollmentBookId}`}
                    onClick={() => toggle(book.enrollmentBookId)}
                  >
                    <BookSummary book={book} />
                    {open && <span className="book-tile-close"><Icon n="x" s={16} /> 접기</span>}
                  </button>

                  {open && (
                    <div className="book-tile-records" id={`book-records-${book.enrollmentBookId}`}>
                      <div className="book-tile-records-head">
                        <h3 className="book-tile-records-title">독서기록 <small>{bookRecords.length}건</small></h3>
                        {bookRecords.length > 1 && (
                          <div className="book-tile-sort" role="group" aria-label="기록 순서">
                            <button type="button" className={newestFirst ? "is-active" : ""} aria-pressed={newestFirst} onClick={() => setNewestFirst(true)}>최근 순</button>
                            <button type="button" className={newestFirst ? "" : "is-active"} aria-pressed={!newestFirst} onClick={() => setNewestFirst(false)}>오래된 순</button>
                          </div>
                        )}
                      </div>
                      {recordsLoading ? (
                        <p className="text-small text-muted">기록을 불러오는 중이에요.</p>
                      ) : bookRecords.length === 0 ? (
                        <p className="text-small text-muted">
                          아직 이 책의 기록이 없어요. <Link to="/records/new" className="inline-link">기록 쓰기</Link>
                        </p>
                      ) : (
                        <>
                          {shown.map((record) => <BookRecordEntry key={record.readingLogId} record={record} />)}
                          {bookRecords.length > PREVIEW_COUNT && (
                            <button type="button" className="book-tile-more" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
                              {showAll ? "처음 5건만 보기" : `전체 보기 (${bookRecords.length}건)`}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Link to="/search" className="inline-link">
          전체 기록 통합 검색
          <Icon n="arrow" s={16} sw={1.8} />
        </Link>
      </section>
    </UserLayout>
  );
}
