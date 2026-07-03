"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// 우상단 메뉴 버튼. 내 기록 / 비밀번호 변경 / (관리자) / 로그아웃을 드롭다운에 모음.
export function HeaderMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="menu-btn"
        aria-label="메뉴 열기"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>☰</span>
      </button>

      {open && (
        <div className="menu-dropdown" role="menu">
          <Link href="/history" className="menu-item" role="menuitem" onClick={close}>
            내 기록
          </Link>
          <Link href="/settings" className="menu-item" role="menuitem" onClick={close}>
            비밀번호 변경
          </Link>
          {isAdmin && (
            <Link href="/admin" className="menu-item" role="menuitem" onClick={close}>
              관리자 현황
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/report"
              className="menu-item"
              role="menuitem"
              onClick={close}
            >
              출석 보고서
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/logs" className="menu-item" role="menuitem" onClick={close}>
              이벤트 로그
            </Link>
          )}
          <div className="menu-sep" />
          <form method="post" action="/api/logout">
            <button type="submit" className="menu-item menu-item-danger" role="menuitem">
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
