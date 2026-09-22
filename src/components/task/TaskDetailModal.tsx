import { addDays, format, parseISO } from "date-fns";
import { useState } from "react";
import { toDateKey } from "../../lib/date";
import { useAppStore } from "../../store/useAppStore";
import type { Task } from "../../types";
import DatePickerModal from "../pickers/DatePickerModal";

type Props = {
  task: Task;
  onClose: () => void;
  onDeleted: (task: Task) => void;
};

export default function TaskDetailModal({ task, onClose, onDeleted }: Props) {
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const todayKey = toDateKey(new Date());
  const isPast = task.date < todayKey;

  const saveTitle = () => {
    const title = titleDraft.trim();
    if (title) updateTask(task.id, { title });
    setIsEditingTitle(false);
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onDeleted(task);
    onClose();
  };

  const handleShiftDay = () => {
    const nextDate = isPast ? todayKey : toDateKey(addDays(parseISO(task.date), 1));
    updateTask(task.id, { date: nextDate });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex h-[66dvh] w-full max-w-[420px] flex-col overflow-y-auto rounded-3xl bg-white p-5 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitleDraft(task.title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={saveTitle}
              className="mb-4 w-full rounded-full border border-gray-200 px-3 py-2 text-lg font-semibold dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          ) : (
            <h2 className="mb-4 break-words text-lg font-semibold text-gray-900 dark:text-gray-100">
              {task.title}
            </h2>
          )}

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              편집
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-500 dark:bg-rose-950 dark:text-rose-300"
            >
              삭제
            </button>
          </div>

          <label className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">메모</label>
          <textarea
            value={task.memo}
            onChange={(e) => updateTask(task.id, { memo: e.target.value })}
            rows={3}
            placeholder="메모 입력"
            className="mb-4 w-full resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />

          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleShiftDay}
              className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {isPast ? "오늘 하기" : "내일 하기"}
            </button>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              날짜 바꾸기 ({format(parseISO(task.date), "M월 d일")})
            </button>
          </div>
        </div>
      </div>

      {isDatePickerOpen && (
        <DatePickerModal
          initialDate={task.date}
          onConfirm={(date) => {
            updateTask(task.id, { date });
            setIsDatePickerOpen(false);
          }}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}
    </>
  );
}
