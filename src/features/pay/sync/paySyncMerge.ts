import type { PayOptions } from "../lib/calcPay";
import type { StoredPayRecords } from "../store/usePayStore";
import type { RemotePayData } from "./paySyncApi";

type LocalPayData = {
  records: StoredPayRecords;
  options: PayOptions;
  optionsUpdatedAt: string;
};

// work_records는 날짜별로, pay_settings는 계정당 한 줄이라 updatedAt 하나로 비교한다.
// 둘 다 useAppStore와 같은 규칙: 나중에 고친 쪽이 이기고, 같으면 서버 쪽을 택한다.
export function mergePayData(local: LocalPayData, remote: RemotePayData): LocalPayData {
  const records = { ...local.records };
  for (const [date, remoteRecord] of Object.entries(remote.records)) {
    const localRecord = records[date];
    if (!localRecord || remoteRecord.updatedAt >= localRecord.updatedAt) records[date] = remoteRecord;
  }

  const useRemoteOptions = remote.optionsUpdatedAt !== null && remote.optionsUpdatedAt >= local.optionsUpdatedAt;

  return {
    records,
    options: useRemoteOptions ? remote.options : local.options,
    optionsUpdatedAt: useRemoteOptions ? (remote.optionsUpdatedAt as string) : local.optionsUpdatedAt,
  };
}
