import type { AppData } from "../types";
import { toDateKey } from "./date";

export function downloadBackup(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `do-your-tasks-backup-${toDateKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
