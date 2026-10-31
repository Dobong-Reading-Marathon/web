import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
//피그마 13
export default function Certificate() {
  return (
    <UserLayout active="">
      <section className="sec t">
        <div className="crumb">
          <Link to="/">홈</Link>
          <Icon n="chr" s={14} sw={1.8} />
          완주 인증
        </div>
        <div className="pb">
          <Tower w={380} />
          <div className="top">
            <div>
              <h1 className="h1">완주 인증서 · 상장</h1>
              <p className="lead">
                코스 기준을 모두 채우면 자동으로 완주 승인 대기가 되고, 관리자
                승인 후 인증서를 받아요.
              </p>
            </div>
            <div className="acts"></div>
          </div>
        </div>
        <div className="cd ">
          <div className="cdh">
            <h2 className="h3">완주 조건 판정 · 하프 코스</h2>
            <Chip k="wait">현재 진행 중</Chip>
          </div>
          <div className="steps">
            <div>
              <span className="stn">1</span>
              <b>기록 승인 누적</b>
              <span>지금 여기예요</span>
            </div>
            <div className="on">
              <span className="stn">2</span>
              <b>완주 승인 대기</b>
              <span style={{ color: "#D5E8DD" }}>
                세 기준을 모두 채우면 자동
              </span>
            </div>
            <div>
              <span className="stn">3</span>
              <b>관리자 승인</b>
              <span>인증번호가 붙어요</span>
            </div>
            <div>
              <span className="stn">4</span>
              <b>인증서 · 상장</b>
              <span>화면 · 인쇄 · PDF</span>
            </div>
          </div>
          <div className="g3">
            <div className="cd n" style={{ gap: "10px" }}>
              <div className="sp">
                <span className="mute b">쪽수</span>
                <b className="num">59%</b>
              </div>
              <b className="num" style={{ fontSize: "26px" }}>
                12,450 / 21,000쪽
              </b>
              <div className="bar">
                <i style={{ width: "59%" }}></i>
              </div>
            </div>
            <div className="cd n" style={{ gap: "10px" }}>
              <div className="sp">
                <span className="mute b">권수</span>
                <b className="num">60%</b>
              </div>
              <b className="num" style={{ fontSize: "26px" }}>
                18 / 30권
              </b>
              <div className="bar">
                <i style={{ width: "60%" }}></i>
              </div>
            </div>
            <div className="cd n" style={{ gap: "10px" }}>
              <div className="sp">
                <span className="mute b">서평</span>
                <b className="num">58%</b>
              </div>
              <b className="num" style={{ fontSize: "26px" }}>
                7 / 12편
              </b>
              <div className="bar">
                <i style={{ width: "58%" }}></i>
              </div>
            </div>
          </div>
        </div>
        <div className="g2">
          <div className="cd ">
            <div className="cdh">
              <h2 className="h3">완주 인증서</h2>
              <Chip k="line">미리보기</Chip>
            </div>
            <p className="sm mute">
              관리자 승인 후 열려요 · 인증번호 [인증번호]
            </p>
            <div className="paper">
              <div>
                <span
                  className="xs b"
                  style={{ letterSpacing: ".18em", color: "#2F7D5F" }}
                >
                  CERTIFICATE
                </span>
                <h3 className="h2">완주 인증서</h3>
                <p className="mute sm">이름 · 소연</p>
                <p style={{ maxWidth: "420px" }}>
                  도봉도서관 독서마라톤 하프 코스(21km)에서 30권을 읽고
                  완주하였기에 이 증서를 드립니다.
                </p>
                <p className="xs mute">
                  [도서관 제공 양식 문구] · 2026 회차
                  <br />
                  [날짜] · 도봉도서관장 [직인]
                </p>
              </div>
            </div>
            <div className="acts">
              <Link to="/certificate" className="btn s">
                <Icon n="printer" s={14} sw={1.8} />
                인쇄
              </Link>
              <Link to="/certificate" className="btn s">
                <Icon n="download" s={14} sw={1.8} />
                PDF 저장
              </Link>
            </div>
            <p className="xs mute">
              양식은 도서관에서 주신 파일에 맞춰 바꿀 수 있어요.
            </p>
          </div>
          <div className="cd ">
            <div className="cdh">
              <h2 className="h3">독서기록 우수 참여자 상장</h2>
              <Chip k="line">미리보기</Chip>
            </div>
            <p className="sm mute">선정되면 열려요 · 상장 번호 [상장 번호]</p>
            <div className="paper">
              <div>
                <span
                  className="xs b"
                  style={{ letterSpacing: ".18em", color: "#2F7D5F" }}
                >
                  CERTIFICATE
                </span>
                <h3 className="h2">우수 참여자 상장</h3>
                <p className="mute sm">수상자 · [수상자]</p>
                <p style={{ maxWidth: "420px" }}>
                  독서기록 우수 참여자로 선정되어 이 상장을 드립니다.
                </p>
                <p className="xs mute">
                  [도서관 제공 양식 문구] · 2026 회차
                  <br />
                  [날짜] · 도봉도서관장 [직인]
                </p>
              </div>
            </div>
            <div className="acts">
              <Link to="/certificate" className="btn s">
                <Icon n="printer" s={14} sw={1.8} />
                인쇄
              </Link>
              <Link to="/certificate" className="btn s">
                <Icon n="download" s={14} sw={1.8} />
                PDF 저장
              </Link>
            </div>
            <p className="xs mute">
              양식은 도서관에서 주신 파일에 맞춰 바꿀 수 있어요.
            </p>
          </div>
        </div>
        <div
          className="cd m"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="h3">승인 알림은 홈과 알림에서 알려 드려요</h3>
            <p className="sm mute">
              승인 · 보완요청 · 완주 승인 결과가 나오면 참가자에게 알림이 가요.
            </p>
          </div>
          <Link to="/notifications" className="btn p">
            알림 보러 가기
          </Link>
        </div>
      </section>
    </UserLayout>
  );
}
