import { useEffect, useState, type FormEvent } from "react";
import { getAdminCurrentRound } from "../api/admin";
import type { CurrentRound } from "../api/currentRound";
import AdminLayout from "../components/AdminLayout";
import Tower from "../components/Tower";
import "./AdminRounds.css";

type FeaturedReview = { id: number; month: string; participant: string; book: string };
const initialFeatured: FeaturedReview[] = [
  { id: 1, month: "2026-10", participant: "한유진", book: "소년이 온다" },
  { id: 2, month: "2026-09", participant: "[참가자]", book: "[도서명]" },
];
const demoCandidates = [
  { participant: "한유진", book: "소년이 온다" },
  { participant: "이서윤", book: "모모" },
  { participant: "김도현", book: "데미안" },
];

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${year}년 ${Number(month)}월`;
}

export default function AdminRounds() {
  const [round, setRound] = useState<CurrentRound | null>(null);
  const [roundError, setRoundError] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [newYear, setNewYear] = useState("");
  const [period, setPeriod] = useState("");
  const [criteria, setCriteria] = useState({ pages3: "", books3: "", reviews3: "", pages5: "", books5: "", reviews5: "" });
  const [targetMonth, setTargetMonth] = useState("2026-10");
  const [candidate, setCandidate] = useState("");
  const [featured, setFeatured] = useState(initialFeatured);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getAdminCurrentRound(controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setRound(data); setSelectedYear(data.year); setNewYear(String(data.year + 1)); setTargetMonth(`${data.year}-10`); } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setRoundError(cause instanceof Error ? cause.message : "회차 정보를 불러오지 못했습니다."); });
    return () => controller.abort();
  }, []);

  function saveNewRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("회차 생성 API가 없어 입력값은 저장되지 않았습니다. 화면 예시 폼입니다.");
  }

  function selectFeatured(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!candidate) { setMessage("우수 서평 후보를 선택해 주세요."); return; }
    const selectedCandidate = demoCandidates[Number(candidate)];
    setFeatured((current) => [{ id: Date.now(), month: targetMonth, ...selectedCandidate }, ...current.filter((item) => item.month !== targetMonth)]);
    setMessage("선정 결과는 현재 화면에만 반영된 예시 데이터입니다. 우수 서평 API가 연결되지 않았습니다.");
    setCandidate("");
  }

  return <AdminLayout active="rounds"><div className="admin-rounds-page">
    <section className="admin-rounds-hero"><Tower w={390} /><div><h1>회차 관리</h1><p>회차별 코스 기준을 만들고 이달의 우수 서평을 선정해요.</p></div></section>
    {roundError && <p className="admin-rounds-error" role="alert">{roundError}</p>}
    <div className="admin-rounds-content">
      <div className="admin-rounds-left">
        <section className="admin-round-select admin-round-card"><h2>회차 선택</h2><div className="admin-round-chips">{round && [round.year].map((year) => <button type="button" key={year} className={selectedYear === year ? "is-active" : ""} onClick={() => setSelectedYear(year)}>{year} 회차 · 진행 중</button>)}{/* 이전 회차 선택 버튼은 임시로 숨겨 둡니다.
          <button type="button">2025 회차</button>
          <button type="button">2024 회차</button>
        */}</div><p>선택한 회차의 기록만 보여요.</p></section>
        <section className="admin-new-round admin-round-card"><h2>새 회차 만들기</h2><form onSubmit={saveNewRound}><label>회차<input required type="number" min="2000" max="2100" value={newYear} onChange={(event) => setNewYear(event.target.value)} placeholder="2027 회차" /></label><label>운영 기간<input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="[운영 기간]" /></label><div className="admin-criteria-heading"><b>코스별 기준</b><span>쪽수 · 권수 · 서평</span></div><div className="admin-criteria-row"><b>3km</b><input aria-label="3km 쪽수" type="number" placeholder="[쪽수]" value={criteria.pages3} onChange={(event) => setCriteria((value) => ({ ...value, pages3: event.target.value }))} /><input aria-label="3km 권수" type="number" placeholder="[권수]" value={criteria.books3} onChange={(event) => setCriteria((value) => ({ ...value, books3: event.target.value }))} /><input aria-label="3km 편수" type="number" placeholder="[편수]" value={criteria.reviews3} onChange={(event) => setCriteria((value) => ({ ...value, reviews3: event.target.value }))} /></div><div className="admin-criteria-row"><b>5km</b><input aria-label="5km 쪽수" type="number" placeholder="[쪽수]" value={criteria.pages5} onChange={(event) => setCriteria((value) => ({ ...value, pages5: event.target.value }))} /><input aria-label="5km 권수" type="number" placeholder="[권수]" value={criteria.books5} onChange={(event) => setCriteria((value) => ({ ...value, books5: event.target.value }))} /><input aria-label="5km 편수" type="number" placeholder="[편수]" value={criteria.reviews5} onChange={(event) => setCriteria((value) => ({ ...value, reviews5: event.target.value }))} /></div><p className="admin-round-extra-courses">… 10km · 하프 · 풀 · 가족 풀코스</p><button type="submit" className="admin-round-action dark">새 회차 저장</button></form><small className="admin-round-demo-note">회차 생성 API가 없어 저장은 예시 동작입니다.</small></section>
      </div>
      <section className="admin-featured-round admin-round-card"><h2>이달의 우수 서평</h2><form onSubmit={selectFeatured}><label>대상 월<input type="month" value={targetMonth} onChange={(event) => setTargetMonth(event.target.value)} /></label><label>심사평 <small>선택</small><select value={candidate} onChange={(event) => setCandidate(event.target.value)}><option value="">서평 선택</option>{demoCandidates.map((item, index) => <option key={`${item.participant}-${item.book}`} value={index}>{item.participant} · {item.book}</option>)}</select></label><button type="submit" className="admin-round-action dark">이 서평을 우수 서평으로 선정</button></form><h3>선정된 서평</h3><div className="admin-featured-list">{featured.map((item) => <div key={item.id}><span><b>{monthLabel(item.month)}</b> {item.participant} · {item.book}</span><button type="button" onClick={() => { setFeatured((current) => current.filter((featuredItem) => featuredItem.id !== item.id)); setMessage("해제 결과는 현재 화면에서만 반영된 예시입니다."); }}>선정 해제</button></div>)}</div><small className="admin-round-demo-note">선정 내역과 후보 도서는 API 명세가 없어 예시 데이터입니다.</small></section>
    </div>
    {message && <div className="admin-round-toast" role="status"><span>{message}</span><button type="button" onClick={() => setMessage("")} aria-label="닫기">×</button></div>}
  </div></AdminLayout>;
}
