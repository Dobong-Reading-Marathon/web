import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminCurrentRound, getAdminEnrollmentDetail, getAdminParticipants, type AdminCompletionStatus, type AdminEnrollmentDetail, type AdminParticipant, type AdminParticipantPage } from "../api/admin";
import type { CurrentRound } from "../api/currentRound";
import Chip, { type ChipKind } from "../components/Chip";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import AdminLayout from "../components/AdminLayout";
import "./AdminParticipants.css";

const PAGE_SIZE = 8;
const number = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
const statusInfo = (status: AdminCompletionStatus): { label: string; chip: ChipKind } => {
  switch (status) {
    case "IN_PROGRESS": return { label: "진행 중", chip: "line" };
    case "PENDING_APPROVAL": return { label: "완주 승인 대기", chip: "wait" };
    case "COMPLETED": return { label: "완주 승인", chip: "ok" };
  }
};
const logInfo = (status: string): { label: string; chip: ChipKind } => {
  switch (status) {
    case "DRAFT": return { label: "임시저장", chip: "draft" };
    case "SUBMITTED": return { label: "심사 대기", chip: "wait" };
    case "APPROVED": return { label: "승인", chip: "ok" };
    case "REVISION_REQUESTED": return { label: "보완요청", chip: "fix" };
    case "SAVED": return { label: "저장", chip: "ok" };
    default: return { label: "기록 없음", chip: "line" };
  }
};

function maskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

function exportCsv(participants: AdminParticipant[], year: number) {
  const rows = [["이름", "연락처", "코스", "도서 수", "서평 수", "진행률", "완주 상태"], ...participants.map((participant) => [participant.name, participant.phone, participant.course.name, String(participant.books.current), String(participant.reviews.current), `${participant.pages.percent}%`, statusInfo(participant.status).label])];
  const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${year}-reading-marathon-participants.csv`; anchor.click(); URL.revokeObjectURL(url);
}

export default function AdminParticipants() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") as AdminCompletionStatus | null;
  const [round, setRound] = useState<CurrentRound | null>(null);
  const [roundError, setRoundError] = useState("");
  const [pageData, setPageData] = useState<AdminParticipantPage | null>(null);
  const [participantsError, setParticipantsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState<AdminCompletionStatus | "">(initialStatus ?? "");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminEnrollmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [offlineName, setOfflineName] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineCourse, setOfflineCourse] = useState("");
  const [offlineMemberNo, setOfflineMemberNo] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getAdminCurrentRound(controller.signal).then(setRound).catch((cause: unknown) => {
      if (!controller.signal.aborted) setRoundError(cause instanceof Error ? cause.message : "회차 정보를 불러오지 못했습니다.");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!round) return;
    const controller = new AbortController();
    setLoading(true); setParticipantsError(""); setDetail(null);
    getAdminParticipants({ roundId: round.id, page, size: PAGE_SIZE, keyword: query, courseId: courseId ? Number(courseId) : undefined, status, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setPageData(data);
        setSelectedId((current) => data.content.some((item) => item.enrollmentId === current) ? current : data.content[0]?.enrollmentId ?? null);
      })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setParticipantsError(cause instanceof Error ? cause.message : "참가자 목록을 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [round, page, query, courseId, status]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    const controller = new AbortController();
    setDetailLoading(true); setDetailError("");
    getAdminEnrollmentDetail(selectedId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setDetail(data); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setDetailError(cause instanceof Error ? cause.message : "참가자 상세를 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectedId]);

  const selectedParticipant = useMemo(() => pageData?.content.find((item) => item.enrollmentId === selectedId) ?? null, [pageData, selectedId]);
  const pageCount = pageData?.totalPages ?? 0;
  const visiblePages = Array.from({ length: Math.min(3, pageCount) }, (_, index) => Math.max(0, Math.min(page - 1, pageCount - 3)) + index);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPage(0); setQuery(keyword.trim());
  }
  function handleOfflineSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage("오프라인 접수 API 명세가 없어 입력 내용을 실제 저장하지 않았습니다.");
  }
  function handlePasswordReset() {
    setActionMessage("비밀번호 초기화 API 명세가 없어 실제 초기화는 진행하지 않았습니다.");
  }
  function handleCompletion() {
    setActionMessage("완주 승인 API 명세가 없어 실제 승인 및 인증서 발급은 진행하지 않았습니다.");
  }

  return <AdminLayout active="participants"><div className="admin-participants-page">
    <section className="admin-participants-hero"><Tower w={380} /><div><h1>참가자 관리</h1><p>{round ? `${round.year} 회차 참가자 ${number(pageData?.totalElements ?? 0)}명` : "참가자 목록을 불러오고 있어요."}</p><div className="admin-participants-hero-actions"><button type="button" className="admin-participant-button white" disabled={!pageData?.content.length} onClick={() => pageData && round && exportCsv(pageData.content, round.year)}><Icon n="download" s={16} /> 명단 다운로드 (CSV)</button><a href="#offline-register" className="admin-participant-button dark"><Icon n="plus" s={16} /> 오프라인 접수자 등록</a></div></div></section>
    {(roundError || participantsError) && <p className="admin-data-error" role="alert">{roundError || participantsError}</p>}
    <section className="admin-participant-list-panel">
      <div className="admin-participant-filter-row"><form className="admin-participant-search" onSubmit={handleSearch}><input value={keyword} maxLength={50} onChange={(event) => setKeyword(event.target.value)} placeholder="이름 또는 연락처 검색" aria-label="이름 또는 연락처 검색" /><button type="submit" aria-label="검색"><Icon n="search" s={18} /></button></form><label className="admin-select-wrap"><span className="sr-only">코스 필터</span><select value={courseId} onChange={(event) => { setCourseId(event.target.value); setPage(0); }}><option value="">코스 전체</option>{round?.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label><label className="admin-select-wrap"><span className="sr-only">상태 필터</span><select value={status} onChange={(event) => { setStatus(event.target.value as AdminCompletionStatus | ""); setPage(0); }}><option value="">상태 전체</option><option value="IN_PROGRESS">진행 중</option><option value="PENDING_APPROVAL">완주 승인 대기</option><option value="COMPLETED">완주 승인</option></select></label></div>
      <div className="admin-participant-table-wrap"><table className="admin-participant-table"><thead><tr><th>이름</th><th>연락처</th><th>코스</th><th>권수</th><th className="admin-desktop-only">서평</th><th className="admin-desktop-only">진행률</th><th className="admin-desktop-only">완주 상태</th><th className="admin-desktop-only">작업</th></tr></thead><tbody>
        {pageData?.content.map((participant) => { const badge = statusInfo(participant.status); const selected = participant.enrollmentId === selectedId; return <tr key={participant.enrollmentId} className={selected ? "is-selected" : ""} onClick={() => { setSelectedId(participant.enrollmentId); setActionMessage(""); }}><th><button type="button" className="admin-row-select" onClick={() => setSelectedId(participant.enrollmentId)}>{participant.name}</button></th><td data-label="연락처">{maskedPhone(participant.phone)}</td><td data-label="코스">{participant.course.name.replace("(개인)", "")}</td><td data-label="권수">{number(participant.books.current)}</td><td className="admin-desktop-only">{number(participant.reviews.current)}</td><td className="admin-desktop-only"><div className="admin-progress-cell"><span><i style={{ width: `${participant.pages.percent}%` }} /></span><b>{participant.pages.percent}%</b></div></td><td className="admin-desktop-only"><Chip k={badge.chip}>{badge.label}</Chip></td><td className="admin-desktop-only"><button type="button" className="admin-table-action" onClick={(event) => { event.stopPropagation(); setSelectedId(participant.enrollmentId); if (participant.status === "PENDING_APPROVAL") handleCompletion(); }}> {participant.status === "PENDING_APPROVAL" ? "완주 승인" : "기록 보기"}</button></td></tr>; })}
        {!loading && pageData?.content.length === 0 && <tr><td colSpan={8} className="admin-empty-row">조건에 맞는 참가자가 없습니다.</td></tr>}
        {loading && <tr><td colSpan={8} className="admin-empty-row">참가자 목록을 불러오는 중이에요…</td></tr>}
      </tbody></table></div>
      <div className="admin-list-pagination"><span>{pageData ? `${number(pageData.totalElements)}명 중 ${number(pageData.content.length)}명 표시` : "목록을 불러오는 중"}</span><div>{visiblePages.map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === page ? "is-active" : ""} onClick={() => setPage(pageNumber)}>{pageNumber + 1}</button>)}<button type="button" disabled={!pageData || page >= pageCount - 1} onClick={() => setPage((current) => current + 1)}>다음›</button></div></div>
    </section>

    <section className="admin-participant-bottom">
      <article className="admin-participant-card selected-participant-card"><header><h2>{detailLoading ? "참가자 기록 불러오는 중…" : detail ? `${detail.user.name} · 사용자별 기록` : selectedParticipant ? `${selectedParticipant.name} · 사용자별 기록` : "사용자별 기록"}</h2>{detail && <Chip k={statusInfo(detail.status).chip}>{statusInfo(detail.status).label}</Chip>}</header>
        {detailError && <p className="admin-inline-error" role="alert">{detailError}</p>}
        {detail && <><p className="admin-detail-summary">{detail.course.name} · 도서 {number(detail.progress.books.current)}권 · 서평 {number(detail.progress.reviews.current)}편</p><div className="admin-detail-books">{detail.books.slice(0, 3).map((book) => { const log = book.logs.at(-1); const badge = log ? logInfo(log.status) : { label: "기록 없음", chip: "line" as const }; const pages = book.logs.length ? `${Math.min(...book.logs.map((entry) => entry.startPage))}–${Math.max(...book.logs.map((entry) => entry.endPage))}쪽` : "읽은 기록 없음"; return <div className="admin-detail-book" key={book.enrollmentBookId}><div><b>[{book.title}]</b><span>{pages} · {book.libraryOwned ? "소장도서" : "소장 아님"}</span></div><Chip k={badge.chip}>{badge.label}</Chip></div>; })}{detail.books.length === 0 && <p className="admin-empty-row">등록된 도서가 없습니다.</p>}</div>{detail.books.length > 3 && <p className="admin-more-books">… {number(detail.books.length - 3)}권 더 · 기록 전체는 접수함에서 볼 수 있어요</p>}<button type="button" className="admin-participant-button dark full" onClick={handleCompletion}>완주 승인 · 인증서 번호 부여</button></>}
        {!detail && !detailLoading && !detailError && <p className="admin-empty-row">참가자를 선택하면 기록이 표시됩니다.</p>}
      </article>
      <article className="admin-participant-card reset-password-card"><h2>비밀번호 초기화</h2><p>비밀번호를 잊은 참가자를 위해 임시 비밀번호로 초기화해요.</p><button type="button" className="admin-participant-button outline full" onClick={handlePasswordReset}>임시 비밀번호로 초기화</button><div className="admin-password-notice"><Icon n="lock" s={17} /><span>임시 비밀번호 <b>[임시 비밀번호]</b><small>참가자에게 직접 전해 주세요. 로그인 후 바로 바꾸도록 안내해요.</small></span></div></article>
      <article className="admin-participant-card offline-register-card" id="offline-register"><h2>오프라인 접수자 등록</h2><p>방문 신청자를 대신 등록해요. 회원 생성과 회차 참가 신청이 한 번에 돼요.</p><form onSubmit={handleOfflineSubmit}><label>이름 <small>필수</small><input required value={offlineName} onChange={(event) => setOfflineName(event.target.value)} /></label><label>전화번호 <small>필수</small><input required type="tel" placeholder="010-0000-0000" value={offlinePhone} onChange={(event) => setOfflinePhone(event.target.value)} /></label><label>코스 <small>필수</small><select required value={offlineCourse} onChange={(event) => setOfflineCourse(event.target.value)}><option value="">코스 선택</option>{round?.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select></label><label>대출회원번호 <small>선택</small><input value={offlineMemberNo} onChange={(event) => setOfflineMemberNo(event.target.value)} /></label><button type="submit" className="admin-participant-button dark full">등록하고 참가 신청</button></form></article>
    </section>
    {actionMessage && <div className="admin-action-toast" role="status"><span>{actionMessage}</span><button type="button" onClick={() => setActionMessage("")} aria-label="닫기"><Icon n="x" s={16} /></button></div>}
  </div></AdminLayout>;
}
