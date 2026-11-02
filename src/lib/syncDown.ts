import { useAppStore } from "../store/useAppStore";
import { fetchRemoteData } from "./syncApi";
import { mergeAppData } from "./syncMerge";

// 서버 데이터를 받아와 병합 규칙대로 합치고, 실제로 바뀐 게 있을 때만 로컬 상태를 갱신한다.
// (바뀐 게 없는데도 매번 set()을 하면, 변경 감지 → 다시 업로드 → 실시간으로 또 받아오는 식으로
//  불필요하게 계속 도는 걸 막기 위해 비교 후에만 반영한다.)
export async function syncDownAndMerge(userId: string): Promise<void> {
  const remote = await fetchRemoteData(userId);
  const local = useAppStore.getState();
  const merged = mergeAppData(local, remote);

  const changed =
    JSON.stringify(merged.categories) !== JSON.stringify(local.categories) ||
    JSON.stringify(merged.tasks) !== JSON.stringify(local.tasks) ||
    JSON.stringify(merged.routines) !== JSON.stringify(local.routines) ||
    JSON.stringify(merged.dayMemos) !== JSON.stringify(local.dayMemos);

  if (changed) {
    useAppStore.getState().restoreFromBackup(merged);
  }
}
