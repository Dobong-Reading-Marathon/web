import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { CurrentUserApiError, getCurrentUser } from "../api/users";

type CheckResult = { key: string; status: "allowed" | "unauthorized" | "error" };

export default function RequireUser({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    getCurrentUser(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setResult({ key: location.key, status: "allowed" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key: location.key,
          status: error instanceof CurrentUserApiError && error.status === 401 ? "unauthorized" : "error",
        });
      });
    return () => controller.abort();
  }, [location.key]);

  if (result?.key !== location.key) {
    return <main className="auth-route-status" role="status">로그인 상태를 확인하고 있어요…</main>;
  }
  if (result.status === "unauthorized") {
    return <Navigate to="/login" replace state={{ authNotice: "로그인이 필요합니다." }} />;
  }
  if (result.status === "error") {
    return <main className="auth-route-status" role="alert">로그인 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.</main>;
  }
  return children;
}
