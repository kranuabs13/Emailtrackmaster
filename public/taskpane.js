/**
 * EmailTrackMaster - Taskpane Logic
 */

let currentTimerInterval;
let currentUserEmail;

Office.onReady((info) => {
    if (info.host === Office.Host.Outlook) {
        initSupabase();
        currentUserEmail = Office.context.mailbox.userProfile.emailAddress;
        document.getElementById('user-display').innerText = currentUserEmail;

        // Initial stats load
        updateDashboard();

        // Register for item change events
        Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, handleItemChanged);

        // Handle initial item
        handleItemChanged();

        // Refresh dashboard every 30 seconds
        setInterval(updateDashboard, 30000);
    }
});

async function updateDashboard() {
    const stats = await getDashboardStats(currentUserEmail);
    if (stats) {
        document.getElementById('avg-time').innerText = stats.avgResponseTime;
        document.getElementById('total-tracked').innerText = stats.total;
        document.getElementById('pending-count').innerText = stats.pending;
        document.getElementById('replied-count').innerText = stats.replied;
        document.getElementById('over-sla-count').innerText = stats.overSla;
        document.getElementById('vip-pending-count').innerText = stats.vipPending;
    }
}

async function handleItemChanged() {
    const item = Office.context.mailbox.item;
    
    // Clear previous UI state
    stopTimer();
    document.getElementById('current-email-info').style.display = 'none';
    document.getElementById('vip-indicator').innerHTML = '';

    if (!item || item.itemType !== Office.MailboxEnums.ItemType.Message) {
        return;
    }

    const conversationId = item.conversationId;
    const senderEmail = item.from ? item.from.emailAddress : null;

    if (!senderEmail) return;

    // 1. Check if email is already tracked or needs tracking
    let emailRecord = await getEmailStatus(conversationId);

    if (!emailRecord) {
        // New email detected, track it
        const vipRule = await getVipRule(senderEmail);
        const isVip = !!vipRule;
        const slaMinutes = isVip ? vipRule.sla_minutes : 120;

        emailRecord = {
            user_email: currentUserEmail,
            sender_email: senderEmail,
            conversation_id: conversationId,
            received_at: item.dateTimeCreated.toISOString(),
            is_vip: isVip,
            sla_minutes: slaMinutes,
            status: 'pending'
        };

        await logEmailOpen(emailRecord);
        updateDashboard();
    }

    // 2. Update UI for current email
    if (emailRecord.status === 'pending') {
        document.getElementById('current-email-info').style.display = 'block';
        document.getElementById('received-at-display').innerText = `Received: ${new Date(emailRecord.received_at).toLocaleString()}`;
        
        if (emailRecord.is_vip) {
            document.getElementById('vip-indicator').innerHTML = '<span class="vip-badge">VIP</span>';
        }

        startTimer(emailRecord.received_at, emailRecord.sla_minutes);
    }
}

function startTimer(receivedAtStr, slaMinutes) {
    const receivedAt = new Date(receivedAtStr);
    const slaMs = slaMinutes * 60 * 1000;

    function updateTimer() {
        const now = new Date();
        const elapsedMs = now - receivedAt;
        
        // Format time
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timer').innerText = display;

        // Check SLA
        const timerStatus = document.getElementById('timer-status');
        if (elapsedMs > slaMs) {
            timerStatus.innerText = "OVER SLA";
            timerStatus.classList.add('over-sla');
            document.getElementById('timer').style.color = 'var(--danger)';
        } else {
            timerStatus.innerText = "Within SLA";
            timerStatus.classList.remove('over-sla');
            document.getElementById('timer').style.color = 'white';
        }
    }

    updateTimer();
    currentTimerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (currentTimerInterval) {
        clearInterval(currentTimerInterval);
        currentTimerInterval = null;
    }
}
