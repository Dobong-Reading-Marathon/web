import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminCurrentRound, getAdminParticipants, type AdminParticipant } from "../api/admin";
import { apiUrl } from "../api/client";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import AdminLayout from "../components/AdminLayout";
import "./AdminOverview.css";

type Metrics = { participants: number; completers: number; reviews: number; roundYear: number };
const historySamples = [
  { year: 2023, participants: 74, completers: 21, rate: 28.4 },
  { year: 2024, participants: 96, completers: 29, rate: 30.2 },
  { year: 2025, participants: 112, completers: 33, rate: 29.5 },
];
const number = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

function DemoQr() {
  const cells = [
    "111111100101111111", "1000001011011000001", "1011101010011011101", "1011101001111011101", "1011101011101011101", "1000001010101000001", "1111111010101111111",
    "0000000011110000000", "1010101100101010101", "0111010011110100110", "1100101110001101101", "0011010001100010110", "1111111010111011011", "1000001010000100100", "1011101001111101110", "1011101011000100011", "1011101000111011000", "1000001011010010110", "1111111010101110101",
  ];
  return <svg className="admin-qr-demo" viewBox="0 0 21 21" role="img" aria-label="안내용 예시 QR 코드">{cells.map((row, y) => [...row].map((value, x) => value === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#14231f" /> : null))}</svg>;
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const today = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date());

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const round = await getAdminCurrentRound(controller.signal);
        const first = await getAdminParticipants({ roundId: round.id, page: 0, size: 100, signal: controller.signal });
        const pages = first.totalPages > 1 ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => getAdminParticipants({ roundId: round.id, page: index + 1, size: 100, signal: controller.signal }))) : [];
        const participants: AdminParticipant[] = [...first.content, ...pages.flatMap((page) => page.content)];
        if (!controller.signal.aborted) setMetrics({
          participants: first.totalElements,
          completers: participants.filter((participant) => participant.status === "COMPLETED").length,
          reviews: participants.reduce((sum, participant) => sum + participant.reviews.current, 0),
          roundYear: round.year,
        });
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "운영 현황을 불러오지 못했습니다.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, []);

  const rate = metrics?.participants ? metrics.completers / metrics.participants * 100 : 0;
  const history = useMemo(() => [
    ...historySamples,
    { year: metrics?.roundYear ?? 2026, participants: metrics?.participants ?? 0, completers: metrics?.completers ?? 0, rate },
  ], [metrics, rate]);
  const chartMaximum = Math.max(1, ...history.map((item) => item.participants));

  function downloadQr() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="white"/>${Array.from(document.querySelectorAll<SVGRectElement>(".admin-qr-demo rect")).map((rect) => `<rect x="${rect.getAttribute("x")}" y="${rect.getAttribute("y")}" width="1" height="1" fill="#14231f"/>`).join("")}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a"); link.href = url; link.download = "dobong-reading-marathon-qr-sample.svg"; link.click(); URL.revokeObjectURL(url);
  }

  return <AdminLayout active="overview"><div className="admin-overview-page">
    <section className="admin-overview-hero"><Tower w={400} /><div><h1>운영 현황</h1><p>{metrics?.roundYear ?? "—"} 회차 · 오늘 {today} 기준</p><Link to="/admin/participants?status=IN_PROGRESS" className="admin-pill-button dark">심사 대기 현황 보기 <Icon n="arrow" s={17} /></Link></div></section>
    {error && <p className="admin-data-error" role="alert">{error}</p>}
    <section className="admin-stat-grid" aria-label="운영 통계">
      <article><span>총 참가 신청자</span><b>{loading ? "—" : `${number(metrics?.participants ?? 0)}명`}</b></article>
      <article><span>완주 승인자</span><b>{loading ? "—" : `${number(metrics?.completers ?? 0)}명`}</b></article>
      <article><span>완주율</span><b>{loading ? "—" : `${rate.toFixed(1)}%`}</b>{!loading && <small>{number(metrics?.completers ?? 0)} / {number(metrics?.participants ?? 0)}명</small>}</article>
      <article><span>누적 서평 수</span><b>{loading ? "—" : `${number(metrics?.reviews ?? 0)}편`}</b></article>
      <article><span>우수 서평 수</span><b>9편</b><small>예시 수치</small></article>
    </section>
    <section className="admin-overview-lower">
      <article className="admin-panel admin-history-panel"><header><h2>역대 대회 비교</h2><span className="admin-example-badge">과거 수치는 예시예요</span></header><div className="admin-chart-legend"><span><i /> 참가자</span><span><i /> 완주자</span></div><div className="admin-history-chart">{history.map((row) => <div className="admin-chart-column" key={row.year}><div className="admin-bars"><i style={{ height: `${Math.max(8, row.participants / chartMaximum * 92)}%` }} /><i style={{ height: `${Math.max(8, row.completers / chartMaximum * 92)}%` }} /></div><b>{row.year} 회차</b></div>)}</div><div className="admin-history-table-wrap"><table className="admin-history-table"><thead><tr><th>회차</th><th>참가자</th><th>완주자</th><th>완주율</th></tr></thead><tbody>{history.map((row) => <tr key={row.year}><th>{row.year} 회차</th><td>{number(row.participants)}명</td><td>{number(row.completers)}명</td><td>{row.rate.toFixed(1)}%</td></tr>)}</tbody></table></div></article>
      <article className="admin-panel admin-qr-panel"><h2>접속 QR 코드</h2><div className="admin-qr-content"><div className="admin-qr-frame"><DemoQr /></div><div className="admin-qr-copy"><p>서비스 주소로 바로 들어오는 QR 코드를 이미지로 저장하거나 안내문으로 인쇄해요.</p><b>{apiUrl("/")} · 예시 이미지예요</b><div className="admin-qr-actions"><button className="admin-pill-button outline" onClick={downloadQr} type="button"><Icon n="download" s={16} /> 이미지로 저장</button><button className="admin-pill-button outline" onClick={() => window.print()} type="button"><Icon n="printer" s={16} /> 안내문 인쇄</button></div></div></div><div className="admin-qr-print"><b>도봉도서관 독서마라톤에 함께해요!</b><span>QR 코드를 찍고 참가 신청하세요. · [운영 기간]</span></div></article>
    </section>
  </div></AdminLayout>;
}
