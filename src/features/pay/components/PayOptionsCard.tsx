import { useState } from "react";
import { usePayStore } from "../store/usePayStore";
import type { PayOptions } from "../lib/calcPay";

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  note?: string;
};

function ToggleRow({ label, description, checked, onChange, note }: ToggleRowProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-label={`${label} 설명 보기`}
            className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-gray-400 ring-1 ring-gray-300 dark:text-gray-500 dark:ring-gray-600"
          >
            i
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
            checked ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <span
            className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform dark:bg-gray-900 ${
              checked ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
      {showInfo && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      {checked && note && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{note}</p>}
    </div>
  );
}

const FIVE_OR_MORE_NOTE = "상시 근로자 5인 이상 사업장에만 적용돼요.";

export default function PayOptionsCard() {
  const options = usePayStore((s) => s.options);
  const setOption = usePayStore((s) => s.setOption);

  const update = (key: keyof PayOptions) => (value: boolean) => setOption(key, value);

  return (
    <div className="mx-2 mt-4 divide-y divide-gray-100 rounded-3xl bg-white p-5 dark:divide-gray-700 dark:bg-gray-800">
      <ToggleRow
        label="주휴수당"
        description="일주일에 15시간 이상 일하면 하루치 임금을 추가로 받는 제도예요. 결근 여부는 앱이 알 수 없어서, 기록된 근무 시간만으로 판단해요."
        checked={options.weeklyHolidayPay}
        onChange={update("weeklyHolidayPay")}
      />
      <ToggleRow
        label="연장수당"
        description="하루 8시간 또는 일주일 40시간을 넘는 근무에 대해 시급의 50%를 더 받는 거예요."
        checked={options.overtimePay}
        onChange={update("overtimePay")}
        note={FIVE_OR_MORE_NOTE}
      />
      <ToggleRow
        label="야간수당"
        description="밤 10시부터 새벽 6시까지 일한 시간에 대해 시급의 50%를 더 받는 거예요."
        checked={options.nightPay}
        onChange={update("nightPay")}
        note={FIVE_OR_MORE_NOTE}
      />
      <ToggleRow
        label="3.3% 공제"
        description="프리랜서(사업소득)로 신고할 때 떼는 세금이에요. 실제 공제 여부와 비율은 상황에 따라 다를 수 있어요."
        checked={options.taxDeduction}
        onChange={update("taxDeduction")}
      />
    </div>
  );
}
