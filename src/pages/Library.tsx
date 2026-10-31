import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Cover from "../components/Cover";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";

//피그마 2,5
export default function Library() {
  return (
    <UserLayout active="lib">
      <section className="sec t">
        <div className="pb">
          <Tower w={380} />
          <div className="top">
            <div>
              <h1 className="h1">내서재</h1>
              <p className="lead">
                등록한 도서들과 독서기록을 한곳에서 관리해요.
              </p>
            </div>
            <div className="acts">
              <Link to="/library/notes" className="btn">
                <Icon n="printer" s={16} sw={1.8} />
                기록장 인쇄 · PDF
              </Link>
              <Link to="/books/new" className="btn p">
                <Icon n="plus" s={16} sw={1.8} />
                도서 등록
              </Link>
            </div>
          </div>
        </div>
        <div className="sp" style={{ flexWrap: "wrap", gap: "16px" }}>
          <label
            className="fld"
            style={{ flex: "1 1 280px", position: "relative" }}
          >
            <span style={{ position: "absolute", left: "-9999px" }}>
              내서재 검색
            </span>
            <input className="in" placeholder="내서재에서 도서·기록 검색" />
          </label>
          <div className="seg">
            <Link to="/library" className="on">
              <Icon n="grid" s={16} sw={1.8} />
              카드형
            </Link>
            <Link to="/library/notes">
              <Icon n="list" s={16} sw={1.8} />
              수첩형
            </Link>
          </div>
        </div>
        <div className="chips">
          <span className="fc on">
            전체 <i>6</i>
          </span>
          <span className="fc">
            임시저장 <i>1</i>
          </span>
          <span className="fc">
            심사 대기 <i>1</i>
          </span>
          <span className="fc">
            승인 <i>2</i>
          </span>
          <span className="fc">
            보완요청 <i>1</i>
          </span>
          <span className="fc">
            기록 전 <i>1</i>
          </span>
        </div>
        <div className="g3">
          <Link
            to="/library/notes"
            className="cd n"
            style={{ gap: "14px", color: "#14231F" }}
          >
            <div className="sp" style={{ alignItems: "flex-start" }}>
              <Cover ch="불" />
              <span className="chip c-fix">보완요청</span>
            </div>
            <div>
              <h3 className="h3">불편한 편의점</h3>
              <p className="sm mute">김호연</p>
            </div>
            <div className="chips">
              <Chip k="line">소장도서</Chip>
            </div>
            <div className="bar">
              <i style={{ width: "97%" }}></i>
            </div>
            <p className="sm mute">읽은 쪽 260 / 268쪽</p>
            <p className="xs mute">상세 보는 중</p>
          </Link>
          <Link
            to="/library/notes"
            className="cd n"
            style={{
              border: "2px solid #2F7D5F",
              gap: "14px",
              color: "#14231F",
            }}
          >
            <div className="sp" style={{ alignItems: "flex-start" }}>
              <Cover ch="데" />
              <span className="chip c-draft">임시저장</span>
            </div>
            <div>
              <h3 className="h3">데미안</h3>
              <p className="sm mute">헤르만 헤세</p>
            </div>
            <div className="chips">
              <Chip k="line">소장도서</Chip>
            </div>
            <div className="bar">
              <i style={{ width: "56%" }}></i>
            </div>
            <p className="sm mute">읽은 쪽 140 / 248쪽</p>
            <p className="xs mute">일괄 제출에 포함</p>
          </Link>
          <Link
            to="/library/notes"
            className="cd n"
            style={{ gap: "14px", color: "#14231F" }}
          >
            <div className="sp" style={{ alignItems: "flex-start" }}>
              <Cover ch="작" />
              <span className="chip c-wait">심사 대기</span>
            </div>
            <div>
              <h3 className="h3">작별하지 않는다</h3>
              <p className="sm mute">한강</p>
            </div>
            <div className="chips">
              <Chip k="line">소장도서</Chip>
            </div>
            <div className="bar">
              <i style={{ width: "63%" }}></i>
            </div>
            <p className="sm mute">읽은 쪽 210 / 332쪽</p>
            <p className="xs mute">심사 중에는 수정할 수 있어요</p>
          </Link>
          <Link
            to="/library/notes"
            className="cd n"
            style={{ gap: "14px", color: "#14231F" }}
          >
            <div className="sp" style={{ alignItems: "flex-start" }}>
              <Cover ch="소" />
              <span className="chip c-ok">승인</span>
            </div>
            <div>
              <h3 className="h3">소년이 온다</h3>
              <p className="sm mute">한강</p>
            </div>
            <div className="chips">
              <Chip k="line">소장도서</Chip>
              <Chip k="info">완독</Chip>
            </div>
            <div className="bar">
              <i style={{ width: "100%" }}></i>
            </div>
            <p className="sm mute">읽은 쪽 215 / 215쪽</p>
            <p className="xs mute">승인된 기록은 수정할 수 없어요</p>
          </Link>
          <Link
            to="/library/notes"
            className="cd n"
            style={{ gap: "14px", color: "#14231F" }}
          >
            <div className="sp" style={{ alignItems: "flex-start" }}>
              <Cover ch="어" />
              <span className="chip c-ok">승인</span>
            </div>
            <div>
              <h3 className="h3">어린 왕자</h3>
              <p className="sm mute">생텍쥐페리</p>
            </div>
            <div className="chips">
              <Chip k="line">소장도서</Chip>
              <Chip k="info">아동도서</Chip>
            </div>
            <div className="bar">
              <i style={{ width: "100%" }}></i>
            </div>
            <p className="sm mute">읽은 쪽 112 / 112쪽</p>
            <p className="xs mute">아동도서 2권은 1권으로 환산</p>
          </Link>
          <Link
            to="/library/notes"
            className="cd n"
            style={{ gap: "14px", color: "#14231F" }}
          >
            <div className="sp" style={{ alignItems: "flex-start" }}>
              <Cover ch="모" />
              <span className="chip c-line">기록 전</span>
            </div>
            <div>
              <h3 className="h3">모모</h3>
              <p className="sm mute">미하엘 엔데</p>
            </div>
            <div className="chips">
              <Chip k="line">소장 아님</Chip>
            </div>
            <div className="bar">
              <i style={{ width: "0%" }}></i>
            </div>
            <p className="sm mute">읽은 쪽 0 / 336쪽</p>
            <p className="xs mute">첫 기록 쓰기 →</p>
          </Link>
        </div>
        <div
          className="cd k n"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            borderRadius: "999px",
            padding: "14px 14px 14px 28px",
          }}
        >
          <div>
            <b>임시저장 1건을 선택했어요</b>
            <p className="sm" style={{ color: "#D5E8DD" }}>
              제출하면 관리자 접수함으로 가고 상태가 ‘심사 대기’로 바뀌어요.
            </p>
          </div>
          <div className="acts">
            <Link to="/library" className="btn g s">
              선택 해제
            </Link>
            <Link to="/library" className="btn w s">
              선택한 기록 일괄 제출
            </Link>
          </div>
        </div>
        <Link to="/search" className="lnk">
          전체 기록 통합 검색
          <Icon n="arrow" s={16} sw={1.8} />
        </Link>
      </section>
    </UserLayout>
  );
}
