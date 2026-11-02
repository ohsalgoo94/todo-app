// 기기 간 동기화에 필요한 공통 필드. localStorage와 Supabase 양쪽에 동일하게 들어간다.
// deleted는 실제로 지우지 않고 표시만 하기 위한 필드다 (한 기기에서 지운 게 다른 기기에서 되살아나는 것을 막기 위함).
export type SyncFields = {
  updatedAt: string; // ISO 8601
  deleted: boolean;
  deletedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  color: string; // defaults.json 팔레트 중 하나
  order: number;
} & SyncFields;

export type Alarm = { hour: number; minute: number }; // hour 0~23, minute 0~55 (5분 단위)

export type Task = {
  id: string;
  title: string;
  categoryId: string;
  date: string; // "2026-09-22"
  done: boolean;
  doneAt?: string;
  memo: string;
  alarm: Alarm | null;
  routineId?: string; // 루틴에서 생성된 할 일이면 연결
  order: number;
} & SyncFields;

export type Routine = {
  id: string;
  title: string;
  categoryId: string;
  rule:
    | { type: "daily" }
    | { type: "weekly"; daysOfWeek: number[] } // 0=일 ~ 6=토
    | { type: "monthly"; dayOfMonth: number };
  startDate: string;
  endDate?: string;
  alarm: Alarm | null;
  skippedDates: string[]; // 특정 날짜만 삭제/이동한 경우
} & SyncFields;

export type DayMemo = {
  content: string;
} & SyncFields;

export type AppData = {
  version: 2;
  deviceId: string;
  categories: Category[];
  tasks: Task[];
  routines: Routine[];
  dayMemos: Record<string, DayMemo>; // { "2026-09-22": { content: "메모 내용", ... } }
};
