export type LibraryBook = {
  title: string;
  author: string;
  initial: string;
  status: string;
  kind: string;
  progress: number;
  pages: string;
  note: string;
  tags: string[];
};

export const libraryBooks: LibraryBook[] = [
  { title: "불편한 편의점", author: "김호연", initial: "불", status: "보완요청", kind: "fix-requested", progress: 97, pages: "260 / 268쪽", note: "상세 보는 중", tags: ["소장도서"] },
  { title: "데미안", author: "헤르만 헤세", initial: "데", status: "임시저장", kind: "draft", progress: 56, pages: "140 / 248쪽", note: "일괄 제출에 포함", tags: ["소장도서"] },
  { title: "작별하지 않는다", author: "한강", initial: "작", status: "심사 대기", kind: "pending", progress: 63, pages: "210 / 332쪽", note: "심사 중에는 수정할 수 있어요", tags: ["소장도서"] },
  { title: "소년이 온다", author: "한강", initial: "소", status: "승인", kind: "approved", progress: 100, pages: "215 / 215쪽", note: "승인된 기록은 수정할 수 없어요", tags: ["소장도서", "완독"] },
  { title: "어린 왕자", author: "생텍쥐페리", initial: "어", status: "승인", kind: "approved", progress: 100, pages: "112 / 112쪽", note: "아동도서 2권은 1권으로 환산", tags: ["소장도서", "아동도서"] },
  { title: "모모", author: "미하엘 엔데", initial: "모", status: "기록 전", kind: "outline", progress: 0, pages: "0 / 336쪽", note: "첫 기록 쓰기 →", tags: ["소장 아님"] },
];
