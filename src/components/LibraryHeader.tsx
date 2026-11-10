import { Link } from "react-router-dom";
import Icon, { type IconName } from "./Icon";
import Tower from "./Tower";

export type LibraryView = "cards" | "notes" | "books";

const VIEWS: { key: LibraryView; label: string; to: string; icon: IconName }[] = [
  { key: "cards", label: "카드형", to: "/library", icon: "grid" },
  { key: "notes", label: "수첩형", to: "/library/notes", icon: "book" },
  { key: "books", label: "책별로 모아보기", to: "/library/books", icon: "list" },
];

const DESCRIPTIONS: Record<LibraryView, string> = {
  cards: "내 독서기록을 카드로 모아 보고, 고치거나 지워요.",
  notes: "수첩을 넘기듯 기록을 한 장씩 봐요. 마지막 장이 가장 최근 기록이에요.",
  books: "등록한 도서별로 읽은 쪽과 기록 상태를 확인해요.",
};

/** 내서재 세 화면(카드형, 수첩형, 책별로 모아보기)의 공통 상단 */
export default function LibraryHeader({ active }: { active: LibraryView }) {
  return (
    <div className="page-banner library-banner">
      <Tower w={380} />
      <div className="page-heading-row">
        <div>
          <h1 className="page-title">내서재</h1>
          <p className="page-description">{DESCRIPTIONS[active]}</p>
        </div>
        <div className="library-banner-tools">
          <nav className="view-switcher library-view-switcher" aria-label="내서재 보기 방식">
            {VIEWS.map((view) => (
              <Link key={view.key} to={view.to} className={view.key === active ? "is-active" : ""} aria-current={view.key === active ? "page" : undefined}>
                <Icon n={view.icon} s={16} sw={1.8} />
                {view.label}
              </Link>
            ))}
          </nav>
          <div className="action-group">
            <Link to="/register" className="button button--primary">
              <Icon n="plus" s={16} sw={1.8} />
              도서 등록
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
