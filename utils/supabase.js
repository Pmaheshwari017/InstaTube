import { createClient } from "@supabase/supabase-js";
const EXPO_PUBLIC_SUPABASE_URL = "https://yedwgdujzvheonypppzd.supabase.co";
const EXPO_PUBLIC_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHdnZHVqenZoZW9ueXBwcHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTY5ODYzNCwiZXhwIjoyMDU3Mjc0NjM0fQ.ce_fKpo5Y7FbBAKZEtQxeJgh7LM3X6AzYoQpRA5cM5s";
// const abc = (process.env.EXPO_PUBLIC_SUPABASE_URL || "").trim();
// console.log("abc: ", abc);
// const xyz = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").trim();
// console.log("xyz: ", xyz);
// console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
// console.log("Supabase Key:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY
);
