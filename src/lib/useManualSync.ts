import { pushPayAndReportStatus } from "../features/pay/sync/paySyncApi";
import { useAuthUser } from "./auth";
import { pushAndReportStatus } from "./syncApi";

export function useManualSync(): () => Promise<void> {
  const { user } = useAuthUser();
  return async () => {
    if (!user) return;
    await pushAndReportStatus(user.id);
    await pushPayAndReportStatus(user.id);
  };
}
