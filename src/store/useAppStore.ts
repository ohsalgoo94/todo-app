import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import defaults from "../data/defaults.json";
import type { AppData } from "../types";

const STORAGE_KEY = "todo-app:v1";

function createDefaultState(): AppData {
  return {
    version: 1,
    deviceId: crypto.randomUUID(),
    categories: defaults.categories.map((c, i) => ({
      id: crypto.randomUUID(),
      name: c.name,
      color: c.color,
      order: i,
      collapsed: false,
    })),
    tasks: [],
    routines: [],
    dayMemos: {},
  };
}

const isFirstRun = localStorage.getItem(STORAGE_KEY) === null;

export const useAppStore = create<AppData>()(
  persist(createDefaultState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
  }),
);

if (isFirstRun) {
  // persist는 set()이 호출되기 전까지 localStorage에 쓰지 않으므로, 첫 실행 상태를 바로 기록해 둔다
  useAppStore.setState(useAppStore.getState());
}
