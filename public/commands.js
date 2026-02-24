/**
 * EmailTrackMaster - Event-based Commands (OnSend)
 */

// Initialize Supabase for background commands
// Note: In event-based add-ins, we need to ensure libraries are available.
// We'll use a simplified fetch-based approach if CDN scripts aren't reliable in this context,
// but for this project we assume the environment supports the standard initialization.

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

async function supabaseUpdate(conversationId) {
    // Simplified fetch-based update for background tasks to avoid dependency issues
    const now = new Date().toISOString();
    
    try {
        // 1. Get the email record
        const getUrl = `${SUPABASE_URL}/rest/v1/emails?conversation_id=eq.${conversationId}&status=eq.pending&select=received_at`;
        const getRes = await fetch(getUrl, {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const emails = await getRes.json();

        if (emails && emails.length > 0) {
            const receivedAt = new Date(emails[0].received_at);
            const repliedAt = new Date(now);
            const responseTimeSeconds = Math.floor((repliedAt - receivedAt) / 1000);

            // 2. Update the record
            const patchUrl = `${SUPABASE_URL}/rest/v1/emails?conversation_id=eq.${conversationId}`;
            await fetch(patchUrl, {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    replied_at: now,
                    response_time_seconds: responseTimeSeconds,
                    status: 'replied'
                })
            });
            console.log("Supabase update successful on send.");
        }
    } catch (err) {
        console.error("Supabase update failed:", err);
    }
}

/**
 * Attachment Guard and Response Tracking
 * Triggered on ItemSend
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
                    const attachmentCount = attachmentResult.value.length;

                    if (hasKeyword && attachmentCount === 0) {
                        // Block send
                        event.completed({
                            allowEvent: false,
                            errorMessage: "You mentioned an attachment but none is attached. Please attach the file before sending."
                        });
                        return;
                    }

                    // 2. Response Tracking (Success path)
                    const conversationId = item.conversationId;
                    // We fire and forget the update to not block the send process too long
                    supabaseUpdate(conversationId).then(() => {
                        event.completed({ allowEvent: true });
                    }).catch(() => {
                        // Even if DB fails, we allow send to not frustrate user
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

// Register the function
Office.actions.associate("onSendHandler", onSendHandler);
