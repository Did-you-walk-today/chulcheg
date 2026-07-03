import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <>
      <div className="brand-hero">나왔니</div>
      <h1>회원가입</h1>
      <p className="subtitle">학교 와이파이에 연결된 상태에서만 가입할 수 있어요.</p>

      {error && <div className="error">{error}</div>}

      <form className="form" method="post" action="/api/register">
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
          <label htmlFor="password">비밀번호</label>
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
          <label htmlFor="code">관리자 코드 (선택)</label>
          <input
            id="code"
            name="code"
            type="password"
            autoComplete="off"
            placeholder="관리자로 가입할 때만 입력"
          />
        </div>
        <button className="btn" type="submit">
          가입하기
        </button>
      </form>

      <p className="muted-link">
        이미 계정이 있나요? <Link href="/login">로그인</Link>
      </p>
    </>
  );
}
