import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSubmissions } from "../api/adminSubmissions";
import Icon from "./Icon";
import logo from "../assets/logo.png";
import "./AdminLayout.css";

type AdminSection = "overview" | "participants" | "reviews" | "rounds";
const navItems: Array<{ label: string; href: string; key: AdminSection; icon: "chart" | "users" | "clip" | "flag" }> = [
  { label: "운영 현황", href: "/admin", key: "overview", icon: "chart" },
  { label: "참가자 관리", href: "/admin/participants", key: "participants", icon: "users" },
  { label: "기록 심사", href: "/admin/reviews", key: "reviews", icon: "clip" },
  { label: "회차 관리", href: "/admin/rounds", key: "rounds", icon: "flag" },
];

export default function AdminLayout({ active, children }: { active: AdminSection; children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getAdminSubmissions({ status: "SUBMITTED", signal: controller.signal })
      .then((inbox) => { if (!controller.signal.aborted) setPendingCount(inbox.pendingCount); })
      .catch(() => { if (!controller.signal.aborted) setPendingCount(null); });
    return () => controller.abort();
  }, []);

  return <div className="admin-shell">
    <header className="admin-header">
      <Link className="admin-brand" to="/admin"><img src={logo} alt="" /><span>독서마라톤<small>관리자</small></span></Link>
      <nav className="admin-nav" aria-label="관리자 메뉴">{navItems.map((item) => <Link key={item.key} to={item.href} className={active === item.key ? "is-active" : ""}>{item.label}{item.key === "reviews" && pendingCount !== null && <b>{pendingCount}</b>}</Link>)}</nav>
      <div className="admin-header-tools"><span>2026 회차</span><button type="button" onClick={() => window.location.assign("/login")}>로그아웃</button></div>
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
