import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import defaults from "../../data/defaults.json";
import { useAppStore } from "../../store/useAppStore";
import type { Category } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CategoryMenu({ isOpen, onClose }: Props) {
  // 셀렉터 안에서 .slice().sort()로 매번 새 배열을 반환하면 무한 렌더 루프에 빠지므로,
  // 원본 배열만 구독하고 정렬은 렌더 본문에서 한다.
  const unsortedCategories = useAppStore((s) => s.categories);
  const categories = unsortedCategories.slice().sort((a, b) => a.order - b.order);
  const tasks = useAppStore((s) => s.tasks);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);
  const reorderCategories = useAppStore((s) => s.reorderCategories);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(defaults.palette[0]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setIsAdding(false);
    setDraftName(name);
    setDraftColor(color);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setDraftName("");
    setDraftColor(defaults.palette[0]);
  };

  const cancelDraft = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const saveDraft = () => {
    const name = draftName.trim();
    if (!name) return;
    if (editingId) {
      updateCategory(editingId, { name, color: draftColor });
    } else {
      addCategory(name, draftColor);
    }
    cancelDraft();
  };

  const handleDelete = (id: string, name: string) => {
    const taskCount = tasks.filter((t) => t.categoryId === id).length;
    const warning = taskCount > 0 ? `\n이 카테고리의 할 일 ${taskCount}개도 함께 삭제됩니다.` : "";
    if (!confirm(`"${name}" 카테고리를 삭제할까요?${warning}`)) return;
    deleteCategory(id);
    if (editingId === id) cancelDraft();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = categories.map((c) => c.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderCategories(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">카테고리</h2>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {categories.map((c) =>
                  editingId === c.id ? (
                    <li key={c.id}>
                      <DraftForm
                        name={draftName}
                        color={draftColor}
                        onNameChange={setDraftName}
                        onColorChange={setDraftColor}
                        onSave={saveDraft}
                        onCancel={cancelDraft}
                      />
                    </li>
                  ) : (
                    <SortableCategoryRow
                      key={c.id}
                      category={c}
                      onEdit={() => startEdit(c.id, c.name, c.color)}
                      onDelete={() => handleDelete(c.id, c.name)}
                    />
                  ),
                )}
              </ul>
            </SortableContext>
          </DndContext>
          {isAdding && (
            <div className="mt-1">
              <DraftForm
                name={draftName}
                color={draftColor}
                onNameChange={setDraftName}
                onColorChange={setDraftColor}
                onSave={saveDraft}
                onCancel={cancelDraft}
              />
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            type="button"
            onClick={startAdd}
            className="w-full rounded-full bg-gray-900 py-3 text-sm font-medium text-white dark:bg-gray-100 dark:text-gray-900"
          >
            Add a list
          </button>
        </div>
      </aside>
    </>
  );
}

type SortableCategoryRowProps = {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
};

function SortableCategoryRow({ category, onEdit, onDelete }: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 rounded-xl px-2 py-2"
    >
      <span
        {...attributes}
        {...listeners}
        aria-label="순서 변경"
        className="flex h-8 w-6 shrink-0 touch-manipulation cursor-grab items-center justify-center text-gray-300 dark:text-gray-600"
      >
        ⠿
      </span>
      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">{category.name}</span>
      <button
        type="button"
        aria-label="이름/색 수정"
        onClick={onEdit}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 active:bg-gray-100 dark:active:bg-gray-800"
      >
        ✎
      </button>
      <button
        type="button"
        aria-label="삭제"
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 active:bg-gray-100 dark:active:bg-gray-800"
      >
        🗑
      </button>
    </li>
  );
}

type DraftFormProps = {
  name: string;
  color: string;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function DraftForm({ name, color, onNameChange, onColorChange, onSave, onCancel }: DraftFormProps) {
  return (
    <div className="space-y-2 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <input
        autoFocus
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="카테고리 이름"
        className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <div className="flex flex-wrap gap-2">
        {defaults.palette.map((p) => (
          <button
            key={p}
            type="button"
            aria-label={p}
            onClick={() => onColorChange(p)}
            className={`h-6 w-6 rounded-full ${color === p ? "ring-2 ring-gray-900 ring-offset-2 dark:ring-gray-100" : ""}`}
            style={{ backgroundColor: p }}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1 text-xs text-gray-500">
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!name.trim()}
          className="rounded-full bg-gray-900 px-3 py-1 text-xs text-white disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
        >
          저장
        </button>
      </div>
    </div>
  );
}
