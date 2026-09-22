type Props = {
  onGoToday: () => void;
};

export default function BottomBar({ onGoToday }: Props) {
  return (
    <nav className="flex justify-center border-t border-gray-200 bg-white py-2 dark:border-gray-800 dark:bg-gray-950">
      <button
        type="button"
        onClick={onGoToday}
        aria-label="오늘로 이동"
        className="flex h-11 w-11 items-center justify-center rounded-full text-gray-700 active:bg-gray-100 dark:text-gray-200 dark:active:bg-gray-800"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3Z" />
        </svg>
      </button>
    </nav>
  );
}
