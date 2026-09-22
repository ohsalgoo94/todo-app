import { parseISO, startOfMonth } from "date-fns";
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
          onShiftMonth={(delta) => setViewedMonth((m) => shiftMonth(m, delta))}
        />
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
