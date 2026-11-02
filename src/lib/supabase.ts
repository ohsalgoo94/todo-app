import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Supabase 환경변수(.env.local)가 설정되지 않았습니다.");
}

export const supabase = createClient(url, anonKey);
