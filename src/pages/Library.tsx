import { useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import LibraryHeader from "../components/LibraryHeader";
import UserLayout from "../components/UserLayout";
import { deleteReadingLog } from "../api/readingLogs";
import {
  EDIT_LABELS, READING_STATUS_ORDER, isDeletableRecord, isEditableRecord, readingStatusChip, readingStatusLabel,
} from "../constants/readingStatus";
import { bookByline, useLibraryRecords, type LibraryRecord } from "../hooks/useLibraryRecords";
import "./Library.css";

const REVIEW_TARGET = 500;

/** 내 서재 카드형: 독서기록 한 건을 카드 한 장으로 보여 줍니다. 최근 기록이 먼저 나옵니다. */
export default function Library() {
  const location = useLocation();
  const navigationNotice = (location.state as { notice?: string } | null)?.notice;
  const [searchParams, setSearchParams] = useSearchParams();
  const bookFilter = Number(searchParams.get("book")) || null;
  const { records, loading, error, removeRecord } = useLibraryRecords();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const newestFirst = useMemo(() => [...records].reverse(), [records]);
  const filterBookTitle = bookFilter ? records.find((record) => record.enrollmentBookId === bookFilter)?.bookTitle : undefined;

  const visible = newestFirst.filter((record) => {
    if (bookFilter && record.enrollmentBookId !== bookFilter) return false;
    if (statusFilter && record.status !== statusFilter) return false;
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return [record.bookTitle, record.author, record.publisher, record.quote, record.review].some((text) => text?.toLowerCase().includes(keyword));
  });

  async function handleDelete(record: LibraryRecord) {
    if (!window.confirm(`${record.readDate} ‘${record.bookTitle}’ 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없어요.`)) return;
    setDeletingId(record.readingLogId);
    setActionError("");
    try {
      await deleteReadingLog(record.readingLogId);
      removeRecord(record.readingLogId);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "기록을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <UserLayout active="lib">
      <section className="content-section is-top">
        {navigationNotice && <p className="notice notice--success" role="status">{navigationNotice}</p>}
        <LibraryHeader active="cards" />

        <div className="library-toolbar">
          <input
            className="text-input"
            type="search"
            placeholder="도서명, 저자, 출판사, 글귀, 서평 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="독서기록 검색"
          />
          <div className="chip-list" aria-label="기록 상태 필터">
            <button type="button" className={`status-filter${statusFilter === null ? " is-active" : ""}`} aria-pressed={statusFilter === null} onClick={() => setStatusFilter(null)}>
              전체 {records.length > 0 && `(${records.length})`}
            </button>
            {READING_STATUS_ORDER.map((status) => (
              <button key={status} type="button" className={`status-filter${statusFilter === status ? " is-active" : ""}`} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>
                {readingStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {bookFilter && (
          <p className="library-book-filter">
            <b>{filterBookTitle ?? "선택한 책"}</b> 기록만 보고 있어요.
            <button type="button" onClick={() => setSearchParams({})}><Icon n="x" s={14} /> 전체 기록 보기</button>
          </p>
        )}
        {(error || actionError) && <div className="notice notice--danger" role="alert">{error || actionError}</div>}

        {loading ? (
          <p className="text-muted">독서기록을 불러오는 중이에요.</p>
        ) : visible.length === 0 ? (
          <div className="content-card text-muted library-empty">
            {records.length === 0 ? <>아직 독서기록이 없어요. <Link to="/records/new" className="inline-link">첫 기록 쓰기</Link></> : "조건에 맞는 기록이 없어요."}
          </div>
        ) : (
          <div className="record-card-grid">
            {visible.map((record) => {
              const editable = isEditableRecord(record.status);
              const deletable = isDeletableRecord(record.status);
              const met = record.reviewLength >= REVIEW_TARGET;
              return (
                <article key={record.readingLogId} className="record-card">
                  <header className="record-card-top">
                    <time className="record-card-date" dateTime={record.readDate}><Icon n="cal" s={13} /> {record.readDate}</time>
                    <span className="record-card-chips">
                      <Chip k={readingStatusChip(record.status)}>{readingStatusLabel(record.status)}</Chip>
                      <Chip k="line">{record.libraryOwned ? "소장도서" : "소장 아님"}</Chip>
                    </span>
                  </header>
                  <div>
                    <h3 className="record-card-title">{record.bookTitle}</h3>
                    <p className="record-card-meta">
                      {[bookByline(record), `${record.startPage}–${record.endPage}쪽`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {record.quote?.trim() && <blockquote className="record-card-quote">“{record.quote.trim()}”</blockquote>}
                  {record.librarianComment && record.status === "REVISION_REQUESTED" && (
                    <p className="record-card-comment"><b>사서 코멘트</b> {record.librarianComment}</p>
                  )}
                  <p className={`record-card-review${record.review?.trim() ? "" : " is-empty"}`}>
                    {record.review?.trim() || "아직 서평을 쓰지 않았어요."}
                  </p>
                  <footer className="record-card-footer">
                    <span className={`record-card-length${met ? " is-met" : ""}`}>
                      {met && <Icon n="check" s={15} />}
                      <b>{record.reviewLength}자</b>
                      <small>{met ? "(500자 충족)" : "(권장 500자)"}</small>
                    </span>
                    <span className="record-card-actions">
                      <Link to={`/library/notes?log=${record.readingLogId}`} aria-label={`${record.bookTitle} 기록 수첩에서 보기`} title="수첩에서 보기"><Icon n="book" s={17} /></Link>
                      {editable && (
                        <Link to={`/records/${record.readingLogId}/edit`} aria-label={`${record.bookTitle} 기록 ${EDIT_LABELS[record.status]}`} title={EDIT_LABELS[record.status]}><Icon n="pen" s={17} /></Link>
                      )}
                      {deletable && (
                        <button type="button" onClick={() => void handleDelete(record)} disabled={deletingId === record.readingLogId} aria-label={`${record.bookTitle} 기록 삭제`} title="삭제"><Icon n="trash" s={17} /></button>
                      )}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </UserLayout>
  );
}
