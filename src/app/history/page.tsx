import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getRecentLogs } from "@/lib/queries";
import { ACTION_LABEL, seoulDayKey, type LogType } from "@/lib/attendance";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await getRecentLogs(user.id, 30); // 최근 30일
  // 날짜별로 묶기 (이미 시간 내림차순).
  const groups = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = seoulDayKey(log.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log);
  }

  return (
    <>
      <div className="topbar">
        <Link href="/">← 대시보드</Link>
        <span className="brand">내 기록</span>
      </div>

      <h1>출퇴근 기록</h1>
      <p className="subtitle">최근 30일 기록입니다.</p>

      {logs.length === 0 ? (
        <div className="empty">아직 기록이 없어요.</div>
      ) : (
        [...groups.entries()].map(([key, dayLogs]) => (
          <div className="log-group" key={key}>
            <div className="log-date">{formatDate(dayLogs[0].createdAt)}</div>
            {dayLogs.map((log) => (
              <div className="log-item" key={log.id}>
                <span className="type">
                  {ACTION_LABEL[log.type as LogType] ?? log.type}
                </span>
                <span className="time">{formatTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </>
  );
}
