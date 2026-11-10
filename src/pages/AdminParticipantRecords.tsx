import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminEnrollmentDetail, type AdminEnrollmentDetail, type AdminLogStatus } from "../api/admin";
import type { ChipKind } from "../components/Chip";
import Chip from "../components/Chip";
import Tower from "../components/Tower";
import AdminLayout from "../components/AdminLayout";
import "./AdminParticipantRecords.css";

const number = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
const logStatus: Record<AdminLogStatus, { label: string; chip: ChipKind }> = {
  DRAFT: { label: "임시저장", chip: "draft" },
  SAVED: { label: "저장", chip: "ok" },
  SUBMITTED: { label: "심사 대기", chip: "wait" },
  APPROVED: { label: "승인", chip: "ok" },
  REVISION_REQUESTED: { label: "보완요청", chip: "fix" },
};

function localDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));
}

export default function AdminParticipantRecords() {
  const { enrollmentId: rawId } = useParams();
  const enrollmentId = Number(rawId);
  const [detail, setDetail] = useState<AdminEnrollmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(enrollmentId) || enrollmentId < 1) {
      setError("참가자 정보를 확인할 수 없습니다.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    getAdminEnrollmentDetail(enrollmentId, controller.signal)
      .then((response) => { if (!controller.signal.aborted) setDetail(response); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "참가자의 기록을 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [enrollmentId]);

  const totalLogs = detail?.books.reduce((total, book) => total + book.logs.length, 0) ?? 0;

  return <AdminLayout active="participants"><div className="admin-participant-records-page">
    <section className="admin-participant-records-hero"><Tower w={330} /><div><Link to="/admin/participants" className="admin-records-back">← 참가자 관리</Link><h1>참가자 기록</h1><p>{detail ? `${detail.user.name} · ${detail.round.year} 회차 · ${detail.course.name}` : "선택한 참가자의 도서와 독서기록을 확인해요."}</p></div></section>
    {error && <p className="admin-data-error" role="alert">{error}</p>}
    {loading ? <p className="admin-records-state" role="status">참가자 기록을 불러오는 중이에요…</p> : detail && <>
      <section className="admin-records-summary"><div><span>등록 도서</span><b>{number(detail.books.length)}권</b></div><div><span>전체 독서기록</span><b>{number(totalLogs)}건</b></div><div><span>누적 서평</span><b>{number(detail.progress.reviews.current)}편</b></div><div><span>누적 쪽수</span><b>{number(detail.progress.pages.current)}쪽</b></div></section>
      <section className="admin-records-books" aria-label="등록 도서별 독서기록">
        {detail.books.map((book) => <article className="admin-records-book" key={book.enrollmentBookId}>
          <header className="admin-records-book-header"><div><h2>{book.title}</h2><p>{book.author} · {number(book.totalPages)}쪽 · {book.libraryOwned ? "도서관 소장도서" : "소장도서 아님"}</p></div><Chip k={book.completed ? "ok" : "line"}>{book.completed ? "완독" : "독서 중"}</Chip></header>
          <div className="admin-records-book-stats"><span>읽은 쪽 {number(book.readPages)}쪽</span><span>기록 {number(book.logs.length)}건</span>{book.reviewCounted && <Chip k="ok">서평 집계 반영</Chip>}</div>
          {book.logs.length === 0 ? <p className="admin-records-empty">이 도서의 독서기록이 없습니다.</p> : <div className="admin-records-log-list">{book.logs.map((log) => { const badge = logStatus[log.status] ?? { label: log.status, chip: "line" as ChipKind }; return <section className="admin-records-log" key={log.readingLogId}>
            <header><div><b>{localDate(log.readDate)}</b><span>{number(log.startPage)}–{number(log.endPage)}쪽 · {number(log.endPage - log.startPage + 1)}쪽 읽음</span></div><Chip k={badge.chip}>{badge.label}</Chip></header>
            <div className="admin-records-log-meta"><span>제출 {dateTime(log.submittedAt)}</span>{log.reviewedAt && <span>심사 {dateTime(log.reviewedAt)}</span>}<span>{log.counted ? "완주 집계 반영" : "완주 집계 미반영"}</span></div>
            <div className="admin-records-log-body">{log.quote?.trim() && <><h3>마음에 드는 글귀</h3><p>{log.quote}</p></>}<div className="admin-records-review-heading"><h3>서평</h3><b>{number(log.reviewLength)}자</b></div><p className="admin-records-review">{log.review?.trim() || "등록된 서평이 없습니다."}</p></div>
            {log.librarianComment && <p className="admin-records-comment"><b>사서 코멘트</b>{log.librarianComment}</p>}
          </section>; })}</div>}
        </article>)}
        {detail.books.length === 0 && <article className="admin-records-empty-books">내 서재에 등록한 도서가 없습니다.</article>}
      </section>
    </>}
  </div></AdminLayout>;
}
