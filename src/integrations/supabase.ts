import { createClient } from "@supabase/supabase-js";
import { databaseBoundary } from "@/lib/databaseBoundary";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export let realClient: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    realClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    console.error("Database configuration is invalid.");
  }
}

// Never turn failed production reads or writes into successful browser-only operations.
export const supabase: any = databaseBoundary(realClient);
export default supabase;
