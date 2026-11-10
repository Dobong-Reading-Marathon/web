import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import useScrollReveal from "../hooks/useScrollReveal";
import { PlainLayout } from "../components/UserLayout";
import "./GuestHome.css";

const steps = [
  { icon: "book", title: "읽고", text: "내가 고른 책을 편하게 읽어요." },
  { icon: "pen", title: "기록하고", text: "읽은 쪽과 인상 깊은 문장을 남겨요." },
  { icon: "award", title: "완주해요", text: "나만의 속도로 목표 코스에 도전해요." },
] as const;

export default function GuestHome() {
  const revealRoot = useScrollReveal<HTMLElement>();
  return <PlainLayout><main className="guest-home" ref={revealRoot}>
    <section className="guest-hero" data-scroll-reveal>
      <div className="guest-hero-copy">
        <span className="guest-eyebrow"><Icon n="book" s={15} /> 도봉도서관 독서마라톤</span>
        <h1>책 한 쪽부터,<br /><em>함께 달려요</em></h1>
        <p>읽은 만큼 기록하고, 나만의 코스를 완주해 보세요.<br />도봉도서관 독서마라톤에서 새로운 독서 습관을 시작할 수 있어요.</p>
        <div className="guest-actions"><Link to="/login" className="guest-login-button">로그인하고 시작하기 <Icon n="arrow" s={18} /></Link><Link to="/rules" className="guest-rules-link">대회 안내 보기</Link></div>
      </div>
      <div className="guest-hero-art" aria-hidden="true"><span className="guest-orbit guest-orbit-one" /><span className="guest-orbit guest-orbit-two" /><Tower w={390} /><span className="guest-art-caption">읽는 오늘이<br />완주의 기록이 돼요</span></div>
    </section>

    <section className="guest-intro" data-scroll-reveal><div><span className="guest-kicker">READ · RECORD · RUN</span><h2>독서마라톤이란?</h2><p>책을 읽고 독서기록을 쌓아 목표한 거리를 완주하는 독서 프로그램이에요. 매일 조금씩 읽어도 괜찮아요. 나의 기록이 모여 하나의 완주가 됩니다.</p></div><Link to="/rules" className="guest-outline-button">참가 방법과 코스 확인 <Icon n="arrow" s={17} /></Link></section>

    <section className="guest-steps" data-scroll-reveal><header><span className="guest-kicker">HOW TO JOIN</span><h2>참여 방법은 간단해요</h2></header><div className="guest-step-grid">{steps.map((step, index) => <article key={step.title}><span className="guest-step-number">0{index + 1}</span><span className="guest-step-icon"><Icon n={step.icon} s={25} /></span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>

    <section className="guest-cta" data-scroll-reveal><div><span className="guest-kicker">YOUR NEXT PAGE</span><h2>오늘부터 한 쪽,<br />시작해 볼까요?</h2><p>로그인하면 내 서재와 독서기록을 한곳에서 관리할 수 있어요.</p></div><Link to="/login" className="guest-login-button">로그인 <Icon n="arrow" s={18} /></Link></section>
  </main></PlainLayout>;
}
