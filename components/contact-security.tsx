"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    action: string;
    size: "compact";
    theme: "light";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
    "timeout-callback": () => void;
  }) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window { turnstile?: Turnstile }
}

export function ContactSecurity({ siteKey, onToken, onError }: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const api = window.turnstile;
    const failed = () => {
      onToken("");
      onError("The security check couldn’t finish. Retry it below, or email us directly.");
    };
    let id: string;
    try {
      id = api.render(container.current, {
        sitekey: siteKey, action: "contact", size: "compact", theme: "light",
        callback: (token) => { onToken(token); onError(""); },
        "expired-callback": () => {
          onToken("");
          onError("The security check expired. Please complete it again.");
        },
        "error-callback": failed,
        "timeout-callback": failed,
      });
    } catch {
      failed();
      return;
    }
    return () => { api.remove(id); };
  }, [ready, siteKey, onToken, onError]);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => onError("The security check hasn’t loaded. Refresh the page or email us directly."), 15_000);
    return () => clearTimeout(timer);
  }, [ready, onError]);

  return <>
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      onReady={() => setReady(true)}
      onError={() => onError("The security check is blocked. Refresh the page or email us directly.")}
    />
    <div ref={container} className="contact-security" aria-label="Security verification" />
  </>;
}
