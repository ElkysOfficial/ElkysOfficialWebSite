import { requireAdminAccess } from "../_shared/auth.ts";
import { CORS } from "../_shared/email-template.ts";

// ---------------------------------------------------------------------------
// Google Calendar Sync  -  Service Account Integration
// Supports: create, list, delete via POST body { action: "..." }
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  ...CORS,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Base64url helper (chunk-safe for large arrays) ---

function base64url(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// --- PEM to CryptoKey ---

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Handle both literal \n and real newlines
  const normalized = pem.replace(/\\n/g, "\n");
  const pemBody = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/[\s\n\r]/g, "");

  console.log("[google-calendar-sync] PEM body length:", pemBody.length, "chars");

  const binaryStr = atob(pemBody);
  const binaryDer = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    binaryDer[i] = binaryStr.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// --- In-memory token cache ---

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!raw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY secret");

  let sa: Record<string, string>;
  try {
    sa = JSON.parse(raw);
  } catch (parseErr) {
    console.error(
      "[google-calendar-sync] failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:",
      parseErr
    );
    console.error("[google-calendar-sync] raw key first 50 chars:", raw.substring(0, 50));
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Re-set the secret.");
  }

  if (!sa.client_email || !sa.private_key) {
    console.error(
      "[google-calendar-sync] SA key missing fields. Has client_email:",
      !!sa.client_email,
      "Has private_key:",
      !!sa.private_key
    );
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is missing required fields (client_email, private_key)."
    );
  }

  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/calendar",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    )
  );

  const key = await importPrivateKey(sa.private_key);
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${payload}`)
    )
  );
  const signature = base64url(signatureBytes);
  const jwt = `${header}.${payload}.${signature}`;

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[google-calendar-sync] token exchange failed:", err);
    throw new Error(`Failed to obtain access token: ${err}`);
  }

  const { access_token, expires_in } = await res.json();

  cachedToken = {
    token: access_token,
    expiresAt: now + (expires_in ?? 3600),
  };

  console.log("[google-calendar-sync] access token acquired, expires in", expires_in, "s");
  return access_token;
}

// --- Google Calendar API helpers ---

function getCalendarId(): string {
  const id = Deno.env.get("GOOGLE_CALENDAR_ID");
  if (!id) throw new Error("Missing GOOGLE_CALENDAR_ID secret");
  return id;
}

function baseUrl(): string {
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(getCalendarId())}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// --- Actions ---

interface CreateInput {
  summary: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  attendees?: string[];
}

async function handleCreate(token: string, input: CreateInput): Promise<Response> {
  const { summary, description, location, start_time, end_time, attendees } = input;

  if (!summary || !start_time || !end_time) {
    return json({ error: "summary, start_time, and end_time are required" }, 400);
  }

  const body: Record<string, unknown> = {
    summary,
    description: description ?? "",
    start: { dateTime: start_time, timeZone: "America/Sao_Paulo" },
    end: { dateTime: end_time, timeZone: "America/Sao_Paulo" },
  };

  if (location) body.location = location;
  if (attendees?.length) {
    body.attendees = attendees.map((email) => ({ email }));
  }

  const url = `${baseUrl()}/events?sendUpdates=all`;
  console.log("[google-calendar-sync] creating event:", summary);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[google-calendar-sync] create event failed:", err);
    throw new Error(`Google Calendar API error (create): ${err}`);
  }

  const event = await res.json();
  console.log("[google-calendar-sync] event created:", event.id);

  return json({
    id: event.id,
    summary: event.summary,
    htmlLink: event.htmlLink,
    start: event.start,
    end: event.end,
    attendees: event.attendees ?? [],
  });
}

interface ListInput {
  time_min: string;
  time_max: string;
}

async function handleList(token: string, input: ListInput): Promise<Response> {
  const { time_min, time_max } = input;

  if (!time_min || !time_max) {
    return json({ error: "time_min and time_max are required" }, 400);
  }

  const url =
    `${baseUrl()}/events?` +
    `timeMin=${encodeURIComponent(time_min)}` +
    `&timeMax=${encodeURIComponent(time_max)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=250` +
    `&timeZone=America/Sao_Paulo`;

  console.log("[google-calendar-sync] listing events:", time_min, "to", time_max);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[google-calendar-sync] list events failed:", err);
    throw new Error(`Google Calendar API error (list): ${err}`);
  }

  const data = await res.json();
  const events = (data.items ?? []).map((e: Record<string, unknown>) => ({
    id: e.id,
    summary: e.summary,
    description: e.description ?? null,
    location: e.location ?? null,
    htmlLink: e.htmlLink,
    hangoutLink: e.hangoutLink ?? null,
    start: e.start,
    end: e.end,
    status: e.status,
    attendees: e.attendees ?? [],
  }));

  console.log("[google-calendar-sync] listed", events.length, "events");
  return json({ events });
}

// --- Update ---

interface UpdateInput {
  event_id: string;
  summary?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  attendees?: string[];
  colorId?: string;
}

async function handleUpdate(token: string, input: UpdateInput): Promise<Response> {
  const { event_id, summary, description, location, start_time, end_time, attendees, colorId } =
    input;

  if (!event_id) {
    return json({ error: "event_id is required" }, 400);
  }

  const body: Record<string, unknown> = {};
  if (summary !== undefined) body.summary = summary;
  if (description !== undefined) body.description = description;
  if (location !== undefined) body.location = location;
  if (start_time) body.start = { dateTime: start_time, timeZone: "America/Sao_Paulo" };
  if (end_time) body.end = { dateTime: end_time, timeZone: "America/Sao_Paulo" };
  if (colorId) body.colorId = colorId;
  if (attendees?.length) {
    body.attendees = attendees.map((email) => ({ email }));
  }

  const url = `${baseUrl()}/events/${encodeURIComponent(event_id)}?sendUpdates=all`;
  console.log("[google-calendar-sync] updating event:", event_id);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[google-calendar-sync] update event failed:", err);
    throw new Error(`Google Calendar API error (update): ${err}`);
  }

  const event = await res.json();
  console.log("[google-calendar-sync] event updated:", event.id);

  return json({
    id: event.id,
    summary: event.summary,
    htmlLink: event.htmlLink,
    hangoutLink: event.hangoutLink ?? null,
    start: event.start,
    end: event.end,
    attendees: event.attendees ?? [],
  });
}

// --- Delete ---

interface DeleteInput {
  event_id: string;
}

async function handleDelete(token: string, input: DeleteInput): Promise<Response> {
  const { event_id } = input;

  if (!event_id) {
    return json({ error: "event_id is required" }, 400);
  }

  const url = `${baseUrl()}/events/${encodeURIComponent(event_id)}`;
  console.log("[google-calendar-sync] deleting event:", event_id);

  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    console.error("[google-calendar-sync] delete event failed:", err);
    throw new Error(`Google Calendar API error (delete): ${err}`);
  }

  if (res.status === 404) {
    console.warn("[google-calendar-sync] event not found (already deleted?):", event_id);
  }

  console.log("[google-calendar-sync] event deleted:", event_id);
  return json({ success: true, event_id });
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  // Admin-only access
  const authResult = await requireAdminAccess(req, CORS_HEADERS);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return json({ error: "Missing 'action' in request body" }, 400);
    }

    const token = await getAccessToken();

    switch (action) {
      case "create":
        return await handleCreate(token, body as CreateInput);

      case "list":
        return await handleList(token, body as ListInput);

      case "update":
        return await handleUpdate(token, body as UpdateInput);

      case "delete":
        return await handleDelete(token, body as DeleteInput);

      default:
        return json(
          { error: `Unknown action '${action}'. Supported: create, list, update, delete` },
          400
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("[google-calendar-sync] unhandled error:", message);
    console.error("[google-calendar-sync] stack:", stack);
    return json({ error: message }, 500);
  }
});
