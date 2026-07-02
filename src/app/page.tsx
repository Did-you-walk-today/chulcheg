import { redirect } from "next/navigation";
import { getCurrentUser, getRecentLogs } from "@/lib/queries";
import {
  ACTION_LABEL,
  STATE_LABEL,
  deriveState,
  todaysLogs,
} from "@/lib/attendance";
import { formatTime } from "@/lib/format";
import { recordAction } from "./actions";
import { HeaderMenu } from "./HeaderMenu";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await getRecentLogs(user.id, 2);
  const today = todaysLogs(logs);
  const state = deriveState(today);
  const last = today[today.length - 1];

  const reversed = [...today].reverse();
  const absence = reversed.find((l) => l.type === "ABSENCE");
  const lastStepOut = reversed.find((l) => l.type === "STEP_OUT");

  return (
    <>
      <div className="topbar">
        <span className="brand">나왔니</span>
        <HeaderMenu isAdmin={user.role === "admin"} />
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

      {state === "OFF" && (
        <div className="actions">
          <form action={recordAction}>
            <input type="hidden" name="type" value="CLOCK_IN" />
            <button className="btn btn-CLOCK_IN" type="submit">
              출근
            </button>
          </form>

          {absence ? (
            <div className="reason-note">
              제출된 미출근 사유: {absence.reason}
            </div>
          ) : (
            <form action={recordAction} className="reason-form">
              <input type="hidden" name="type" value="ABSENCE" />
              <input
                name="reason"
                className="reason-input"
                placeholder="오늘 못 나오나요? 미출근·결석 사유 입력"
                maxLength={200}
                required
              />
              <button className="btn btn-ghost" type="submit">
                미출근 사유 제출
              </button>
            </form>
          )}
        </div>
      )}

      {state === "WORKING" && (
        <div className="actions">
          <form action={recordAction} className="reason-form">
            <input type="hidden" name="type" value="STEP_OUT" />
            <input
              name="reason"
              className="reason-input"
              placeholder="외출 사유 (선택)"
              maxLength={200}
            />
            <button className="btn btn-STEP_OUT" type="submit">
              외출
            </button>
          </form>
          <form action={recordAction}>
            <input type="hidden" name="type" value="CLOCK_OUT" />
            <button className="btn btn-CLOCK_OUT" type="submit">
              퇴근
            </button>
          </form>
        </div>
      )}

      {state === "OUT" && (
        <div className="actions">
          {lastStepOut?.reason && (
            <div className="reason-note">외출 사유: {lastStepOut.reason}</div>
          )}
          <form action={recordAction}>
            <input type="hidden" name="type" value="RETURN" />
            <button className="btn btn-RETURN" type="submit">
              복귀
            </button>
          </form>
        </div>
      )}

      {state === "DONE" && (
        <div className="done-note">
          오늘 출석이 마무리되었어요. 수고하셨습니다 👋
        </div>
      )}
    </>
  );
}
