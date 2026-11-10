import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminCurrentRound, getAdminParticipants, type AdminParticipant } from "../api/admin";
import QRCode from "qrcode";
import { PUBLIC_SITE_URL } from "../constants/site";
import Icon from "../components/Icon";
import AdminLayout from "../components/AdminLayout";
import "./AdminOverview.css";

type Metrics = { participants: number; completers: number; reviews: number; roundYear: number };
const number = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

// 접속 QR 코드. 주소는 constants/site.ts의 PUBLIC_SITE_URL (환경변수 VITE_PUBLIC_URL)을 따릅니다.
function buildQrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#14231f", light: "#ffffff" } });
}

export default function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrSvg, setQrSvg] = useState("");
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
  // 역대 대회 비교: 회차별 집계 API가 없어서, 이번 회차만 BE 참가자 목록으로 FE에서 임시 계산합니다 (하드코딩 없음).
  // 회차별 참가자 수·완주자 수 API가 생기면 그 값으로 바꾸고 지난 회차도 붙입니다.
  const history = useMemo(() => metrics
    ? [{ year: metrics.roundYear, participants: metrics.participants, completers: metrics.completers, rate }]
    : [], [metrics, rate]);
  const chartMaximum = Math.max(1, ...history.map((item) => item.participants));

  useEffect(() => {
    let cancelled = false;
    buildQrSvg(PUBLIC_SITE_URL).then((svg) => { if (!cancelled) setQrSvg(svg); }).catch(() => { if (!cancelled) setQrSvg(""); });
    return () => { cancelled = true; };
  }, []);

  function downloadQr() {
    if (!qrSvg) return;
    const url = URL.createObjectURL(new Blob([qrSvg], { type: "image/svg+xml" }));
    const link = document.createElement("a"); link.href = url; link.download = "dobong-reading-marathon-qr.svg"; link.click(); URL.revokeObjectURL(url);
  }

  return <AdminLayout active="overview"><div className="admin-overview-page">
    <section className="admin-overview-hero"><div><h1>운영 현황</h1><p>{metrics?.roundYear ?? "—"} 회차 · 오늘 {today} 기준</p><Link to="/admin/participants?status=IN_PROGRESS" className="admin-pill-button dark">심사 대기 현황 보기 <Icon n="arrow" s={17} /></Link></div></section>
    {error && <p className="admin-data-error" role="alert">{error}</p>}
    <section className="admin-stat-grid" aria-label="운영 통계">
      <article><span>총 참가 신청자</span><b>{loading ? "—" : `${number(metrics?.participants ?? 0)}명`}</b></article>
      <article><span>완주 승인자</span><b>{loading ? "—" : `${number(metrics?.completers ?? 0)}명`}</b></article>
      <article><span>완주율</span><b>{loading ? "—" : `${rate.toFixed(1)}%`}</b>{!loading && <small>{number(metrics?.completers ?? 0)} / {number(metrics?.participants ?? 0)}명</small>}</article>
      <article><span>누적 서평 수</span><b>{loading ? "—" : `${number(metrics?.reviews ?? 0)}편`}</b></article>
      <article><span>우수 서평 수</span><b>—</b><small>우수 서평 조회 API 없음</small></article>
    </section>
    <section className="admin-overview-lower">
      <article className="admin-panel admin-history-panel"><header><h2>역대 대회 비교</h2></header><div className="admin-chart-legend"><span><i /> 참가자</span><span><i /> 완주자</span></div><div className="admin-history-chart">{history.map((row) => <div className="admin-chart-column" key={row.year}><div className="admin-bars"><i style={{ height: `${Math.max(8, row.participants / chartMaximum * 92)}%` }} /><i style={{ height: `${Math.max(8, row.completers / chartMaximum * 92)}%` }} /></div><b>{row.year} 회차</b></div>)}</div><div className="admin-history-table-wrap"><table className="admin-history-table"><thead><tr><th>회차</th><th>참가자</th><th>완주자</th><th>완주율</th></tr></thead><tbody>{history.map((row) => <tr key={row.year}><th>{row.year} 회차</th><td>{number(row.participants)}명</td><td>{number(row.completers)}명</td><td>{row.rate.toFixed(1)}%</td></tr>)}</tbody></table></div></article>
      <article className="admin-panel admin-qr-panel"><h2>접속 QR 코드</h2><div className="admin-qr-content"><div className="admin-qr-frame">{qrSvg ? <div className="admin-qr-code" role="img" aria-label={`${PUBLIC_SITE_URL} 접속 QR 코드`} dangerouslySetInnerHTML={{ __html: qrSvg }} /> : <span className="admin-qr-loading">QR 만드는 중…</span>}</div><a className="admin-qr-link" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">{PUBLIC_SITE_URL}</a><button className="admin-pill-button outline" onClick={downloadQr} disabled={!qrSvg} type="button"><Icon n="download" s={16} /> QR 이미지 저장</button></div></article>
    </section>
  </div></AdminLayout>;
}
