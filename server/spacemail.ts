import nodemailer from "nodemailer";
import { connect, type TLSSocket } from "node:tls";
import type { ContactMessage } from "./contact";

const MAILBOX = "info@synciontech.com";

export function createSpacemailTransport(password?: string) {
  let socket: TLSSocket | undefined;
  const transport = nodemailer.createTransport({
    host: "mail.spacemail.com",
    port: 465,
    secure: true,
    ...(password ? { auth: { user: MAILBOX, pass: password } } : {}),
    tls: { servername: "mail.spacemail.com", minVersion: "TLSv1.2" },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    dnsTimeout: 5_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
    // Let Workers resolve the hostname during TLS connection establishment.
    // Nodemailer's separate DNS lookup can choose an address the runtime cannot reach.
    getSocket(_options, callback) {
      const connection = connect({ host: "mail.spacemail.com", port: 465, servername: "mail.spacemail.com" });
      socket = connection;
      let settled = false;
      const timer = setTimeout(() => connection.destroy(new Error("TLS connection timed out")), 10_000);
      connection.once("error", error => {
        clearTimeout(timer);
        if (!settled) { settled = true; callback(error); }
      });
      connection.once("secureConnect", () => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        callback(null, { connection, secured: true });
      });
    },
  });
  const close = transport.close.bind(transport);
  transport.close = () => { socket?.destroy(); close(); };
  return transport;
}

export function composeContactEmail(contact: ContactMessage) {
  return {
    from: { name: "Syncion Tech Website", address: MAILBOX },
    to: MAILBOX,
    replyTo: { name: contact.name, address: contact.email },
    subject: "New enquiry from the Syncion Tech website",
    text: [
      "New website enquiry", "",
      `Name: ${contact.name}`, `Email: ${contact.email}`,
      `Company: ${contact.company || "Not provided"}`, "",
      "Message:", contact.message,
    ].join("\n"),
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export async function sendContactEmail(contact: ContactMessage, password: string) {
  const transport = createSpacemailTransport(password);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      transport.sendMail(composeContactEmail(contact)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          transport.close();
          reject(new Error("SMTP deadline exceeded"));
        }, 25_000);
      }),
    ]);
    if (!result.accepted?.includes(MAILBOX)) throw new Error("Recipient not accepted");
  } finally {
    clearTimeout(timer);
    transport.close();
  }
}
