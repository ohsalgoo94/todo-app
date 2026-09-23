import { formatWon, type PayResult } from "../lib/calcPay";

type Props = {
  result: PayResult;
};

export default function PaySummaryCard({ result }: Props) {
  const hours = Math.floor(result.totalMinutes / 60);
  const minutes = result.totalMinutes % 60;

  return (
    <div className="mx-2 mt-4 rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <dl className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex justify-between">
          <dt>총 근무 시간</dt>
          <dd>
            {hours}시간 {minutes}분
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>적용 최저시급</dt>
          <dd>{formatWon(result.appliedWage)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>기본급</dt>
          <dd>{formatWon(result.basePay)}</dd>
        </div>
        {result.weeklyHolidayPay > 0 && (
          <div className="flex justify-between">
            <dt>주휴수당</dt>
            <dd>{formatWon(result.weeklyHolidayPay)}</dd>
          </div>
        )}
        {result.overtimePay > 0 && (
          <div className="flex justify-between">
            <dt>연장 가산수당</dt>
            <dd>{formatWon(result.overtimePay)}</dd>
          </div>
        )}
        {result.nightPay > 0 && (
          <div className="flex justify-between">
            <dt>야간 가산수당</dt>
            <dd>{formatWon(result.nightPay)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">예상 월급 (세전)</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatWon(result.grossPay)}</p>
        {result.taxAmount > 0 && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            3.3% 공제 {formatWon(result.taxAmount)} → 공제 후 {formatWon(result.netPay)}
          </p>
        )}
      </div>

      {result.missingWageNote && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{result.missingWageNote}</p>
      )}

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        참고용 계산이에요. 휴일근로수당, 4대보험 등은 포함되지 않아서 실제 급여와 다를 수 있어요.
      </p>
    </div>
  );
}
