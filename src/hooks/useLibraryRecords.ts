import { useCallback, useEffect, useState } from "react";
import { getBooks, type LibraryBook } from "../api/books";
import { getReadingCalendar, getReadingLogDetail, type ReadingLogDetail, type ReadingStatus } from "../api/calendar";
import { getCurrentEnrollment } from "../api/enrollments";

/** 내서재 카드형·수첩형에서 쓰는 독서기록 한 건 */
export type LibraryRecord = {
  id: number;
  /** 읽은 날짜 (YYYY-MM-DD) */
  readDate: string;
  startPage: number;
  endPage: number;
  status: ReadingStatus;
  enrollmentBookId: number;
  title: string;
  author: string;
  totalPages: number;
  libraryOwned: boolean;
  /** 책 번호. 내서재에 등록한 순서 (1부터) */
  bookNo: number;
};

/**
 * 이번 회차의 독서기록 전체를 읽은 날짜가 빠른 순서로 불러옵니다.
 * 기록 목록 API가 따로 없어서 독서달력 API를 1~12월 모두 불러와 합칩니다.
 */
export function useLibraryRecords() {
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const [enrollment, nextBooks] = await Promise.all([
          getCurrentEnrollment(controller.signal),
          getBooks({ signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        const sortedBooks = [...nextBooks].sort((a, b) => a.enrollmentBookId - b.enrollmentBookId);
        setBooks(sortedBooks);
        if (!enrollment) { setRecords([]); return; }

        const bookMap = new Map(sortedBooks.map((book, index) => [book.enrollmentBookId, { book, bookNo: index + 1 }]));
        const calendars = await Promise.all(Array.from({ length: 12 }, (_, index) =>
          getReadingCalendar(enrollment.year, index + 1, controller.signal)));
        if (controller.signal.aborted) return;

        const nextRecords = calendars.flatMap((calendar) => calendar.days.flatMap((day) => day.logs.map((log) => {
          const entry = bookMap.get(log.enrollmentBookId);
          return {
            id: log.readingLogId,
            readDate: day.date,
            startPage: log.startPage,
            endPage: log.endPage,
            status: log.status,
            enrollmentBookId: log.enrollmentBookId,
            title: log.bookTitle,
            author: entry?.book.author ?? "",
            totalPages: entry?.book.totalPages ?? 0,
            libraryOwned: entry?.book.libraryOwned ?? false,
            bookNo: entry?.bookNo ?? 0,
          } satisfies LibraryRecord;
        }))).sort((a, b) => a.readDate.localeCompare(b.readDate) || a.id - b.id);
        setRecords(nextRecords);
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "독서기록을 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const removeRecord = useCallback((id: number) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  }, []);

  return { records, books, loading, error, removeRecord };
}

const DETAIL_CONCURRENCY = 4;

/**
 * 기록 상세(글귀, 서평, 사서 코멘트)를 필요한 것만 불러와 모아 둡니다.
 * 한 번 불러온 상세는 다시 요청하지 않습니다.
 */
export function useRecordDetails(ids: number[]) {
  const [details, setDetails] = useState<Map<number, ReadingLogDetail>>(() => new Map());
  const [failed, setFailed] = useState(false);
  const key = ids.join(",");

  useEffect(() => {
    const missing = key ? key.split(",").map(Number).filter((id) => !details.has(id)) : [];
    if (missing.length === 0) return;
    const controller = new AbortController();
    let cursor = 0;
    async function worker() {
      while (cursor < missing.length && !controller.signal.aborted) {
        const id = missing[cursor++];
        try {
          const detail = await getReadingLogDetail(id, controller.signal);
          if (!controller.signal.aborted) setDetails((current) => new Map(current).set(id, detail));
        } catch {
          if (!controller.signal.aborted) setFailed(true);
        }
      }
    }
    void Promise.all(Array.from({ length: Math.min(DETAIL_CONCURRENCY, missing.length) }, worker));
    return () => controller.abort();
    // details는 일부러 뺍니다. 상세가 하나 올 때마다 요청을 다시 만들지 않기 위해서입니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { details, failed };
}

/** 서평 글자 수 (이모지 1자, 공백·줄바꿈 포함). 서버 계산과 같음 */
export function reviewLength(review: string | null | undefined) {
  return Array.from(review ?? "").length;
}
