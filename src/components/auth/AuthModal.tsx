import { useState, type FormEvent } from "react";
import { toKoreanAuthError } from "../../lib/authErrors";
import { supabase } from "../../lib/supabase";

type Tab = "login" | "signup";

type Props = {
  onClose: () => void;
};

export default function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("login");
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchTab = (next: Tab) => {
    setTab(next);
    setIsResetMode(false);
    setError(null);
    setInfo(null);
    setPassword("");
    setConfirmPassword("");
  };

  const openResetMode = () => {
    setIsResetMode(true);
    setError(null);
    setInfo(null);
  };

  const closeResetMode = () => {
    setIsResetMode(false);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (isResetMode) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) {
        setError(toKoreanAuthError(error.message));
        return;
      }
      setInfo("비밀번호 재설정 메일을 보냈어요. 메일함을 확인해주세요.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요");
      return;
    }
    if (tab === "signup" && password !== confirmPassword) {
      setError("비밀번호가 서로 달라요");
      return;
    }

    setLoading(true);
    const { error } =
      tab === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(toKoreanAuthError(error.message));
      return;
    }

    if (tab === "signup") {
      setTab("login");
      setPassword("");
      setConfirmPassword("");
      setInfo("인증 메일을 보냈어요. 메일함에서 인증을 완료한 뒤 로그인해주세요.");
      return;
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex animate-fade-in items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] animate-modal-in rounded-3xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isResetMode ? "비밀번호 재설정" : "계정"}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 active:bg-gray-100 dark:active:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {!isResetMode && (
          <div className="mb-4 flex gap-2">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`flex-1 rounded-full py-2 text-sm ${
                  tab === t
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">이메일</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {!isResetMode && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">
                비밀번호 (8자 이상)
              </label>
              <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-gray-900 outline-none dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-xs text-gray-400 dark:text-gray-500"
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </div>
          )}

          {!isResetMode && tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">
                비밀번호 확인
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          {error && <p className="text-xs text-rose-500">{error}</p>}
          {info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
          >
            {loading ? "처리 중..." : isResetMode ? "재설정 메일 보내기" : tab === "login" ? "로그인" : "회원가입"}
          </button>
        </form>

        {!isResetMode && tab === "login" && (
          <button
            type="button"
            onClick={openResetMode}
            className="mt-3 w-full text-center text-xs text-gray-400 dark:text-gray-500"
          >
            비밀번호를 잊으셨나요?
          </button>
        )}
        {isResetMode && (
          <button
            type="button"
            onClick={closeResetMode}
            className="mt-3 w-full text-center text-xs text-gray-400 dark:text-gray-500"
          >
            돌아가기
          </button>
        )}

        {!isResetMode && tab === "signup" && (
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            가입하면 인증 메일이 발송돼요. 인증 전에는 로그인할 수 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
