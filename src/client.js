import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export let client = null;
export let configurationError = '';
if (url && key && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_PUBLIC')) {
  try { client = createClient(url, key); }
  catch { configurationError = 'การตั้งค่า Supabase ไม่ถูกต้อง กรุณาตรวจ URL และ public key แล้ว build ใหม่'; }
}
