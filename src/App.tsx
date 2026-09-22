import { format, parseISO, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";
import Calendar from "./components/calendar/Calendar";
import CategoryGroup from "./components/category/CategoryGroup";
import CategoryMenu from "./components/category/CategoryMenu";
import BottomBar from "./components/layout/BottomBar";
import DayMemo from "./components/memo/DayMemo";
import TaskDetailModal from "./components/task/TaskDetailModal";
import { shiftMonth, toDateKey } from "./lib/date";
import { useAppStore } from "./store/useAppStore";
import type { Task } from "./types";

const UNDO_TOAST_MS = 4000;

export default function App() {
  const categories = useAppStore((s) => s.categories);
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);
  const taskCountOnSelectedDate = useAppStore((s) => s.tasks.filter((t) => t.date === selectedDate).length);
  const selectedTask = useAppStore((s) => s.tasks.find((t) => t.id === selectedTaskId));
  const restoreTask = useAppStore((s) => s.restoreTask);

  useEffect(() => {
    if (!deletedTask) return;
    const timer = setTimeout(() => setDeletedTask(null), UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [deletedTask]);

  const handleShiftMonth = (delta: number) => setViewedMonth((m) => shiftMonth(m, delta));

  const handleGoToday = () => {
    setViewedMonth(startOfMonth(new Date()));
    setSelectedDate(toDateKey(new Date()));
  };

  const handleUndoDelete = () => {
    if (!deletedTask) return;
    restoreTask(deletedTask);
    setDeletedTask(null);
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
        <DayMemo date={selectedDate} />
        <Calendar
          viewedMonth={viewedMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onShiftMonth={handleShiftMonth}
        />
        <div className="px-2 pt-4">
          <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {format(parseISO(selectedDate), "M월 d일 (EEE)", { locale: ko })}
          </p>
          {categories.map((c) => (
            <CategoryGroup key={c.id} category={c} date={selectedDate} onOpenTask={setSelectedTaskId} />
          ))}
          {taskCountOnSelectedDate === 0 && (
            <p className="px-2 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              카테고리 옆 +를 눌러 할 일을 추가해보세요
            </p>
          )}
        </div>
      </main>

      <BottomBar onGoToday={handleGoToday} />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onDeleted={setDeletedTask}
        />
      )}

      {deletedTask && (
        <div className="fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
            <span>"{deletedTask.title}" 삭제됨</span>
            <button type="button" onClick={handleUndoDelete} className="font-semibold text-rose-300 dark:text-rose-600">
              실행 취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
