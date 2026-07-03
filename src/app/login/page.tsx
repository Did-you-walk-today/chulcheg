import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;

  return (
    <>
      <div className="brand-hero">나왔니</div>
      <h1>로그인</h1>
      <p className="subtitle">전화번호와 비밀번호로 로그인하세요.</p>

      {error && <div className="error">{error}</div>}

      <form className="form" method="post" action="/api/login">
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
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn" type="submit">
          로그인
        </button>
      </form>

      <p className="muted-link">
        아직 계정이 없나요? <Link href="/register">회원가입</Link>
      </p>

      <p className="collect-note">
        원활한 서비스 제공과 버그 해결을 위해 접속 시 기기·브라우저·IP 등 일부
        정보가 수집됩니다.
      </p>
    </>
  );
}
