import { useAppStore } from "../store/useAppStore";
import { useSyncStatusStore } from "../store/useSyncStatusStore";
import type { AppData, Category, DayMemo, Routine, Task } from "../types";
import { supabase } from "./supabase";

export type RemoteData = Pick<AppData, "categories" | "tasks" | "routines" | "dayMemos">;

// local <-> Supabase 행 변환. camelCase(로컬) <-> snake_case(DB), alarm({hour,minute}) <-> alarm_hour/alarm_minute.
function categoryToRow(c: Category, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
    order: c.order,
    updated_at: c.updatedAt,
    deleted: c.deleted,
    deleted_at: c.deletedAt ?? null,
  };
}
function categoryFromRow(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    order: r.order,
    updatedAt: r.updated_at,
    deleted: r.deleted,
    deletedAt: r.deleted_at ?? undefined,
  };
}

function taskToRow(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    category_id: t.categoryId,
    date: t.date,
    done: t.done,
    done_at: t.doneAt ?? null,
    memo: t.memo,
    routine_id: t.routineId ?? null,
    order: t.order,
    alarm_hour: t.alarm?.hour ?? null,
    alarm_minute: t.alarm?.minute ?? null,
    updated_at: t.updatedAt,
    deleted: t.deleted,
    deleted_at: t.deletedAt ?? null,
  };
}
function taskFromRow(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    categoryId: r.category_id,
    date: r.date,
    done: r.done,
    doneAt: r.done_at ?? undefined,
    memo: r.memo,
    routineId: r.routine_id ?? undefined,
    order: r.order,
    alarm: r.alarm_hour != null && r.alarm_minute != null ? { hour: r.alarm_hour, minute: r.alarm_minute } : null,
    updatedAt: r.updated_at,
    deleted: r.deleted,
    deletedAt: r.deleted_at ?? undefined,
  };
}

function routineToRow(routine: Routine, userId: string) {
  return {
    id: routine.id,
    user_id: userId,
    title: routine.title,
    category_id: routine.categoryId,
    rule: routine.rule,
    start_date: routine.startDate,
    end_date: routine.endDate ?? null,
    alarm_hour: routine.alarm?.hour ?? null,
    alarm_minute: routine.alarm?.minute ?? null,
    skipped_dates: routine.skippedDates,
    updated_at: routine.updatedAt,
    deleted: routine.deleted,
    deleted_at: routine.deletedAt ?? null,
  };
}
function routineFromRow(r: any): Routine {
  return {
    id: r.id,
    title: r.title,
    categoryId: r.category_id,
    rule: r.rule,
    startDate: r.start_date,
    endDate: r.end_date ?? undefined,
    alarm: r.alarm_hour != null && r.alarm_minute != null ? { hour: r.alarm_hour, minute: r.alarm_minute } : null,
    skippedDates: r.skipped_dates ?? [],
    updatedAt: r.updated_at,
    deleted: r.deleted,
    deletedAt: r.deleted_at ?? undefined,
  };
}

function dayMemoToRow(date: string, memo: DayMemo, userId: string) {
  return {
    user_id: userId,
    date,
    content: memo.content,
    updated_at: memo.updatedAt,
    deleted: memo.deleted,
    deleted_at: memo.deletedAt ?? null,
  };
}
function dayMemoFromRow(r: any): [string, DayMemo] {
  return [
    r.date,
    { content: r.content, updatedAt: r.updated_at, deleted: r.deleted, deletedAt: r.deleted_at ?? undefined },
  ];
}

export async function fetchRemoteData(userId: string): Promise<RemoteData> {
  const [categories, tasks, routines, dayMemos] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("routines").select("*").eq("user_id", userId),
    supabase.from("day_memos").select("*").eq("user_id", userId),
  ]);
  for (const res of [categories, tasks, routines, dayMemos]) {
    if (res.error) throw res.error;
  }
  return {
    categories: (categories.data ?? []).map(categoryFromRow),
    tasks: (tasks.data ?? []).map(taskFromRow),
    routines: (routines.data ?? []).map(routineFromRow),
    dayMemos: Object.fromEntries((dayMemos.data ?? []).map(dayMemoFromRow)),
  };
}

export function isRemoteDataEmpty(data: RemoteData): boolean {
  return (
    data.categories.length === 0 &&
    data.tasks.length === 0 &&
    data.routines.length === 0 &&
    Object.keys(data.dayMemos).length === 0
  );
}

export async function pushLocalData(userId: string, data: AppData): Promise<void> {
  const categoryRows = data.categories.map((c) => categoryToRow(c, userId));
  const taskRows = data.tasks.map((t) => taskToRow(t, userId));
  const routineRows = data.routines.map((r) => routineToRow(r, userId));
  const dayMemoRows = Object.entries(data.dayMemos).map(([date, memo]) => dayMemoToRow(date, memo, userId));

  const results = await Promise.all([
    categoryRows.length ? supabase.from("categories").upsert(categoryRows) : null,
    taskRows.length ? supabase.from("tasks").upsert(taskRows) : null,
    routineRows.length ? supabase.from("routines").upsert(routineRows) : null,
    dayMemoRows.length ? supabase.from("day_memos").upsert(dayMemoRows, { onConflict: "user_id,date" }) : null,
  ]);
  for (const res of results) {
    if (res?.error) throw res.error;
  }
}

// 수동/디바운스 업로드 양쪽에서 같이 쓰는 "올리고 상태 표시까지" 묶음
export async function pushAndReportStatus(userId: string): Promise<void> {
  useSyncStatusStore.getState().setStatus("syncing");
  try {
    await pushLocalData(userId, useAppStore.getState());
    useSyncStatusStore.getState().setSynced(new Date().toISOString());
  } catch {
    useSyncStatusStore.getState().setStatus(navigator.onLine ? "error" : "offline");
  }
}
