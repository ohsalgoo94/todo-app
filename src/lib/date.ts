import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function addDaysToKey(dateKey: string, days: number): string {
  return toDateKey(addDays(parseISO(dateKey), days));
}

export function getMonthGrid(viewedMonth: Date): Date[] {
  const start = startOfWeek(startOfMonth(viewedMonth));
  const end = endOfWeek(endOfMonth(viewedMonth));
  return eachDayOfInterval({ start, end });
}

export function shiftMonth(viewedMonth: Date, delta: number): Date {
  return addMonths(viewedMonth, delta);
}
