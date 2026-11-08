import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Calendar from "./pages/Calendar.tsx";
import Rules from "./pages/Rules.tsx";
import Join from "./pages/Join.tsx";
import Certificate from "./pages/Certificate.tsx";
import Library from "./pages/Library.tsx";
import LibraryNotes from "./pages/LibraryNotes.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Notifications from "./pages/Notifications.tsx";

import ReadingRecord from "./pages/ReadingRecord.tsx";

import BookRegister from "./pages/BookRegister.tsx";
import Search from "./pages/Search.tsx";
import CourseChange from "./pages/CourseChange.tsx";


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app-shell app-shell--full">
      <ScrollToTop />
      <Routes>
        <Route path="/library" element={<Library />} />
        <Route path="/library/notes" element={<LibraryNotes />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/join" element={<Join />} />
        <Route path="/course-change" element={<CourseChange />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/records/new" element={<ReadingRecord />} />

        <Route path="/register" element={<BookRegister />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </div>
  );
}
