import type { AppData, DayMemo, SyncFields } from "../types";
import type { RemoteData } from "./syncApi";

// 같은 id가 양쪽에 있으면 updatedAt이 더 나중인 쪽이 이긴다. 같으면 서버(remote) 쪽을 택한다.
// 삭제도 그냥 updatedAt이 더 나중인 변경일 뿐이라, 별도 규칙 없이 이 비교 하나로 "삭제가 수정을 이긴다"까지 처리된다.
function mergeById<T extends { id: string } & SyncFields>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of local) byId.set(item.id, item);
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function mergeDayMemos(local: Record<string, DayMemo>, remote: Record<string, DayMemo>): Record<string, DayMemo> {
  const merged = { ...local };
  for (const [date, remoteMemo] of Object.entries(remote)) {
    const localMemo = merged[date];
    if (!localMemo || remoteMemo.updatedAt >= localMemo.updatedAt) merged[date] = remoteMemo;
  }
  return merged;
}

export function mergeAppData(local: AppData, remote: RemoteData): AppData {
  return {
    version: 2,
    deviceId: local.deviceId,
    categories: mergeById(local.categories, remote.categories),
    tasks: mergeById(local.tasks, remote.tasks),
    routines: mergeById(local.routines, remote.routines),
    dayMemos: mergeDayMemos(local.dayMemos, remote.dayMemos),
  };
}
