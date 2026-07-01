"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { attendanceLogs } from "@/lib/schema";
import { getCurrentUser, getRecentLogs } from "@/lib/queries";
import {
  canTransition,
  deriveState,
  todaysLogs,
  type LogType,
} from "@/lib/attendance";
import { destroySession } from "@/lib/session";

const VALID: LogType[] = [
  "CLOCK_IN",
  "CLOCK_OUT",
  "STEP_OUT",
  "RETURN",
  "ABSENCE",
];

/** 출근/외출/복귀/퇴근/사유 기록. 서버에서 상태 전이를 재검증한다. */
export async function recordAction(formData: FormData): Promise<void> {
  const type = String(formData.get("type") ?? "") as LogType;
  if (!VALID.includes(type)) return;

  const reasonRaw = String(formData.get("reason") ?? "").trim();
  const reason = reasonRaw ? reasonRaw.slice(0, 200) : null;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const logs = await getRecentLogs(user.id, 2);
  const state = deriveState(todaysLogs(logs));
  const db = getDb();

  // 미출근·결석 사유 신고: 미출근 상태에서만, 사유 필수. 상태는 바꾸지 않는다.
  if (type === "ABSENCE") {
    if (state !== "OFF" || !reason) {
      revalidatePath("/");
      return;
    }
    await db.insert(attendanceLogs).values({ userId: user.id, type, reason });
    revalidatePath("/");
    revalidatePath("/history");
    return;
  }

  // 상태 전이 재검증 (버튼 위변조 방지).
  if (!canTransition(state, type)) {
    revalidatePath("/");
    return;
  }

  // 사유는 외출(STEP_OUT)에만 저장한다.
  const savedReason = type === "STEP_OUT" ? reason : null;
  await db
    .insert(attendanceLogs)
    .values({ userId: user.id, type, reason: savedReason });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
