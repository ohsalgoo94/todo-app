import { addDays, parseISO } from "date-fns";
import { useState } from "react";
import { toDateKey } from "../../lib/date";
import { isVirtualTaskId } from "../../lib/routine";
import { useAppStore } from "../../store/useAppStore";
import type { Task } from "../../types";
import DatePickerModal from "../pickers/DatePickerModal";
import RoutineModal from "../pickers/RoutineModal";

type Props = {
  task: Task;
  onClose: () => void;
  onDeleted: (task: Task) => void;
  onMaterialize: (newId: string) => void;
};

export default function TaskDetailModal({ task, onClose, onDeleted, onMaterialize }: Props) {
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const materializeRoutineTask = useAppStore((s) => s.materializeRoutineTask);
  const deleteRoutineOccurrence = useAppStore((s) => s.deleteRoutineOccurrence);
  const endRoutineFrom = useAppStore((s) => s.endRoutineFrom);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isRoutineDeleteChoiceOpen, setIsRoutineDeleteChoiceOpen] = useState(false);

  const todayKey = toDateKey(new Date());
  const isPast = task.date < todayKey;

  // 루틴에서 계산된 가상 할 일은 편집/메모/이동하는 순간에만 실제 Task로 저장한다.
  // 이미 실제 Task면 그대로 그 id를 쓴다.
  const resolveRealId = (): string => {
    if (!isVirtualTaskId(task.id)) return task.id;
    const newId = materializeRoutineTask(task.routineId!, task.date);
    onMaterialize(newId);
    return newId;
  };

  const saveTitle = () => {
    const title = titleDraft.trim();
    if (title) updateTask(resolveRealId(), { title });
    setIsEditingTitle(false);
  };

  const handleDeleteClick = () => {
    if (task.routineId) {
      setIsRoutineDeleteChoiceOpen(true);
      return;
    }
    deleteTask(task.id);
    onDeleted(task);
    onClose();
  };

  const handleDeleteThisOccurrence = () => {
    deleteRoutineOccurrence(task.routineId!, task.date);
    onClose();
  };

  const handleDeleteFromHereOn = () => {
    endRoutineFrom(task.routineId!, task.date);
    onClose();
  };

  const handleShiftDay = () => {
    const nextDate = isPast ? todayKey : toDateKey(addDays(parseISO(task.date), 1));
    updateTask(resolveRealId(), { date: nextDate });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[66dvh] w-full max-w-[420px] flex-col overflow-y-auto rounded-3xl bg-white p-5 dark:bg-gray-900"
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

          {isRoutineDeleteChoiceOpen ? (
            <div className="mb-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteThisOccurrence}
                className="w-full rounded-full bg-rose-50 py-2.5 text-sm text-rose-500 dark:bg-rose-950 dark:text-rose-300"
              >
                이 날짜만 삭제
              </button>
              <button
                type="button"
                onClick={handleDeleteFromHereOn}
                className="w-full rounded-full bg-rose-50 py-2.5 text-sm text-rose-500 dark:bg-rose-950 dark:text-rose-300"
              >
                이후 전부 삭제
              </button>
              <button
                type="button"
                onClick={() => setIsRoutineDeleteChoiceOpen(false)}
                className="text-center text-xs text-gray-400 dark:text-gray-500"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="flex-1 rounded-full bg-gray-100 py-2.5 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                편집
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex-1 rounded-full bg-rose-50 py-2.5 text-sm text-rose-500 dark:bg-rose-950 dark:text-rose-300"
              >
                삭제
              </button>
            </div>
          )}

          <label className="mb-1 text-xs font-medium text-gray-400 dark:text-gray-500">메모</label>
          <textarea
            value={task.memo}
            onChange={(e) => updateTask(resolveRealId(), { memo: e.target.value })}
            rows={3}
            placeholder="메모 입력"
            className="mb-4 w-full resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />

          <div className="flex flex-col gap-2">
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
              날짜 바꾸기
            </button>
            {!task.routineId && (
              <button
                type="button"
                onClick={() => setIsRoutineModalOpen(true)}
                className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                루틴 설정하기
              </button>
            )}
          </div>
        </div>
      </div>

      {isDatePickerOpen && (
        <DatePickerModal
          initialDate={task.date}
          onConfirm={(date) => {
            updateTask(resolveRealId(), { date });
            setIsDatePickerOpen(false);
          }}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}

      {isRoutineModalOpen && (
        <RoutineModal
          task={task}
          onClose={() => setIsRoutineModalOpen(false)}
          onSaved={() => {
            setIsRoutineModalOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
