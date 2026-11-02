-- Do Your Tasks! 동기화용 테이블 + RLS 정책
-- Supabase 대시보드 > SQL Editor 에서 전체를 한 번에 실행한다.

-- 카테고리
create table categories (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  "order" int not null default 0,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  deleted_at timestamptz
);

-- 할 일
create table tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category_id uuid not null,
  date date not null,
  done boolean not null default false,
  done_at timestamptz,
  memo text not null default '',
  routine_id uuid,
  "order" int not null default 0,
  -- 알림은 아직 구현하지 않았지만, 나중에 추가할 때 테이블을 다시 고치지 않도록 칸만 미리 만들어 둔다
  alarm_hour int,
  alarm_minute int,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  deleted_at timestamptz
);

-- 루틴
create table routines (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category_id uuid not null,
  rule jsonb not null,            -- { type: "weekly", daysOfWeek: [1,3,5] }
  start_date date not null,
  end_date date,
  alarm_hour int,
  alarm_minute int,
  skipped_dates date[] not null default '{}',
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  deleted_at timestamptz
);

-- 날짜별 메모
create table day_memos (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  deleted_at timestamptz,
  primary key (user_id, date)
);

-- 자주 쓰는 조회에 쓰는 인덱스 (user_id + updated_at: 증분 동기화, user_id + date: 날짜별 조회)
create index categories_user_updated_idx on categories (user_id, updated_at);
create index tasks_user_updated_idx on tasks (user_id, updated_at);
create index tasks_user_date_idx on tasks (user_id, date);
create index routines_user_updated_idx on routines (user_id, updated_at);

-- RLS: 모든 테이블에서 본인 데이터만 읽고 쓸 수 있게 한다
alter table categories enable row level security;
alter table tasks enable row level security;
alter table routines enable row level security;
alter table day_memos enable row level security;

create policy "categories_own_rows" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_own_rows" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "routines_own_rows" on routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "day_memos_own_rows" on day_memos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
