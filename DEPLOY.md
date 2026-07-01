# 배포 가이드 (Cloudflare Workers + D1)

이 앱은 **OpenNext(Cloudflare 어댑터)** 로 Cloudflare Workers 에 배포하고, DB 는 **D1** 을 쓴다.

> ⚠️ **Windows 주의**: OpenNext 의 최종 빌드(workerd 번들링)는 Windows 네이티브에서 크래시한다(공식적으로 미지원).
> 아래 `cf:build` / `deploy` / 로컬 `next dev`(D1 연결) 는 **WSL, macOS, Linux, 또는 Cloudflare 빌드 시스템**에서 실행할 것.
> (코드 자체는 `npm run build`, `npm run typecheck` 로 Windows 에서도 검증된다.)

## 0. 사전 준비
```bash
npm install
npx wrangler login        # Cloudflare 계정 로그인
```

## 1. D1 데이터베이스 생성
```bash
npx wrangler d1 create chulcheg-db
```
출력된 `database_id` 를 `wrangler.jsonc` 의 `d1_databases[0].database_id` 에 붙여넣는다
(`REPLACE_WITH_YOUR_D1_DATABASE_ID` 자리).

## 2. 마이그레이션 적용 (테이블 + 관리자 시드)
```bash
# 원격(운영) D1
npm run db:migrate:remote

# 로컬 개발용 D1 (next dev 로 테스트할 때)
npm run db:migrate:local
```
`migrations/0002_seed_admin.sql` 가 초기 관리자 계정을 만든다.

## 3. 세션 시크릿 등록
```bash
npx wrangler secret put SESSION_SECRET
# 길고 무작위한 값 입력 (예: openssl rand -base64 32)
```

## 4. 학교 IP 범위 넣기
`wrangler.jsonc` 의 `vars.ALLOWED_IPS` 에 학교 공인 IP 대역을 CIDR 로 나열.
```jsonc
"vars": {
  "ALLOWED_IPS": "203.0.113.0/24,198.51.100.0/24,2001:db8::/32",
  "IP_CHECK_DISABLED": "false"
}
```
비워두면 IP 검사 없이 전부 통과(개발). 값을 넣으면 자동으로 학교망 외부 차단.

## 5. 배포

### 방법 A — GitHub 연동 (Workers Builds) ★ 권장
Windows 로컬 빌드 문제(OpenNext 세그폴트)를 우회한다. 실제 빌드는 Cloudflare 리눅스에서 실행.

**사전(로컬 Windows 에서 가능 — 아래 명령은 workerd 번들링이 아니라 API 호출이라 정상 동작):**
1. `npx wrangler login`
2. `npx wrangler d1 create chulcheg-db` → 나온 `database_id` 를 `wrangler.jsonc` 에 붙여넣고 커밋/푸시
3. `npm run db:migrate:remote` (원격 D1 에 테이블 + 관리자 시드 적용)

**Cloudflare 대시보드:**
4. Workers & Pages → Create → **Workers** → **Connect to Git** → `Did-you-walk-today/chulcheg` 선택
5. 빌드 설정:
   - **Build command**: `npx opennextjs-cloudflare build`
   - **Deploy command**: `npx wrangler deploy` (기본값 그대로)
   - Root directory: `/` (기본)
6. 저장하면 첫 빌드/배포 진행. 이후 `main` 에 push 할 때마다 자동 재배포.
7. 배포된 Worker → Settings → **Variables and Secrets** 에서 `SESSION_SECRET` 을 Secret 으로 추가
   (또는 로컬에서 `npx wrangler secret put SESSION_SECRET`).

> 이후 학교 IP 를 넣을 때는 `wrangler.jsonc` 의 `vars.ALLOWED_IPS` 만 고쳐서 push → 자동 재배포.

### 방법 B — 로컬에서 직접 배포 (WSL / mac / linux)
```bash
npm run deploy   # opennextjs-cloudflare build && wrangler deploy
```
(Windows 네이티브에서는 이 빌드가 세그폴트로 실패하므로 방법 A 를 쓸 것.)

## 로컬 개발
```bash
npm run db:migrate:local   # 최초 1회 (WSL/mac/linux)
npm run dev                # http://localhost:3000
```

## 초기 관리자 계정
- 로그인 ID(전화번호): `010-2166-5989`
- 최초 비밀번호는 별도로 전달됨 → **로그인 후 `/settings` 에서 즉시 변경할 것.**
- 관리자는 DB 레벨에서 **단 하나만** 존재하도록 강제된다(`uniq_single_admin`).
- 관리자 전용 번호로는 일반 회원가입이 불가하다.
