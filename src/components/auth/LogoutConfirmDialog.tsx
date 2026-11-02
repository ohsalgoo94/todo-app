import { downloadBackup } from "../../lib/backup";
import { useAppStore } from "../../store/useAppStore";

type Props = {
  onConfirm: () => void;
  onClose: () => void;
};

export default function LogoutConfirmDialog({ onConfirm, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[80] flex animate-fade-in items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] animate-modal-in rounded-3xl bg-white p-5 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">로그아웃할까요?</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          로그아웃하면 이 기기에 저장된 할 일이 지워져요. (계정 데이터는 서버에 안전하게 남아있어요)
        </p>
        <button
          type="button"
          onClick={() => downloadBackup(useAppStore.getState())}
          className="mb-2 w-full rounded-full bg-gray-100 py-2.5 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          백업 다운로드
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full py-2.5 text-sm text-gray-500 dark:text-gray-400"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-rose-500 py-2.5 text-sm font-medium text-white"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
