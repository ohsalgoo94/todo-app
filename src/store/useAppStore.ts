import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import defaults from "../data/defaults.json";
import type { AppData } from "../types";

const STORAGE_KEY = "todo-app:v1";

// zustand persist 기본 포맷은 {state, version}으로 한 겹 감싸는데,
// 스펙대로 localStorage 값 자체가 AppData가 되도록 감싸는 겹을 벗겨서 읽고 쓴다.
// 마이그레이션은 zustand의 version이 아니라 AppData.version 필드로 직접 처리한다.
const flatStorage: PersistStorage<AppData> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    return raw ? { state: JSON.parse(raw) as AppData, version: 0 } : null;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value.state));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

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
    storage: flatStorage,
  }),
);

if (isFirstRun) {
  // persist는 set()이 호출되기 전까지 localStorage에 쓰지 않으므로, 첫 실행 상태를 바로 기록해 둔다
  useAppStore.setState(useAppStore.getState());
}
