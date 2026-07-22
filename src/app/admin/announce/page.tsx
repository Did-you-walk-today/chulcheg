import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { announcements } from "@/lib/schema";
import { formatDate, formatTime } from "@/lib/format";
import { createAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnnouncePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const { ok } = await searchParams;

  const db = getDb();
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.id))
    .limit(20)
    .all();

  return (
    <div className="report">
      <div className="topbar">
        <Link href="/">← 대시보드</Link>
        <span className="brand">공지 작성</span>
      </div>

      <h1>공지 작성</h1>
      <p className="subtitle">
        작성하면 모든 학생에게 로그인 시 팝업으로 한 번 표시됩니다.
      </p>

      {ok && <div className="toast">공지가 등록되었습니다. ✅</div>}

      <form className="form" action={createAnnouncement}>
        <div className="field">
          <label htmlFor="body">공지 내용</label>
          <textarea
            id="body"
            name="body"
            className="reason-input"
            rows={4}
            maxLength={1000}
            placeholder="예) 이번 주 금요일 휴강입니다."
            required
          />
        </div>
        <button className="btn" type="submit">
          공지 등록
        </button>
      </form>

      <h2 className="section-title">지난 공지</h2>
      {rows.length === 0 ? (
        <div className="empty">등록된 공지가 없습니다.</div>
      ) : (
        rows.map((a) => (
          <div className="log-item" key={a.id}>
            <div>
              <div className="type">{a.body}</div>
              <div className="time" style={{ fontSize: 12 }}>
                {formatDate(a.createdAt)} {formatTime(a.createdAt)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
