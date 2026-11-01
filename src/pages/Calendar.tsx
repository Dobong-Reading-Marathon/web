import { useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";

//피그마 3
export default function Calendar() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const today = new Date();
  const monthLabel = `${year}년 ${monthIndex + 1}월`;
  const selectedLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 ${"일월화수목금토"[selectedDate.getDay()]}요일`;
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const moveMonth = (amount: number) => {
    const nextMonth = new Date(year, monthIndex + amount, 1);
    setMonth(nextMonth);
    setSelectedDate(nextMonth);
  };
  const goToToday = () => {
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
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
            <div className="action-group"></div>
          </div>
        </div>
        <div className="grid--three-columns calendar-summary-grid">
          <div className="content-card content-card--mint content-card--compact">
            <div className="metric">
              <span>이달의 독서 일수</span>
              <b className="numeric-value">7일</b>
              <span>10월 12일까지 12일 중</span>
            </div>
          </div>
          <div className="content-card content-card--mint content-card--compact">
            <div className="metric">
              <span>이달에 읽은 책</span>
              <b className="numeric-value">5권</b>
              <span>완독 3권 · 읽는 중 2권</span>
            </div>
          </div>
          <div className="content-card content-card--mint content-card--compact">
            <div className="metric">
              <span>이달의 쪽수</span>
              <b className="numeric-value">937쪽</b>
              <span>= 0.94km</span>
            </div>
          </div>
        </div>
        <div className="grid--three-two-columns">
          <div className="content-card">
            <div className="space-between-row">
              <div className="action-group">
                <button type="button" onClick={() => moveMonth(-1)} className="icon-button" aria-label="이전 달">
                  <Icon n="chl" s={18} sw={1.8} />
                </button>
                <h2 className="section-title">{monthLabel}</h2>
                <button type="button" onClick={() => moveMonth(1)} className="icon-button" aria-label="다음 달">
                  <Icon n="chr" s={18} sw={1.8} />
                </button>
              </div>
              <button type="button" onClick={goToToday} className="button is-small">
                오늘
              </button>
            </div>
            <div className="calendar-grid">
              <div className="calendar-weekday">일</div>
              <div className="calendar-weekday">월</div>
              <div className="calendar-weekday">화</div>
              <div className="calendar-weekday">수</div>
              <div className="calendar-weekday">목</div>
              <div className="calendar-weekday">금</div>
              <div className="calendar-weekday">토</div>
              {calendarDays.map((day, index) => {
                if (day === null) return <div className="calendar-day is-empty" key={`empty-${index}`} />;
                const date = new Date(year, monthIndex, day);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <button
                    type="button"
                    key={day}
                    className={`calendar-day${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`${monthIndex + 1}월 ${day}일${isToday ? " 오늘" : ""}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {day}{isToday ? " · 오늘" : ""}
                  </button>
                );
              })}
            </div>
            <div className="chip-list" style={{ alignItems: "center" }}>
              <span className="text-small">
                <b className="status-indicator--draft">●</b> 임시저장
              </span>
              <span className="text-small">
                <b className="status-indicator--pending">●</b> 심사 대기
              </span>
              <span className="text-small">
                <b className="status-indicator--approved">●</b> 승인
              </span>
              <span className="text-small">
                <b className="status-indicator--fix-requested">●</b> 보완요청
              </span>
            </div>
            <p className="text-extra-small text-muted">칸의 글씨는 책 제목과 읽은 쪽이에요.</p>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="content-card ">
              <div className="content-card-header">
                <h2 className="card-title">{selectedLabel}</h2>
                {selectedDate.getFullYear() === 2026 && selectedDate.getMonth() === 9 && selectedDate.getDate() === 11 && <Chip k="draft">임시저장</Chip>}
              </div>
              {selectedDate.getFullYear() === 2026 && selectedDate.getMonth() === 9 && selectedDate.getDate() === 11 ? <>
              <div
                style={{ display: "flex", gap: "14px", alignItems: "center" }}
              >
                <Cover ch="데" />
                <div>
                  <h3 className="card-title">데미안</h3>
                  <p className="text-small text-muted">헤르만 헤세 · 읽은 쪽 1–140</p>
                </div>
              </div>
              <div>
                <p className="text-small text-bold">마음에 드는 글귀</p>
                <p className="text-muted">[글귀 본문]</p>
              </div>
              <div>
                <p className="text-small text-bold">서평</p>
                <p className="text-muted">아직 쓰지 않았어요.</p>
              </div>
              <div className="action-group">
                <Link to="/records/new" className="button button--primary">
                  이어서 쓰기
                </Link>
                <Link to="/records/new" className="button">
                  이날 기록 추가
                </Link>
              </div>
              </> : <p className="text-muted">선택한 날짜에 등록된 독서 기록이 없어요.</p>}
            </div>
            <div className="content-card content-card--mint">
              <div className="content-card-header">
                <h2 className="card-title">월별 독서 요약</h2>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <b>8월</b>
                <span className="text-muted">12일 · 6권 · 4,980쪽</span>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <b>9월</b>
                <span className="text-muted">17일 · 7권 · 6,533쪽</span>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <b>10월</b>
                <span className="text-muted">7일 · 5권 · 937쪽</span>
              </div>
              <p className="text-extra-small text-muted">
                달력 기록은 임시저장·제출 상태와 관계없이 읽은 날짜 기준이에요.
                대회 누적 쪽수는 승인된 기록만 합산해요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
