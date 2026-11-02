import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

type SyncStatusStore = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  setStatus: (status: SyncStatus) => void;
  setSynced: (at: string) => void;
};

export const useSyncStatusStore = create<SyncStatusStore>((set) => ({
  status: "idle",
  lastSyncedAt: null,
  setStatus: (status) => set({ status }),
  setSynced: (at) => set({ status: "synced", lastSyncedAt: at }),
}));
