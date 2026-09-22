import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
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
import { getDisplayTasksForDate, isVirtualTaskId } from "./lib/routine";
import { useAppStore } from "./store/useAppStore";
import type { Task } from "./types";

const UNDO_TOAST_MS = 4000;

export default function App() {
  const categories = useAppStore((s) => s.categories.slice().sort((a, b) => a.order - b.order));
  const allTasks = useAppStore((s) => s.tasks);
  const routines = useAppStore((s) => s.routines);
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);
  const restoreTask = useAppStore((s) => s.restoreTask);
  const materializeRoutineTask = useAppStore((s) => s.materializeRoutineTask);
  const reorderTasksWithinCategory = useAppStore((s) => s.reorderTasksWithinCategory);
  const moveTaskToCategory = useAppStore((s) => s.moveTaskToCategory);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // 루틴에서 계산되는 가상 할 일까지 포함한, 선택한 날짜의 전체 목록 (store 셀렉터 밖에서 계산)
  const displayTasksForSelectedDate = getDisplayTasksForDate(allTasks, routines, selectedDate);
  const taskCountOnSelectedDate = displayTasksForSelectedDate.length;
  const selectedTask = displayTasksForSelectedDate.find((t) => t.id === selectedTaskId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedTask = displayTasksForSelectedDate.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // 루틴 가상 할 일은 드래그(이동)하는 순간 실제 Task로 저장한다
    const realId = isVirtualTaskId(draggedTask.id)
      ? materializeRoutineTask(draggedTask.routineId!, draggedTask.date)
      : draggedTask.id;

    const overId = String(over.id);
    const targetCategoryId = overId.startsWith("category:")
      ? overId.slice("category:".length)
      : displayTasksForSelectedDate.find((t) => t.id === overId)?.categoryId;
    if (!targetCategoryId) return;

    if (targetCategoryId !== draggedTask.categoryId) {
      moveTaskToCategory(realId, targetCategoryId);
      return;
    }

    const categoryTaskIds = displayTasksForSelectedDate
      .filter((t) => t.categoryId === targetCategoryId)
      .map((t) => (t.id === draggedTask.id ? realId : t.id));
    const oldIndex = categoryTaskIds.indexOf(realId);
    const newIndex = overId.startsWith("category:") ? categoryTaskIds.length - 1 : categoryTaskIds.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = categoryTaskIds.slice();
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, realId);
    reorderTasksWithinCategory(targetCategoryId, selectedDate, reordered);
  };

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
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {categories.map((c) => (
              <CategoryGroup key={c.id} category={c} date={selectedDate} onOpenTask={setSelectedTaskId} />
            ))}
          </DndContext>
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
          onMaterialize={setSelectedTaskId}
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
