import { useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Field from "../components/Field.tsx";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
//피그마12
const courses = [
  { id: "3km", name: "3km", criteria: "3,000쪽 · 5권 · 서평 2편", family: false },
  { id: "5km", name: "5km", criteria: "5,000쪽 · 8권 · 서평 3편", family: false },
  { id: "10km", name: "10km", criteria: "10,000쪽 · 15권 · 서평 6편", family: false },
  { id: "half", name: "하프 · 21km", criteria: "21,000쪽 · 30권 · 서평 12편", family: false },
  { id: "full", name: "풀 · 42km", criteria: "42,000쪽 · 60권 · 서평 24편", family: false },
  { id: "family", name: "가족 풀코스", criteria: "42,000쪽 · 60권 · 서평 24편 · 가족 합산", family: true },
];

export default function Join() {
  const [selectedCourseId, setSelectedCourseId] = useState("half");
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[3];

  return (
    <UserLayout active="">
      <section className="content-section is-top">
        <div className="breadcrumb">
          <Link to="/rules">대회 요강</Link>
          <Icon n="chr" s={14} sw={1.8} />
          코스 선택 · 참가 신청
        </div>
        <div className="page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">코스 선택 · 참가 신청</h1>
              <p className="page-description">코스를 고르고 이번 회차에 참가 신청해요.</p>
            </div>
            <div className="action-group"></div>
          </div>
        </div>
        <div className="grid--three-columns">
          {courses.map((course) => (
            <label
              key={course.id}
              className={`content-card content-card--compact course-option${selectedCourseId === course.id ? " is-selected" : ""}`}
            >
              <span className="space-between-row">
                <b className="card-title">{course.name}</b>
                <input
                  type="radio"
                  name="course"
                  value={course.id}
                  checked={selectedCourseId === course.id}
                  onChange={() => setSelectedCourseId(course.id)}
                  style={{ width: "20px", height: "20px", accentColor: "#2F7D5F" }}
                  aria-label={course.name}
                />
              </span>
              <span className="text-small text-muted">{course.criteria}</span>
              {selectedCourseId === course.id && <Chip k="ok">현재 선택</Chip>}
            </label>
          ))}
        </div>
        <div className="grid--two-columns" style={{ alignItems: "start" }}>
          <div className="content-card content-card--mint">
            <div className="content-card-header">
              <h2 className="card-title">가족 풀코스 · 구성원 명단</h2>
              <Chip k="line">가족 풀코스를 고르면 열려요</Chip>
            </div>
            <p className="text-small text-muted">
              가족 구성원을 등록하면 기록이 가족 합산으로 집계돼요. 아동도서
              2권은 1권으로 환산해요.
            </p>
            <div className="grid--two-small-columns">
              <Field label="구성원 이름" ph="" typ="text" />
              <Field label="학년 등 메모" ph="" typ="text" opt />
            </div>
            <div className="grid--two-small-columns">
              <Field label="구성원 이름" ph="" typ="text" />
              <Field label="학년 등 메모" ph="" typ="text" opt />
            </div>
            <Link to="/join" className="inline-link">
              <Icon n="plus" s={16} sw={1.8} />
              구성원 추가
            </Link>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div className="content-card ">
              <div className="content-card-header">
                <h2 className="card-title">회차 참가 신청</h2>
              </div>
              <div
                className="step-list"
                style={{ gridTemplateColumns: "repeat(3,1fr)" }}
              >
                <div>
                  <span className="step-number">1</span>
                  <b>회원가입</b>
                  <span>완료</span>
                </div>
                <div>
                  <span className="step-number">2</span>
                  <b>코스 선택</b>
                  <span>{selectedCourse.name}</span>
                </div>
                <div className="is-active">
                  <span className="step-number">3</span>
                  <b>참가 신청</b>
                  <span>지금 단계</span>
                </div>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">회차</span>
                <b>2026 회차</b>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">코스</span>
                <b>{selectedCourse.name}</b>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">완주 기준</span>
                <b>{selectedCourse.criteria}</b>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">가족 구성원</span>
                <b>{selectedCourse.family ? "가족 구성원 등록 필요" : "해당 없음"}</b>
              </div>
              <Link to="/" className="button button--primary button--extra-large is-large">
                참가 신청하기
              </Link>
              <p className="text-extra-small text-muted">
                첫 가입이라면 가입 직후 이어서 신청해요. 2년 차부터 기존 회원은
                가입 없이 로그인 후 바로 신청해요.
              </p>
            </div>
            <div className="content-card content-card--mint">
              <div className="content-card-header">
                <h2 className="card-title">코스 변경</h2>
              </div>
              <p className="text-small text-muted">
                참가신청 기간 중에는 코스를 바꿀 수 있어요. 지금까지의 기록은
                그대로 유지돼요.
              </p>
              <Link to="/join" className="button">
                다른 코스로 변경
              </Link>
              <div className="notice notice--warning">
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
