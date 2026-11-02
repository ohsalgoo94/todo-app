-- 알바 계산기 동기화용 테이블 + RLS + Realtime 등록
-- Supabase 대시보드 > SQL Editor 에서 전체를 한 번에 실행한다 (schema.sql, enable_realtime.sql을 이미 실행한 뒤에).

-- 날짜별 근무 기록
create table work_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  minutes int not null default 0,
  night_minutes int not null default 0,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  deleted_at timestamptz,
  primary key (user_id, date)
);

-- 추가 계산 스위치 (주휴·연장·야간·3.3%). 계정마다 한 줄만 있다.
create table pay_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_holiday_pay boolean not null default false,
  overtime_pay boolean not null default false,
  night_pay boolean not null default false,
  tax_deduction boolean not null default false,
  updated_at timestamptz not null default now()
);

create index work_records_user_updated_idx on work_records (user_id, updated_at);

alter table work_records enable row level security;
alter table pay_settings enable row level security;

create policy "work_records_own_rows" on work_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pay_settings_own_rows" on pay_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table work_records;
alter publication supabase_realtime add table pay_settings;
