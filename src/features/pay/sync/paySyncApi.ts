import { supabase } from "../../../lib/supabase";
import { useSyncStatusStore } from "../../../store/useSyncStatusStore";
import type { PayOptions } from "../lib/calcPay";
import { usePayStore, type StoredPayRecords, type StoredWorkRecord } from "../store/usePayStore";

export type RemotePayData = {
  records: StoredPayRecords;
  options: PayOptions;
  optionsUpdatedAt: string | null; // 서버에 아직 설정이 없으면 null
};

function workRecordToRow(date: string, record: StoredWorkRecord, userId: string) {
  return {
    user_id: userId,
    date,
    minutes: record.minutes,
    night_minutes: record.nightMinutes,
    updated_at: record.updatedAt,
    deleted: record.deleted,
    deleted_at: record.deletedAt ?? null,
  };
}
function workRecordFromRow(r: {
  date: string;
  minutes: number;
  night_minutes: number;
  updated_at: string;
  deleted: boolean;
  deleted_at: string | null;
}): [string, StoredWorkRecord] {
  return [
    r.date,
    {
      minutes: r.minutes,
      nightMinutes: r.night_minutes,
      updatedAt: r.updated_at,
      deleted: r.deleted,
      deletedAt: r.deleted_at ?? undefined,
    },
  ];
}

function optionsToRow(options: PayOptions, updatedAt: string, userId: string) {
  return {
    user_id: userId,
    weekly_holiday_pay: options.weeklyHolidayPay,
    overtime_pay: options.overtimePay,
    night_pay: options.nightPay,
    tax_deduction: options.taxDeduction,
    updated_at: updatedAt,
  };
}

export async function fetchRemotePayData(userId: string): Promise<RemotePayData> {
  const [workRecords, paySettings] = await Promise.all([
    supabase.from("work_records").select("*").eq("user_id", userId),
    supabase.from("pay_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (workRecords.error) throw workRecords.error;
  if (paySettings.error) throw paySettings.error;

  const settingsRow = paySettings.data;
  return {
    records: Object.fromEntries((workRecords.data ?? []).map(workRecordFromRow)),
    options: {
      weeklyHolidayPay: settingsRow?.weekly_holiday_pay ?? false,
      overtimePay: settingsRow?.overtime_pay ?? false,
      nightPay: settingsRow?.night_pay ?? false,
      taxDeduction: settingsRow?.tax_deduction ?? false,
    },
    optionsUpdatedAt: settingsRow?.updated_at ?? null,
  };
}

export async function pushLocalPayData(userId: string): Promise<void> {
  const { records, options, optionsUpdatedAt } = usePayStore.getState();
  const recordRows = Object.entries(records).map(([date, record]) => workRecordToRow(date, record, userId));

  const results = await Promise.all([
    recordRows.length
      ? supabase.from("work_records").upsert(recordRows, { onConflict: "user_id,date" })
      : null,
    supabase.from("pay_settings").upsert(optionsToRow(options, optionsUpdatedAt, userId), { onConflict: "user_id" }),
  ]);
  for (const res of results) {
    if (res?.error) throw res.error;
  }
}

export async function pushPayAndReportStatus(userId: string): Promise<void> {
  useSyncStatusStore.getState().setStatus("syncing");
  try {
    await pushLocalPayData(userId);
    useSyncStatusStore.getState().setSynced(new Date().toISOString());
  } catch {
    useSyncStatusStore.getState().setStatus(navigator.onLine ? "error" : "offline");
  }
}
