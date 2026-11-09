import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { getBooks, type LibraryBook } from "../api/books";
import {
  createReadingLog,
  submitReadingLogs,
  updateReadingLog,
  type ReadingLog,
} from "../api/readingLogs";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import "./ReadingRecord.css";

// 쪽수는 빈칸을 허용하려고 글자로 둡니다. 저장할 때 숫자로 바꿉니다.
type Draft = {
  enrollmentBookId: string;
  startPage: string;
  endPage: string;
  readDate: string;
  quote: string;
  review: string;
};

const EMPTY_DRAFT: Draft = {
  enrollmentBookId: "",
  startPage: "",
  endPage: "",
  readDate: "",
  quote: "",
  review: "",
};

const MIN_REVIEW_LENGTH = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 서버와 같은 방식으로 글자 수를 셉니다 (이모지 한 개 = 1자).
function countCharacters(text: string): number {
  return Array.from(text).length;
}

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function toPage(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return page >= 1 ? page : null;
}

// 수정할 수 있는 상태: 임시저장, 보완요청
function isEditable(log: ReadingLog | null): boolean {
  return !log || log.status === "DRAFT" || log.status === "REVISION_REQUESTED";
}

export default function ReadingRecord() {
  const [searchParams] = useSearchParams();
  // 도서 등록 직후(?book=)나 독서달력(?date=)에서 오면 그 값만 미리 채웁니다.
  const [draft, setDraft] = useState<Draft>(() => {
    const book = searchParams.get("book") ?? "";
    const date = searchParams.get("date") ?? "";
    return {
      ...EMPTY_DRAFT,
      enrollmentBookId: /^\d+$/.test(book) ? book : "",
      readDate: DATE_PATTERN.test(date) && date <= todayString() ? date : "",
    };
  });
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");
  const [savedLog, setSavedLog] = useState<ReadingLog | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getBooks({ signal: controller.signal })
      .then((items) => setBooks(items))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setBooksError(error instanceof Error ? error.message : "내서재 도서를 불러오지 못했어요.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setBooksLoading(false);
      });
    return () => controller.abort();
  }, []);

  const selectedBook = books.find((book) => String(book.enrollmentBookId) === draft.enrollmentBookId);
  const editable = isEditable(savedLog);
  const locked = busy || !editable;

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
      ...(selectedBook ? [selectedBook.title, selectedBook.author] : []),
      "줄바꿈",
      "줄 바꿈",
      "마침표",
      "쉼표",
      "물음표",
      "느낌표",
    ]);

  const startPage = toPage(draft.startPage);
  const endPage = toPage(draft.endPage);
  const pagesRead = startPage && endPage && endPage >= startPage ? endPage - startPage + 1 : 0;
  const reviewLength = countCharacters(draft.review);
  const reviewProgress = Math.min((reviewLength / MIN_REVIEW_LENGTH) * 100, 100);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  // 저장 전에 화면에서 먼저 확인합니다. 문제가 없으면 빈 문자열을 돌려줍니다.
  function validate(forSubmit: boolean): string {
    if (!selectedBook) return "기록할 도서를 골라 주세요.";
    if (!startPage || !endPage) return "시작 쪽과 끝 쪽을 1 이상의 숫자로 입력해 주세요.";
    if (endPage < startPage) return "끝 쪽은 시작 쪽보다 같거나 커야 해요.";
    if (endPage > selectedBook.totalPages) return `끝 쪽은 전체 쪽수(${selectedBook.totalPages}쪽)를 넘을 수 없어요.`;
    if (!DATE_PATTERN.test(draft.readDate)) return "읽은 날짜를 입력해 주세요.";
    if (draft.readDate > todayString()) return "읽은 날짜는 오늘이나 그 이전이어야 해요.";
    if (forSubmit && reviewLength < MIN_REVIEW_LENGTH) {
      return `서평을 ${MIN_REVIEW_LENGTH - reviewLength}자 더 작성해 주세요.`;
    }
    return "";
  }

  // 처음 저장이면 새 기록을 만들고, 이미 저장했으면 같은 기록을 고칩니다.
  async function save(): Promise<ReadingLog> {
    const fields = {
      startPage: startPage!,
      endPage: endPage!,
      readDate: draft.readDate,
      quote: draft.quote,
      review: draft.review,
    };
    const log = savedLog
      ? await updateReadingLog(savedLog.id, fields)
      : await createReadingLog({ enrollmentBookId: selectedBook!.enrollmentBookId, ...fields });
    setSavedLog(log);
    return log;
  }

  async function handleSaveDraft() {
    const problem = validate(false);
    if (problem) {
      setMessage(problem);
      return;
    }
    setBusy(true);
    try {
      await save();
      setMessage("임시저장했어요. 내서재 수첩형에서 이어서 볼 수 있어요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "임시저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate(true);
    if (problem) {
      setMessage(problem);
      return;
    }
    if (!window.confirm("독서기록을 제출할까요? 제출한 뒤에는 심사가 끝날 때까지 고칠 수 없어요.")) return;

    setBusy(true);
    let saved: ReadingLog | null = null;
    try {
      saved = await save();
      await submitReadingLogs([saved.id]);
      setSavedLog({ ...saved, status: "SUBMITTED" });
      setMessage("제출했어요. 심사 결과는 알림과 내서재에서 확인할 수 있어요.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "다시 시도해 주세요.";
      // 저장은 됐지만 제출만 실패한 경우를 구분해서 알려 줍니다.
      setMessage(saved ? `임시저장은 했지만 제출하지 못했어요. ${reason}` : reason);
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    const hadSaved = savedLog !== null;
    setDraft(EMPTY_DRAFT);
    setSavedLog(null);
    setMessage(hadSaved
      ? "입력을 지웠어요. 이미 저장한 기록은 내서재 수첩형에 남아 있어요."
      : "입력을 지웠어요.");
  }

  async function handleCopy() {
    const text = `${selectedBook?.title ?? ""}\n${draft.quote}\n${draft.review}`;

    try {
      await navigator.clipboard.writeText(text);
      setMessage("기록 본문을 클립보드에 복사했어요.");
    } catch {
      setMessage("복사할 수 없어요. 브라우저 권한이나 보안 연결을 확인해 주세요.");
    }
  }

  function handleOpenMail() {
    const title = selectedBook?.title ?? "";
    const subject = encodeURIComponent(`독서기록 사본 - ${title}`);
    const body = encodeURIComponent(
      `${title}\n읽은 쪽: ${draft.startPage}–${draft.endPage}\n\n글귀:\n${draft.quote}\n\n서평:\n${draft.review}`,
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
              <span className="record-draft-time">
                {savedLog ? "저장한 기록이에요" : "임시저장하면 내서재에 보관돼요"}
              </span>
            </div>

            <form className="record-form" onSubmit={handleSubmit}>
              <label className="record-field">
                <span>도서 <b>필수</b></span>
                <select
                  value={draft.enrollmentBookId}
                  onChange={(event) => updateDraft("enrollmentBookId", event.target.value)}
                  disabled={booksLoading || locked || savedLog !== null}
                  required
                >
                  <option value="">
                    {booksLoading ? "내서재 도서를 불러오는 중이에요" : "기록할 도서를 골라 주세요"}
                  </option>
                  {books.map((book) => (
                    <option key={book.enrollmentBookId} value={book.enrollmentBookId}>
                      {book.title} · {book.author} (전체 {book.totalPages}쪽)
                    </option>
                  ))}
                </select>
              </label>

              {booksError && <p className="record-message" role="alert">{booksError}</p>}
              {!booksLoading && !booksError && books.length === 0 && (
                <p className="record-message" role="status">
                  내서재에 등록한 도서가 없어요. 먼저 도서를 등록해 주세요.
                </p>
              )}
              {savedLog && editable && (
                <p className="record-small-note">저장한 기록은 도서를 바꿀 수 없어요. 다른 책은 입력을 지우고 새로 작성해요.</p>
              )}

              <Link className="record-add-book" to="/register">
                ＋ 새 도서 등록
              </Link>

              <div className="record-field-grid">
                <label className="record-field">
                  <span>시작 쪽 <b>필수</b></span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={selectedBook?.totalPages}
                    value={draft.startPage}
                    onChange={(event) => updateDraft("startPage", event.target.value)}
                    disabled={locked}
                    required
                  />
                </label>

                <label className="record-field">
                  <span>끝 쪽 <b>필수</b></span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={startPage ?? 1}
                    max={selectedBook?.totalPages}
                    value={draft.endPage}
                    onChange={(event) => updateDraft("endPage", event.target.value)}
                    disabled={locked}
                    required
                  />
                </label>

                <label className="record-field">
                  <span>읽은 날짜 <b>필수</b></span>
                  <input
                    type="date"
                    max={todayString()}
                    value={draft.readDate}
                    onChange={(event) => updateDraft("readDate", event.target.value)}
                    disabled={locked}
                    required
                  />
                </label>
              </div>

              {selectedBook && (
                <div className="record-reading-notice">
                  <span aria-hidden="true">✓</span>
                  <p>
                    <strong className="record-reading-highlight">
                      이번 기록 {pagesRead}쪽
                    </strong>
                    {" · "}이 책 지금까지 {selectedBook.readPages}쪽 / {selectedBook.totalPages}쪽. 끝 쪽이 전체 쪽수에
                    닿으면 완독 권수가 올라가요.
                  </p>
                </div>
              )}

              <label className="record-field">
                <span>
                  마음에 드는 글귀 <small>선택</small>
                </span>
                <textarea
                  className="record-quote-input"
                  placeholder="마음에 남은 문장을 적어요"
                  value={draft.quote}
                  onChange={(event) => updateDraft("quote", event.target.value)}
                  disabled={locked}
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
                  disabled={locked}
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
                disabled={locked}
              />

              <div className="record-character-row">
                <strong>{reviewLength} / {MIN_REVIEW_LENGTH}자</strong>
                <span>
                  {reviewLength < MIN_REVIEW_LENGTH
                    ? `${MIN_REVIEW_LENGTH}자까지 ${MIN_REVIEW_LENGTH - reviewLength}자 남았어요`
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

              {editable ? (
                <div className="record-form-actions">
                  <button
                    className="record-button record-button-outline"
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={busy}
                  >
                    {busy ? "저장 중" : "임시저장"}
                  </button>
                  <button className="record-button record-button-primary" type="submit" disabled={busy}>
                    온라인 제출
                  </button>
                </div>
              ) : (
                <div className="record-form-actions">
                  <Link className="record-button record-button-outline" to="/library/notes">
                    내서재에서 보기
                  </Link>
                  <button className="record-button record-button-primary" type="button" onClick={handleClear}>
                    새 기록 쓰기
                  </button>
                </div>
              )}
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
                온라인 제출 → 관리자 검수함 → 상태 ‘심사 대기’.
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
                임시저장·보완요청 상태의 기록은 내서재 수첩형에서 수정·삭제할 수 있어요.
                심사 중이거나 승인된 기록은 바꿀 수 없어요.
              </p>
              <button
                className="record-delete-button"
                type="button"
                onClick={handleClear}
                disabled={busy}
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
