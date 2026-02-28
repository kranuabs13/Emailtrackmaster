// supabase-client.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Your Supabase project URL
export const SUPABASE_URL = "https://glastmgtyigzbxxgcdbo.supabase.co";

// Your Supabase anon JWT
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXN0bWd0eWlnemJ4eGdjZGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTc2ODAsImV4cCI6MjA4NzUzMzY4MH0.6_wp5cmhfcw_9VCtouTZol6Px_9xs8wsLySQDZRC3KA";

// Create client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
