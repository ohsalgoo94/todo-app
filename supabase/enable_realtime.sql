-- 다른 기기의 변경을 실시간으로 받아오려면 테이블을 realtime 발행 목록에 추가해야 한다.
-- Supabase 대시보드 > SQL Editor 에서 실행한다 (schema.sql을 이미 실행한 뒤에).
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table routines;
alter publication supabase_realtime add table day_memos;
