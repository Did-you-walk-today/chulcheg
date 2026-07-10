// 서울 기준 시간 표기 헬퍼.

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

// IP 마스킹(화면 표시용). DB엔 원본이 저장되지만 관리자 화면엔 뒷부분을 가린다.
export function maskIp(ip: string | null | undefined): string {
  if (!ip) return "-";
  if (ip.includes(":")) {
    // IPv6: 앞 2그룹만 남기고 가림
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 2).join(":")}:xxxx`;
  }
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  return "xxx";
}
