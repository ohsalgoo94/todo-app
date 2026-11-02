import type { SyncFields } from "../types";

// 이미 동기화 필드가 있으면 그대로 두고, 없으면 채운다. 여러 스토어의 마이그레이션에서 같이 쓴다.
export function withSyncFields<T extends Partial<SyncFields>>(item: T, now: string): T & SyncFields {
  return { ...item, updatedAt: item.updatedAt ?? now, deleted: item.deleted ?? false };
}
