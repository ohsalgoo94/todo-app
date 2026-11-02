import { useAuthUser } from "./auth";
import { pushAndReportStatus } from "./syncApi";

export function useManualSync(): () => Promise<void> {
  const { user } = useAuthUser();
  return async () => {
    if (user) await pushAndReportStatus(user.id);
  };
}
