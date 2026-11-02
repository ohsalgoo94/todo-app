import { useState } from "react";
import { useAuthUser } from "../../lib/auth";
import { useManualSync } from "../../lib/useManualSync";
import { useSyncStatusStore, type SyncStatus } from "../../store/useSyncStatusStore";

const STATUS_DOT_STYLE: Record<SyncStatus, string> = {
  idle: "bg-gray-300 dark:bg-gray-600",
  syncing: "animate-pulse bg-gray-400 dark:bg-gray-500",
  synced: "bg-emerald-500",
  offline: "bg-gray-400 dark:bg-gray-500",
  error: "bg-amber-500",
};

const STATUS_LABEL: Record<SyncStatus, string> = {
  idle: "대기 중",
  syncing: "동기화 중",
  synced: "동기화됨",
  offline: "오프라인",
  error: "동기화 실패",
};

export default function SyncStatusDot() {
  const { user } = useAuthUser();
  const status = useSyncStatusStore((s) => s.status);
  const lastSyncedAt = useSyncStatusStore((s) => s.lastSyncedAt);
  const syncNow = useManualSync();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`동기화 상태: ${STATUS_LABEL[status]}`}
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center"
      >
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT_STYLE[status]}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-[56] w-52 rounded-2xl bg-white p-3 text-xs shadow-lg dark:bg-gray-800">
            <p className="mb-2 text-gray-500 dark:text-gray-400">
              {lastSyncedAt
                ? `마지막 동기화: ${new Date(lastSyncedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
                : "아직 동기화 전"}
            </p>
            <button
              type="button"
              onClick={syncNow}
              className="w-full rounded-full bg-gray-900 py-1.5 text-white dark:bg-gray-100 dark:text-gray-900"
            >
              지금 동기화
            </button>
          </div>
        </>
      )}
    </div>
  );
}
