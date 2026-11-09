import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chip, { type ChipKind } from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import { getBooks, type LibraryBookStatus } from "../api/books";
import { getReadingCalendar, getReadingLogDetail, type ReadingLogDetail } from "../api/calendar";
import { getCurrentEnrollment } from "../api/enrollments";
import { deleteReadingLog } from "../api/readingLogs";

type ReadingRecord = {
  id: number;
  date: string;
  title: string;
  initial: string;
  author: string;
  pages: string;
  status: string;
  statusCode: string;
  chipKind: ChipKind;
  totalPages: number;
  ownership: string;
  readDate: string;
  children: boolean;
};

const statusLabels: Record<LibraryBookStatus | string, string> = {
  NO_RECORD: "기록 전",
  DRAFT: "임시저장",
  SUBMITTED: "심사 대기",
  APPROVED: "승인",
  REVISION_REQUESTED: "보완요청",
};

const statusKinds: Record<string, ChipKind> = {
  DRAFT: "draft",
  SUBMITTED: "wait",
  APPROVED: "ok",
  REVISION_REQUESTED: "fix",
};

function formatDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

function formatPages(startPage: number, endPage: number) {
  return `${startPage}–${endPage}쪽`;
}

// 임시저장·보완요청 상태만 수정·삭제할 수 있습니다 (서버 규칙과 같음).
function isEditable(statusCode: string) {
  return statusCode === "DRAFT" || statusCode === "REVISION_REQUESTED";
}

function reviewCharCount(review: string | null | undefined) {
  return Array.from(review ?? "").length;
}

export default function LibraryNotes() {
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ReadingLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadRecords() {
      try {
        const [enrollment, books] = await Promise.all([
          getCurrentEnrollment(controller.signal),
          getBooks({ signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        const bookMap = new Map(books.map((book) => [book.enrollmentBookId, book]));
        if (!enrollment) {
          setRecords([]);
          return;
        }

        const calendars = await Promise.all(
          Array.from({ length: 12 }, (_, index) =>
            getReadingCalendar(enrollment.year, index + 1, controller.signal),
          ),
        );
        if (controller.signal.aborted) return;

        const nextRecords = calendars.flatMap((calendar) =>
          calendar.days.flatMap((day) => day.logs.map((log) => {
            const book = bookMap.get(log.enrollmentBookId);
            return {
              id: log.readingLogId,
              date: formatDate(day.date),
              title: log.bookTitle,
              initial: log.bookTitle.slice(0, 1) || "책",
              author: book?.author ?? "",
              pages: formatPages(log.startPage, log.endPage),
              status: statusLabels[log.status] ?? log.status,
              statusCode: log.status,
              chipKind: statusKinds[log.status] ?? "line",
              totalPages: book?.totalPages ?? 0,
              ownership: book?.libraryOwned ? "소장도서" : "소장 아님",
              readDate: formatDate(day.date),
              children: book?.children ?? false,
            } satisfies ReadingRecord;
          })),
        ).sort((a, b) => {
          const [aMonth, aDay] = a.date.split("월 ").map(Number);
          const [bMonth, bDay] = b.date.split("월 ").map(Number);
          return bMonth - aMonth || bDay - aDay || b.id - a.id;
        });

        setRecords(nextRecords);
        setSelectedId(nextRecords[0]?.id ?? null);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "독서 기록을 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadRecords();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setSelectedDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setSelectedDetail(null);
    getReadingLogDetail(selectedId, controller.signal)
      .then(setSelectedDetail)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "기록 상세를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  const selectedRecord = records.find((record) => record.id === selectedId);
  const selectedEditable = selectedRecord ? isEditable(selectedRecord.statusCode) : false;
  const reviewWords = reviewCharCount(selectedDetail?.review);

  async function handleDelete() {
    if (!selectedRecord || !selectedEditable) return;
    if (!window.confirm(`${selectedRecord.date} ‘${selectedRecord.title}’ 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없어요.`)) return;

    setDeleting(true);
    setError("");
    try {
      await deleteReadingLog(selectedRecord.id);
      // 목록에서 빼고, 같은 자리의 다음 기록을 고릅니다.
      const index = records.findIndex((record) => record.id === selectedRecord.id);
      const nextRecords = records.filter((record) => record.id !== selectedRecord.id);
      setRecords(nextRecords);
      setSelectedId(nextRecords[Math.min(index, nextRecords.length - 1)]?.id ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "기록을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <UserLayout active="lib">
      <section className="content-section is-top">
        <div className="breadcrumb">
          <Link to="/library">내서재</Link>
          <Icon n="chr" s={14} sw={1.8} />
          수첩형 · 기록 상세
        </div>

        <div className="page-banner notes-page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">수첩형 · 기록 상세</h1>
              <p className="page-description">날짜순으로 기록을 훑고, 한 건씩 열어 수정하거나 다시 제출해요.</p>
            </div>
            <div className="view-switcher">
              <Link to="/library"><Icon n="grid" s={16} sw={1.8} /> 카드형</Link>
              <Link to="/library/notes" className="is-active" aria-current="page"><Icon n="list" s={16} sw={1.8} /> 수첩형</Link>
            </div>
          </div>
        </div>

        {error && <div className="notice notice--danger" role="alert">{error}</div>}
        {loading ? (
          <div className="content-card text-muted">독서 기록을 불러오는 중이에요.</div>
        ) : selectedRecord ? (
          <div className="grid--three-two-columns notes-detail-layout">
            <div className="content-card notes-list-card">
              <div className="content-card-header">
                <h2 className="card-title">수첩형 보기</h2>
                <div className="action-group">
                  <button type="button" className="button is-small" onClick={() => window.print()}><Icon n="printer" s={15} sw={1.8} /> 인쇄</button>
                  <button type="button" className="button is-small" onClick={() => window.print()}><Icon n="download" s={15} sw={1.8} /> PDF</button>
                </div>
              </div>
              <p className="text-small text-muted notes-list-caption">인쇄 미리보기 · 읽은 날짜 최신순</p>
              <div className="reading-record-list">
                {records.map((record) => (
                  <button
                    type="button"
                    key={record.id}
                    className={`reading-record-row${record.id === selectedId ? " is-selected" : ""}`}
                    onClick={() => setSelectedId(record.id)}
                    aria-pressed={record.id === selectedId}
                  >
                    <b className="reading-record-date">{record.date}</b>
                    <span className="reading-record-summary"><strong>{record.title} · {record.pages}</strong></span>
                    <Chip k={record.chipKind}>{record.status}</Chip>
                  </button>
                ))}
              </div>
            </div>

            <aside className="content-card record-detail-card">
              <div className="content-card-header">
                <h2 className="card-title">기록 상세</h2>
                <Chip k={selectedRecord.chipKind}>{selectedRecord.status}</Chip>
              </div>
              <div className="record-book-heading">
                <Cover ch={selectedRecord.initial} />
                <div>
                  <h3 className="card-title">{selectedRecord.title}</h3>
                  <p className="text-small text-muted">{selectedRecord.author} · {selectedRecord.ownership} · 전체 {selectedRecord.totalPages}쪽</p>
                </div>
              </div>
              <p className="text-small text-muted">읽은 쪽 {selectedRecord.pages.replace("쪽", "")} · 읽은 날짜 {selectedRecord.readDate}</p>
              {selectedDetail?.librarianComment && (
                <div className="notice notice--danger reviewer-comment">
                  <Icon n="bell" s={18} />
                  <div><b>사서 코멘트{selectedDetail.reviewedAt ? ` · ${formatDate(selectedDetail.reviewedAt.slice(0, 10))}` : ""}</b><br />{selectedDetail.librarianComment}</div>
                </div>
              )}
              <div className="record-detail-section">
                <b className="text-small">마음에 드는 글귀</b>
                <p className="text-muted">{selectedDetail?.quote || "등록한 글귀가 없어요."}</p>
              </div>
              <div className="record-detail-section">
                <div className="space-between-row">
                  <b className="text-small">서평</b>
                  <b className="review-word-count">{detailLoading ? "—" : reviewWords} / 500자</b>
                </div>
                <div className="progress-bar is-orange"><i style={{ width: `${Math.min(reviewWords / 500 * 100, 100)}%` }} /></div>
                <p className="text-small text-muted">{detailLoading ? "기록을 불러오는 중이에요." : selectedDetail?.review || "아직 쓰지 않았어요."}</p>
              </div>
              {/* 고칠 수 있는 기록에만 버튼을 보이고, 나머지는 이유만 안내합니다. */}
              {selectedEditable ? (
                <div className="action-group record-detail-actions">
                  <Link to={`/records/${selectedRecord.id}/edit`} className="button button--primary">
                    <Icon n="pen" s={15} /> {selectedRecord.statusCode === "REVISION_REQUESTED" ? "고쳐서 다시 제출" : "이어서 작성"}
                  </Link>
                  <button
                    type="button"
                    className="button button--danger-outline"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Icon n="trash" s={15} /> {deleting ? "삭제 중" : "삭제"}
                  </button>
                </div>
              ) : (
                <p className="text-extra-small text-muted">
                  {selectedRecord.statusCode === "APPROVED" ? "승인된" : "심사 중인"} 기록은 수정하거나 삭제할 수 없어요.
                </p>
              )}
            </aside>
          </div>
        ) : (
          <div className="content-card text-muted">표시할 독서 기록이 없어요.</div>
        )}

        <div className="content-card content-card--mint review-status-card">
          <h2 className="card-title">심사 상태</h2>
          <div className="review-status-flow">
            <Chip k="draft">임시저장</Chip><span>→</span><Chip k="wait">심사 대기</Chip><span>→</span>
            <Chip k="ok">승인</Chip><span className="text-muted">또는</span><Chip k="fix">보완요청</Chip>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
