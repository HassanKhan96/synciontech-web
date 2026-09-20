import { handleContact, type ContactEnv } from "../../server/contact";
import { sendContactEmail } from "../../server/spacemail";

export function onRequest(context: { request: Request; env: ContactEnv }) {
  return handleContact(context.request, context.env, {
    send: sendContactEmail,
    async verify(token, secret, ip) {
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error("Verification unavailable");
      return response.json();
    },
  });
}
