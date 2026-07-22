"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { announcements } from "@/lib/schema";
import { getCurrentUser } from "@/lib/queries";

/** 공지 작성 (admin 전용). 저장하면 모든 학생에게 팝업으로 노출된다. */
export async function createAnnouncement(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    revalidatePath("/admin/announce");
    return;
  }

  const db = getDb();
  await db.insert(announcements).values({ body: body.slice(0, 1000) });

  // 대시보드 팝업이 새 공지를 즉시 반영하도록 홈도 재검증.
  revalidatePath("/admin/announce");
  revalidatePath("/");
  redirect("/admin/announce?ok=1");
}

/** 공지 삭제 (admin 전용). 삭제하면 더 이상 아무에게도 팝업으로 뜨지 않는다. */
export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const db = getDb();
  await db.delete(announcements).where(eq(announcements.id, id));

  revalidatePath("/admin/announce");
  revalidatePath("/");
  redirect("/admin/announce?deleted=1");
}
