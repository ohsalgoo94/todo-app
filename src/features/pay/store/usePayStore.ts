import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { withSyncFields } from "../../../lib/syncFields";
import type { SyncFields } from "../../../types";
import type { PayOptions, PayRecords, WorkRecord } from "../lib/calcPay";

const STORAGE_KEY = "pay-app:v2";
const LEGACY_STORAGE_KEY = "pay-app:v1"; // 복구용으로 지우지 않고 그대로 둔다

export type StoredWorkRecord = WorkRecord & SyncFields;
export type StoredPayRecords = Record<string, StoredWorkRecord>;

type PayData = {
  version: 2;
  records: StoredPayRecords;
  options: PayOptions;
  optionsUpdatedAt: string; // 스위치 상태도 기기 간 동기화 대상이라 수정 시각을 따로 둔다
};

type PayStore = PayData & {
  setWorkRecord: (date: string, record: WorkRecord) => void;
  deleteWorkRecord: (date: string) => void;
  setOption: (key: keyof PayOptions, value: boolean) => void;
  restoreFromBackup: (data: PayData) => void;
  resetToDefault: () => void;
};

// 화면에 보여주거나 월급 계산에 넘길 때는 삭제 표시된 기록을 뺀, 원래 모양(WorkRecord)으로 돌려준다.
export function visibleWorkRecords(records: StoredPayRecords): PayRecords {
  return Object.fromEntries(Object.entries(records).filter(([, r]) => !r.deleted));
}

// v1(동기화 필드 없음)이든 v2든, 빠진 동기화 필드를 채워서 항상 같은 모양으로 맞춘다.
function migratePayData(raw: Record<string, unknown>, now: string): PayData {
  const recordsRaw = (raw.records as Record<string, unknown>) ?? {};
  const optionsRaw = (raw.options as Partial<PayOptions>) ?? {};
  return {
    version: 2,
    records: Object.fromEntries(
      Object.entries(recordsRaw).map(([date, value]) => [
        date,
        withSyncFields(value as Partial<StoredWorkRecord> & WorkRecord, now),
      ]),
    ),
    options: {
      weeklyHolidayPay: optionsRaw.weeklyHolidayPay ?? false,
      overtimePay: optionsRaw.overtimePay ?? false,
      nightPay: optionsRaw.nightPay ?? false,
      taxDeduction: optionsRaw.taxDeduction ?? false,
    },
    optionsUpdatedAt: (raw.optionsUpdatedAt as string) ?? now,
  };
}

// TO-DO 스토어(useAppStore.ts)와 완전히 분리된, pay 기능 전용 스토어.
// 같은 "localStorage 값 자체가 데이터"인 flat 포맷을 쓰지만, 코드는 독립적으로 둔다 (기존 스토어는 건드리지 않음).
const flatStorage: PersistStorage<PayStore> = {
  getItem: (name) => {
    const now = new Date().toISOString();
    const raw = localStorage.getItem(name);
    if (raw) return { state: migratePayData(JSON.parse(raw), now) as PayStore, version: 0 };
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    return { state: migratePayData(JSON.parse(legacyRaw), now) as PayStore, version: 0 };
  },
  setItem: (name, value) => {
    localStorage.setItem(name, JSON.stringify(value.state));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

function createDefaultState(): PayData {
  return {
    version: 2,
    records: {},
    options: {
      weeklyHolidayPay: false,
      nightPay: false,
      overtimePay: false,
      taxDeduction: false,
    },
    optionsUpdatedAt: new Date().toISOString(),
  };
}

const isFirstRun = localStorage.getItem(STORAGE_KEY) === null;

export const usePayStore = create<PayStore>()(
  persist(
    (set) => ({
      ...createDefaultState(),
      setWorkRecord: (date, record) =>
        set((s) => ({
          records: { ...s.records, [date]: { ...record, updatedAt: new Date().toISOString(), deleted: false } },
        })),
      deleteWorkRecord: (date) =>
        set((s) => {
          const existing = s.records[date];
          if (!existing) return {};
          const now = new Date().toISOString();
          return { records: { ...s.records, [date]: { ...existing, deleted: true, deletedAt: now, updatedAt: now } } };
        }),
      setOption: (key, value) =>
        set((s) => ({ options: { ...s.options, [key]: value }, optionsUpdatedAt: new Date().toISOString() })),
      restoreFromBackup: (data) => set(() => migratePayData(data, new Date().toISOString())),
      resetToDefault: () => set(() => createDefaultState()),
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
