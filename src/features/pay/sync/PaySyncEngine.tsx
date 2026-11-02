import { useEffect, useRef } from "react";
import { useAuthUser } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useSyncStatusStore } from "../../../store/useSyncStatusStore";
import { usePayStore } from "../store/usePayStore";
import { fetchRemotePayData, pushPayAndReportStatus } from "./paySyncApi";
import { mergePayData } from "./paySyncMerge";

const PUSH_DEBOUNCE_MS = 1500;
const REALTIME_DEBOUNCE_MS = 500;

async function pullAndMerge(userId: string): Promise<void> {
  const remote = await fetchRemotePayData(userId);
  const local = usePayStore.getState();
  const merged = mergePayData(local, remote);

  const changed =
    JSON.stringify(merged.records) !== JSON.stringify(local.records) ||
    merged.optionsUpdatedAt !== local.optionsUpdatedAt;

  if (changed) {
    usePayStore.getState().restoreFromBackup({ version: 2, ...merged });
  }
}

// useAppStore용 SyncEngine과 같은 구조를 알바 계산기 스토어에도 그대로 둔다.
// 다만 게스트 데이터 선택창은 없다: 근무 기록은 병합 규칙(나중에 고친 쪽이 이김)대로 그냥 조용히 합친다.
export default function PaySyncEngine() {
  const { user } = useAuthUser();
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
        await pullAndMerge(user.id);
        await pushPayAndReportStatus(user.id);
      } catch {
        setStatus(navigator.onLine ? "error" : "offline");
      }
    })();
  }, [user, setStatus]);

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = usePayStore.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        pushPayAndReportStatus(user.id);
      }, PUSH_DEBOUNCE_MS);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        pullAndMerge(user.id).catch(() => setStatus(navigator.onLine ? "error" : "offline"));
      }, REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`pay-sync:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_records", filter: `user_id=eq.${user.id}` },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pay_settings", filter: `user_id=eq.${user.id}` },
        scheduleRefetch,
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefetch();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      pushPayAndReportStatus(user.id);
      pullAndMerge(user.id).catch(() => setStatus("error"));
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      supabase.removeChannel(channel);
    };
  }, [user, setStatus]);

  return null;
}
