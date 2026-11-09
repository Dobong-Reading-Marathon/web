import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { IScannerControls } from "@zxing/browser";
import UserLayout from "../components/UserLayout";
import {
  BookApiError,
  lookupBookByIsbn,
  registerBook,
  searchBooks,
  type BookSearchResult,
} from "../api/books";
import { getCurrentEnrollment } from "../api/enrollments";
import "./BookRegister.css";

type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  publishYear: number | null;
  pages: number | null;
  isbn: string;
  coverUrl: string | null;
  sourceLink: string | null;
};

type BookType = "소장도서" | "소장도서 아님";

function waitForVideoFrame(video: HTMLVideoElement, timeoutMs = 6000) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => finish(new Error("video-timeout")), timeoutMs);
    const onLoadedData = () => {
      if (video.videoWidth > 0) finish();
    };
    const onError = () => finish(new Error("video-error"));
    function finish(error?: Error) {
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
      if (error) reject(error);
      else resolve();
    }
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("error", onError);
  });
}

export default function BookRegister() {
  const navigate = useNavigate();

  const [titleQuery, setTitleQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [bookType, setBookType] = useState<BookType>("소장도서");
  const [isChildrenBook, setIsChildrenBook] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [showIsbnInput, setShowIsbnInput] = useState(false);
  const [message, setMessage] = useState("");
  const [isbnMode, setIsbnMode] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMessage, setCameraMessage] = useState("");
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [isLoadingEnrollment, setIsLoadingEnrollment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  useEffect(() => () => {
    scannerControlsRef.current?.stop();
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentEnrollment() {
      try {
        const enrollment = await getCurrentEnrollment(controller.signal);
        setEnrollmentId(enrollment?.id ?? null);
        if (!enrollment) {
          setMessage("도서를 등록하려면 먼저 참가 신청을 완료해 주세요.");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "참가 신청 정보를 불러오지 못했어요.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingEnrollment(false);
      }
    }

    void loadCurrentEnrollment();
    return () => controller.abort();
  }, []);

  function startCamera() {
    setIsbnMode(false);
    setShowIsbnInput(false);
    setMessage("");
    setCameraMessage("");
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      setCameraMessage("이 브라우저에서는 카메라를 사용할 수 없어요. ISBN을 직접 입력해 주세요.");
      return;
    }
    setCameraOpen(true);
    setCameraMessage("ISBN 바코드를 화면 가운데 맞춰 주세요.");
  }

  useEffect(() => {
    if (!cameraOpen || !videoRef.current) return;
    let scanning = true;
    const video = videoRef.current;
    async function connectCameraAndScan() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "environment" : "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!scanning) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        await waitForVideoFrame(video);
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack || videoTrack.readyState !== "live") {
          throw new Error("camera-track-not-live");
        }
        setCameraMessage("카메라 영상이 표시되고 있어요. ISBN 바코드를 화면 가운데 맞춰 주세요.");

        const { BarcodeFormat, BrowserMultiFormatOneDReader } = await import("@zxing/browser");
        if (!scanning) return;
        const reader = new BrowserMultiFormatOneDReader();
        reader.possibleFormats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E];
        scannerControlsRef.current = await reader.decodeFromVideoElement(video, (result, _error, controls) => {
          if (!scanning) {
            controls.stop();
            return;
          }
          scannerControlsRef.current = controls;
          if (!result) return;
          const value = result.getText().replace(/\D/g, "");
          if (value.length === 13 && /^(978|979)/.test(value)) {
            setIsbn(value);
            setShowIsbnInput(true);
            setIsbnMode(true);
            setCameraMessage(`ISBN ${value}을(를) 인식했어요. 책 정보를 찾아보세요.`);
            stopCamera();
          }
        });
      } catch (error: unknown) {
        if (!scanning) return;
        const errorName = error instanceof DOMException ? error.name : "";
        const errorMessage = error instanceof Error && (error.message.startsWith("video-") || error.message === "camera-track-not-live")
          ? "카메라 권한은 허용됐지만 영상이 들어오지 않아요. Windows 카메라 개인정보 설정과 다른 앱의 카메라 사용 여부를 확인해 주세요."
          : errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "카메라 권한이 거부됐어요. 사이트 설정에서 카메라를 허용해 주세요."
          : errorName === "NotFoundError" || errorName === "OverconstrainedError"
            ? "사용할 수 있는 카메라를 찾지 못했어요. 연결된 카메라를 확인해 주세요."
            : errorName === "NotReadableError" || errorName === "AbortError"
              ? "카메라가 다른 앱에서 사용 중일 수 있어요. 다른 앱을 닫고 다시 시도해 주세요."
              : "카메라를 시작하지 못했어요. HTTPS 또는 localhost에서 열고 카메라 연결을 확인해 주세요.";
        setCameraMessage(errorMessage);
        setCameraOpen(false);
      }
    }
    void connectCameraAndScan();
    return () => {
      scanning = false;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      video.srcObject = null;
    };
  }, [cameraOpen]);

  function toBook(result: BookSearchResult): Book {
    return {
      ...result,
      id: result.isbn || `${result.title}-${result.author}`,
      pages: result.totalPages,
    };
  }

  function selectBook(book: Book) {
    setSelectedBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setPages(book.pages ? String(book.pages) : "");
    setIsbn(book.isbn);

    setBookType("소장도서");
    setIsChildrenBook(false);

    setMessage("");
  }

  async function handleTitleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = titleQuery.trim();
    if (!query) {
      setSubmittedQuery("");
      setSearchResults([]);
      setMessage("검색어를 입력해 주세요.");
      return;
    }

    setIsSearching(true);
    setMessage("");
    try {
      const results = await searchBooks(query);
      setSubmittedQuery(query);
      setSearchResults(results.map(toBook));
    } catch (error) {
      setSubmittedQuery(query);
      setSearchResults([]);
      setMessage(error instanceof Error ? error.message : "도서 정보를 찾지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleIsbnSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIsbn = isbn.replace(/\D/g, "").trim();
    if (normalizedIsbn.length !== 13) {
      setMessage("ISBN은 하이픈 없이 13자리 숫자로 입력해 주세요.");
      return;
    }

    setIsSearching(true);
    setMessage("");
    try {
      const foundBook = toBook(await lookupBookByIsbn(normalizedIsbn));
      selectBook(foundBook);
      setTitleQuery(foundBook.title);
      setSubmittedQuery(foundBook.title);
      setSearchResults([foundBook]);
      setShowIsbnInput(false);
      setMessage(`${foundBook.title} 정보를 불러왔어요.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ISBN으로 도서 정보를 찾지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsSearching(false);
    }
  }

  async function registerCurrentBook(navigateToRecord = false) {
    const pageCount = Number(pages);

    if (!title.trim() || !author.trim() || !pageCount || pageCount < 1) {
      setMessage("도서명, 저자, 전체 쪽수를 올바르게 입력해 주세요.");
      return;
    }

    if (isLoadingEnrollment) {
      setMessage("참가 신청 정보를 확인하고 있어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    if (!enrollmentId) {
      setMessage("도서를 등록하려면 먼저 참가 신청을 완료해 주세요.");
      return;
    }

    const normalizedIsbn = (isbn.trim() || selectedBook?.isbn || "").replace(/\D/g, "");
    if (normalizedIsbn && normalizedIsbn.length !== 13) {
      setMessage("ISBN은 하이픈 없이 13자리 숫자로 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const registeredBook = await registerBook({
        enrollmentId,
        title: title.trim(),
        author: author.trim(),
        totalPages: pageCount,
        ...(normalizedIsbn ? { isbn: normalizedIsbn } : {}),
        ...(selectedBook?.publisher ? { publisher: selectedBook.publisher } : {}),
        children: isChildrenBook,
        libraryOwned: bookType === "소장도서",
      });

      if (navigateToRecord) {
        navigate("/records/new");
        return;
      }

      setMessage(`‘${registeredBook.title}’이(가) 내서재에 등록됐어요.`);
      setIsRegistered(true);
    } catch (error) {
      if (error instanceof BookApiError && error.fieldErrors.length > 0) {
        setMessage(error.fieldErrors.map(({ message: fieldMessage }) => fieldMessage).join(" "));
      } else {
        setMessage(error instanceof Error ? error.message : "도서를 등록하지 못했어요. 다시 시도해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void registerCurrentBook();
  }

  function handleCancel() {
    navigate("/library");
  }

  function handleRegisterAndWrite() {
    void registerCurrentBook(true);
  }

  return (
    <UserLayout active="lib">
      <main className="register-page">
        <nav className="register-breadcrumb" aria-label="현재 위치">
          <Link to="/library">내서재</Link>
          <span aria-hidden="true">›</span>
          <span>도서 등록</span>
        </nav>

        <section className="register-hero">
          <div className="register-hero-copy">
            <h1>도서 등록</h1>
            <p>바코드나 제목으로 책 정보를 불러오거나, 직접 입력해서 등록해요.</p>
          </div>

          <div className="register-hero-art" aria-hidden="true">
            <span className="register-building register-building-back" />
            <span className="register-building register-building-front" />
            <span className="register-building register-building-small" />
          </div>
        </section>

        <div className="register-layout">
          <div className="register-left-column">
            <section className="register-panel barcode-panel">
              <div className="register-panel-heading">
                <h2>책 정보 자동 입력</h2>
                <span className="register-badge badge-green">추천</span>
              </div>

              <div className="barcode-display">
                <div className="barcode-frame">
                  <span className="barcode-lines" aria-hidden="true" />
                </div>
              </div>

              <p className="register-helper-text">
                ISBN 바코드를 사각형 안에 맞춰 주세요.
              </p>

              {cameraOpen && (
                <div className="barcode-camera">
                  <video ref={videoRef} autoPlay muted playsInline aria-label="ISBN 바코드 카메라 화면" />
                  <span className="camera-guide" aria-hidden="true" />
                </div>
              )}
              {cameraMessage && <p className="camera-status" role="status">{cameraMessage}</p>}

              <div className="register-button-row">
                <button
                  className={`register-button ${isbnMode ? "button-outline" : "button-dark"}`}
                  type="button"
                  onClick={() => {
                    if (cameraOpen) stopCamera();
                    else void startCamera();
                  }}
              >
                {cameraOpen ? "촬영 닫기" : "▣ 바코드 촬영"}
              </button>

              <button
                className={`register-button ${isbnMode ? "button-dark" : "button-outline"}`}
                type="button"
                onClick={() => {
                  if (cameraOpen) stopCamera();
                  setIsbnMode(true);
                  setShowIsbnInput(true);
                  setCameraMessage("");
                  setMessage("");
                }}
              >
                ISBN 직접 입력
              </button>
            </div>

              {(showIsbnInput || cameraMessage) && (
                <form className="isbn-form" onSubmit={handleIsbnSearch}>
                  <label className="register-field">
                    <span>ISBN</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={isbn}
                      onChange={(event) => setIsbn(event.target.value)}
                      placeholder="예: 9788949190020"
                    />
                  </label>
                  <button className="register-button button-dark" type="submit">
                    책 정보 찾기
                  </button>
                </form>
              )}
            </section>

            <section className="register-panel search-panel">
              <div className="register-panel-heading">
                <h2>제목으로 검색</h2>
              </div>

              <form className="title-search" onSubmit={handleTitleSearch}>
                <label className="visually-hidden" htmlFor="book-search">
                  도서 제목 검색
                </label>
                <input
                  id="book-search"
                  type="search"
                  value={titleQuery}
                  onChange={(event) => setTitleQuery(event.target.value)}
                  placeholder="책 제목이나 저자를 입력하세요"
                />
                <button className="register-button button-dark" type="submit">
                  검색
                </button>
              </form>

              {submittedQuery && (
                <p className="register-search-summary">
                  ‘{submittedQuery}’ 검색 결과 {searchResults.length}건 · YES24 도서 정보
                </p>
              )}

              <div className="book-results">
                {searchResults.map((book) => {
                  const isSelected = selectedBook?.id === book.id;

                  return (
                    <article
                      className={`book-result${isSelected ? " is-selected" : ""}`}
                      key={book.id}
                    >
                      <div className="register-book-cover cover-yellow">
                        {book.title.slice(0, 1)}
                      </div>

                      <div className="book-info">
                        <h3>{book.title}</h3>
                        <p>
                          {book.author} · {book.publisher ?? "출판사 정보 없음"} · {book.pages ?? "쪽수 정보 없음"}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="register-badge badge-green">선택됨</span>
                      ) : (
                        <button
                          className="register-button button-outline button-small"
                          type="button"
                          onClick={() => selectBook(book)}
                        >
                          선택
                        </button>
                      )}

                      {book.sourceLink && (
                        <a href={book.sourceLink} target="_blank" rel="noreferrer" className="book-source-link">
                          YES24 상세 보기
                        </a>
                      )}
                    </article>
                  );
                })}

                {submittedQuery && !isSearching && searchResults.length === 0 && (
                  <p className="register-empty">
                    검색 결과가 없어요. 오른쪽에서 직접 입력해 등록할 수 있어요.
                  </p>
                )}
                {isSearching && <p className="register-empty">도서 정보를 찾고 있어요.</p>}
              </div>

              <p className="register-helper-text">
                찾는 책이 없다면 직접 입력해 등록해요.
              </p>
            </section>
          </div>

          <section className="register-panel form-panel">
            <div className="register-panel-heading">
              <h2>등록할 책</h2>
              <span className="register-badge badge-blue">
                {selectedBook ? "검색 결과에서 선택했어요" : "직접 입력"}
              </span>
            </div>

            <div className="selected-book">
              <div className="register-book-cover cover-yellow cover-large">
                {title.trim().slice(0, 1) || "책"}
              </div>
              <p>표지는 검색 결과에서 선택하면 표시돼요.</p>
            </div>

            <form className="register-form" onSubmit={handleRegister}>
              <label className="register-field">
                <span>
                  도서명 <b>필수</b>
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setSelectedBook(null);
                  }}
                  required
                />
              </label>

              <div className="register-field-grid">
                <label className="register-field">
                  <span>
                    저자 <b>필수</b>
                  </span>
                  <input
                    type="text"
                    value={author}
                    onChange={(event) => {
                      setAuthor(event.target.value);
                      setSelectedBook(null);
                    }}
                    required
                  />
                </label>

                <label className="register-field">
                  <span>
                    전체 쪽수 <b>필수</b>
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={pages}
                    onChange={(event) => {
                      setPages(event.target.value);
                      setSelectedBook(null);
                    }}
                    required
                  />
                </label>
              </div>

              <fieldset className="register-field book-type-field">
                <legend>
                  도서 구분 <b>필수</b>
                </legend>

                <div className="segmented-control">
                  <label
                    className={`segment${bookType === "소장도서" ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="book-type"
                      value="소장도서"
                      checked={bookType === "소장도서"}
                      onChange={() => setBookType("소장도서")}
                    />
                    도봉도서관 소장도서
                  </label>

                  <label
                    className={`segment${bookType === "소장도서 아님" ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="book-type"
                      value="소장도서 아님"
                      checked={bookType === "소장도서 아님"}
                      onChange={() => setBookType("소장도서 아님")}
                    />
                    소장도서 아님
                  </label>
                </div>
              </fieldset>

              <p className="register-helper-text">
                소장도서 여부는 꼭 체크해 주세요. 소장도서만 대출 권수에 반영돼요.
              </p>

              <label className="register-checkbox-row">
                <input
                  type="checkbox"
                  checked={isChildrenBook}
                  onChange={(event) => setIsChildrenBook(event.target.checked)}
                />
                <span>
                  <strong>아동도서예요</strong> · 아동·가족 코스에서 2권을
                  1권으로 환산해요
                </span>
              </label>

              {!isRegistered && message && (
                <p className="register-message" role="status">
                  {message}
                </p>
              )}

              {isRegistered ? (
                <div className="register-success">
                  <p className="register-message" role="status">
                    {message}
                  </p>
                  <Link className="register-button button-dark" to="/library">
                    내서재에서 확인하기
                  </Link>
                </div>
              ) : (
                  <div className="register-form-actions">
                    <button
                      className="register-button button-outline"
                      type="button"
                      onClick={handleCancel}
                    >
                      취소
                    </button>

                    <button className="register-button button-outline" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "등록 중…" : "등록만 하기"}
                    </button>

                    <button
                      className="register-button button-dark"
                      type="button"
                      onClick={handleRegisterAndWrite}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "등록 중…" : "등록하고 기록 쓰기"}
                    </button>
                  </div>
                )}

            </form>
          </section>
        </div>
      </main>
    </UserLayout>
  );
}
