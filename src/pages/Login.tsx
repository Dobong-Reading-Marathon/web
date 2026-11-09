import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlainLayout } from "../components/UserLayout";
import { login } from "../api/auth";
import { storeAuthToken } from "../api/client";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phone.trim() || !password) {
      setMessage("전화번호와 비밀번호를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const session = await login(phone.trim(), password, keepSignedIn);
      storeAuthToken(session.token, keepSignedIn);
      if (session.user.mustChangePassword) {
        window.alert("임시 비밀번호로 로그인했어요. 보안을 위해 새 비밀번호로 변경해 주세요.");
      }
      navigate("/join");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인할 수 없어요. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PlainLayout>
      <main className="auth-page login-page">
        <section className="login-welcome">
          <div className="login-welcome-content">
            <span className="login-season-badge">2026 회차</span>
            <h1>
              책으로 함께
              <br />
              달려요
            </h1>
            <p>
              전화번호로 로그인하고, 처음이라면 가입한 뒤 바로 이어서 참가 신청까지 할 수 있어요.
            </p>
            <Link className="login-rules-button" to="/rules">
              대회 요강 보기
            </Link>
          </div>

          <div className="login-marathon-art" aria-hidden="true">
            <div className="login-track login-track-outer" />
            <div className="login-track login-track-inner" />
            <div className="login-track-line" />
            <span className="login-runner-dot" />
            <div className="login-book-stack">
              <span className="login-book login-book-one" />
              <span className="login-book login-book-two" />
              <span className="login-book login-book-three" />
              <span className="login-book login-book-four" />
            </div>
          </div>
        </section>

        <div className="login-right-column">
          <section className="auth-panel login-panel">
            <div className="auth-panel-heading">
              <h2>로그인</h2>
              <span className="auth-participant-badge">참가자</span>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span>전화번호</span>
                <input
                  type="tel"
                  autoComplete="username"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setMessage("");
                  }}
                />
              </label>

              <label className="auth-field">
                <span>비밀번호</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setMessage("");
                  }}
                />
              </label>

              <label className="auth-remember-row">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(event) => setKeepSignedIn(event.target.checked)}
                />
                <span className="auth-custom-checkbox" aria-hidden="true">✓</span>
                <span>로그인 상태 유지</span>
              </label>

              {message && <p className="auth-message" role="alert">{message}</p>}

              <button className="login-submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "로그인 중…" : "로그인"}
              </button>
            </form>

      <div className="login-links">
        <Link to="/signup">회원가입</Link>
        <a href="#password-reset">비밀번호를 잊으셨나요?</a>
      </div>
      </section>

      <section
        className="auth-panel password-reset-panel"
        id="password-reset"
      >
        <h2>비밀번호를 잊으셨나요?</h2>
        <ol className="password-reset-steps">
          <li>도서관 담당자에게 이름과 전화번호를 알려 주세요.</li>
          <li>담당자가 임시 비밀번호로 초기화해 드려요.</li>
          <li>임시 비밀번호로 로그인한 뒤 새 비밀번호로 바꿔 주세요.</li>
        </ol>
      </section>
      </div>      
      </main>
    </PlainLayout>
  );
}
