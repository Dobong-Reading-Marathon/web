import { useEffect, useMemo, useState, type FormEvent } from "react";
import { approveSubmission, cancelSubmissionApproval, getAdminSubmissions, requestSubmissionRevision, type AdminSubmission, type SubmissionStatus } from "../api/adminSubmissions";
import { getAdminCurrentRound, getAdminEnrollmentDetail, getAdminParticipants, type AdminEnrollmentBook, type AdminReadingLog } from "../api/admin";
import Chip from "../components/Chip";
import AdminLayout from "../components/AdminLayout";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import "./AdminReviews.css";

type ReviewFilter = SubmissionStatus | "FEATURED";
const demoAiScores = [18, 18, 48, 82, 35, 24];
const statusLabel: Record<SubmissionStatus, string> = { SUBMITTED: "대기", APPROVED: "승인", REVISION_REQUESTED: "보완요청" };
const statusChip: Record<SubmissionStatus, "wait" | "ok" | "fix"> = { SUBMITTED: "wait", APPROVED: "ok", REVISION_REQUESTED: "fix" };

function formatSubmitted(value: string | null) {
  if (!value) return "제출 시간 없음";
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date(value));
}

// Count the actual review text. Array.from counts a Unicode code point as one
// character, matching the server's PostgreSQL char_length behavior.
function countReviewCharacters(review: string | null | undefined) {
  return review ? Array.from(review).length : 0;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

export default function AdminReviews() {
  const [filter, setFilter] = useState<ReviewFilter>("SUBMITTED");
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminSubmission[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewLengths, setReviewLengths] = useState<Record<number, number>>({});
  const [reviewLookupDone, setReviewLookupDone] = useState<Set<number>>(() => new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewRecord, setReviewRecord] = useState<{ book: AdminEnrollmentBook; log: AdminReadingLog } | null>(null);
  const [featuredIds, setFeaturedIds] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setVisibleCount(6);
    getAdminSubmissions({ keyword: query, signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        setItems(response.items);
        const directLengths: Record<number, number> = {};
        for (const item of response.items) {
          if (typeof item.reviewLength === "number") directLengths[item.id] = item.reviewLength;
          else if (typeof item.review === "string") directLengths[item.id] = countReviewCharacters(item.review);
        }
        setReviewLengths((current) => ({ ...current, ...directLengths }));
        setPendingCount(response.pendingCount);
        setSelectedId((current) => response.items.some((item) => item.id === current) ? current : response.items[0]?.id ?? null);
        const approved = response.items.filter((item) => item.status === "APPROVED");
        setFeaturedIds(new Set(approved.slice(0, 1).map((item) => item.id)));
      })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "심사 접수함을 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, refreshKey]);

  const list = useMemo(() => {
    if (filter === "FEATURED") return items.filter((item) => featuredIds.has(item.id));
    if (filter === "APPROVED" || filter === "REVISION_REQUESTED") return items.filter((item) => item.status === filter);
    return items.filter((item) => item.status === "SUBMITTED");
  }, [filter, items, featuredIds]);
  const statusCounts = useMemo(() => ({
    submitted: items.filter((item) => item.status === "SUBMITTED").length,
    approved: items.filter((item) => item.status === "APPROVED").length,
    revision: items.filter((item) => item.status === "REVISION_REQUESTED").length,
  }), [items]);

  useEffect(() => {
    const visibleItems = list.slice(0, visibleCount);
    if (visibleItems.length === 0) return;
    const neededNames = new Set(visibleItems.map((item) => item.participantName));
    const neededLogIds = new Set(visibleItems.map((item) => item.id));
    setReviewLookupDone((current) => { const next = new Set(current); for (const id of neededLogIds) next.delete(id); return next; });
    const controller = new AbortController();
    void (async () => {
      try {
        const round = await getAdminCurrentRound(controller.signal);
        const firstPage = await getAdminParticipants({ roundId: round.id, page: 0, size: 100, signal: controller.signal });
        const otherPages = firstPage.totalPages > 1
          ? await Promise.all(Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getAdminParticipants({ roundId: round.id, page: index + 1, size: 100, signal: controller.signal })))
          : [];
        const participants = [...firstPage.content, ...otherPages.flatMap((page) => page.content)].filter((participant) => neededNames.has(participant.name));
        const details = await mapWithConcurrency(participants, 6, (participant) => getAdminEnrollmentDetail(participant.enrollmentId, controller.signal).catch(() => null));
        if (controller.signal.aborted) return;
        const lengths: Record<number, number> = {};
        for (const enrollment of details) {
          for (const book of enrollment?.books ?? []) {
            for (const log of book.logs) {
              if (neededLogIds.has(log.readingLogId)) lengths[log.readingLogId] = countReviewCharacters(log.review);
            }
          }
        }
        if (Object.keys(lengths).length) setReviewLengths((current) => ({ ...current, ...lengths }));
      } catch { /* Unmatched items remain explicitly unavailable. */ }
      finally { if (!controller.signal.aborted) setReviewLookupDone((current) => new Set([...current, ...neededLogIds])); }
    })();
    return () => controller.abort();
  }, [list, visibleCount]);
  const selected = list.find((item) => item.id === selectedId) ?? list[0] ?? null;
  const selectedIndex = selected ? Math.max(0, items.findIndex((item) => item.id === selected.id)) : 0;
  const aiScore = demoAiScores[selectedIndex % demoAiScores.length];

  useEffect(() => {
    if (!selectedId) { setReviewRecord(null); return; }
    const submission = items.find((item) => item.id === selectedId);
    if (!submission) return;
    const controller = new AbortController();
    setReviewRecord(null);
    void (async () => {
      try {
        const round = await getAdminCurrentRound(controller.signal);
        const matches = await getAdminParticipants({ roundId: round.id, keyword: submission.participantName, size: 100, signal: controller.signal });
        const candidates = matches.content.filter((participant) => participant.name === submission.participantName);
        const details = await Promise.all(candidates.map((participant) => getAdminEnrollmentDetail(participant.enrollmentId, controller.signal).catch(() => null)));
        for (const enrollment of details) {
          const book = enrollment?.books.find((entry) => entry.logs.some((log) => log.readingLogId === submission.id));
          const log = book?.logs.find((entry) => entry.readingLogId === submission.id);
          if (book && log && !controller.signal.aborted) { setReviewRecord({ book, log }); return; }
        }
      } catch { /* Use labeled sample details if the inbox item cannot be matched to the current round. */ }
    })();
    return () => controller.abort();
  }, [selectedId, items]);

  const displayReviewLength = selected && typeof selected.reviewLength === "number" ? selected.reviewLength
    : selected?.review != null ? countReviewCharacters(selected.review)
    : reviewRecord
    ? countReviewCharacters(reviewRecord.log.review)
    : selected ? reviewLengths[selected.id] : undefined;
  const displayReview = selected?.review ?? reviewRecord?.log.review ?? null;

  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setQuery(keyword.trim()); }
  async function runAction(action: "approve" | "revision" | "cancel") {
    if (!selected) return;
    if (action === "revision" && !comment.trim()) { setError("보완요청 사유를 입력해 주세요."); return; }
    setBusy(true); setError("");
    try {
      if (action === "approve") await approveSubmission(selected.id);
      else if (action === "revision") await requestSubmissionRevision(selected.id, comment.trim());
      else await cancelSubmissionApproval(selected.id);
      setComment(""); setRefreshKey((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "심사 결과를 저장하지 못했습니다."); }
    finally { setBusy(false); }
  }

  return <AdminLayout active="reviews"><div className="admin-reviews-page">
    <section className="admin-reviews-hero"><Tower w={390} /><div><h1>기록 심사</h1><p>제출된 기록을 보고 승인하거나 보완을 요청해요.</p></div></section>
    {error && <p className="admin-review-error" role="alert">{error}</p>}
    <section className="admin-review-workspace">
      <article className="admin-review-inbox">
        <header><h2>접수함</h2><Chip k="wait">심사 대기 {pendingCount}건</Chip></header>
        <form className="admin-review-search" onSubmit={submitSearch}><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="이름 · 도서 검색" aria-label="이름 또는 도서 검색" /><button type="submit" aria-label="검색"><Icon n="search" s={17} /></button></form>
        <div className="admin-review-filters">{([
          ["SUBMITTED", `심사 대기 ${statusCounts.submitted}`], ["APPROVED", `승인 ${statusCounts.approved}`], ["REVISION_REQUESTED", `보완요청 ${statusCounts.revision}`], ["FEATURED", "우수작"],
        ] as const).map(([value, label]) => <button type="button" key={value} className={filter === value ? "is-active" : ""} onClick={() => { setFilter(value); setSelectedId(null); }}>{label}</button>)}</div>
        <div className="admin-review-list">{loading && <p className="admin-review-empty">접수함을 불러오는 중이에요…</p>}{!loading && list.slice(0, visibleCount).map((item) => { const originalIndex = Math.max(0, items.findIndex((entry) => entry.id === item.id)); const score = demoAiScores[originalIndex % demoAiScores.length]; const ai = score < 30 ? "AI 낮음" : score >= 70 ? "AI 높음" : "AI 보통"; const directLength = typeof item.reviewLength === "number" ? item.reviewLength : typeof item.review === "string" ? countReviewCharacters(item.review) : undefined; const length = directLength ?? reviewLengths[item.id]; const featured = featuredIds.has(item.id); return <button type="button" key={item.id} className={`admin-review-item${item.id === selected?.id ? " is-selected" : ""}`} onClick={() => setSelectedId(item.id)}><span className="admin-review-item-main"><b>{item.participantName} · {item.bookTitle}</b><small>{formatSubmitted(item.submittedAt)} · 서평 {length === undefined ? reviewLookupDone.has(item.id) ? "확인 불가" : "불러오는 중" : `${numberText(length)}자`}</small></span><span className="admin-review-item-badges">{featured && <Chip k="star">우수작 예시</Chip>}{item.status === "SUBMITTED" && <Chip k={score < 30 ? "ok" : score >= 70 ? "fix" : "wait"}>{ai}</Chip>}<Chip k={statusChip[item.status]}>{statusLabel[item.status]}</Chip></span></button>; })}{!loading && list.length === 0 && <p className="admin-review-empty">표시할 기록이 없습니다.</p>}</div>
        <footer><span>{numberText(list.length)}건 중 {numberText(Math.min(visibleCount, list.length))}건 표시{filter === "FEATURED" && " · 우수작은 시안용 예시"}</span>{list.length > visibleCount && <button type="button" className="admin-review-more" onClick={() => setVisibleCount((count) => count + 6)}>더 보기</button>}</footer>
      </article>
      <article className="admin-review-detail">
        {!selected ? <p className="admin-review-empty">기록을 선택하면 상세 내용을 볼 수 있어요.</p> : <>
          <header><h2>{selected.bookTitle}</h2><Chip k={statusChip[selected.status]}>{statusLabel[selected.status]}</Chip></header>
          <p className="admin-review-meta">{selected.participantName} · {reviewRecord?.book.author ?? "저자 정보"} · 읽은 쪽 {numberText(reviewRecord?.log.startPage ?? selected.startPage)}–{numberText(reviewRecord?.log.endPage ?? selected.endPage)} · 읽은 날짜 {reviewRecord?.log.readDate ?? selected.readDate} · 제출 {formatSubmitted(selected.submittedAt)}</p>
          <div className="admin-review-section"><h3>마음에 드는 글귀</h3><p>{reviewRecord?.log.quote || "[등록된 글귀가 없습니다.]"}</p></div>
          <div className="admin-review-section"><div className="admin-review-section-heading"><h3>서평</h3><b>{displayReviewLength === undefined ? reviewLookupDone.has(selected.id) ? "글자 수 확인 불가" : "글자 수 확인 중" : `${numberText(displayReviewLength)}자 · 500자 ${displayReviewLength >= 500 ? "충족" : "미달"}`}</b></div><p className="admin-review-body">{displayReview ?? (reviewLookupDone.has(selected.id) ? "서평 본문을 불러오지 못했습니다." : "서평 본문을 불러오는 중이에요…")}</p></div>
          <section className="admin-ai-review"><header><b>서평 AI 검사</b><Chip k="info">AI 작성 가능성 낮음 · {aiScore}% · 예시</Chip></header><div className="admin-ai-track"><i style={{ width: `${aiScore}%` }} /></div><p>AI 판정 API가 없어 화면 예시 점수를 표시합니다. 승인과 보완요청은 사서가 직접 결정해요.</p></section>
          <label className="admin-revision-label">사서 코멘트 <small>보완요청 때는 사유를 적어 주세요</small><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} /></label>
          <div className="admin-review-actions">{selected.status === "SUBMITTED" ? <><button type="button" className="admin-review-action approve" disabled={busy} onClick={() => void runAction("approve")}>승인</button><button type="button" className="admin-review-action revision" disabled={busy} onClick={() => void runAction("revision")}>보완요청 (반려)</button></> : selected.status === "APPROVED" ? <button type="button" className="admin-review-action revision" disabled={busy} onClick={() => void runAction("cancel")}>승인 취소 (대기로 되돌리기)</button> : <p>보완요청 상태는 기록 목록에서 확인할 수 있어요.</p>}</div>
          <p className="admin-review-footnote">승인하면 참가자의 누적 쪽수·권수·서평에 반영되고 알림이 가요. 승인한 기록도 ‘승인 취소’로 대기 상태로 되돌릴 수 있어요.</p>
        </>}
      </article>
    </section>
  </div></AdminLayout>;
}

function numberText(value: number) { return new Intl.NumberFormat("ko-KR").format(value); }
