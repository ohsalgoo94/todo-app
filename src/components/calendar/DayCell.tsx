import { format } from "date-fns";
import DayRing, { type CategorySegment } from "./DayRing";

type Props = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  totalCount?: number;
  segments?: CategorySegment[];
  hasMemo?: boolean;
  compact?: boolean;
  onSelect: () => void;
};

export default function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  totalCount = 0,
  segments = [],
  hasMemo = false,
  compact = false,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-1 py-2"
    >
      <span
        className={`relative flex h-7 w-7 items-center justify-center rounded-full text-sm ${
          isSelected
            ? "bg-rose-500 font-semibold text-white"
            : isToday
              ? "font-semibold text-rose-500 ring-2 ring-rose-400"
              : isCurrentMonth
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-300 dark:text-gray-600"
        }`}
      >
        {format(date, "d")}
        {hasMemo && !compact && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />}
      </span>
      {!compact && <DayRing totalCount={totalCount} segments={segments} />}
    </button>
  );
}
