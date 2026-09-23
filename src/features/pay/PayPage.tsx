import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import { shiftMonth } from "../../lib/date";
import PayCalendar from "./components/PayCalendar";
import WorkTimePicker from "./components/WorkTimePicker";
import { usePayStore } from "./store/usePayStore";

export default function PayPage() {
  const records = usePayStore((s) => s.records);
  const setWorkRecord = usePayStore((s) => s.setWorkRecord);
  const deleteWorkRecord = usePayStore((s) => s.deleteWorkRecord);

  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(new Date()));
  // 선택한 날짜 = 입력 창이 열려 있는 날짜
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleShiftMonth = (delta: number) => setViewedMonth((m) => shiftMonth(m, delta));

  return (
    <main className="flex-1 overflow-y-auto px-2 pb-4">
      <div className="flex items-center justify-center gap-2 px-2 py-3">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => handleShiftMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          ‹
        </button>
        <span className="font-medium text-gray-900 dark:text-gray-100">{format(viewedMonth, "yyyy년 M월")}</span>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => handleShiftMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
        >
          ›
        </button>
      </div>

      <PayCalendar
        viewedMonth={viewedMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onShiftMonth={handleShiftMonth}
      />

      {selectedDate && (
        <WorkTimePicker
          date={selectedDate}
          initialMinutes={records[selectedDate]?.minutes ?? null}
          onDone={(minutes) => {
            setWorkRecord(selectedDate, { minutes, nightMinutes: records[selectedDate]?.nightMinutes ?? 0 });
            setSelectedDate(null);
          }}
          onDelete={() => {
            deleteWorkRecord(selectedDate);
            setSelectedDate(null);
          }}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </main>
  );
}
