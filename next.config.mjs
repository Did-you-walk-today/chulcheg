import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

// `next dev` 에서도 Cloudflare 바인딩(D1 등)에 접근할 수 있도록 초기화.
initOpenNextCloudflareForDev();
