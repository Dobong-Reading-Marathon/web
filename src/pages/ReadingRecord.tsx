import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { getBooks, type LibraryBook } from "../api/books";
import { getReadingLogDetail } from "../api/calendar";
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

// 수정할 수 있는 상태: 임시저장, 보완요청, 저장
function isEditable(log: ReadingLog | null): boolean {
  return !log || log.status === "DRAFT" || log.status === "REVISION_REQUESTED" || log.status === "SAVED";
}

/**
 * 독서기록 작성(/records/new)과 수정(/records/:id/edit) 화면.
 * editId가 있으면 그 기록을 불러와서 고칩니다.
 */
export default function ReadingRecord({ editId }: { editId?: number }) {
  const isEditMode = editId !== undefined;
  const invalidEditId = isEditMode && (!Number.isInteger(editId) || editId < 1);
  const [searchParams] = useSearchParams();
  // 도서 등록 직후(?book=)나 독서달력(?date=)에서 오면 그 값만 미리 채웁니다.
  const [draft, setDraft] = useState<Draft>(() => {
    if (isEditMode) return EMPTY_DRAFT;
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
  // 수정 화면: 불러온 값(되돌리기용), 불러오는 중, 불러오기 실패, 사서 코멘트
  const [loadedDraft, setLoadedDraft] = useState<Draft | null>(null);
  const [logLoading, setLogLoading] = useState(isEditMode && !invalidEditId);
  const [logError, setLogError] = useState(invalidEditId ? "기록을 찾을 수 없어요. 내서재에서 다시 골라 주세요." : "");
  const [librarianComment, setLibrarianComment] = useState<string | null>(null);

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

  useEffect(() => {
    if (editId === undefined || invalidEditId) return;
    const controller = new AbortController();
    getReadingLogDetail(editId, controller.signal)
      .then((log) => {
        const loaded: Draft = {
          enrollmentBookId: String(log.enrollmentBookId),
          startPage: String(log.startPage),
          endPage: String(log.endPage),
          readDate: log.readDate,
          quote: log.quote ?? "",
          review: log.review ?? "",
        };
        setDraft(loaded);
        setLoadedDraft(loaded);
        setSavedLog(log);
        setLibrarianComment(log.librarianComment);
        if (!isEditable(log)) {
          setMessage("심사 중이거나 승인된 기록은 고칠 수 없어요.");
        }
      })
      .catch(() => {
        // 없는 기록과 남의 기록은 서버가 똑같이 404로 응답합니다.
        if (!controller.signal.aborted) setLogError("기록을 불러오지 못했어요. 내서재에서 다시 골라 주세요.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLogLoading(false);
      });
    return () => controller.abort();
  }, [editId, invalidEditId]);

  const selectedBook = books.find((book) => String(book.enrollmentBookId) === draft.enrollmentBookId);
  const editable = isEditable(savedLog);
  const locked = busy || !editable || logLoading || logError !== "";

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
  // 서평이 500자 이상이면 심사를 받는 "서평 제출", 아니면 바로 저장되는 "제출하기"
  const reviewReady = reviewLength >= MIN_REVIEW_LENGTH;

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  // 저장 전에 화면에서 먼저 확인합니다. 문제가 없으면 빈 문자열을 돌려줍니다.
  // 서평은 선택입니다. 500자 이상이면 심사(서평 제출), 미만이면 심사 없이 저장(제출하기)됩니다.
  function validate(): string {
    if (!selectedBook) return "기록할 도서를 골라 주세요.";
    if (!startPage || !endPage) return "시작 쪽과 끝 쪽을 1 이상의 숫자로 입력해 주세요.";
    if (endPage < startPage) return "끝 쪽은 시작 쪽보다 같거나 커야 해요.";
    if (endPage > selectedBook.totalPages) return `끝 쪽은 전체 쪽수(${selectedBook.totalPages}쪽)를 넘을 수 없어요.`;
    if (!DATE_PATTERN.test(draft.readDate)) return "읽은 날짜를 입력해 주세요.";
    if (draft.readDate > todayString()) return "읽은 날짜는 오늘이나 그 이전이어야 해요.";
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
    const problem = validate();
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
    const problem = validate();
    if (problem) {
      setMessage(problem);
      return;
    }
    const confirmText = reviewReady
      ? "서평을 제출할까요? 심사가 끝날 때까지 고칠 수 없어요."
      : `제출할까요? 서평이 ${MIN_REVIEW_LENGTH}자 미만이라 심사 없이 바로 저장돼요. 나중에 수정해서 서평을 ${MIN_REVIEW_LENGTH}자 이상 쓰면 서평 제출을 할 수 있어요.`;
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    let saved: ReadingLog | null = null;
    try {
      saved = await save();
      // 심사로 갈지 저장으로 끝날지는 서버가 서평 길이로 정합니다.
      const result = await submitReadingLogs([saved.id]);
      if (result.submittedIds.includes(saved.id)) {
        setSavedLog({ ...saved, status: "SUBMITTED" });
        setMessage("서평을 제출했어요. 심사 결과는 알림과 내서재에서 확인할 수 있어요.");
      } else {
        setSavedLog({ ...saved, status: "SAVED" });
        setMessage(`제출해서 저장했어요. 서평을 ${MIN_REVIEW_LENGTH}자 이상 쓰면 수정해서 서평 제출을 할 수 있어요.`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "다시 시도해 주세요.";
      // 저장은 됐지만 제출만 실패한 경우를 구분해서 알려 줍니다.
      setMessage(saved ? `임시저장은 했지만 제출하지 못했어요. ${reason}` : reason);
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    // 수정 화면에서는 입력을 비우지 않고 불러온 값으로 되돌립니다.
    if (isEditMode) {
      if (loadedDraft) setDraft(loadedDraft);
      setMessage("고친 내용을 되돌렸어요.");
      return;
    }
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
          <span>{isEditMode ? "독서기록 수정" : "독서기록 작성"}</span>
        </nav>

        <section className="record-hero">
          <div className="record-hero-copy">
            <h1>{isEditMode ? "독서기록 수정" : "독서기록 작성"}</h1>
            <p>
              {isEditMode
                ? "저장한 기록을 고치고, 다시 임시저장하거나 제출해요. 서평을 500자 이상 쓰면 심사를 받아요."
                : "읽은 쪽과 느낀 점을 남기고, 임시저장하거나 바로 제출해요. 서평을 500자 이상 쓰면 심사를 받아요."}
            </p>
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

              {logLoading && <p className="record-message" role="status">기록을 불러오는 중이에요.</p>}
              {logError && <p className="record-message" role="alert">{logError}</p>}
              {librarianComment && (
                <p className="record-message" role="note">
                  <strong>사서 코멘트</strong> · {librarianComment}
                </p>
              )}
              {booksError && <p className="record-message" role="alert">{booksError}</p>}
              {!booksLoading && !booksError && books.length === 0 && (
                <p className="record-message" role="status">
                  내서재에 등록한 도서가 없어요. 먼저 도서를 등록해 주세요.
                </p>
              )}
              {savedLog && editable && (
                <p className="record-small-note">
                  {isEditMode
                    ? "저장한 기록은 도서를 바꿀 수 없어요."
                    : "저장한 기록은 도서를 바꿀 수 없어요. 다른 책은 입력을 지우고 새로 작성해요."}
                </p>
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
                    서평 <small>선택 · 500자 이상이면 서평 제출로 심사를 받아요</small>
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
                    : "서평 제출로 심사를 받을 수 있어요"}
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

              {logError ? null : editable ? (
                <div className="record-form-actions">
                  <button
                    className="record-button record-button-outline"
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={locked}
                  >
                    {busy ? "저장 중" : "임시저장"}
                  </button>
                  <button className="record-button record-button-primary" type="submit" disabled={locked}>
                    {reviewReady ? "서평 제출" : "제출하기"}
                  </button>
                </div>
              ) : (
                <div className="record-form-actions">
                  <Link className="record-button record-button-outline" to="/library/notes">
                    내서재에서 보기
                  </Link>
                  {isEditMode ? (
                    <Link className="record-button record-button-primary" to="/records/new">
                      새 기록 쓰기
                    </Link>
                  ) : (
                    <button className="record-button record-button-primary" type="button" onClick={handleClear}>
                      새 기록 쓰기
                    </button>
                  )}
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
                서평 500자 이상: 서평 제출 → 관리자 심사 → 승인.
                <br />
                서평이 없거나 500자 미만: 제출하기 → 바로 ‘저장’.
              </p>
              <div className="record-status-flow" aria-label="제출 상태">
                <span>임시</span>
                <i>→</i>
                <span className="waiting">심사 대기</span>
                <i>→</i>
                <span className="approved">승인</span>
              </div>
              <p className="record-small-note">
                보완요청이 오면 코멘트를 확인하고 수정해 다시 제출해요. 저장된 기록도 수정해서 서평을 채우면 서평 제출을 할 수 있어요.
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
                임시저장·저장·보완요청 상태의 기록은 내서재 수첩형에서 수정할 수 있어요. 삭제는 제출 전(임시저장) 기록만 돼요.
                심사 중이거나 승인된 기록은 바꿀 수 없어요.
              </p>
              <button
                className="record-delete-button"
                type="button"
                onClick={handleClear}
                disabled={locked}
              >
                {isEditMode ? "고친 내용 되돌리기" : "기록 입력 지우기"}
              </button>
            </section>
          </aside>
        </div>
      </main>
    </UserLayout>
  );
}
