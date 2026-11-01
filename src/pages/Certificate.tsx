import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
//피그마 13
export default function Certificate() {
  return (
    <UserLayout active="">
      <section className="content-section is-top">
        <div className="breadcrumb">
          <Link to="/">홈</Link>
          <Icon n="chr" s={14} sw={1.8} />
          완주 인증
        </div>
        <div className="page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">완주 인증서 · 상장</h1>
              <p className="page-description">
                코스 기준을 모두 채우면 자동으로 완주 승인 대기가 되고, 관리자
                승인 후 인증서를 받아요.
              </p>
            </div>
            <div className="action-group"></div>
          </div>
        </div>
        <div className="content-card ">
          <div className="content-card-header">
            <h2 className="card-title">완주 조건 판정 · 하프 코스</h2>
            <Chip k="wait">현재 진행 중</Chip>
          </div>
          <div className="step-list">
            <div>
              <span className="step-number">1</span>
              <b>기록 승인 누적</b>
              <span>지금 여기예요</span>
            </div>
            <div className="is-active">
              <span className="step-number">2</span>
              <b>완주 승인 대기</b>
              <span style={{ color: "#D5E8DD" }}>
                세 기준을 모두 채우면 자동
              </span>
            </div>
            <div>
              <span className="step-number">3</span>
              <b>관리자 승인</b>
              <span>인증번호가 붙어요</span>
            </div>
            <div>
              <span className="step-number">4</span>
              <b>인증서 · 상장</b>
              <span>화면 · 인쇄 · PDF</span>
            </div>
          </div>
          <div className="grid--three-columns">
            <div className="content-card content-card--compact" style={{ gap: "10px" }}>
              <div className="space-between-row">
                <span className="text-muted text-bold">쪽수</span>
                <b className="numeric-value">59%</b>
              </div>
              <b className="numeric-value" style={{ fontSize: "26px" }}>
                12,450 / 21,000쪽
              </b>
              <div className="progress-bar">
                <i style={{ width: "59%" }}></i>
              </div>
            </div>
            <div className="content-card content-card--compact" style={{ gap: "10px" }}>
              <div className="space-between-row">
                <span className="text-muted text-bold">권수</span>
                <b className="numeric-value">60%</b>
              </div>
              <b className="numeric-value" style={{ fontSize: "26px" }}>
                18 / 30권
              </b>
              <div className="progress-bar">
                <i style={{ width: "60%" }}></i>
              </div>
            </div>
            <div className="content-card content-card--compact" style={{ gap: "10px" }}>
              <div className="space-between-row">
                <span className="text-muted text-bold">서평</span>
                <b className="numeric-value">58%</b>
              </div>
              <b className="numeric-value" style={{ fontSize: "26px" }}>
                7 / 12편
              </b>
              <div className="progress-bar">
                <i style={{ width: "58%" }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="grid--two-columns">
          <div className="content-card ">
            <div className="content-card-header">
              <h2 className="card-title">완주 인증서</h2>
              <Chip k="line">미리보기</Chip>
            </div>
            <p className="text-small text-muted">
              관리자 승인 후 열려요 · 인증번호 [인증번호]
            </p>
            <div className="certificate-paper">
              <div>
                <span
                  className="text-extra-small text-bold"
                  style={{ letterSpacing: ".18em", color: "#2F7D5F" }}
                >
                  CERTIFICATE
                </span>
                <h3 className="section-title">완주 인증서</h3>
                <p className="text-muted text-small">이름 · 소연</p>
                <p style={{ maxWidth: "420px" }}>
                  도봉도서관 독서마라톤 하프 코스(21km)에서 30권을 읽고
                  완주하였기에 이 증서를 드립니다.
                </p>
                <p className="text-extra-small text-muted">
                  [도서관 제공 양식 문구] · 2026 회차
                  <br />
                  [날짜] · 도봉도서관장 [직인]
                </p>
              </div>
            </div>
            <div className="action-group">
              <Link to="/certificate" className="button is-small">
                <Icon n="printer" s={14} sw={1.8} />
                인쇄
              </Link>
              <Link to="/certificate" className="button is-small">
                <Icon n="download" s={14} sw={1.8} />
                PDF 저장
              </Link>
            </div>
            <p className="text-extra-small text-muted">
              양식은 도서관에서 주신 파일에 맞춰 바꿀 수 있어요.
            </p>
          </div>
          <div className="content-card ">
            <div className="content-card-header">
              <h2 className="card-title">독서기록 우수 참여자 상장</h2>
              <Chip k="line">미리보기</Chip>
            </div>
            <p className="text-small text-muted">선정되면 열려요 · 상장 번호 [상장 번호]</p>
            <div className="certificate-paper">
              <div>
                <span
                  className="text-extra-small text-bold"
                  style={{ letterSpacing: ".18em", color: "#2F7D5F" }}
                >
                  CERTIFICATE
                </span>
                <h3 className="section-title">우수 참여자 상장</h3>
                <p className="text-muted text-small">수상자 · [수상자]</p>
                <p style={{ maxWidth: "420px" }}>
                  독서기록 우수 참여자로 선정되어 이 상장을 드립니다.
                </p>
                <p className="text-extra-small text-muted">
                  [도서관 제공 양식 문구] · 2026 회차
                  <br />
                  [날짜] · 도봉도서관장 [직인]
                </p>
              </div>
            </div>
            <div className="action-group">
              <Link to="/certificate" className="button is-small">
                <Icon n="printer" s={14} sw={1.8} />
                인쇄
              </Link>
              <Link to="/certificate" className="button is-small">
                <Icon n="download" s={14} sw={1.8} />
                PDF 저장
              </Link>
            </div>
            <p className="text-extra-small text-muted">
              양식은 도서관에서 주신 파일에 맞춰 바꿀 수 있어요.
            </p>
          </div>
        </div>
        <div
          className="content-card content-card--mint"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="card-title">승인 알림은 홈과 알림에서 알려 드려요</h3>
            <p className="text-small text-muted">
              승인 · 보완요청 · 완주 승인 결과가 나오면 참가자에게 알림이 가요.
            </p>
          </div>
          <Link to="/notifications" className="button button--primary">
            알림 보러 가기
          </Link>
        </div>
      </section>
    </UserLayout>
  );
}
