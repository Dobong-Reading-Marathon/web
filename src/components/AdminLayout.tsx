import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getAdminSubmissions } from "../api/adminSubmissions";
import { adminLogout, getAdminMe } from "../api/adminAuth";
import { getAdminCurrentRound } from "../api/admin";
import Icon from "./Icon";
import logoOnly from "../assets/logoOnly.png";
import "./AdminLayout.css";

type AdminSection = "overview" | "participants" | "reviews" | "rounds";
const navItems: Array<{ label: string; href: string; key: AdminSection; icon: "chart" | "users" | "clip" | "flag" }> = [
  { label: "운영 현황", href: "/admin", key: "overview", icon: "chart" },
  { label: "참가자 관리", href: "/admin/participants", key: "participants", icon: "users" },
  { label: "기록 심사", href: "/admin/reviews", key: "reviews", icon: "clip" },
  { label: "회차 관리", href: "/admin/rounds", key: "rounds", icon: "flag" },
];

export default function AdminLayout({ active, children }: { active: AdminSection; children: ReactNode }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [roundYear, setRoundYear] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getAdminMe(controller.signal)
      .then(() => {
        if (controller.signal.aborted) return;
        setAuthenticated(true);
        void getAdminCurrentRound(controller.signal).then((round) => { if (!controller.signal.aborted) setRoundYear(round.year); }).catch(() => undefined);
        void getAdminSubmissions({ status: "SUBMITTED", signal: controller.signal }).then((inbox) => { if (!controller.signal.aborted) setPendingCount(inbox.pendingCount); }).catch(() => { if (!controller.signal.aborted) setPendingCount(null); });
      })
      .catch(() => { if (!controller.signal.aborted) setAuthenticated(false); })
      .finally(() => { if (!controller.signal.aborted) setAuthChecked(true); });
    return () => controller.abort();
  }, []);

  async function handleLogout() {
    if (!window.confirm("로그아웃할까요?")) return;
    try { await adminLogout(); } catch { /* The local admin session is cleared even if the server is unreachable. */ }
    navigate("/admin/login", { replace: true });
  }

  if (!authChecked) return <main className="admin-auth-status" role="status">관리자 정보를 확인하고 있어요…</main>;
  if (!authenticated) return <Navigate to="/admin/login" replace />;

  return <div className="admin-shell">
    <header className="admin-header">
      <Link className="admin-brand" to="/admin"><img src={logoOnly} alt="" /><span><small>서울특별시교육청 도봉도서관</small>독서마라톤 관리자</span></Link>
      <nav className="admin-nav" aria-label="관리자 메뉴">{navItems.map((item) => <Link key={item.key} to={item.href} className={active === item.key ? "is-active" : ""}>{item.label}{item.key === "reviews" && pendingCount !== null && <b>{pendingCount}</b>}</Link>)}</nav>
      <div className="admin-header-tools"><span>{roundYear ? `${roundYear} 회차` : "회차 정보를 불러오지 못했어요"}</span><button type="button" onClick={() => void handleLogout()}>로그아웃</button></div>
    </header>
    <main className="admin-main">{children}</main>
    <footer className="admin-footer"><span>도봉도서관 독서마라톤 · 관리자 전용</span><Link to="/">참가자 사이트 보기</Link></footer>
    <nav className="admin-mobile-tabs" aria-label="관리자 메뉴">{[
      { label: "운영 현황", href: "/admin", icon: "chart", key: "overview" },
      { label: "참가자", href: "/admin/participants", icon: "users", key: "participants" },
      { label: "기록 심사", href: "/admin/reviews", icon: "clip", key: "reviews" },
      { label: "회차", href: "/admin/rounds", icon: "flag", key: "rounds" },
    ].map((item) => <Link key={item.key} to={item.href} className={active === item.key ? "is-active" : ""}><Icon n={item.icon as "chart" | "users" | "clip" | "flag"} s={20} /><span>{item.label}</span></Link>)}</nav>
  </div>;
}
