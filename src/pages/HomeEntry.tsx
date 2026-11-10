import { useEffect, useState } from "react";
import { getCurrentUser, CurrentUserApiError } from "../api/users";
import { AUTH_STATE_CHANGED_EVENT } from "../api/client";
import Home from "./Home";
import GuestHome from "./GuestHome";

export default function HomeEntry() {
  const [view, setView] = useState<"loading" | "member" | "guest" | "error">("loading");

  useEffect(() => {
    let controller: AbortController | null = null;
    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      const currentController = controller;
      setView("loading");
      getCurrentUser(currentController.signal)
        .then(() => {
          if (!currentController.signal.aborted) setView("member");
        })
        .catch((error: unknown) => {
          if (currentController.signal.aborted) return;
          setView(error instanceof CurrentUserApiError && error.status !== 401 ? "error" : "guest");
        });
    };

    refresh();
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, refresh);
      controller?.abort();
    };
  }, []);

  if (view === "loading") return <main className="home-entry-status" role="status">페이지를 준비하고 있어요…</main>;
  if (view === "member") return <Home />;
  if (view === "error") return <main className="home-entry-status" role="alert">홈 정보를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</main>;
  return <GuestHome />;
}
