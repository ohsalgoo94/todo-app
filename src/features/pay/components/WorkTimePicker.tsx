import { format, parseISO } from "date-fns";
import { useState } from "react";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);
const MINUTES_PER_DAY = 24 * 60;

type Props = {
  date: string;
  initialMinutes: number | null;
  initialNightMinutes: number;
  nightPayEnabled: boolean;
  onDone: (minutes: number, nightMinutes: number) => void;
  onDelete: () => void;
  onClose: () => void;
};

function TimeSelect({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  label: string;
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <select
          value={hour}
          onChange={(e) => onHourChange(Number(e.target.value))}
          className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}시
            </option>
          ))}
        </select>
        <select
          value={minute}
          onChange={(e) => onMinuteChange(Number(e.target.value))}
          className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          {MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}분
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function WorkTimePicker({
  date,
  initialMinutes,
  initialNightMinutes,
  nightPayEnabled,
  onDone,
  onDelete,
  onClose,
}: Props) {
  // 저장된 데이터는 근무 시간(분)만 갖고 있어서, 기존 기록을 편집할 땐 00:00을 시작으로 두고
  // 그만큼 지난 시각을 종료로 잡아 같은 근무 시간이 되게 한다.
  const [startHour, setStartHour] = useState(0);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(initialMinutes !== null ? Math.floor(initialMinutes / 60) % 24 : 0);
  const [endMinute, setEndMinute] = useState(initialMinutes !== null ? initialMinutes % 60 : 0);

  // 야간 시간도 (분량이 아니라) 시작~종료 시각으로 입력받아 계산한다
  const [nightStartHour, setNightStartHour] = useState(0);
  const [nightStartMinute, setNightStartMinute] = useState(0);
  const [nightEndHour, setNightEndHour] = useState(Math.floor(initialNightMinutes / 60) % 24);
  const [nightEndMinute, setNightEndMinute] = useState(initialNightMinutes % 60);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const duration = ((endTotal - startTotal) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  const nightStartTotal = nightStartHour * 60 + nightStartMinute;
  const nightEndTotal = nightEndHour * 60 + nightEndMinute;
  const nightDuration = ((nightEndTotal - nightStartTotal) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const nightExceeds = nightPayEnabled && nightDuration > duration;

  const handleDone = () => {
    if (nightExceeds) return;
    // 야간수당이 꺼져 있으면 입력칸이 안 보이니, 기존에 저장돼 있던 야간 시간을 그대로 유지한다
    onDone(duration, nightPayEnabled ? nightDuration : initialNightMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[360px] rounded-3xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          {format(parseISO(date), "M월 d일")} 근무 시간
        </h3>

        <div className="mb-4 space-y-3">
          <TimeSelect
            label="시작 시간"
            hour={startHour}
            minute={startMinute}
            onHourChange={setStartHour}
            onMinuteChange={setStartMinute}
          />
          <TimeSelect
            label="종료 시간"
            hour={endHour}
            minute={endMinute}
            onHourChange={setEndHour}
            onMinuteChange={setEndMinute}
          />
        </div>

        <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
          일한 시간: <span className="font-semibold">{Math.floor(duration / 60)}시간 {duration % 60}분</span>
        </p>

        {nightPayEnabled && (
          <div className="mb-4 space-y-3">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">그중 야간 근무 (22시~06시)</p>
            <TimeSelect
              label="야간 시작"
              hour={nightStartHour}
              minute={nightStartMinute}
              onHourChange={setNightStartHour}
              onMinuteChange={setNightStartMinute}
            />
            <TimeSelect
              label="야간 종료"
              hour={nightEndHour}
              minute={nightEndMinute}
              onHourChange={setNightEndHour}
              onMinuteChange={setNightEndMinute}
            />
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              야간 근무: <span className="font-semibold">{Math.floor(nightDuration / 60)}시간 {nightDuration % 60}분</span>
            </p>
            {nightExceeds && (
              <p className="text-xs text-rose-500">야간 시간은 총 근무 시간보다 길 수 없어요.</p>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={initialMinutes === null}
            className="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-500 disabled:opacity-40 dark:bg-rose-950 dark:text-rose-300"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={nightExceeds}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
