import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <>
      <div className="brand-hero">나왔니</div>
      <h1>비밀번호 재설정</h1>
      <p className="subtitle">
        가입할 때 사용한 이름과 전화번호가 일치하면 새 비밀번호를 설정할 수
        있어요.
      </p>

      {error && <div className="error">{error}</div>}

      <form className="form" method="post" action="/api/reset">
        <div className="field">
          <label htmlFor="name">이름</label>
          <input id="name" name="name" type="text" maxLength={20} required />
        </div>
        <div className="field">
          <label htmlFor="phone">전화번호</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="username"
            placeholder="010-0000-0000"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">새 비밀번호</label>
          <input
            id="password"
            name="password"
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
          비밀번호 재설정
        </button>
      </form>

      <p className="muted-link">
        <Link href="/login">← 로그인으로 돌아가기</Link>
      </p>
    </>
  );
}
