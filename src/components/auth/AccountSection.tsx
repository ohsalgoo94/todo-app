import { useState } from "react";
import { useAuthUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import AuthModal from "./AuthModal";

export default function AccountSection() {
  const { user, loading } = useAuthUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    if (!confirm("로그아웃할까요?")) return;
    supabase.auth.signOut();
  };

  if (loading) return <div className="mb-4 h-11" />;

  return (
    <div className="mb-4 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800">
      {user ? (
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-full bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full rounded-full bg-gray-900 py-2 text-sm font-medium text-white dark:bg-gray-100 dark:text-gray-900"
        >
          로그인하고 기기 간 동기화하기
        </button>
      )}

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}
