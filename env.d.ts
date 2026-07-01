/// <reference types="@cloudflare/workers-types" />

// Cloudflare 바인딩 타입. getCloudflareContext().env 에서 사용.
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ALLOWED_IPS?: string;
  IP_CHECK_DISABLED?: string;
  SESSION_SECRET?: string;
}
