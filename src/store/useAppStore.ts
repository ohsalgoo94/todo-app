import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import defaults from "../data/defaults.json";
import { addDaysToKey } from "../lib/date";
import type { AppData, Category, Routine, Task } from "../types";

const STORAGE_KEY = "todo-app:v1";

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
            { id: crypto.randomUUID(), name, color, order: s.categories.length },
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
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),
      restoreTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, task],
        })),
      setDayMemo: (date, text) =>
        set((s) => ({
          dayMemos: { ...s.dayMemos, [date]: text },
        })),
      materializeRoutineTask: (routineId, date) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (!routine) throw new Error(`routine not found: ${routineId}`);
        const id = crypto.randomUUID();
        set((s) => {
          const order = s.tasks.filter((t) => t.categoryId === routine.categoryId && t.date === date).length;
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
        };
        set((s) => ({
          routines: [...s.routines, routine],
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, routineId: routine.id } : t)),
        }));
      },
      deleteRoutineOccurrence: (routineId, date) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === routineId ? { ...r, skippedDates: [...r.skippedDates, date] } : r,
          ),
          tasks: s.tasks.filter((t) => !(t.routineId === routineId && t.date === date)),
        })),
      endRoutineFrom: (routineId, date) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === routineId ? { ...r, endDate: addDaysToKey(date, -1) } : r,
          ),
          tasks: s.tasks.filter((t) => !(t.routineId === routineId && t.date >= date)),
        })),
      reorderTasksWithinCategory: (categoryId, date, orderedTaskIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.categoryId !== categoryId || t.date !== date) return t;
            const newOrder = orderedTaskIds.indexOf(t.id);
            return newOrder === -1 ? t : { ...t, order: newOrder };
          }),
        })),
      moveTaskToCategory: (taskId, categoryId) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === taskId);
          if (!task) return {};
          const order = s.tasks.filter((t) => t.categoryId === categoryId && t.date === task.date).length;
          return {
            tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, categoryId, order } : t)),
          };
        }),
      reorderCategories: (orderedCategoryIds) =>
        set((s) => ({
          categories: s.categories.map((c) => {
            const newOrder = orderedCategoryIds.indexOf(c.id);
            return newOrder === -1 ? c : { ...c, order: newOrder };
          }),
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
