/// <reference types="@cloudflare/workers-types" />

// Cloudflare 바인딩 타입. getCloudflareContext().env 에서 사용.
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ALLOWED_IPS?: string;
  IP_CHECK_DISABLED?: string;
  SESSION_SECRET?: string;
  // 이 코드를 회원가입 시 입력하면 관리자 권한으로 생성된다(단 하나만).
  // 공개 저장소에 노출되지 않도록 값은 소스가 아니라 secret 으로 관리.
  ADMIN_SIGNUP_CODE?: string;
}
