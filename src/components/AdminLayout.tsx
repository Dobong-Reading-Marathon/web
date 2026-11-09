import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import logo from "../assets/logo.png";
import "./AdminLayout.css";

type AdminSection = "overview" | "participants";
const navItems: Array<{ label: string; href: string; key: AdminSection; icon: "chart" | "users" }> = [
  { label: "운영 현황", href: "/admin", key: "overview", icon: "chart" },
  { label: "참가자 관리", href: "/admin/participants", key: "participants", icon: "users" },
];

export default function AdminLayout({ active, children }: { active: AdminSection; children: ReactNode }) {
  return <div className="admin-shell">
    <header className="admin-header">
      <Link className="admin-brand" to="/admin"><img src={logo} alt="" /><span>관리자</span></Link>
      <nav className="admin-nav" aria-label="관리자 메뉴">{navItems.map((item) => <Link key={item.key} to={item.href} className={active === item.key ? "is-active" : ""}>{item.label}</Link>)}<span className="admin-nav-muted">기록 심사 <b>14</b></span><span className="admin-nav-muted">회차 관리</span></nav>
      <div className="admin-header-tools"><span>2026 회차</span><button type="button" onClick={() => window.location.assign("/login")}>로그아웃</button></div>
    </header>
    <main className="admin-main">{children}</main>
    <footer className="admin-footer"><span>도봉도서관 독서마라톤 · 관리자 전용</span><Link to="/">참가자 사이트 보기</Link></footer>
    <nav className="admin-mobile-tabs" aria-label="관리자 메뉴">{[
      { label: "운영 현황", href: "/admin", icon: "chart", key: "overview" },
      { label: "참가자", href: "/admin/participants", icon: "users", key: "participants" },
      { label: "기록 심사", href: "#review", icon: "clip", key: "review" },
      { label: "회차", href: "#rounds", icon: "flag", key: "rounds" },
    ].map((item) => <Link key={item.key} to={item.href} className={active === item.key ? "is-active" : ""}><Icon n={item.icon as "chart" | "users" | "clip" | "flag"} s={20} /><span>{item.label}</span></Link>)}</nav>
  </div>;
}
