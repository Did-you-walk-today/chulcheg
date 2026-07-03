import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { eventLog } from "@/lib/schema";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const db = getDb();
  const rows = await db
    .select()
    .from(eventLog)
    .orderBy(desc(eventLog.createdAt))
    .limit(200)
    .all();

  return (
    <div className="report">
      <div className="topbar">
        <Link href="/">← 대시보드</Link>
        <span className="brand">이벤트 로그</span>
      </div>

      <h1>이벤트 로그</h1>
      <p className="subtitle">최근 200건 · 로그인/세션·기기 정보</p>

      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>시각</th>
              <th>이벤트</th>
              <th>기기(OS)</th>
              <th>브라우저</th>
              <th>모바일</th>
              <th>IP</th>
              <th>국가</th>
              <th>통신사</th>
              <th>sid</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">
                  로그가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {formatDate(r.createdAt)} {formatTime(r.createdAt)}
                  </td>
                  <td>
                    <span className={`log-level log-${r.level}`}>{r.event}</span>
                  </td>
                  <td>
                    {r.os}
                    {r.osVer ? ` ${r.osVer}` : ""}
                  </td>
                  <td>
                    {r.browser}
                    {r.browserVer ? ` ${r.browserVer}` : ""}
                  </td>
                  <td>{r.isMobile ? "📱" : "💻"}</td>
                  <td>{r.ip ?? "-"}</td>
                  <td>{r.country ?? "-"}</td>
                  <td>{r.isp ?? "-"}</td>
                  <td>{r.hadSid ? "있음" : "없음"}</td>
                  <td>{r.message ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
