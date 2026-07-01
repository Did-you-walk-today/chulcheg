import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllUsersWithTodayLogs, getCurrentUser } from "@/lib/queries";
import {
  ACTION_LABEL,
  STATE_LABEL,
  deriveState,
  todaysLogs,
  type LogType,
} from "@/lib/attendance";
import { formatPhone } from "@/lib/phone";
import { formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const rows = await getAllUsersWithTodayLogs();

  return (
    <>
      <div className="topbar">
        <Link href="/">← 대시보드</Link>
        <span className="brand">관리자</span>
      </div>

      <h1>오늘 출석 현황</h1>
      <p className="subtitle">전체 인원 {rows.length}명의 당일 상태입니다.</p>

      {rows.length === 0 ? (
        <div className="empty">가입한 인원이 없습니다.</div>
      ) : (
        rows.map(({ user, logs }) => {
          const today = todaysLogs(logs);
          const state = deriveState(today);
          const last = today[today.length - 1];
          const reason = [...today].reverse().find((l) => l.reason)?.reason;
          return (
            <div className="log-item" key={user.id}>
              <div>
                <div className="type">{user.name}</div>
                <div className="time" style={{ fontSize: 12 }}>
                  {formatPhone(user.phone)}
                  {last &&
                    ` · ${ACTION_LABEL[last.type as LogType]} ${formatTime(
                      last.createdAt,
                    )}`}
                </div>
                {reason && <div className="log-reason">사유: {reason}</div>}
              </div>
              <span className={`pill pill-${state}`}>{STATE_LABEL[state]}</span>
            </div>
          );
        })
      )}
    </>
  );
}
