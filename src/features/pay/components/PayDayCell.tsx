import { format } from "date-fns";

type Props = {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  workMinutes: number | null;
  onSelect: () => void;
};

function formatHm(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

export default function PayDayCell({ date, isToday, isSelected, workMinutes, onSelect }: Props) {
  return (
    <button type="button" onClick={onSelect} className="flex flex-col items-center gap-1 py-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
          isSelected
            ? "bg-rose-500 font-semibold text-white"
            : isToday
              ? "font-semibold text-rose-500 ring-2 ring-rose-400"
              : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {format(date, "d")}
      </span>
      <span className="h-4 text-[10px] leading-none text-gray-400 dark:text-gray-500">
        {workMinutes !== null && formatHm(workMinutes)}
      </span>
    </button>
  );
}
