export const dynamic = "force-dynamic";

export default function BlockedPage() {
  return (
    <div className="blocked">
      <div className="icon">📡</div>
      <h1>학교 와이파이에서만 이용할 수 있어요</h1>
      <p>
        이 서비스는 학교 네트워크에 연결된 상태에서만 접속할 수 있습니다. 학교
        와이파이에 연결한 뒤 다시 시도해 주세요.
      </p>
    </div>
  );
}
