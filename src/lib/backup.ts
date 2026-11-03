import { usePayStore } from "../features/pay/store/usePayStore";
import { useAppStore } from "../store/useAppStore";
import type { AppData } from "../types";
import { toDateKey } from "./date";

export function downloadBackup(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `do-your-tasks-backup-${toDateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 할 일 데이터(useAppStore)와 알바 계산기 데이터(usePayStore)를 하나의 백업 파일로 묶는다.
// 예전 백업 파일은 AppData가 최상위였는데(계산기 데이터 없음), 그 형식도 복원 시 계속 읽을 수 있게 둔다.
export function downloadFullBackup() {
  const app = useAppStore.getState();
  const pay = usePayStore.getState();
  downloadBackup({
    app: {
      version: app.version,
      deviceId: app.deviceId,
      categories: app.categories,
      tasks: app.tasks,
      routines: app.routines,
      dayMemos: app.dayMemos,
    },
    pay: { version: 2, records: pay.records, options: pay.options, optionsUpdatedAt: pay.optionsUpdatedAt },
  });
}

function isValidAppData(data: unknown): data is AppData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.version === "number" &&
    typeof d.deviceId === "string" &&
    Array.isArray(d.categories) &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.routines) &&
    typeof d.dayMemos === "object" &&
    d.dayMemos !== null
  );
}

// downloadFullBackup()으로 만든 { app, pay } 형식과, 그 이전의 AppData 단독 형식 둘 다 받는다.
export function restoreFullBackup(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const d = parsed as Record<string, unknown>;
  const appData = "app" in d ? d.app : d;
  if (!isValidAppData(appData)) return false;
  useAppStore.getState().restoreFromBackup(appData);
  if (d.pay && typeof d.pay === "object") {
    usePayStore.getState().restoreFromBackup(d.pay as never);
  }
  return true;
}
