"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ContactSecurity } from "./contact-security";
import "./contact-form.css";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [token, setToken] = useState("");
  const [challenge, setChallenge] = useState(0);
  const inFlight = useRef(false);
  const success = useRef<HTMLDivElement>(null);

  useEffect(() => { if (sent) success.current?.focus(); }, [sent]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !siteKey || !token) return;
    const form = new FormData(event.currentTarget);
    inFlight.current = true;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"), email: form.get("email"),
          company: form.get("company"), message: form.get("message"),
          website: form.get("website"), token,
        }),
        signal: AbortSignal.timeout(40_000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(typeof result.error === "string" ? result.error : "We couldn’t send your message. Please email us directly.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn’t confirm your message was sent. Check your connection or email us directly; avoid submitting repeatedly.");
    } finally {
      setSending(false);
      inFlight.current = false;
      setToken("");
      setChallenge(value => value + 1);
    }
  }

  if (sent) {
    return (
      <div className="form-success" role="status" ref={success} tabIndex={-1}>
        <span><Check /></span>
        <h3>Thanks for reaching out.</h3>
        <p>Your message has been submitted to our mail server. We&apos;ll get back to you soon.</p>
        <button className="text-link" onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit} aria-busy={sending}>
      <fieldset className="contact-fields" disabled={sending}>
      <legend className="sr-only">Send Syncion Tech a message</legend>
      <div className="field-row">
        <label><span>Name</span><input name="name" type="text" autoComplete="name" required maxLength={100} placeholder="Your name" /></label>
        <label><span>Work email</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label>
      </div>
      <label><span>Company <em>Optional</em></span><input name="company" type="text" autoComplete="organization" maxLength={160} placeholder="Company name" /></label>
      <label><span>How can we help?</span><textarea name="message" required minLength={10} maxLength={5000} rows={4} placeholder="Tell us what you’re working on" /></label>
      <div className="contact-honeypot" aria-hidden="true">
        <label>Leave this field empty<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>
      </fieldset>
      {siteKey ? <>
        <ContactSecurity key={challenge} siteKey={siteKey} onToken={setToken} onError={setSecurityError} />
        {securityError && <div className="contact-feedback" role="alert">
          <p>{securityError}</p>
          <button type="button" className="text-link" disabled={sending} onClick={() => {
            setToken(""); setSecurityError(""); setChallenge(value => value + 1);
          }}>Retry security check</button>
        </div>}
      </> : <p className="contact-note">Online messaging is not available yet. Please email us directly below.</p>}
      {error && <p className="contact-feedback" role="alert">{error}</p>}
      <button className="button button-dark" type="submit" disabled={sending || !siteKey || !token}>
        {sending ? "Sending…" : "Send message"} <ArrowRight size={17} aria-hidden="true" />
      </button>
      {siteKey && !token && !securityError && <p className="contact-note" role="status">Complete the security check to enable sending.</p>}
      <p className="contact-note">Prefer email? <a href="mailto:info@synciontech.com">info@synciontech.com</a></p>
      <noscript>Please enable JavaScript to use this form, or email info@synciontech.com.</noscript>
    </form>
  );
}
