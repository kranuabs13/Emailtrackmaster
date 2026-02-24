/**
 * EmailTrackMaster - Supabase Client Configuration
 * This file initializes the Supabase client using the CDN-provided library.
 */

const SUPABASE_URL = "YOUR_SUPABASE_URL"; // Replace with process.env.VITE_SUPABASE_URL if using build tools
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // Replace with process.env.VITE_SUPABASE_ANON_KEY

let supabase;

function initSupabase() {
    if (typeof supabasejs !== 'undefined') {
        supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase initialized successfully.");
    } else {
        console.error("Supabase library not loaded. Ensure CDN script is included.");
    }
}

// Database Helper Functions

async function getVipRule(senderEmail) {
    const { data, error } = await supabase
        .from('vip_rules')
        .select('sla_minutes')
        .eq('sender_email', senderEmail)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error("Error fetching VIP rule:", error);
    }
    return data;
}

async function logEmailOpen(emailData) {
    // Check if already logged
    const { data: existing } = await supabase
        .from('emails')
        .select('id')
        .eq('conversation_id', emailData.conversation_id)
        .single();

    if (existing) return;

    const { error } = await supabase
        .from('emails')
        .insert([emailData]);
    
    if (error) console.error("Error logging email open:", error);
}

async function updateEmailOnSend(conversationId) {
    const now = new Date().toISOString();
    
    // Get received_at to calculate response time
    const { data: email } = await supabase
        .from('emails')
        .select('received_at')
        .eq('conversation_id', conversationId)
        .eq('status', 'pending')
        .single();

    if (!email) return;

    const receivedAt = new Date(email.received_at);
    const repliedAt = new Date(now);
    const responseTimeSeconds = Math.floor((repliedAt - receivedAt) / 1000);

    const { error } = await supabase
        .from('emails')
        .update({
            replied_at: now,
            response_time_seconds: responseTimeSeconds,
            status: 'replied'
        })
        .eq('conversation_id', conversationId);

    if (error) console.error("Error updating email on send:", error);
}

async function getDashboardStats(userEmail) {
    const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_email', userEmail);

    if (error) {
        console.error("Error fetching stats:", error);
        return null;
    }

    const total = data.length;
    const pending = data.filter(e => e.status === 'pending').length;
    const replied = data.filter(e => e.status === 'replied').length;
    const vipPending = data.filter(e => e.status === 'pending' && e.is_vip).length;
    
    const repliedEmails = data.filter(e => e.status === 'replied' && e.response_time_seconds);
    const avgResponseTime = repliedEmails.length > 0 
        ? (repliedEmails.reduce((acc, curr) => acc + curr.response_time_seconds, 0) / repliedEmails.length / 60).toFixed(1)
        : 0;

    const overSla = data.filter(e => {
        if (e.status !== 'pending') return false;
        const elapsedMinutes = (new Date() - new Date(e.received_at)) / 1000 / 60;
        return elapsedMinutes > e.sla_minutes;
    }).length;

    return { total, pending, replied, vipPending, avgResponseTime, overSla };
}

async function getEmailStatus(conversationId) {
    const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();
    
    if (error) return null;
    return data;
}
