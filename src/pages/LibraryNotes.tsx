import { useState } from "react";
import { Link } from "react-router-dom";
import Chip, { type ChipKind } from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";

type ReadingRecord = {
  id: string;
  date: string;
  title: string;
  initial: string;
  author: string;
  pages: string;
  summary: string;
  status: string;
  chipKind: ChipKind;
  totalPages: number;
  ownership: string;
  readDate: string;
  comment: string;
  quote: string;
  review: string;
  reviewWords: number;
};

const initialRecords: ReadingRecord[] = [
  { id: "damian", date: "10월 11일", title: "데미안", initial: "데", author: "헤르만 헤세", pages: "1–140쪽", summary: "마음에 드는 글귀 1개", status: "임시저장", chipKind: "draft", totalPages: 248, ownership: "소장도서", readDate: "10월 11일", comment: "", quote: "[글귀 본문]", review: "아직 쓰지 않았어요.", reviewWords: 0 },
  { id: "farewell", date: "10월 10일", title: "작별하지 않는다", initial: "작", author: "한강", pages: "1–210쪽", summary: "서평 작성", status: "심사 대기", chipKind: "wait", totalPages: 332, ownership: "소장도서", readDate: "10월 10일", comment: "", quote: "", review: "서평 검토 중", reviewWords: 412 },
  { id: "소년", date: "10월 8일", title: "소년이 온다", initial: "소", author: "한강", pages: "1–215쪽", summary: "서평 작성", status: "승인", chipKind: "ok", totalPages: 215, ownership: "소장도서", readDate: "10월 8일", comment: "", quote: "", review: "기록이 승인됐어요.", reviewWords: 508 },
  { id: "convenience-2", date: "10월 6일", title: "불편한 편의점", initial: "불", author: "김호연", pages: "141–260쪽", summary: "", status: "보완요청", chipKind: "fix", totalPages: 268, ownership: "소장도서", readDate: "10월 6일", comment: "서평이 412자예요. 500자 이상으로, 줄거리 대신 느낀 점을 더 보태 주세요.", quote: "[글귀 본문]", review: "[서평 본문 일부가 여기에 보여요…]", reviewWords: 412 },
  { id: "convenience-1", date: "10월 5일", title: "불편한 편의점", initial: "불", author: "김호연", pages: "1–140쪽", summary: "", status: "보완요청", chipKind: "fix", totalPages: 268, ownership: "소장도서", readDate: "10월 5일", comment: "서평 내용을 조금 더 보완해 주세요.", quote: "[글귀 본문]", review: "[서평 본문 일부가 여기에 보여요…]", reviewWords: 412 },
  { id: "prince", date: "10월 3일", title: "어린 왕자", initial: "어", author: "생텍쥐페리", pages: "61–112쪽", summary: "서평 작성", status: "승인", chipKind: "ok", totalPages: 112, ownership: "소장도서", readDate: "10월 3일", comment: "", quote: "", review: "기록이 승인됐어요.", reviewWords: 506 },
];

export default function LibraryNotes() {
  const [records, setRecords] = useState(initialRecords);
  const [selectedId, setSelectedId] = useState("convenience-2");
  const selectedRecord = records.find((record) => record.id === selectedId) ?? records[0];

  return (
    <UserLayout active="lib">
      <section className="content-section is-top">
        <div className="breadcrumb">
          <Link to="/library">내서재</Link>
          <Icon n="chr" s={14} sw={1.8} />
          수첩형 · 기록 상세
        </div>

        <div className="page-banner notes-page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">수첩형 · 기록 상세</h1>
              <p className="page-description">날짜순으로 기록을 훑고, 한 건씩 열어 수정하거나 다시 제출해요.</p>
            </div>
            <div className="view-switcher">
              <Link to="/library">
                <Icon n="grid" s={16} sw={1.8} /> 카드형
              </Link>
              <Link to="/library/notes" className="is-active" aria-current="page">
                <Icon n="list" s={16} sw={1.8} /> 수첩형
              </Link>
            </div>
          </div>
        </div>

        {selectedRecord ? (
          <div className="grid--three-two-columns notes-detail-layout">
            <div className="content-card notes-list-card">
              <div className="content-card-header">
                <h2 className="card-title">수첩형 보기</h2>
                <div className="action-group">
                  <button type="button" className="button is-small" onClick={() => window.print()}>
                    <Icon n="printer" s={15} sw={1.8} /> 인쇄
                  </button>
                  <button type="button" className="button is-small" onClick={() => window.print()}>
                    <Icon n="download" s={15} sw={1.8} /> PDF
                  </button>
                </div>
              </div>
              <p className="text-small text-muted notes-list-caption">인쇄 미리보기 · 읽은 날짜 최신순</p>
              <div className="reading-record-list">
                {records.map((record) => (
                  <button
                    type="button"
                    key={record.id}
                    className={`reading-record-row${record.id === selectedId ? " is-selected" : ""}`}
                    onClick={() => setSelectedId(record.id)}
                    aria-pressed={record.id === selectedId}
                  >
                    <b className="reading-record-date">{record.date}</b>
                    <span className="reading-record-summary">
                      <strong>{record.title} · {record.pages}</strong>
                      {record.summary && <span> · {record.summary}</span>}
                    </span>
                    <Chip k={record.chipKind}>{record.status}</Chip>
                  </button>
                ))}
              </div>
            </div>

            <aside className="content-card record-detail-card">
              <div className="content-card-header">
                <h2 className="card-title">기록 상세</h2>
                <Chip k={selectedRecord.chipKind}>{selectedRecord.status}</Chip>
              </div>
              <div className="record-book-heading">
                <Cover ch={selectedRecord.initial} />
                <div>
                  <h3 className="card-title">{selectedRecord.title}</h3>
                  <p className="text-small text-muted">{selectedRecord.author} · {selectedRecord.ownership} · 전체 {selectedRecord.totalPages}쪽</p>
                </div>
              </div>
              <p className="text-small text-muted">읽은 쪽 {selectedRecord.pages.replace("쪽", "")} · 읽은 날짜 {selectedRecord.readDate}</p>
              {selectedRecord.comment && (
                <div className="notice notice--danger reviewer-comment">
                  <Icon n="bell" s={18} />
                  <div><b>사서 코멘트 · 10월 11일</b><br />{selectedRecord.comment}</div>
                </div>
              )}
              <div className="record-detail-section">
                <b className="text-small">마음에 드는 글귀</b>
                <p className="text-muted">{selectedRecord.quote || "등록한 글귀가 없어요."}</p>
              </div>
              <div className="record-detail-section">
                <div className="space-between-row">
                  <b className="text-small">서평</b>
                  <b className="review-word-count">{selectedRecord.reviewWords} / 500자</b>
                </div>
                <div className="progress-bar is-orange"><i style={{ width: `${Math.min(selectedRecord.reviewWords / 500 * 100, 100)}%` }} /></div>
                <p className="text-small text-muted">{selectedRecord.review}</p>
              </div>
              <div className="action-group record-detail-actions">
                <Link to="/records/new" className="button button--primary">고쳐서 다시 제출</Link>
                <Link to="/records/new" className="button"><Icon n="pen" s={15} /> 수정</Link>
                <button
                  type="button"
                  className="button button--danger-outline"
                  onClick={() => {
                    const remaining = records.filter((record) => record.id !== selectedRecord.id);
                    setRecords(remaining);
                    if (remaining.length) setSelectedId(remaining[0].id);
                  }}
                >
                  <Icon n="trash" s={15} /> 삭제
                </button>
              </div>
              <p className="text-extra-small text-muted">승인된 기록은 수정하거나 삭제할 수 없어요.</p>
            </aside>
          </div>
        ) : (
          <div className="content-card text-muted">표시할 독서 기록이 없어요.</div>
        )}

        <div className="content-card content-card--mint review-status-card">
          <h2 className="card-title">심사 상태</h2>
          <div className="review-status-flow">
            <Chip k="draft">임시저장</Chip><span>→</span>
            <Chip k="wait">심사 대기</Chip><span>→</span>
            <Chip k="ok">승인</Chip><span className="text-muted">또는</span>
            <Chip k="fix">보완요청</Chip>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
