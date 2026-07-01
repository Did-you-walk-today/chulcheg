import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";
import { changePassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error, ok } = await searchParams;

  return (
    <>
      <div className="topbar">
        <Link href="/">← 대시보드</Link>
        <span className="brand">설정</span>
      </div>

      <h1>비밀번호 변경</h1>
      <p className="subtitle">{user.name}님의 계정 비밀번호를 변경합니다.</p>

      {ok && <div className="toast">비밀번호가 변경되었습니다. ✅</div>}
      {error && <div className="error">{error}</div>}

      <form className="form" action={changePassword}>
        <div className="field">
          <label htmlFor="current">현재 비밀번호</label>
          <input
            id="current"
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="next">새 비밀번호</label>
          <input
            id="next"
            name="next"
            type="password"
            autoComplete="new-password"
            minLength={4}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">새 비밀번호 확인</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={4}
            required
          />
        </div>
        <button className="btn" type="submit">
          변경하기
        </button>
      </form>
    </>
  );
}
