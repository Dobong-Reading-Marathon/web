import {useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PlainLayout } from "../components/UserLayout";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const PRIVACY_SECTIONS = [
  {
    title: "1. 수집 항목",
    body: "이름, 전화번호, 비밀번호, 개인정보 동의 여부 · 선택: 대출회원번호, 독서 독려 알림 동의 여부",
  },
  {
    title: "2. 수집·이용 목적",
    body: "[도서관 제공 문안]",
  },
  {
    title: "3. 보유 및 이용 기간",
    body: "[도서관 제공 문안]",
  },
  {
    title: "4. 동의 거부 권리와 불이익",
    body: "[도서관 제공 문안]",
  },
];

function normalizePhone(value: string) {
  return value.replace(/[\s.-]/g, "");
}

function getSignupErrors(values: {
  phone: string;
  name: string;
  password: string;
  passwordConfirm: string;
  loanMemberNo: string;
  privacyAgreed: boolean;
}) {
  const errors: Record<string, string> = {};
  const normalizedPhone = normalizePhone(values.phone);
  const trimmedName = values.name.trim();
  const password = values.password;

  if (!/^01[016789]\d{7,8}$/.test(normalizedPhone)) {
    errors.phone = "휴대폰 번호 형식을 확인해 주세요.";
  }

  if (!trimmedName || trimmedName.length > 50 || /[<>]/.test(trimmedName)) {
    errors.name = "이름을 입력해 주세요. 이름은 50자 이내여야 해요.";
  }

  if (
    password.length < 8 ||
    password.length > 64 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password) ||
    /\s/.test(password) ||
    (normalizedPhone.length >= 8 && password.includes(normalizedPhone.slice(-8)))
  ) {
    errors.password =
      "영문과 숫자를 섞어 8자 이상 입력해 주세요. 공백과 전화번호 뒤 8자리는 사용할 수 없어요.";
  }

  if (values.passwordConfirm !== password) {
    errors.passwordConfirm = "비밀번호가 일치하지 않아요.";
  }

  if (
    values.loanMemberNo.length > 30 ||
    (values.loanMemberNo && !/^[A-Za-z0-9-]+$/.test(values.loanMemberNo))
  ) {
    errors.loanMemberNo = "숫자, 영문, 하이픈으로 30자 이내 입력해 주세요.";
  }

  if (!values.privacyAgreed) {
    errors.privacyAgreed = "개인정보 수집·이용에 동의해 주세요.";
  }

  return errors;
}

export default function Signup() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loanMemberNo, setLoanMemberNo] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [reminderAgreed, setReminderAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = getSignupErrors({
      phone,
      name,
      password,
      passwordConfirm,
      loanMemberNo,
      privacyAgreed,
    });

    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) return;

    // 화면·입력 검증 단계: 가입 API는 아직 호출하지 않아요.
    navigate("/join");
  }

  return (
    <PlainLayout>
      <main className="auth-page signup-page">
        <section className="signup-hero">
          <div className="signup-hero-copy">
            <h1>회원가입</h1>
            <p>이름과 전화번호만 있으면 바로 시작할 수 있어요.</p>
          </div>
          <div className="signup-hero-art" aria-hidden="true">
            <span className="signup-building signup-building-back" />
            <span className="signup-building signup-building-front" />
            <span className="signup-building signup-building-small" />
          </div>
        </section>

        <div className="signup-content-layout">
          <section className="auth-panel signup-form-panel">
            <div className="auth-panel-heading">
              <h2>회원가입</h2>
              <span className="signup-small-badge">처음 참가</span>
            </div>

            <form className="signup-form" onSubmit={handleSubmit} noValidate>
              <label className="auth-field">
                <span>전화번호 <b>필수</b></span>
                <input
                  type="tel"
                  autoComplete="username"
                  maxLength={20}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setErrors((current) => ({ ...current, phone: "" }));
                    setMessage("");
                  }}
                  placeholder="010-0000-0000"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "signup-phone-error" : undefined}
                />
                {errors.phone && (
                  <small className="signup-error" id="signup-phone-error">
                    {errors.phone}
                  </small>
                )}
              </label>

              <label className="auth-field">
                <span>이름 <b>필수</b></span>
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={50}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({ ...current, name: "" }));
                    setMessage("");
                  }}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <small className="signup-error">{errors.name}</small>}
              </label>

              <label className="auth-field">
                <span>비밀번호 <b>필수</b></span>
                <input
                  type="password"
                  autoComplete="new-password"
                  maxLength={64}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: "" }));
                    setMessage("");
                  }}
                  aria-invalid={Boolean(errors.password)}
                />
                <small className="signup-hint">
                  영문과 숫자를 섞어 8자 이상. 공백과 전화번호는 넣을 수 없어요.
                </small>
                {errors.password && (
                  <small className="signup-error">{errors.password}</small>
                )}
              </label>

              <label className="auth-field">
                <span>비밀번호 확인 <b>필수</b></span>
                <input
                  type="password"
                  autoComplete="new-password"
                  maxLength={64}
                  value={passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      passwordConfirm: "",
                    }));
                    setMessage("");
                  }}
                  aria-invalid={Boolean(errors.passwordConfirm)}
                />
                {errors.passwordConfirm && (
                  <small className="signup-error">
                    {errors.passwordConfirm}
                  </small>
                )}
              </label>

              <label className="auth-field">
                <span>대출회원번호 <small>선택</small></span>
                <input
                  type="text"
                  maxLength={30}
                  value={loanMemberNo}
                  onChange={(event) => {
                    setLoanMemberNo(event.target.value);
                    setErrors((current) => ({ ...current, loanMemberNo: "" }));
                    setMessage("");
                  }}
                  aria-invalid={Boolean(errors.loanMemberNo)}
                />
                {errors.loanMemberNo && (
                  <small className="signup-error">{errors.loanMemberNo}</small>
                )}
              </label>

              <label className="signup-consent-row">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(event) => {
                    setPrivacyAgreed(event.target.checked);
                    setErrors((current) => ({ ...current, privacyAgreed: "" }));
                    setMessage("");
                  }}
                />
                <span className="signup-custom-checkbox" aria-hidden="true">✓</span>
                <span className="signup-consent-copy">
                  <span>
                    <strong>개인정보 수집·이용에 동의해요</strong>
                    <em>필수</em>
                  </span>
                  <small>
                    수집 항목: 이름, 전화번호, 비밀번호, 대출회원번호(선택)
                  </small>
                </span>
              </label>

              {errors.privacyAgreed && (
                <small className="signup-error">{errors.privacyAgreed}</small>
              )}

              <label className="signup-consent-row">
                <input
                  type="checkbox"
                  checked={reminderAgreed}
                  onChange={(event) => setReminderAgreed(event.target.checked)}
                />
                <span className="signup-custom-checkbox" aria-hidden="true">✓</span>
                <span className="signup-consent-copy">
                  <span>
                    <strong>독서 독려 알림을 받을게요</strong>
                    <em className="optional">선택</em>
                  </span>
                  <small>
                    마지막 기록 후 10일이 지나면 참여를 권하는 알림을 보내요.
                  </small>
                </span>
              </label>

              {message && (
                <p className="signup-message" role="status">
                  {message}
                </p>
              )}

              <button className="signup-submit-button" type="submit">
                가입하기
              </button>

              <p className="signup-form-note">
                가입이 완료되면 코스 선택·참가 신청으로 이동해요.
              </p>

              <Link className="signup-login-link" to="/login">
                이미 계정이 있나요? 로그인
              </Link>
            </form>
          </section>

          <aside className="auth-panel privacy-panel">
            <h2>개인정보 처리방침 전문</h2>
            <p className="privacy-intro">
              개인정보 처리방침을 확인하고 동의해 주세요.
            </p>

            {PRIVACY_SECTIONS.map((section) => (
              <section className="privacy-section" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}

            <Link className="signup-home-button" to="/">
              홈으로 돌아가기
            </Link>
          </aside>
        </div>
      </main>
    </PlainLayout>
  );
}