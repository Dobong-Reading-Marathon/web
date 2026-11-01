import type { ReactNode } from "react";

export type ChipKind =
  "draft" | "wait" | "ok" | "fix" | "star" | "info" | "line";

/** 상태 칩 (임시저장 / 심사 대기 / 승인 / 보완요청 …) */
export default function Chip({
  k,
  children,
}: {
  k: ChipKind;
  children: ReactNode;
}) {
  const kindClass = {
    draft: "draft",
    wait: "pending",
    ok: "approved",
    fix: "fix-requested",
    star: "featured",
    info: "info",
    line: "outline",
  }[k];

  return <span className={`status-chip status-chip--${kindClass}`}>{children}</span>;
}
