type Props = {
  activeScreen: "todo" | "pay";
  onGoHome: () => void;
  onOpenPay: () => void;
};

export default function BottomBar({ activeScreen, onGoHome, onOpenPay }: Props) {
  return (
    <nav className="flex items-center justify-center gap-8 border-t border-gray-200 bg-white py-2 dark:border-gray-800 dark:bg-gray-950">
      <button
        type="button"
        onClick={onGoHome}
        aria-label={activeScreen === "pay" ? "TO-DO로 돌아가기" : "오늘로 이동"}
        className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800 ${
          activeScreen === "todo" ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onOpenPay}
        aria-label="알바 월급 계산기"
        aria-pressed={activeScreen === "pay"}
        className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800 ${
          activeScreen === "pay" ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <circle cx="12" cy="12" r="9" />
        </svg>
      </button>
    </nav>
  );
}
