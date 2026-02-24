/**
 * EmailTrackMaster - Taskpane Logic
 */

let timerInterval;
let currentUserEmail;

Office.onReady((info) => {
    if (info.host === Office.Host.Outlook) {
        initSupabase();
        currentUserEmail = Office.context.mailbox.userProfile.emailAddress;
        document.getElementById('user-email').innerText = currentUserEmail;

        // Initialize dashboard
        refreshDashboard();

        // Listen for item changes
        Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, handleItemChanged);

        // Initial check
        handleItemChanged();

        // Auto-refresh stats
        setInterval(refreshDashboard, 30000);
    }
});

/**
 * Update Dashboard Metrics
 */
async function refreshDashboard() {
    const stats = await db.getStats(currentUserEmail);
    if (!stats) return;

    document.getElementById('stat-avg-time').innerText = stats.avgResponseTime;
    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-pending').innerText = stats.pending;
    document.getElementById('stat-replied').innerText = stats.replied;
    document.getElementById('stat-over-sla').innerText = stats.overSla;
    document.getElementById('stat-vip-pending').innerText = stats.vipPending;

    // Visual indicators
    const overSlaCard = document.getElementById('card-over-sla');
    if (stats.overSla > 0) {
        overSlaCard.classList.add('danger');
    } else {
        overSlaCard.classList.remove('danger');
    }
}

/**
 * Handle Email Selection Change
 */
async function handleItemChanged() {
    const item = Office.context.mailbox.item;
    
    // Reset UI
    stopLiveTimer();
    document.getElementById('active-tracking').style.display = 'none';
    document.getElementById('vip-badge').style.display = 'none';

    if (!item || item.itemType !== Office.MailboxEnums.ItemType.Message) {
        return;
    }

    const conversationId = item.conversationId;
    const sender = item.from ? item.from.emailAddress : null;

    if (!sender) return;

    // 1. Check if email is already tracked
    let emailRecord = await db.getEmailByConversation(conversationId);

    if (!emailRecord) {
        // New email - check VIP status and log
        const vipRule = await db.getVipRule(sender);
        const isVip = !!vipRule;
        const slaMinutes = isVip ? vipRule.sla_minutes : 120; // Default 2 hours

        emailRecord = {
            user_email: currentUserEmail,
            sender_email: sender,
            conversation_id: conversationId,
            received_at: item.dateTimeCreated.toISOString(),
            is_vip: isVip,
            sla_minutes: slaMinutes,
            status: 'pending'
        };

        emailRecord = await db.logEmail(emailRecord);
        refreshDashboard();
    }

    // 2. If pending, show live timer
    if (emailRecord && emailRecord.status === 'pending') {
        showActiveTracking(emailRecord);
    }
}

/**
 * Live SLA Timer Logic
 */
function showActiveTracking(record) {
    const trackingCard = document.getElementById('active-tracking');
    const timerClock = document.getElementById('live-timer');
    const slaStatus = document.getElementById('sla-status');
    const vipBadge = document.getElementById('vip-badge');
    
    trackingCard.style.display = 'block';
    document.getElementById('current-sender').innerText = record.sender_email;
    document.getElementById('current-received').innerText = new Date(record.received_at).toLocaleString();

    if (record.is_vip) {
        vipBadge.style.display = 'inline-block';
    }

    const receivedAt = new Date(record.received_at);
    const slaMs = record.sla_minutes * 60 * 1000;

    function updateTimer() {
        const now = new Date();
        const elapsedMs = now - receivedAt;
        
        // Format: HH:MM:SS
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        
        timerClock.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        // SLA Check
        if (elapsedMs > slaMs) {
            slaStatus.innerText = "OVER SLA LIMIT";
            slaStatus.classList.add('over');
            timerClock.style.color = 'var(--danger-color)';
        } else {
            slaStatus.innerText = "Within SLA";
            slaStatus.classList.remove('over');
            timerClock.style.color = 'var(--text-primary)';
        }
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopLiveTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
