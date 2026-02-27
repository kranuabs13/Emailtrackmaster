import { supabase } from './supabase-client.js';

let currentUserEmail;
let timerInterval;
let currentRecord;

Office.onReady((info) => {
    if (info.host === Office.Host.Outlook) {
        currentUserEmail = Office.context.mailbox.userProfile.emailAddress;
        document.getElementById('user-badge').innerText = currentUserEmail;

        // Register ItemChanged event
        Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, handleItemChanged);

        // Initial load
        refreshDashboard();
        handleItemChanged();

        // Periodic refresh
        setInterval(refreshDashboard, 15000);
    }
});

/**
 * Handle Email Selection Change
 */
async function handleItemChanged() {
    const item = Office.context.mailbox.item;
    
    // Reset UI
    stopTimer();
    document.getElementById('active-item-section').style.display = 'none';
    document.getElementById('vip-indicator').style.display = 'none';

    if (!item || item.itemType !== Office.MailboxEnums.ItemType.Message) {
        return;
    }

    try {
        const conversationId = item.conversationId;
        const sender = item.from ? item.from.emailAddress : null;

        if (!sender || !conversationId) return;

        // Check if already exists
        let { data: record, error } = await supabase
            .from('emails')
            .select('*')
            .eq('conversation_id', conversationId)
            .maybeSingle();

        if (error) throw error;

        if (!record) {
            // Check VIP Rules
            const { data: vipRule } = await supabase
                .from('vip_rules')
                .select('sla_minutes')
                .eq('sender_email', sender)
                .maybeSingle();

            const isVip = !!vipRule;
            const slaMinutes = isVip ? vipRule.sla_minutes : 120; // Default 2 hours

            const newRecord = {
                user_email: currentUserEmail,
                sender_email: sender,
                conversation_id: conversationId,
                received_at: item.dateTimeCreated.toISOString(),
                is_vip: isVip,
                sla_minutes: slaMinutes,
                status: 'pending'
            };

            const { data: inserted, error: insertError } = await supabase
                .from('emails')
                .insert([newRecord])
                .select()
                .single();

            if (insertError) {
                // Handle race condition if another client inserted it
                if (insertError.code === '23505') {
                    const { data: retry } = await supabase
                        .from('emails')
                        .select('*')
                        .eq('conversation_id', conversationId)
                        .single();
                    record = retry;
                } else {
                    throw insertError;
                }
            } else {
                record = inserted;
            }
            refreshDashboard();
        }

        if (record && record.status === 'pending') {
            currentRecord = record;
            showActiveTracking(record);
        }
    } catch (error) {
        console.error("Error in handleItemChanged:", error);
    }
}

/**
 * Dashboard Refresh
 */
async function refreshDashboard() {
    try {
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .eq('user_email', currentUserEmail);

        if (error) throw error;

        const stats = {
            total: data.length,
            pending: data.filter(e => e.status === 'pending').length,
            replied: data.filter(e => e.status === 'replied').length,
            vipPending: data.filter(e => e.status === 'pending' && e.is_vip).length,
            avgResponseTime: 0,
            overSla: 0
        };

        const replied = data.filter(e => e.status === 'replied' && e.response_time_seconds);
        if (replied.length > 0) {
            const sum = replied.reduce((acc, curr) => acc + curr.response_time_seconds, 0);
            stats.avgResponseTime = (sum / replied.length / 60).toFixed(1);
        }

        stats.overSla = data.filter(e => {
            if (e.status !== 'pending') return false;
            const elapsed = (new Date() - new Date(e.received_at)) / 1000 / 60;
            return elapsed > e.sla_minutes;
        }).length;

        updateUI(stats);
    } catch (error) {
        console.error("Error refreshing dashboard:", error);
    }
}

function updateUI(stats) {
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-pending').innerText = stats.pending;
    document.getElementById('stat-replied').innerText = stats.replied;
    document.getElementById('stat-avg-time').innerText = stats.avgResponseTime;
    document.getElementById('stat-vip-pending').innerText = stats.vipPending;
    document.getElementById('stat-over-sla').innerText = stats.overSla;

    const overSlaCard = document.getElementById('card-over-sla');
    if (stats.overSla > 0) {
        overSlaCard.classList.add('active-danger');
    } else {
        overSlaCard.classList.remove('active-danger');
    }
}

/**
 * Live Timer
 */
function showActiveTracking(record) {
    const section = document.getElementById('active-item-section');
    const timer = document.getElementById('live-timer');
    const slaStatus = document.getElementById('sla-status');
    const vipTag = document.getElementById('vip-indicator');

    section.style.display = 'block';
    document.getElementById('item-sender').innerText = record.sender_email;
    document.getElementById('item-received').innerText = new Date(record.received_at).toLocaleString();

    if (record.is_vip) vipTag.style.display = 'inline-block';

    const receivedAt = new Date(record.received_at);
    const slaMs = record.sla_minutes * 60 * 1000;

    function tick() {
        const now = new Date();
        const diff = now - receivedAt;
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        timer.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if (diff > slaMs) {
            slaStatus.innerText = "OVER SLA LIMIT";
            slaStatus.style.color = "#ff4444";
            timer.style.color = "#ff4444";
        } else {
            slaStatus.innerText = "Within SLA";
            slaStatus.style.color = "#00ff88";
            timer.style.color = "#ffffff";
        }
    }

    tick();
    timerInterval = setInterval(tick, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
