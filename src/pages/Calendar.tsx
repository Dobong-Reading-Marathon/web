import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";

//피그마 3
export default function Calendar() {
  return (
    <UserLayout active="cal">
      <section className="sec t">
        <div className="pb">
          <Tower w={380} />
          <div className="top">
            <div>
              <h1 className="h1">독서달력</h1>
              <p className="lead">날짜를 누르면 그날의 기록을 볼 수 있어요.</p>
            </div>
            <div className="acts"></div>
          </div>
        </div>
        <div className="g3">
          <div className="cd m n">
            <div className="kpi">
              <span>이달의 독서 일수</span>
              <b className="num">7일</b>
              <span>10월 12일까지 12일 중</span>
            </div>
          </div>
          <div className="cd m n">
            <div className="kpi">
              <span>이달에 읽은 책</span>
              <b className="num">5권</b>
              <span>완독 3권 · 읽는 중 2권</span>
            </div>
          </div>
          <div className="cd m n">
            <div className="kpi">
              <span>이달의 쪽수</span>
              <b className="num">937쪽</b>
              <span>= 0.94km</span>
            </div>
          </div>
        </div>
        <div className="g23">
          <div className="cd">
            <div className="sp">
              <div className="acts">
                <Link to="/calendar" className="bellb" aria-label="이전 달">
                  <Icon n="chl" s={18} sw={1.8} />
                </Link>
                <h2 className="h2">2026년 10월</h2>
                <Link to="/calendar" className="bellb" aria-label="다음 달">
                  <Icon n="chr" s={18} sw={1.8} />
                </Link>
              </div>
              <Link to="/calendar" className="btn s">
                오늘
              </Link>
            </div>
            <div className="cal">
              <div className="dw">일</div>
              <div className="dw">월</div>
              <div className="dw">화</div>
              <div className="dw">수</div>
              <div className="dw">목</div>
              <div className="dw">금</div>
              <div className="dw">토</div>
              <div className="d e"></div>
              <div className="d e"></div>
              <div className="d e"></div>
              <div className="d e"></div>
              <div className="d has">
                1
                <span className="s-ok">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    어린 왕자 1–60
                  </i>
                </span>
              </div>
              <div className="d">2</div>
              <div className="d has">
                3
                <span className="s-ok">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    어린 왕자 61–112
                  </i>
                </span>
              </div>
              <div className="d">4</div>
              <div className="d has f">
                5
                <span className="s-fix">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    불편한 편의점 1–140
                  </i>
                </span>
              </div>
              <div className="d has f">
                6
                <span className="s-fix">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    불편한 편의점 141–260
                  </i>
                </span>
              </div>
              <div className="d">7</div>
              <div className="d has">
                8
                <span className="s-ok">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    소년이 온다 1–215
                  </i>
                </span>
              </div>
              <div className="d">9</div>
              <div className="d has w">
                10
                <span className="s-wait">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    작별하지 않는다 1–210
                  </i>
                </span>
              </div>
              <div className="d has k sel">
                11
                <span className="s-draft">
                  <i style={{ fontStyle: "normal", color: "#38443F" }}>
                    데미안 1–140
                  </i>
                </span>
              </div>
              <div className="d td">12 · 오늘</div>
              <div className="d">13</div>
              <div className="d">14</div>
              <div className="d">15</div>
              <div className="d">16</div>
              <div className="d">17</div>
              <div className="d">18</div>
              <div className="d">19</div>
              <div className="d">20</div>
              <div className="d">21</div>
              <div className="d">22</div>
              <div className="d">23</div>
              <div className="d">24</div>
              <div className="d">25</div>
              <div className="d">26</div>
              <div className="d">27</div>
              <div className="d">28</div>
              <div className="d">29</div>
              <div className="d">30</div>
              <div className="d">31</div>
            </div>
            <div className="chips" style={{ alignItems: "center" }}>
              <span className="sm">
                <b className="s-draft">●</b> 임시저장
              </span>
              <span className="sm">
                <b className="s-wait">●</b> 심사 대기
              </span>
              <span className="sm">
                <b className="s-ok">●</b> 승인
              </span>
              <span className="sm">
                <b className="s-fix">●</b> 보완요청
              </span>
            </div>
            <p className="xs mute">칸의 글씨는 책 제목과 읽은 쪽이에요.</p>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="cd ">
              <div className="cdh">
                <h2 className="h3">10월 11일 일요일</h2>
                <Chip k="draft">임시저장</Chip>
              </div>
              <div
                style={{ display: "flex", gap: "14px", alignItems: "center" }}
              >
                <Cover ch="데" />
                <div>
                  <h3 className="h3">데미안</h3>
                  <p className="sm mute">헤르만 헤세 · 읽은 쪽 1–140</p>
                </div>
              </div>
              <div>
                <p className="sm b">마음에 드는 글귀</p>
                <p className="mute">[글귀 본문]</p>
              </div>
              <div>
                <p className="sm b">서평</p>
                <p className="mute">아직 쓰지 않았어요.</p>
              </div>
              <div className="acts">
                <Link to="/records/new" className="btn p">
                  이어서 쓰기
                </Link>
                <Link to="/records/new" className="btn">
                  이날 기록 추가
                </Link>
              </div>
            </div>
            <div className="cd m">
              <div className="cdh">
                <h2 className="h3">월별 독서 요약</h2>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <b>8월</b>
                <span className="mute">12일 · 6권 · 4,980쪽</span>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <b>9월</b>
                <span className="mute">17일 · 7권 · 6,533쪽</span>
              </div>
              <div className="rw" style={{ justifyContent: "space-between" }}>
                <b>10월</b>
                <span className="mute">7일 · 5권 · 937쪽</span>
              </div>
              <p className="xs mute">
                달력 기록은 임시저장·제출 상태와 관계없이 읽은 날짜 기준이에요.
                대회 누적 쪽수는 승인된 기록만 합산해요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
