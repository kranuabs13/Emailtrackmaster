// commands.js

// Supabase configuration
const SUPABASE_URL = "https://glastmgtyigzbxxgcdbo.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXN0bWd0eWlnemJ4eGdjZGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTc2ODAsImV4cCI6MjA4NzUzMzY4MH0.6_wp5cmhfcw_9VCtouTZol6Px_9xs8wsLySQDZRC3KA";

// Initialize Office
Office.onReady(() => {
  Office.actions.associate("onMessageSendHandler", onMessageSendHandler);
});

// =======================
// MAIN ON-SEND HANDLER
// =======================
async function onMessageSendHandler(event) {
  try {
    const item = Office.context.mailbox.item;

    // 1️⃣ Block if user mentions attachment but none exists
    const shouldBlock = await shouldBlockForMissingAttachment(item);

    if (shouldBlock) {
      showSendBlockedNotification(item);
      event.completed({ allowEvent: false });
      return;
    }

    // 2️⃣ Mark conversation as replied in Supabase
    await tryMarkConversationReplied(item);

    event.completed({ allowEvent: true });
  } catch (err) {
    console.error("onMessageSendHandler error:", err);
    event.completed({ allowEvent: true }); // Fail open
  }
}

// =======================
// ATTACHMENT CHECK
// =======================
async function shouldBlockForMissingAttachment(item) {
  const bodyText = await getBodyText(item);

  const mentionsAttachment =
    /\b(attach|attached|attachment|enclosed|see attached)\b/i.test(bodyText);

  if (!mentionsAttachment) return false;

  const atts = item.attachments || [];
  const hasAttachment = Array.isArray(atts) && atts.length > 0;

  return !hasAttachment;
}

function getBodyText(item) {
  return new Promise((resolve) => {
    item.body.getAsync(Office.CoercionType.Text, (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve(result.value || "");
      } else {
        resolve("");
      }
    });
  });
}

function showSendBlockedNotification(item) {
  item.notificationMessages.replaceAsync("no-attachments", {
    type: "informationalMessage",
    message:
      "You mentioned an attachment but didn’t attach any files. Please attach a file or remove the reference.",
    icon: "icon16",
    persistent: true,
  });
}

// =======================
// SUPABASE UPDATE LOGIC
// =======================
async function tryMarkConversationReplied(item) {
  const conversationId = item.conversationId;
  if (!conversationId) return;

  const userEmail =
    Office.context.mailbox?.userProfile?.emailAddress || null;

  const nowIso = new Date().toISOString();

  const existing = await supabaseFetchEmailRow(conversationId);
  if (!existing) return;

  const receivedAt = existing.received_at
    ? new Date(existing.received_at)
    : null;

  let responseTimeSeconds = null;

  if (receivedAt) {
    responseTimeSeconds = Math.max(
      0,
      Math.floor((new Date(nowIso) - receivedAt) / 1000)
    );
  }

  await supabasePatchEmail(conversationId, {
    status: "replied",
    replied_at: nowIso,
    response_time_seconds: responseTimeSeconds,
    user_email: userEmail || existing.user_email,
  });
}

// =======================
// SUPABASE REST HELPERS
// =======================
async function supabaseFetchEmailRow(conversationId) {
  const url =
    `${SUPABASE_URL}/rest/v1/emails` +
    `?conversation_id=eq.${encodeURIComponent(conversationId)}` +
    `&select=conversation_id,received_at,user_email,status`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return data[0];
}

async function supabasePatchEmail(conversationId, patch) {
  const url =
    `${SUPABASE_URL}/rest/v1/emails` +
    `?conversation_id=eq.${encodeURIComponent(conversationId)}`;

  await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
}
