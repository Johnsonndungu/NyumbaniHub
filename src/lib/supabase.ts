import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const envFallback = (name: string) => {
  // prefer runtime process.env, then Vite-style import.meta.env
  const fromProcess = process.env[name];
  if (fromProcess) return String(fromProcess).replace(/^"|"$/g, '').trim();
  try {
    const im = (import.meta as any).env;
    if (im && im[name]) return String(im[name]).replace(/^"|"$/g, '').trim();
  } catch (e) {
    // import.meta may not be available in some runtime contexts
  }
  return undefined;
};

const supabaseUrl = envFallback('SUPABASE_URL') || envFallback('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = envFallback('SUPABASE_ANON_KEY') || envFallback('VITE_SUPABASE_ANON_KEY') || '';

if (!supabaseUrl) {
  console.error('Supabase URL is missing. Set SUPABASE_URL or VITE_SUPABASE_URL in your environment.');
}
if (!supabaseAnonKey) {
  console.error('Supabase anon/public key is missing. Set SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for server-side administrative tasks
export const getServiceSupabase = () => {
  const serviceKey = envFallback('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for administrative operations.');
  }
  return createClient(supabaseUrl, String(serviceKey));
};
