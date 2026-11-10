import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import { COVER_FALLBACK_CHAR } from "../constants/cover";
import Icon from "../components/Icon";
import LibraryHeader from "../components/LibraryHeader";
import UserLayout from "../components/UserLayout";
import { getBooks, type LibraryBook, type LibraryBookStatus } from "../api/books";
import { formatMonthDay, readingStatusChip, readingStatusLabel } from "../constants/readingStatus";
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

/**
 * 책별로 모아보기: 등록한 책을 한 줄에 한 권씩 보여 주고, 오른쪽에 그 책의 가장 최근 기록을 보여 줍니다.
 * 줄을 누르면 그 자리에서 그 책의 기록을 모두 펼칩니다.
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

        <ul className="book-rows" aria-busy={loading}>
          {books.map((book) => {
            const bookRecords = recordsByBook.get(book.enrollmentBookId) ?? [];
            const latest = bookRecords[0];
            const open = openBookId === book.enrollmentBookId;
            const percent = book.totalPages > 0 ? Math.min(100, book.readPages / book.totalPages * 100) : 0;
            return (
              <li key={book.enrollmentBookId} className={`book-row${open ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="book-row-main"
                  aria-expanded={open}
                  aria-controls={`book-records-${book.enrollmentBookId}`}
                  onClick={() => setOpenBookId(open ? null : book.enrollmentBookId)}
                >
                  <Cover ch={book.title.slice(0, 1) || COVER_FALLBACK_CHAR} src={book.coverUrl} className="book-row-cover" />
                  <span className="book-row-info">
                    <span className="book-row-title">{book.title}</span>
                    <span className="book-row-author">{book.author}</span>
                    <span className="chip-list book-row-chips">
                      <Chip k="line">{book.libraryOwned ? "소장도서" : "소장 아님"}</Chip>
                      {book.completed && <Chip k="info">완독</Chip>}
                      {book.children && <Chip k="info">아동도서</Chip>}
                    </span>
                    <span className="progress-bar book-row-progress"><i style={{ width: `${percent}%` }} /></span>
                    <span className="book-row-pages">읽은 쪽 {book.readPages} / {book.totalPages}쪽</span>
                  </span>
                  <span className="book-row-latest">
                    {latest ? (
                      <>
                        <span className="book-row-latest-head">
                          <small>최근 기록</small>
                          <Chip k={readingStatusChip(latest.status)}>{readingStatusLabel(latest.status)}</Chip>
                        </span>
                        <b>{formatMonthDay(latest.readDate)} · {latest.startPage}–{latest.endPage}쪽</b>
                        <span className={`book-row-review${latest.review?.trim() ? "" : " is-empty"}`}>
                          {latest.review?.trim() || "아직 서평을 쓰지 않았어요."}
                        </span>
                      </>
                    ) : (
                      <span className="book-row-review is-empty">{recordsLoading ? "기록을 불러오는 중이에요." : "아직 기록이 없어요."}</span>
                    )}
                  </span>
                  <span className="book-row-toggle">
                    기록 {bookRecords.length}건
                    <Icon n="chr" s={16} />
                  </span>
                </button>

                {open && (
                  <div className="book-row-records" id={`book-records-${book.enrollmentBookId}`}>
                    {bookRecords.length === 0 ? (
                      <p className="text-small text-muted">
                        아직 이 책의 기록이 없어요. <Link to="/records/new" className="inline-link">기록 쓰기</Link>
                      </p>
                    ) : (
                      <>
                        <ol>
                          {bookRecords.map((record) => (
                            <li key={record.readingLogId}>
                              <Link to={`/library/notes?log=${record.readingLogId}`}>
                                <i className={`status-dot status-dot--${record.status}`} aria-hidden="true" />
                                <b>{formatMonthDay(record.readDate)}</b>
                                <span>{record.startPage}–{record.endPage}쪽</span>
                                <span className="book-row-record-length">서평 {record.reviewLength}자</span>
                                <Chip k={readingStatusChip(record.status)}>{readingStatusLabel(record.status)}</Chip>
                              </Link>
                            </li>
                          ))}
                        </ol>
                        <Link to={`/library?book=${book.enrollmentBookId}`} className="inline-link">
                          이 책 기록을 카드로 보기 <Icon n="arrow" s={15} />
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {!loading && !error && books.length === 0 && <li className="text-muted">조건에 맞는 도서가 없어요.</li>}
          {loading && <li className="text-muted">내 서재를 불러오는 중이에요.</li>}
        </ul>
        <Link to="/search" className="inline-link">
          전체 기록 통합 검색
          <Icon n="arrow" s={16} sw={1.8} />
        </Link>
      </section>
    </UserLayout>
  );
}
