import { useState } from "react";
import { useAuthUser } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { clearLinkedAccountId } from "../../lib/syncLinkedAccount";
import { useManualSync } from "../../lib/useManualSync";
import { useAppStore } from "../../store/useAppStore";
import { useSyncStatusStore } from "../../store/useSyncStatusStore";
import AuthModal from "./AuthModal";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

export default function AccountSection() {
  const { user, loading } = useAuthUser();
  const lastSyncedAt = useSyncStatusStore((s) => s.lastSyncedAt);
  const syncNow = useManualSync();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await supabase.auth.signOut();
    useAppStore.getState().resetToDefault();
    clearLinkedAccountId();
  };

  if (loading) return <div className="mb-4 h-11" />;

  return (
    <div className="mb-4 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800">
      {user ? (
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">{user.email}</span>
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="shrink-0 rounded-full bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            >
              로그아웃
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {lastSyncedAt
                ? `마지막 동기화: ${new Date(lastSyncedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
                : "아직 동기화 전"}
            </span>
            <button
              type="button"
              onClick={syncNow}
              className="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            >
              지금 동기화
            </button>
          </div>
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
      {isLogoutConfirmOpen && (
        <LogoutConfirmDialog onConfirm={handleConfirmLogout} onClose={() => setIsLogoutConfirmOpen(false)} />
      )}
    </div>
  );
}
