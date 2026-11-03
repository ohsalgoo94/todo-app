import { useState } from "react";

type Props = {
  onUseDeviceOnly: () => void | Promise<void>;
  onUseAccountOnly: () => void | Promise<void>;
};

export default function GuestMergeDialog({ onUseDeviceOnly, onUseAccountOnly }: Props) {
  const [isWorking, setIsWorking] = useState(false);

  const run = async (action: () => void | Promise<void>) => {
    setIsWorking(true);
    await action();
    setIsWorking(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex animate-fade-in items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[380px] animate-modal-in rounded-3xl bg-white p-5 dark:bg-gray-900">
        <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">계정에 데이터가 있어요</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          이 기기와 계정에 각각 할 일 데이터가 있어요. 어느 쪽을 쓸지 고르면, 고르지 않은 쪽 데이터는 사라져요.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isWorking}
            onClick={() => run(onUseDeviceOnly)}
            className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
          >
            이 기기 데이터 사용
          </button>
          <button
            type="button"
            disabled={isWorking}
            onClick={() => run(onUseAccountOnly)}
            className="w-full rounded-full bg-gray-100 py-2.5 text-sm text-gray-700 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-200"
          >
            계정 데이터 사용
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          사라지는 쪽 데이터는 먼저 파일로 저장돼요.
        </p>
      </div>
    </div>
  );
}
