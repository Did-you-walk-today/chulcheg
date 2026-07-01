import "server-only";
import { and, gte, lt } from "drizzle-orm";
import { getDb } from "./db";
import { attendanceLogs, users, type User } from "./schema";
import { ACTION_LABEL, STATE_LABEL, deriveState, seoulDayKey, type LogType } from "./attendance";
import { formatTime } from "./format";
import { formatPhone } from "./phone";

export type Period = "day" | "week" | "month";

export interface DaySummary {
  firstIn: Date | null;
  lastOut: Date | null;
  stepOutCount: number;
  present: boolean;
  finalState: ReturnType<typeof deriveState>;
}

export interface UserReport {
  user: User;
  byDay: Record<string, DaySummary>;
  presentDays: number;
  totalStepOut: number;
}

export interface ReportData {
  period: Period;
  label: string;
  refDate: string;
  days: string[];
  users: UserReport[];
  detailRows: {
    day: string;
    time: string;
    name: string;
    phone: string;
    type: string;
    reason: string;
  }[];
}

// ── 날짜 유틸 (Asia/Seoul, UTC+9 고정) ────────────────────────────────
function seoulNoonUTC(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function addDays(dayKey: string, delta: number): string {
  const base = seoulNoonUTC(dayKey);
  base.setUTCDate(base.getUTCDate() + delta);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function seoulMidnightInstant(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00+09:00`);
}

function computeRange(period: Period, refDate: string) {
  if (period === "day") {
    return { startKey: refDate, days: [refDate], label: refDate };
  }
  if (period === "week") {
    const wd = seoulNoonUTC(refDate).getUTCDay(); // 0=일..6=토
    const monday = addDays(refDate, -((wd + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    return { startKey: monday, days, label: `${monday} ~ ${days[6]}` };
  }
  // month
  const [y, m] = refDate.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(first, i));
  return { startKey: first, days, label: `${y}-${String(m).padStart(2, "0")}` };
}

/** 기간별 출석 보고서 데이터 집계. */
export async function buildReport(period: Period, refDate: string): Promise<ReportData> {
  const { startKey, days, label } = computeRange(period, refDate);
  const start = seoulMidnightInstant(startKey);
  const end = seoulMidnightInstant(addDays(days[days.length - 1], 1));

  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(users.name).all();
  const logs = await db
    .select()
    .from(attendanceLogs)
    .where(and(gte(attendanceLogs.createdAt, start), lt(attendanceLogs.createdAt, end)))
    .all();

  const nameById = new Map(allUsers.map((u) => [u.id, u]));

  // 사용자 → 일자 → 로그 목록
  const grouped = new Map<number, Map<string, typeof logs>>();
  for (const log of logs) {
    const dayKey = seoulDayKey(log.createdAt);
    if (!grouped.has(log.userId)) grouped.set(log.userId, new Map());
    const byDay = grouped.get(log.userId)!;
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)!.push(log);
  }

  const userReports: UserReport[] = allUsers.map((user) => {
    const byDay: Record<string, DaySummary> = {};
    let presentDays = 0;
    let totalStepOut = 0;

    for (const dayKey of days) {
      const dayLogs = (grouped.get(user.id)?.get(dayKey) ?? []).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      const ins = dayLogs.filter((l) => l.type === "CLOCK_IN");
      const outs = dayLogs.filter((l) => l.type === "CLOCK_OUT");
      const stepOuts = dayLogs.filter((l) => l.type === "STEP_OUT");
      const present = ins.length > 0;
      if (present) presentDays++;
      totalStepOut += stepOuts.length;

      byDay[dayKey] = {
        firstIn: ins[0]?.createdAt ?? null,
        lastOut: outs[outs.length - 1]?.createdAt ?? null,
        stepOutCount: stepOuts.length,
        present,
        finalState: deriveState(dayLogs),
      };
    }

    return { user, byDay, presentDays, totalStepOut };
  });

  const detailRows = logs
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((log) => {
      const u = nameById.get(log.userId);
      return {
        day: seoulDayKey(log.createdAt),
        time: formatTime(log.createdAt),
        name: u?.name ?? "-",
        phone: u ? formatPhone(u.phone) : "-",
        type: ACTION_LABEL[log.type as LogType] ?? log.type,
        reason: log.reason ?? "",
      };
    });

  return { period, label, refDate, days, users: userReports, detailRows };
}

// ── 표(AOA) 생성: 화면/엑셀 공용 ──────────────────────────────────────

/** 요약 표. day 는 출퇴근 상세, week/month 는 일자별 출근시각 매트릭스. */
export function summaryAoa(report: ReportData): (string | number)[][] {
  if (report.period === "day") {
    const header = ["이름", "전화번호", "출근", "퇴근", "외출횟수", "상태"];
    const rows = report.users.map((r) => {
      const s = r.byDay[report.days[0]];
      return [
        r.user.name,
        formatPhone(r.user.phone),
        s?.firstIn ? formatTime(s.firstIn) : "-",
        s?.lastOut ? formatTime(s.lastOut) : "-",
        s?.stepOutCount ?? 0,
        s ? STATE_LABEL[s.finalState] : "미출근",
      ];
    });
    return [header, ...rows];
  }

  // week / month: 이름 + 일자별 출근시각 + 출근일수
  const header = ["이름", "전화번호", ...report.days.map((d) => d.slice(5)), "출근일수"];
  const rows = report.users.map((r) => [
    r.user.name,
    formatPhone(r.user.phone),
    ...report.days.map((d) => {
      const s = r.byDay[d];
      return s?.firstIn ? formatTime(s.firstIn) : s?.present ? "○" : "-";
    }),
    r.presentDays,
  ]);
  return [header, ...rows];
}

export function detailAoa(report: ReportData): (string | number)[][] {
  const header = ["날짜", "시각", "이름", "전화번호", "유형", "사유"];
  const rows = report.detailRows.map((d) => [
    d.day,
    d.time,
    d.name,
    d.phone,
    d.type,
    d.reason,
  ]);
  return [header, ...rows];
}

export function periodLabelKo(period: Period): string {
  return period === "day" ? "일간" : period === "week" ? "주간" : "월간";
}

export function todaySeoulKey(): string {
  return seoulDayKey();
}
