import { createBrowserClient } from "@supabase/ssr";

// Public, anon-key client — safe to use in client components.
// RLS policies in supabase/schema.sql control what this can actually see/do.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
