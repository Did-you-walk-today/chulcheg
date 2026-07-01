import type { AttendanceLog } from "./schema";

// 출퇴근 상태 머신 (기획서 4.3).

// ABSENCE 는 상태를 바꾸지 않는 "사유 신고" 로그다 (미출근·결석 사유).
export type LogType =
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "STEP_OUT"
  | "RETURN"
  | "ABSENCE";
export type State = "OFF" | "WORKING" | "OUT" | "DONE";
//                    미출근    근무중      외출중   퇴근

const STATE_TYPES: LogType[] = ["CLOCK_IN", "CLOCK_OUT", "STEP_OUT", "RETURN"];

export const STATE_LABEL: Record<State, string> = {
  OFF: "미출근",
  WORKING: "근무중",
  OUT: "외출중",
  DONE: "퇴근",
};

export const ACTION_LABEL: Record<LogType, string> = {
  CLOCK_IN: "출근",
  STEP_OUT: "외출",
  RETURN: "복귀",
  CLOCK_OUT: "퇴근",
  ABSENCE: "미출근 사유",
};

/** 당일 로그(시간 오름차순)로부터 현재 상태를 도출. ABSENCE 등 비상태 로그는 무시. */
export function deriveState(todaysLogs: AttendanceLog[]): State {
  for (let i = todaysLogs.length - 1; i >= 0; i--) {
    const t = todaysLogs[i].type as LogType;
    if (!STATE_TYPES.includes(t)) continue;
    switch (t) {
      case "CLOCK_IN":
      case "RETURN":
        return "WORKING";
      case "STEP_OUT":
        return "OUT";
      case "CLOCK_OUT":
        return "DONE";
    }
  }
  return "OFF";
}

/** 현재 상태에서 노출/허용할 액션 목록. (UI 버튼 + 서버 검증 공용) */
export function allowedActions(state: State): LogType[] {
  switch (state) {
    case "OFF":
      return ["CLOCK_IN"];
    case "WORKING":
      return ["STEP_OUT", "CLOCK_OUT"];
    case "OUT":
      return ["RETURN"];
    case "DONE":
      return [];
  }
}

export function canTransition(state: State, action: LogType): boolean {
  return allowedActions(state).includes(action);
}

/** Asia/Seoul 기준 "오늘"의 날짜키 (YYYY-MM-DD). 자정 기준으로 하루를 끊는다. */
export function seoulDayKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 전체 로그 중 오늘(서울 기준)에 해당하는 것만, 시간 오름차순으로. */
export function todaysLogs(logs: AttendanceLog[]): AttendanceLog[] {
  const today = seoulDayKey();
  return logs
    .filter((l) => seoulDayKey(l.createdAt) === today)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
