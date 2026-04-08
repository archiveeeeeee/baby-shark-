import { createClient } from "@supabase/supabase-js";

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL ?? "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured = Boolean(
  supabaseConfig.url && supabaseConfig.anonKey
);

console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL || "MISSING");
console.log(
  "SUPABASE ANON KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING"
);
console.log("isSupabaseConfigured:", isSupabaseConfigured);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;