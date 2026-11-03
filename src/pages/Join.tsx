import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Field from "../components/Field.tsx";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import { formatCourseCriteria, formatDate, useCurrentRound } from "../api/currentRound.ts";
//피그마12_참가신청

export default function Join() {
  const { round, loading, error } = useCurrentRound();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const courses = round?.courses ?? [];
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;

  useEffect(() => {
    if (selectedCourseId === null && courses.length > 0) setSelectedCourseId(courses[0].id);
  }, [courses, selectedCourseId]);

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
        {loading && <p className="text-small text-muted" role="status">회차와 코스 정보를 불러오는 중입니다.</p>}
        {error && <p className="text-small" role="alert">{error}</p>}
        {!loading && !error && courses.length === 0 && <p className="text-small" role="status">현재 회차에 등록된 코스가 없습니다.</p>}
        <div className="grid--three-columns">
          {courses.map((course) => (
            <label
              key={course.id}
              className={`content-card content-card--compact course-option${selectedCourseId === course.id ? " is-selected" : ""}`}
            >
              <span className="space-between-row">
                <b className="card-title">{course.name}{course.family ? " (가족)" : ""}</b>
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
              <span className="text-small text-muted">{formatCourseCriteria(course)}{course.family ? " · 가족 합산" : ""}</span>
              {selectedCourseId === course.id && <Chip k="ok">현재 선택</Chip>}
            </label>
          ))}
        </div>
        <div className="grid--two-columns" style={{ alignItems: "start" }}>
          {selectedCourse?.family && <div className="content-card content-card--mint">
            <div className="content-card-header">
              <h2 className="card-title">{selectedCourse.name} · 구성원 명단</h2>
              <Chip k="line">가족 코스를 고르면 열려요</Chip>
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
          </div>}
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
                  <span>{selectedCourse?.name ?? (loading ? "불러오는 중…" : "선택된 코스 없음")}</span>
                </div>
                <div className="is-active">
                  <span className="step-number">3</span>
                  <b>참가 신청</b>
                  <span>지금 단계</span>
                </div>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">회차</span>
                <b>{round ? `${round.year}년 ${round.roundNo}회차` : loading ? "불러오는 중…" : "-"}</b>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">코스</span>
                <b>{selectedCourse?.name ?? "-"}</b>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">완주 기준</span>
                <b>{selectedCourse ? formatCourseCriteria(selectedCourse) : "-"}</b>
              </div>
              <div className="data-row" style={{ justifyContent: "space-between" }}>
                <span className="text-muted">가족 구성원</span>
                <b>{selectedCourse?.family ? "가족 구성원 등록 필요" : selectedCourse ? "해당 없음" : "-"}</b>
              </div>
              {round?.applyOpen ? (
                <Link to="/" className="button button--primary button--extra-large is-large">참가 신청하기</Link>
              ) : (
                <button type="button" className="button button--primary button--extra-large is-large" disabled>참가 신청 기간이 아닙니다</button>
              )}
              {round && <p className="text-extra-small text-muted">신청 기간: {formatDate(round.applyStart)} ~ {formatDate(round.applyEnd)}</p>}
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
