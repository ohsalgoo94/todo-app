// Supabase가 영어로 주는 인증 에러 메시지를 한국어로 바꿔준다.
const KNOWN_ERRORS: [RegExp, string][] = [
  [/invalid login credentials/i, "이메일 또는 비밀번호가 맞지 않아요"],
  [/user already registered/i, "이미 가입된 이메일이에요"],
  [/email not confirmed/i, "이메일 인증을 먼저 완료해주세요"],
  [/password should be at least/i, "비밀번호는 8자 이상이어야 해요"],
  [/unable to validate email address/i, "이메일 형식이 올바르지 않아요"],
  [/rate limit/i, "요청이 너무 많아요. 잠시 후 다시 시도해주세요"],
];

export function toKoreanAuthError(message: string): string {
  const matched = KNOWN_ERRORS.find(([pattern]) => pattern.test(message));
  return matched ? matched[1] : "문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}
