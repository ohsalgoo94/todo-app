import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, type MouseEvent, type PointerEvent } from "react";
import { isVirtualTaskId } from "../../lib/routine";
import { useAppStore } from "../../store/useAppStore";
import type { Task } from "../../types";

type Props = {
  task: Task;
  onOpen: () => void;
};

export default function TaskItem({ task, onOpen }: Props) {
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const materializeRoutineTask = useAppStore((s) => s.materializeRoutineTask);
  const [pop, setPop] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const willBeDone = !task.done;
    // 루틴에서 계산된 가상 할 일은 체크하는 순간 실제 Task로 저장한다
    const id = isVirtualTaskId(task.id) ? materializeRoutineTask(task.routineId!, task.date) : task.id;
    toggleTaskDone(id);
    if (willBeDone) {
      setPop(true);
      setTimeout(() => setPop(false), 220);
    }
  };

  // 체크박스는 드래그 시작 대상에서 제외 (pointerdown이 위 row의 드래그 리스너로 버블링되지 않게)
  const stopPointerDown = (e: PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      {...attributes}
      {...listeners}
      className="flex touch-manipulation items-start gap-2 py-1"
    >
      <button
        type="button"
        onClick={handleToggle}
        onPointerDown={stopPointerDown}
        aria-label={task.done ? "완료 취소" : "완료로 표시"}
        aria-pressed={task.done}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          task.done
            ? "border-gray-900 bg-gray-900 dark:border-gray-100 dark:bg-gray-100"
            : "border-gray-300 dark:border-gray-600"
        } ${pop ? "animate-check-pop" : ""}`}
      >
        {task.done && (
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white dark:text-gray-900" fill="none" stroke="currentColor" strokeWidth={3}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <span
          className={`block break-words text-sm ${
            task.done ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {task.title}
        </span>
        {task.memo.trim() && (
          <span className="block whitespace-pre-line text-xs text-gray-400 dark:text-gray-500">{task.memo}</span>
        )}
      </div>
    </div>
  );
}
