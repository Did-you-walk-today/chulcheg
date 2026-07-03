// 가벼운 User-Agent 파서 (진단용). 브라우저/OS/버전 + 모바일 여부.

export interface ParsedUA {
  browser: string;
  browserVer: string;
  os: string;
  osVer: string;
  isMobile: boolean;
}

export function parseUA(ua: string): ParsedUA {
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);

  let os = "Unknown";
  let osVer = "";
  let m: RegExpMatchArray | null;
  if ((m = ua.match(/iPhone OS (\d+[_\d]*)/))) {
    os = "iOS";
    osVer = m[1].replace(/_/g, ".");
  } else if ((m = ua.match(/iPad;.*OS (\d+[_\d]*)/))) {
    os = "iPadOS";
    osVer = m[1].replace(/_/g, ".");
  } else if ((m = ua.match(/Android (\d+[.\d]*)/))) {
    os = "Android";
    osVer = m[1];
  } else if ((m = ua.match(/Windows NT (\d+[.\d]*)/))) {
    os = "Windows";
    osVer = m[1];
  } else if ((m = ua.match(/Mac OS X (\d+[_\d]*)/))) {
    os = "macOS";
    osVer = m[1].replace(/_/g, ".");
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  // 순서 중요: 파생 브라우저(삼성/엣지/iOS크롬 등)를 Chrome/Safari 보다 먼저 검사.
  let browser = "Unknown";
  let browserVer = "";
  if ((m = ua.match(/SamsungBrowser\/(\d+[.\d]*)/))) {
    browser = "Samsung Internet";
    browserVer = m[1];
  } else if ((m = ua.match(/Edg\/(\d+[.\d]*)/))) {
    browser = "Edge";
    browserVer = m[1];
  } else if ((m = ua.match(/CriOS\/(\d+[.\d]*)/))) {
    browser = "Chrome(iOS)";
    browserVer = m[1];
  } else if ((m = ua.match(/FxiOS\/(\d+[.\d]*)/))) {
    browser = "Firefox(iOS)";
    browserVer = m[1];
  } else if ((m = ua.match(/Firefox\/(\d+[.\d]*)/))) {
    browser = "Firefox";
    browserVer = m[1];
  } else if ((m = ua.match(/Chrome\/(\d+[.\d]*)/))) {
    browser = "Chrome";
    browserVer = m[1];
  } else if ((m = ua.match(/Version\/(\d+[.\d]*).*Safari/))) {
    browser = "Safari";
    browserVer = m[1];
  } else if (/Safari/.test(ua)) {
    browser = "Safari";
  }

  return { browser, browserVer, os, osVer, isMobile };
}
