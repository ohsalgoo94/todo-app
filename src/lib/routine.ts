import type { Routine, Task } from "../types";

export function routineOccursOnDate(routine: Routine, dateKey: string): boolean {
  if (dateKey < routine.startDate) return false;
  if (routine.endDate && dateKey > routine.endDate) return false;
  if (routine.skippedDates.includes(dateKey)) return false;

  switch (routine.rule.type) {
    case "daily":
      return true;
    case "weekly": {
      const dayOfWeek = new Date(`${dateKey}T00:00:00`).getDay();
      return routine.rule.daysOfWeek.includes(dayOfWeek);
    }
    case "monthly": {
      // ponytail: 31일처럼 그 달에 없는 날짜는 그냥 건너뜀 (dateKey 문자열 비교라 자동으로 처리됨).
      // 말일로 당겨서 실행하고 싶다면 여기서 그 달의 마지막 날인지 확인하는 분기 추가.
      const dayOfMonth = Number(dateKey.slice(8, 10));
      return dayOfMonth === routine.rule.dayOfMonth;
    }
  }
}

export function getVirtualTaskId(routineId: string, date: string): string {
  return `virtual:${routineId}:${date}`;
}

export function isVirtualTaskId(id: string): boolean {
  return id.startsWith("virtual:");
}

// 루틴은 규칙만 저장하고, 날짜별 할 일은 여기서 그때그때 계산한다.
// 이미 실제 Task로 저장된(체크/편집/이동된) 날짜는 그 실제 데이터를 쓰고, 나머지만 가상 할 일로 채운다.
export function getDisplayTasksForDate(tasks: Task[], routines: Routine[], date: string): Task[] {
  const realTasksOnDate = tasks.filter((t) => t.date === date);
  const materializedRoutineIds = new Set(realTasksOnDate.filter((t) => t.routineId).map((t) => t.routineId));

  const virtualTasks: Task[] = routines
    .filter((r) => !materializedRoutineIds.has(r.id) && routineOccursOnDate(r, date))
    .map((r, i) => ({
      id: getVirtualTaskId(r.id, date),
      title: r.title,
      categoryId: r.categoryId,
      date,
      done: false,
      memo: "",
      alarm: r.alarm,
      routineId: r.id,
      order: realTasksOnDate.length + i,
    }));

  return [...realTasksOnDate, ...virtualTasks];
}
