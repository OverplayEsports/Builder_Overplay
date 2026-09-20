import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://njqkjmvitvjjuumkipcc.supabase.co";
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcWtqbXZpdHZqanV1bWtpcGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NjY2ODQsImV4cCI6MjEwNTM0MjY4NH0.qQVm9ef0YrkK1ZAcgxu4rN9swZvyGtqtptGNY4SR2oo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

