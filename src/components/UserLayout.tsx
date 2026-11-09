import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon, { type IconName } from "./Icon";
import logo from "../assets/logo.png";
import { getCurrentUser } from "../api/users";
import { logout } from "../api/auth";

export type UserNav = "home" | "lib" | "cal" | "search" | "rules" | "";

const NAV: { key: UserNav; label: string; to: string; icon: IconName }[] = [
  { key: "home", label: "홈", to: "/", icon: "home" },
  { key: "lib", label: "내서재", to: "/library", icon: "book" },
  { key: "cal", label: "독서달력", to: "/calendar", icon: "cal" },
  { key: "search", label: "검색", to: "/search", icon: "search" },
];

function UserHeader({ active }: { active: UserNav }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("사용자");

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then((user) => setUserName(user.name?.trim() || "사용자"))
      .catch(() => {
        if (!controller.signal.aborted) setUserName("사용자");
      });
    return () => controller.abort();
  }, []);

  async function handleLogout() {
    if (!window.confirm("로그아웃할까요?")) return;
    try { await logout(); } catch { /* The local session is cleared even when the server is unreachable. */ }
    navigate("/", { replace: true });
  }

  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        <img src={logo} alt="도봉도서관 로고" className="brand-logo" />
      </Link>
      <nav className="primary-navigation" aria-label="주요 메뉴">
        {NAV.map((n) => (
          <Link key={n.key} to={n.to} className={n.key === active ? "is-active" : ""}>
            <Icon n={n.icon} s={18} />
            {n.label}
          </Link>
        ))}
        <Link to="/rules" className={active === "rules" ? "is-active" : ""}>
          대회 요강
        </Link>
      </nav>
      <div className="header-actions">
        <Link className="button button--primary is-small" to="/records/new">
          <Icon n="pen" s={16} />
          기록 쓰기
        </Link>
        <Link className="icon-button" to="/notifications" aria-label="알림">
          <Icon n="bell" s={20} />
          {/* TODO: 알림 서버 구현 후 안 읽은 알림 수(API)로 연결하고 주석 해제 (2순위) */}
          {/* <b>2</b> */}
        </Link>
        <span className="profile-name">
          <span className="avatar">{userName.slice(0, 1)}</span>{userName}님
        </span>
        <button className="user-logout-button" type="button" onClick={() => void handleLogout()}>로그아웃</button>
      </div>
    </header>
  );
}

export function PlainHeader() {
  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        <img src={logo} alt="도봉도서관 로고" className="brand-logo" />
      </Link>
      <nav className="primary-navigation" aria-label="주요 메뉴">
        <span style={{ flex: 1 }} />
        <Link to="/rules">대회 요강</Link>
        <Link to="/admin/login" className="guest-admin-login-link">관리자 로그인</Link>
      </nav>
    </header>
  );
}

export function UserFooter() {
  return (
    <footer className="site-footer">
      <span>도봉도서관 독서마라톤 · 문의는 도서관 담당자에게</span>
      <Link to="/privacy-policy">개인정보 처리방침 전문 보기</Link>
    </footer>
  );
}

export function TabBar({ active }: { active: UserNav }) {
  const tab = (key: UserNav, label: string, to: string, icon: IconName) => (
    <Link key={key} to={to} className={key === active ? "is-active" : ""}>
      <Icon n={icon} s={22} />
      {label}
    </Link>
  );
  return (
    <nav className="mobile-tab-bar" aria-label="하단 메뉴">
      {tab("home", "홈", "/", "home")}
      {tab("lib", "내서재", "/library", "book")}
      <Link className="quick-write-button" to="/records/new" aria-label="기록 쓰기">
        <Icon n="pen" s={24} />
      </Link>
      {tab("cal", "달력", "/calendar", "cal")}
      {tab("search", "검색", "/search", "search")}
    </nav>
  );
}

type Props = { active?: UserNav; children: ReactNode };

/** 참가자 화면 공통 레이아웃 (헤더 + 본문 + 푸터 + 모바일 하단 탭) */
export default function UserLayout({ active = "", children }: Props) {
  return (
    <>
      <UserHeader active={active} />
      <div className="page-content">{children}</div>
      <UserFooter />
      <TabBar active={active} />
    </>
  );
}

/** 로그인·회원가입처럼 메뉴가 단순한 화면 */
export function PlainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PlainHeader />
      <div className="page-content">{children}</div>
      <UserFooter />
      <TabBar active="" />
    </>
  );
}
