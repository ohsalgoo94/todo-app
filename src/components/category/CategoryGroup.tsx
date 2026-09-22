import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { getDisplayTasksForDate } from "../../lib/routine";
import { useAppStore } from "../../store/useAppStore";
import TaskItem from "../task/TaskItem";
import type { Category } from "../../types";

type Props = {
  category: Category;
  date: string;
  onOpenTask: (taskId: string) => void;
  // 드래그로 다른 카테고리 위에 올렸을 때, 놓기 전이라도 그 카테고리 목록에 미리 끼워 넣어 보여주기 위한 값
  dragOverride?: { taskId: string; categoryId: string } | null;
};

export function categoryDroppableId(categoryId: string): string {
  return `category:${categoryId}`;
}

export default function CategoryGroup({ category, date, onOpenTask, dragOverride }: Props) {
  // 셀렉터 안에서 .filter()로 매번 새 배열을 반환하면 zustand가 무한 렌더 루프에 빠지므로,
  // 원본 배열만 구독하고 필터링/루틴 계산은 렌더 본문에서 한다.
  const allTasks = useAppStore((s) => s.tasks);
  const routines = useAppStore((s) => s.routines);
  const tasks = getDisplayTasksForDate(allTasks, routines, date).filter((t) => {
    const effectiveCategoryId = dragOverride && t.id === dragOverride.taskId ? dragOverride.categoryId : t.categoryId;
    return effectiveCategoryId === category.id;
  });
  const addTask = useAppStore((s) => s.addTask);

  const [isAdding, setIsAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  // 접힌 카테고리는 없앴지만, 헤더 영역도 여전히 드롭 타깃으로 둔다 (빈 카테고리로도 옮길 수 있게)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: categoryDroppableId(category.id) });

  const saveDraft = () => {
    const title = draftTitle.trim();
    if (!title) return;
    addTask(category.id, date, title);
    setDraftTitle("");
  };

  return (
    <div ref={setDroppableRef} className={`mb-2 rounded-2xl ${isOver ? "bg-gray-100 dark:bg-gray-800" : ""}`}>
      <div className="flex items-center gap-2 px-2 py-1.5">
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

      <div className="ml-8 space-y-1">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            // 루틴 할 일은 체크하는 순간 가상 id에서 실제 id로 바뀌는데, routineId+date로 key를 고정해
            // 그 전환 때 컴포넌트가 다시 마운트되며 체크 애니메이션이 끊기지 않게 한다.
            <TaskItem
              key={t.routineId ? `${t.routineId}:${t.date}` : t.id}
              task={t}
              onOpen={() => onOpenTask(t.id)}
            />
          ))}
        </SortableContext>
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
    </div>
  );
}
