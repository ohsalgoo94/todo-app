import BottomBar from "./components/layout/BottomBar";

export default function App() {
  const handleGoToday = () => {
    // 3단계(캘린더)에서 실제 동작 연결
  };

  return (
    <div className="mx-auto flex h-dvh max-w-[480px] flex-col bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <span className="font-medium text-gray-900 dark:text-gray-100">2026년 9월</span>
        <button
          type="button"
          aria-label="카테고리 메뉴"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-700 active:bg-gray-100 dark:text-gray-200 dark:active:bg-gray-800"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
          </svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 text-gray-500 dark:text-gray-400">
        (메모 / 캘린더 / 할 일 목록은 다음 단계에서 채워집니다)
      </main>

      <BottomBar onGoToday={handleGoToday} />
    </div>
  );
}
