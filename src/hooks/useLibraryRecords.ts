import { useCallback, useEffect, useState } from "react";
import { getMyReadingLogs, type MyReadingLog } from "../api/myReadingLogs";

/** 내 서재 카드형·수첩형·책별로 모아보기에서 쓰는 독서기록 한 건 */
export type LibraryRecord = MyReadingLog;

/**
 * 이번 회차의 독서기록 전체를 읽은 날짜가 빠른 순서로 불러옵니다 (GET /api/me/reading-logs).
 * 서평 본문과 글자 수가 함께 오므로 기록마다 상세를 따로 부르지 않습니다.
 */
export function useLibraryRecords() {
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getMyReadingLogs(controller.signal)
      .then((result) => setRecords(result?.logs ?? []))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "독서기록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const removeRecord = useCallback((id: number) => {
    setRecords((current) => current.filter((record) => record.readingLogId !== id));
  }, []);

  return { records, loading, error, removeRecord };
}

/** "저자 저 · 출판사 (2024년)" 형식. 없는 값은 뺍니다. */
export function bookByline(record: Pick<LibraryRecord, "author" | "publisher" | "publishYear">) {
  const publisher = [record.publisher, record.publishYear ? `(${record.publishYear}년)` : ""].filter(Boolean).join(" ");
  return [record.author && `${record.author} 저`, publisher].filter(Boolean).join(" · ");
}
