import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import Calendar from "./pages/Calendar.tsx";
import Rules from "./pages/Rules.tsx";
import Join from "./pages/Join.tsx";
import Certificate from "./pages/Certificate.tsx";
import Library from "./pages/Library.tsx";
import LibraryNotes from "./pages/LibraryNotes.tsx";
import LibraryBooks from "./pages/LibraryBooks.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicy.tsx";
import Notifications from "./pages/Notifications.tsx";

import ReadingRecord from "./pages/ReadingRecord.tsx";

import BookRegister from "./pages/BookRegister.tsx";
import Search from "./pages/Search.tsx";
import CourseChange from "./pages/CourseChange.tsx";
import HomeEntry from "./pages/HomeEntry.tsx";
import AdminOverview from "./pages/AdminOverview.tsx";
import AdminParticipants from "./pages/AdminParticipants.tsx";
import AdminParticipantRecords from "./pages/AdminParticipantRecords.tsx";
import AdminReviews from "./pages/AdminReviews.tsx";
import AdminRounds from "./pages/AdminRounds.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import RequireUser from "./components/RequireUser.tsx";
import { AUTHENTICATION_REQUIRED_EVENT, clearAuthToken } from "./api/client";

const USER_ONLY_PATHS = [
  "/library", "/calendar", "/join", "/course-change", "/certificate",
  "/notifications", "/records", "/register", "/search",
];

function isPathWithin(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function AuthenticationRedirect() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onAuthenticationRequired = (event: Event) => {
      const detail = (event as CustomEvent<{ path: string; admin: boolean }>).detail;
      // Public pages use this request to decide whether to show guest content.
      if (detail.path === "/api/users/me") return;

      const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
      const userPage = USER_ONLY_PATHS.some((basePath) => isPathWithin(pathname, basePath));
      if (detail.admin && adminPage && pathname !== "/admin/login") {
        clearAuthToken();
        navigate("/admin/login", { replace: true, state: { authNotice: "관리자 로그인이 필요합니다." } });
      } else if (!detail.admin && userPage) {
        clearAuthToken();
        navigate("/login", { replace: true, state: { authNotice: "로그인이 필요합니다." } });
      }
    };

    window.addEventListener(AUTHENTICATION_REQUIRED_EVENT, onAuthenticationRequired);
    return () => window.removeEventListener(AUTHENTICATION_REQUIRED_EVENT, onAuthenticationRequired);
  }, [navigate, pathname]);

  return null;
}


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// 새 기록과 수정 화면이 서로 바뀔 때 입력 상태가 남지 않도록 key로 화면을 새로 만듭니다.
function ReadingRecordEdit() {
  const { id } = useParams();
  return <ReadingRecord key={id} editId={Number(id)} />;
}

export default function App() {
  return (
    <div className="app-shell app-shell--full">
      <ScrollToTop />
      <AuthenticationRedirect />
      <Routes>
        <Route path="/" element={<HomeEntry />} />
        <Route path="/library" element={<RequireUser><Library /></RequireUser>} />
        <Route path="/library/notes" element={<RequireUser><LibraryNotes /></RequireUser>} />
        <Route path="/library/books" element={<RequireUser><LibraryBooks /></RequireUser>} />
        <Route path="/calendar" element={<RequireUser><Calendar /></RequireUser>} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/join" element={<RequireUser><Join /></RequireUser>} />
        <Route path="/course-change" element={<RequireUser><CourseChange /></RequireUser>} />
        <Route path="/certificate" element={<RequireUser><Certificate /></RequireUser>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/notifications" element={<RequireUser><Notifications /></RequireUser>} />
        <Route path="/records/new" element={<RequireUser><ReadingRecord key="new" /></RequireUser>} />
        <Route path="/records/:id/edit" element={<RequireUser><ReadingRecordEdit /></RequireUser>} />

        <Route path="/register" element={<RequireUser><BookRegister /></RequireUser>} />
        <Route path="/search" element={<RequireUser><Search /></RequireUser>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/participants" element={<AdminParticipants />} />
        <Route path="/admin/participants/:enrollmentId/records" element={<AdminParticipantRecords />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/rounds" element={<AdminRounds />} />
      </Routes>
    </div>
  );
}
