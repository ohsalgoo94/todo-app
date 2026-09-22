import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import TaskItem from "../task/TaskItem";
import type { Category } from "../../types";

type Props = {
  category: Category;
  date: string;
};

export default function CategoryGroup({ category, date }: Props) {
  const tasks = useAppStore((s) => s.tasks.filter((t) => t.categoryId === category.id && t.date === date));
  const addTask = useAppStore((s) => s.addTask);
  const updateCategory = useAppStore((s) => s.updateCategory);

  const [isAdding, setIsAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const toggleCollapsed = () => updateCategory(category.id, { collapsed: !category.collapsed });

  const saveDraft = () => {
    const title = draftTitle.trim();
    if (!title) return;
    addTask(category.id, date, title);
    setDraftTitle("");
  };

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={category.collapsed ? "펼치기" : "접기"}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-400"
        >
          <span className={`inline-block transition-transform ${category.collapsed ? "-rotate-90" : ""}`}>▾</span>
        </button>
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
          {category.name}
        </span>
        <button
          type="button"
          aria-label={`${category.name}에 할 일 추가`}
          onClick={() => setIsAdding((v) => !v)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 active:bg-gray-100 dark:active:bg-gray-800"
        >
          +
        </button>
      </div>

      {!category.collapsed && (
        <div className="ml-8 space-y-1">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
          {isAdding && (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDraft();
                if (e.key === "Escape") setIsAdding(false);
              }}
              onBlur={() => {
                if (!draftTitle.trim()) setIsAdding(false);
              }}
              placeholder="할 일 입력 후 Enter"
              className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          )}
        </div>
      )}
    </div>
  );
}
