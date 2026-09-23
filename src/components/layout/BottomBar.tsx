type Props = {
  activeScreen: "todo" | "pay" | "settings";
  onGoHome: () => void;
  onOpenPay: () => void;
  onOpenSettings: () => void;
};

export default function BottomBar({ activeScreen, onGoHome, onOpenPay, onOpenSettings }: Props) {
  return (
    <nav className="flex items-center justify-center gap-8 border-t border-gray-200 bg-white py-2 dark:border-gray-800 dark:bg-gray-950">
      <button
        type="button"
        onClick={onGoHome}
        aria-label={activeScreen === "todo" ? "오늘로 이동" : "TO-DO로 돌아가기"}
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
        {activeScreen === "pay" ? <PiggyCoinIcon /> : <PiggyIcon />}
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="설정"
        aria-pressed={activeScreen === "settings"}
        className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-gray-800 ${
          activeScreen === "settings" ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9.4 4c0-.4 0-.8-.1-1.2l2-1.6-2-3.4-2.4.9a7.6 7.6 0 0 0-2-1.2L16.5 3h-4l-.4 2.5a7.6 7.6 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.6 2 3.4 2.4-.9c.6.5 1.3.9 2 1.2L12.5 21h4l.4-2.5c.7-.3 1.4-.7 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
        </svg>
      </button>
    </nav>
  );
}

function PiggyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <ellipse cx="12" cy="13.5" rx="7.5" ry="5.5" />
      <path d="M17.5 12.5c1-.3 2-1 2.5-2-.7 0-1.5.2-2 .5" />
      <circle cx="9" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <path d="M6 18v1.5M17 18v1.5" />
      <path d="M8.5 8c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" />
    </svg>
  );
}

function PiggyCoinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <ellipse cx="12" cy="13.5" rx="7.5" ry="5.5" />
      <path d="M17.5 12.5c1-.3 2-1 2.5-2-.7 0-1.5.2-2 .5" />
      <circle cx="9" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <path d="M6 18v1.5M17 18v1.5" />
      <ellipse cx="11.5" cy="7" rx="2" ry="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
