import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import {
  buildReport,
  periodLabelKo,
  summaryAoa,
  todaySeoulKey,
  type Period,
} from "@/lib/report";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

function isPeriod(v: string | undefined): v is Period {
  return v === "day" || v === "week" || v === "month";
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const sp = await searchParams;
  const period: Period = isPeriod(sp.period) ? sp.period : "day";
  const refDate = sp.date || todaySeoulKey();

  const report = await buildReport(period, refDate);
  const aoa = summaryAoa(report);
  const header = aoa[0];
  const rows = aoa.slice(1);
  const exportHref = `/admin/report/export?period=${period}&date=${refDate}`;

  return (
    <div className="report">
      <div className="topbar no-print">
        <Link href="/">← 대시보드</Link>
        <span className="brand">출석 보고서</span>
      </div>

      <h1>출석 보고서</h1>

      {/* 기간/기준일 선택 (GET 폼) */}
      <form className="report-controls no-print" method="get">
        <select name="period" defaultValue={period}>
          <option value="day">일간</option>
          <option value="week">주간</option>
          <option value="month">월간</option>
        </select>
        <input type="date" name="date" defaultValue={refDate} />
        <button className="btn-sm" type="submit">
          조회
        </button>
      </form>

      <div className="report-head">
        <div className="report-title">
          {periodLabelKo(period)} 보고서 · {report.label}
        </div>
        <div className="report-meta">전체 {report.users.length}명</div>
      </div>

      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={header.length} className="empty">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci}>{c}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="report-actions no-print">
        <a className="btn" href={exportHref}>
          엑셀(xlsx) 다운로드
        </a>
        <PrintButton />
      </div>
    </div>
  );
}
