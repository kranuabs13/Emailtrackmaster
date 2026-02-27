/**
 * EmailTrackMaster - Commands (Smart Alerts / OnMessageSend)
 */

const SUPABASE_URL = "https://glastmgtyigzbxxgcdbo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jmM4i9pwWtc8J8WvCiCp3Q_wfM7ncvz";

/**
 * Handle OnMessageSend Event
 */
async function onMessageSendHandler(event) {
    console.log("OnMessageSend triggered");
    const item = Office.context.mailbox.item;

    try {
        // 1. Attachment Guard
        const bodyResult = await new Promise((resolve) => {
            item.body.getAsync(Office.CoercionType.Text, (result) => resolve(result));
        });

        if (bodyResult.status === Office.AsyncResultStatus.Succeeded) {
            const body = bodyResult.value.toLowerCase();
            const keywords = ["attached", "attachment", "pdf", "quote", "invoice"];
            const hasKeyword = keywords.some(kw => body.includes(kw));

            const attachmentsResult = await new Promise((resolve) => {
                item.getAttachmentsAsync((result) => resolve(result));
            });

            if (attachmentsResult.status === Office.AsyncResultStatus.Succeeded) {
                const attachments = attachmentsResult.value;
                if (hasKeyword && attachments.length === 0) {
                    Office.context.mailbox.item.notificationMessages.addAsync("attachment_guard", {
                        type: Office.MailboxEnums.ItemNotificationMessageType.ErrorMessage,
                        message: "You mentioned an attachment but none is attached."
                    });
                    event.completed({ allowEvent: false });
                    return;
                }
            }
        }

        // 2. Reply Logging
        const conversationId = item.conversationId;
        if (conversationId) {
            await logReply(conversationId);
        }

        event.completed({ allowEvent: true });
    } catch (error) {
        console.error("Error in onMessageSendHandler:", error);
        // Do not block sending on internal errors unless it's the attachment guard
        event.completed({ allowEvent: true });
    }
}

/**
 * Log Reply to Supabase
 */
async function logReply(conversationId) {
    const now = new Date();
    try {
        // Fetch the pending record
        const getUrl = `${SUPABASE_URL}/rest/v1/emails?conversation_id=eq.${conversationId}&status=eq.pending&select=received_at`;
        const response = await fetch(getUrl, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const receivedAt = new Date(data[0].received_at);
            const responseTimeSeconds = Math.floor((now - receivedAt) / 1000);

            // Update status
            const patchUrl = `${SUPABASE_URL}/rest/v1/emails?conversation_id=eq.${conversationId}`;
            await fetch(patchUrl, {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    replied_at: now.toISOString(),
                    response_time_seconds: responseTimeSeconds,
                    status: 'replied'
                })
            });
        }
    } catch (error) {
        console.error("logReply failed:", error);
    }
}

// Associate handler
Office.actions.associate("onMessageSendHandler", onMessageSendHandler);
