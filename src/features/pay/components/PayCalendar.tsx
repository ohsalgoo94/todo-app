import { useRef, type TouchEvent } from "react";
import { getMonthGrid, toDateKey } from "../../../lib/date";
import { usePayStore } from "../store/usePayStore";
import PayDayCell from "./PayDayCell";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const SWIPE_THRESHOLD_PX = 50;

type Props = {
  viewedMonth: Date;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onShiftMonth: (delta: number) => void;
};

export default function PayCalendar({ viewedMonth, selectedDate, onSelectDate, onShiftMonth }: Props) {
  const records = usePayStore((s) => s.records);
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

          if (!isCurrentMonth) {
            return <div key={dateKey} />;
          }

          return (
            <PayDayCell
              key={dateKey}
              date={date}
              isToday={dateKey === todayKey}
              isSelected={dateKey === selectedDate}
              workMinutes={records[dateKey]?.minutes ?? null}
              onSelect={() => onSelectDate(dateKey)}
            />
          );
        })}
      </div>
    </div>
  );
}
