import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://glastmgtyigzbxxgcdbo.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXN0bWd0eWlnemJ4eGdjZGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTc2ODAsImV4cCI6MjA4NzUzMzY4MH0.6_wp5cmhfcw_9VCtouTZol6Px_9xs8wsLySQDZRC3KA"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)