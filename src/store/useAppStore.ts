import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import defaults from "../data/defaults.json";
import type { AppData, Category } from "../types";

const STORAGE_KEY = "todo-app:v1";

type AppStore = AppData & {
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, "name" | "color" | "collapsed">>) => void;
  deleteCategory: (id: string) => void;
  addTask: (categoryId: string, date: string, title: string) => void;
  toggleTaskDone: (id: string) => void;
  setDayMemo: (date: string, text: string) => void;
};

// zustand persist 기본 포맷은 {state, version}으로 한 겹 감싸는데,
// 스펙대로 localStorage 값 자체가 AppData가 되도록 감싸는 겹을 벗겨서 읽고 쓴다.
// 마이그레이션은 zustand의 version이 아니라 AppData.version 필드로 직접 처리한다.
const flatStorage: PersistStorage<AppStore> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    return raw ? { state: JSON.parse(raw) as AppStore, version: 0 } : null;
  },
  setItem: (name, value) => {
    // value.state에 있는 함수(액션)는 JSON.stringify가 자동으로 걸러낸다
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

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...createDefaultState(),
      addCategory: (name, color) =>
        set((s) => ({
          categories: [
            ...s.categories,
            { id: crypto.randomUUID(), name, color, order: s.categories.length, collapsed: false },
          ],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          tasks: s.tasks.filter((t) => t.categoryId !== id),
        })),
      addTask: (categoryId, date, title) =>
        set((s) => {
          const order = s.tasks.filter((t) => t.categoryId === categoryId && t.date === date).length;
          return {
            tasks: [
              ...s.tasks,
              { id: crypto.randomUUID(), title, categoryId, date, done: false, memo: "", alarm: null, order },
            ],
          };
        }),
      toggleTaskDone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined } : t,
          ),
        })),
      setDayMemo: (date, text) =>
        set((s) => ({
          dayMemos: { ...s.dayMemos, [date]: text },
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: flatStorage,
    },
  ),
);

if (isFirstRun) {
  // persist는 set()이 호출되기 전까지 localStorage에 쓰지 않으므로, 첫 실행 상태를 바로 기록해 둔다
  useAppStore.setState(useAppStore.getState());
}
