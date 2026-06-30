import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getRecentLogs } from "@/lib/queries";
import {
  ACTION_LABEL,
  STATE_LABEL,
  allowedActions,
  deriveState,
  todaysLogs,
} from "@/lib/attendance";
import { formatTime } from "@/lib/format";
import { recordAction, logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await getRecentLogs(user.id, 2);
  const today = todaysLogs(logs);
  const state = deriveState(today);
  const actions = allowedActions(state);
  const last = today[today.length - 1];

  return (
    <>
      <div className="topbar">
        <span className="brand">출석 체크</span>
        <Link href="/history">기록 보기</Link>
      </div>

      <h1>{user.name}님</h1>
      <p className="subtitle">오늘 하루 출석을 기록하세요.</p>

      <div className={`state-card bg-${state}`}>
        <span className="state-cap">현재 상태</span>
        <span className="state-label">{STATE_LABEL[state]}</span>
        {last && (
          <div className="state-time">
            마지막 기록 · {ACTION_LABEL[last.type as keyof typeof ACTION_LABEL]}{" "}
            {formatTime(last.createdAt)}
          </div>
        )}
      </div>

      {state === "DONE" ? (
        <div className="done-note">오늘 출석이 마무리되었어요. 수고하셨습니다 👋</div>
      ) : (
        <div className="actions">
          {state === "WORKING" ? (
            // 근무중: 외출 / 퇴근 두 버튼을 나란히
            <div className="btn-row">
              {actions.map((type) => (
                <form key={type} action={recordAction}>
                  <input type="hidden" name="type" value={type} />
                  <button className={`btn btn-${type}`} type="submit">
                    {ACTION_LABEL[type]}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            actions.map((type) => (
              <form key={type} action={recordAction}>
                <input type="hidden" name="type" value={type} />
                <button className={`btn btn-${type}`} type="submit">
                  {ACTION_LABEL[type]}
                </button>
              </form>
            ))
          )}
        </div>
      )}

      <form action={logout}>
        <button className="btn btn-ghost" type="submit" style={{ marginTop: 12 }}>
          로그아웃
        </button>
      </form>
    </>
  );
}
