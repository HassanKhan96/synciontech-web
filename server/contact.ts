export interface ContactEnv {
  SPACEMAIL_PASSWORD?: string;
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_ALLOWED_ORIGINS?: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  company: string;
  message: string;
}

export interface ContactDependencies {
  verify: (
    token: string,
    secret: string,
    ip: string | null,
  ) => Promise<{
    success: boolean;
    hostname?: string;
    action?: string;
  }>;
  send: (message: ContactMessage, password: string) => Promise<void>;
}

const MAX_BODY_BYTES = 24_000;
const singleLine = /^[^\x00-\x1f\x7f]*$/;
const emailPattern =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

function json(status: number, error?: string) {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(status === 405 ? { Allow: "POST" } : {}),
    },
  });
}

// Count streamed bytes, not only the caller-controlled Content-Length header.
async function readBody(request: Request) {
  if (!request.body) throw new Error("empty");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let length = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("oversize");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    reader.releaseLock();
  }
}

export async function handleContact(
  request: Request,
  env: ContactEnv,
  deps: ContactDependencies,
) {
  if (request.method !== "POST")
    return json(405, "Please submit the contact form.");
  const origins = (env.CONTACT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!env.SPACEMAIL_PASSWORD || !env.TURNSTILE_SECRET_KEY || !origins.length) {
    return json(
      503,
      "The contact form is temporarily unavailable. Please email info@synciontech.com.",
    );
  }
  const origin = request.headers.get("Origin");
  // Never trust the request host as an allowlist; previews are opt-in too.
  if (!origin || !origins.includes(origin))
    return json(403, "Please send your message from our website.");
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim() !==
    "application/json"
  ) {
    return json(415, "Please submit the contact form.");
  }
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return error instanceof Error && error.message === "oversize"
      ? json(413, "Your message is too long. Please shorten it and try again.")
      : json(400, "We couldn’t read your message. Please try again.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return json(400, "Please check the form fields.");
  const fields = body as Record<string, unknown>;
  if (
    ["name", "email", "company", "message", "website", "token"].some(
      (key) => typeof fields[key] !== "string",
    )
  ) {
    return json(400, "Please check the form fields.");
  }
  const { name, email, company, message, website, token } = fields as Record<
    string,
    string
  >;
  if (website) return json(400, "We couldn’t verify your submission.");
  const contact = {
    name: name.trim(),
    email: email.trim(),
    company: company.trim(),
    message: message.trim(),
  };
  if (
    !contact.name ||
    contact.name.length > 100 ||
    !singleLine.test(name) ||
    contact.email.length > 254 ||
    !emailPattern.test(contact.email) ||
    !singleLine.test(email) ||
    company.length > 160 ||
    !singleLine.test(company) ||
    contact.message.length < 10 ||
    message.length > 5000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message) ||
    !token ||
    token.length > 2048
  ) {
    return json(
      400,
      "Check your name and email, and enter a message between 10 and 5,000 characters.",
    );
  }
  try {
    const verification = await deps.verify(
      token,
      env.TURNSTILE_SECRET_KEY,
      request.headers.get("CF-Connecting-IP"),
    );
    if (
      !verification.success ||
      verification.action !== "contact" ||
      verification.hostname !== new URL(origin).hostname
    ) {
      return json(
        400,
        "Verification expired or failed. Please complete the security check again.",
      );
    }
  } catch {
    return json(
      503,
      "The security check is unavailable. Please try again or email info@synciontech.com.",
    );
  }
  try {
    await deps.send(contact, env.SPACEMAIL_PASSWORD);
    return json(200);
  } catch {
    // Never return or log SMTP errors: they can contain credentials or personal data.
    // A connection may fail after SMTP acceptance; do not automatically retry.
    return json(
      502,
      "We couldn’t confirm your message was sent. Please email info@synciontech.com if needed.",
    );
  }
}
