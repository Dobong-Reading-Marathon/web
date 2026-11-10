import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../api/users";
import { getBooks, type LibraryBook } from "../api/books";
import { getCurrentEnrollment } from "../api/enrollments";
import { formatCourseName } from "../api/currentRound";
import { getEnrollmentProgress, getReadingCalendar, type EnrollmentProgress, type ReadingCalendar } from "../api/calendar";
import { apiFetch } from "../api/client";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import type { IconName } from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import useScrollReveal from "../hooks/useScrollReveal";
import "./home.css";

type RecentLog = { id: number; readingLogId?: number; bookTitle: string; author?: string; startPage?: number; endPage?: number; readDate?: string; status: string };
type Notice = { id: number; title: string; message?: string; description?: string; createdAt?: string; status?: string; read?: boolean; isRead?: boolean };
const number = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
const dateLabel = (value?: string) => value ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : "날짜 정보 없음";
const statusInfo = (status: string) => ({
  DRAFT: { label: "임시저장", chip: "draft" as const }, SUBMITTED: { label: "심사 대기", chip: "wait" as const },
  APPROVED: { label: "승인", chip: "ok" as const }, REVISION_REQUESTED: { label: "보완요청", chip: "fix" as const },
  SAVED: { label: "저장", chip: "ok" as const },
}[status] ?? { label: status || "기록", chip: "line" as const });
const unwrapList = <T,>(body: unknown, keys: string[]): T[] => {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of keys) if (Array.isArray(record[key])) return record[key] as T[];
  }
  return [];
};

export default function Home() {
  const [name, setName] = useState("독서인");
  const [progress, setProgress] = useState<EnrollmentProgress | null>(null);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [calendar, setCalendar] = useState<ReadingCalendar | null>(null);
  const [loadError, setLoadError] = useState("");
  const carousel = useRef<HTMLDivElement>(null);
  const revealRoot = useScrollReveal<HTMLElement>();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void (async () => {
      try {
        const [user, enrollment, userBooks] = await Promise.all([
          getCurrentUser(signal).catch(() => null), getCurrentEnrollment(signal).catch(() => null), getBooks({ signal }).catch(() => []),
        ]);
        if (signal.aborted) return;
        if (user?.name) setName(user.name);
        setBooks(userBooks);
        if (!enrollment) return;
        const progressTask = getEnrollmentProgress(enrollment.id, signal).catch(() => null);
        const calendarTask = getReadingCalendar(year, month, signal).catch(() => null);
        const recentTask = apiFetch(`/api/enrollments/${enrollment.id}/recent-logs`, { signal }).then(async (r) => r.ok ? unwrapList<RecentLog>(await r.json(), ["logs", "items", "content"]) : [] as RecentLog[]).catch(() => [] as RecentLog[]);
        const noticesTask = apiFetch("/api/notifications", { signal }).then(async (r) => r.ok ? unwrapList<Notice>(await r.json(), ["notifications", "items", "content"]) : [] as Notice[]).catch(() => [] as Notice[]);
        const [progressData, calendarData, recentData, noticeData] = await Promise.all([progressTask, calendarTask, recentTask, noticesTask]);
        if (signal.aborted) return;
        setProgress(progressData);
        setCalendar(calendarData);
        setLogs(recentData);
        setNotices(noticeData);
      } catch (error) {
        if (!signal.aborted) setLoadError(error instanceof Error ? error.message : "홈 정보를 불러오지 못했습니다.");
      }
    })();
    return () => controller.abort();
  }, [year, month]);

  const calendarDays = useMemo(() => {
    const count = new Date(year, month, 0).getDate();
    const offset = new Date(year, month - 1, 1).getDay();
    const recorded = new Set((calendar?.days ?? []).filter((day) => day.logs.length > 0).map((day) => day.date.slice(0, 10)));
    return [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)].map((day, index) => {
      const key = day ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
      return <div key={day ?? `blank-${index}`} className={`home-calendar-day${day && recorded.has(key) ? " has-read" : ""}${day === today.getDate() ? " is-today" : ""}`}>{day}</div>;
    });
  }, [calendar, year, month, today]);

  const targetKm = progress?.pages.target ? progress.pages.target / 1000 : 0;
  const kmPercent = targetKm ? Math.min(100, (progress?.readKm ?? 0) / targetKm * 100) : 0;
  const unread = notices.filter((notice) => !(notice.read ?? notice.isRead ?? true)).length;
  const bookStatus = (status: LibraryBook["status"]) => statusInfo(status === "NO_RECORD" ? "DRAFT" : status);

  return <UserLayout active="home"><main className="home-page" ref={revealRoot}>
    {loadError && <p className="home-error" role="alert">{loadError}</p>}
    <section className="home-hero" data-scroll-reveal><Tower w={440} /><div className="home-hero-copy">
      <span className="home-tag">{progress?.course ? formatCourseName(progress.course) : "독서마라톤"}{progress?.course?.distanceKm != null ? ` · ${progress.course.distanceKm}km` : ""}</span>
      <h1>{name}님,<br />오늘도 한 쪽부터</h1>
      <p>{progress ? `결승까지 ${Math.max(0, targetKm - progress.readKm).toFixed(2)}km 남았어요. 승인된 기록만 거리에 반영돼요.` : "오늘 읽은 한 쪽이 완주의 기록이 돼요."}</p>
      <div className="home-actions"><Link to="/records/new" className="home-button light">독서기록 쓰기</Link><Link to="/register" className="home-button outline">도서 등록</Link></div>
    </div></section>

    <section className="home-overview" data-scroll-reveal><div className="home-section-intro"><h2>내 기록<br />한눈에</h2><p>{progress ? `${progress.course.name} 완주까지, 세 가지 기준을 모두 채우면 자동으로 완주 승인 대기가 돼요.` : "참가 신청 후 독서 기록 현황을 확인할 수 있어요."}</p>{progress && <><div className="home-progress-track"><i style={{ width: `${kmPercent}%` }} /><b style={{ left: `${kmPercent}%` }} /></div><div className="home-track-label"><span>0km</span><span>{Math.max(0, targetKm - progress.readKm).toFixed(2)}km 결승</span></div><Link to="/course-change" className="home-text-link">코스 변경</Link></>}</div>
      <div className="home-metrics"><div><b>{progress ? progress.readKm.toFixed(2) : "—"}<small>km</small></b><span>달린 거리 · 1,000쪽 = 1km</span></div><div><b>{progress ? number(progress.pages.current) : "—"}</b><span>쪽수 · 목표 {progress ? `${number(progress.pages.target)}쪽 (${progress.pages.percent}%)` : "불러오는 중"}</span></div><div><b>{progress ? number(progress.completedBooks) : "—"}<small>권</small></b><span>완독 권수 · 내 서재 기준</span></div><div><b>{progress ? number(progress.reviews.current) : "—"}<small>편</small></b><span>서평 · 목표 {progress ? `${number(progress.reviews.target)}편 (${progress.reviews.percent}%)` : "불러오는 중"}</span></div></div>
    </section>

    <section className="home-library" data-scroll-reveal><div className="home-section-intro"><h2>내 서재</h2><p>등록한 도서와 독서기록을 상태별로 모아 볼 수 있어요.</p><Link to="/library" className="home-button dark">내서재 전체 보기</Link></div><div className="home-carousel-wrap"><div className="home-book-carousel" ref={carousel}>{books.map((book, index) => { const status = bookStatus(book.status); const colors = [["#e8ddf0", "#4a2b6b"], ["#dcebe0", "#2f7d5f"], ["#e3ecdd", "#2f5a2a"]][index % 3]; return <Link to="/library" className="home-book" key={book.enrollmentBookId}><div className="home-book-cover" style={{ background: colors[0], color: colors[1] }}><Chip k={status.chip}>{status.label}</Chip><strong>{book.title.slice(0, 1)}</strong></div><b>{book.title}</b><span>{book.author} · {status.label}</span></Link>; })}{books.length === 0 && <p className="home-empty">등록한 도서가 없어요.</p>}</div><div className="home-carousel-controls"><button type="button" aria-label="이전 도서" onClick={() => carousel.current?.scrollBy({ left: -220, behavior: "smooth" })}><Icon n="chl" s={18} sw={1.8} /></button><button type="button" aria-label="다음 도서" onClick={() => carousel.current?.scrollBy({ left: 220, behavior: "smooth" })}><Icon n="chr" s={18} sw={1.8} /></button></div></div></section>

    <section className="home-steps" data-scroll-reveal><div className="home-step-art"><Tower w={460} /><Link to="/rules" className="home-step-badge">대회 요강<br />보기</Link></div><div className="home-step-copy"><div><h2>이렇게<br />참여해요</h2><p>책을 읽고, 기록하고, 제출하는 과정을 한 곳에서 끝내요.</p></div><ul>{[
      ["camera", "도서 등록", "바코드 촬영이나 제목 검색으로 책 정보를 자동으로 채워요.", "/register"], ["pen", "독서기록 작성", "읽은 쪽과 글귀, 500자 이상 서평을 남겨요.", "/records/new"], ["send", "임시저장 · 일괄 제출", "내 서재에서 기록을 모아 관리자에게 제출해요.", "/library"], ["bell", "심사 결과 확인", "승인 · 보완요청 결과를 알림으로 받아요.", "/notifications"], ["award", "완주 인증서 · 상장", "기준을 채우면 관리자 승인 뒤 인증서를 받아요.", "/certificate"],
    ].map(([icon, title, description, href]) => <li key={title}><span className="home-step-icon"><Icon n={icon as IconName} s={22} sw={1.8} /></span><div><b>{title}</b><p>{description}</p></div><Link to={href} aria-label={`${title} 페이지로 이동`}><Icon n="arrow" s={18} sw={1.8} /></Link></li>)}</ul></div></section>

    <section className="home-feed" data-scroll-reveal><div className="home-feed-card"><header><h2>최근 기록</h2><Link to="/library" className="home-text-link">모두 보기 →</Link></header><ul>{logs.slice(0, 4).map((log) => { const status = statusInfo(log.status); return <li key={log.readingLogId ?? log.id}><Cover ch={log.bookTitle?.slice(0, 1) ?? "책"} /><div><b>{log.bookTitle}</b><span>{log.author ? `${log.author} · ` : ""}{log.startPage != null ? `${number(log.startPage)}–${number(log.endPage ?? log.startPage)}쪽 · ` : ""}{dateLabel(log.readDate)}</span></div><Chip k={status.chip}>{status.label}</Chip><Link to="/library" className="home-text-link">보기</Link></li>; })}{logs.length === 0 && <li className="home-empty">최근 독서 기록이 없어요.</li>}</ul></div><aside className="home-feed-card notices"><header><h2>알림</h2><Chip k="fix">새 알림 {unread}</Chip></header><ul>{notices.slice(0, 3).map((notice) => <li key={notice.id}><div><b>{notice.title}</b><span>{notice.message ?? notice.description ?? dateLabel(notice.createdAt)}</span></div>{notice.status && <Chip k={statusInfo(notice.status).chip}>{statusInfo(notice.status).label}</Chip>}</li>)}{notices.length === 0 && <li className="home-empty">새 알림이 없어요.</li>}</ul><Link to="/notifications" className="home-button dark full">알림 모두 보기</Link></aside></section>

    <section className="home-calendar" data-scroll-reveal><div className="home-calendar-summary"><h2>{month}월,<br />읽은 날을 모았어요</h2><p>{calendar ? `${number(calendar.summary.pages)}쪽 · ${number(calendar.summary.books)}권 · 이달의 독서 기록이에요.` : "이번 달 독서 기록을 달력에서 확인해요."}</p><div><span>이번 달 독서 일수</span><b>{calendar ? `${calendar.summary.readDays}일` : "불러오는 중"}</b></div><div><span>이달의 쪽수</span><b>{calendar ? `${number(calendar.summary.pages)}쪽` : "—"}</b></div><div className="home-actions"><Link to="/calendar" className="home-button light">독서달력 보기</Link><Link to="/rules" className="home-button outline">대회 요강</Link></div></div><div className="home-calendar-grid">{["일", "월", "화", "수", "목", "금", "토"].map((day) => <b className="home-calendar-weekday" key={day}>{day}</b>)}{calendarDays}</div></section>
  </main></UserLayout>;
}
