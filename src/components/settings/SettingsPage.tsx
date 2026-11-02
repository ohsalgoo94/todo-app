import { useRef, useState, type ChangeEvent } from "react";
import { downloadBackup } from "../../lib/backup";
import type { ThemePreference } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import type { AppData } from "../../types";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "시스템" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
];

type Props = {
  themePreference: ThemePreference;
  onThemePreferenceChange: (preference: ThemePreference) => void;
};

function isValidBackup(data: unknown): data is AppData {
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

export default function SettingsPage({ themePreference, onThemePreferenceChange }: Props) {
  const restoreFromBackup = useAppStore((s) => s.restoreFromBackup);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    const s = useAppStore.getState();
    downloadBackup({
      version: s.version,
      deviceId: s.deviceId,
      categories: s.categories,
      tasks: s.tasks,
      routines: s.routines,
      dayMemos: s.dayMemos,
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 선택해도 onChange가 다시 일어나게
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    try {
      const parsed = JSON.parse(await file.text());
      if (!isValidBackup(parsed)) {
        setImportError("올바른 백업 파일이 아니에요.");
        return;
      }
      restoreFromBackup(parsed);
      setImportSuccess(true);
    } catch {
      setImportError("파일을 읽을 수 없어요. JSON 형식을 확인해주세요.");
    }
  };

  return (
    <main className="flex-1 animate-fade-in overflow-y-auto px-4 py-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">설정</h2>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-800">
        <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">화면 테마</h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          시스템을 선택하면 기기의 다크 모드 설정을 그대로 따라가요.
        </p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onThemePreferenceChange(option.value)}
              className={`flex-1 rounded-full py-2 text-sm ${
                themePreference === option.value
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm dark:bg-gray-800">
        <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">데이터 백업</h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          브라우저 데이터를 지우면 할 일이 사라져요. 미리 내보내두면 나중에 복원할 수 있어요.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 rounded-full bg-gray-900 py-2.5 text-sm font-medium text-white dark:bg-gray-100 dark:text-gray-900"
          >
            내보내기
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-full bg-gray-100 py-2.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          >
            가져오기
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        {importError && <p className="mt-3 text-xs text-rose-500">{importError}</p>}
        {importSuccess && (
          <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">가져오기 완료됐어요.</p>
        )}
      </section>
    </main>
  );
}
