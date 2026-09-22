import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import Calendar from "./components/calendar/Calendar";
import CategoryMenu from "./components/category/CategoryMenu";
import BottomBar from "./components/layout/BottomBar";
import { shiftMonth, toDateKey } from "./lib/date";

export default function App() {
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const handleShiftMonth = (delta: number) => setViewedMonth((m) => shiftMonth(m, delta));

  const handleGoToday = () => {
    setViewedMonth(startOfMonth(new Date()));
    setSelectedDate(toDateKey(new Date()));
  };

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => handleShiftMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
          >
            ‹
          </button>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {format(viewedMonth, "yyyy년 M월")}
          </span>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => handleShiftMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 active:bg-gray-200 dark:text-gray-400 dark:active:bg-gray-800"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          aria-label="카테고리 메뉴"
          onClick={() => setIsCategoryMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-700 active:bg-gray-100 dark:text-gray-200 dark:active:bg-gray-800"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
          </svg>
        </button>
      </header>

      <CategoryMenu isOpen={isCategoryMenuOpen} onClose={() => setIsCategoryMenuOpen(false)} />

      <main className="flex-1 overflow-y-auto px-2 pb-4">
        <Calendar
          viewedMonth={viewedMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onShiftMonth={handleShiftMonth}
        />
        <p className="px-2 pt-4 text-sm text-gray-500 dark:text-gray-400">
          선택한 날짜: {selectedDate} (할 일 목록은 5단계에서 채워집니다)
        </p>
      </main>

      <BottomBar onGoToday={handleGoToday} />
    </div>
  );
}
