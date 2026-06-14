// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // 토큰 자동 갱신 (자동 연장의 핵심)
    persistSession: true,   // 로컬 스토리지에 세션 유지 (앱을 꺼도 유지)
    detectSessionInUrl: true
  }
});