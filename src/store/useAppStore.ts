import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import defaults from "../data/defaults.json";
import { addDaysToKey } from "../lib/date";
import type { AppData, Category, DayMemo, Routine, SyncFields, Task } from "../types";

const STORAGE_KEY = "todo-app:v2";
const LEGACY_STORAGE_KEY = "todo-app:v1"; // 복구용으로 지우지 않고 그대로 둔다

function withSyncFields<T extends Partial<SyncFields>>(item: T, now: string): T & SyncFields {
  return { ...item, updatedAt: item.updatedAt ?? now, deleted: item.deleted ?? false };
}

// v1(동기화 필드 없음)이든 v2든, 들어오는 데이터에 빠진 동기화 필드를 채워서 항상 같은 모양으로 맞춘다.
// localStorage 마이그레이션과 백업 파일 가져오기 양쪽에서 같이 쓴다.
function migrateAppData(raw: Record<string, unknown>, now: string): AppData {
  const dayMemosRaw = (raw.dayMemos as Record<string, unknown>) ?? {};
  return {
    version: 2,
    deviceId: (raw.deviceId as string) ?? crypto.randomUUID(),
    categories: ((raw.categories as Category[]) ?? []).map((c) => withSyncFields(c, now)),
    tasks: ((raw.tasks as Task[]) ?? []).map((t) => withSyncFields(t, now)),
    routines: ((raw.routines as Routine[]) ?? []).map((r) => withSyncFields(r, now)),
    dayMemos: Object.fromEntries(
      Object.entries(dayMemosRaw).map(([date, value]) => [
        date,
        typeof value === "string"
          ? { content: value, updatedAt: now, deleted: false }
          : withSyncFields(value as Partial<DayMemo> & { content: string }, now),
      ]),
    ),
  };
}

type AppStore = AppData & {
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, patch: Partial<Pick<Category, "name" | "color">>) => void;
  deleteCategory: (id: string) => void;
  addTask: (categoryId: string, date: string, title: string) => void;
  toggleTaskDone: (id: string) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, "title" | "memo" | "date">>) => void;
  deleteTask: (id: string) => void;
  restoreTask: (task: Task) => void;
  setDayMemo: (date: string, text: string) => void;
  materializeRoutineTask: (routineId: string, date: string) => string;
  createRoutineFromTask: (taskId: string, rule: Routine["rule"], endDate?: string) => void;
  deleteRoutineOccurrence: (routineId: string, date: string) => void;
  endRoutineFrom: (routineId: string, date: string) => void;
  reorderTasksWithinCategory: (categoryId: string, date: string, orderedTaskIds: string[]) => void;
  moveTaskToCategory: (taskId: string, categoryId: string) => void;
  reorderCategories: (orderedCategoryIds: string[]) => void;
  restoreFromBackup: (data: AppData) => void;
  renameRoutine: (routineId: string, title: string) => void;
};

// zustand persist 기본 포맷은 {state, version}으로 한 겹 감싸는데,
// 스펙대로 localStorage 값 자체가 AppData가 되도록 감싸는 겹을 벗겨서 읽고 쓴다.
// 마이그레이션은 zustand의 version이 아니라 AppData.version 필드로 직접 처리한다.
const flatStorage: PersistStorage<AppStore> = {
  getItem: (name) => {
    const now = new Date().toISOString();
    const raw = localStorage.getItem(name);
    if (raw) return { state: migrateAppData(JSON.parse(raw), now) as AppStore, version: 0 };
    // v2가 없으면 v1에서 마이그레이션한다. v1은 지우지 않고 그대로 둔다 (복구용).
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    return { state: migrateAppData(JSON.parse(legacyRaw), now) as AppStore, version: 0 };
  },
  setItem: (name, value) => {
    // value.state에 있는 함수(액션)는 JSON.stringify가 자동으로 걸러낸다
    localStorage.setItem(name, JSON.stringify(value.state));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

function createDefaultState(): AppData {
  const now = new Date().toISOString();
  return {
    version: 2,
    deviceId: crypto.randomUUID(),
    categories: defaults.categories.map((c, i) => ({
      id: crypto.randomUUID(),
      name: c.name,
      color: c.color,
      order: i,
      updatedAt: now,
      deleted: false,
    })),
    tasks: [],
    routines: [],
    dayMemos: {},
  };
}

const isFirstRun = localStorage.getItem(STORAGE_KEY) === null;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),
      addCategory: (name, color) =>
        set((s) => ({
          categories: [
            ...s.categories,
            {
              id: crypto.randomUUID(),
              name,
              color,
              order: s.categories.length,
              updatedAt: new Date().toISOString(),
              deleted: false,
            },
          ],
        })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
          ),
        })),
      // 카테고리를 지워도 실제로 지우지 않고 deleted만 표시한다 (다른 기기와 동기화하기 전까지는 복구용).
      // 그 카테고리의 할 일들도 같이 deleted 표시한다.
      deleteCategory: (id) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            categories: s.categories.map((c) =>
              c.id === id ? { ...c, deleted: true, deletedAt: now, updatedAt: now } : c,
            ),
            tasks: s.tasks.map((t) =>
              t.categoryId === id ? { ...t, deleted: true, deletedAt: now, updatedAt: now } : t,
            ),
          };
        }),
      addTask: (categoryId, date, title) =>
        set((s) => {
          const order = s.tasks.filter((t) => t.categoryId === categoryId && t.date === date && !t.deleted).length;
          return {
            tasks: [
              ...s.tasks,
              {
                id: crypto.randomUUID(),
                title,
                categoryId,
                date,
                done: false,
                memo: "",
                alarm: null,
                order,
                updatedAt: new Date().toISOString(),
                deleted: false,
              },
            ],
          };
        }),
      toggleTaskDone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                  doneAt: !t.done ? new Date().toISOString() : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        })),
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
        })),
      deleteTask: (id) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, deleted: true, deletedAt: now, updatedAt: now } : t)),
          };
        }),
      // 실행 취소: 삭제 직전에 들고 있던 할 일을 그대로 되살린다 (deleteTask가 실제로 지우지 않으므로 같은 id가 이미 있음).
      restoreTask: (task) =>
        set((s) => {
          const now = new Date().toISOString();
          const restored = { ...task, deleted: false, deletedAt: undefined, updatedAt: now };
          const exists = s.tasks.some((t) => t.id === task.id);
          return {
            tasks: exists ? s.tasks.map((t) => (t.id === task.id ? restored : t)) : [...s.tasks, restored],
          };
        }),
      setDayMemo: (date, text) =>
        set((s) => ({
          dayMemos: { ...s.dayMemos, [date]: { content: text, updatedAt: new Date().toISOString(), deleted: false } },
        })),
      materializeRoutineTask: (routineId, date) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (!routine) throw new Error(`routine not found: ${routineId}`);
        const id = crypto.randomUUID();
        set((s) => {
          const order = s.tasks.filter(
            (t) => t.categoryId === routine.categoryId && t.date === date && !t.deleted,
          ).length;
          return {
            tasks: [
              ...s.tasks,
              {
                id,
                title: routine.title,
                categoryId: routine.categoryId,
                date,
                done: false,
                memo: "",
                alarm: routine.alarm,
                routineId: routine.id,
                order,
                updatedAt: new Date().toISOString(),
                deleted: false,
              },
            ],
          };
        });
        return id;
      },
      createRoutineFromTask: (taskId, rule, endDate) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const routine: Routine = {
          id: crypto.randomUUID(),
          title: task.title,
          categoryId: task.categoryId,
          rule,
          startDate: task.date,
          endDate,
          alarm: task.alarm,
          skippedDates: [],
          updatedAt: new Date().toISOString(),
          deleted: false,
        };
        set((s) => ({
          routines: [...s.routines, routine],
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, routineId: routine.id, updatedAt: new Date().toISOString() } : t,
          ),
        }));
      },
      deleteRoutineOccurrence: (routineId, date) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            routines: s.routines.map((r) =>
              r.id === routineId ? { ...r, skippedDates: [...r.skippedDates, date], updatedAt: now } : r,
            ),
            tasks: s.tasks.map((t) =>
              t.routineId === routineId && t.date === date
                ? { ...t, deleted: true, deletedAt: now, updatedAt: now }
                : t,
            ),
          };
        }),
      endRoutineFrom: (routineId, date) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            routines: s.routines.map((r) =>
              r.id === routineId ? { ...r, endDate: addDaysToKey(date, -1), updatedAt: now } : r,
            ),
            tasks: s.tasks.map((t) =>
              t.routineId === routineId && t.date >= date
                ? { ...t, deleted: true, deletedAt: now, updatedAt: now }
                : t,
            ),
          };
        }),
      reorderTasksWithinCategory: (categoryId, date, orderedTaskIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.categoryId !== categoryId || t.date !== date) return t;
            const newOrder = orderedTaskIds.indexOf(t.id);
            return newOrder === -1 ? t : { ...t, order: newOrder, updatedAt: new Date().toISOString() };
          }),
        })),
      moveTaskToCategory: (taskId, categoryId) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === taskId);
          if (!task) return {};
          const order = s.tasks.filter(
            (t) => t.categoryId === categoryId && t.date === task.date && !t.deleted,
          ).length;
          return {
            tasks: s.tasks.map((t) =>
              t.id === taskId ? { ...t, categoryId, order, updatedAt: new Date().toISOString() } : t,
            ),
          };
        }),
      reorderCategories: (orderedCategoryIds) =>
        set((s) => ({
          categories: s.categories.map((c) => {
            const newOrder = orderedCategoryIds.indexOf(c.id);
            return newOrder === -1 ? c : { ...c, order: newOrder, updatedAt: new Date().toISOString() };
          }),
        })),
      restoreFromBackup: (data) => set(() => migrateAppData(data, new Date().toISOString())),
      // 루틴 할 일의 이름을 바꾸면, 완료되지 않은 나머지 모든 회차(과거에 이미 실제 Task로 저장된 것 포함)와
      // 루틴 자체의 이름도 같이 바꿔서, 아직 계산 안 된 미래 회차도 새 이름으로 나오게 한다.
      renameRoutine: (routineId, title) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            routines: s.routines.map((r) => (r.id === routineId ? { ...r, title, updatedAt: now } : r)),
            tasks: s.tasks.map((t) =>
              t.routineId === routineId && !t.done ? { ...t, title, updatedAt: now } : t,
            ),
          };
        }),
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
