import test from "node:test";
import assert from "node:assert/strict";
import { handleContact, type ContactDependencies } from "../server/contact";
import { composeContactEmail } from "../server/spacemail";

const env = {
  SPACEMAIL_PASSWORD: "test-only-password",
  TURNSTILE_SECRET_KEY: "test-only-secret",
  CONTACT_ALLOWED_ORIGINS: "https://synciontech.com",
};
const fields = { name: "Test Visitor", email: "visitor@example.com", company: "Example", message: "A test project enquiry.", website: "", token: "test-token" };
function request(body: unknown = fields, origin = "https://synciontech.com") {
  return new Request("https://synciontech.com/api/contact", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
function harness(overrides: Partial<ContactDependencies> = {}) {
  let sends = 0;
  let verifications = 0;
  const deps: ContactDependencies = {
    async verify() { verifications++; return { success: true, hostname: "synciontech.com", action: "contact" }; },
    async send(contact, password) {
      sends++;
      assert.equal(contact.email, fields.email);
      assert.equal(password, env.SPACEMAIL_PASSWORD);
    },
    ...overrides,
  };
  return { deps, sends: () => sends, verifications: () => verifications };
}

test("valid request sends exactly one message and returns non-cacheable success", async () => {
  const h = harness();
  const response = await handleContact(request(), env, h.deps);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(h.sends(), 1);
});

test("only POST is accepted", async () => {
  const response = await handleContact(new Request("https://synciontech.com/api/contact"), env, harness().deps);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});

test("missing configuration fails closed", async () => {
  for (const key of Object.keys(env)) {
    const h = harness();
    assert.equal((await handleContact(request(), { ...env, [key]: "" }, h.deps)).status, 503);
    assert.equal(h.sends(), 0);
  }
});

test("cross-origin and unapproved preview submissions are blocked", async () => {
  for (const origin of ["", "null", "https://evil.example", "https://preview.pages.dev", "https://synciontech.com.evil.example"]) {
    const h = harness();
    assert.equal((await handleContact(request(fields, origin), env, h.deps)).status, 403);
    assert.equal(h.verifications(), 0);
    assert.equal(h.sends(), 0);
  }
});

test("invalid input and header injection are rejected before verification", async () => {
  for (const body of [null, [], {}, { ...fields, name: " " }, { ...fields, email: "bad" },
    { ...fields, name: "Test\r\nBcc: bad@example.com" }, { ...fields, email: "visitor@example.com\r\n" },
    { ...fields, company: "x\nInjected" }, { ...fields, message: "short" },
    { ...fields, message: "x".repeat(5001) }, { ...fields, message: "hello\u0000world" },
    { ...fields, website: "spam" }, { ...fields, token: "" }, { ...fields, token: "x".repeat(2049) }]) {
    const h = harness();
    assert.equal((await handleContact(request(body), env, h.deps)).status, 400);
    assert.equal(h.verifications(), 0);
    assert.equal(h.sends(), 0);
  }
});

test("malformed JSON, wrong content type, and oversized bodies are rejected", async () => {
  const malformed = new Request(request(), { body: "{" });
  assert.equal((await handleContact(malformed, env, harness().deps)).status, 400);
  const wrongType = new Request(request(), { headers: { Origin: "https://synciontech.com", "Content-Type": "text/plain" } });
  assert.equal((await handleContact(wrongType, env, harness().deps)).status, 415);
  const oversized = request({ ...fields, message: "x".repeat(25_000) });
  assert.equal((await handleContact(oversized, env, harness().deps)).status, 413);
});

test("invalid, expired, wrong-host and wrong-action Turnstile tokens cannot send", async () => {
  for (const verification of [
    { success: false }, { success: true },
    { success: true, hostname: "evil.example", action: "contact" },
    { success: true, hostname: "synciontech.com", action: "login" },
  ]) {
    const h = harness({ verify: async () => verification });
    assert.equal((await handleContact(request(), env, h.deps)).status, 400);
    assert.equal(h.sends(), 0);
  }
});

test("verification outages do not send", async () => {
  const h = harness({ verify: async () => { throw new Error("offline"); } });
  assert.equal((await handleContact(request(), env, h.deps)).status, 503);
  assert.equal(h.sends(), 0);
});

test("SMTP failure never returns success, leaks details, or automatically retries", async () => {
  let attempts = 0;
  const h = harness({ send: async () => { attempts++; throw new Error(env.SPACEMAIL_PASSWORD); } });
  const response = await handleContact(request(), env, h.deps);
  assert.equal(response.status, 502);
  assert.equal(attempts, 1);
  assert.equal((await response.text()).includes(env.SPACEMAIL_PASSWORD), false);
});

test("sender and recipient are fixed; user content is plain text and reply-to only", () => {
  const mail = composeContactEmail({ ...fields, message: "<script>alert('x')</script>\n.Regular text" });
  assert.equal(mail.from.address, "info@synciontech.com");
  assert.equal(mail.to, "info@synciontech.com");
  assert.equal(mail.replyTo.address, fields.email);
  assert.equal("html" in mail, false);
  assert.equal(mail.disableFileAccess, true);
  assert.equal(mail.disableUrlAccess, true);
});
