import { useEffect, useState } from "react";

export interface Course {
  id: number;
  name: string;
  family: boolean;
  targetPages: number;
  targetBooks: number;
  targetReviews: number;
  distanceKm: number;
}

export interface CurrentRound {
  id: number;
  year: number;
  roundNo: number;
  startDate: string;
  endDate: string;
  applyStart: string;
  applyEnd: string;
  applyOpen: boolean;
  courses: Course[];
}

interface CurrentRoundState {
  round: CurrentRound | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentRound(): CurrentRoundState {
  const [state, setState] = useState<CurrentRoundState>({
    round: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

    async function loadCurrentRound() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/rounds/current`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "현재 진행 중인 회차를 찾을 수 없습니다."
              : `회차 정보를 불러오지 못했습니다. (${response.status})`,
          );
        }

        const round = (await response.json()) as CurrentRound;
        setState({ round, loading: false, error: null });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          round: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "회차 정보를 불러오지 못했습니다.",
        });
      }
    }

    void loadCurrentRound();
    return () => controller.abort();
  }, []);

  return state;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatCourseCriteria(course: Course): string {
  const pages = new Intl.NumberFormat("ko-KR").format(course.targetPages);
  const distance = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 3,
  }).format(course.distanceKm);

  return `${distance}km · ${pages}쪽 · ${course.targetBooks}권 · 서평 ${course.targetReviews}편`;
}
