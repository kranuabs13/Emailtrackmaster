import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://glastmgtyigzbxxgcdbo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jmM4i9pwWtc8J8WvCiCp3Q_wfM7ncvz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
