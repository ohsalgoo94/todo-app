import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";

type Props = {
  date: string;
};

export default function DayMemo({ date }: Props) {
  const savedMemo = useAppStore((s) => s.dayMemos[date] ?? "");
  const setDayMemo = useAppStore((s) => s.setDayMemo);
  const [draft, setDraft] = useState(savedMemo);

  // 날짜가 바뀌면 저장 안 한 내용은 버리고 그 날짜의 저장된 메모를 보여준다
  useEffect(() => {
    setDraft(useAppStore.getState().dayMemos[date] ?? "");
  }, [date]);

  const isDirty = draft !== savedMemo;

  return (
    <div className="px-2 pb-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        placeholder="이 날의 메모"
        className="w-full resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <div className="mt-1 flex justify-end">
        <button
          type="button"
          onClick={() => setDayMemo(date, draft)}
          disabled={!isDirty}
          className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
        >
          저장
        </button>
      </div>
    </div>
  );
}
