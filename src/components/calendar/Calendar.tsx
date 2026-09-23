import { useRef, type TouchEvent } from "react";
import { isMemoCategory } from "../../lib/category";
import { getMonthGrid, toDateKey } from "../../lib/date";
import { getDisplayTasksForDate } from "../../lib/routine";
import { useAppStore } from "../../store/useAppStore";
import DayCell from "./DayCell";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SWIPE_THRESHOLD_PX = 50;

type Props = {
  viewedMonth: Date;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onShiftMonth: (delta: number) => void;
  compact?: boolean;
};

export default function Calendar({ viewedMonth, selectedDate, onSelectDate, onShiftMonth, compact = false }: Props) {
  const tasks = useAppStore((s) => s.tasks);
  const routines = useAppStore((s) => s.routines);
  const categories = useAppStore((s) => s.categories);
  const dayMemos = useAppStore((s) => s.dayMemos);
  const touchStartX = useRef<number | null>(null);

  const days = getMonthGrid(viewedMonth);
  const todayKey = toDateKey(new Date());

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    onShiftMonth(dx > 0 ? -1 : 1);
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 dark:text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const isCurrentMonth = date.getMonth() === viewedMonth.getMonth();

          // 이전/다음 달 날짜는 칸만 비워두고 숫자·할 일 정보를 보여주지 않는다
          if (!isCurrentMonth) {
            return <div key={dateKey} />;
          }

          if (compact) {
            return (
              <DayCell
                key={dateKey}
                date={date}
                isToday={dateKey === todayKey}
                isSelected={dateKey === selectedDate}
                compact
                onSelect={() => onSelectDate(dateKey)}
              />
            );
          }

          // "memo" 카테고리 할 일은 캘린더 개수·색상 어디에도 반영하지 않는다
          const dateTasks = getDisplayTasksForDate(tasks, routines, dateKey).filter((t) => {
            const category = categories.find((c) => c.id === t.categoryId);
            return !category || !isMemoCategory(category.name);
          });
          const doneCountByCategory = new Map<string, number>();
          for (const t of dateTasks) {
            if (!t.done) continue;
            doneCountByCategory.set(t.categoryId, (doneCountByCategory.get(t.categoryId) ?? 0) + 1);
          }
          const segments = categories
            .filter((c) => doneCountByCategory.has(c.id))
            .map((c) => ({ color: c.color, count: doneCountByCategory.get(c.id)! }));

          return (
            <DayCell
              key={dateKey}
              date={date}
              isToday={dateKey === todayKey}
              isSelected={dateKey === selectedDate}
              totalCount={dateTasks.length}
              segments={segments}
              hasMemo={Boolean(dayMemos[dateKey]?.trim())}
              onSelect={() => onSelectDate(dateKey)}
            />
          );
        })}
      </div>
    </div>
  );
}
