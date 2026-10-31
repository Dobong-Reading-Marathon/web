import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Calendar from "./pages/Calendar.tsx";
import Rules from "./pages/Rules.tsx";
import Join from "./pages/Join.tsx";
import Certificate from "./pages/Certificate.tsx";
import Library from "./pages/Library.tsx";
import LibraryNotes from "./pages/LibraryNotes.tsx";


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
        <Route path="/certificate" element={<Certificate />} />
      </Routes>
    </div>
  );
}
