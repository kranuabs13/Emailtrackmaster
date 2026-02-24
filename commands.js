/**
 * EmailTrackMaster - Commands (OnSend)
 * Synchronous ItemSend implementation
 */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

/**
 * Background Supabase Update
 */
async function updateSupabaseOnSend(conversationId) {
    const now = new Date().toISOString();
    
    try {
        // 1. Fetch received_at
        const getUrl = `${SUPABASE_URL}/rest/v1/emails?conversation_id=eq.${conversationId}&status=eq.pending&select=received_at`;
        const response = await fetch(getUrl, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const receivedAt = new Date(data[0].received_at);
            const repliedAt = new Date(now);
            const diffSeconds = Math.floor((repliedAt - receivedAt) / 1000);

            // 2. Update status
            const patchUrl = `${SUPABASE_URL}/rest/v1/emails?conversation_id=eq.${conversationId}`;
            await fetch(patchUrl, {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    replied_at: now,
                    response_time_seconds: diffSeconds,
                    status: 'replied'
                })
            });
        }
    } catch (e) {
        console.error("Background update failed:", e);
    }
}

/**
 * Main OnSend Handler
 */
function onSendHandler(event) {
    const item = Office.context.mailbox.item;

    // 1. Attachment Guard
    item.body.getAsync(Office.CoercionType.Text, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            const body = result.value.toLowerCase();
            const keywords = ["attached", "attachment", "pdf", "invoice", "quote"];
            const hasKeyword = keywords.some(kw => body.includes(kw));

            item.getAttachmentsAsync((attachmentResult) => {
                if (attachmentResult.status === Office.AsyncResultStatus.Succeeded) {
                    const count = attachmentResult.value.length;

                    if (hasKeyword && count === 0) {
                        event.completed({
                            allowEvent: false,
                            errorMessage: "You mentioned an attachment but none is attached. Please attach the file before sending."
                        });
                        return;
                    }

                    // 2. Reply Tracking
                    const conversationId = item.conversationId;
                    
                    // We use a promise-based approach but must call event.completed
                    updateSupabaseOnSend(conversationId).finally(() => {
                        event.completed({ allowEvent: true });
                    });
                } else {
                    event.completed({ allowEvent: true });
                }
            });
        } else {
            event.completed({ allowEvent: true });
        }
    });
}

// Associate function with manifest ID
Office.actions.associate("onSendHandler", onSendHandler);
