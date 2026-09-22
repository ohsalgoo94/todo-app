import { format, parseISO, startOfMonth } from "date-fns";
import { useState } from "react";
import { shiftMonth } from "../../lib/date";
import Calendar from "../calendar/Calendar";

type Props = {
  initialDate: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
};

export default function DatePickerModal({ initialDate, onConfirm, onClose }: Props) {
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(parseISO(initialDate)));
  const [pendingDate, setPendingDate] = useState(initialDate);

  const handleShiftMonth = (delta: number) => setViewedMonth((m) => shiftMonth(m, delta));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-3xl bg-white p-4 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <Calendar
          viewedMonth={viewedMonth}
          selectedDate={pendingDate}
          onSelectDate={setPendingDate}
          onShiftMonth={handleShiftMonth}
          compact
        />

        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => handleShiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 active:bg-gray-100 dark:text-gray-400 dark:active:bg-gray-800"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {format(viewedMonth, "yyyy년 M월")}
          </span>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => handleShiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 active:bg-gray-100 dark:text-gray-400 dark:active:bg-gray-800"
          >
            ›
          </button>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pendingDate)}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-gray-100 dark:text-gray-900"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
