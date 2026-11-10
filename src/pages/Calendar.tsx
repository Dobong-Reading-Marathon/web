import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import { getCurrentEnrollment } from "../api/enrollments";
import {
  getEnrollmentProgress,
  getReadingCalendar,
  type CalendarDay,
  type CalendarLog,
  type EnrollmentProgress,
  type ReadingCalendar,
} from "../api/calendar";

function statusPresentation(status: string) {
  switch (status) {
    case "APPROVED": return { label: "승인", chip: "ok" as const, indicator: "approved" };
    case "SAVED": return { label: "저장", chip: "ok" as const, indicator: "approved" };
    case "SUBMITTED": return { label: "심사 대기", chip: "wait" as const, indicator: "pending" };
    case "REVISION_REQUESTED": return { label: "보완요청", chip: "fix" as const, indicator: "fix-requested" };
    default: return { label: "임시저장", chip: "draft" as const, indicator: "draft" };
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function Calendar() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendar, setCalendar] = useState<ReadingCalendar | null>(null);
  const [progress, setProgress] = useState<EnrollmentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEnrollment, setNoEnrollment] = useState(false);
  const year = month.getFullYear();
  const monthNumber = month.getMonth() + 1;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNoEnrollment(false);
    setCalendar(null);
    setProgress(null);

    async function loadMonth() {
      try {
        const enrollment = await getCurrentEnrollment(controller.signal);
        if (!enrollment) {
          if (!controller.signal.aborted) {
            setNoEnrollment(true);
            setLoading(false);
          }
          return;
        }
        const [monthData, progressData] = await Promise.all([
          getReadingCalendar(year, monthNumber, controller.signal),
          getEnrollmentProgress(enrollment.id, controller.signal).catch(() => null),
        ]);
        if (!controller.signal.aborted) {
          setCalendar(monthData);
          setProgress(progressData);
          setLoading(false);
        }
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "독서달력을 불러오지 못했습니다.");
        setLoading(false);
      }
    }

    void loadMonth();
    return () => controller.abort();
  }, [year, monthNumber]);

  const dayByDate = useMemo(() => new Map((calendar?.days ?? []).map((day) => [day.date, day])), [calendar]);
  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const selectedDay = dayByDate.get(selectedKey);
  const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(year, month.getMonth(), 1).getDay();
  const calendarDays: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const today = new Date();
  const monthLabel = `${year}년 ${monthNumber}월`;
  const selectedLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 ${"일월화수목금토"[selectedDate.getDay()]}요일`;
  const moveMonth = (amount: number) => {
    const nextMonth = new Date(year, month.getMonth() + amount, 1);
    setMonth(nextMonth);
    setSelectedDate(nextMonth);
  };
  const goToToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const renderLog = (log: CalendarLog) => {
    const status = statusPresentation(log.status);
    return (
      <article key={log.readingLogId} className="reading-calendar-log">
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <Cover ch={log.bookTitle.slice(0, 1)} />
          <div>
            <h3 className="card-title">{log.bookTitle}</h3>
            <p className="text-small text-muted">읽은 쪽 {formatNumber(log.startPage)}–{formatNumber(log.endPage)}</p>
          </div>
          <Chip k={status.chip}>{status.label}</Chip>
        </div>
        {!log.counted && <p className="text-extra-small text-muted">대회 누적 쪽수에 포함되지 않은 기록이에요.</p>}
      </article>
    );
  };

  return (
    <UserLayout active="cal">
      <section className="content-section is-top">
        <div className="page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">독서달력</h1>
              <p className="page-description">날짜를 누르면 그날의 기록을 볼 수 있어요.</p>
            </div>
          </div>
        </div>
        {error && <div className="content-card" role="alert">{error}</div>}
        {noEnrollment && <div className="content-card" role="status">현재 참가 중인 독서마라톤 정보가 없어요.</div>}
        {!noEnrollment && <>
          <div className="grid--three-columns calendar-summary-grid">
            <div className="content-card content-card--mint content-card--compact"><div className="metric"><span>이달의 독서 일수</span><b className="numeric-value">{loading ? "—" : `${calendar?.summary.readDays ?? 0}일`}</b><span>{monthLabel} 기준</span></div></div>
            <div className="content-card content-card--mint content-card--compact"><div className="metric"><span>이달에 읽은 책</span><b className="numeric-value">{loading ? "—" : `${formatNumber(calendar?.summary.books ?? 0)}권`}</b><span>월간 요약 기준</span></div></div>
            <div className="content-card content-card--mint content-card--compact"><div className="metric"><span>이달의 쪽수</span><b className="numeric-value">{loading ? "—" : `${formatNumber(calendar?.summary.pages ?? 0)}쪽`}</b><span>{loading ? "" : `약 ${((calendar?.summary.pages ?? 0) / 1000).toFixed(2)}km`}</span></div></div>
          </div>
          {progress && <p className="text-extra-small text-muted">대회 누적 {progress.readKm}km · 완독 {progress.completedBooks}권</p>}
          <div className="grid--three-two-columns calendar-layout">
            <div className="content-card">
              <div className="space-between-row">
                <div className="action-group">
                  <button type="button" onClick={() => moveMonth(-1)} className="icon-button" aria-label="이전 달"><Icon n="chl" s={18} sw={1.8} /></button>
                  <h2 className="section-title">{monthLabel}</h2>
                  <button type="button" onClick={() => moveMonth(1)} className="icon-button" aria-label="다음 달"><Icon n="chr" s={18} sw={1.8} /></button>
                </div>
                <button type="button" onClick={goToToday} className="button is-small">오늘</button>
              </div>
              <div className="calendar-grid">
                {["일", "월", "화", "수", "목", "금", "토"].map((weekday) => <div className="calendar-weekday" key={weekday}>{weekday}</div>)}
                {calendarDays.map((day, index) => {
                  if (day === null) return <div className="calendar-day is-empty" key={`empty-${index}`} />;
                  const date = new Date(year, month.getMonth(), day);
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === today.toDateString();
                  const key = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const entry: CalendarDay | undefined = dayByDate.get(key);
                  const firstLog = entry?.logs[0];
                  const indicator = firstLog ? statusPresentation(firstLog.status).indicator : "";
                  return <button type="button" key={day} className={`calendar-day${entry ? " has-entry" : ""}${indicator ? ` is-${indicator}` : ""}${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`} aria-pressed={isSelected} aria-label={`${monthNumber}월 ${day}일${entry ? `, ${entry.logs.length}개 기록, ${entry.pages}쪽` : ""}${isToday ? " 오늘" : ""}`} onClick={() => setSelectedDate(date)}>
                    {day}{isToday ? " · 오늘" : ""}
                    {entry?.logs.slice(0, 2).map((log) => <span key={log.readingLogId} title={`${log.bookTitle} · ${log.startPage}–${log.endPage}쪽`}><b className={`status-indicator--${statusPresentation(log.status).indicator}`}>●</b>{log.bookTitle} {log.startPage}–{log.endPage}쪽</span>)}
                    {!!entry && entry.logs.length > 2 && <span>외 {entry.logs.length - 2}건</span>}
                  </button>;
                })}
              </div>
              <div className="chip-list" style={{ alignItems: "center" }}>
                <span className="text-small"><b className="status-indicator--draft">●</b> 임시저장</span>
                <span className="text-small"><b className="status-indicator--pending">●</b> 심사 대기</span>
                <span className="text-small"><b className="status-indicator--approved">●</b> 승인·저장</span>
                <span className="text-small"><b className="status-indicator--fix-requested">●</b> 보완요청</span>
              </div>
              <p className="text-extra-small text-muted">칸의 글씨는 책 제목과 읽은 쪽이에요.</p>
              {loading && <p className="text-muted" role="status">독서달력을 불러오는 중이에요.</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="content-card">
                <div className="content-card-header"><h2 className="card-title">{selectedLabel}</h2></div>
                {loading ? <p className="text-muted">기록을 불러오는 중이에요.</p> : selectedDay?.logs.length ? <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>{selectedDay.logs.map(renderLog)}</div> : <p className="text-muted">선택한 날짜에 등록된 독서 기록이 없어요.</p>}
                {!loading && <div className="action-group"><Link to={`/records/new?date=${selectedKey}`} className="button">이날 기록 추가</Link></div>}
              </div>
              <div className="content-card content-card--mint">
                <div className="content-card-header"><h2 className="card-title">월별 독서 요약</h2></div>
                <div className="data-row" style={{ justifyContent: "space-between" }}><b>{monthNumber}월</b><span className="text-muted">{loading ? "불러오는 중" : `${calendar?.summary.readDays ?? 0}일 · ${calendar?.summary.books ?? 0}권 · ${formatNumber(calendar?.summary.pages ?? 0)}쪽`}</span></div>
                <p className="text-extra-small text-muted">달력 기록은 임시저장·제출 상태와 관계없이 표시돼요. 대회 누적 쪽수 반영 여부는 각 기록의 상태와 집계 여부를 따릅니다.</p>
              </div>
            </div>
          </div>
        </>}
      </section>
    </UserLayout>
  );
}
