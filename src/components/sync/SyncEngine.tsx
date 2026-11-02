import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "../../lib/auth";
import { downloadBackup } from "../../lib/backup";
import { supabase } from "../../lib/supabase";
import { fetchRemoteData, isRemoteDataEmpty, pushAndReportStatus, type RemoteData } from "../../lib/syncApi";
import { syncDownAndMerge } from "../../lib/syncDown";
import { getLinkedAccountId, setLinkedAccountId } from "../../lib/syncLinkedAccount";
import { mergeAppData } from "../../lib/syncMerge";
import { useAppStore } from "../../store/useAppStore";
import { useSyncStatusStore } from "../../store/useSyncStatusStore";
import GuestMergeDialog from "./GuestMergeDialog";

const PUSH_DEBOUNCE_MS = 1500;
const REALTIME_DEBOUNCE_MS = 500;

// 화면에 보이는 게 없고(선택창 뜨기 전까지), 로그인 상태를 지켜보면서
// 로그인 직후 1회 병합 처리, 이후 로컬 변경 디바운스 업로드, 다른 기기 변경 실시간 반영을 담당한다.
export default function SyncEngine() {
  const { user } = useAuthUser();
  const [pendingRemote, setPendingRemote] = useState<RemoteData | null>(null);
  const resolvedForUserId = useRef<string | null>(null);
  const setStatus = useSyncStatusStore((s) => s.setStatus);

  // 이미 이 브라우저에서 연결해본 계정이면 조용히 받아와 병합하고,
  // 처음 보는 계정(또는 다른 계정)이면 게스트 데이터 처리 선택창을 띄운다
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
        if (getLinkedAccountId() === user.id) {
          await syncDownAndMerge(user.id);
          await pushAndReportStatus(user.id);
          return;
        }
        const remote = await fetchRemoteData(user.id);
        if (isRemoteDataEmpty(remote)) {
          await pushAndReportStatus(user.id);
          setLinkedAccountId(user.id);
        } else {
          setPendingRemote(remote);
          setStatus("idle");
        }
      } catch {
        setStatus(navigator.onLine ? "error" : "offline");
      }
    })();
  }, [user, setStatus]);

  // 로컬 변경 → 디바운스 후 업로드
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

  // 다른 기기의 변경을 Realtime으로 받는다. 연결이 끊겨도 탭이 다시 보일 때 한 번 더 받아오는 것으로 보완한다.
  useEffect(() => {
    if (!user || pendingRemote) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        syncDownAndMerge(user.id).catch(() => setStatus(navigator.onLine ? "error" : "offline"));
      }, REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`sync:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${user.id}` },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "routines", filter: `user_id=eq.${user.id}` },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day_memos", filter: `user_id=eq.${user.id}` },
        scheduleRefetch,
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefetch();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      supabase.removeChannel(channel);
    };
  }, [user, pendingRemote, setStatus]);

  // 오프라인이면 상태를 바로 표시하고, 연결이 돌아오면 밀린 로컬 변경을 올리고 놓친 서버 변경도 받아온다.
  // (매번 전체 상태를 통째로 올리는 방식이라 별도의 "대기열"이 필요 없다 — 다음 성공한 push가 그동안
  //  쌓인 변경을 전부 포함한다.)
  useEffect(() => {
    if (!user || pendingRemote) return;

    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      pushAndReportStatus(user.id);
      syncDownAndMerge(user.id).catch(() => setStatus("error"));
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [user, pendingRemote, setStatus]);

  if (!pendingRemote || !user) return null;

  const handleMerge = async () => {
    const merged = mergeAppData(useAppStore.getState(), pendingRemote);
    useAppStore.getState().restoreFromBackup(merged);
    setPendingRemote(null);
    setLinkedAccountId(user.id);
    await pushAndReportStatus(user.id);
  };

  const handleUseServerOnly = async () => {
    downloadBackup(useAppStore.getState());
    const { deviceId } = useAppStore.getState();
    useAppStore.getState().restoreFromBackup({ version: 2, deviceId, ...pendingRemote });
    setPendingRemote(null);
    setLinkedAccountId(user.id);
    useSyncStatusStore.getState().setSynced(new Date().toISOString());
  };

  return <GuestMergeDialog onMerge={handleMerge} onUseServerOnly={handleUseServerOnly} />;
}
