import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import { COVER_FALLBACK_CHAR } from "../constants/cover";
import Icon from "../components/Icon";
import LibraryHeader from "../components/LibraryHeader";
import UserLayout from "../components/UserLayout";
import { getBooks, type LibraryBook, type LibraryBookStatus } from "../api/books";

const filters: { label: string; value?: LibraryBookStatus }[] = [
  { label: "전체" },
  { label: "임시저장", value: "DRAFT" },
  { label: "심사 대기", value: "SUBMITTED" },
  { label: "승인", value: "APPROVED" },
  { label: "저장", value: "SAVED" },
  { label: "보완요청", value: "REVISION_REQUESTED" },
  { label: "기록 전", value: "NO_RECORD" },
];

const statusLabels: Record<LibraryBookStatus, string> = {
  NO_RECORD: "기록 전",
  DRAFT: "임시저장",
  SUBMITTED: "심사 대기",
  APPROVED: "승인",
  REVISION_REQUESTED: "보완요청",
  SAVED: "저장",
};

const statusKinds: Record<LibraryBookStatus, string> = {
  NO_RECORD: "outline",
  DRAFT: "draft",
  SUBMITTED: "pending",
  APPROVED: "approved",
  REVISION_REQUESTED: "fix-requested",
  SAVED: "approved", // 승인과 같은 초록색
};

// 책별로 모아보기 (이전의 카드형). 피그마 2,5
export default function LibraryBooks() {
  const location = useLocation();
  const navigationNotice = (location.state as { notice?: string } | null)?.notice;
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedStatus = filters.find((filter) => filter.label === statusFilter)?.value;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      getBooks({ keyword: searchQuery, status: selectedStatus, signal: controller.signal })
        .then(setBooks)
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setError(reason instanceof Error ? reason.message : "내 서재를 불러오지 못했습니다.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedStatus]);

  return (
    <UserLayout active="lib">
      <section className="content-section is-top">
        {navigationNotice && <p className="notice notice--success" role="status">{navigationNotice}</p>}
        <LibraryHeader active="books" />
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
        </div>
        <div className="chip-list" aria-label="도서 상태 필터">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`status-filter${statusFilter === filter.label ? " is-active" : ""}`}
              aria-pressed={statusFilter === filter.label}
              onClick={() => setStatusFilter(filter.label)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {error && <div className="notice notice--danger" role="alert">{error}</div>}
        <div className="grid--three-columns" aria-busy={loading}>
          {books.map((book) => (
            <Link
              key={book.enrollmentBookId}
              to={`/library?book=${book.enrollmentBookId}`}
              className="content-card content-card--compact book-card"
              style={{ gap: "14px", color: "#14231F" }}
            >
              <div className="library-card-top">
                <Cover ch={book.title.slice(0, 1) || COVER_FALLBACK_CHAR} src={book.coverUrl} className="library-card-cover" />
                <div className="library-card-info">
                  <span className={`status-chip status-chip--${statusKinds[book.status]} library-card-status`}>{statusLabels[book.status]}</span>
                  <div>
                    <h3 className="card-title">{book.title}</h3>
                    <p className="text-small text-muted">{book.author}</p>
                  </div>
                  <div className="chip-list library-card-chips">
                    {book.libraryOwned && <Chip k="line">소장도서</Chip>}
                    {!book.libraryOwned && <Chip k="line">소장 아님</Chip>}
                    {book.completed && <Chip k="info">완독</Chip>}
                    {book.children && <Chip k="info">아동도서</Chip>}
                  </div>
                </div>
              </div>
              <div className="progress-bar">
                <i style={{ width: `${book.totalPages > 0 ? Math.min(100, book.readPages / book.totalPages * 100) : 0}%` }}></i>
              </div>
              <p className="text-small text-muted">읽은 쪽 {book.readPages} / {book.totalPages}쪽 · 기록 보기</p>
            </Link>
          ))}
          {!loading && !error && books.length === 0 && <p className="text-muted">조건에 맞는 도서가 없어요.</p>}
          {loading && <p className="text-muted">내 서재를 불러오는 중이에요.</p>}
        </div>
        <Link to="/search" className="inline-link">
          전체 기록 통합 검색
          <Icon n="arrow" s={16} sw={1.8} />
        </Link>
      </section>
    </UserLayout>
  );
}
