import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "rita-documents";

if (!supabaseUrl) {
  throw new Error(
    "SUPABASE_URL is missing from environment variables"
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY is missing from environment variables"
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
