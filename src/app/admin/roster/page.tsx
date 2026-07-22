import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllUsers, getCurrentUser } from "@/lib/queries";
import { formatPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/");

  const users = await getAllUsers();
  const withBirthdate = users.filter((u) => u.birthdate).length;

  return (
    <div className="report">
      <div className="topbar">
        <Link href="/">← 대시보드</Link>
        <span className="brand">학생 명단</span>
      </div>

      <h1>학생 명단</h1>
      <p className="subtitle">
        총 {users.length}명 · 생년월일 입력 {withBirthdate}명
      </p>

      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>전화번호</th>
              <th>생년월일</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty">
                  가입한 인원이 없습니다.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{formatPhone(u.phone)}</td>
                  <td>
                    {u.birthdate ?? (
                      <span className="muted">미입력</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
