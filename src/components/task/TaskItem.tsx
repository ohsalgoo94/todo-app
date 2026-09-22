import { useState, type MouseEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Task } from "../../types";

type Props = {
  task: Task;
  onOpen: () => void;
};

export default function TaskItem({ task, onOpen }: Props) {
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const [pop, setPop] = useState(false);

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    const willBeDone = !task.done;
    toggleTaskDone(task.id);
    if (willBeDone) {
      setPop(true);
      setTimeout(() => setPop(false), 220);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="flex items-start gap-2 py-1"
    >
      <button
        type="button"
        onClick={handleToggle}
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
          <span className="block truncate text-xs text-gray-400 dark:text-gray-500">{task.memo}</span>
        )}
      </div>
    </div>
  );
}
