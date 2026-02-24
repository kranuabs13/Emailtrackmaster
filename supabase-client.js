/**
 * EmailTrackMaster - Supabase Client
 * Production-ready modular implementation
 */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

let supabase;

function initSupabase() {
    if (typeof supabasejs !== 'undefined') {
        supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized.");
    } else {
        console.error("Supabase library not found. Ensure CDN is loaded.");
    }
}

/**
 * Database Operations
 */
const db = {
    /**
     * Get VIP rule for a sender
     */
    async getVipRule(senderEmail) {
        const { data, error } = await supabase
            .from('vip_rules')
            .select('sla_minutes')
            .eq('sender_email', senderEmail)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching VIP rule:", error);
        }
        return data;
    },

    /**
     * Log a new email if it doesn't exist
     */
    async logEmail(emailData) {
        // Check if already logged
        const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('conversation_id', emailData.conversation_id)
            .single();

        if (existing) return existing;

        const { data, error } = await supabase
            .from('emails')
            .insert([emailData])
            .select()
            .single();
        
        if (error) console.error("Error logging email:", error);
        return data;
    },

    /**
     * Update email status to replied
     */
    async markAsReplied(conversationId) {
        const now = new Date();
        
        // Get original record to calculate time
        const { data: email } = await supabase
            .from('emails')
            .select('received_at')
            .eq('conversation_id', conversationId)
            .eq('status', 'pending')
            .single();

        if (!email) return null;

        const receivedAt = new Date(email.received_at);
        const responseTimeSeconds = Math.floor((now - receivedAt) / 1000);

        const { data, error } = await supabase
            .from('emails')
            .update({
                replied_at: now.toISOString(),
                response_time_seconds: responseTimeSeconds,
                status: 'replied'
            })
            .eq('conversation_id', conversationId)
            .select()
            .single();

        if (error) console.error("Error marking as replied:", error);
        return data;
    },

    /**
     * Get dashboard stats for a user
     */
    async getStats(userEmail) {
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .eq('user_email', userEmail);

        if (error) {
            console.error("Error fetching stats:", error);
            return null;
        }

        const stats = {
            total: data.length,
            pending: data.filter(e => e.status === 'pending').length,
            replied: data.filter(e => e.status === 'replied').length,
            vipPending: data.filter(e => e.status === 'pending' && e.is_vip).length,
            avgResponseTime: 0,
            overSla: 0
        };

        const repliedWithTime = data.filter(e => e.status === 'replied' && e.response_time_seconds);
        if (repliedWithTime.length > 0) {
            const totalSeconds = repliedWithTime.reduce((sum, e) => sum + e.response_time_seconds, 0);
            stats.avgResponseTime = (totalSeconds / repliedWithTime.length / 60).toFixed(1);
        }

        stats.overSla = data.filter(e => {
            if (e.status !== 'pending') return false;
            const elapsedMinutes = (new Date() - new Date(e.received_at)) / 1000 / 60;
            return elapsedMinutes > e.sla_minutes;
        }).length;

        return stats;
    },

    /**
     * Get single email record by conversation ID
     */
    async getEmailByConversation(conversationId) {
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .eq('conversation_id', conversationId)
            .single();
        
        if (error && error.code !== 'PGRST116') return null;
        return data;
    }
};
