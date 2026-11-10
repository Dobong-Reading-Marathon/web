import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import LibraryHeader from "../components/LibraryHeader";
import UserLayout from "../components/UserLayout";
import { deleteReadingLog } from "../api/readingLogs";
import {
  EDIT_LABELS, READING_STATUS_ORDER, formatMonthDay, isDeletableRecord, isEditableRecord, readingStatusChip, readingStatusLabel,
} from "../constants/readingStatus";
import { bookByline, useLibraryRecords, type LibraryRecord } from "../hooks/useLibraryRecords";
import "./Library.css";

type FlipDirection = "next" | "prev" | null;

function NotebookPage({ record, pageNo, pageCount, flip, deleting, onDelete }: {
  record: LibraryRecord;
  pageNo: number;
  pageCount: number;
  flip: FlipDirection;
  deleting: boolean;
  onDelete: () => void;
}) {
  const editable = isEditableRecord(record.status);
  const deletable = isDeletableRecord(record.status);
  const byline = bookByline(record);
  return (
    <article className={`notebook-page${flip ? ` flip-${flip}` : ""}`} aria-label={`${pageNo}쪽 / 전체 ${pageCount}쪽`}>
      <header className="notebook-page-head">
        <time dateTime={record.readDate}>{record.readDate}</time>
        <span className="notebook-divider" aria-hidden="true">|</span>
        <span>{record.startPage}–{record.endPage}쪽</span>
        <Chip k={readingStatusChip(record.status)}>{readingStatusLabel(record.status)}</Chip>
        <span className="notebook-page-no">{pageNo} / {pageCount}</span>
      </header>
      <h2 className="notebook-title">『{record.bookTitle}』{byline && <small> - {byline}</small>}</h2>

      {record.librarianComment && (
        <p className="notebook-comment"><b>사서 코멘트{record.reviewedAt ? ` · ${formatMonthDay(record.reviewedAt)}` : ""}</b>{record.librarianComment}</p>
      )}
      {record.quote?.trim() && (
        <blockquote className="notebook-quote"><b>[마음에 드는 글귀]</b> “{record.quote.trim()}”</blockquote>
      )}
      <section className="notebook-review">
        <h3>[독서 소감 / 서평] <span>({record.reviewLength}자)</span></h3>
        <p className={record.review?.trim() ? "" : "is-empty"}>{record.review?.trim() || "아직 서평을 쓰지 않았어요."}</p>
      </section>

      <footer className="notebook-actions">
        {editable ? (
          <>
            <Link to={`/records/${record.readingLogId}/edit`} className="button button--primary is-small"><Icon n="pen" s={15} /> {EDIT_LABELS[record.status]}</Link>
            {deletable && (
              <button type="button" className="button button--danger-outline is-small" onClick={onDelete} disabled={deleting}>
                <Icon n="trash" s={15} /> {deleting ? "삭제 중" : "삭제"}
              </button>
            )}
            {!deletable && <span className="text-extra-small text-muted">제출한 기록은 삭제할 수 없어요.</span>}
          </>
        ) : (
          <span className="text-extra-small text-muted">{record.status === "APPROVED" ? "승인된" : "심사 중인"} 기록은 수정하거나 삭제할 수 없어요.</span>
        )}
      </footer>
    </article>
  );
}

/**
 * 내서재 수첩형: 기록 한 건이 수첩 한 장입니다. 읽은 날짜가 빠른 기록이 앞 장, 가장 최근 기록이 마지막 장입니다.
 * 오른쪽 기록 목록에서 원하는 장으로 바로 넘어갈 수 있고, 점 색으로 상태를 구분합니다.
 */
export default function LibraryNotes() {
  const [searchParams] = useSearchParams();
  const { records, loading, error, removeRecord } = useLibraryRecords();
  const [flip, setFlip] = useState<FlipDirection>(null);
  const [printing, setPrinting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const navListRef = useRef<HTMLOListElement>(null);

  // 카드형에서 넘어오면 ?log=기록ID 장을 먼저 엽니다. 장을 넘길 때는 주소를 바꾸지 않습니다.
  // (주소가 바뀌면 RequireUser가 로그인 확인을 다시 하면서 화면 전체를 새로 그리기 때문입니다.)
  const [currentId, setCurrentId] = useState<number | null>(() => Number(searchParams.get("log")) || null);
  const requestedIndex = records.findIndex((record) => record.readingLogId === currentId);
  const pageIndex = requestedIndex >= 0 ? requestedIndex : records.length - 1;
  const current = records[pageIndex];

  function goTo(index: number) {
    const target = records[index];
    if (!target || index === pageIndex) return;
    setFlip(index > pageIndex ? "next" : "prev");
    setCurrentId(target.readingLogId);
  }

  // 키보드 ← → 로 장을 넘깁니다 (입력칸에 있을 때는 제외).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") goTo(pageIndex - 1);
      if (event.key === "ArrowRight") goTo(pageIndex + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 목록에서 지금 장이 보이도록 목록 안에서만 스크롤합니다.
  useEffect(() => {
    const list = navListRef.current;
    const item = list?.querySelector<HTMLElement>(".is-current");
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top - list.clientHeight / 2 + item.offsetHeight / 2;
    }
  }, [current?.readingLogId, records.length]);

  // 모든 장을 그린 뒤 인쇄 창을 엽니다.
  useEffect(() => {
    if (!printing) return;
    const timer = window.setTimeout(() => { window.print(); setPrinting(false); }, 50);
    return () => window.clearTimeout(timer);
  }, [printing]);

  function onTouchEnd(event: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const distance = event.changedTouches[0].clientX - start;
    if (Math.abs(distance) < 60) return;
    goTo(distance < 0 ? pageIndex + 1 : pageIndex - 1);
  }

  async function handleDelete(record: LibraryRecord) {
    if (!window.confirm(`${record.readDate} ‘${record.bookTitle}’ 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없어요.`)) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteReadingLog(record.readingLogId);
      const next = records[pageIndex + 1] ?? records[pageIndex - 1];
      removeRecord(record.readingLogId);
      setFlip(null);
      setCurrentId(next?.readingLogId ?? null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "기록을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  }

  const newestFirst = [...records].reverse();

  return (
    <UserLayout active="lib">
      <section className="content-section is-top notes-root">
        <LibraryHeader
          active="notes"
          actions={records.length > 0 && (
            <button type="button" className="button" onClick={() => setPrinting(true)} disabled={printing}>
              <Icon n="printer" s={16} sw={1.8} /> {printing ? "인쇄 준비 중…" : "기록장 인쇄 · PDF"}
            </button>
          )}
        />
        {(error || actionError) && <div className="notice notice--danger" role="alert">{error || actionError}</div>}

        {loading ? (
          <div className="content-card text-muted">독서기록을 불러오는 중이에요.</div>
        ) : !current ? (
          <div className="content-card text-muted library-empty">
            아직 독서기록이 없어요. <Link to="/records/new" className="inline-link">첫 기록 쓰기</Link>
          </div>
        ) : (
          <div className="notes-layout">
            <div className="notebook" onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
              {printing ? (
                records.map((record, index) => (
                  <NotebookPage key={record.readingLogId} record={record} pageNo={index + 1} pageCount={records.length} flip={null} deleting={false} onDelete={() => undefined} />
                ))
              ) : (
                <NotebookPage
                  key={current.readingLogId}
                  record={current}
                  pageNo={pageIndex + 1}
                  pageCount={records.length}
                  flip={flip}
                  deleting={deleting}
                  onDelete={() => void handleDelete(current)}
                />
              )}
              <nav className="notebook-pager" aria-label="수첩 넘기기">
                <button type="button" onClick={() => goTo(pageIndex - 1)} disabled={pageIndex <= 0}><Icon n="chl" s={18} /> 이전 장</button>
                <span>{pageIndex + 1} / {records.length}</span>
                <button type="button" onClick={() => goTo(pageIndex + 1)} disabled={pageIndex >= records.length - 1}>다음 장 <Icon n="chr" s={18} /></button>
              </nav>
            </div>

            <aside className="notes-nav" aria-label="기록 목록">
              <h2>기록 목록 <small>{records.length}건</small></h2>
              <ul className="notes-legend" aria-label="점 색 안내">
                {READING_STATUS_ORDER.map((status) => (
                  <li key={status}><i className={`status-dot status-dot--${status}`} />{readingStatusLabel(status)}</li>
                ))}
              </ul>
              <ol className="notes-nav-list" ref={navListRef}>
                {newestFirst.map((record) => {
                  const index = records.indexOf(record);
                  const isCurrent = index === pageIndex;
                  return (
                    <li key={record.readingLogId}>
                      <button type="button" className={isCurrent ? "is-current" : ""} aria-current={isCurrent ? "page" : undefined} onClick={() => goTo(index)}>
                        <i className={`status-dot status-dot--${record.status}`} title={readingStatusLabel(record.status)} />
                        <span className="sr-only">{readingStatusLabel(record.status)},</span>
                        <b>{formatMonthDay(record.readDate)}</b>
                        <span className="notes-nav-title">{record.bookTitle} · {record.endPage}쪽</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>
          </div>
        )}
      </section>
    </UserLayout>
  );
}
