type Props = {
  count: number;
};

// 6단계에서 완료 카테고리 색 비율(conic-gradient)로 확장 예정. 지금은 회색 + 개수만 표시.
export default function DayRing({ count }: Props) {
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[11px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
      {count}
    </div>
  );
}
