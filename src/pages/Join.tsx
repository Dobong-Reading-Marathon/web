import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Field from "../components/Field.tsx";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
//피그마12
export default function Join() {
  return (
    <UserLayout active="">
      <section className="sec t">
        <div className="crumb">
          <Link to="/rules">대회 요강</Link>
          <Icon n="chr" s={14} sw={1.8} />
          코스 선택 · 참가 신청
        </div>
        <div className="pb">
          <Tower w={380} />
          <div className="top">
            <div>
              <h1 className="h1">코스 선택 · 참가 신청</h1>
              <p className="lead">코스를 고르고 이번 회차에 참가 신청해요.</p>
            </div>
            <div className="acts"></div>
          </div>
        </div>
        <div className="g3">
          <label className="cd n" style={{ gap: "6px" }}>
            <span className="sp">
              <b className="h3">3km</b>
              <input
                type="radio"
                name="course"
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2F7D5F",
                }}
                aria-label="3km"
              />
            </span>
            <span className="sm mute">3,000쪽 · 5권 · 서평 2편</span>
          </label>
          <label className="cd n" style={{ gap: "6px" }}>
            <span className="sp">
              <b className="h3">5km</b>
              <input
                type="radio"
                name="course"
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2F7D5F",
                }}
                aria-label="5km"
              />
            </span>
            <span className="sm mute">5,000쪽 · 8권 · 서평 3편</span>
          </label>
          <label className="cd n" style={{ gap: "6px" }}>
            <span className="sp">
              <b className="h3">10km</b>
              <input
                type="radio"
                name="course"
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2F7D5F",
                }}
                aria-label="10km"
              />
            </span>
            <span className="sm mute">10,000쪽 · 15권 · 서평 6편</span>
          </label>
          <label
            className="cd n"
            style={{
              gap: "6px",
              border: "2px solid #2F7D5F",
              background: "#E7F2EC",
            }}
          >
            <span className="sp">
              <b className="h3">하프 · 21km</b>
              <input
                type="radio"
                name="course"
                defaultChecked
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2F7D5F",
                }}
                aria-label="하프 · 21km"
              />
            </span>
            <span className="sm mute">21,000쪽 · 30권 · 서평 12편</span>
            <Chip k="ok">현재 선택</Chip>
          </label>
          <label className="cd n" style={{ gap: "6px" }}>
            <span className="sp">
              <b className="h3">풀 · 42km</b>
              <input
                type="radio"
                name="course"
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2F7D5F",
                }}
                aria-label="풀 · 42km"
              />
            </span>
            <span className="sm mute">42,000쪽 · 60권 · 서평 24편</span>
          </label>
          <label className="cd n" style={{ gap: "6px" }}>
            <span className="sp">
              <b className="h3">가족 풀코스</b>
              <input
                type="radio"
                name="course"
                style={{
                  width: "20px",
                  height: "20px",
                  accentColor: "#2F7D5F",
                }}
                aria-label="가족 풀코스"
              />
            </span>
            <span className="sm mute">
              42,000쪽 · 60권 · 서평 24편 · 가족 합산
            </span>
          </label>
        </div>
        <div className="g2" style={{ alignItems: "start" }}>
          <div className="cd m">
            <div className="cdh">
              <h2 className="h3">가족 풀코스 · 구성원 명단</h2>
              <Chip k="line">가족 풀코스를 고르면 열려요</Chip>
            </div>
            <p className="sm mute">
              가족 구성원을 등록하면 기록이 가족 합산으로 집계돼요. 아동도서
              2권은 1권으로 환산해요.
            </p>
            <div className="g2s">
              <Field label="구성원 이름" ph="" typ="text" />
              <Field label="학년 등 메모" ph="" typ="text" opt />
            </div>
            <div className="g2s">
              <Field label="구성원 이름" ph="" typ="text" />
              <Field label="학년 등 메모" ph="" typ="text" opt />
            </div>
            <Link to="/join" className="lnk">
              <Icon n="plus" s={16} sw={1.8} />
              구성원 추가
            </Link>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="cd ">
              <div className="cdh">
                <h2 className="h3">회차 참가 신청</h2>
              </div>
              <div
                className="steps"
                style={{ gridTemplateColumns: "repeat(3,1fr)" }}
              >
                <div>
                  <span className="stn">1</span>
                  <b>회원가입</b>
                  <span>완료</span>
                </div>
                <div>
                  <span className="stn">2</span>
                  <b>코스 선택</b>
                  <span>하프</span>
                </div>
                <div className="on">
                  <span className="stn">3</span>
                  <b>참가 신청</b>
                  <span>지금 단계</span>
                </div>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <span className="mute">회차</span>
                <b>2026 회차</b>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <span className="mute">코스</span>
                <b>하프 · 21km</b>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <span className="mute">완주 기준</span>
                <b>21,000쪽 · 30권 · 서평 12편</b>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <span className="mute">가족 구성원</span>
                <b>해당 없음</b>
              </div>
              <Link to="/" className="btn p x l">
                참가 신청하기
              </Link>
              <p className="xs mute">
                첫 가입이라면 가입 직후 이어서 신청해요. 2년 차부터 기존 회원은
                가입 없이 로그인 후 바로 신청해요.
              </p>
            </div>
            <div className="cd m">
              <div className="cdh">
                <h2 className="h3">코스 변경</h2>
              </div>
              <p className="sm mute">
                참가신청 기간 중에는 코스를 바꿀 수 있어요. 지금까지의 기록은
                그대로 유지돼요.
              </p>
              <Link to="/join" className="btn">
                다른 코스로 변경
              </Link>
              <div className="note y">
                <Icon n="lock" s={18} sw={1.8} />
                <div>
                  <b>이미 신청한 회차예요.</b>
                  <br />
                  같은 회차에는 한 번만 신청할 수 있어요. 코스를 바꾸려면 ‘코스
                  변경’을 이용해 주세요.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
