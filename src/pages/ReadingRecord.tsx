import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import "./ReadingRecord.css";

type Draft = {
  book: string;
  startPage: number;
  endPage: number;
  readDate: string;
  quote: string;
  review: string;
};

const INITIAL_DRAFT: Draft = {
  book: "데미안",
  startPage: 1,
  endPage: 140,
  readDate: "2026-10-11",
  quote: "",
  review:
    "싱글래리와 두 세계 사이에서 흔들리는 장면을 읽으며 내 지난 시간인 것처럼 보였다. 데미안이 건네는 말은 많은 정답이 아니라 질문에 가까웠고, 그래서 책을 덮고도 한참을 생각하게 됐다.",
};

const BOOKS = [
  { title: "데미안", author: "헤르만 헤세", pages: 248 },
  { title: "소년이 온다", author: "한강", pages: 215 },
];

const DRAFT_KEY = "reading-record-draft";

export default function ReadingRecord() {
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...INITIAL_DRAFT, ...JSON.parse(saved) } : INITIAL_DRAFT;
    } catch {
      return INITIAL_DRAFT;
    }
  });
  const [message, setMessage] = useState("");
  const selectedBook =
    BOOKS.find((book) => book.title === draft.book) ?? BOOKS[0];
  const appendSpeechToReview = useCallback((text: string) => {
    const dictatedText = text
      .replace(/줄\s*바꿈/g, "\n")
      .replace(/마침표/g, ".")
      .replace(/쉼표/g, ",")
      .replace(/물음표/g, "?")
      .replace(/느낌표/g, "!")
      .replace(/[ \t]+([.,!?])/g, "$1");

    setDraft((current) => {
      const separator = current.review && !current.review.endsWith("\n") && !dictatedText.startsWith("\n") ? " " : "";
      return { ...current, review: `${current.review}${separator}${dictatedText}` };
    });
    setMessage("");
  }, []);
  const { isListening, interimTranscript, speechError, startListening, stopListening } =
    useSpeechRecognition(appendSpeechToReview, [
      selectedBook.title,
      selectedBook.author,
      "줄바꿈",
      "줄 바꿈",
      "마침표",
      "쉼표",
      "물음표",
      "느낌표",
    ]);

  const pagesRead = Math.max(0, draft.endPage - draft.startPage + 1);
  const reviewLength = draft.review.length;
  const reviewProgress = Math.min((reviewLength / 500) * 100, 100);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // 브라우저 저장소를 사용할 수 없는 환경에서는 자동저장을 건너뜁니다.
    }
  }, [draft]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setMessage("임시저장했어요. 이 브라우저에서 다시 열면 내용을 불러와요.");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (draft.endPage < draft.startPage) {
        setMessage("끝 쪽은 시작 쪽보다 같거나 커야 해요.");
        return;
    }

    if (reviewLength < 500) {
        setMessage(`서평을 ${500 - reviewLength}자 더 작성해 주세요.`);
        return;
    }

    const confirmed = window.confirm("독서기록을 제출할까요?");
    if (!confirmed) return;

    setMessage("제출 요청을 완료했어요.");
    }

  async function handleCopy() {
    const text = `${draft.book}\n${draft.quote}\n${draft.review}`;

    try {
      await navigator.clipboard.writeText(text);
      setMessage("기록 본문을 클립보드에 복사했어요.");
    } catch {
      setMessage("복사할 수 없어요. 브라우저 권한이나 보안 연결을 확인해 주세요.");
    }
  }

  function handleOpenMail() {
    const subject = encodeURIComponent(`독서기록 사본 - ${draft.book}`);
    const body = encodeURIComponent(
      `${draft.book}\n읽은 쪽: ${draft.startPage}–${draft.endPage}\n\n글귀:\n${draft.quote}\n\n서평:\n${draft.review}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <UserLayout active="lib">
      <main className="record-page">
        <nav className="record-breadcrumb" aria-label="현재 위치">
          <Link to="/library">내서재</Link>
          <span aria-hidden="true">›</span>
          <span>독서기록 작성</span>
        </nav>

        <section className="record-hero">
          <div className="record-hero-copy">
            <h1>독서기록 작성</h1>
            <p>읽은 쪽과 느낀 점을 남기고, 임시저장하거나 바로 제출해요.</p>
          </div>
          <div className="record-hero-art" aria-hidden="true">
            <span className="record-art-building record-art-back" />
            <span className="record-art-building record-art-front" />
            <span className="record-art-building record-art-small" />
          </div>
        </section>

        <div className="record-layout">
          <section className="record-panel">
            <div className="record-panel-heading">
              <h2>기록 정보</h2>
              <span className="record-draft-time">임시저장은 이 브라우저에 보관돼요</span>
            </div>

            <form className="record-form" onSubmit={handleSubmit}>
              <label className="record-field">
                <span>도서 <b>필수</b></span>
                <select
                  value={draft.book}
                  onChange={(event) => updateDraft("book", event.target.value)}
                >
                  {BOOKS.map((book) => (
                    <option key={book.title} value={book.title}>
                      {book.title} · {book.author} (전체 {book.pages}쪽)
                    </option>
                  ))}
                </select>
              </label>

              <Link className="record-add-book" to="/register">
                ＋ 새 도서 등록
              </Link>

              <div className="record-field-grid">
                <label className="record-field">
                  <span>시작 쪽 <b>필수</b></span>
                  <input
                    type="number"
                    min="1"
                    max={selectedBook.pages}
                    value={draft.startPage}
                    onChange={(event) =>
                      updateDraft("startPage", Number(event.target.value))
                    }
                    required
                  />
                </label>

                <label className="record-field">
                  <span>끝 쪽 <b>필수</b></span>
                  <input
                    type="number"
                    min={draft.startPage}
                    max={selectedBook.pages}
                    value={draft.endPage}
                    onChange={(event) =>
                      updateDraft("endPage", Number(event.target.value))
                    }
                    required
                  />
                </label>

                <label className="record-field">
                  <span>읽은 날짜 <b>필수</b></span>
                  <input
                    type="date"
                    value={draft.readDate}
                    onChange={(event) => updateDraft("readDate", event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="record-reading-notice">
                <span aria-hidden="true">✓</span>
                <p>
                  <strong className="record-reading-highlight">
                    이번 기록 {pagesRead}쪽
                  </strong>
                  {" · "}이 책 누적 {pagesRead}쪽 / {selectedBook.pages}쪽. 끝 쪽이 전체 쪽수에
                  닿으면 완독 권수가 올라가요.
                </p>
              </div>

              <label className="record-field">
                <span>
                  마음에 드는 글귀 <small>선택</small>
                </span>
                <textarea
                  className="record-quote-input"
                  placeholder="마음에 남은 문장을 적어요"
                  value={draft.quote}
                  onChange={(event) => updateDraft("quote", event.target.value)}
                />
              </label>

              <div className="record-review-heading">
                <label htmlFor="review-text">
                    서평 <b>제출할 때 필요해요</b>
                    <small>임시저장만 할 때는 비워도 돼요</small>
                </label>
                <button
                  className={`record-voice-badge${isListening ? " is-listening" : ""}`}
                  type="button"
                  aria-label={isListening ? "음성 입력 중지" : "음성 입력 시작"}
                  aria-pressed={isListening}
                  onClick={isListening ? stopListening : startListening}
                >
                    🎙 {isListening ? "듣는 중 · 중지" : "음성 입력"}
                </button>
                </div>

              <textarea
                id="review-text"
                className="record-review-input"
                value={draft.review}
                onChange={(event) => updateDraft("review", event.target.value)}
                placeholder="책을 읽고 느낀 점을 적어요"
              />

              <div className="record-character-row">
                <strong>{reviewLength} / 500자</strong>
                <span>
                  {reviewLength < 500
                    ? `500자까지 ${500 - reviewLength}자 남았어요`
                    : "제출 기준을 채웠어요"}
                </span>
              </div>

              <div
                className="record-character-progress"
                role="progressbar"
                aria-valuenow={Math.round(reviewProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="서평 글자 수"
              >
                <span style={{ width: `${reviewProgress}%` }} />
              </div>

              <div className="record-voice-note" role="status" aria-live="polite">
                <span className="record-voice-icon" aria-hidden="true">🎙</span>
                <p>
                    <strong>{speechError ? "음성 입력 안내" : isListening ? "듣고 있어요" : "음성 명령 “줄바꿈”, “마침표”"}</strong>
                    <br />
                    {speechError || (isListening
                      ? interimTranscript ? `인식 중: “${interimTranscript}”` : "서평 내용을 말씀해 주세요."
                      : "‘줄바꿈’, ‘마침표’, ‘쉼표’, ‘물음표’, ‘느낌표’라고 말하면 기호로 입력돼요. 음성 처리 방식은 브라우저 음성인식 서비스 설정을 따릅니다.")}
                </p>
                </div>

              {message && (
                <p className="record-message" role="status">
                  {message}
                </p>
              )}

              <div className="record-form-actions">
                <button
                  className="record-button record-button-outline"
                  type="button"
                  onClick={handleSaveDraft}
                >
                  임시저장
                </button>
                <button className="record-button record-button-primary" type="submit">
                  온라인 제출
                </button>
              </div>
            </form>
          </section>

          <aside className="record-side-column">
            <section className="record-panel record-tip-panel">
                <h2>서평 작성 팁</h2>
                <ol>
                <li>줄거리보다 내가 느낀 점을 먼저 적어요.</li>
                <li>가장 오래 남은 장면과 그 이유를 한 가지 써요.</li>
                <li>내 경험이나 생각과 이어서 써요.</li>
                <li>500자 이상으로 마무리해요.</li>
                </ol>
                </section>

            <section className="record-panel record-submit-panel">
              <h2>제출 방법</h2>
              <p>
                온라인 제출 → 관리자 검수함 → 상태 ‘심사 대기’. 실제 제출은
                서버 연결 후 동작해요.
              </p>
              <div className="record-status-flow" aria-label="제출 상태">
                <span>임시</span>
                <i>→</i>
                <span className="waiting">심사 대기</span>
                <i>→</i>
                <span className="approved">승인</span>
              </div>
              <p className="record-small-note">
                보완요청이 오면 코멘트를 확인하고 수정해 다시 제출해요.
              </p>
            </section>

            <section className="record-panel record-email-panel">
              <h2>이메일 사본 보내기</h2>
              <p>서평을 담당자 메일로도 보낼 수 있어요.</p>
              <div className="record-side-actions">
                <button
                  className="record-button record-button-outline record-button-small"
                  type="button"
                  onClick={handleOpenMail}
                >
                  ✉ 메일 앱 열기
                </button>
                <button
                  className="record-button record-button-outline record-button-small"
                  type="button"
                  onClick={handleCopy}
                >
                  ▢ 본문 복사
                </button>
              </div>
            </section>

            <section className="record-panel record-delete-panel">
              <p>
                내 기록은 언제든 수정·삭제할 수 있어요. 승인된 기록은 수정할 수
                없어요.
              </p>
              <button
                className="record-delete-button"
                type="button"
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  setDraft(INITIAL_DRAFT);
                  setMessage("이 브라우저에 저장된 임시 입력을 지웠어요.");
                }}
              >
                기록 입력 지우기
              </button>
            </section>
          </aside>
        </div>
      </main>
    </UserLayout>
  );
}
