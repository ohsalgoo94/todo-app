import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Task } from "../../types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type RuleType = "daily" | "weekly" | "monthly";

type Props = {
  task: Task;
  onClose: () => void;
  onSaved: () => void;
};

export default function RoutineModal({ task, onClose, onSaved }: Props) {
  const createRoutineFromTask = useAppStore((s) => s.createRoutineFromTask);

  const [ruleType, setRuleType] = useState<RuleType>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(Number(task.date.slice(8, 10)));
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(task.date);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const canSave = ruleType !== "weekly" || daysOfWeek.length > 0;

  const handleSave = () => {
    const rule =
      ruleType === "daily"
        ? ({ type: "daily" } as const)
        : ruleType === "weekly"
          ? ({ type: "weekly", daysOfWeek } as const)
          : ({ type: "monthly", dayOfMonth } as const);
    createRoutineFromTask(task.id, rule, hasEndDate ? endDate : undefined);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[380px] rounded-3xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">루틴 설정</h3>

        <div className="mb-4 flex gap-2">
          {(["daily", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRuleType(type)}
              className={`flex-1 rounded-full py-2 text-sm ${
                ruleType === type
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {type === "daily" ? "매일" : type === "weekly" ? "매주" : "매월"}
            </button>
          ))}
        </div>

        {ruleType === "weekly" && (
          <div className="mb-4 flex justify-between gap-1">
            {WEEKDAYS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`h-9 w-9 rounded-full text-sm ${
                  daysOfWeek.includes(day)
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {ruleType === "monthly" && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">매월 며칠</label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">시작일: {task.date}</p>

        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.target.checked)}
          />
          종료일 설정
          {hasEndDate && (
            <input
              type="date"
              value={endDate}
              min={task.date}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-full border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          )}
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
