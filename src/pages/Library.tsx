import { useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import { libraryBooks as books } from "../data/libraryBooks";

//피그마 2,5
export default function Library() {
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const filters = ["전체", "임시저장", "심사 대기", "승인", "보완요청", "기록 전"];
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredBooks = books.filter((book) => {
    const matchesStatus = statusFilter === "전체" || book.status === statusFilter;
    const searchableText = [book.title, book.author, book.status, ...book.tags]
      .join(" ")
      .toLocaleLowerCase();
    return matchesStatus && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  return (
    <UserLayout active="lib">
      <section className="content-section is-top">
        <div className="page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">내서재</h1>
              <p className="page-description">
                등록한 도서들과 독서기록을 한곳에서 관리해요.
              </p>
            </div>
            <div className="action-group">
              <Link to="/library/notes" className="button">
                <Icon n="printer" s={16} sw={1.8} />
                기록장 인쇄 · PDF
              </Link>
              <Link to="/books/new" className="button button--primary">
                <Icon n="plus" s={16} sw={1.8} />
                도서 등록
              </Link>
            </div>
          </div>
        </div>
        <div className="space-between-row" style={{ flexWrap: "wrap", gap: "16px" }}>
          <label
            className="form-field"
            style={{ flex: "1 1 280px", position: "relative" }}
          >
            <span style={{ position: "absolute", left: "-9999px" }}>
              내서재 검색
            </span>
            <input
              className="text-input"
              type="search"
              placeholder="내서재에서 도서·기록 검색"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="내서재 도서 검색"
            />
          </label>
          <div className="view-switcher">
            <Link to="/library" className="is-active">
              <Icon n="grid" s={16} sw={1.8} />
              카드형
            </Link>
            <Link to="/library/notes">
              <Icon n="list" s={16} sw={1.8} />
              수첩형
            </Link>
          </div>
        </div>
        <div className="chip-list" aria-label="도서 상태 필터">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`status-filter${statusFilter === filter ? " is-active" : ""}`}
              aria-pressed={statusFilter === filter}
              onClick={() => setStatusFilter(filter)}
            >
              {filter} <i>{filter === "전체" ? books.length : books.filter((book) => book.status === filter).length}</i>
            </button>
          ))}
        </div>
        <div className="grid--three-columns">
          {filteredBooks.map((book) => (
            <Link
              key={book.title}
              to="/library/notes"
              className="content-card content-card--compact book-card"
              style={{ gap: "14px", color: "#14231F" }}
            >
              <div className="space-between-row" style={{ alignItems: "flex-start" }}>
                <Cover ch={book.initial} />
                <span className={`status-chip status-chip--${book.kind}`}>{book.status}</span>
              </div>
              <div>
                <h3 className="card-title">{book.title}</h3>
                <p className="text-small text-muted">{book.author}</p>
              </div>
              <div className="chip-list">
                {book.tags.map((tag) => (
                  <Chip key={tag} k={tag === "완독" || tag === "아동도서" ? "info" : "line"}>{tag}</Chip>
                ))}
              </div>
              <div className="progress-bar">
                <i style={{ width: `${book.progress}%` }}></i>
              </div>
              <p className="text-small text-muted">읽은 쪽 {book.pages}</p>
              <p className="text-extra-small text-muted">{book.note}</p>
            </Link>
          ))}
          {filteredBooks.length === 0 && <p className="text-muted">해당 상태의 도서가 없어요.</p>}
        </div>
        <div
          className="content-card content-card--dark content-card--compact"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            borderRadius: "999px",
            padding: "14px 14px 14px 28px",
          }}
        >
          <div>
            <b>임시저장 1건을 선택했어요</b>
            <p className="text-small" style={{ color: "#D5E8DD" }}>
              제출하면 관리자 접수함으로 가고 상태가 ‘심사 대기’로 바뀌어요.
            </p>
          </div>
          <div className="action-group">
            <Link to="/library" className="button button--green is-small">
              선택 해제
            </Link>
            <Link to="/library" className="button button--light is-small">
              선택한 기록 일괄 제출
            </Link>
          </div>
        </div>
        <Link to="/search" className="inline-link">
          전체 기록 통합 검색
          <Icon n="arrow" s={16} sw={1.8} />
        </Link>
      </section>
    </UserLayout>
  );
}
