"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { attendanceLogs } from "@/lib/schema";
import { getCurrentUser, getRecentLogs } from "@/lib/queries";
import {
  canTransition,
  deriveState,
  todaysLogs,
  type LogType,
} from "@/lib/attendance";
import { destroySession } from "@/lib/session";

const VALID: LogType[] = ["CLOCK_IN", "CLOCK_OUT", "STEP_OUT", "RETURN"];

/** 출근/외출/복귀/퇴근 기록. 서버에서 상태 전이를 재검증한다. */
export async function recordAction(formData: FormData): Promise<void> {
  const type = String(formData.get("type") ?? "") as LogType;
  if (!VALID.includes(type)) return;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 현재 상태 도출 후, 허용되는 전이인지 서버에서 재확인 (버튼 위변조 방지).
  const logs = await getRecentLogs(user.id, 2);
  const state = deriveState(todaysLogs(logs));
  if (!canTransition(state, type)) {
    revalidatePath("/");
    return;
  }

  await db.insert(attendanceLogs).values({ userId: user.id, type });
  revalidatePath("/");
  revalidatePath("/history");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
