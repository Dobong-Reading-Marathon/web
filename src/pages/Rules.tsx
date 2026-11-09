import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Chip from "../components/Chip.tsx";
import Icon from "../components/Icon.tsx";
import Tower from "../components/Tower.tsx";
import UserLayout, { PlainLayout } from "../components/UserLayout.tsx";
import { formatCourseName, formatDate, useCurrentRound } from "../api/currentRound.ts";
import { getCurrentEnrollment, type CurrentEnrollment } from "../api/enrollments";
import { CurrentUserApiError, getCurrentUser } from "../api/users";

//피그마11_대회요강
export default function Rules() {
  const { round, loading, error } = useCurrentRound();
  const [enrollment, setEnrollment] = useState<CurrentEnrollment | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<"loading" | "member" | "guest">("loading");

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then(() => { if (!controller.signal.aborted) setAuthState("member"); })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setAuthState(cause instanceof CurrentUserApiError && cause.status !== 401 ? "member" : "guest");
        if (!(cause instanceof CurrentUserApiError) || cause.status === 401) setEnrollmentLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (authState !== "member") return;
    const controller = new AbortController();
    getCurrentEnrollment(controller.signal)
      .then(setEnrollment)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setEnrollmentError(cause instanceof Error ? cause.message : "참가 정보를 불러오지 못했습니다.");
      })
      .finally(() => { if (!controller.signal.aborted) setEnrollmentLoading(false); });
    return () => controller.abort();
  }, [authState]);

  const content = (
      <section className="content-section is-top">
        <div className={`page-banner${authState === "guest" ? " guest-rules-banner" : ""}`}>
          <Tower w={380} />
          <div className="page-heading-row">
            <div>
              <h1 className="page-title">대회 요강</h1>
              <p className="page-description">
                운영 기간과 코스 기준, 작성 요령을 한눈에 확인해요.
              </p>
            </div>
            {authState === "member" && <div className="action-group">
              <Link to={enrollment ? "/course-change" : "/join"} className="button button--primary">
                {enrollmentLoading ? "참가 정보 확인 중…" : enrollment ? "코스 변경" : "코스 선택 · 참가 신청"}
                <Icon n="arrow" s={16} sw={1.8} />
              </Link>
            </div>}
          </div>
        </div>
        {enrollmentError && <p className="text-extra-small text-muted" role="status">{enrollmentError}</p>}
        <div className="grid--two-columns">
          <div className="content-card ">
            <div className="content-card-header">
              <h2 className="card-title">대회 개요</h2>
            </div>
            <div
              className="data-row"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>운영 기간</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                {loading ? "불러오는 중…" : round ? `${formatDate(round.startDate)} ~ ${formatDate(round.endDate)}` : "-"}
              </span>
            </div>
            <div
              className="data-row"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>참가신청 기간 · 기록 제출 마감</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                {loading ? "불러오는 중…" : round ? `${formatDate(round.applyStart)} ~ ${formatDate(round.applyEnd)}` : "-"}
              </span>
            </div>
            <div
              className="data-row"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>코스 기준</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                {round ? `${round.courses.length}개 코스 · 쪽수·권수·서평 편수를 모두 채우면 완주` : loading ? "코스 정보를 불러오는 중입니다." : "코스 정보를 불러오지 못했습니다."}
              </span>
            </div>
            <div
              className="data-row"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
              }}
            >
              <b style={{ flex: "none" }}>시상 내용</b>
              <span style={{ textAlign: "right", color: "#38443F" }}>
                매달 우수 서평을 뽑고, 우수 참여자에게는 상장을
                드려요
              </span>
            </div>
          </div>
          <div className="content-card content-card--mint">
            <div className="content-card-header">
              <h2 className="card-title">작성 요령</h2>
            </div>
            <ul>
              <li className="data-row" style={{ alignItems: "flex-start" }}>
                <span className="step-number" style={{ background: "#D5E8DD" }}>
                  1
                </span>
                <span>
                  읽은 쪽 범위를 기록해요. 한 책에 여러 번 남길 수 있어요.
                </span>
              </li>
              <li className="data-row" style={{ alignItems: "flex-start" }}>
                <span className="step-number" style={{ background: "#D5E8DD" }}>
                  2
                </span>
                <span>
                  서평은 500자 이상 써요. 글자 수는 실시간으로 세어 줘요.
                </span>
              </li>
              <li className="data-row" style={{ alignItems: "flex-start" }}>
                <span className="step-number" style={{ background: "#D5E8DD" }}>
                  3
                </span>
                <span>도봉도서관 소장도서만 대출 권수에 반영돼요.</span>
              </li>
              <li className="data-row" style={{ alignItems: "flex-start" }}>
                <span className="step-number" style={{ background: "#D5E8DD" }}>
                  4
                </span>
                <span>글만 저장돼요. 이미지는 올릴 수 없어요.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="content-card ">
          <div className="content-card-header">
            <h2 className="card-title">코스별 기준</h2>
            {round && <Chip k="line">{round.year}년 {round.roundNo}회차 기준</Chip>}
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>코스</th>
                  <th>거리</th>
                  <th>쪽수</th>
                  <th>권수</th>
                  <th>서평</th>
                </tr>
              </thead>
              <tbody>
                {round?.courses.map((course) => (
                  <tr key={course.id}>
                    <td><b>{formatCourseName(course)}</b></td>
                    <td className="numeric-value">{course.distanceKm}km</td>
                    <td className="numeric-value">{new Intl.NumberFormat("ko-KR").format(course.targetPages)}쪽</td>
                    <td className="numeric-value">{course.targetBooks}권</td>
                    <td className="numeric-value">서평 {course.targetReviews}편</td>
                  </tr>
                ))}
                {loading && <tr><td colSpan={5}>코스 정보를 불러오는 중입니다.</td></tr>}
                {error && <tr><td colSpan={5}>{error}</td></tr>}
                {!loading && !error && round?.courses.length === 0 && <tr><td colSpan={5}>등록된 코스가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
  );

  if (authState === "loading") return <main role="status" style={{ padding: "48px max(40px, calc((100% - 1200px) / 2))", color: "#66756d" }}>대회 안내를 준비하고 있어요…</main>;
  return authState === "guest"
    ? <PlainLayout>{content}</PlainLayout>
    : <UserLayout active="rules">{content}</UserLayout>;
}
