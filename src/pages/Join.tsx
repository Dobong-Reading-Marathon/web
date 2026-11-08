import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import { formatCourseCriteria, formatDate, useCurrentRound } from "../api/currentRound.ts";
import { applyForEnrollment, EnrollmentApiError, getCurrentEnrollment, type CurrentEnrollment } from "../api/enrollments";
//피그마12_참가신청

export default function Join() {
  const { round, loading, error } = useCurrentRound();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<CurrentEnrollment | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState<string | null>(null);
  const courses = round?.courses ?? [];
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    getCurrentEnrollment(controller.signal)
      .then((enrollment) => setCurrentEnrollment(enrollment))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setApplicationError(cause instanceof Error ? cause.message : "참가 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setEnrollmentLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (currentEnrollment) {
      setSelectedCourseId(currentEnrollment.course.id);
    } else if (selectedCourseId === null && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, currentEnrollment, selectedCourseId]);

  async function handleApply() {
    if (selectedCourseId === null) return;
    setApplicationLoading(true);
    setApplicationError(null);
    setApplicationMessage(null);
    try {
      const enrollment = await applyForEnrollment(selectedCourseId);
      setCurrentEnrollment(enrollment);
      setApplicationMessage(`${enrollment.course.name} 신청이 완료됐어요.`);
    } catch (cause) {
      if (cause instanceof EnrollmentApiError && cause.code === "ALREADY_ENROLLED") {
        setApplicationError("이미 이번 회차에 참가 신청했어요. 코스 변경은 별도 변경 기능이 필요합니다.");
        const enrollment = await getCurrentEnrollment().catch(() => null);
        setCurrentEnrollment(enrollment);
      } else {
        setApplicationError(cause instanceof Error ? cause.message : "참가 신청을 완료하지 못했습니다.");
      }
    } finally {
      setApplicationLoading(false);
    }
  }

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
        {(loading || enrollmentLoading) && <p className="text-small text-muted" role="status">회차와 참가 정보를 불러오는 중입니다.</p>}
        {error && <p className="text-small" role="alert">{error}</p>}
        {applicationError && <p className="text-small" role="alert">{applicationError}</p>}
        {applicationMessage && <p className="text-small" role="status">{applicationMessage}</p>}
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
              {currentEnrollment?.course.id === course.id && <Chip k="ok">현재 신청 코스</Chip>}
              {!currentEnrollment && selectedCourseId === course.id && <Chip k="line">선택한 코스</Chip>}
            </label>
          ))}
        </div>
        <div className="grid--two-columns" style={{ alignItems: "start" }}>
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
              {currentEnrollment ? (
                <div className="notice notice--warning">
                  <Icon n="lock" s={18} sw={1.8} />
                  <div><b>이미 참가 신청했어요.</b><br />현재 코스: {currentEnrollment.course.name}</div>
                </div>
              ) : round?.applyOpen ? (
                <button type="button" className="button button--primary button--extra-large is-large" onClick={() => void handleApply()} disabled={loading || enrollmentLoading || applicationLoading || selectedCourseId === null}>
                  {applicationLoading ? "신청 중…" : "참가 신청하기"}
                </button>
              ) : (
                <button type="button" className="button button--primary button--extra-large is-large" disabled>참가 신청 기간이 아닙니다</button>
              )}
              {round && <p className="text-extra-small text-muted">신청 기간: {formatDate(round.applyStart)} ~ {formatDate(round.applyEnd)}</p>}
              <p className="text-extra-small text-muted">
                첫 가입이라면 가입 직후 이어서 신청해요. 2년 차부터 기존 회원은
                가입 없이 로그인 후 바로 신청해요.
              </p>
            </div>
            {currentEnrollment && <div className="content-card content-card--mint">
              <div className="content-card-header">
                <h2 className="card-title">현재 참가 신청</h2>
              </div>
              <p className="text-small text-muted">{currentEnrollment.course.name} · {formatCourseCriteria(currentEnrollment.course)}</p>
              <Link to="/course-change" className="button">코스 변경 화면 보기</Link>
              <p className="text-extra-small text-muted">코스 변경 API가 제공되기 전에는 이 화면에서 신청 내용을 저장할 수 없어요.</p>
            </div>}
          </div>
        </div>
      </section>
    </UserLayout>
  );
}
