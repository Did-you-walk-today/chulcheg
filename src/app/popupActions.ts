"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/queries";

// YYYY-MM-DD 형식 + 실제로 존재하는 날짜인지 검사.
function isValidBirthdate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** 생일 팝업에서 제출한 생년월일 저장. 잘못된 값이면 무시. */
export async function saveBirthdate(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = String(formData.get("birthdate") ?? "").trim();
  if (!isValidBirthdate(raw)) {
    revalidatePath("/");
    return;
  }

  const db = getDb();
  await db.update(users).set({ birthdate: raw }).where(eq(users.id, user.id));
  revalidatePath("/");
}

/** 공지 팝업 확인. 이 사용자의 seenAnnouncementId 를 확인한 공지 id 로 올려 다시 안 뜨게 한다. */
export async function dismissAnnouncement(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const db = getDb();
  // 뒤로 가지 않도록 max(현재값, id) 로만 올린다.
  await db
    .update(users)
    .set({ seenAnnouncementId: sql`max(${users.seenAnnouncementId}, ${id})` })
    .where(eq(users.id, user.id));
  revalidatePath("/");
}
