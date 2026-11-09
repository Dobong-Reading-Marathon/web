import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPrivacyPolicy, type PrivacyPolicy } from "../api/privacyPolicy";
import Icon from "../components/Icon";
import { PlainLayout } from "../components/UserLayout";
import "./PrivacyPolicy.css";

function formatEffectiveDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getPrivacyPolicy(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setPolicy(data); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "개인정보 처리방침을 불러오지 못했습니다."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  return <PlainLayout><main className="privacy-policy-page">
    <Link to="/" className="privacy-back-link"><Icon n="chl" s={16} /> 홈으로</Link>
    <header className="privacy-policy-heading"><span>도봉도서관 독서마라톤</span><h1>개인정보 처리방침</h1><p>수집하는 개인정보와 이용 목적, 보유 기간을 안내합니다.</p></header>
    {loading && <p className="privacy-policy-state" role="status">개인정보 처리방침을 불러오는 중이에요…</p>}
    {!loading && error && <div className="privacy-policy-error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>다시 불러오기</button></div>}
    {!loading && policy && <>
      <div className="privacy-policy-meta"><span>시행일 <b>{formatEffectiveDate(policy.effectiveFrom)}</b></span><span>버전 <b>{policy.version}</b></span></div>
      <div className="privacy-policy-sections">{policy.sections.map((section, index) => <section className="privacy-policy-section" key={`${section.title}-${index}`}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div>
    </>}
  </main></PlainLayout>;
}
