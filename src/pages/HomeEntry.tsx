import { useEffect, useState } from "react";
import { getCurrentUser, CurrentUserApiError } from "../api/users";
import Home from "./Home";
import GuestHome from "./GuestHome";

export default function HomeEntry() {
  const [view, setView] = useState<"loading" | "member" | "guest" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then(() => setView("member"))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setView(error instanceof CurrentUserApiError && error.status !== 401 ? "error" : "guest");
      });
    return () => controller.abort();
  }, []);

  if (view === "loading") return <main className="home-entry-status" role="status">페이지를 준비하고 있어요…</main>;
  if (view === "member") return <Home />;
  if (view === "error") return <main className="home-entry-status" role="alert">홈 정보를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</main>;
  return <GuestHome />;
}
