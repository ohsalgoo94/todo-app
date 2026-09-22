import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type { PayOptions, PayRecords, WorkRecord } from "../lib/calcPay";

const STORAGE_KEY = "pay-app:v1";

type PayData = {
  version: 1;
  records: PayRecords;
  options: PayOptions;
};

type PayStore = PayData & {
  setWorkRecord: (date: string, record: WorkRecord) => void;
  deleteWorkRecord: (date: string) => void;
  setOption: (key: keyof PayOptions, value: boolean) => void;
};

// TO-DO 스토어(useAppStore.ts)와 완전히 분리된, pay 기능 전용 스토어.
// 같은 "localStorage 값 자체가 데이터"인 flat 포맷을 쓰지만, 코드는 독립적으로 둔다 (기존 스토어는 건드리지 않음).
const flatStorage: PersistStorage<PayStore> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    return raw ? { state: JSON.parse(raw) as PayStore, version: 0 } : null;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value.state));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

function createDefaultState(): PayData {
  return {
    version: 1,
    records: {},
    options: {
      weeklyHolidayPay: false,
      nightPay: false,
      overtimePay: false,
      taxDeduction: false,
    },
  };
}

const isFirstRun = localStorage.getItem(STORAGE_KEY) === null;

export const usePayStore = create<PayStore>()(
  persist(
    (set) => ({
      ...createDefaultState(),
      setWorkRecord: (date, record) =>
        set((s) => ({ records: { ...s.records, [date]: record } })),
      deleteWorkRecord: (date) =>
        set((s) => {
          const records = { ...s.records };
          delete records[date];
          return { records };
        }),
      setOption: (key, value) =>
        set((s) => ({ options: { ...s.options, [key]: value } })),
    }),
    {
      name: STORAGE_KEY,
      storage: flatStorage,
    },
  ),
);

if (isFirstRun) {
  // persist는 set()이 호출되기 전까지 localStorage에 쓰지 않으므로, 첫 실행 상태를 바로 기록해 둔다
  usePayStore.setState(usePayStore.getState());
}
