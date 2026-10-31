import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon, { type IconName } from "./Icon";
import logo from "../assets/logo.png";

export type UserNav = "home" | "lib" | "cal" | "search" | "rules" | "";

const NAV: { key: UserNav; label: string; to: string; icon: IconName }[] = [
  { key: "home", label: "홈", to: "/", icon: "home" },
  { key: "lib", label: "내서재", to: "/library", icon: "book" },
  { key: "cal", label: "독서달력", to: "/calendar", icon: "cal" },
  { key: "search", label: "검색", to: "/search", icon: "search" },
];

function UserHeader({ active }: { active: UserNav }) {
  return (
    <header className="hd">
      <Link className="brand" to="/">
        <img src={logo} alt="도봉도서관 로고" className="logo" />
      </Link>
      <nav className="nav" aria-label="주요 메뉴">
        {NAV.map((n) => (
          <Link key={n.key} to={n.to} className={n.key === active ? "on" : ""}>
            <Icon n={n.icon} s={18} />
            {n.label}
          </Link>
        ))}
        <Link to="/rules" className={active === "rules" ? "on" : ""}>
          대회 요강
        </Link>
      </nav>
      <div className="hr">
        <Link className="btn p s" to="/records/new">
          <Icon n="pen" s={16} />
          기록 쓰기
        </Link>
        <Link className="bellb" to="/notifications" aria-label="알림 2건">
          <Icon n="bell" s={20} />
          <b>2</b>
        </Link>
        <span className="who">
          <span className="av">소</span>소연님
        </span>
      </div>
    </header>
  );
}

export function PlainHeader() {
  return (
    <header className="hd">
      <Link className="brand" to="/">
        <img src={logo} alt="도봉도서관 로고" className="logo" />
      </Link>
      <nav className="nav" aria-label="주요 메뉴">
        <span style={{ flex: 1 }} />
        <Link to="/rules">대회 요강</Link>
      </nav>
    </header>
  );
}

export function UserFooter() {
  return (
    <footer className="ftr">
      <span>도봉도서관 독서마라톤 · 문의는 도서관 담당자에게</span>
      <Link to="/signup">개인정보 처리방침 전문 보기</Link>
    </footer>
  );
}

export function TabBar({ active }: { active: UserNav }) {
  const tab = (key: UserNav, label: string, to: string, icon: IconName) => (
    <Link key={key} to={to} className={key === active ? "on" : ""}>
      <Icon n={icon} s={22} />
      {label}
    </Link>
  );
  return (
    <nav className="tabbar" aria-label="하단 메뉴">
      {tab("home", "홈", "/", "home")}
      {tab("lib", "내서재", "/library", "book")}
      <Link className="wr" to="/records/new" aria-label="기록 쓰기">
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
      <div className="pg">{children}</div>
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
      <div className="pg">{children}</div>
      <UserFooter />
      <TabBar active="" />
    </>
  );
}
