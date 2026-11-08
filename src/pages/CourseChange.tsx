import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip";
import Icon from "../components/Icon";
import Tower from "../components/Tower";
import UserLayout from "../components/UserLayout";
import { formatCourseCriteria, useCurrentRound } from "../api/currentRound";
import { getCurrentEnrollment, type CurrentEnrollment } from "../api/enrollments";

export default function CourseChange() {
  const { round, loading: roundLoading, error: roundError } = useCurrentRound();
  const [enrollment, setEnrollment] = useState<CurrentEnrollment | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const courses = round?.courses ?? [];
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    getCurrentEnrollment(controller.signal)
      .then((current) => {
        setEnrollment(current);
        setSelectedCourseId(current?.course.id ?? null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setEnrollmentError(cause instanceof Error ? cause.message : "참가 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setEnrollmentLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <UserLayout active="">
      <section className="content-section is-top">
        <div className="breadcrumb">
          <Link to="/rules">대회 요강</Link>
          <Icon n="chr" s={14} sw={1.8} />
          코스 변경
        </div>
        <div className="page-banner">
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">코스 변경</h1>
              <p className="page-description">현재 참가 코스와 변경할 코스를 확인해요.</p>
            </div>
          </div>
        </div>

        {(roundLoading || enrollmentLoading) && <p className="text-small text-muted" role="status">회차와 참가 정보를 불러오는 중입니다.</p>}
        {roundError && <p className="text-small" role="alert">{roundError}</p>}
        {enrollmentError && <p className="text-small" role="alert">{enrollmentError}</p>}
        {!enrollmentLoading && !enrollment && <div className="content-card" role="status">
          <p className="text-small">현재 참가 신청 정보가 없습니다.</p>
          <Link to="/join" className="button button--primary">코스 선택 · 참가 신청</Link>
        </div>}
        {enrollment && <>
          <div className="content-card content-card--mint">
            <div className="content-card-header">
              <h2 className="card-title">현재 신청 코스</h2>
              <Chip k="ok">{enrollment.course.name}</Chip>
            </div>
            <p className="text-small text-muted">{formatCourseCriteria(enrollment.course)}</p>
          </div>
          <div className="grid--three-columns">
            {courses.map((course) => (
              <label key={course.id} className={`content-card content-card--compact course-option${selectedCourseId === course.id ? " is-selected" : ""}`}>
                <span className="space-between-row">
                  <b className="card-title">{course.name}{course.family ? " (가족)" : ""}</b>
                  <input
                    type="radio"
                    name="course-change"
                    value={course.id}
                    checked={selectedCourseId === course.id}
                    onChange={() => setSelectedCourseId(course.id)}
                    style={{ width: "20px", height: "20px", accentColor: "#2F7D5F" }}
                    aria-label={course.name}
                  />
                </span>
                <span className="text-small text-muted">{formatCourseCriteria(course)}{course.family ? " · 가족 합산" : ""}</span>
                {course.id === enrollment.course.id && <Chip k="ok">현재 신청 코스</Chip>}
                {selectedCourseId === course.id && course.id !== enrollment.course.id && <Chip k="line">변경 선택</Chip>}
              </label>
            ))}
          </div>
          {round?.courses.length === 0 && !roundLoading && <p className="text-small text-muted">현재 회차에 등록된 코스가 없습니다.</p>}
          <div className="content-card">
            <div className="content-card-header"><h2 className="card-title">변경할 코스</h2></div>
            <div className="data-row" style={{ justifyContent: "space-between" }}><span className="text-muted">선택한 코스</span><b>{selectedCourse?.name ?? "-"}</b></div>
            <div className="data-row" style={{ justifyContent: "space-between" }}><span className="text-muted">완주 기준</span><b>{selectedCourse ? formatCourseCriteria(selectedCourse) : "-"}</b></div>
            <div className="notice notice--warning">
              <Icon n="lock" s={18} sw={1.8} />
              <div>화면에서 코스를 선택할 수 있지만, 서버 명세에 변경 API가 아직 없어 저장은 지원되지 않습니다. 참가 신청 API를 다시 호출하면 이미 신청했다는 409가 반환됩니다.</div>
            </div>
            <div className="action-group">
              <button type="button" className="button button--primary" disabled>코스 변경 API 미제공</button>
              <Link to="/rules" className="button">대회 요강으로</Link>
            </div>
          </div>
        </>}
      </section>
    </UserLayout>
  );
}
