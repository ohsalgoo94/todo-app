import { useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme-preference";

function getStoredThemePreference(): ThemePreference {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function applyTheme(preference: ThemePreference) {
  const isDark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredThemePreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
    }

    if (preference !== "system") return;
    // 시스템 설정을 따르는 동안에는, 켜져 있는 채로 OS 다크모드가 바뀌면 바로 반영한다
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference]);

  return [preference, setPreference] as const;
}
