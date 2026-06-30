// 전화번호 정규화/검증. 숫자만 저장하고, 로그인 ID 겸 고유키로 사용.

export function normalizePhone(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

export function isValidPhone(digits: string): boolean {
  // 한국 휴대폰 기준: 0으로 시작하는 10~11자리 숫자.
  return /^0\d{9,10}$/.test(digits);
}

export function formatPhone(digits: string): string {
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}
