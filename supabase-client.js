import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "PASTE_YOUR_PROJECT_URL_HERE"
const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)