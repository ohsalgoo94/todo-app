import { format, parseISO } from "date-fns";
import { useState } from "react";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

type Props = {
  date: string;
  initialMinutes: number | null;
  onDone: (minutes: number) => void;
  onDelete: () => void;
  onClose: () => void;
};

export default function WorkTimePicker({ date, initialMinutes, onDone, onDelete, onClose }: Props) {
  const [hour, setHour] = useState(initialMinutes !== null ? Math.floor(initialMinutes / 60) : 0);
  const [minute, setMinute] = useState(initialMinutes !== null ? initialMinutes % 60 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[360px] rounded-3xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          {format(parseISO(date), "M월 d일")} 근무 시간
        </h3>

        <div className="mb-6 flex items-center justify-center gap-3">
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}시간
              </option>
            ))}
          </select>
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={initialMinutes === null}
            className="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-500 disabled:opacity-40 dark:bg-rose-950 dark:text-rose-300"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => onDone(hour * 60 + minute)}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-gray-100 dark:text-gray-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
