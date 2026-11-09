import { useEffect } from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import Calendar from "./pages/Calendar.tsx";
import Rules from "./pages/Rules.tsx";
import Join from "./pages/Join.tsx";
import Certificate from "./pages/Certificate.tsx";
import Library from "./pages/Library.tsx";
import LibraryNotes from "./pages/LibraryNotes.tsx";
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
import AdminReviews from "./pages/AdminReviews.tsx";
import AdminRounds from "./pages/AdminRounds.tsx";


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
      <Routes>
        <Route path="/" element={<HomeEntry />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/notes" element={<LibraryNotes />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/join" element={<Join />} />
        <Route path="/course-change" element={<CourseChange />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/records/new" element={<ReadingRecord key="new" />} />
        <Route path="/records/:id/edit" element={<ReadingRecordEdit />} />

        <Route path="/register" element={<BookRegister />} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/participants" element={<AdminParticipants />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/rounds" element={<AdminRounds />} />
      </Routes>
    </div>
  );
}
