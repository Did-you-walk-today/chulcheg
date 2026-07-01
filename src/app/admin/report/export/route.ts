import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/queries";
import {
  buildReport,
  detailAoa,
  periodLabelKo,
  summaryAoa,
  todaySeoulKey,
  type Period,
} from "@/lib/report";

export const dynamic = "force-dynamic";

function isPeriod(v: string | null): v is Period {
  return v === "day" || v === "week" || v === "month";
}

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  if (me.role !== "admin") return new Response("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const period: Period = isPeriod(sp.get("period")) ? (sp.get("period") as Period) : "day";
  const refDate = sp.get("date") || todaySeoulKey();

  const report = await buildReport(period, refDate);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summaryAoa(report)),
    "요약",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(detailAoa(report)),
    "상세로그",
  );

  const data = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  const filename = `출석보고서_${periodLabelKo(period)}_${report.label.replace(/\s|~/g, "")}.xlsx`;
  const encoded = encodeURIComponent(filename);

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report.xlsx"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    },
  });
}
