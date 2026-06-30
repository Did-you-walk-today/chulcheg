// 순수 JS IP / CIDR 매칭 유틸. Edge 런타임 안전 (Node Buffer 등 미사용).
// IPv4 / IPv6 (압축 표기, IPv4-mapped 포함) 지원.

type ParsedIp = { bytes: number[] };

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    bytes.push(v);
  }
  return bytes;
}

function parseIpv6(input: string): ParsedIp | null {
  // zone id (%eth0 등) 제거
  let ip = input.split("%")[0];

  // 끝에 IPv4 가 박힌 형태(예: ::ffff:1.2.3.4)는 두 개의 16비트 그룹으로 변환
  const v4Match = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4Match) {
    const v4 = parseIpv4(v4Match[1]);
    if (!v4) return null;
    const g1 = ((v4[0] << 8) | v4[1]).toString(16);
    const g2 = ((v4[2] << 8) | v4[3]).toString(16);
    ip = ip.slice(0, v4Match.index) + g1 + ":" + g2;
  }

  const halves = ip.split("::");
  if (halves.length > 2) return null;

  const toBytes = (groups: string[]): number[] | null => {
    const out: number[] = [];
    for (const g of groups) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
      const v = parseInt(g, 16);
      out.push((v >> 8) & 0xff, v & 0xff);
    }
    return out;
  };

  const headGroups = halves[0] ? halves[0].split(":") : [];
  const head = toBytes(headGroups);
  if (!head) return null;

  if (halves.length === 1) {
    // "::" 없음 → 정확히 16바이트(8그룹)여야 함
    return head.length === 16 ? { bytes: head } : null;
  }

  const tailGroups = halves[1] ? halves[1].split(":") : [];
  const tail = toBytes(tailGroups);
  if (!tail) return null;

  const missing = 16 - head.length - tail.length;
  if (missing < 0) return null;
  const zeros = new Array(missing).fill(0);
  return { bytes: [...head, ...zeros, ...tail] };
}

function parseIp(ip: string): ParsedIp | null {
  const trimmed = ip.trim();
  if (trimmed.includes(":")) return parseIpv6(trimmed);
  const v4 = parseIpv4(trimmed);
  return v4 ? { bytes: v4 } : null;
}

// IPv4-mapped IPv6 (::ffff:a.b.c.d) 는 IPv4 로 정규화해서 IPv4 대역과도 비교 가능하게.
function normalize(bytes: number[]): number[] {
  if (bytes.length === 16) {
    const v4Mapped =
      bytes.slice(0, 10).every((b) => b === 0) &&
      bytes[10] === 0xff &&
      bytes[11] === 0xff;
    if (v4Mapped) return bytes.slice(12);
  }
  return bytes;
}

function bitsEqual(a: number[], b: number[], prefix: number): boolean {
  const fullBytes = Math.floor(prefix / 8);
  for (let i = 0; i < fullBytes; i++) {
    if (a[i] !== b[i]) return false;
  }
  const rem = prefix % 8;
  if (rem) {
    const mask = (0xff << (8 - rem)) & 0xff;
    if ((a[fullBytes] & mask) !== (b[fullBytes] & mask)) return false;
  }
  return true;
}

/** 단일 IP 가 하나의 CIDR(또는 단일 IP) 항목에 속하는지 검사. */
export function matchCidr(ipStr: string, cidr: string): boolean {
  const entry = cidr.trim();
  if (!entry) return false;

  const slash = entry.indexOf("/");
  const addrStr = slash === -1 ? entry : entry.slice(0, slash);

  const net = parseIp(addrStr);
  const ip = parseIp(ipStr);
  if (!net || !ip) return false;

  const a = normalize(ip.bytes);
  const b = normalize(net.bytes);
  if (a.length !== b.length) return false; // v4 vs v6 불일치

  const maxPrefix = a.length * 8;
  const prefix = slash === -1 ? maxPrefix : Number(entry.slice(slash + 1));
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) return false;

  return bitsEqual(a, b, prefix);
}

/** allowList 항목 중 하나라도 매칭되면 허용. */
export function isAllowedIp(ip: string | null | undefined, allowList: string[]): boolean {
  if (!ip) return false;
  return allowList.some((entry) => matchCidr(ip, entry));
}

/** "203.0.113.0/24, 198.51.100.1" 같은 환경변수 문자열을 배열로. */
export function parseAllowList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
