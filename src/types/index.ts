export type Category = {
  id: string;
  name: string;
  color: string; // defaults.json 팔레트 중 하나
  order: number;
  collapsed: boolean;
};

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
};

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
};

export type AppData = {
  version: 1;
  deviceId: string;
  categories: Category[];
  tasks: Task[];
  routines: Routine[];
  dayMemos: Record<string, string>; // { "2026-09-22": "메모 내용" }
};
