"use client";

import { useState } from "react";
import { dismissAnnouncement, saveBirthdate } from "./popupActions";

type AnnouncementView = { id: number; body: string; dateLabel: string };

// 로그인 직후 대시보드에서 뜨는 팝업들.
// 1) 공지: admin 이 올린 최신 공지를 아직 안 봤으면 표시 → 확인하면 서버에 기록되어 다시 안 뜸.
// 2) 생일 조사: 생년월일 미입력이면 표시 → '나중에' 로 닫으면 다음 로그인 때 다시 뜸.
// 공지를 먼저 보여주고, 닫히면 생일 팝업을 보여준다.
export function Popups({
  announcement,
  needBirthdate,
}: {
  announcement: AnnouncementView | null;
  needBirthdate: boolean;
}) {
  const [annClosed, setAnnClosed] = useState(false);
  const [birthClosed, setBirthClosed] = useState(false);

  const showAnn = announcement != null && !annClosed;
  const showBirth = needBirthdate && !birthClosed && !showAnn;

  if (showAnn) {
    return (
      <div className="modal-overlay">
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-cap">📢 공지</div>
          <p className="modal-body">{announcement!.body}</p>
          <div className="modal-meta">{announcement!.dateLabel}</div>
          <form action={dismissAnnouncement} onSubmit={() => setAnnClosed(true)}>
            <input type="hidden" name="id" value={announcement!.id} />
            <button className="btn" type="submit">
              확인했어요
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showBirth) {
    const today = new Date().toISOString().slice(0, 10);
    return (
      <div className="modal-overlay">
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-cap">🎂 생년월일 조사</div>
          <p className="modal-body">
            교수님 요청으로 생년월일을 조사하고 있어요. 아래에 입력해 주세요.
          </p>
          <form
            action={saveBirthdate}
            className="modal-form"
            onSubmit={() => setBirthClosed(true)}
          >
            <input
              type="date"
              name="birthdate"
              className="reason-input"
              min="1900-01-01"
              max={today}
              required
            />
            <button className="btn" type="submit">
              제출
            </button>
          </form>
          <button
            type="button"
            className="modal-skip"
            onClick={() => setBirthClosed(true)}
          >
            나중에 입력할게요
          </button>
        </div>
      </div>
    );
  }

  return null;
}
