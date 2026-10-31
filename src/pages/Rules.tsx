import { Link } from "react-router-dom";
import Chip from "../components/Chip.tsx";
import Icon from "../components/Icon.tsx";
import Tower from "../components/Tower.tsx";
import UserLayout from "../components/UserLayout.tsx";

//피그마11
export default function Rules() {
  return (
    <UserLayout active="rules">
      <section className="sec t">
        <div className="pb">
          <Tower w={380} />
          <div className="top">
            <div>
              <h1 className="h1">대회 요강</h1>
              <p className="lead">
                운영 기간과 코스 기준, 작성 요령을 한눈에 확인해요.
              </p>
            </div>
            <div className="acts">
              <Link to="/join" className="btn p">
                코스 선택 · 참가 신청
                <Icon n="arrow" s={16} sw={1.8} />
              </Link>
            </div>
          </div>
        </div>
        <div className="g2">
          <div className="cd ">
            <div className="cdh">
              <h2 className="h3">대회 개요</h2>
            </div>
            <div
              className="rw"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>운영 기간</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                [운영 기간]
              </span>
            </div>
            <div
              className="rw"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>참가신청 기간 · 기록 제출 마감</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                [날짜]
              </span>
            </div>
            <div
              className="rw"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>코스 기준</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                6개 코스 · 쪽수·권수·서평 편수를 모두 채우면 완주
              </span>
            </div>
            <div
              className="rw"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>시상 내용</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                [시상 내용] · 매달 우수 서평을 뽑고, 우수 참여자에게는 상장을
                드려요
              </span>
            </div>
          </div>
          <div className="cd m">
            <div className="cdh">
              <h2 className="h3">작성 요령</h2>
            </div>
            <ul>
              <li className="rw" style={{ alignItems: "flex-start" }}>
                <span className="stn" style={{ background: "#D5E8DD" }}>
                  1
                </span>
                <span>
                  읽은 쪽 범위를 기록해요. 한 책에 여러 번 남길 수 있어요.
                </span>
              </li>
              <li className="rw" style={{ alignItems: "flex-start" }}>
                <span className="stn" style={{ background: "#D5E8DD" }}>
                  2
                </span>
                <span>
                  서평은 500자 이상 써요. 글자 수는 실시간으로 세어 줘요.
                </span>
              </li>
              <li className="rw" style={{ alignItems: "flex-start" }}>
                <span className="stn" style={{ background: "#D5E8DD" }}>
                  3
                </span>
                <span>도봉도서관 소장도서만 대출 권수에 반영돼요.</span>
              </li>
              <li className="rw" style={{ alignItems: "flex-start" }}>
                <span className="stn" style={{ background: "#D5E8DD" }}>
                  4
                </span>
                <span>글만 저장돼요. 이미지는 올릴 수 없어요.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="cd ">
          <div className="cdh">
            <h2 className="h3">코스별 기준</h2>
            <Chip k="line">기준 수치는 예시예요</Chip>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>코스</th>
                  <th>쪽수</th>
                  <th>권수</th>
                  <th>서평</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>3km</b>
                  </td>
                  <td className="num">3,000쪽</td>
                  <td className="num">5권</td>
                  <td className="num">서평 2편</td>
                </tr>
                <tr>
                  <td>
                    <b>5km</b>
                  </td>
                  <td className="num">5,000쪽</td>
                  <td className="num">8권</td>
                  <td className="num">서평 3편</td>
                </tr>
                <tr>
                  <td>
                    <b>10km</b>
                  </td>
                  <td className="num">10,000쪽</td>
                  <td className="num">15권</td>
                  <td className="num">서평 6편</td>
                </tr>
                <tr>
                  <td>
                    <b>하프 · 21km</b>
                  </td>
                  <td className="num">21,000쪽</td>
                  <td className="num">30권</td>
                  <td className="num">서평 12편</td>
                </tr>
                <tr>
                  <td>
                    <b>풀 · 42km</b>
                  </td>
                  <td className="num">42,000쪽</td>
                  <td className="num">60권</td>
                  <td className="num">서평 24편</td>
                </tr>
                <tr>
                  <td>
                    <b>가족 풀코스</b>
                  </td>
                  <td className="num">42,000쪽</td>
                  <td className="num">60권</td>
                  <td className="num">서평 24편</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
