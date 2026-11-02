import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "../../lib/auth";
import { downloadBackup } from "../../lib/backup";
import { fetchRemoteData, isRemoteDataEmpty, pushAndReportStatus, type RemoteData } from "../../lib/syncApi";
import { mergeAppData } from "../../lib/syncMerge";
import { useAppStore } from "../../store/useAppStore";
import { useSyncStatusStore } from "../../store/useSyncStatusStore";
import GuestMergeDialog from "./GuestMergeDialog";

const PUSH_DEBOUNCE_MS = 1500;

// 화면에 보이는 게 없고(선택창 뜨기 전까지), 로그인 상태를 지켜보면서
// 로그인 직후 1회 병합 처리와, 이후 로컬 변경을 디바운스해서 올리는 걸 담당한다.
export default function SyncEngine() {
  const { user } = useAuthUser();
  const [pendingRemote, setPendingRemote] = useState<RemoteData | null>(null);
  const resolvedForUserId = useRef<string | null>(null);
  const setStatus = useSyncStatusStore((s) => s.setStatus);

  useEffect(() => {
    if (!user) {
      resolvedForUserId.current = null;
      return;
    }
    if (resolvedForUserId.current === user.id) return;
    resolvedForUserId.current = user.id;

    (async () => {
      setStatus("syncing");
      try {
        const remote = await fetchRemoteData(user.id);
        if (isRemoteDataEmpty(remote)) {
          await pushAndReportStatus(user.id);
        } else {
          setPendingRemote(remote);
          setStatus("idle");
        }
      } catch {
        setStatus(navigator.onLine ? "error" : "offline");
      }
    })();
  }, [user, setStatus]);

  useEffect(() => {
    if (!user || pendingRemote) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useAppStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        pushAndReportStatus(user.id);
      }, PUSH_DEBOUNCE_MS);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [user, pendingRemote]);

  if (!pendingRemote || !user) return null;

  const handleMerge = async () => {
    const merged = mergeAppData(useAppStore.getState(), pendingRemote);
    useAppStore.getState().restoreFromBackup(merged);
    setPendingRemote(null);
    await pushAndReportStatus(user.id);
  };

  const handleUseServerOnly = async () => {
    downloadBackup(useAppStore.getState());
    const { deviceId } = useAppStore.getState();
    useAppStore.getState().restoreFromBackup({ version: 2, deviceId, ...pendingRemote });
    setPendingRemote(null);
    useSyncStatusStore.getState().setSynced(new Date().toISOString());
  };

  return <GuestMergeDialog onMerge={handleMerge} onUseServerOnly={handleUseServerOnly} />;
}
