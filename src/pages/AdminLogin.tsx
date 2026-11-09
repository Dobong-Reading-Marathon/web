import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminLogin } from "../api/adminAuth";
import logo from "../assets/logo.png";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await adminLogin(loginId.trim(), password); navigate("/admin", { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "관리자 로그인에 실패했어요."); }
    finally { setBusy(false); }
  }

  return <main className="admin-login-page"><section className="admin-login-card"><Link to="/" className="admin-login-brand"><img src={logo} alt="도봉도서관" /><span>독서마라톤<small>관리자</small></span></Link><h1>관리자 로그인</h1><p>관리자 계정으로 로그인해 주세요.</p><form onSubmit={(event) => void handleSubmit(event)}><label>아이디<input autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} required /></label><label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="admin-login-error" role="alert">{error}</p>}<button disabled={busy}>{busy ? "로그인 중…" : "로그인"}</button></form><Link to="/">참가자 화면으로 돌아가기</Link></section></main>;
}
