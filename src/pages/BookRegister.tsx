import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import "./BookRegister.css";

type Book = {
  id: number;
  title: string;
  author: string;
  publisher: string;
  pages: number;
  isbn?: string;
};

const MOCK_BOOKS: Book[] = [
  {
    id: 1,
    title: "모모",
    author: "미하엘 엔데",
    publisher: "비룡소",
    pages: 336,
    isbn: "9788949190020",
  },
  {
    id: 2,
    title: "모모 (어린이판)",
    author: "미하엘 엔데",
    publisher: "비룡소",
    pages: 288,
    isbn: "9788949190037",
  },
  {
    id: 3,
    title: "모모 이야기",
    author: "임의 저자",
    publisher: "예시출판사",
    pages: 240,
    isbn: "9788990000001",
  },
  {
    id: 4,
    title: "소년이 온다",
    author: "한강",
    publisher: "창비",
    pages: 215,
    isbn: "9788936434120",
  },
  {
    id: 5,
    title: "작별하지 않는다",
    author: "한강",
    publisher: "문학동네",
    pages: 332,
    isbn: "9788954682152",
  },
];

type BookType = "소장도서" | "소장도서 아님";

export default function BookRegister() {
  const navigate = useNavigate();

  const [titleQuery, setTitleQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("모모");
  const [selectedBook, setSelectedBook] = useState<Book | null>(MOCK_BOOKS[0]);
  const [title, setTitle] = useState(MOCK_BOOKS[0].title);
  const [author, setAuthor] = useState(MOCK_BOOKS[0].author);
  const [pages, setPages] = useState(String(MOCK_BOOKS[0].pages));
  const [bookType, setBookType] = useState<BookType>("소장도서");
  const [isChildrenBook, setIsChildrenBook] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [showIsbnInput, setShowIsbnInput] = useState(false);
  const [message, setMessage] = useState("");
  const [isbnMode, setIsbnMode] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const matchingBooks = useMemo(() => {
    const query = submittedQuery.trim().toLocaleLowerCase();

    if (!query) return [];

    return MOCK_BOOKS.filter((book) =>
      `${book.title} ${book.author} ${book.isbn ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [submittedQuery]);

  function selectBook(book: Book) {
    setSelectedBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setPages(String(book.pages));

    setBookType("소장도서");
    setIsChildrenBook(false);

    setMessage("");
  }

  function handleTitleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(titleQuery.trim());
  }

  function handleIsbnSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIsbn = isbn.replaceAll("-", "").trim();
    const foundBook = MOCK_BOOKS.find(
      (book) => book.isbn === normalizedIsbn,
    );

    if (!foundBook) {
      setMessage("예시 데이터에서 ISBN에 맞는 책을 찾지 못했어요.");
      return;
    }

    selectBook(foundBook);
    setTitleQuery(foundBook.title);
    setSubmittedQuery(foundBook.title);
    setShowIsbnInput(false);
    setMessage(`${foundBook.title} 정보를 불러왔어요.`);
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pageCount = Number(pages);

    if (!title.trim() || !author.trim() || !pageCount || pageCount < 1) {
      setMessage("도서명, 저자, 전체 쪽수를 올바르게 입력해 주세요.");
      return;
    }

    const registeredBook = {
      title: title.trim(),
      author: author.trim(),
      pages: pageCount,
      bookType,
      isChildrenBook,
      isbn: isbn.trim() || selectedBook?.isbn || "",
    };

    // 임시 확인용
    console.log("등록할 도서:", registeredBook);
    setMessage(`‘${registeredBook.title}’이(가) 등록됐어요.`);
    setIsRegistered(true);
  }

  function handleCancel() {
    navigate("/library");
  }

  function handleRegisterAndWrite() {
    const pageCount = Number(pages);

    if (!title.trim() || !author.trim() || !pageCount || pageCount < 1) {
      setMessage("도서명, 저자, 전체 쪽수를 올바르게 입력해 주세요.");
      return;
    }

    const registeredBook = {
      title: title.trim(),
      author: author.trim(),
      pages: pageCount,
      bookType,
      isChildrenBook,
    };

    // 임시 확인용
    console.log("등록 후 기록 작성:", registeredBook);
    navigate("/records/new");
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

              <div className="register-button-row">
                <button
                  className={`register-button ${isbnMode ? "button-outline" : "button-dark"}`}
                  type="button"
                  onClick={() => {
                    setIsbnMode(false);
                    setShowIsbnInput(false);
                    setMessage("");
                  }}
              >
                ▣ 바코드 촬영
              </button>

              <button
                className={`register-button ${isbnMode ? "button-dark" : "button-outline"}`}
                type="button"
                onClick={() => {
                  setIsbnMode(true);
                  setShowIsbnInput(true);
                  setMessage("");
                }}
              >
                ISBN 직접 입력
              </button>
            </div>

              {showIsbnInput && (
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
                  ‘{submittedQuery}’ 검색 결과 {matchingBooks.length}건 · 예시
                  도서 정보
                </p>
              )}

              <div className="book-results">
                {matchingBooks.map((book) => {
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
                          {book.author} · {book.publisher} · {book.pages}쪽
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
                    </article>
                  );
                })}

                {submittedQuery && matchingBooks.length === 0 && (
                  <p className="register-empty">
                    검색 결과가 없어요. 오른쪽에서 직접 입력해 등록할 수 있어요.
                  </p>
                )}
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

              {isRegistered ? (
                <div className="register-success">
                  <p className="register-message" role="status">
                    {message}
                  </p>
                  <Link className="register-button button-dark" to="/">
                    홈으로 돌아가기
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

                    <button className="register-button button-outline" type="submit">
                      등록만 하기
                    </button>

                    <button
                      className="register-button button-dark"
                      type="button"
                      onClick={handleRegisterAndWrite}
                    >
                      등록하고 기록 쓰기
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