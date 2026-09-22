import { useRef, type TouchEvent } from "react";
import { getMonthGrid, toDateKey } from "../../lib/date";
import { useAppStore } from "../../store/useAppStore";
import DayCell from "./DayCell";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SWIPE_THRESHOLD_PX = 50;

type Props = {
  viewedMonth: Date;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onShiftMonth: (delta: number) => void;
};

export default function Calendar({ viewedMonth, selectedDate, onSelectDate, onShiftMonth }: Props) {
  const tasks = useAppStore((s) => s.tasks);
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
          return (
            <DayCell
              key={dateKey}
              date={date}
              isCurrentMonth={date.getMonth() === viewedMonth.getMonth()}
              isToday={dateKey === todayKey}
              isSelected={dateKey === selectedDate}
              taskCount={tasks.filter((t) => t.date === dateKey).length}
              onSelect={() => onSelectDate(dateKey)}
            />
          );
        })}
      </div>
    </div>
  );
}
